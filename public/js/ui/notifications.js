const DEFAULT_TIMEOUT = 4000;

/**
 * Ensures the notification container exists in the DOM.
 * @returns {HTMLElement}
 */
function ensureContainer() {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notifications";
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Shows a notification message.
 * @param {string} message - Text to display.
 * @param {string} [type="info"] - CSS class suffix (info, error).
 * @param {number} [timeout] - Duration in ms (default 4000).
 */
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

/**
 * Helper to show an error notification.
 * @param {string} message
 * @param {number} [timeout]
 */
export function showError(message, timeout) {
  showNotification(message, "error", timeout);
}

/**
 * Helper to show an info notification.
 * @param {string} message
 * @param {number} [timeout]
 */
export function showInfo(message, timeout) {
  showNotification(message, "info", timeout);
}

