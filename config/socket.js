const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // Join role-specific room
    socket.join(`role_${socket.userRole}`);

    // Handle joining specific rooms
    socket.on("join_room", (roomName) => {
      socket.join(roomName);
      console.log(`User ${socket.userId} joined room: ${roomName}`);
    });

    // Handle leaving rooms
    socket.on("leave_room", (roomName) => {
      socket.leave(roomName);
      console.log(`User ${socket.userId} left room: ${roomName}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Handle real-time updates
    socket.on("session_update", (data) => {
      // Broadcast to relevant users (doctors, nurses)
      socket.to(`role_doctor`).emit("session_update", data);
      socket.to(`role_nurse`).emit("session_update", data);
    });

    socket.on("prediction_ready", (data) => {
      // Notify doctors about new predictions
      socket.to(`role_doctor`).emit("prediction_ready", data);
    });

    // Send welcome message
    socket.emit("welcome", {
      message: "Connected to Renal Care Management System",
      userId: socket.userId,
      role: socket.userRole,
    });
  });

  console.log("Socket.IO initialized");
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

// Keep backward compatibility
const setupSocketIO = initializeSocket;

module.exports = { initializeSocket, getIO, setupSocketIO };
