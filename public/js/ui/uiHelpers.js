/**
 * Helper to create DOM elements declaratively.
 * @param {string} tag - HTML tag name
 * @param {object} attrs - Attributes and properties (className, style, events)
 * @param {Array|string|Node} children - Child elements or text
 * @returns {HTMLElement}
 */
export function dom(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class" || key === "className") {
      el.className = value;
    } else if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value);
    } else if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.substring(2).toLowerCase();
      el.addEventListener(eventName, value);
    } else if (value === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  });

  if (!Array.isArray(children)) {
    children = [children];
  }

  children.forEach((child) => {
    if (typeof child === "string" || typeof child === "number") {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    } else if (child && typeof child.render === "function") {
      // Support for our Component class
      el.appendChild(child.render());
    }
  });

  return el;
}

/**
 * uiHelpers.js
 * Collection of utility functions for UI manipulation and element creation.
 */
/**
 * Creates a labeled input field.
 * @param {Object} options
 * @param {HTMLElement} [options.container] - Parent to append to.
 * @param {string} options.label - Label text.
 * @param {string} options.id - Input ID.
 * @param {string} [options.value] - Initial value.
 * @param {string} [options.type] - Input type.
 * @param {string} [options.placeholder] - Placeholder text.
 * @param {Function} [options.onChange] - Input event handler.
 * @returns {HTMLInputElement} The input element.
 */
export function createLabeledInput({
  container,
  label,
  id,
  value,
  type = "text",
  placeholder = "",
  onChange = null
}) {
  const inputParams = { id, type, value: value ?? "" };
  if (placeholder) inputParams.placeholder = placeholder;

  if (onChange) {
    inputParams.onInput = onChange;
  }

  const div = dom("div", { class: "panel-section" }, [
    dom("label", {}, [label]),
    dom("input", inputParams)
  ]);

  if (container) container.appendChild(div);
  return div.querySelector("input");
}

/**
 * Creates a labeled select field.
 * @param {Object} options
 * @param {HTMLElement} [options.container] - Parent to append to.
 * @param {string} options.label - Label text.
 * @param {string} options.id - Select ID.
 * @param {Array<{value: string, label: string}>} options.options - Select options.
 * @param {string} [options.value] - Selected value.
 * @param {boolean} [options.allowEmpty] - Add empty option.
 * @param {string} [options.emptyLabel] - Label for empty option.
 * @param {Function} [options.onChange] - Change event handler.
 * @returns {HTMLSelectElement} The select element.
 */
export function createSelectField({
  container,
  label,
  id,
  options,
  value,
  allowEmpty = false,
  emptyLabel = "(ninguno)",
  onChange = null
}) {
  const selectChildren = [];

  if (allowEmpty) {
    selectChildren.push(dom("option", { value: "" }, [emptyLabel]));
  }

  options.forEach((opt) => {
    selectChildren.push(
      dom("option", { value: opt.value }, [opt.label])
    );
  });

  const selectParams = { id };
  if (onChange) selectParams.onChange = onChange;

  const select = dom("select", selectParams, selectChildren);
  select.value = value || "";

  const div = dom("div", { class: "panel-section" }, [
    dom("label", {}, [label]),
    select
  ]);

  if (container) container.appendChild(div);
  return select;
}


