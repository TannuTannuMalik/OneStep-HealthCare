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

export const pool = MYSQL_URL
  ? mysql.createPool(MYSQL_URL)   // ✅ Railway (recommended)
  : mysql.createPool({            // ✅ Local fallback
      host: DB_HOST || "localhost",
      user: DB_USER || "root",
      password: DB_PASSWORD || "",
      database: DB_NAME || "onestep",
      port: DB_PORT || 3306,
    });


// ✅ Optional: test connection (VERY useful)
export const testDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
};