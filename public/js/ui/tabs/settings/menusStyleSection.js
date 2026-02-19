/**
 * menusStyleSection.js
 * Renders settings for customizing the appearance of game menus.
 */
export const MENU_STYLE_INPUT_IDS = [
  "start-menu-overlay-color",
  "start-menu-overlay-opacity",
  "start-menu-panel-color",
  "start-menu-panel-accent-color",
  "start-menu-border-color",
  "start-menu-border-opacity",
  "start-menu-panel-radius",
  "start-menu-title-color",
  "start-menu-button-bg-color",
  "start-menu-button-hover-bg-color",
  "start-menu-button-text-color",
  "start-menu-button-radius",
  "save-overlay-color",
  "save-overlay-opacity",
  "save-modal-bg-color",
  "save-modal-border-color",
  "save-header-bg-color",
  "save-header-text-color",
  "save-slot-bg-color",
  "save-slot-border-color",
  "save-slot-hover-border-color",
  "save-slot-radius",
  "save-slot-text-color",
  "save-slot-subtext-color",
  "save-delete-button-color",
  "save-delete-button-hover-color",
];

/**
 * Renders the settings section for Start and Save menu styling.
 * Configuration for colors, opacity, border radii, etc.
 * @param {Object} settings - Current project settings.
 * @returns {string} HTML string.
 */
export function renderMenuStyleSection(settings) {
  return `
    <section class="settings-section" data-section="menu-styles-start">
      <div class="settings-section-header">
        <h3>Estilo de menú de inicio</h3>
        <button type="button" class="collapse-toggle" data-target="menu-styles-start">Ocultar</button>
      </div>
      <div class="settings-section-body">
          <div class="form-group">
            <label>Título</label>
            <input
              type="color"
              id="start-menu-title-color"
              value="${settings.startMenuTitleColor || "#e9f7ff"}"
            />
          </div>

        <div class="form-row">
          <div class="form-group">
            <label>Overlay del menú</label>
            <input type="color" id="start-menu-overlay-color" value="${settings.startMenuOverlayColor || "#000000"}" />
            <input type="range" id="start-menu-overlay-opacity" min="0" max="1" step="0.05" value="${settings.startMenuOverlayOpacity ?? 0.82}" />
            <span class="muted" id="start-menu-overlay-opacity-value"></span>
          </div>
          <div class="form-group">
            <label>Borde del panel</label>
            <input type="color" id="start-menu-border-color" value="${settings.startMenuBorderColor || "#4fc3f7"}" />
            <input type="range" id="start-menu-border-opacity" min="0" max="1" step="0.05" value="${settings.startMenuBorderOpacity ?? 0.35}" />
            <span class="muted" id="start-menu-border-opacity-value"></span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Fondo del panel (arriba)</label>
            <input
              type="color"
              id="start-menu-panel-color"
              value="${settings.startMenuPanelColor || "#202026"}"
            />
          </div>
          <div class="form-group">
            <label>Fondo del panel (abajo)</label>
            <input
              type="color"
              id="start-menu-panel-accent-color"
              value="${settings.startMenuPanelAccentColor || "#16161a"}"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Radio del panel</label>
            <input
              type="number"
              id="start-menu-panel-radius"
              value="${settings.startMenuPanelRadius ?? 0}"
              min="0"
              max="48"
            />
            <small class="muted" id="start-menu-panel-radius-value"></small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Botón - Normal</label>
            <input type="color" id="start-menu-button-bg-color" value="${settings.startMenuButtonBgColor || "#2a2d34"}" />
          </div>
          <div class="form-group">
            <label>Botón - Hover</label>
            <input type="color" id="start-menu-button-hover-bg-color" value="${settings.startMenuButtonHoverBgColor || "#323641"}" />
          </div>
          <div class="form-group">
            <label>Botón - Texto</label>
            <input type="color" id="start-menu-button-text-color" value="${settings.startMenuButtonTextColor || "#f5f5f5"}" />
          </div>
          <div class="form-group">
            <label>Radio de botón</label>
            <input type="number" id="start-menu-button-radius" value="${settings.startMenuButtonRadius ?? 6}" min="0" max="24" />
            <small class="muted" id="start-menu-button-radius-value"></small>
          </div>
        </div>

        <div class="menu-preview-wrapper">
          <div class="menu-preview menu-preview--start" id="start-menu-preview">
            <div class="menu-preview__overlay" id="start-menu-preview-overlay"></div>
            <div class="menu-preview__panel" id="start-menu-preview-panel">
              <div class="menu-preview__title" id="start-menu-preview-title">${settings.gameTitle || "StoryEngine"
    }</div>
              <div class="menu-preview__buttons">
                <button class="menu-preview__btn" id="start-menu-preview-primary">Nueva partida</button>
                <button class="menu-preview__btn" id="start-menu-preview-secondary">Cargar partida</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <section class="settings-section" data-section="menu-styles-save">
      <div class="settings-section-header">
        <h3>Estilo de slots de guardado</h3>
        <button type="button" class="collapse-toggle" data-target="menu-styles-save">Ocultar</button>
      </div>
      <div class="settings-section-body">

        <div class="form-row">
          <div class="form-group">
            <label>Overlay del modal</label>
            <input type="color" id="save-overlay-color" value="${settings.saveOverlayColor || "#000000"}" />
            <input type="range" id="save-overlay-opacity" min="0" max="1" step="0.05" value="${settings.saveOverlayOpacity ?? 0.8}" />
            <span class="muted" id="save-overlay-opacity-value"></span>
          </div>
          <div class="form-group">
            <label>Modal - Fondo</label>
            <input type="color" id="save-modal-bg-color" value="${settings.saveModalBgColor || "#252526"}" />
          </div>
          <div class="form-group">
            <label>Modal - Borde</label>
            <input type="color" id="save-modal-border-color" value="${settings.saveModalBorderColor || "#3e3e42"}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Cabecera - Fondo</label>
            <input type="color" id="save-header-bg-color" value="${settings.saveHeaderBgColor || "#2d2d30"}" />
          </div>
          <div class="form-group">
            <label>Cabecera - Texto</label>
            <input type="color" id="save-header-text-color" value="${settings.saveHeaderTextColor || "#f0f0f0"}" />
          </div>
          <div class="form-group">
            <label>Radio de las tarjetas</label>
            <input type="number" id="save-slot-radius" value="${settings.saveSlotRadius ?? 4}" min="0" max="24" />
            <small class="muted" id="save-slot-radius-value"></small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tarjeta - Fondo</label>
            <input type="color" id="save-slot-bg-color" value="${settings.saveSlotBgColor || "#1e1e1e"}" />
          </div>
          <div class="form-group">
            <label>Tarjeta - Borde</label>
            <input type="color" id="save-slot-border-color" value="${settings.saveSlotBorderColor || "#3e3e42"}" />
          </div>
          <div class="form-group">
            <label>Tarjeta - Hover</label>
            <input type="color" id="save-slot-hover-border-color" value="${settings.saveSlotHoverBorderColor || "#007acc"}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Texto - Principal</label>
            <input type="color" id="save-slot-text-color" value="${settings.saveSlotTextColor || "#f0f0f0"}" />
          </div>
          <div class="form-group">
            <label>Texto - Secundario</label>
            <input type="color" id="save-slot-subtext-color" value="${settings.saveSlotSubTextColor || "#aaaaaa"}" />
          </div>
          <div class="form-group">
            <label>Botón borrar - Fondo</label>
            <input type="color" id="save-delete-button-color" value="${settings.saveDeleteButtonColor || "#c92a2a"}" />
          </div>
          <div class="form-group">
            <label>Botón borrar - Hover</label>
            <input type="color" id="save-delete-button-hover-color" value="${settings.saveDeleteButtonHoverColor || "#a61e1e"}" />
          </div>
        </div>
        <div class="menu-preview-wrapper">
          <div class="menu-preview menu-preview--save" id="save-menu-preview">
            <div class="menu-preview__overlay" id="save-menu-preview-overlay"></div>
            <div class="save-load-modal" id="save-menu-preview-modal">
              <div class="save-load-header" id="save-menu-preview-header"></div>
              <div class="save-load-content">
                <div class="save-slot" id="save-menu-preview-slot">
                  <div class="save-slot-header">
                    <span class="save-slot-number">Slot 1</span>
                    <span class="save-slot-date">12/12 20:15</span>
                  </div>
                  <div class="save-slot-body">
                    <p class="save-slot-scene">Bosque nocturno</p>
                    <p class="save-slot-time">Tiempo: 00:12:44</p>
                  </div>
                  <div class="save-slot-actions">
                    <button class="menu-preview__btn small danger" id="save-menu-preview-delete">Borrar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  `;
}

/**
 * Updates the live preview for Start Menu and Save Slots based on form inputs.
 * Reads values from DOM inputs, falling back to settings or defaults.
 * @param {HTMLElement} container - The settings tab container.
 * @param {Object} settings - Current project settings (fallback).
 */
export function updateMenuSavePreview(container, settings = {}) {
  // Helper to convert hex to rgba with opacity
  const hexToRgba = (hex, opacity, fallback) => {
    if (!hex) return fallback;
    if (hex.startsWith("rgb")) return hex;
    let clean = hex.replace("#", "");
    if (clean.length === 3) {
      clean = clean
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (clean.length !== 6) return fallback;
    const int = parseInt(clean, 16);
    if (Number.isNaN(int)) return fallback;
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    const alpha = Math.min(1, Math.max(0, opacity ?? 1));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper to clamp numeric values within range
  const clamp = (value, min, max, fallback) => {
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return fallback;
    if (min !== undefined) {
      return Math.min(max, Math.max(min, num));
    }
    return num;
  };

  const startOverlayOpacity = clamp(
    container.querySelector("#start-menu-overlay-opacity")?.value,
    0,
    1,
    settings.startMenuOverlayOpacity ?? 0.82
  );
  const startOverlayLabel = container.querySelector("#start-menu-overlay-opacity-value");
  if (startOverlayLabel) startOverlayLabel.textContent = `Opacidad: ${startOverlayOpacity.toFixed(2)}`;

  const startBorderOpacity = clamp(
    container.querySelector("#start-menu-border-opacity")?.value,
    0, 1,
    settings.startMenuBorderOpacity ?? 0.35
  );
  const startBorderLabel = container.querySelector("#start-menu-border-opacity-value");
  if (startBorderLabel) startBorderLabel.textContent = `Opacidad: ${startBorderOpacity.toFixed(2)}`;

  const panelRadius = clamp(
    container.querySelector("#start-menu-panel-radius")?.value,
    0,
    48,
    settings.startMenuPanelRadius ?? 0
  );
  const panelRadiusLabel = container.querySelector("#start-menu-panel-radius-value");
  if (panelRadiusLabel) panelRadiusLabel.textContent = `Radio: ${panelRadius}px`;

  const buttonRadius = clamp(container.querySelector("#start-menu-button-radius")?.value, 0, 24, settings.startMenuButtonRadius ?? 6);
  const buttonRadiusLabel = container.querySelector("#start-menu-button-radius-value");
  if (buttonRadiusLabel) buttonRadiusLabel.textContent = `Radio: ${buttonRadius}px`;

  const saveOverlayOpacity = clamp(container.querySelector("#save-overlay-opacity")?.value, 0, 1, settings.saveOverlayOpacity ?? 0.8);
  const saveOverlayLabel = container.querySelector("#save-overlay-opacity-value");
  if (saveOverlayLabel) saveOverlayLabel.textContent = `Opacidad: ${saveOverlayOpacity.toFixed(2)}`;

  const saveSlotRadius = clamp(container.querySelector("#save-slot-radius")?.value, 0, 24, settings.saveSlotRadius ?? 4);
  const saveSlotRadiusLabel = container.querySelector("#save-slot-radius-value");
  if (saveSlotRadiusLabel) saveSlotRadiusLabel.textContent = `Radio: ${saveSlotRadius}px`;

  const startOverlayEl = container.querySelector("#start-menu-preview-overlay");
  const startPanelEl = container.querySelector("#start-menu-preview-panel");
  const startTitleEl = container.querySelector("#start-menu-preview-title");
  const startPrimaryBtn = container.querySelector("#start-menu-preview-primary");
  const startSecondaryBtn = container.querySelector("#start-menu-preview-secondary");
  const gameTitleInput = container.querySelector("#game-title");
  if (startTitleEl) startTitleEl.textContent = (gameTitleInput && gameTitleInput.value) || settings.gameTitle || "StoryEngine";

  const startOverlayColor = container.querySelector("#start-menu-overlay-color")?.value || settings.startMenuOverlayColor;
  if (startOverlayEl) startOverlayEl.style.backgroundColor = hexToRgba(startOverlayColor, startOverlayOpacity, "rgba(0,0,0,0.82)");

  const panelColor = container.querySelector("#start-menu-panel-color")?.value || settings.startMenuPanelColor;
  const panelAccent = container.querySelector("#start-menu-panel-accent-color")?.value || settings.startMenuPanelAccentColor;
  const panelBorderColor = container.querySelector("#start-menu-border-color")?.value || settings.startMenuBorderColor;
  if (startPanelEl) {
    startPanelEl.style.background = `linear-gradient(135deg, ${hexToRgba(panelColor, 0.95, "rgba(32,32,38,0.95)")}, ${hexToRgba(panelAccent, 0.92, "rgba(22,22,26,0.92)")})`;
    startPanelEl.style.border = `1px solid ${hexToRgba(panelBorderColor, startBorderOpacity, "rgba(79,195,247,0.35)")}`;
    startPanelEl.style.borderRadius = `${panelRadius}px`;
  }
  if (startTitleEl) startTitleEl.style.color = container.querySelector("#start-menu-title-color")?.value || settings.startMenuTitleColor || "#e9f7ff";

  const baseBtnBg = container.querySelector("#start-menu-button-bg-color")?.value || settings.startMenuButtonBgColor;
  const baseBtnText = container.querySelector("#start-menu-button-text-color")?.value || settings.startMenuButtonTextColor;
  const applyBaseButtonStyle = (btn) => {
    if (!btn) return;
    btn.style.background = baseBtnBg || "#2a2d34";
    btn.style.color = baseBtnText || "#f5f5f5";
    btn.style.border = `1px solid ${baseBtnBg || "rgba(255,255,255,0.1)"}`;
    btn.style.borderRadius = `${buttonRadius}px`;
  };
  applyBaseButtonStyle(startSecondaryBtn);
  applyBaseButtonStyle(startPrimaryBtn);

  const saveOverlayEl = container.querySelector("#save-menu-preview-overlay");
  const saveModalEl = container.querySelector("#save-menu-preview-modal");
  const saveHeaderEl = container.querySelector("#save-menu-preview-header");
  const saveSlotEl = container.querySelector("#save-menu-preview-slot");
  const saveSlotNumber = saveSlotEl?.querySelector(".save-slot-number");
  const saveSlotDate = saveSlotEl?.querySelector(".save-slot-date");
  const saveSlotBodyMain = saveSlotEl?.querySelector(".save-slot-scene");
  const saveSlotBodySub = saveSlotEl?.querySelector(".save-slot-time");
  const saveDeleteBtn = container.querySelector("#save-menu-preview-delete");

  const saveOverlayColor = container.querySelector("#save-overlay-color")?.value || settings.saveOverlayColor;
  if (saveOverlayEl) saveOverlayEl.style.backgroundColor = hexToRgba(saveOverlayColor, saveOverlayOpacity, "rgba(0,0,0,0.8)");

  const modalBg = container.querySelector("#save-modal-bg-color")?.value || settings.saveModalBgColor;
  const modalBorder = container.querySelector("#save-modal-border-color")?.value || settings.saveModalBorderColor;
  if (saveModalEl) {
    saveModalEl.style.background = modalBg || "#252526";
    saveModalEl.style.border = `1px solid ${modalBorder || "#3e3e42"}`;
  }
  if (saveHeaderEl) {
    saveHeaderEl.style.backgroundColor = container.querySelector("#save-header-bg-color")?.value || settings.saveHeaderBgColor || "#2d2d30";
    saveHeaderEl.style.color = container.querySelector("#save-header-text-color")?.value || settings.saveHeaderTextColor || "#f0f0f0";
    saveHeaderEl.style.borderColor = modalBorder || "#3e3e42";
  }

  const slotBg = container.querySelector("#save-slot-bg-color")?.value || settings.saveSlotBgColor;
  const slotBorder = container.querySelector("#save-slot-border-color")?.value || settings.saveSlotBorderColor;
  const slotHoverBorder = container.querySelector("#save-slot-hover-border-color")?.value || settings.saveSlotHoverBorderColor;
  if (saveSlotEl) {
    saveSlotEl.style.background = slotBg || "#1e1e1e";
    saveSlotEl.style.border = `1px solid ${slotBorder || "#3e3e42"}`;
    saveSlotEl.style.borderRadius = `${saveSlotRadius}px`;
    saveSlotEl.style.boxShadow = `0 0 0 1px ${slotHoverBorder || "#007acc"}33`;
  }
  const slotText = container.querySelector("#save-slot-text-color")?.value || settings.saveSlotTextColor;
  const slotSubText = container.querySelector("#save-slot-subtext-color")?.value || settings.saveSlotSubTextColor;
  [saveSlotNumber, saveSlotBodyMain].forEach((el) => { if (el) el.style.color = slotText || "#f0f0f0"; });
  [saveSlotDate, saveSlotBodySub].forEach((el) => { if (el) el.style.color = slotSubText || "#aaaaaa"; });

  if (saveDeleteBtn) {
    const delColor = container.querySelector("#save-delete-button-color")?.value || settings.saveDeleteButtonColor;
    const delHover = container.querySelector("#save-delete-button-hover-color")?.value || settings.saveDeleteButtonHoverColor;
    saveDeleteBtn.style.background = delColor || "#c92a2a";
    saveDeleteBtn.style.border = `1px solid ${delColor || "#c92a2a"}`;
    saveDeleteBtn.style.color = "#ffffff";
    saveDeleteBtn.style.borderRadius = "5px";
    saveDeleteBtn.removeEventListener("mouseenter", saveDeleteBtn._menuMouseEnter);
    saveDeleteBtn.removeEventListener("mouseleave", saveDeleteBtn._menuMouseLeave);
    saveDeleteBtn._menuMouseEnter = () => {
      saveDeleteBtn.style.background = delHover || "#a61e1e";
      saveDeleteBtn.style.borderColor = delHover || "#a61e1e";
    };
    saveDeleteBtn._menuMouseLeave = () => {
      saveDeleteBtn.style.background = delColor || "#c92a2a";
      saveDeleteBtn.style.borderColor = delColor || "#c92a2a";
    };
    saveDeleteBtn.addEventListener("mouseenter", saveDeleteBtn._menuMouseEnter);
    saveDeleteBtn.addEventListener("mouseleave", saveDeleteBtn._menuMouseLeave);
  }
}
