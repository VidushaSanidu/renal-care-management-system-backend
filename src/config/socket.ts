import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import envConfig from "./env.config.js";

// Extend Socket type to include custom properties
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

// Define JWT payload structure
interface TokenPayload extends JwtPayload {
  id: string;
  role: string;
}

// Singleton instance
let io: Server | null = null;

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: envConfig.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  /**
   * Authentication middleware
   */
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication failed: No token provided"));
      }

      const decoded = jwt.verify(token, envConfig.JWT_SECRET) as TokenPayload;

      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      next(new Error("Authentication failed: Invalid token"));
    }
  });

  /**
   * Handle connections
   */
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    // Join private user room
    socket.join(`user_${socket.userId}`);

    // Join role room
    socket.join(`role_${socket.userRole}`);

    /**
     * Join custom room (secure)
     */
    socket.on("join_room", (roomName: string) => {
      if (roomName.startsWith("user_") || roomName.startsWith("role_")) {
        console.warn(`❌ Unauthorized room join attempt: ${roomName}`);
        return;
      }

      socket.join(roomName);

      console.log(`User ${socket.userId} joined room: ${roomName}`);
    });

    /**
     * Leave room
     */
    socket.on("leave_room", (roomName: string) => {
      socket.leave(roomName);

      console.log(`User ${socket.userId} left room: ${roomName}`);
    });

    /**
     * Session update broadcast
     */
    socket.on("session_update", (data: unknown) => {
      io?.to("role_doctor").emit("session_update", data);
      io?.to("role_nurse").emit("session_update", data);
    });

    /**
     * Prediction ready event
     */
    socket.on("prediction_ready", (data: unknown) => {
      io?.to("role_doctor").emit("prediction_ready", data);
    });

    /**
     * Disconnect handler
     */
    socket.on("disconnect", (reason: string) => {
      console.log(`⚠️ User disconnected: ${socket.userId}, reason: ${reason}`);
    });

    /**
     * Welcome message
     */
    socket.emit("welcome", {
      message: "Connected to Renal Care Management System",
      userId: socket.userId,
      role: socket.userRole,
    });
  });

  console.log("🚀 Socket.IO initialized");

  return io;
};

/**
 * Get Socket.IO instance safely
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

// Backward compatibility export
export const setupSocketIO = initializeSocket;
