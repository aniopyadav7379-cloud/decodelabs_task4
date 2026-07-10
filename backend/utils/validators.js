const AppError = require("./AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINKEDIN_REGEX = /^https?:\/\/([\w-]+\.)?linkedin\.com\/.*$/i;
const ALLOWED_DEPARTMENTS = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Operations",
];

/**
 * All extended profile fields are optional everywhere, but if present
 * they must still be well-formed. Shared by create/replace/patch so the
 * same rules apply regardless of verb.
 */
function validateExtras(payload, errors) {
  const { phone, manager, linkedin, notes } = payload;

  if (phone !== undefined && String(phone).length > 30) {
    errors.push("phone must be 30 characters or fewer.");
  }
  if (manager !== undefined && String(manager).length > 80) {
    errors.push("manager must be 80 characters or fewer.");
  }
  if (linkedin !== undefined && linkedin !== "" && !LINKEDIN_REGEX.test(linkedin)) {
    errors.push("linkedin must be a valid linkedin.com URL (or left blank).");
  }
  if (notes !== undefined && String(notes).length > 500) {
    errors.push("notes must be 500 characters or fewer.");
  }
}

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
  validateExtras(payload, errors);

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
  const { name, email, role, department, phone, manager, linkedin, notes } = payload;
  const hasAnyField = [name, email, role, department, phone, manager, linkedin, notes].some(
    (v) => v !== undefined
  );

  if (!hasAnyField) {
    throw new AppError(
      "At least one field must be provided.",
      422,
      "VALIDATION_ERROR"
    );
  }

  const errors = [];
  if (email !== undefined && !EMAIL_REGEX.test(email)) {
    errors.push("email must be a valid email address.");
  }
  if (department !== undefined && !ALLOWED_DEPARTMENTS.includes(department)) {
    errors.push(`department must be one of: ${ALLOWED_DEPARTMENTS.join(", ")}.`);
  }
  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
    errors.push("name must be a string of at least 2 characters.");
  }
  if (role !== undefined && (typeof role !== "string" || role.trim().length < 2)) {
    errors.push("role must be a string of at least 2 characters.");
  }
  validateExtras(payload, errors);

  if (errors.length) {
    throw new AppError(errors.join(" "), 422, "VALIDATION_ERROR");
  }
}

module.exports = {
  validateInternCreate,
  validateInternReplace,
  validateInternPatch,
  ALLOWED_DEPARTMENTS,
};
