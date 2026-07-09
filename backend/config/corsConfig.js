/**
 * CORS configuration.
 * The browser blocks cross-origin calls by default (Same-Origin Policy).
 * We explicitly allow the frontend's origin(s) here, and reflect
 * Access-Control-Allow-Origin only for known, trusted origins —
 * never a blanket "*" once credentials or auth headers are involved.
 */
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5500")
  .split(",")
  .map((origin) => origin.trim());

const corsOptions = {
  origin(origin, callback) {
    // Allow tools like curl/Postman (no origin header) and whitelisted origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const err = new Error(`Origin ${origin} not allowed by CORS.`);
      err.statusCode = 403;
      err.code = "CORS_NOT_ALLOWED";
      err.isOperational = true;
      callback(err);
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

module.exports = corsOptions;
