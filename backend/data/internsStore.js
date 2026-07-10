/**
 * internsStore
 * An in-memory "database" for the training kit. Swap this module for a
 * real repository (Postgres/Mongo) without touching controllers — the
 * public shape (get/getById/create/replace/patch/remove/query) stays
 * the same.
 */

let interns = [
  {
    id: 1,
    name: "Alex Rivera",
    email: "alex.rivera@decodelabs.tech",
    role: "Frontend Intern",
    department: "Engineering",
    joinedOn: "2026-01-12",
    phone: "+1 415 555 0132",
    manager: "Sam Okafor",
    linkedin: "https://linkedin.com/in/alexrivera",
    notes: "Working on the design-system component library this quarter.",
  },
  {
    id: 2,
    name: "Priya Nair",
    email: "priya.nair@decodelabs.tech",
    role: "Backend Intern",
    department: "Engineering",
    joinedOn: "2026-02-03",
    phone: "+91 98765 43210",
    manager: "Sam Okafor",
    linkedin: "https://linkedin.com/in/priyanair",
    notes: "Owns the interns API's test coverage.",
  },
  {
    id: 3,
    name: "Jordan Lee",
    email: "jordan.lee@decodelabs.tech",
    role: "UI/UX Intern",
    department: "Design",
    joinedOn: "2026-02-18",
    phone: "",
    manager: "Riya Kapoor",
    linkedin: "",
    notes: "",
  },
];

let nextId = 4;

const EXTRA_FIELDS = ["phone", "manager", "linkedin", "notes"];

function buildExtras(payload) {
  const extras = {};
  EXTRA_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) extras[field] = String(payload[field]).trim();
  });
  return extras;
}

const getAll = () => interns;

const getById = (id) => interns.find((intern) => intern.id === id);

const create = (payload) => {
  const newIntern = {
    id: nextId++,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    role: payload.role.trim(),
    department: payload.department,
    joinedOn: new Date().toISOString().slice(0, 10),
    phone: "",
    manager: "",
    linkedin: "",
    notes: "",
    ...buildExtras(payload),
  };
  interns.push(newIntern);
  return newIntern;
};

const replace = (id, payload) => {
  const index = interns.findIndex((intern) => intern.id === id);
  if (index === -1) return null;

  const existing = interns[index];
  const updated = {
    ...existing,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    role: payload.role.trim(),
    department: payload.department,
    phone: "",
    manager: "",
    linkedin: "",
    notes: "",
    ...buildExtras(payload),
  };
  interns[index] = updated;
  return updated;
};

const patch = (id, payload) => {
  const index = interns.findIndex((intern) => intern.id === id);
  if (index === -1) return null;

  const existing = interns[index];
  const updated = {
    ...existing,
    ...("name" in payload && { name: payload.name.trim() }),
    ...("email" in payload && { email: payload.email.trim().toLowerCase() }),
    ...("role" in payload && { role: payload.role.trim() }),
    ...("department" in payload && { department: payload.department }),
    ...buildExtras(payload),
  };
  interns[index] = updated;
  return updated;
};

const remove = (id) => {
  const index = interns.findIndex((intern) => intern.id === id);
  if (index === -1) return false;
  interns.splice(index, 1);
  return true;
};

/** Removes many at once; returns the ids that were actually found and removed. */
const removeMany = (ids) => {
  const removedIds = [];
  ids.forEach((id) => {
    const index = interns.findIndex((intern) => intern.id === id);
    if (index !== -1) {
      interns.splice(index, 1);
      removedIds.push(id);
    }
  });
  return removedIds;
};

/**
 * Central query function backing both the list endpoint and the export
 * endpoint, so "what you see is what you export" — search/filter/sort
 * logic lives in exactly one place.
 *
 * @param {{department?, search?, sort?, order?}} filters
 */
function queryAll({ department, search, sort, order } = {}) {
  let result = [...interns];

  if (department) {
    result = result.filter(
      (intern) => intern.department.toLowerCase() === department.toLowerCase()
    );
  }

  if (search) {
    const needle = search.trim().toLowerCase();
    result = result.filter(
      (intern) =>
        intern.name.toLowerCase().includes(needle) ||
        intern.email.toLowerCase().includes(needle) ||
        intern.role.toLowerCase().includes(needle)
    );
  }

  const sortableFields = ["name", "department", "joinedOn", "role"];
  const sortField = sortableFields.includes(sort) ? sort : "joinedOn";
  const direction = order === "desc" ? -1 : 1;

  result.sort((a, b) => {
    if (a[sortField] < b[sortField]) return -1 * direction;
    if (a[sortField] > b[sortField]) return 1 * direction;
    return 0;
  });

  return result;
}

function paginate(list, page = 1, limit = 9) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 9));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const clampedPage = Math.min(safePage, totalPages);
  const start = (clampedPage - 1) * safeLimit;

  return {
    data: list.slice(start, start + safeLimit),
    pagination: { page: clampedPage, limit: safeLimit, total, totalPages },
  };
}

module.exports = {
  getAll,
  getById,
  create,
  replace,
  patch,
  remove,
  removeMany,
  queryAll,
  paginate,
};
