import dotenv from "dotenv";
dotenv.config();
import { pool } from "./db.js";

try {
  await pool.query(`ALTER TABLE users MODIFY COLUMN role ENUM('PATIENT','DOCTOR','ADMIN','PHARMACIST') NOT NULL DEFAULT 'PATIENT'`);
  console.log("✅ PHARMACIST role added!");
} catch (e) {
  console.log("❌", e.message);
}

process.exit(0);