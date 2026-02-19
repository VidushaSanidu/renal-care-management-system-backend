import { Request, Response, NextFunction } from "express";

/**
 * Custom error interface
 */
interface AppError extends Error {
  statusCode?: number;
  code?: number | string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, any>;
  isOperational?: boolean;
}

/**
 * Global error handler middleware
 */
const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  let error: AppError = { ...err };
  error.message = err.message;

  // Log error stack
  console.error(err.stack);

  /**
   * Mongoose CastError (Invalid ObjectId)
   */
  if (err.name === "CastError") {
    error = {
      message: "Resource not found",
      statusCode: 404,
      name: "CastError",
    };
  }

  /**
   * Duplicate key error
   */
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    let message = "Duplicate field value";

    if (field === "email") {
      message = "Email already exists";
    } else if (field === "patientId") {
      message = "Patient ID already exists";
    } else {
      message = `${field} '${value}' already exists`;
    }

    error = {
      message,
      statusCode: 400,
      name: "DuplicateKeyError",
    };
  }

  /**
   * Validation error
   */
  if (err.name === "ValidationError" && err.errors) {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(", ");

    error = {
      message,
      statusCode: 400,
      name: "ValidationError",
    };
  }

  /**
   * JWT errors
   */
  if (err.name === "JsonWebTokenError") {
    error = {
      message: "Invalid token",
      statusCode: 401,
      name: err.name,
    };
  }

  if (err.name === "TokenExpiredError") {
    error = {
      message: "Token expired",
      statusCode: 401,
      name: err.name,
    };
  }

  /**
   * Mongo connection errors
   */
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    error = {
      message: "Database connection error",
      statusCode: 500,
      name: err.name,
    };
  }

  /**
   * Rate limit error
   */
  if (err.message?.includes("Too many requests")) {
    error = {
      message: "Too many requests, try again later",
      statusCode: 429,
      name: "RateLimitError",
    };
  }

  /**
   * File upload errors
   */
  if (err.code === "LIMIT_FILE_SIZE") {
    error = {
      message: "File too large",
      statusCode: 400,
      name: "FileSizeError",
    };
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    error = {
      message: "Too many files",
      statusCode: 400,
      name: "FileCountError",
    };
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    error = {
      message: "Unexpected file field",
      statusCode: 400,
      name: "FileFieldError",
    };
  }

  /**
   * Custom operational errors
   */
  if (err.isOperational) {
    error = {
      message: err.message,
      statusCode: err.statusCode || 500,
      name: err.name,
    };
  }

  /**
   * Default fallback
   */
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  /**
   * Development response
   */
  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        stack: err.stack,
        name: err.name,
        code: err.code,
      },
    });
  }

  /**
   * Production response
   */
  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal Server Error" : message,
  });
};

export default errorHandler;
