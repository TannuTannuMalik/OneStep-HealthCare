import express from "express";
import { pool } from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * ✅ GET /api/doctors
 * Public: list marketplace doctors (optionally search with ?q=)
 */
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;

    let sql = `
      SELECT 
        d.id,
        d.specialty,
        d.experienceYears,
        d.rating,
        d.bio,
        d.location,
        d.photoUrl,
        u.fullName
      FROM doctors d
      JOIN users u ON u.id = d.userId
      WHERE u.role = 'DOCTOR'
    `;
    const params = [];

    if (q) {
      sql += ` AND (u.fullName LIKE ? OR d.specialty LIKE ? OR d.location LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY d.rating DESC, d.experienceYears DESC`;

    const [rows] = await pool.query(sql, params);

    // MVP demo field
    const doctors = rows.map((d) => ({
      ...d,
      availableToday: Math.random() > 0.3,
    }));

    return res.json({ ok: true, doctors });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * ✅ GET /api/doctors/me
 * Doctor only: get my doctor profile row
 */
router.get("/me", authRequired, requireRole("DOCTOR"), async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      "SELECT * FROM doctors WHERE userId = ? LIMIT 1",
      [userId]
    );

    return res.json({ ok: true, doctor: rows[0] || null });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * ✅ POST /api/doctors/me
 * Doctor only: create profile if missing, otherwise update
 */
router.post("/me", authRequired, requireRole("DOCTOR"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { specialty, experienceYears, bio, location, photoUrl } = req.body;

    // Check if profile exists
    const [docRows] = await pool.query(
      "SELECT id FROM doctors WHERE userId = ? LIMIT 1",
      [userId]
    );

    const exp = Number.isFinite(Number(experienceYears))
      ? Number(experienceYears)
      : 0;

    if (docRows.length === 0) {
      // Create
      const [created] = await pool.query(
        `
        INSERT INTO doctors (userId, specialty, experienceYears, bio, location, photoUrl)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          specialty || null,
          exp,
          bio || null,
          location || null,
          photoUrl || null,
        ]
      );

      return res.json({ ok: true, doctorId: created.insertId, created: true });
    }

    // Update
    const doctorId = docRows[0].id;

    await pool.query(
      `
      UPDATE doctors
      SET specialty = ?, experienceYears = ?, bio = ?, location = ?, photoUrl = ?
      WHERE id = ?
      `,
      [specialty || null, exp, bio || null, location || null, photoUrl || null, doctorId]
    );

    return res.json({ ok: true, doctorId, updated: true });
  } catch (err) {
    console.error("POST /api/doctors/me error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});
// ✅ GET /api/doctors/me  (doctor profile)
router.get("/me", authRequired, requireRole("DOCTOR"), async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT * FROM doctors WHERE userId = ? LIMIT 1", [userId]);
    res.json({ ok: true, doctor: rows[0] || null });
  } catch (err) {
    console.error("GET /api/doctors/me error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ POST /api/doctors/me  (create/update doctor profile)
router.post("/me", authRequired, requireRole("DOCTOR"), async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ IMPORTANT: if body is missing, avoid destructuring crash
    const { specialty, experienceYears, bio, location, photoUrl } = req.body || {};

    // 1) check if doctor profile exists
    const [docRows] = await pool.query(
      "SELECT id FROM doctors WHERE userId = ? LIMIT 1",
      [userId]
    );

    if (docRows.length === 0) {
      // create
      const [created] = await pool.query(
        `INSERT INTO doctors (userId, specialty, experienceYears, bio, location, photoUrl)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          specialty || null,
          Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : 0,
          bio || null,
          location || null,
          photoUrl || null,
        ]
      );

      return res.json({ ok: true, doctorId: created.insertId, created: true });
    }

    // update
    const doctorId = docRows[0].id;

    await pool.query(
      `UPDATE doctors
       SET specialty = ?, experienceYears = ?, bio = ?, location = ?, photoUrl = ?
       WHERE id = ?`,
      [
        specialty || null,
        Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : 0,
        bio || null,
        location || null,
        photoUrl || null,
        doctorId,
      ]
    );

    return res.json({ ok: true, doctorId, updated: true });
  } catch (err) {
    console.error("POST /api/doctors/me error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
export default router;