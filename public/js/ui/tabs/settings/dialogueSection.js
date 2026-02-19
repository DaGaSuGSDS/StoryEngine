/**
 * dialogueSection.js
 * Renders settings related to dialogue display and styling.
 */
export const DIALOGUE_STYLE_INPUT_IDS = [
  "dialogue-style",
  "dialogue-box-color",
  "dialogue-text-color",
  "dialogue-name-color",
  "dialogue-font-size",
];

/**
 * Renders the settings section for dialogue customization.
 * @param {Object} settings - Current project settings.
 * @returns {string} HTML string of the section.
 */
export function renderDialogueSection(settings) {
  return `
    <section class="settings-section" data-section="dialogue">
      <div class="settings-section-header">
        <h3>Estilo de Diálogo</h3>
        <button type="button" class="collapse-toggle" data-target="dialogue">Ocultar</button>
      </div>
      <div class="settings-section-body">
        <div class="form-group">
          <label>Estilo</label>
          <select id="dialogue-style">
            <option value="classic" ${settings.dialogueStyle === "classic" ? "selected" : ""
    }>Clásico Visual Novel</option>
            <option value="bubble" ${settings.dialogueStyle === "bubble" ? "selected" : ""
    }>Burbujas de Diálogo</option>
            <option value="minimal" ${settings.dialogueStyle === "minimal" ? "selected" : ""
    }>Minimalista</option>
          </select>
        </div>

        <div class="form-group">
          <label>Color de Fondo del Diálogo</label>
          <input type="color" id="dialogue-box-color" value="${settings.dialogueBoxColor}" />
        </div>

        <div class="form-group">
          <label>Color del Texto</label>
          <input type="color" id="dialogue-text-color" value="${settings.dialogueTextColor}" />
        </div>

        <div class="form-group">
          <label>Color del Nombre</label>
          <input type="color" id="dialogue-name-color" value="${settings.dialogueNameColor}" />
        </div>

        <div class="form-group">
          <label>Tamaño de Fuente</label>
          <input type="number" id="dialogue-font-size" value="${settings.dialogueFontSize}" min="12" max="32" />
        </div>

        <div class="dialogue-preview">
          <div class="preview-label">Vista Previa:</div>
          <div id="dialogue-preview-box"></div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Updates the live preview of the dialogue box based on current form values.
 * @param {HTMLElement} container - The settings tab container element.
 */
export function updateDialoguePreview(container) {
  const style = container.querySelector("#dialogue-style")?.value || "classic";
  const boxColor = container.querySelector("#dialogue-box-color")?.value || "#1e1e1e";
  const textColor = container.querySelector("#dialogue-text-color")?.value || "#ffffff";
  const nameColor = container.querySelector("#dialogue-name-color")?.value || "#4fc3f7";
  const fontSize = container.querySelector("#dialogue-font-size")?.value || "18";

  const previewBox = container.querySelector("#dialogue-preview-box");
  if (!previewBox) return;

  const styleClass = style === "bubble" ? "preview-bubble" : style === "minimal" ? "preview-minimal" : "preview-classic";

  previewBox.className = styleClass;
  previewBox.style.backgroundColor = boxColor;
  previewBox.style.color = textColor;
  previewBox.style.fontSize = `${fontSize}px`;

  previewBox.innerHTML = "";
  const nameEl = document.createElement("div");
  nameEl.className = "preview-name";
  nameEl.style.color = nameColor;
  nameEl.textContent = "Personaje";

  const textEl = document.createElement("div");
  textEl.className = "preview-text";
  textEl.textContent = "Este es un ejemplo de cómo se verá el diálogo en tu juego.";

  previewBox.appendChild(nameEl);
  previewBox.appendChild(textEl);
}
