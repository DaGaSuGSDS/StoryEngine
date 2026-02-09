const DEFAULT_TIMEOUT = 4000;

function ensureContainer() {
  let container = document.getElementById("notifications");
  if (!container) {
    container = document.createElement("div");
    container.id = "notifications";
    document.body.appendChild(container);
  }
  return container;
}

export function showNotification(message, type = "info", timeout) {
  const container = ensureContainer();
  const div = document.createElement("div");
  div.className = `notification notification-${type}`;
  div.textContent = message;
  container.appendChild(div);

  const effectiveTimeout =
    typeof timeout === "number" && timeout > 0
      ? timeout
      : DEFAULT_TIMEOUT;

  if (effectiveTimeout) {
    setTimeout(() => {
      if (div.parentNode === container) {
        container.removeChild(div);
      }
    }, effectiveTimeout);
  }
}

export function showError(message, timeout) {
  showNotification(message, "error", timeout);
}

export function showInfo(message, timeout) {
  showNotification(message, "info", timeout);
}

