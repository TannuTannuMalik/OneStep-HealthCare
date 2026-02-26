import express from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/doctors
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

    const doctors = rows.map((d) => ({
      ...d,
      availableToday: Math.random() > 0.3, // MVP demo
    }));

    res.json({ ok: true, doctors });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/doctors/me
 */
router.get("/me", requireAuth, requireRole("DOCTOR"), async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT * FROM doctors WHERE userId = ?", [userId]);
    res.json({ ok: true, doctor: rows[0] || null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/doctors/me
 */
router.post("/me", requireAuth, requireRole("DOCTOR"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { specialty, experienceYears, bio, location, photoUrl } = req.body;

    const [existing] = await pool.query("SELECT id FROM doctors WHERE userId = ?", [userId]);

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO doctors (userId, specialty, experienceYears, bio, location, photoUrl)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          specialty || null,
          Number(experienceYears || 0),
          bio || null,
          location || null,
          photoUrl || null,
        ]
      );
    } else {
      await pool.query(
        `UPDATE doctors 
         SET specialty=?, experienceYears=?, bio=?, location=?, photoUrl=? 
         WHERE userId=?`,
        [
          specialty || null,
          Number(experienceYears || 0),
          bio || null,
          location || null,
          photoUrl || null,
          userId,
        ]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;