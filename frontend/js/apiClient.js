/**
 * apiClient.js
 * A thin, deliberate wrapper around the native fetch() API.
 *
 * Responsibilities:
 *  - Always set the right headers/config (Stage 1: Input)
 *  - Always check response.ok before trusting the payload (Stage 2/3 gate)
 *  - Always parse JSON safely, even on error responses
 *  - Never swallow errors — throw a typed ApiError the caller can catch
 */

import { API_BASE_URL } from "./config.js";

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

  onLog?.({ type: "pending", method, url });

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

export const internsApi = {
  list(department, onLog) {
    const query = department ? `?department=${encodeURIComponent(department)}` : "";
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

  health(onLog) {
    return request("/health", { method: "GET" }, onLog);
  },
};
