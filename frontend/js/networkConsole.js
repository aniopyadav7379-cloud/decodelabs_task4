/**
 * networkConsole.js
 * Renders a small, live log of every request/response this page makes —
 * turning the normally invisible network layer (Stage 1-3 of the I-P-O
 * model) into something visible and legible for demo/training purposes.
 */

const consoleBody = document.getElementById("consoleBody");
const consoleEl = document.getElementById("networkConsole");
const toggleBtn = document.getElementById("consoleToggle");

function statusClass(status) {
  if (status >= 200 && status < 300) return "status-2xx";
  if (status >= 400 && status < 500) return "status-4xx";
  if (status >= 500) return "status-5xx";
  return "status-pending";
}

export function logNetworkEvent(event) {
  const line = document.createElement("div");
  const time = new Date().toLocaleTimeString([], { hour12: false });

  if (event.type === "pending") {
    line.className = "console-line status-pending";
    line.textContent = `[${time}] → ${event.method} ${event.url}`;
  } else {
    line.className = `console-line ${statusClass(event.status)}`;
    line.textContent = `[${time}] ← ${event.status} ${event.method} ${event.url}`;
  }

  consoleBody.appendChild(line);
  consoleBody.scrollTop = consoleBody.scrollHeight;

  // Keep the log bounded so it doesn't grow unbounded during a long session.
  while (consoleBody.children.length > 50) {
    consoleBody.removeChild(consoleBody.firstChild);
  }
}

toggleBtn.addEventListener("click", () => {
  const collapsed = consoleEl.classList.toggle("collapsed");
  toggleBtn.textContent = collapsed ? "▸" : "▾";
});
