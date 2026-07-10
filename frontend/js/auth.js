/**
 * auth.js
 * Client-side half of the "login so only you can edit" feature. The
 * JWT itself is opaque to us — we only decode its payload to check
 * expiry locally (no crypto verification happens in the browser; the
 * server re-verifies on every protected request regardless).
 */

const STORAGE_KEY = "interns_directory_token";

export function saveToken(token) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

function decodePayload(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** True only if a token exists and its embedded expiry hasn't passed. */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  const payload = decodePayload(token);
  if (!payload?.exp) return false;

  return Date.now() < payload.exp * 1000;
}

export function currentUsername() {
  const token = getToken();
  const payload = token ? decodePayload(token) : null;
  return payload?.sub || null;
}
