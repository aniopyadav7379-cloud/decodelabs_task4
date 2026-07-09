/**
 * AppError
 * A predictable, operational error carrying an HTTP status code.
 * Controllers throw this instead of raw errors so the centralized
 * error handler always knows how to respond (status + shape).
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
