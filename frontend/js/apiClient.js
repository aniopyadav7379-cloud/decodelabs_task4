/**
 * apiClient.js
 * A thin, deliberate wrapper around the native fetch() API.
 *
 * Responsibilities:
 *  - Always set the right headers/config (Stage 1: Input)
 *  - Always check response.ok before trusting the payload (Stage 2/3 gate)
 *  - Always parse JSON safely, even on error responses
 *  - Never swallow errors — throw a typed ApiError the caller can catch
 *  - Attach the auth token to every request when one is present
 */

import { API_BASE_URL } from "./config.js";
import { getToken } from "./auth.js";

const BASE_URL = API_BASE_URL;

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Core request function. Every CRUD helper below funnels through this,
 * so the "check status -> parse JSON -> throw on failure" logic lives
 * in exactly one place (mirrors the try/catch/finally discipline from
 * the training deck — no repeated, drifting error handling per call).
 */
async function request(path, options = {}, onLog) {
  const url = `${BASE_URL}${path}`;
  const method = options.method || "GET";
  const token = getToken();

  onLog?.({ type: "pending", method, url });

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // The body might be empty (204 No Content) — guard before parsing.
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : null;

  onLog?.({ type: "response", method, url, status: response.status });

  if (!response.ok) {
    const message = body?.error?.message || `Request failed with status ${response.status}`;
    const code = body?.error?.code || "UNKNOWN_ERROR";
    throw new ApiError(message, response.status, code);
  }

  return body;
}

/** Builds a query string from a filters object, skipping empty values. */
function buildQuery(params = {}) {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!usable.length) return "";
  return `?${usable.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`;
}

export const internsApi = {
  list({ department, search, sort, order, page, limit } = {}, onLog) {
    const query = buildQuery({ department, search, sort, order, page, limit });
    return request(`/interns${query}`, { method: "GET" }, onLog);
  },

  create(payload, onLog) {
    return request("/interns", { method: "POST", body: JSON.stringify(payload) }, onLog);
  },

  update(id, payload, onLog) {
    // PUT = full, idempotent replace — matches the REST semantics taught in the deck.
    return request(`/interns/${id}`, { method: "PUT", body: JSON.stringify(payload) }, onLog);
  },

  remove(id, onLog) {
    return request(`/interns/${id}`, { method: "DELETE" }, onLog);
  },

  bulkRemove(ids, onLog) {
    return request("/interns/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }, onLog);
  },

  health(onLog) {
    return request("/health", { method: "GET" }, onLog);
  },

  /** Builds a direct download URL for the export endpoint (used as an <a href>, not fetched). */
  exportUrl({ department, search, sort, order, format }) {
    const query = buildQuery({ department, search, sort, order, format });
    return `${BASE_URL}/interns/export${query}`;
  },
};

export const authApi = {
  login(username, password, onLog) {
    return request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }, onLog);
  },
};
