import { createSelectField } from "../../uiHelpers.js";
/**
 * graphEditorHelpers.js
 * Utility functions for coordinate conversion and graph interactions.
 */
import { escapeHtml } from "../../../utils/sanitize.js";

/**
 * Creates a linked selector for character and its state.
 * @param {HTMLElement} container
 * @param {Object} node
 * @param {Object} projectStore
 * @param {string} characterIdKey
 * @param {string} stateKey
 * @param {string} label
 * @returns {Object} { charSelect, stateSelect, fillStateOptions }
 */
export function createCharacterStateSelector(
  container,
  node,
  projectStore,
  characterIdKey,
  stateKey,
  label = "Personaje"
) {
  const charOptions = projectStore.characters.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const charSelect = createSelectField({
    container,
    label,
    id: `char-select-${Date.now()}`,
    options: charOptions,
    value: node[characterIdKey],
    allowEmpty: true,
  });

  const stateDiv = document.createElement("div");
  stateDiv.className = "panel-section";
  const stateLabel = document.createElement("label");
  stateLabel.textContent = "Estado personaje";
  const stateSelect = document.createElement("select");
  stateSelect.id = `state-select-${Date.now()}`;
  stateDiv.appendChild(stateLabel);
  stateDiv.appendChild(stateSelect);
  container.appendChild(stateDiv);

  const fillStateOptions = () => {
    const selectedCharId = charSelect.value || node[characterIdKey];
    const character = projectStore.characters.find(
      (c) => c.id === selectedCharId
    );
    stateSelect.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "(ninguno)";
    stateSelect.appendChild(emptyOpt);
    if (character && Array.isArray(character.states)) {
      character.states.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.name;
        opt.textContent = s.name;
        stateSelect.appendChild(opt);
      });
    }
    stateSelect.value = node[stateKey] || "";
  };

  fillStateOptions();

  return { charSelect, stateSelect, fillStateOptions };
}

/**
 * Crea un selector de variable de personaje
 * @param {HTMLElement} container - Contenedor donde añadir el selector
 * @param {Object} node - Nodo actual
 * @param {Object} projectStore - Store del proyecto
 * @param {string} characterId - ID del personaje
 * @param {string} variableKey - Clave de la variable en el nodo
 * @param {string} label - Etiqueta del selector
 * @returns {Object} Objeto con varSelect y updateVarOptions
 */
export function createVariableSelector(
  container,
  node,
  projectStore,
  characterId,
  variableKey,
  label = "Variable"
) {
  const varDiv = document.createElement("div");
  varDiv.className = "panel-section";
  const varLabel = document.createElement("label");
  varLabel.textContent = label;
  const varSelect = document.createElement("select");
  varSelect.id = `var-select-${Date.now()}`;
  varDiv.appendChild(varLabel);
  varDiv.appendChild(varSelect);
  container.appendChild(varDiv);

  const updateVarOptions = () => {
    const character = projectStore.characters.find((c) => c.id === characterId);
    const current = node[variableKey] || "";

    varSelect.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "(ninguna)";
    varSelect.appendChild(emptyOpt);

    let hasCurrent = current === "";
    if (character && Array.isArray(character.variables)) {
      character.variables.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = v.name;
        if (v.name === current) {
          hasCurrent = true;
        }
        varSelect.appendChild(opt);
      });
    }

    if (!hasCurrent && current) {
      const opt = document.createElement("option");
      opt.value = current;
      opt.textContent = `${escapeHtml(current)} (no definida en personaje)`;
      varSelect.appendChild(opt);
    }

    varSelect.value = current;
  };

  return { varSelect, updateVarOptions };
}
