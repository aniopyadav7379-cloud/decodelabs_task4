/**
 * config.js
 * Deployment fix: the API base URL used to be hardcoded inside
 * apiClient.js as "http://localhost:5000/api", which only ever worked
 * on localhost. This file is the single place to point the frontend at
 * a different backend (staging, production, etc.) without touching
 * application logic.
 *
 * Override at deploy time in one of two ways:
 *   1. Edit API_BASE_URL below before deploying this static site, or
 *   2. Set window.__API_BASE_URL__ = "https://decodelabs-task4.onrender.com/api";
 *      in a small inline <script> in index.html (useful if the same
 *      build is deployed to multiple environments).
 */
const DEFAULT_LOCAL_API = "http://localhost:5000/api";

export const API_BASE_URL = window.__API_BASE_URL__ || DEFAULT_LOCAL_API;
