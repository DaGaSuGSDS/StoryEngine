/**
 * Escapes HTML special characters in a string to prevent XSS.
 * @param {string} str - Content to escape.
 * @returns {string} Escaped string.
 */
export function escapeHtml(str) {
  if (str == null) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

/**
 * Sanitizes a value for use in an HTML attribute (escapes quotes).
 * @param {string} value - Attribute value.
 * @returns {string} Safe attribute string.
 */
export function sanitizeAttribute(value) {
  if (value == null) return "";
  return String(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
