import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";
import uploadRoutes from "./routes/upload.js";
import appointmentsRoutes from "./routes/appointments.js";
import reportsRoutes from "./routes/reports.js"; // ✅ NEW

dotenv.config();

const app = express();

// ✅ CORS (Express)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reports", reportsRoutes); // ✅ NEW

// ✅ Root
app.get("/", (req, res) => {
  res.send("OneStep Healthcare Backend Running 🚀");
});

// ✅ Health
app.get("/health", (req, res) => {
  res.json({ message: "Backend running" });
});

// ✅ DB test (checks Railway/local DB connection)
app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 as test");
    res.json({ ok: true, rows });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// ✅ Show appointments table columns (SAFE: no delete)
app.get("/describe-appointments", async (req, res) => {
  try {
    const [rows] = await pool.query("DESCRIBE appointments");
    res.json({ ok: true, rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ✅ Show consultation_reports table columns (SAFE: no delete)
app.get("/describe-reports", async (req, res) => {
  try {
    const [rows] = await pool.query("DESCRIBE consultation_reports");
    res.json({ ok: true, rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ✅ Init DB (users + doctors)
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

// ✅ Init DB v2 (ensure photoUrl exists)
app.get("/init-db-v2", async (req, res) => {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'doctors' 
         AND COLUMN_NAME = 'photoUrl'`
    );

    if (cols.length === 0) {
      await pool.query(`ALTER TABLE doctors ADD COLUMN photoUrl VARCHAR(500) NULL`);
    }

    res.json({ ok: true, message: "DB updated ✅ (photoUrl added if missing)" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Init DB v3 (availability + appointments workflow)
app.get("/init-db-v3", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctorId INT NOT NULL,
        dayOfWeek TINYINT NOT NULL,
        startTime TIME NOT NULL,
        endTime TIME NOT NULL,
        slotMinutes INT NOT NULL DEFAULT 30,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
        INDEX idx_doctor_day (doctorId, dayOfWeek)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctorId INT NOT NULL,
        patientId INT NOT NULL,
        appointmentType ENUM('VIDEO','IN_PERSON') NOT NULL DEFAULT 'VIDEO',
        requestedStart DATETIME NOT NULL,
        requestedEnd DATETIME NOT NULL,
        status ENUM('REQUESTED','CONFIRMED','REJECTED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'REQUESTED',
        patientNote TEXT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,

        INDEX idx_doctor_status (doctorId, status),
        INDEX idx_patient_status (patientId, status),
        INDEX idx_requestedStart (requestedStart)
      )
    `);

    res.json({
      ok: true,
      message: "DB updated ✅ (availability + appointments tables created)",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Init DB v4 (consultation reports)
app.get("/init-db-v4", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consultation_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,

        appointmentId INT NOT NULL,
        doctorId INT NOT NULL,
        patientId INT NOT NULL,

        diagnosis VARCHAR(255),
        prescription TEXT,
        doctorNotes TEXT,
        improvementSuggestions TEXT,
        followUpDate DATETIME,

        pdfUrl TEXT,
        pdfHash CHAR(64),
        hashTimestamp TIMESTAMP NULL,

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY unique_appointment_report (appointmentId),

        FOREIGN KEY (appointmentId) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,

        INDEX idx_patient_createdAt (patientId, createdAt),
        INDEX idx_doctor_createdAt (doctorId, createdAt)
      )
    `);

    res.json({
      ok: true,
      message: "DB updated ✅ (consultation_reports table created)",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ Which DB am I connected to?
app.get("/debug-db-info", async (req, res) => {
  try {
    const [db] = await pool.query("SELECT DATABASE() as db");
    const [host] = await pool.query("SELECT @@hostname as host, @@port as port");
    res.json({ ok: true, db: db[0], host: host[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ✅ Does the logged in user ID exist in users table?
app.get("/debug-user/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, fullName, email, role FROM users WHERE id = ?",
      [req.params.id]
    );
    res.json({ ok: true, rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------------------------
   ✅ SOCKET.IO SETUP
----------------------------*/

// ✅ Create HTTP server from Express app
const server = http.createServer(app);

// ✅ Attach Socket.io to server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

// ✅ Make io available in routes as req.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Socket events
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // join room for a user
  socket.on("join", ({ userId }) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`👤 Joined room user:${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ✅ Start server (IMPORTANT: server.listen not app.listen)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));