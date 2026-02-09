export function escapeHtml(str) {
  if (str == null) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

export function sanitizeAttribute(value) {
  if (value == null) return "";
  return String(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
