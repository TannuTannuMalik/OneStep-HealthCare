import express from "express";
import { pool } from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * ✅ PATIENT: Get my appointments
 * GET /api/appointments/patient/me
 */
router.get(
  "/patient/me",
  authRequired,
  requireRole("PATIENT"),
  async (req, res) => {
    try {
      const patientId = req.user.id;

      const [rows] = await pool.query(
        `
        SELECT 
          a.id,

          -- ✅ use real DB fields
          a.requestedStart,
          a.requestedEnd,

          -- ✅ keep your existing fields
          a.appointmentType,
          a.status,

          -- ✅ your table currently has patientNote (not reason)
          a.patientNote,

          a.createdAt,

          d.id AS doctorId,
          d.specialty,
          d.experienceYears,
          d.rating,

          u.fullName AS doctorName

        FROM appointments a
        JOIN doctors d ON a.doctorId = d.id
        JOIN users u ON d.userId = u.id
        WHERE a.patientId = ?
        ORDER BY a.requestedStart DESC
        `,
        [patientId]
      );

      // ✅ keep old "reason" key for compatibility (if frontend expects it)
      const data = rows.map((r) => ({
        ...r,
        reason: r.patientNote, // alias
      }));

      return res.json({ ok: true, data });
    } catch (err) {
      console.error("GET /api/appointments/patient/me error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);

/**
 * ✅ DOCTOR: Get appointments booked with me
 * GET /api/appointments/doctor/me
 */
router.get(
  "/doctor/me",
  authRequired,
  requireRole("DOCTOR"),
  async (req, res) => {
    try {
      const userId = req.user.id; // doctor is logged in (users.id)

      // 1) Find the doctor's profile row using userId
      const [docRows] = await pool.query(
        "SELECT id FROM doctors WHERE userId = ? LIMIT 1",
        [userId]
      );

      if (docRows.length === 0) {
        return res
          .status(404)
          .json({ ok: false, error: "Doctor profile not found" });
      }

      const doctorProfileId = docRows[0].id; // this is doctors.id

      // 2) Fetch appointments that match this doctor profile id
      // join patient info from users table
      const [rows] = await pool.query(
        `
        SELECT
          a.id,

          -- ✅ use real DB fields
          a.requestedStart,
          a.requestedEnd,

          -- ✅ keep your existing fields
          a.appointmentType,
          a.status,

          -- ✅ your table currently has patientNote (not reason)
          a.patientNote,

          a.createdAt,

          u.id AS patientId,
          u.fullName AS patientName,
          u.email AS patientEmail

        FROM appointments a
        JOIN users u ON a.patientId = u.id
        WHERE a.doctorId = ?
        ORDER BY a.requestedStart DESC
        `,
        [doctorProfileId]
      );

      // ✅ keep old "reason" key for compatibility (if frontend expects it)
      const data = rows.map((r) => ({
        ...r,
        reason: r.patientNote, // alias
      }));

      return res.json({ ok: true, data });
    } catch (err) {
      console.error("GET /api/appointments/doctor/me error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);
/**
 * ✅ PATIENT: Book an appointment
 * POST /api/appointments
 * Body: { doctorId, requestedStart, requestedEnd, appointmentType, patientNote }
 */
router.post(
  "/",
  authRequired,
  requireRole("PATIENT"),
  async (req, res) => {
    try {
      const patientId = req.user.id;

      const {
        doctorId,
        requestedStart,
        requestedEnd,
        appointmentType,
        patientNote,
      } = req.body;

      if (!doctorId || !requestedStart || !requestedEnd) {
        return res.status(400).json({
          ok: false,
          error: "doctorId, requestedStart, requestedEnd are required",
        });
      }

      const type = appointmentType || "VIDEO";

      // status will default to REQUESTED (from your table definition)
      const [result] = await pool.query(
        `
        INSERT INTO appointments 
          (doctorId, patientId, appointmentType, requestedStart, requestedEnd, patientNote)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [doctorId, patientId, type, requestedStart, requestedEnd, patientNote || null]
      );

      return res.json({ ok: true, id: result.insertId });
    } catch (err) {
      console.error("POST /api/appointments error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);
/**
 * ✅ DOCTOR: Update appointment status
 * PATCH /api/appointments/:id/status
 */
router.patch(
  "/:id/status",
  authRequired,
  requireRole("DOCTOR"),
  async (req, res) => {
    try {
      const appointmentId = req.params.id;
      const { status } = req.body;

      const allowed = ["CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }

      // find doctor profile id from logged-in doctor userId
      const [docRows] = await pool.query(
        "SELECT id FROM doctors WHERE userId = ? LIMIT 1",
        [req.user.id]
      );

      if (docRows.length === 0) {
        return res.status(404).json({ ok: false, error: "Doctor profile not found" });
      }

      const doctorProfileId = docRows[0].id;

      // update only if appointment belongs to this doctor
      const [result] = await pool.query(
        "UPDATE appointments SET status = ? WHERE id = ? AND doctorId = ?",
        [status, appointmentId, doctorProfileId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          ok: false,
          error: "Appointment not found or not yours",
        });
      }

      return res.json({ ok: true, message: "Status updated" });
    } catch (err) {
      console.error("PATCH /api/appointments/:id/status error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);
export default router;