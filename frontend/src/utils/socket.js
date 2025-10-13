// src/utils/socket.js
import { io } from "socket.io-client";

// --- Create a single global Socket.IO instance ---
// Normalize base URL: ensure we don't include "/api" in the Socket.IO URL
const rawBase = process.env.REACT_APP_API_URL || "http://localhost:5050/api";
let baseForSocket = rawBase;
if (baseForSocket.endsWith("/api")) baseForSocket = baseForSocket.slice(0, -4);
if (baseForSocket.endsWith("/")) baseForSocket = baseForSocket.slice(0, -1);

const socket = io(baseForSocket, {
  path: "/socket.io",
  transports: ["websocket"],   // Force WebSocket transport
  reconnectionAttempts: 5,     // Retry 5 times on disconnect
  reconnectionDelay: 1000,     // 1 second between retries
});

// --- Connection & error logging ---
socket.on("connect", () => console.log("✅ Connected to WebSocket:", socket.id));
socket.on("disconnect", (reason) => console.log("⚠️ Disconnected from WebSocket:", reason));
socket.on("connect_error", (err) => console.error("🔴 WebSocket connection error:", err));

// --- Prevent duplicate default listeners during hot reload ---
let hasMessageListener = false;
if (!hasMessageListener) {
  socket.on("message", (data) => console.log("📩 New message:", data));
  hasMessageListener = true;
}

// --- Utility: Subscribe to events dynamically ---
export const subscribe = (event, callback) => {
  if (!event || typeof callback !== "function") return;

  socket.on(event, callback);

  // Return cleanup function for React useEffect
  return () => socket.off(event, callback);
};

// --- Utility: Emit events ---
export const emitEvent = (event, data) => {
  if (!event) return;
  socket.emit(event, data);
};

// --- Optional: Export event constants to avoid typos ---
export const EVENTS = {
  STAFF_LOGIN: "staff-login",
  STAFF_NOTIFICATION: "staff-notification",
  ORGANISER_LOGIN: "organiser-login",
  MESSAGE: "message",
};

// --- Export the socket instance for direct use if needed ---
export default socket;
