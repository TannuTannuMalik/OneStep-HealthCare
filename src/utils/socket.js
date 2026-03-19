import { io } from "socket.io-client";

export let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("token");

  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket"],
      auth: { token },
    });
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}