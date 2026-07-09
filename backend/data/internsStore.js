/**
 * internsStore
 * An in-memory "database" for the training kit. Swap this module for a
 * real repository (Postgres/Mongo) without touching controllers — the
 * public shape (get/getById/create/replace/patch/remove) stays the same.
 */

let interns = [
  {
    id: 1,
    name: "Alex Rivera",
    email: "alex.rivera@decodelabs.tech",
    role: "Frontend Intern",
    department: "Engineering",
    joinedOn: "2026-01-12",
  },
  {
    id: 2,
    name: "Priya Nair",
    email: "priya.nair@decodelabs.tech",
    role: "Backend Intern",
    department: "Engineering",
    joinedOn: "2026-02-03",
  },
  {
    id: 3,
    name: "Jordan Lee",
    email: "jordan.lee@decodelabs.tech",
    role: "UI/UX Intern",
    department: "Design",
    joinedOn: "2026-02-18",
  },
];

let nextId = 4;

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

module.exports = { getAll, getById, create, replace, patch, remove };
