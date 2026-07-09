/**
 * app.js
 * Application controller. Every user action follows the same shape:
 *   try   -> call the API (await)
 *   catch -> surface a clear, actionable message (never a silent failure)
 *   finally -> reset loading state (spinner/skeleton), regardless of outcome
 */

import { internsApi, ApiError } from "./apiClient.js";
import { logNetworkEvent } from "./networkConsole.js";
import { showToast } from "./toast.js";
import {
  renderSkeletons,
  renderInterns,
  showErrorBanner,
  hideErrorBanner,
  setApiStatus,
  openDrawer,
  closeDrawer,
  clearFieldErrors,
  setFieldError,
  setSubmitLoading,
} from "./ui.js";

const departmentFilter = document.getElementById("departmentFilter");
const refreshBtn = document.getElementById("refreshBtn");
const addInternBtn = document.getElementById("addInternBtn");
const errorBannerRetry = document.getElementById("errorBannerRetry");

const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose = document.getElementById("drawerClose");
const drawerCancel = document.getElementById("drawerCancel");
const internForm = document.getElementById("internForm");

let currentDepartment = "";

// Bug fix: clicking "Refresh" or switching the department filter quickly
// fired overlapping requests. If an older request resolved after a newer
// one (common on flaky networks), it would render stale data over the
// current view. requestSeq guards against that by only rendering the
// response from the most recently *issued* request.
let requestSeq = 0;

// ---- Loading interns ---------------------------------------------------
async function loadInterns() {
  const seq = ++requestSeq;
  renderSkeletons();
  hideErrorBanner();

  try {
    const result = await internsApi.list(currentDepartment, logNetworkEvent);
    if (seq !== requestSeq) return; // a newer request has since been issued — discard this one
    renderInterns(result.data, { onEdit: handleEdit, onDelete: handleDelete });
  } catch (err) {
    if (seq !== requestSeq) return;
    // Graceful degradation: keep the page usable, explain what happened.
    const message =
      err instanceof ApiError
        ? err.message
        : "Couldn't reach the server. Check that the backend is running.";
    showErrorBanner(message);
    renderInterns([], { onEdit: handleEdit, onDelete: handleDelete });
  }
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

/** Client-side validation mirrors the server's rules so users get instant feedback. */
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
    if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
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
    await loadInterns();
  } catch (err) {
    showToast("Couldn't delete this intern. Please try again.", "error");
  }
}

// ---- Event wiring ----------------------------------------------------
departmentFilter.addEventListener("change", (e) => {
  currentDepartment = e.target.value;
  loadInterns();
});

refreshBtn.addEventListener("click", loadInterns);
errorBannerRetry.addEventListener("click", loadInterns);

addInternBtn.addEventListener("click", handleAdd);
drawerClose.addEventListener("click", closeAndResetDrawer);
drawerCancel.addEventListener("click", closeAndResetDrawer);
drawerOverlay.addEventListener("click", closeAndResetDrawer);
internForm.addEventListener("submit", handleFormSubmit);

// ---- Init ----------------------------------------------------------------
// Independent requests fire in parallel (Promise.all) rather than serially —
// avoids the "await inside a loop" anti-pattern covered in the deck.
(async function init() {
  await Promise.all([checkApiHealth(), loadInterns()]);
})();
