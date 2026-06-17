import dotenv from "dotenv";

// Ensure environment variables are loaded before this module reads process.env.
dotenv.config({ quiet: true });

interface EnvConfig {
  MONGODB_URI: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  ML_SERVER_URL: string;
  NODE_ENV: string;
  BACKEND_PORT: number;
}

const envConfig: EnvConfig = {
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/renal-care",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET
    ? process.env.JWT_SECRET
    : "your_jwt_secret",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  ML_SERVER_URL: process.env.ML_SERVER_URL || "http://localhost:8001",
  NODE_ENV: process.env.NODE_ENV || "production",
  BACKEND_PORT: Number(process.env.BACKEND_PORT) || 4000,
};

export default envConfig;
