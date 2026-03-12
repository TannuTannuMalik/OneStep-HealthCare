import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://onestep-healthcare-production.up.railway.app" || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"], // NO polling — Railway blocks it
  withCredentials: true,
  autoConnect: false, // don't connect until logged in
  auth: {
    token: localStorage.getItem("token") || "",
  },
});

/**
 * Call this after login to reconnect the socket with the fresh token.
 * Usage: connectSocket()  (in Login.jsx after successful login)
 */
export function connectSocket() {
  const token = localStorage.getItem("token");
  if (token) {
    socket.auth = { token };
  }
  if (!socket.connected) {
    socket.connect();
  }
}

/**
 * Call this on logout to cleanly disconnect.
 * Usage: disconnectSocket()
 */
export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}