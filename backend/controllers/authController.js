const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

/**
 * Single-admin auth for a training project: credentials come from env
 * vars, the password is hashed once at boot (never stored or compared
 * in plain text), and a JWT is issued on success. This protects writes
 * (create/update/delete) while keeping reads public — "login so only
 * you can edit," not a full multi-user account system.
 */
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(
  process.env.ADMIN_PASSWORD || "ChangeMe123!",
  10
);

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      throw new AppError("username and password are required.", 400, "MISSING_CREDENTIALS");
    }

    const usernameMatches = username === ADMIN_USERNAME;
    const passwordMatches = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    // Always run both checks (avoid short-circuiting on a wrong username)
    // so response timing doesn't leak whether the username was correct.
    if (!usernameMatches || !passwordMatches) {
      throw new AppError("Invalid username or password.", 401, "INVALID_CREDENTIALS");
    }

    const token = jwt.sign(
      { sub: username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.status(200).json({ success: true, data: { token, username } });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
