/**
 * app.js
 * Application controller. Every user action follows the same shape:
 *   try   -> call the API (await)
 *   catch -> surface a clear, actionable message (never a silent failure)
 *   finally -> reset loading state (spinner/skeleton), regardless of outcome
 */

import { internsApi, authApi, ApiError } from "./apiClient.js";
import { logNetworkEvent } from "./networkConsole.js";
import { showToast } from "./toast.js";
import { saveToken, clearToken, isAuthenticated, currentUsername } from "./auth.js";
import { getTheme, toggleTheme } from "./theme.js";
import {
  renderSkeletons,
  renderInterns,
  renderPagination,
  updateBulkToolbar,
  showErrorBanner,
  hideErrorBanner,
  setApiStatus,
  setAuthUI,
  openDrawer,
  closeDrawer,
  clearFieldErrors,
  setFieldError,
  setSubmitLoading,
  openProfileDrawer,
  closeProfileDrawer,
  openLoginModal,
  closeLoginModal,
  setLoginError,
  setLoginLoading,
  setThemeIcon,
} from "./ui.js";

// ---- Element refs ---------------------------------------------------
const searchInput = document.getElementById("searchInput");
const departmentFilter = document.getElementById("departmentFilter");
const sortField = document.getElementById("sortField");
const sortOrderBtn = document.getElementById("sortOrderBtn");
const refreshBtn = document.getElementById("refreshBtn");
const addInternBtn = document.getElementById("addInternBtn");
const errorBannerRetry = document.getElementById("errorBannerRetry");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");

const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose = document.getElementById("drawerClose");
const drawerCancel = document.getElementById("drawerCancel");
const internForm = document.getElementById("internForm");

const profileOverlay = document.getElementById("profileOverlay");
const profileClose = document.getElementById("profileClose");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginOverlay = document.getElementById("loginOverlay");
const loginClose = document.getElementById("loginClose");
const loginCancel = document.getElementById("loginCancel");
const loginForm = document.getElementById("loginForm");

const themeToggle = document.getElementById("themeToggle");

const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
const selectAllCheckbox = document.getElementById("selectAllCheckbox");

// ---- State ------------------------------------------------------------
const filters = { department: "", search: "", sort: "joinedOn", order: "desc", page: 1, limit: 9 };
let currentInterns = [];
const selectedIds = new Set();
let requestSeq = 0; // guards against stale, out-of-order responses (see loadInterns)
let searchDebounceTimer = null;

// ---- Auth-gated UI refresh ---------------------------------------------
function refreshAuthUI() {
  const authed = isAuthenticated();
  setAuthUI(authed, authed ? currentUsername() : null);
  if (!authed) {
    selectedIds.clear();
    updateBulkToolbar(0, 0);
  }
}

/** Centralizes the "your session expired" flow so every mutating call handles it the same way. */
function handleAuthExpiry() {
  clearToken();
  refreshAuthUI();
  showToast("Your session expired. Please log in again.", "error");
  openLoginModal();
}

// ---- Loading interns ---------------------------------------------------
function updateExportLinks() {
  exportCsvBtn.href = internsApi.exportUrl({ ...filters, format: "csv" });
  exportJsonBtn.href = internsApi.exportUrl({ ...filters, format: "json" });
}

async function loadInterns() {
  const seq = ++requestSeq;
  renderSkeletons();
  hideErrorBanner();
  updateExportLinks();

  try {
    const result = await internsApi.list(filters, logNetworkEvent);
    if (seq !== requestSeq) return; // a newer request has since been issued — discard this one

    currentInterns = result.data;
    // Drop selections for interns no longer visible (page/filter changed underneath them).
    const visibleIds = new Set(currentInterns.map((i) => i.id));
    [...selectedIds].forEach((id) => { if (!visibleIds.has(id)) selectedIds.delete(id); });

    renderInterns(currentInterns, {
      onEdit: handleEdit,
      onDelete: handleDelete,
      onView: handleView,
      onToggleSelect: handleToggleSelect,
      isAuthenticated: isAuthenticated(),
      selectedIds,
    });
    renderPagination(result.pagination, handlePageChange);
    updateBulkToolbar(selectedIds.size, currentInterns.length);
  } catch (err) {
    if (seq !== requestSeq) return;
    const message =
      err instanceof ApiError
        ? err.message
        : "Couldn't reach the server. Check that the backend is running.";
    showErrorBanner(message);
    renderInterns([], { onEdit: handleEdit, onDelete: handleDelete, onView: handleView, onToggleSelect: handleToggleSelect, isAuthenticated: isAuthenticated(), selectedIds });
  }
}

function handlePageChange(page) {
  filters.page = page;
  loadInterns();
}

// ---- API health indicator ----------------------------------------------
async function checkApiHealth() {
  try {
    await internsApi.health(logNetworkEvent);
    setApiStatus("online");
  } catch {
    setApiStatus("offline");
  }
}

// ---- Bulk selection ------------------------------------------------------
function handleToggleSelect(id, checked) {
  if (checked) selectedIds.add(id); else selectedIds.delete(id);
  updateBulkToolbar(selectedIds.size, currentInterns.length);
}

selectAllCheckbox.addEventListener("change", (e) => {
  if (e.target.checked) {
    currentInterns.forEach((i) => selectedIds.add(i.id));
  } else {
    selectedIds.clear();
  }
  renderInterns(currentInterns, {
    onEdit: handleEdit, onDelete: handleDelete, onView: handleView,
    onToggleSelect: handleToggleSelect, isAuthenticated: isAuthenticated(), selectedIds,
  });
  updateBulkToolbar(selectedIds.size, currentInterns.length);
});

bulkDeleteBtn.addEventListener("click", async () => {
  if (selectedIds.size === 0) return;
  const confirmed = window.confirm(`Delete ${selectedIds.size} selected intern(s)? This can't be undone.`);
  if (!confirmed) return;

  try {
    await internsApi.bulkRemove([...selectedIds], logNetworkEvent);
    showToast(`Deleted ${selectedIds.size} intern(s)`);
    selectedIds.clear();
    await loadInterns();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return handleAuthExpiry();
    showToast("Couldn't delete the selected interns. Please try again.", "error");
  }
});

// ---- Add / Edit drawer ---------------------------------------------------
function handleAdd() {
  openDrawer("add", null);
}

function handleEdit(intern) {
  openDrawer("edit", intern);
}

function closeAndResetDrawer() {
  closeDrawer();
  internForm.reset();
  clearFieldErrors();
}

/** Client-side validation mirrors the server's required-field rules for instant feedback. */
function validateFormLocally(payload) {
  let valid = true;
  clearFieldErrors();

  if (!payload.name || payload.name.trim().length < 2) {
    setFieldError("Name", "Name must be at least 2 characters.");
    valid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    setFieldError("Email", "Enter a valid email address.");
    valid = false;
  }
  if (!payload.role || payload.role.trim().length < 2) {
    setFieldError("Role", "Role is required.");
    valid = false;
  }
  if (!payload.department) {
    setFieldError("Department", "Please select a department.");
    valid = false;
  }
  if (payload.linkedin && !/^https?:\/\/([\w-]+\.)?linkedin\.com\/.*$/i.test(payload.linkedin)) {
    setFieldError("Linkedin", "Must be a linkedin.com URL, or left blank.");
    valid = false;
  }
  return valid;
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById("internId").value;
  const payload = {
    name: document.getElementById("internName").value,
    email: document.getElementById("internEmail").value,
    role: document.getElementById("internRole").value,
    department: document.getElementById("internDepartment").value,
    phone: document.getElementById("internPhone").value,
    manager: document.getElementById("internManager").value,
    linkedin: document.getElementById("internLinkedin").value,
    notes: document.getElementById("internNotes").value,
  };

  if (!validateFormLocally(payload)) return;

  setSubmitLoading(true);
  try {
    if (id) {
      await internsApi.update(Number(id), payload, logNetworkEvent);
      showToast(`Updated ${payload.name}`);
    } else {
      await internsApi.create(payload, logNetworkEvent);
      showToast(`Added ${payload.name}`);
    }
    closeAndResetDrawer();
    await loadInterns();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return handleAuthExpiry();
    if (err instanceof ApiError && (err.code === "VALIDATION_ERROR" || err.code === "EMAIL_CONFLICT")) {
      showToast(err.message, "error");
    } else {
      showToast("Something went wrong saving this intern. Please try again.", "error");
    }
  } finally {
    setSubmitLoading(false);
  }
}

// ---- Delete --------------------------------------------------------------
async function handleDelete(intern) {
  const confirmed = window.confirm(`Remove ${intern.name} from the directory?`);
  if (!confirmed) return;

  try {
    await internsApi.remove(intern.id, logNetworkEvent);
    showToast(`Removed ${intern.name}`);
    closeProfileDrawer();
    await loadInterns();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return handleAuthExpiry();
    showToast("Couldn't delete this intern. Please try again.", "error");
  }
}

// ---- Profile (read-only detail view) ------------------------------------
function handleView(intern) {
  openProfileDrawer(intern, {
    isAuthenticated: isAuthenticated(),
    onEdit: (i) => { closeProfileDrawer(); handleEdit(i); },
    onDelete: (i) => handleDelete(i),
  });
}

// ---- Auth: login / logout ------------------------------------------------
loginBtn.addEventListener("click", openLoginModal);
loginClose.addEventListener("click", closeLoginModal);
loginCancel.addEventListener("click", closeLoginModal);
loginOverlay.addEventListener("click", closeLoginModal);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  setLoginLoading(true);
  try {
    const result = await authApi.login(username, password, logNetworkEvent);
    saveToken(result.data.token);
    closeLoginModal();
    refreshAuthUI();
    showToast(`Welcome back, ${result.data.username}`);
    await loadInterns();
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Couldn't log in. Please try again.";
    setLoginError(message);
  } finally {
    setLoginLoading(false);
  }
});

logoutBtn.addEventListener("click", () => {
  clearToken();
  refreshAuthUI();
  showToast("Logged out");
  loadInterns();
});

// ---- Theme toggle ----------------------------------------------------
themeToggle.addEventListener("click", () => {
  const next = toggleTheme();
  setThemeIcon(next);
});

// ---- Event wiring: search / filter / sort -------------------------------
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    filters.search = e.target.value;
    filters.page = 1;
    loadInterns();
  }, 300);
});

departmentFilter.addEventListener("change", (e) => {
  filters.department = e.target.value;
  filters.page = 1;
  loadInterns();
});

sortField.addEventListener("change", (e) => {
  filters.sort = e.target.value;
  filters.page = 1;
  loadInterns();
});

sortOrderBtn.addEventListener("click", () => {
  filters.order = filters.order === "asc" ? "desc" : "asc";
  sortOrderBtn.textContent = filters.order === "asc" ? "↑ Asc" : "↓ Desc";
  filters.page = 1;
  loadInterns();
});

refreshBtn.addEventListener("click", loadInterns);
errorBannerRetry.addEventListener("click", loadInterns);

addInternBtn.addEventListener("click", handleAdd);
drawerClose.addEventListener("click", closeAndResetDrawer);
drawerCancel.addEventListener("click", closeAndResetDrawer);
drawerOverlay.addEventListener("click", closeAndResetDrawer);
internForm.addEventListener("submit", handleFormSubmit);

profileClose.addEventListener("click", closeProfileDrawer);
profileOverlay.addEventListener("click", closeProfileDrawer);

// ---- Init ----------------------------------------------------------------
setThemeIcon(getTheme());
refreshAuthUI();

// Independent requests fire in parallel (Promise.all) rather than serially —
// avoids the "await inside a loop" anti-pattern covered in the deck.
(async function init() {
  await Promise.all([checkApiHealth(), loadInterns()]);
})();
