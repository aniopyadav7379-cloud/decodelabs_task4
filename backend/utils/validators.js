const AppError = require("./AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Operations",
];

/**
 * Validates a payload for CREATE (POST). All fields required.
 * Throws a 422 AppError (Unprocessable Entity — semantically invalid,
 * as distinct from 400 Bad Request which means malformed syntax).
 */
function validateInternCreate(payload = {}) {
  const errors = [];
  const { name, email, role, department } = payload;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("name is required and must be at least 2 characters.");
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push("a valid email is required.");
  }
  if (!role || typeof role !== "string" || role.trim().length < 2) {
    errors.push("role is required.");
  }
  if (!department || !ALLOWED_DEPARTMENTS.includes(department)) {
    errors.push(`department must be one of: ${ALLOWED_DEPARTMENTS.join(", ")}.`);
  }

  if (errors.length) {
    throw new AppError(errors.join(" "), 422, "VALIDATION_ERROR");
  }
}

/**
 * Validates a payload for a full replace (PUT). Same rules as create,
 * since PUT must supply the complete resource representation.
 */
function validateInternReplace(payload) {
  validateInternCreate(payload);
}

/**
 * Validates a payload for a partial update (PATCH). At least one
 * recognized, well-formed field must be present.
 */
function validateInternPatch(payload = {}) {
  const { name, email, role, department } = payload;
  const hasAnyField = [name, email, role, department].some(
    (v) => v !== undefined
  );

  if (!hasAnyField) {
    throw new AppError(
      "At least one field (name, email, role, department) must be provided.",
      422,
      "VALIDATION_ERROR"
    );
  }
  if (email !== undefined && !EMAIL_REGEX.test(email)) {
    throw new AppError("email must be a valid email address.", 422, "VALIDATION_ERROR");
  }
  if (department !== undefined && !ALLOWED_DEPARTMENTS.includes(department)) {
    throw new AppError(
      `department must be one of: ${ALLOWED_DEPARTMENTS.join(", ")}.`,
      422,
      "VALIDATION_ERROR"
    );
  }
  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
    throw new AppError("name must be a string of at least 2 characters.", 422, "VALIDATION_ERROR");
  }
  if (role !== undefined && (typeof role !== "string" || role.trim().length < 2)) {
    throw new AppError("role must be a string of at least 2 characters.", 422, "VALIDATION_ERROR");
  }
}

module.exports = {
  validateInternCreate,
  validateInternReplace,
  validateInternPatch,
  ALLOWED_DEPARTMENTS,
};
