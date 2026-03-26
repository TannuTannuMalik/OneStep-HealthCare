import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/video/check/:appointmentId
 * Only the correct patient or correct doctor can join.
 * Only VIDEO + CONFIRMED appointments can join.
 * Join allowed only from 1 minute before start until appointment end.
 */
router.get("/check/:appointmentId", authRequired, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    let query;
    let params;

    if (role === "PATIENT") {
      query = `
        SELECT
          a.id,
          a.status,
          a.requestedStart,
          a.requestedEnd,
          a.appointmentType,
          u.fullName AS peerName
        FROM appointments a
        JOIN doctors d ON a.doctorId = d.id
        JOIN users u ON d.userId = u.id
        WHERE a.id = ? AND a.patientId = ?
      `;
      params = [appointmentId, userId];
    } else if (role === "DOCTOR") {
      query = `
        SELECT
          a.id,
          a.status,
          a.requestedStart,
          a.requestedEnd,
          a.appointmentType,
          u.fullName AS peerName
        FROM appointments a
        JOIN doctors d ON a.doctorId = d.id
        JOIN users u ON a.patientId = u.id
        WHERE a.id = ? AND d.userId = ?
      `;
      params = [appointmentId, userId];
    } else {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized role",
      });
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Appointment not found or access denied",
      });
    }

    const appt = rows[0];

    if (appt.appointmentType !== "VIDEO") {
      return res.status(403).json({
        ok: false,
        error: "This appointment is not a video consultation",
      });
    }

    if (appt.status !== "CONFIRMED") {
      return res.status(403).json({
        ok: false,
        error: `Video call is only available for CONFIRMED appointments. Current status: ${appt.status}`,
      });
    }

    const now = new Date();
    const start = new Date(appt.requestedStart);
    const end = new Date(appt.requestedEnd);
    const joinWindowStart = new Date(start.getTime() - 1 * 60 * 1000);

    if (now < joinWindowStart || now > end) {
      return res.status(403).json({
        ok: false,
        error: "Video call can only be joined from 1 minute before the appointment until it ends.",
      });
    }

    return res.json({
      ok: true,
      appointment: appt,
    });
  } catch (err) {
    console.error("GET /api/video/check error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/video/token/:appointmentId
 * Returns Agora channel name and App ID for the video call session.
 * Only the correct patient or doctor can get the token.
 */
router.get("/token/:appointmentId", authRequired, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    // ownership check
    let query;
    let params;

    if (role === "PATIENT") {
      query = `SELECT id FROM appointments WHERE id = ? AND patientId = ? LIMIT 1`;
      params = [appointmentId, userId];
    } else if (role === "DOCTOR") {
      query = `
        SELECT a.id FROM appointments a
        JOIN doctors d ON a.doctorId = d.id
        WHERE a.id = ? AND d.userId = ? LIMIT 1
      `;
      params = [appointmentId, userId];
    } else {
      return res.status(403).json({ ok: false, error: "Unauthorized role" });
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "Appointment not found or access denied",
      });
    }

    const channelName = `appointment-${appointmentId}`;
    const appId = process.env.AGORA_APP_ID;

    console.log(`[agora] channel=${channelName} userId=${userId} role=${role}`);

    return res.json({
      ok: true,
      channelName,
      appId,
    });
  } catch (err) {
    console.error("GET /api/video/token error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
