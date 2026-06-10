import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";
import uploadRoutes from "./routes/upload.js";
import appointmentsRoutes from "./routes/appointments.js";
import reportsRoutes from "./routes/reports.js";
import videoRoutes from "./routes/video.js";
import chatRoutes from "./routes/chat.js";
import pharmacyRoutes from "./routes/pharmacy.js";
import symptomsRoutes from "./routes/symptoms.js";
import paymentsRoutes from "./routes/payments.js";

const app = express();

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/symptoms", symptomsRoutes);
app.use("/api/payments", paymentsRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

export default app;
