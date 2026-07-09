const store = require("../data/internsStore");
const AppError = require("../utils/AppError");
const {
  validateInternCreate,
  validateInternReplace,
  validateInternPatch,
} = require("../utils/validators");

/**
 * Parses and validates a route param as a positive integer ID.
 * Bug fix: previously `Number(req.params.id)` on a non-numeric value
 * (e.g. "/api/interns/abc") produced NaN, which store lookups always
 * miss — so malformed input silently returned 404 Not Found instead of
 * 400 Bad Request. Callers can now trust the returned id is a real number.
 */
function parseId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`"${rawId}" is not a valid intern id.`, 400, "INVALID_ID");
  }
  return id;
}

/**
 * Bug fix: previously two interns could be created/updated with the same
 * email address with no server-side objection. Emails identify people in
 * this directory, so duplicates are rejected with 409 Conflict.
 */
function assertEmailNotTaken(email, excludeId) {
  const normalized = email.trim().toLowerCase();
  const clash = store.getAll().find(
    (intern) => intern.email === normalized && intern.id !== excludeId
  );
  if (clash) {
    throw new AppError(`Email ${normalized} is already in use.`, 409, "EMAIL_CONFLICT");
  }
}

/**
 * Every handler is async and forwards errors to next(err), which routes
 * them to the centralized error middleware (see middleware/errorHandler.js).
 * This keeps the "catch" logic in exactly one place, mirroring the
 * try/catch/finally discipline covered in the training deck.
 */

// GET /api/interns  -> 200
async function listInterns(req, res, next) {
  try {
    const { department } = req.query;
    let data = store.getAll();

    if (department) {
      data = data.filter(
        (intern) => intern.department.toLowerCase() === department.toLowerCase()
      );
    }

    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/interns/:id -> 200 | 404
async function getIntern(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const intern = store.getById(id);

    if (!intern) {
      throw new AppError(`Intern with id ${id} not found.`, 404, "NOT_FOUND");
    }

    res.status(200).json({ success: true, data: intern });
  } catch (err) {
    next(err);
  }
}

// POST /api/interns -> 201 | 422
async function createIntern(req, res, next) {
  try {
    validateInternCreate(req.body);
    assertEmailNotTaken(req.body.email);
    const created = store.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

// PUT /api/interns/:id -> 200 | 404 | 422  (idempotent full replace)
async function replaceIntern(req, res, next) {
  try {
    const id = parseId(req.params.id);
    validateInternReplace(req.body);
    assertEmailNotTaken(req.body.email, id);

    const updated = store.replace(id, req.body);
    if (!updated) {
      throw new AppError(`Intern with id ${id} not found.`, 404, "NOT_FOUND");
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/interns/:id -> 200 | 404 | 422  (partial, non-idempotent update)
async function patchIntern(req, res, next) {
  try {
    const id = parseId(req.params.id);
    validateInternPatch(req.body);
    if (req.body.email !== undefined) {
      assertEmailNotTaken(req.body.email, id);
    }

    const updated = store.patch(id, req.body);
    if (!updated) {
      throw new AppError(`Intern with id ${id} not found.`, 404, "NOT_FOUND");
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/interns/:id -> 204 | 404
async function deleteIntern(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const removed = store.remove(id);

    if (!removed) {
      throw new AppError(`Intern with id ${id} not found.`, 404, "NOT_FOUND");
    }

    res.status(204).send(); // No Content — nothing to return on success
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listInterns,
  getIntern,
  createIntern,
  replaceIntern,
  patchIntern,
  deleteIntern,
};
