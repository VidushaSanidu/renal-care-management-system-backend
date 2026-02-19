interface EnvConfig {
  MONGODB_URI: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  ML_SERVER_URL: string;
}

const envConfig: EnvConfig = {
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/renal-care",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET
    ? process.env.JWT_SECRET
    : "your_jwt_secret",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  ML_SERVER_URL: process.env.ML_SERVER_URL || "http://localhost:5000",
};

export default envConfig;
