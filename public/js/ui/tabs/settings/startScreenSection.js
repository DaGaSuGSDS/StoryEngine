/**
 * startScreenSection.js
 * Renders settings for the game's start/title screen.
 */
export const START_SCREEN_INPUT_IDS = [
  "start-screen-image",
  "start-screen-prompt",
  "start-screen-blur",
  "start-screen-overlay-opacity",
  "start-screen-title-size",
  "start-screen-prompt-size",
  "start-screen-align",
  "start-screen-vertical",
];

/**
 * Renders the settings section for the Start/Title Screen.
 * @param {Object} settings - Current project settings.
 * @param {string} imageOptionsHtml - HTML options for background image selection.
 * @returns {string} HTML string.
 */
export function renderStartScreenSection(settings, imageOptionsHtml) {
  return `
    <section class="settings-section" data-section="start-screen">
      <div class="settings-section-header">
        <h3>Estilo de la pantalla de inicio</h3>
        <button type="button" class="collapse-toggle" data-target="start-screen">Ocultar</button>
      </div>
      <div class="settings-section-body">
        <div class="form-group">
          <label>Imagen de fondo</label>
          <select id="start-screen-image">
            <option value="">Usar icono o primera imagen</option>
            ${imageOptionsHtml}
          </select>
          <small>Se usará esta imagen como portada del inicio (difuminada de fondo).</small>
        </div>

        <div class="form-group">
          <label>Texto de invitación</label>
          <input
            type="text"
            id="start-screen-prompt"
            value="${settings.startScreenPrompt || ""}"
            maxlength="120"
          />
          <small>Texto que aparece bajo el título (p.ej. "Pulse cualquier tecla para empezar...").</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Posición horizontal</label>
            <select id="start-screen-align">
              <option value="left" ${settings.startScreenTextAlign === "left" ? "selected" : ""
    }>Izquierda</option>
              <option value="center" ${settings.startScreenTextAlign === "center" ? "selected" : ""
    }>Centro</option>
              <option value="right" ${settings.startScreenTextAlign === "right" ? "selected" : ""
    }>Derecha</option>
            </select>
          </div>
          <div class="form-group">
            <label>Posición vertical</label>
            <select id="start-screen-vertical">
              <option value="top" ${settings.startScreenTextVertical === "top" ? "selected" : ""
    }>Arriba</option>
              <option value="center" ${settings.startScreenTextVertical === "center" ? "selected" : ""
    }>Centro</option>
              <option value="bottom" ${settings.startScreenTextVertical === "bottom" ? "selected" : ""
    }>Abajo</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tamaño del título (px)</label>
            <input
              type="number"
              id="start-screen-title-size"
              value="${settings.startScreenTitleSize || 48}"
              min="18"
              max="120"
            />
          </div>
          <div class="form-group">
            <label>Tamaño del texto (px)</label>
            <input
              type="number"
              id="start-screen-prompt-size"
              value="${settings.startScreenPromptSize || 18}"
              min="12"
              max="80"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Difuminado de fondo (%)</label>
          <input
            type="range"
            id="start-screen-blur"
            min="0"
            max="100"
            step="5"
            value="${settings.startScreenBlurPercent ?? 50}"
          />
          <span class="muted" id="start-screen-blur-value"></span>
        </div>

        <div class="form-group">
          <label>Opacidad del oscurecido</label>
          <input
            type="range"
            id="start-screen-overlay-opacity"
            min="0"
            max="1"
            step="0.05"
            value="${settings.startScreenOverlayOpacity ?? 0.75}"
          />
          <span class="muted" id="start-screen-overlay-value"></span>
        </div>

        <div class="start-preview" id="start-screen-preview">
          <div class="start-preview__bg"></div>
          <div class="start-preview__overlay"></div>
          <div class="start-preview__content">
            <div class="start-preview__title">${settings.gameTitle || "StoryEngine"
    }</div>
            <div class="start-preview__prompt">${settings.startScreenPrompt || ""
    }</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Updates the live preview of the Start Screen.
 * Handles background image loading/fallback and text positioning.
 * @param {HTMLElement} container - The settings tab container.
 * @param {Object} context - Helper context containing image resolver and settings.
 */
export function updateStartScreenPreview(
  container,
  { resolveImageUrl, fallbackImageUrl, settings }
) {
  const preview = container.querySelector("#start-screen-preview");
  if (!preview) return;

  const clamp = (val, min, max, fallback) => {
    const num = Number.parseFloat(val);
    if (Number.isNaN(num)) return fallback;
    return Math.min(max, Math.max(min, num));
  };

  const titleEl = preview.querySelector(".start-preview__title");
  const promptEl = preview.querySelector(".start-preview__prompt");
  const contentEl = preview.querySelector(".start-preview__content");
  const overlayEl = preview.querySelector(".start-preview__overlay");
  const bgEl = preview.querySelector(".start-preview__bg");

  const titleInput = container.querySelector("#game-title");
  const promptInput = container.querySelector("#start-screen-prompt");
  const overlayInput = container.querySelector("#start-screen-overlay-opacity");
  const titleSizeInput = container.querySelector("#start-screen-title-size");
  const promptSizeInput = container.querySelector("#start-screen-prompt-size");
  const alignSelect = container.querySelector("#start-screen-align");
  const verticalSelect = container.querySelector("#start-screen-vertical");
  const overlayValueEl = container.querySelector("#start-screen-overlay-value");
  const blurInput = container.querySelector("#start-screen-blur");
  const blurValueEl = container.querySelector("#start-screen-blur-value");

  if (titleEl && titleInput) titleEl.textContent = titleInput.value || settings.gameTitle || "StoryEngine";
  if (promptEl && promptInput) promptEl.textContent = promptInput.value;

  const overlayOpacity = clamp(
    overlayInput ? overlayInput.value : settings.startScreenOverlayOpacity,
    0,
    1,
    settings.startScreenOverlayOpacity ?? 0.75
  );
  if (overlayEl) overlayEl.style.background = `rgba(0, 0, 0, ${overlayOpacity})`;
  if (overlayValueEl) overlayValueEl.textContent = `Opacidad: ${(overlayOpacity * 100).toFixed(0)}%`;
  const blurPercent = clamp(
    blurInput ? blurInput.value : settings.startScreenBlurPercent,
    0,
    100,
    settings.startScreenBlurPercent ?? 50
  );
  const blurPx = (blurPercent / 100) * 12;
  if (blurValueEl) blurValueEl.textContent = `Difuminado: ${Math.round(blurPercent)}%`;

  const titleSize = clamp(titleSizeInput ? titleSizeInput.value : settings.startScreenTitleSize, 18, 120, settings.startScreenTitleSize || 48);
  const promptSize = clamp(promptSizeInput ? promptSizeInput.value : settings.startScreenPromptSize, 12, 80, settings.startScreenPromptSize || 18);
  if (titleEl) titleEl.style.fontSize = `${titleSize}px`;
  if (promptEl) promptEl.style.fontSize = `${promptSize}px`;

  const align = alignSelect
    ? alignSelect.value
    : settings.startScreenTextAlign || "center";
  const vertical = verticalSelect
    ? verticalSelect.value
    : settings.startScreenTextVertical || "center";
  const alignMap = { left: "flex-start", center: "center", right: "flex-end" };
  const textAlignMap = { left: "left", center: "center", right: "right" };
  const verticalMap = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
  };

  preview.style.alignItems = alignMap[align] || "center";
  preview.style.justifyContent = verticalMap[vertical] || "center";
  if (contentEl) {
    contentEl.style.textAlign = textAlignMap[align] || "center";
    contentEl.style.alignItems = alignMap[align] || "center";
  }

  const imageSelect = container.querySelector("#start-screen-image");
  const iconSelect = container.querySelector("#game-icon");

  const selectedId = imageSelect
    ? imageSelect.value
    : settings.startScreenImageId;

  let bgUrl = resolveImageUrl ? resolveImageUrl(selectedId) : null;
  if (!bgUrl && iconSelect) {
    bgUrl = resolveImageUrl
      ? resolveImageUrl(iconSelect.value || settings.iconId)
      : null;
  }
  if (!bgUrl && typeof fallbackImageUrl === "function") {
    bgUrl = fallbackImageUrl();
  }

  if (bgEl) {
    const applyGradient = () => { bgEl.style.backgroundImage = "linear-gradient(135deg, #1f1f1f, #0d0d0f)"; };
    const applyUrl = (url) => {
      const img = new Image();
      img.onload = () => { bgEl.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`; };
      img.onerror = applyGradient;
      img.src = url;
    };
    if (bgUrl) applyUrl(bgUrl);
    else applyGradient();
    bgEl.style.filter = `blur(${blurPx}px) brightness(0.7)`;
    bgEl.style.transform = "scale(1.06)";
    bgEl.style.backgroundSize = "cover";
    bgEl.style.backgroundPosition = "center";
  }

  const baseW = settings.windowWidth || 1280;
  const baseH = settings.windowHeight || 720;
  if (baseH > 0) {
    preview.style.aspectRatio = `${baseW} / ${baseH}`;
  }
}
