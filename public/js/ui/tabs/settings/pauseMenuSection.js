export const PAUSE_STYLE_INPUT_IDS = [
  "pause-overlay-color",
  "pause-overlay-opacity",
  "pause-menu-bg-color",
  "pause-menu-border-color",
  "pause-menu-border-opacity",
  "pause-menu-radius",
  "pause-title-color",
  "pause-button-bg-color",
  "pause-button-hover-bg-color",
  "pause-button-text-color",
  "pause-button-border-color",
  "pause-button-border-opacity",
  "pause-button-radius",
];

export function renderPauseMenuSection(settings) {
  return `
    <section class="settings-section" data-section="pause-menu">
      <div class="settings-section-header">
        <h3>Estilo del Menú de Pausa</h3>
        <button type="button" class="collapse-toggle" data-target="pause-menu">Ocultar</button>
      </div>
      <div class="settings-section-body">
        <div class="form-group">
          <label>Color de Overlay</label>
          <div class="row">
            <input type="color" id="pause-overlay-color" value="${settings.pauseOverlayColor}" />
            <input type="range" id="pause-overlay-opacity" min="0" max="1" step="0.05" value="${settings.pauseOverlayOpacity}" />
            <span class="muted" id="pause-overlay-opacity-label" style="margin-left:8px;">Opacidad: ${settings.pauseOverlayOpacity}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Fondo del Menú</label>
          <input type="color" id="pause-menu-bg-color" value="${settings.pauseMenuBgColor}" />
        </div>

        <div class="form-group">
          <label>Borde del Menú</label>
          <div class="row">
            <input type="color" id="pause-menu-border-color" value="${settings.pauseMenuBorderColor}" />
            <input type="range" id="pause-menu-border-opacity" min="0" max="1" step="0.05" value="${settings.pauseMenuBorderOpacity}" />
            <span class="muted" id="pause-menu-border-opacity-label" style="margin-left:8px;">Opacidad: ${settings.pauseMenuBorderOpacity}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Radio del Menú</label>
          <input type="number" id="pause-menu-radius" value="${settings.pauseMenuRadius}" min="0" max="24" />
        </div>

        <div class="form-group">
          <label>Color del Título</label>
          <input type="color" id="pause-title-color" value="${settings.pauseTitleColor}" />
        </div>

        <div class="form-group">
          <label>Botón - Fondo</label>
          <input type="color" id="pause-button-bg-color" value="${settings.pauseButtonBgColor}" />
        </div>

        <div class="form-group">
          <label>Botón - Fondo Hover</label>
          <input type="color" id="pause-button-hover-bg-color" value="${settings.pauseButtonHoverBgColor}" />
        </div>

        <div class="form-group">
          <label>Botón - Color de Texto</label>
          <input type="color" id="pause-button-text-color" value="${settings.pauseButtonTextColor}" />
        </div>

        <div class="form-group">
          <label>Botón - Borde</label>
          <div class="row">
            <input type="color" id="pause-button-border-color" value="${settings.pauseButtonBorderColor}" />
            <input type="range" id="pause-button-border-opacity" min="0" max="1" step="0.05" value="${settings.pauseButtonBorderOpacity}" />
            <span class="muted" id="pause-button-border-opacity-label" style="margin-left:8px;">Opacidad: ${settings.pauseButtonBorderOpacity}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Botón - Radio</label>
          <input type="number" id="pause-button-radius" value="${settings.pauseButtonRadius}" min="0" max="24" />
        </div>

        <div class="pause-preview">
          <div id="pause-preview-overlay" style="display:flex;align-items:center;justify-content:center;padding:12px;border-radius:6px;">
            <div id="pause-preview-menu" style="padding:16px;min-width:220px;">
              <div class="pause-preview-title" style="text-align:center;margin-bottom:12px;font-weight:600;">Pausa</div>
              <button class="pause-preview-btn" style="width:100%;margin-bottom:8px;">Continuar</button>
              <button class="pause-preview-btn" style="width:100%;">Historial de Diálogos</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function updatePausePreview(container) {
  const overlay = container.querySelector("#pause-preview-overlay");
  const menu = container.querySelector("#pause-preview-menu");
  const buttons = container.querySelectorAll(".pause-preview-btn");
  const title = container.querySelector(".pause-preview-title");
  if (!overlay || !menu || buttons.length === 0 || !title) return;

  const hexToRgba = (hex, opacity) => {
    if (!hex) return `rgba(0,0,0,${opacity})`;
    if (hex.startsWith("rgb")) return hex;
    let clean = hex.replace("#", "");
    if (clean.length === 3) {
      clean = clean
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const int = parseInt(clean, 16);
    if (Number.isNaN(int)) return `rgba(0,0,0,${opacity})`;
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const overlayColor = container.querySelector("#pause-overlay-color").value;
  const overlayOpacityRaw = parseFloat(
    container.querySelector("#pause-overlay-opacity").value
  );
  const overlayOpacity = Number.isNaN(overlayOpacityRaw)
    ? 0.85
    : Math.min(1, Math.max(0, overlayOpacityRaw));
  const menuBg = container.querySelector("#pause-menu-bg-color").value;
  const menuBorderColor = container.querySelector("#pause-menu-border-color")
    .value;
  const menuBorderOpacityRaw = parseFloat(
    container.querySelector("#pause-menu-border-opacity").value
  );
  const menuBorderOpacity = Number.isNaN(menuBorderOpacityRaw)
    ? 0.1
    : Math.min(1, Math.max(0, menuBorderOpacityRaw));
  const menuRadius = parseFloat(
    container.querySelector("#pause-menu-radius").value
  );
  const pauseTitleColor = container.querySelector("#pause-title-color").value;
  const btnBg = container.querySelector("#pause-button-bg-color").value;
  const btnHoverBg = container.querySelector("#pause-button-hover-bg-color")
    .value;
  const btnTextColor = container.querySelector("#pause-button-text-color")
    .value;
  const btnBorderColor = container.querySelector("#pause-button-border-color")
    .value;
  const btnBorderOpacityRaw = parseFloat(
    container.querySelector("#pause-button-border-opacity").value
  );
  const btnBorderOpacity = Number.isNaN(btnBorderOpacityRaw)
    ? 0.3
    : Math.min(1, Math.max(0, btnBorderOpacityRaw));
  const btnRadius = parseFloat(
    container.querySelector("#pause-button-radius").value
  );

  overlay.style.backgroundColor = hexToRgba(overlayColor, overlayOpacity);
  const overlayOpacityLabel = container.querySelector("#pause-overlay-opacity-label");
  if (overlayOpacityLabel) overlayOpacityLabel.textContent = `Opacidad: ${overlayOpacity.toFixed(2)}`;

  menu.style.backgroundColor = menuBg;
  menu.style.border = `1px solid ${hexToRgba(menuBorderColor, menuBorderOpacity)}`;
  menu.style.borderRadius = `${Number.isNaN(menuRadius) ? 8 : menuRadius}px`;
  const menuBorderOpacityLabel = container.querySelector("#pause-menu-border-opacity-label");
  if (menuBorderOpacityLabel) menuBorderOpacityLabel.textContent = `Opacidad: ${menuBorderOpacity.toFixed(2)}`;

  title.style.color = pauseTitleColor;

  buttons.forEach((btn) => {
    btn.style.backgroundColor = btnBg;
    btn.style.color = btnTextColor;
    btn.style.border = `1px solid ${hexToRgba(btnBorderColor, btnBorderOpacity)}`;
    btn.style.borderRadius = `${Number.isNaN(btnRadius) ? 4 : btnRadius}px`;
    btn.removeEventListener("mouseenter", btn._pauseMouseEnter);
    btn.removeEventListener("mouseleave", btn._pauseMouseLeave);
    btn._pauseMouseEnter = () => {
      btn.style.backgroundColor = btnHoverBg;
      btn.style.borderColor = btnTextColor;
    };
    btn._pauseMouseLeave = () => {
      btn.style.backgroundColor = btnBg;
      btn.style.borderColor = hexToRgba(btnBorderColor, btnBorderOpacity);
    };
    btn.addEventListener("mouseenter", btn._pauseMouseEnter);
    btn.addEventListener("mouseleave", btn._pauseMouseLeave);
  });
  const btnBorderOpacityLabel = container.querySelector(
    "#pause-button-border-opacity-label"
  );
  if (btnBorderOpacityLabel) {
    btnBorderOpacityLabel.textContent = `Opacidad: ${btnBorderOpacity.toFixed(
      2
    )}`;
  }
}
