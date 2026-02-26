import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../utils/cloudinary.js";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/doctor-photo",
  requireAuth,
  requireRole("DOCTOR"),
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ ok: false, error: "No file uploaded" });
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "onestep-doctors" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      const photoUrl = result.secure_url;
      const userId = req.user.id;

      // ✅ Ensure doctors row exists
      const [existing] = await pool.query("SELECT id FROM doctors WHERE userId = ?", [userId]);

      if (existing.length === 0) {
        await pool.query("INSERT INTO doctors (userId, photoUrl) VALUES (?, ?)", [userId, photoUrl]);
      } else {
        await pool.query("UPDATE doctors SET photoUrl=? WHERE userId=?", [photoUrl, userId]);
      }

      res.json({ ok: true, photoUrl });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
);

export default router;