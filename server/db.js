import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ✅ Debug: log which DB vars are being used (remove after fixing)
console.log("DB Config:", {
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "onestep",
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  // don't log password
});

export const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "onestep",
  port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const testDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB connected successfully");
    conn.release();
  } catch (err) {
    // ✅ Log the full error so we can see what's wrong
    console.error("❌ DB connection failed:", err.message);
    console.error("❌ DB error code:", err.code);
    console.error("❌ DB error details:", err);
  }
};