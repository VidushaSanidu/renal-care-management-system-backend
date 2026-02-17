const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const dialysisSessionRoutes = require("./routes/dialysisSessionRoutes");
const monthlyInvestigationRoutes = require("./routes/monthlyInvestigationRoutes");
const clinicalDecisionRoutes = require("./routes/clinicalDecisions");
const notificationRoutes = require("./routes/notificationRoutes");
const aiPredictionRoutes = require("./routes/aiPredictionRoutes");
const trendsRoutes = require("./routes/trends");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const auth = require("./middleware/auth");

// Import utilities
const { connectDB } = require("./config/database");
const { initializeSocket } = require("./config/socket");
const ScheduledNotificationService = require("./services/scheduledNotificationService");

const app = express();

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = initializeSocket(server);

// Connect to MongoDB
connectDB();

// Initialize scheduled notifications
ScheduledNotificationService.initializeScheduledNotifications();

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Swagger configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Renal Care Management API",
      version: "1.0.0",
      description: "API for AI-Driven Renal Care Management System",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API files
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Renal Care Management API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dialysis-sessions", dialysisSessionRoutes);
app.use("/api/monthly-investigations", monthlyInvestigationRoutes);
app.use("/api/clinical-decisions", clinicalDecisionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai-predictions", aiPredictionRoutes);
app.use("/api/trends", trendsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📚 API Documentation available at http://localhost:${PORT}/api-docs`,
  );
  console.log(`🏥 Renal Care Management System Backend`);
});

// Global Error Handler - Handle uncaught errors gracefully
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  console.error("Stack:", err.stack);
  // Keep server running
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Keep server running
});

module.exports = app;
