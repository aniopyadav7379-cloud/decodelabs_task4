require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const corsOptions = require("./config/corsConfig");
const internsRoutes = require("./routes/internsRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Deployment fix: most PaaS providers (Render, Railway, Fly.io) sit behind
// a reverse proxy. Without this, req.secure/req.ip and rate-limiting logic
// downstream would see the proxy's connection, not the real client's.
app.set("trust proxy", 1);

// ---- Global middleware -----------------------------------------------
app.use(cors(corsOptions));       // Stage: cross-origin gatekeeper (see slide 11)
app.use(express.json());          // Parses JSON request bodies (Stage 2 input)
app.use(morgan("dev"));           // Request logging for visibility in dev

// ---- Health check (useful for uptime checks / deployment platforms) ---
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok", uptime: process.uptime() });
});

// ---- Resource routes ----------------------------------------------------
app.use("/api/interns", internsRoutes);

// ---- 404 + centralized error handling (must be registered last) -------
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`✅ Interns Directory API running at http://localhost:${PORT}`);
  console.log(`   Try: GET http://localhost:${PORT}/api/interns`);
});

// Deployment fix: platforms send SIGTERM on redeploy/scale-down. Without
// handling it, in-flight requests get dropped mid-response instead of
// finishing cleanly.
function shutdown(signal) {
  console.log(`\n${signal} received: closing server gracefully…`);
  server.close(() => {
    console.log("Server closed. Bye!");
    process.exit(0);
  });
  // Force-exit if connections don't close within 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
