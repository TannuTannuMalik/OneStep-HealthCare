import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);

// ✅ Root
app.get("/", (req, res) => {
  res.send("OneStep Healthcare Backend Running 🚀");
});
app.use("/api/upload", uploadRoutes);
// ✅ Health
app.get("/health", (req, res) => {
  res.json({ message: "Backend running" });
});

// ✅ DB test
app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 as test");
    res.json({ ok: true, rows });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// ✅ Init DB
app.get("/init-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullName VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL,
        role ENUM('PATIENT','DOCTOR','ADMIN') DEFAULT 'PATIENT',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        specialty VARCHAR(100),
        experienceYears INT DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0.00,
        bio TEXT,
        location VARCHAR(120),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        photoUrl VARCHAR(500) NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    res.json({ ok: true, message: "Tables created/updated ✅" });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});
app.get("/init-db-v2", async (req, res) => {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'photoUrl'`
    );

    if (cols.length === 0) {
      await pool.query(`ALTER TABLE doctors ADD COLUMN photoUrl VARCHAR(500) NULL`);
    }

    res.json({ ok: true, message: "DB updated ✅ (photoUrl added if missing)" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));