// server/routes/reports.js
import express from "express";
import { pool } from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { sha256Hex } from "../utils/hash.js";
import { generateConsultationPDF } from "../services/pdfReport.js";
import cloudinary from "../utils/cloudinary.js";
import { ethers } from "ethers";

const router = express.Router();

// ─── Blockchain Setup ────────────────────────────────────────────────
const BLOCKCHAIN_ABI = [
  "function storeProof(uint256 reportId, bytes32 pdfHash) public",
  "function verify(uint256 reportId) public view returns (bytes32, uint256)"
];

function logBlockchainEvent(type, data) {
  const timestamp = new Date().toISOString();
  const separator = "═".repeat(60);

  if (type === "STORE") {
    console.log(`\n${separator}`);
    console.log(`⛓️  BLOCKCHAIN EVENT — PROOF STORED`);
    console.log(`${separator}`);
    console.log(`📋 Report ID     : #${data.reportId}`);
    console.log(`👤 Patient ID    : ${data.patientId}`);
    console.log(`🏥 Doctor ID     : ${data.doctorId}`);
    console.log(`🔐 PDF Hash      : ${data.pdfHash}`);
    console.log(`📝 TX Hash       : ${data.txHash}`);
    console.log(`🕐 Timestamp     : ${timestamp}`);
    console.log(`✅ Status        : CONFIRMED ON CHAIN`);
    console.log(`${separator}\n`);
  }

  if (type === "VERIFY_PASS") {
    console.log(`\n${separator}`);
    console.log(`🔍 BLOCKCHAIN EVENT — INTEGRITY VERIFIED`);
    console.log(`${separator}`);
    console.log(`📋 Report ID     : #${data.reportId}`);
    console.log(`🔐 Current Hash  : ${data.currentHash}`);
    console.log(`🔐 Stored Hash   : ${data.storedHash}`);
    console.log(`🗄️  DB Match      : ✅ PASS`);
    console.log(`⛓️  Chain Match   : ✅ PASS`);
    console.log(`🕐 Verified At   : ${timestamp}`);
    console.log(`✅ Status        : AUTHENTIC — NOT TAMPERED`);
    console.log(`${separator}\n`);
  }

  if (type === "VERIFY_FAIL") {
    console.log(`\n${separator}`);
    console.log(`🚨 BLOCKCHAIN EVENT — TAMPERING DETECTED`);
    console.log(`${separator}`);
    console.log(`📋 Report ID     : #${data.reportId}`);
    console.log(`🔐 Current Hash  : ${data.currentHash}`);
    console.log(`🔐 Stored Hash   : ${data.storedHash}`);
    console.log(`🗄️  DB Match      : ${data.dbMatch ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`⛓️  Chain Match   : ${data.chainMatch ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`🕐 Verified At   : ${timestamp}`);
    console.log(`❌ Status        : TAMPERED — INTEGRITY COMPROMISED`);
    console.log(`${separator}\n`);
  }
}

async function storeProofOnChain(reportId, pdfHashHex, patientId, doctorId) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
      BLOCKCHAIN_ABI,
      wallet
    );

    const bytes32Hash = "0x" + pdfHashHex.padStart(64, "0");
    const tx = await contract.storeProof(reportId, bytes32Hash);
    await tx.wait();

    logBlockchainEvent("STORE", {
      reportId,
      patientId,
      doctorId,
      pdfHash: pdfHashHex,
      txHash: tx.hash,
    });

    return tx.hash;
  } catch (err) {
    console.error("⚠️ Blockchain storeProof failed (non-fatal):", err.message);
    return null;
  }
}

// ─── Helper: Upload PDF buffer to Cloudinary ─────────────────────────
async function uploadPDFBuffer(pdfBuffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "reports",
        resource_type: "raw",
        public_id: filename,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(pdfBuffer);
  });
}

/**
 * ✅ DOCTOR: Create report (only when appointment COMPLETED)
 * POST /api/reports
 */
router.post("/", authRequired, requireRole("DOCTOR"), async (req, res) => {
  try {
    const {
      appointmentId,
      diagnosis,
      prescription,
      doctorNotes,
      improvementSuggestions,
      followUpDate,
    } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ ok: false, error: "appointmentId is required" });
    }

    const [docRows] = await pool.query("SELECT id FROM doctors WHERE userId = ? LIMIT 1", [
      req.user.id,
    ]);
    if (docRows.length === 0) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }
    const doctorProfileId = docRows[0].id;

    const [apptRows] = await pool.query(
      `
      SELECT 
        a.id, a.status, a.doctorId, a.patientId,
        pu.fullName AS patientName,
        du.fullName AS doctorName
      FROM appointments a
      JOIN users pu ON a.patientId = pu.id
      JOIN doctors d ON a.doctorId = d.id
      JOIN users du ON d.userId = du.id
      WHERE a.id = ? AND a.doctorId = ?
      LIMIT 1
      `,
      [appointmentId, doctorProfileId]
    );

    if (apptRows.length === 0) {
      return res.status(404).json({ ok: false, error: "Appointment not found or not yours" });
    }

    const appt = apptRows[0];

    if (appt.status !== "COMPLETED") {
      return res.status(400).json({
        ok: false,
        error: "Report can be created only when appointment is COMPLETED",
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM consultation_reports WHERE appointmentId = ? LIMIT 1",
      [appointmentId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: "Report already exists for this appointment" });
    }

    const followUp = followUpDate ? new Date(followUpDate) : null;
    const followUpSql = followUp && !isNaN(followUp.getTime()) ? followUp : null;

    const [ins] = await pool.query(
      `
      INSERT INTO consultation_reports
        (appointmentId, doctorId, patientId, diagnosis, prescription, doctorNotes, improvementSuggestions, followUpDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        appointmentId,
        doctorProfileId,
        appt.patientId,
        diagnosis || null,
        prescription || null,
        doctorNotes || null,
        improvementSuggestions || null,
        followUpSql,
      ]
    );

    const reportId = ins.insertId;

    const createdAtISO = new Date().toISOString();
    const pdfBuffer = await generateConsultationPDF({
      reportId,
      appointmentId,
      doctorName: appt.doctorName,
      patientName: appt.patientName,
      diagnosis: diagnosis || "",
      prescription: prescription || "",
      doctorNotes: doctorNotes || "",
      improvementSuggestions: improvementSuggestions || "",
      createdAt: createdAtISO,
    });

    const pdfHash = sha256Hex(pdfBuffer);
    const hashTimestamp = new Date();

    const pdfUrl = await uploadPDFBuffer(pdfBuffer, `report_${reportId}_appt_${appointmentId}`);

    const blockchainTx = await storeProofOnChain(reportId, pdfHash, appt.patientId, doctorProfileId);

    await pool.query(
      `
      UPDATE consultation_reports
      SET pdfUrl = ?, pdfHash = ?, hashTimestamp = ?, blockchainTx = ?
      WHERE id = ?
      `,
      [pdfUrl, pdfHash, hashTimestamp, blockchainTx, reportId]
    );

    if (req.io) {
      req.io.to(`user:${appt.patientId}`).emit("report_ready", {
        appointmentId,
        reportId,
      });
    }

    return res.json({
      ok: true,
      data: {
        reportId,
        appointmentId,
        pdfUrl,
        pdfHash,
        hashTimestamp,
        blockchainTx: blockchainTx || null,
      },
    });
  } catch (err) {
    console.error("POST /api/reports error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * ✅ PATIENT: list my reports
 * GET /api/reports/patient/me
 */
router.get("/patient/me", authRequired, requireRole("PATIENT"), async (req, res) => {
  try {
    const patientId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT
        r.id,
        r.appointmentId,
        r.diagnosis,
        r.prescription,
        r.doctorNotes,
        r.improvementSuggestions,
        r.followUpDate,
        r.pdfUrl,
        r.pdfHash,
        r.hashTimestamp,
        r.blockchainTx,
        r.createdAt,
        d.id AS doctorId,
        du.fullName AS doctorName,
        d.specialty
      FROM consultation_reports r
      JOIN doctors d ON r.doctorId = d.id
      JOIN users du ON d.userId = du.id
      WHERE r.patientId = ?
      ORDER BY r.createdAt DESC
      `,
      [patientId]
    );

    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("GET /api/reports/patient/me error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * ✅ DOCTOR: list reports created by me
 * GET /api/reports/doctor/me
 */
router.get("/doctor/me", authRequired, requireRole("DOCTOR"), async (req, res) => {
  try {
    const [docRows] = await pool.query("SELECT id FROM doctors WHERE userId = ? LIMIT 1", [
      req.user.id,
    ]);
    if (docRows.length === 0) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }
    const doctorProfileId = docRows[0].id;

    const [rows] = await pool.query(
      `
      SELECT
        r.id,
        r.appointmentId,
        r.patientId,
        pu.fullName AS patientName,
        r.diagnosis,
        r.pdfUrl,
        r.blockchainTx,
        r.createdAt
      FROM consultation_reports r
      JOIN users pu ON r.patientId = pu.id
      WHERE r.doctorId = ?
      ORDER BY r.createdAt DESC
      `,
      [doctorProfileId]
    );

    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("GET /api/reports/doctor/me error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * ✅ VERIFY: Check if PDF has been tampered
 * GET /api/reports/:id/verify
 */
router.get("/:id/verify", authRequired, async (req, res) => {
  try {
    const reportId = req.params.id;

    const [rows] = await pool.query(
      `SELECT pdfUrl, pdfHash, blockchainTx, patientId, doctorId 
       FROM consultation_reports WHERE id = ? LIMIT 1`,
      [reportId]
    );

    if (rows.length === 0)
      return res.status(404).json({ ok: false, error: "Report not found" });

    const { pdfUrl, pdfHash, blockchainTx, patientId, doctorId } = rows[0];

    // ─── OWNERSHIP CHECK ──────────────────────────────────
    if (req.user.role === "PATIENT") {
      if (patientId !== req.user.id)
        return res.status(403).json({ ok: false, error: "Access denied — not your report" });
    } else if (req.user.role === "DOCTOR") {
      const [docRows] = await pool.query(
        "SELECT id FROM doctors WHERE userId = ? LIMIT 1", [req.user.id]
      );
      if (docRows.length === 0 || docRows[0].id !== doctorId)
        return res.status(403).json({ ok: false, error: "Access denied — not your report" });
    } else {
      return res.status(403).json({ ok: false, error: "Access denied" });
    }
    // ──────────────────────────────────────────────────────

    if (!pdfUrl)
      return res.status(400).json({ ok: false, error: "PDF not uploaded yet" });
    if (!blockchainTx)
      return res.status(400).json({ ok: false, error: "Not stored on blockchain yet" });

    // fetch PDF from Cloudinary and rehash
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const currentHash = sha256Hex(pdfBuffer);

    // get hash from blockchain
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const contract = new ethers.Contract(
      process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
      BLOCKCHAIN_ABI,
      provider
    );
    const [blockchainHash] = await contract.verify(reportId);
    const blockchainHashClean = blockchainHash.replace("0x", "").padStart(64, "0");

    const dbMatch = currentHash === pdfHash;
    const chainMatch = currentHash === blockchainHashClean;
    const tampered = !dbMatch || !chainMatch;

    logBlockchainEvent(tampered ? "VERIFY_FAIL" : "VERIFY_PASS", {
      reportId,
      currentHash,
      storedHash: pdfHash,
      dbMatch,
      chainMatch,
    });

    return res.json({
      ok: true,
      data: {
        reportId,
        tampered,
        dbMatch,
        chainMatch,
        currentHash,
        storedHash: pdfHash,
        blockchainHash: blockchainHashClean,
        blockchainTx,
      },
    });
  } catch (e) {
    console.error("verify error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * ✅ DOWNLOAD
 * GET /api/reports/:id/download
 */
router.get("/:id/download", authRequired, async (req, res) => {
  try {
    const reportId = req.params.id;

    const [rows] = await pool.query(
      `SELECT r.id, r.patientId, r.doctorId, r.pdfUrl FROM consultation_reports r WHERE r.id = ? LIMIT 1`,
      [reportId]
    );

    if (rows.length === 0)
      return res.status(404).json({ ok: false, error: "Report not found" });

    const rpt = rows[0];

    if (req.user.role === "PATIENT") {
      if (rpt.patientId !== req.user.id)
        return res.status(403).json({ ok: false, error: "Forbidden" });
    } else if (req.user.role === "DOCTOR") {
      const [docRows] = await pool.query("SELECT id FROM doctors WHERE userId = ? LIMIT 1", [req.user.id]);
      if (docRows.length === 0) return res.status(403).json({ ok: false, error: "Forbidden" });
      if (rpt.doctorId !== docRows[0].id) return res.status(403).json({ ok: false, error: "Forbidden" });
    } else {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    if (!rpt.pdfUrl)
      return res.status(400).json({ ok: false, error: "PDF not uploaded yet" });

    const response = await fetch(rpt.pdfUrl);
    if (!response.ok)
      return res.status(502).json({ ok: false, error: "Failed to fetch PDF from storage" });

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report_${reportId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (e) {
    console.error("download report error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;