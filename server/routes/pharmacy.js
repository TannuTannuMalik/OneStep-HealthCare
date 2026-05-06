import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { ethers } from "ethers";

const router = express.Router();

// ─── Blockchain Setup ─────────────────────────────────────────────────────────
const BLOCKCHAIN_ABI = [
  "function storeProof(uint256 reportId, bytes32 pdfHash) public",
  "function verify(uint256 reportId) public view returns (bytes32, uint256)",
  "function storePrescription(uint256 reportId, bytes32 prescriptionHash) public",
  "function verifyPrescription(uint256 reportId) public view returns (bytes32, uint256, bool, bool, uint256)",
  "function invalidatePrescription(uint256 reportId) public",
  "function dispense(uint256 reportId) public",
];

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
}

function getContract(withSigner = false) {
  const provider = getProvider();
  if (withSigner) {
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
    return new ethers.Contract(process.env.BLOCKCHAIN_CONTRACT_ADDRESS, BLOCKCHAIN_ABI, wallet);
  }
  return new ethers.Contract(process.env.BLOCKCHAIN_CONTRACT_ADDRESS, BLOCKCHAIN_ABI, provider);
}

function logPharmacyEvent(type, data) {
  const separator = "═".repeat(60);
  const timestamp = new Date().toISOString();

  if (type === "VERIFY") {
    console.log(`\n${separator}`);
    console.log(`💊 PHARMACY EVENT — PRESCRIPTION VERIFIED`);
    console.log(`${separator}`);
    console.log(`📋 Report ID     : #${data.reportId}`);
    console.log(`🔐 Hash          : ${data.prescriptionHash}`);
    console.log(`✅ Valid         : ${data.isValid}`);
    console.log(`💊 Dispensed     : ${data.isDispensed}`);
    console.log(`🕐 Verified At   : ${timestamp}`);
    console.log(`${separator}\n`);
  }

  if (type === "DISPENSE") {
    console.log(`\n${separator}`);
    console.log(`✅ PHARMACY EVENT — PRESCRIPTION DISPENSED`);
    console.log(`${separator}`);
    console.log(`📋 Report ID     : #${data.reportId}`);
    console.log(`📝 TX Hash       : ${data.txHash}`);
    console.log(`🕐 Dispensed At  : ${timestamp}`);
    console.log(`✅ Status        : CONFIRMED ON CHAIN`);
    console.log(`${separator}\n`);
  }
}

// ─── GET /api/pharmacy/prescription/:reportId ─────────────────────────────────
// Verify prescription on blockchain — public, no auth needed for pharmacy staff
router.get("/prescription/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;

    // get report from DB to show patient and doctor info
    const [rows] = await pool.query(
      `SELECT
        r.id,
        r.prescription,
        r.diagnosis,
        r.createdAt,
        r.blockchainTx,
        pu.fullName AS patientName,
        du.fullName AS doctorName,
        d.specialty
      FROM consultation_reports r
      JOIN users pu ON r.patientId = pu.id
      JOIN doctors d ON r.doctorId = d.id
      JOIN users du ON d.userId = du.id
      WHERE r.id = ?
      LIMIT 1`,
      [reportId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Report not found",
      });
    }

    const report = rows[0];

    // verify prescription on blockchain
    const contract = getContract(false);
    const [prescriptionHash, timestamp, isValid, isDispensed, dispensedAt] =
      await contract.verifyPrescription(reportId);

    const prescriptionHashClean = prescriptionHash.replace("0x", "").padStart(64, "0");
    const notFound = prescriptionHashClean === "0".repeat(64);

    if (notFound) {
      return res.status(404).json({
        ok: false,
        error: "No prescription found on blockchain for this report",
      });
    }

    logPharmacyEvent("VERIFY", {
      reportId,
      prescriptionHash: prescriptionHashClean,
      isValid,
      isDispensed,
    });

    return res.json({
      ok: true,
      reportId: Number(reportId),
      patientName: report.patientName,
      doctorName: report.doctorName,
      specialty: report.specialty,
      diagnosis: report.diagnosis,
      prescriptionText: report.prescription,
      createdAt: report.createdAt,
      blockchain: {
        prescriptionHash: prescriptionHashClean,
        timestamp: Number(timestamp),
        isValid,
        isDispensed,
        dispensedAt: Number(dispensedAt),
      },
    });
  } catch (err) {
    console.error("GET /api/pharmacy/prescription error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/pharmacy/dispense/:reportId ────────────────────────────────────
// Mark prescription as dispensed on blockchain
router.post("/dispense/:reportId", authRequired, async (req, res) => {
  try {
    const { reportId } = req.params;

    // first check current state on blockchain
    const contract = getContract(false);
    const [, , isValid, isDispensed] = await contract.verifyPrescription(reportId);

    if (!isValid) {
      return res.status(400).json({
        ok: false,
        error: "Prescription is invalid and cannot be dispensed",
      });
    }

    if (isDispensed) {
      return res.status(400).json({
        ok: false,
        error: "Prescription has already been dispensed",
      });
    }

    // call dispense() on blockchain
    const contractWithSigner = getContract(true);
    const tx = await contractWithSigner.dispense(reportId);
    await tx.wait();

    logPharmacyEvent("DISPENSE", {
      reportId,
      txHash: tx.hash,
    });

    return res.json({
      ok: true,
      message: "Prescription dispensed successfully on blockchain",
      reportId: Number(reportId),
      txHash: tx.hash,
      dispensedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("POST /api/pharmacy/dispense error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── GET /api/pharmacy/history ────────────────────────────────────────────────
// Get all dispensed prescriptions from DB + blockchain status
router.get("/history", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        r.id,
        r.diagnosis,
        r.prescription,
        r.createdAt,
        r.blockchainTx,
        pu.fullName AS patientName,
        du.fullName AS doctorName,
        d.specialty
      FROM consultation_reports r
      JOIN users pu ON r.patientId = pu.id
      JOIN doctors d ON r.doctorId = d.id
      JOIN users du ON d.userId = du.id
      WHERE r.blockchainTx IS NOT NULL
      ORDER BY r.createdAt DESC`
    );

    // check blockchain status for each report
    const contract = getContract(false);
    const results = await Promise.all(
      rows.map(async (row) => {
        try {
          const [, , isValid, isDispensed, dispensedAt] =
            await contract.verifyPrescription(row.id);
          return {
            ...row,
            blockchain: {
              isValid,
              isDispensed,
              dispensedAt: Number(dispensedAt),
            },
          };
        } catch {
          return { ...row, blockchain: null };
        }
      })
    );

    const dispensed = results.filter((r) => r.blockchain?.isDispensed);

    return res.json({
      ok: true,
      total: dispensed.length,
      data: dispensed,
    });
  } catch (err) {
    console.error("GET /api/pharmacy/history error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;