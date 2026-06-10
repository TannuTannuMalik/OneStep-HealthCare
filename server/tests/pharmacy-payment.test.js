/**
 * Sprint 7 — Integration Test Suite
 * OneStep HealthCare — Pharmacy Verification & Payment Flows
 *
 * 8 scenarios:
 *  1. Valid prescription — unaltered, not yet dispensed  → VALID returned
 *  2. Already-dispensed prescription                     → isDispensed: true
 *  3. Tampered prescription (SQL UPDATE bypass)          → hash mismatch detected
 *  4. Non-existent RX code (RX-2026-9999)               → 404 graceful error
 *  5. PATIENT attempts to dispense                       → 403 Forbidden
 *  6. DOCTOR attempts to dispense                        → 403 Forbidden
 *  7. Double dispense attempt                            → second call reverted by smart contract
 *  8. Stripe payment — test card 4242 4242 4242 4242     → PaymentIntent succeeded
 *
 * Run:  npm test
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import Stripe from "stripe";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env from server root regardless of CWD
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

import app from "../app.js";

// ── JWT helper ────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function makeToken(id, role) {
  return jwt.sign(
    { id, email: `test-${role.toLowerCase()}@test.com`, role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// ── Shared state set up once in beforeAll ────────────────────────────────────
let db = null;
let validReportId = null;
let dispensedReportId = null;
let pharmacistToken = null;
let patientToken = null;
let doctorToken = null;
let dbAvailable = false;
let originalPrescription = null;

beforeAll(async () => {
  try {
    db = await mysql.createConnection({
      host:     process.env.DB_HOST     || "localhost",
      user:     process.env.DB_USER     || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME     || "onestep",
      port:     Number(process.env.DB_PORT) || 3306,
    });

    await db.connect();
    dbAvailable = true;

    // ── Tokens ────────────────────────────────────────────────────────────
    const [[phRows]] = await db.execute(
      `SELECT id FROM users WHERE role = 'PHARMACIST' LIMIT 1`
    );
    if (phRows) pharmacistToken = makeToken(phRows.id, "PHARMACIST");

    const [[ptRow]] = await db.execute(
      `SELECT id FROM users WHERE role = 'PATIENT' LIMIT 1`
    );
    if (ptRow) patientToken = makeToken(ptRow.id, "PATIENT");

    const [[drRow]] = await db.execute(
      `SELECT id FROM users WHERE role = 'DOCTOR' LIMIT 1`
    );
    if (drRow) doctorToken = makeToken(drRow.id, "DOCTOR");

    // ── Prescription fixtures ─────────────────────────────────────────────
    const [reports] = await db.execute(
      `SELECT id FROM consultation_reports
       WHERE blockchainTx IS NOT NULL
       ORDER BY id DESC LIMIT 10`
    );

    if (reports.length > 0) {
      validReportId = reports[0].id;
      if (reports.length > 1) dispensedReportId = reports[1].id;

      // Save original prescription text for tamper test restore
      const [[rxRow]] = await db.execute(
        `SELECT prescription FROM consultation_reports WHERE id = ? LIMIT 1`,
        [validReportId]
      );
      if (rxRow) originalPrescription = rxRow.prescription;
    }

    console.log("\n  🗄️  DB connected");
    console.log(`  📋  validReportId   : ${validReportId ?? "none found"}`);
    console.log(`  📋  dispensedReport : ${dispensedReportId ?? "none found"}`);
    console.log(`  👤  pharmacistToken : ${pharmacistToken ? "✓" : "✗ (no PHARMACIST user)"}`);
    console.log(`  👤  patientToken    : ${patientToken    ? "✓" : "✗ (no PATIENT user)"}`);
    console.log(`  👤  doctorToken     : ${doctorToken     ? "✓" : "✗ (no DOCTOR user)"}\n`);

  } catch (err) {
    console.warn(`\n  ⚠️  DB unavailable — DB-dependent scenarios will be skipped\n  ${err.message}\n`);
  }
});

afterAll(async () => {
  // Restore prescription if it was tampered during scenario 3
  if (db && originalPrescription !== null && validReportId !== null) {
    try {
      await db.execute(
        `UPDATE consultation_reports SET prescription = ? WHERE id = ?`,
        [originalPrescription, validReportId]
      );
      console.log(`\n  🔄  Restored original prescription for report #${validReportId}`);
    } catch (e) {
      console.warn(`  ⚠️  Could not restore prescription: ${e.message}`);
    }
  }
  if (db) await db.end().catch(() => {});
});

// ── Skip helper ───────────────────────────────────────────────────────────────
function skipIf(condition, reason) {
  if (condition) {
    console.warn(`  ⏭️  Skipped — ${reason}`);
    return true;
  }
  return false;
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — Valid prescription: unaltered, not yet dispensed
// ═════════════════════════════════════════════════════════════════════════════
describe("Scenario 1 — Valid prescription (unaltered, not yet dispensed)", () => {
  it("GET /api/pharmacy/prescription/:id → ok:true, isValid:true, isDispensed:false", async () => {
    if (skipIf(!validReportId, "no blockchain report in DB")) return;

    const res = await request(app)
      .get(`/api/pharmacy/prescription/${validReportId}`)
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.blockchain).toBeDefined();
    expect(res.body.blockchain.isValid).toBe(true);
    expect(res.body.blockchain.isDispensed).toBe(false);
    expect(res.body.patientName).toBeTruthy();
    expect(res.body.doctorName).toBeTruthy();

    console.log(`  ✅  RX-2026-${validReportId} — Valid | Hash: 0x${res.body.blockchain.prescriptionHash?.slice(0, 12)}…`);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO 2 — Already-dispensed prescription
// ═════════════════════════════════════════════════════════════════════════════
describe("Scenario 2 — Already-dispensed prescription", () => {
  it("GET /api/pharmacy/prescription/:id → isDispensed:true", async () => {
    if (skipIf(!dispensedReportId, "no second blockchain report in DB")) return;

    const res = await request(app)
      .get(`/api/pharmacy/prescription/${dispensedReportId}`)
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.blockchain.isDispensed).toBe(true);

    console.log(`  ✅  RX-2026-${dispensedReportId} — isDispensed: true confirmed`);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO 3 — Tampered prescription (SQL UPDATE bypass)
// Directly mutates MySQL prescription text, bypassing application layer.
// The on-chain hash must detect the mismatch → isValid: false.
// ═════════════════════════════════════════════════════════════════════════════
describe("Scenario 3 — Tampered prescription (hash mismatch detection)", () => {
  it("SQL UPDATE bypass → blockchain detects tamper → isValid:false", async () => {
    if (skipIf(!db || !validReportId, "DB unavailable or no report")) return;

    // Tamper directly in MySQL — simulates a database-level attack
    await db.execute(
      `UPDATE consultation_reports
       SET prescription = 'TAMPERED: Oxycodone 80mg take 10 tablets daily'
       WHERE id = ?`,
      [validReportId]
    );

    const res = await request(app)
      .get(`/api/pharmacy/prescription/${validReportId}`)
      .expect(200);

    // On-chain hash was computed from original text — tampered text won't match
    expect(res.body.ok).toBe(true);
    expect(res.body.blockchain.isValid).toBe(false);

    console.log(`  ✅  Tamper detected — blockchain.isValid: false (hash mismatch confirmed)`);

    // Restore immediately (afterAll also restores as safety net)
    await db.execute(
      `UPDATE consultation_reports SET prescription = ? WHERE id = ?`,
      [originalPrescription, validReportId]
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO 4 — Non-existent RX code
// No DB needed — the endpoint itself handles the 404.
// ═════════════════════════════════════════════════════════════════════════════
describe("Scenario 4 — Non-existent prescription (RX-2026-9999)", () => {
  it("GET /api/pharmacy/prescription/9999 → 404 with graceful error", async () => {
    const res = await request(app)
      .get("/api/pharmacy/prescription/9999")
      .expect(404);

    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBeTruthy();

    console.log(`  ✅  RX-2026-9999 → 404: "${res.body.error}"`);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO 5 — PATIENT attempts to dispense
// ═════════════════════════════════════════════════════════════════════════════
describe("Scenario 5 — PATIENT role blocked from dispensing", () => {
  it("POST /api/pharmacy/dispense/:id with PATIENT JWT → 403 Forbidden", async () => {
    // Use a real token if available, otherwise forge one for role-guard test
    const token = patientToken || makeToken(99991, "PATIENT");

    const res = await request(app)
      .post(`/api/pharmacy/dispense/${validReportId || 1}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/forbidden/i);

    console.log(`  ✅  PATIENT → 403: "${res.body.error}"`);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO 6 — DOCTOR attempts to dispense
// ═════════════════════════════════════════════════════════════════════════════
describe("Scenario 6 — DOCTOR role blocked from dispensing", () => {
  it("POST /api/pharmacy/dispense/:id with DOCTOR JWT → 403 Forbidden", async () => {
    const token = doctorToken || makeToken(99992, "DOCTOR");

    const res = await request(app)
      .post(`/api/pharmacy/dispense/${validReportId || 1}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/forbidden/i);

    console.log(`  ✅  DOCTOR → 403: "${res.body.error}"`);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO 7 — Double dispense attempt
// First call succeeds; second is reverted by smart contract require(!isDispensed).
// Set SKIP_DISPENSE_TEST=true to skip (saves Sepolia gas).
// ═════════════════════════════════════════════════════════════════════════════
describe("Scenario 7 — Double dispense reverted by smart contract", () => {
  it("First dispense succeeds; second call → 400 (smart contract revert)", async () => {
    if (skipIf(process.env.SKIP_DISPENSE_TEST === "true", "SKIP_DISPENSE_TEST=true")) return;
    if (skipIf(!db || !pharmacistToken, "DB unavailable or no PHARMACIST user")) return;

    // Find a report that is valid + not yet dispensed
    const [rows] = await db.execute(
      `SELECT id FROM consultation_reports WHERE blockchainTx IS NOT NULL ORDER BY id DESC LIMIT 20`
    );

    let targetId = null;
    for (const row of rows) {
      const check = await request(app).get(`/api/pharmacy/prescription/${row.id}`);
      if (check.body?.blockchain?.isValid && !check.body?.blockchain?.isDispensed) {
        targetId = row.id;
        break;
      }
    }

    if (skipIf(!targetId, "no undispensed prescription available")) return;

    // First dispense — should succeed
    const first = await request(app)
      .post(`/api/pharmacy/dispense/${targetId}`)
      .set("Authorization", `Bearer ${pharmacistToken}`)
      .expect(200);

    expect(first.body.ok).toBe(true);
    expect(first.body.txHash).toBeTruthy();
    console.log(`  ✅  First dispense: TX ${first.body.txHash.slice(0, 16)}…`);

    // Second dispense — smart contract require(!isDispensed) reverts
    const second = await request(app)
      .post(`/api/pharmacy/dispense/${targetId}`)
      .set("Authorization", `Bearer ${pharmacistToken}`)
      .expect(400);

    expect(second.body.ok).toBe(false);
    console.log(`  ✅  Second dispense blocked: "${second.body.error}"`);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SCENARIO 8 — Stripe payment: test card 4242 4242 4242 4242
// Creates PaymentIntent via API, confirms with pm_card_visa (Stripe test fixture).
// ═════════════════════════════════════════════════════════════════════════════
describe("Scenario 8 — Stripe payment with test card 4242 4242 4242 4242", () => {
  it("Create PaymentIntent → confirm with test card → status: succeeded", async () => {
    if (skipIf(!process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY not set")) return;
    if (skipIf(!patientToken, "no PATIENT user in DB")) return;

    // Get any doctor
    let testDoctorId = 1;
    if (db) {
      const [[doc]] = await db.execute(`SELECT id FROM doctors LIMIT 1`);
      if (doc) testDoctorId = doc.id;
    }

    // Step 1 — Create PaymentIntent
    const intentRes = await request(app)
      .post("/api/payments/create-intent")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ doctorId: testDoctorId, appointmentType: "VIDEO" })
      .expect(200);

    expect(intentRes.body.ok).toBe(true);
    expect(intentRes.body.clientSecret).toBeTruthy();
    expect(intentRes.body.paymentIntentId).toBeTruthy();

    const { paymentIntentId } = intentRes.body;
    console.log(`  ✅  PaymentIntent created: ${paymentIntentId}`);

    // Step 2 — Confirm server-side with pm_card_visa (4242 4242 4242 4242)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",
    });

    expect(confirmed.status).toBe("succeeded");
    expect(confirmed.amount).toBe(5000);
    expect(confirmed.currency).toBe("nzd");

    console.log(
      `  ✅  PaymentIntent ${paymentIntentId} — status: ${confirmed.status} | $${confirmed.amount / 100} NZD`
    );
  });
});
