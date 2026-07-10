const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

/**
 * Protects mutating routes. Reads (GET) never pass through this — the
 * directory itself stays public; only create/update/delete require a
 * logged-in session, per the brief ("login so only you can edit").
 */
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Login required for this action.", 401, "AUTH_REQUIRED");
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError("Your session has expired. Please log in again.", 401, "INVALID_TOKEN"));
  }
}

module.exports = requireAuth;
