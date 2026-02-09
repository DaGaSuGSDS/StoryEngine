export function createLabeledInput({
  container,
  label,
  id,
  value,
  type = "text",
}) {
  const div = document.createElement("div");
  div.className = "panel-section";
  div.innerHTML = `
    <label>${label}</label>
    <input id="${id}" type="${type}" value="${value ?? ""}" />
  `;
  container.appendChild(div);
  return div.querySelector("input");
}

export function createSelectField({
  container,
  label,
  id,
  options,
  value,
  allowEmpty = false,
  emptyLabel = "(ninguno)",
}) {
  const div = document.createElement("div");
  div.className = "panel-section";
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  const select = document.createElement("select");
  select.id = id;
  if (allowEmpty) {
    const optEmpty = document.createElement("option");
    optEmpty.value = "";
    optEmpty.textContent = emptyLabel;
    select.appendChild(optEmpty);
  }
  options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    select.appendChild(o);
  });
  select.value = value || "";
  div.appendChild(labelEl);
  div.appendChild(select);
  container.appendChild(div);
  return select;
}

