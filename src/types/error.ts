/**
 * Custom error interface
 */
export interface AppError extends Error {
  statusCode?: number;
  code?: number | string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, unknown>;
  isOperational?: boolean;
}
