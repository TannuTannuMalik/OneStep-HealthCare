import express from "express";
import Stripe from "stripe";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CONSULTATION_FEE = 5000; // $50.00 NZD in cents

// ─── POST /api/payments/create-intent ────────────────────────────────────────
router.post("/create-intent", authRequired, async (req, res) => {
  try {
    const { doctorId, appointmentType } = req.body;
    const patientId = req.user.id;

    // get doctor info
    const [doctors] = await pool.query(
      `SELECT d.id, u.fullName, d.specialty
       FROM doctors d JOIN users u ON d.userId = u.id
       WHERE d.id = ?`,
      [doctorId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }

    const doctor = doctors[0];

    // create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: CONSULTATION_FEE,
      currency: "nzd",
      metadata: {
        patientId: String(patientId),
        doctorId: String(doctorId),
        appointmentType: appointmentType || "VIDEO",
        doctorName: doctor.fullName,
        specialty: doctor.specialty,
      },
      description: `OneStep Healthcare — Consultation with ${doctor.fullName} (${doctor.specialty})`,
    });

    return res.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: CONSULTATION_FEE,
      currency: "nzd",
      doctorName: doctor.fullName,
      specialty: doctor.specialty,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    console.error("POST /api/payments/create-intent error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── POST /api/payments/confirm ───────────────────────────────────────────────
router.post("/confirm", authRequired, async (req, res) => {
  try {
    const { paymentIntentId, appointmentData } = req.body;

    // verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        ok: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // create appointment after payment confirmed
    const {
      doctorId,
      requestedStart,
      requestedEnd,
      appointmentType,
      patientNote,
    } = appointmentData;

    const patientId = req.user.id;

   const [result] = await pool.query(
  `INSERT INTO appointments
    (patientId, doctorId, requestedStart, requestedEnd, appointmentType, patientNote, status, paymentStatus, stripePaymentId, consultationFee)
   VALUES (?, ?, ?, ?, ?, ?, 'REQUESTED', 'PAID', ?, ?)`,
  [
    patientId,
    doctorId,
    requestedStart,
    requestedEnd,
    appointmentType,
    patientNote || null,
    paymentIntentId,
    CONSULTATION_FEE / 100,
  ]
);

    // notify via socket
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${patientId}`).emit("appointment-booked", {
        appointmentId: result.insertId,
        message: "Appointment booked and payment confirmed!",
      });
    }

    return res.json({
      ok: true,
      appointmentId: result.insertId,
      message: "Payment confirmed and appointment booked!",
    });
  } catch (err) {
    console.error("POST /api/payments/confirm error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── GET /api/payments/status/:appointmentId ─────────────────────────────────
router.get("/status/:appointmentId", authRequired, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const [rows] = await pool.query(
      `SELECT paymentStatus, stripePaymentId, consultationFee
       FROM appointments WHERE id = ?`,
      [appointmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    return res.json({ ok: true, ...rows[0] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;