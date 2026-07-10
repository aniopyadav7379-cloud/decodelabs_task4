/**
 * Centralized error handler — the single "catch" for the whole app.
 * Every route forwards errors here via next(err) instead of swallowing
 * them or replying inconsistently. Response shape is always:
 *   { success: false, error: { message, code } }
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.isOperational
    ? err.message
    : "Something went wrong on our end. Please try again.";

  // In production this is where you'd forward to centralized logging
  // (e.g. Sentry.captureException(err)) instead of console.error.
  if (!err.isOperational) {
    console.error("[UNEXPECTED ERROR]", err);
  } else {
    console.warn(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: { message, code },
  });
}

/** 404 handler for routes that don't match any defined endpoint. */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} does not exist.`,
      code: "ROUTE_NOT_FOUND",
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
