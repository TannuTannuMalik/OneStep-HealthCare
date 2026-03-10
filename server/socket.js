import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

/**
 * Call this once in server.js, passing the raw http.Server instance.
 * Returns the io instance in case you need it elsewhere.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  /* ── Auth middleware ─────────────────────────────────────────────────────── */
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("AUTH_MISSING"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role, ... }
      next();
    } catch {
      next(new Error("AUTH_INVALID"));
    }
  });

  /* ── Connection ──────────────────────────────────────────────────────────── */
  io.on("connection", (socket) => {
    const uid = socket.user?.id;
    console.log(`[socket] connected  id=${socket.id}  userId=${uid}`);

    /* ── Personal room (for push notifications) ──────────────────────────── */
    socket.on("join", ({ userId }) => {
      // Guard: only let the authenticated user join their own room
      if (String(userId) !== String(uid)) return;
      socket.join(`user-${userId}`);
      console.log(`[socket] user-${userId} joined personal room`);
    });

    /* ── Video call signaling ─────────────────────────────────────────────── */

    // Both doctor and patient call this when they open the video page
    socket.on("join-video-room", ({ appointmentId }) => {
      const room = `video-${appointmentId}`;
      const clients = io.sockets.adapter.rooms.get(room);
      const numClients = clients ? clients.size : 0;

      if (numClients >= 2) {
        // Room is full — reject the third joiner
        socket.emit("video-room-full");
        console.warn(`[socket] Video room ${room} is full — rejected ${socket.id}`);
        return;
      }

      socket.join(room);
      console.log(`[socket] ${socket.id} joined ${room} (${numClients + 1}/2)`);

      // If someone was already waiting, tell them a peer has arrived
      // so they can create the WebRTC offer
      if (numClients === 1) {
        socket.to(room).emit("video-peer-joined", { socketId: socket.id });
      }
    });

    // Offer: sent by the peer who was already in the room
    socket.on("video-offer", ({ appointmentId, offer }) => {
      socket.to(`video-${appointmentId}`).emit("video-offer", { offer });
    });

    // Answer: sent back by the second peer who received the offer
    socket.on("video-answer", ({ appointmentId, answer }) => {
      socket.to(`video-${appointmentId}`).emit("video-answer", { answer });
    });

    // ICE candidates — relayed between both peers
    socket.on("video-ice-candidate", ({ appointmentId, candidate }) => {
      socket.to(`video-${appointmentId}`).emit("video-ice-candidate", { candidate });
    });

    // Clean leave (End Call button)
    socket.on("leave-video-room", ({ appointmentId }) => {
      const room = `video-${appointmentId}`;
      socket.leave(room);
      socket.to(room).emit("video-peer-left");
      console.log(`[socket] ${socket.id} left ${room}`);
    });

    /* ── Appointment push events ─────────────────────────────────────────── */
    // Called from your route handlers via emitToUser()
    // client side: socket.on("appointment_status", handler)
    // client side: socket.on("report_ready", handler)

    /* ── Disconnecting (tab close / network drop) ────────────────────────── */
    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room.startsWith("video-")) {
          socket.to(room).emit("video-peer-left");
          console.log(`[socket] ${socket.id} dropped from ${room}`);
        }
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[socket] disconnected id=${socket.id} reason=${reason}`);
    });
  });

  return io;
}

/**
 * Emit an event to a specific user's personal room.
 * Call this from your Express route handlers.
 *
 * Example:
 *   import { emitToUser } from "../socket.js";
 *   emitToUser(patientId, "appointment_status", { appointmentId, status });
 *   emitToUser(doctorId,  "report_ready",       { reportId });
 */
export function emitToUser(userId, event, payload) {
  if (!io) {
    console.warn("[socket] emitToUser called before initSocket()");
    return;
  }
  io.to(`user-${userId}`).emit(event, payload);
}

export { io };
