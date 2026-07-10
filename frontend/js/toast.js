/**
 * toast.js
 * Small, self-dismissing status messages. Errors always route through
 * here rather than blocking dialogs — "graceful degradation", per the
 * training deck's Rules of Engagement.
 */

const stack = document.getElementById("toastStack");

export function showToast(message, variant = "success", timeout = 3200) {
  const toast = document.createElement("div");
  toast.className = `toast${variant === "error" ? " toast-error" : ""}`;
  toast.textContent = message;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s ease";
    setTimeout(() => toast.remove(), 200);
  }, timeout);
}
