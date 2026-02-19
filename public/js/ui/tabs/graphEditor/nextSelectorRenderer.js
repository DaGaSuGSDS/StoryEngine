import { NODE_TYPES } from "../../../models/nodes/nodeTypes.js";

/**
 * Renders selectors for next nodes.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} scene
 * @param {Object} projectStore
 */
export function renderNextSelectors(node, container, scene, projectStore) {
  container.innerHTML = "";
  if (!scene) return;

  if (node.type === NODE_TYPES.SCENE_CHANGE) {
    node.nextNodeIds = [];
    const info = document.createElement("div");
    info.className = "panel-section muted";
    info.textContent = "Este nodo cambia de escena y no tiene nodo siguiente.";
    container.appendChild(info);
    return;
  }

  const allNodes = Array.from(scene.graph.nodes.values());
  const nodeOptions = allNodes.map((n) => ({
    value: n.id,
    label: `${n.name || n.id} (${n.type})`,
  }));

  if (node.type === NODE_TYPES.PLAYER_OPTIONS) {
    renderPlayerOptionsNextSelectors(
      node,
      container,
      nodeOptions,
      projectStore
    );
    return;
  }

  if (node.type === NODE_TYPES.RANDOM) {
    renderRandomNextSelectors(node, container, nodeOptions, projectStore);
    return;
  }

  if (
    node.type === NODE_TYPES.CONDITIONAL ||
    node.type === NODE_TYPES.FLAG_TEST
  ) {
    createNextSelect(
      container,
      node,
      nodeOptions,
      "Nodo si condición es VERDADERA",
      0,
      projectStore
    );
    createNextSelect(
      container,
      node,
      nodeOptions,
      "Nodo si condición es FALSA",
      1,
      projectStore
    );
  } else {
    createNextSelect(
      container,
      node,
      nodeOptions,
      "Siguiente nodo",
      0,
      projectStore
    );
  }
}

/**
 * Helper to create a select for a next node.
 * @param {HTMLElement} container
 * @param {Object} node
 * @param {Array} nodeOptions
 * @param {string} label
 * @param {number} index
 * @param {Object} projectStore
 */
function createNextSelect(
  container,
  node,
  nodeOptions,
  label,
  index,
  projectStore
) {
  const div = document.createElement("div");
  div.className = "panel-section";
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  const select = document.createElement("select");
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "(ninguno)";
  select.appendChild(empty);
  nodeOptions.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    select.appendChild(o);
  });
  select.value = node.nextNodeIds[index] || "";
  select.addEventListener("change", () => {
    const val = select.value;
    node.nextNodeIds[index] = val || null;
    node.nextNodeIds = node.nextNodeIds.filter((v) => v && v.length > 0);
    projectStore.notify();
  });
  div.appendChild(labelEl);
  div.appendChild(select);
  container.appendChild(div);
}

/**
 * Renders next selectors for PlayerOptions node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Array} nodeOptions
 * @param {Object} projectStore
 */
function renderPlayerOptionsNextSelectors(
  node,
  container,
  nodeOptions,
  projectStore
) {
  if (!Array.isArray(node.options)) node.options = [];
  if (!Array.isArray(node.nextNodeIds)) node.nextNodeIds = [];

  const buildRow = (idx) => {
    const row = document.createElement("div");
    row.className = "panel-section";

    const labelEl = document.createElement("label");
    labelEl.textContent = `Opción ${idx + 1}`;
    row.appendChild(labelEl);

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = node.options[idx] || "";
    textInput.style.marginBottom = "4px";
    textInput.addEventListener("change", () => {
      node.options[idx] = textInput.value;
      projectStore.notify();
    });
    row.appendChild(textInput);

    const select = document.createElement("select");
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "(ninguno)";
    select.appendChild(empty);
    nodeOptions.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      select.appendChild(o);
    });
    select.value = node.nextNodeIds[idx] || "";
    select.addEventListener("change", () => {
      const val = select.value;
      node.nextNodeIds[idx] = val || null;
      projectStore.notify();
    });
    row.appendChild(select);

    const delBtn = document.createElement("button");
    delBtn.className = "btn small";
    delBtn.textContent = "Eliminar";
    delBtn.style.marginLeft = "4px";
    delBtn.addEventListener("click", () => {
      node.options.splice(idx, 1);
      node.nextNodeIds.splice(idx, 1);
      projectStore.notify();
    });
    row.appendChild(delBtn);

    container.appendChild(row);
  };

  node.options.forEach((_, idx) => buildRow(idx));

  const addDiv = document.createElement("div");
  addDiv.className = "panel-section";
  const addBtn = document.createElement("button");
  addBtn.className = "btn small";
  addBtn.style.width = "100%";
  addBtn.textContent = "Añadir opción";
  addBtn.addEventListener("click", () => {
    node.options.push("Nueva opción");
    node.nextNodeIds.push(null);
    projectStore.notify();
  });
  addDiv.appendChild(addBtn);
  container.appendChild(addDiv);
}

/**
 * Renders next selectors for Random node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Array} nodeOptions
 * @param {Object} projectStore
 */
function renderRandomNextSelectors(node, container, nodeOptions, projectStore) {
  if (!Array.isArray(node.nextNodeIds)) node.nextNodeIds = [];

  const buildRow = (idx) => {
    const row = document.createElement("div");
    row.className = "panel-section";

    const labelEl = document.createElement("label");
    labelEl.textContent = `Rama ${idx + 1}`;
    row.appendChild(labelEl);

    const select = document.createElement("select");
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "(ninguno)";
    select.appendChild(empty);
    nodeOptions.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      select.appendChild(o);
    });
    select.value = node.nextNodeIds[idx] || "";
    select.addEventListener("change", () => {
      const val = select.value;
      node.nextNodeIds[idx] = val || null;
      projectStore.notify();
    });
    row.appendChild(select);

    const delBtn = document.createElement("button");
    delBtn.className = "btn small";
    delBtn.textContent = "Eliminar";
    delBtn.style.marginLeft = "4px";
    delBtn.addEventListener("click", () => {
      node.nextNodeIds.splice(idx, 1);
      projectStore.notify();
      renderNextSelectors(
        node,
        container,
        projectStore.currentScene,
        projectStore
      );
    });
    row.appendChild(delBtn);

    container.appendChild(row);
  };

  node.nextNodeIds.forEach((_, idx) => buildRow(idx));

  const addDiv = document.createElement("div");
  addDiv.className = "panel-section";
  const addBtn = document.createElement("button");
  addBtn.className = "btn small";
  addBtn.style.width = "100%";
  addBtn.textContent = "Añadir rama";
  addBtn.addEventListener("click", () => {
    node.nextNodeIds.push(null);
    projectStore.notify();
    renderNextSelectors(
      node,
      container,
      projectStore.currentScene,
      projectStore
    );
  });
  addDiv.appendChild(addBtn);
  container.appendChild(addDiv);
}
