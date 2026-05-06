import { pool } from "./db.js";

try {
  await pool.query(`ALTER TABLE appointments 
    ADD COLUMN paymentStatus ENUM('PENDING','PAID','REFUNDED') DEFAULT 'PENDING',
    ADD COLUMN stripePaymentId VARCHAR(255) DEFAULT NULL,
    ADD COLUMN consultationFee DECIMAL(10,2) DEFAULT 50.00`);
  console.log("✅ appointments columns added!");
} catch (e) {
  console.log("❌", e.message);
}

try {
  await pool.query(`ALTER TABLE consultation_reports
    ADD COLUMN blockchainTx VARCHAR(255) DEFAULT NULL`);
  console.log("✅ blockchainTx column added!");
} catch (e) {
  console.log("❌", e.message);
}

process.exit(0);