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
  wrap.appendChild(el("strong", null, "No interns yet"));
  wrap.appendChild(el("span", null, "Click “+ Add Intern” to create the first record."));
  grid.appendChild(wrap);
}

/**
 * Renders the full grid from an array of intern objects.
 * @param {Array} interns
 * @param {{onEdit: Function, onDelete: Function}} handlers
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

    card.appendChild(el("h3", null, intern.name));
    card.appendChild(el("div", "role", intern.role));

    const pill = el("span", "dept-pill", intern.department);
    card.appendChild(pill);

    card.appendChild(el("div", "email", intern.email));
    card.appendChild(el("div", "card-meta", `id:${intern.id} · joined ${intern.joinedOn}`));

    const actions = el("div", "card-actions");
    const editBtn = el("button", "btn btn-ghost btn-sm", "Edit");
    editBtn.type = "button";
    editBtn.addEventListener("click", () => handlers.onEdit(intern));

    const deleteBtn = el("button", "btn btn-ghost btn-sm", "Delete");
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => handlers.onDelete(intern));

    actions.append(editBtn, deleteBtn);
    card.appendChild(actions);

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
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

// ---- Drawer (Add / Edit form) ----------------------------------------
const overlay = document.getElementById("drawerOverlay");
const drawer = document.getElementById("internDrawer");
const drawerTitle = document.getElementById("drawerTitle");

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

  clearFieldErrors();
}

export function closeDrawer() {
  overlay.hidden = true;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

export function clearFieldErrors() {
  ["Name", "Email", "Role", "Department"].forEach((f) => {
    document.getElementById(`err${f}`).textContent = "";
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
