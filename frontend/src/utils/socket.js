// src/utils/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5050"); // backend port

socket.on("connect", () => {
  console.log("Connected to WebSocket:", socket.id);
});

socket.on("message", (data) => {
  console.log("New message:", data);
});

export default socket;
