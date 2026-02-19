import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { createServer } from "http";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import dialysisSessionRoutes from "./routes/dialysisSessionRoutes.js";
import monthlyInvestigationRoutes from "./routes/monthlyInvestigationRoutes.js";
import clinicalDecisionRoutes from "./routes/clinicalDecisions.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiPredictionRoutes from "./routes/aiPredictionRoutes.js";
import trendsRoutes from "./routes/trends.js";

// Import middleware
import errorHandler from "./middleware/errorHandler.js";

// Import utilities
import { connectDB } from "./config/database.js";
import ScheduledNotificationService from "./services/scheduledNotificationService.js";
import envConfig from "./config/env.config.js";

/*
|--------------------------------------------------------------------------
| App initialization
|--------------------------------------------------------------------------
*/

const app: Application = express();

const server = createServer(app);

/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

await connectDB();

/*
|--------------------------------------------------------------------------
| Scheduled jobs
|--------------------------------------------------------------------------
*/

ScheduledNotificationService.initializeScheduledNotifications();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: envConfig.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

if (envConfig.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/*
|--------------------------------------------------------------------------
| Swagger config
|--------------------------------------------------------------------------
*/

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Renal Care Management API",
      version: "1.0.0",
      description: "API for AI-Driven Renal Care Management System",
    },
    servers: [
      {
        url: `http://localhost:${envConfig.PORT}`,
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
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
};

const specs = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "Renal Care Management API running",
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/patients", patientRoutes);

app.use("/api/dialysis-sessions", dialysisSessionRoutes);

app.use("/api/monthly-investigations", monthlyInvestigationRoutes);

app.use("/api/clinical-decisions", clinicalDecisionRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/ai-predictions", aiPredictionRoutes);

app.use("/api/trends", trendsRoutes);

/*
|--------------------------------------------------------------------------
| Error handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| 404 handler
|--------------------------------------------------------------------------
*/

app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
|--------------------------------------------------------------------------
| Server start
|--------------------------------------------------------------------------
*/

server.listen(envConfig.PORT, () => {
  console.log(`🚀 Server running on port ${envConfig.PORT}`);

  console.log(`📚 Docs: http://localhost:${envConfig.PORT}/api-docs`);

  console.log(`🏥 Renal Care Backend Ready`);
});

/*
|--------------------------------------------------------------------------
| Global error handlers
|--------------------------------------------------------------------------
*/

process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err.message);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Rejection:", reason);
});

export default app;
