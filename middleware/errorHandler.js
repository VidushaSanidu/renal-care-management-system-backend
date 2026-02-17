const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = "Duplicate field value entered";

    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    if (field === "email") {
      message = "Email already exists";
    } else if (field === "patientId") {
      message = "Patient ID already exists";
    } else {
      message = `${field} '${value}' already exists`;
    }

    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { message, statusCode: 401 };
  }

  // MongoDB connection errors
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    const message = "Database connection error";
    error = { message, statusCode: 500 };
  }

  // Rate limiting errors
  if (err.message && err.message.includes("Too many requests")) {
    error = {
      message: "Too many requests, please try again later",
      statusCode: 429,
    };
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File too large";
    error = { message, statusCode: 400 };
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    const message = "Too many files";
    error = { message, statusCode: 400 };
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    const message = "Unexpected file field";
    error = { message, statusCode: 400 };
  }

  // Custom application errors
  if (err.isOperational) {
    error = { message: err.message, statusCode: err.statusCode || 500 };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Different error responses for different environments
  if (process.env.NODE_ENV === "development") {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        stack: err.stack,
        name: err.name,
        code: err.code,
      },
    });
  } else {
    // Production error response
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? "Internal Server Error" : message,
    });
  }
};

module.exports = errorHandler;
