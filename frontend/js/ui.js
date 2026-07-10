/**
 * ui.js
 * All DOM writes live here. User-supplied data is always injected via
 * .textContent (never innerHTML) to close off XSS — per the Security
 * Warning called out for the UI Injection stage in the training deck.
 */

const grid = document.getElementById("internGrid");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // safe injection, not innerHTML
  return node;
}

export function renderSkeletons(count = 6) {
  grid.replaceChildren();
  for (let i = 0; i < count; i++) {
    grid.appendChild(el("div", "skeleton-card"));
  }
}

export function renderEmptyState() {
  grid.replaceChildren();
  const wrap = el("div", "empty-state");
  wrap.appendChild(el("strong", null, "No interns found"));
  wrap.appendChild(el("span", null, "Try a different search, or click “+ Add Intern” to create one."));
  grid.appendChild(wrap);
}

/**
 * Renders the full grid from an array of intern objects.
 * @param {Array} interns
 * @param {{onEdit, onDelete, onView, onToggleSelect, isAuthenticated: boolean, selectedIds: Set}} handlers
 */
export function renderInterns(interns, handlers) {
  grid.replaceChildren();

  if (!interns.length) {
    renderEmptyState();
    return;
  }

  const fragment = document.createDocumentFragment();

  interns.forEach((intern) => {
    const card = el("article", "intern-card");
    card.dataset.dept = intern.department;

    const headerRow = el("div", "card-header-row");

    if (handlers.isAuthenticated) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "card-checkbox";
      checkbox.checked = handlers.selectedIds.has(intern.id);
      checkbox.setAttribute("aria-label", `Select ${intern.name}`);
      checkbox.addEventListener("change", () => handlers.onToggleSelect(intern.id, checkbox.checked));
      headerRow.appendChild(checkbox);
    }

    const nameBtn = el("button", "intern-name-link", intern.name);
    nameBtn.type = "button";
    nameBtn.addEventListener("click", () => handlers.onView(intern));
    headerRow.appendChild(nameBtn);

    card.appendChild(headerRow);
    card.appendChild(el("div", "role", intern.role));

    const pill = el("span", "dept-pill", intern.department);
    card.appendChild(pill);

    card.appendChild(el("div", "email", intern.email));
    card.appendChild(el("div", "card-meta", `id:${intern.id} · joined ${intern.joinedOn}`));

    if (handlers.isAuthenticated) {
      const actions = el("div", "card-actions");
      const editBtn = el("button", "btn btn-ghost btn-sm", "Edit");
      editBtn.type = "button";
      editBtn.addEventListener("click", () => handlers.onEdit(intern));

      const deleteBtn = el("button", "btn btn-ghost btn-sm", "Delete");
      deleteBtn.type = "button";
      deleteBtn.addEventListener("click", () => handlers.onDelete(intern));

      actions.append(editBtn, deleteBtn);
      card.appendChild(actions);
    }

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

// ---- Pagination --------------------------------------------------------
const paginationEl = document.getElementById("pagination");

export function renderPagination(pagination, onPageChange) {
  paginationEl.replaceChildren();
  if (!pagination || pagination.totalPages <= 1) return;

  const { page, totalPages } = pagination;

  const prevBtn = el("button", "btn btn-ghost btn-sm", "‹ Prev");
  prevBtn.type = "button";
  prevBtn.disabled = page <= 1;
  prevBtn.addEventListener("click", () => onPageChange(page - 1));

  const label = el("span", "pagination-label", `Page ${page} of ${totalPages}`);

  const nextBtn = el("button", "btn btn-ghost btn-sm", "Next ›");
  nextBtn.type = "button";
  nextBtn.disabled = page >= totalPages;
  nextBtn.addEventListener("click", () => onPageChange(page + 1));

  paginationEl.append(prevBtn, label, nextBtn);
}

// ---- Bulk toolbar --------------------------------------------------------
const bulkToolbar = document.getElementById("bulkToolbar");
const selectedCountLabel = document.getElementById("selectedCountLabel");
const selectAllCheckbox = document.getElementById("selectAllCheckbox");

export function updateBulkToolbar(selectedCount, totalOnPage) {
  bulkToolbar.hidden = selectedCount === 0;
  selectedCountLabel.textContent = `${selectedCount} selected`;
  selectAllCheckbox.checked = selectedCount > 0 && selectedCount === totalOnPage;
  selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalOnPage;
}

// ---- Error banner --------------------------------------------------
const errorBanner = document.getElementById("errorBanner");
const errorBannerText = document.getElementById("errorBannerText");

export function showErrorBanner(message) {
  errorBannerText.textContent = message;
  errorBanner.hidden = false;
}

export function hideErrorBanner() {
  errorBanner.hidden = true;
}

// ---- API status pill -------------------------------------------------
const apiStatusEl = document.getElementById("apiStatus");
const apiStatusLabel = apiStatusEl.querySelector(".status-label");

export function setApiStatus(state) {
  apiStatusEl.dataset.state = state;
  apiStatusLabel.textContent =
    state === "online" ? "API connected" : state === "offline" ? "API offline" : "Checking API…";
}

// ---- Auth-gated visibility --------------------------------------------
const addInternBtn = document.getElementById("addInternBtn");
const loginBtn = document.getElementById("loginBtn");
const userMenu = document.getElementById("userMenu");
const usernameLabel = document.getElementById("usernameLabel");

export function setAuthUI(isAuthenticated, username) {
  addInternBtn.hidden = !isAuthenticated;
  loginBtn.hidden = isAuthenticated;
  userMenu.hidden = !isAuthenticated;
  usernameLabel.textContent = username ? `Signed in as ${username}` : "";
  if (!isAuthenticated) {
    bulkToolbar.hidden = true;
  }
}

// ---- Drawer (Add / Edit form) ----------------------------------------
const overlay = document.getElementById("drawerOverlay");
const drawer = document.getElementById("internDrawer");
const drawerTitle = document.getElementById("drawerTitle");

const EXTENDED_FIELDS = ["Phone", "Manager", "Linkedin", "Notes"];

export function openDrawer(mode, intern) {
  drawerTitle.textContent = mode === "edit" ? "Edit intern" : "Add Intern";
  overlay.hidden = false;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");

  document.getElementById("internId").value = intern?.id ?? "";
  document.getElementById("internName").value = intern?.name ?? "";
  document.getElementById("internEmail").value = intern?.email ?? "";
  document.getElementById("internRole").value = intern?.role ?? "";
  document.getElementById("internDepartment").value = intern?.department ?? "";
  document.getElementById("internPhone").value = intern?.phone ?? "";
  document.getElementById("internManager").value = intern?.manager ?? "";
  document.getElementById("internLinkedin").value = intern?.linkedin ?? "";
  document.getElementById("internNotes").value = intern?.notes ?? "";

  clearFieldErrors();
}

export function closeDrawer() {
  overlay.hidden = true;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

export function clearFieldErrors() {
  ["Name", "Email", "Role", "Department", ...EXTENDED_FIELDS].forEach((f) => {
    const target = document.getElementById(`err${f}`);
    if (target) target.textContent = "";
  });
}

export function setFieldError(field, message) {
  const target = document.getElementById(`err${field}`);
  if (target) target.textContent = message;
}

export function setSubmitLoading(isLoading) {
  const btn = document.getElementById("drawerSubmit");
  btn.disabled = isLoading;
  btn.querySelector(".btn-label").hidden = isLoading;
  btn.querySelector(".btn-spinner").hidden = !isLoading;
}

// ---- Profile drawer (read-only) ---------------------------------------
const profileOverlay = document.getElementById("profileOverlay");
const profileDrawer = document.getElementById("profileDrawer");
const profileBody = document.getElementById("profileBody");
const profileActions = document.getElementById("profileActions");

function profileRow(label, value) {
  const row = el("div", "profile-row");
  row.appendChild(el("span", "profile-label", label));
  row.appendChild(el("span", "profile-value", value || "—"));
  return row;
}

export function openProfileDrawer(intern, { isAuthenticated, onEdit, onDelete } = {}) {
  profileBody.replaceChildren();
  profileBody.appendChild(profileRow("Name", intern.name));
  profileBody.appendChild(profileRow("Role", intern.role));
  profileBody.appendChild(profileRow("Department", intern.department));
  profileBody.appendChild(profileRow("Email", intern.email));
  profileBody.appendChild(profileRow("Phone", intern.phone));
  profileBody.appendChild(profileRow("Manager", intern.manager));
  profileBody.appendChild(profileRow("LinkedIn", intern.linkedin));
  profileBody.appendChild(profileRow("Joined", intern.joinedOn));
  profileBody.appendChild(profileRow("Notes", intern.notes));

  profileActions.replaceChildren();
  if (isAuthenticated) {
    const editBtn = el("button", "btn btn-primary", "Edit");
    editBtn.type = "button";
    editBtn.addEventListener("click", () => onEdit(intern));

    const deleteBtn = el("button", "btn btn-ghost", "Delete");
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => onDelete(intern));

    profileActions.append(deleteBtn, editBtn);
  }

  profileOverlay.hidden = false;
  profileDrawer.classList.add("open");
  profileDrawer.setAttribute("aria-hidden", "false");
}

export function closeProfileDrawer() {
  profileOverlay.hidden = true;
  profileDrawer.classList.remove("open");
  profileDrawer.setAttribute("aria-hidden", "true");
}

// ---- Login modal -------------------------------------------------------
const loginOverlay = document.getElementById("loginOverlay");
const loginModal = document.getElementById("loginModal");
const loginError = document.getElementById("loginError");

export function openLoginModal() {
  loginOverlay.hidden = false;
  loginModal.hidden = false;
  loginError.textContent = "";
  document.getElementById("loginUsername").focus();
}

export function closeLoginModal() {
  loginOverlay.hidden = true;
  loginModal.hidden = true;
  document.getElementById("loginForm").reset();
  loginError.textContent = "";
}

export function setLoginError(message) {
  loginError.textContent = message;
}

export function setLoginLoading(isLoading) {
  const btn = document.getElementById("loginSubmit");
  btn.disabled = isLoading;
  btn.querySelector(".btn-label").hidden = isLoading;
  btn.querySelector(".btn-spinner").hidden = !isLoading;
}

// ---- Theme toggle icon ---------------------------------------------------
export function setThemeIcon(theme) {
  document.getElementById("themeToggle").textContent = theme === "dark" ? "☀️" : "🌙";
}
