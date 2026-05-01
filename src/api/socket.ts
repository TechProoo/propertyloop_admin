import { io, type Socket } from "socket.io-client";
import { tokenStore } from "./tokenStore";

const SOCKET_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000/api"
).replace(/\/api$/, "");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && (socket.connected || socket.active)) return socket;

  const token = tokenStore.getAccess();
  socket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    query: { token: token || "" },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
