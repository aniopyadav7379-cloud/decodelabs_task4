const store = require("../data/internsStore");
const AppError = require("../utils/AppError");
const { toCsv } = require("../utils/csv");
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
// Supports ?department=, ?search=, ?sort=name|department|joinedOn|role,
// ?order=asc|desc, ?page=, ?limit= — the same query the export endpoint
// below reuses, so what's on screen always matches what gets exported.
async function listInterns(req, res, next) {
  try {
    const { department, search, sort, order, page, limit } = req.query;
    const filtered = store.queryAll({ department, search, sort, order });
    const { data, pagination } = store.paginate(filtered, page, limit || process.env.DEFAULT_PAGE_SIZE);

    res.status(200).json({ success: true, data, pagination });
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

// POST /api/interns/bulk-delete  { ids: [1,2,3] }  -> 200 | 422
async function bulkDeleteInterns(req, res, next) {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every(Number.isInteger)) {
      throw new AppError("ids must be a non-empty array of integers.", 422, "VALIDATION_ERROR");
    }
    const removedIds = store.removeMany(ids);
    res.status(200).json({ success: true, data: { removedIds, requested: ids.length } });
  } catch (err) {
    next(err);
  }
}

// GET /api/interns/export?format=csv|json — mirrors the current list query,
// minus pagination, so the export always matches what's filtered on screen.
async function exportInterns(req, res, next) {
  try {
    const { department, search, sort, order, format = "csv" } = req.query;
    const data = store.queryAll({ department, search, sort, order });
    const columns = ["id", "name", "email", "role", "department", "joinedOn", "phone", "manager", "linkedin", "notes"];

    if (format === "json") {
      res.setHeader("Content-Disposition", 'attachment; filename="interns.json"');
      res.status(200).json({ success: true, data });
      return;
    }

    if (format !== "csv") {
      throw new AppError('format must be "csv" or "json".', 422, "VALIDATION_ERROR");
    }

    const csv = toCsv(data, columns);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="interns.csv"');
    res.status(200).send(csv);
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
  bulkDeleteInterns,
  exportInterns,
};
