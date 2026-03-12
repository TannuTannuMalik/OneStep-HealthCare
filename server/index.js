import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";
import uploadRoutes from "./routes/upload.js";
import appointmentsRoutes from "./routes/appointments.js";
import reportsRoutes from "./routes/reports.js";
import videoRoutes from "./routes/video.js";

dotenv.config();

const app = express();
console.log("CORS VERSION 2 LOADED");

/*
-----------------------------------------------------
CORS FIX (important for Vercel frontend)
-----------------------------------------------------
*/

const FRONTEND_URL = "https://one-step-health-care.vercel.app";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

/*
-----------------------------------------------------
Basic routes
-----------------------------------------------------
*/

app.get("/", (req, res) => {
  res.send("OneStep Healthcare Backend Running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Backend running" });
});

/*
-----------------------------------------------------
HTTP Server + Socket.io
-----------------------------------------------------
*/

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
  transports: ["websocket"],
});

app.set("io", io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

/*
-----------------------------------------------------
API Routes
-----------------------------------------------------
*/

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/video", videoRoutes);

/*
-----------------------------------------------------
Database debug routes
-----------------------------------------------------
*/

app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 as test");
    res.json({ ok: true, rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/debug-db-info", async (req, res) => {
  try {
    const [db] = await pool.query("SELECT DATABASE() as db");
    const [host] = await pool.query("SELECT @@hostname as host, @@port as port");
    res.json({ ok: true, db: db[0], host: host[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/*
-----------------------------------------------------
Socket.IO logic
-----------------------------------------------------
*/

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("join", ({ userId }) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`👤 Joined room user:${userId}`);
  });

  socket.on("join-video-room", ({ appointmentId }) => {
    if (!appointmentId) return;

    const room = `video:${appointmentId}`;
    const clients = io.sockets.adapter.rooms.get(room);
    const count = clients ? clients.size : 0;

    if (count >= 2) {
      socket.emit("video-room-full");
      return;
    }

    socket.join(room);
    console.log(`📹 Socket ${socket.id} joined ${room}`);

    if (count === 1) {
      socket.to(room).emit("video-peer-joined");
    }
  });

  socket.on("leave-video-room", ({ appointmentId }) => {
    if (!appointmentId) return;
    const room = `video:${appointmentId}`;
    socket.leave(room);
    socket.to(room).emit("video-peer-left");
    console.log(`📹 Socket ${socket.id} left ${room}`);
  });

  socket.on("video-offer", ({ appointmentId, offer }) => {
    if (!appointmentId || !offer) return;
    socket.to(`video:${appointmentId}`).emit("video-offer", { offer });
  });

  socket.on("video-answer", ({ appointmentId, answer }) => {
    if (!appointmentId || !answer) return;
    socket.to(`video:${appointmentId}`).emit("video-answer", { answer });
  });

  socket.on("video-ice-candidate", ({ appointmentId, candidate }) => {
    if (!appointmentId || !candidate) return;
    socket.to(`video:${appointmentId}`).emit("video-ice-candidate", { candidate });
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (typeof room === "string" && room.startsWith("video:")) {
        socket.to(room).emit("video-peer-left");
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/*
-----------------------------------------------------
Start Server
-----------------------------------------------------
*/

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB connected successfully");
    conn.release();
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
};

startServer();
