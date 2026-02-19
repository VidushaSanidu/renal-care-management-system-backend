import mongoose from "mongoose";

import envConfig from "./env.config.js";

export const connectDB = async () => {
  try {
    // Recommended setting
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(envConfig.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 30000,
    });

    console.log(`🗄️ MongoDB Connected: ${conn.connection.host}`);

    setupEventListeners();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

function setupEventListeners() {
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connection established");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

async function gracefulShutdown() {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}
