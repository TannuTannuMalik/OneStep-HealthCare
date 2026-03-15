import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const {
  MYSQL_URL,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT
} = process.env;

// Create connection pool
export const pool = MYSQL_URL
  ? mysql.createPool(MYSQL_URL) // Railway / production
  : mysql.createPool({
      host: DB_HOST || "localhost",
      user: DB_USER || "root",
      password: DB_PASSWORD || "",
      database: DB_NAME || "onestep",
      port: DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

// Optional DB connection test
export const testDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Database connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
};