const sanitizeHexColor = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  const short = value.match(/^#([0-9a-fA-F]{3})$/);
  if (short) {
    const chars = short[1].split('');
    return `#${chars[0]}${chars[0]}${chars[1]}${chars[1]}${chars[2]}${chars[2]}`;
  }
  const full = value.match(/^#[0-9a-fA-F]{6}$/);
  return full ? full[0] : fallback;
};

const clampNumber = (rawValue, fallback, min, max) => {
  const parsed = Number.parseFloat(rawValue);
  const baseValue = Number.isNaN(parsed) ? fallback : parsed;
  const minApplied = min !== undefined ? Math.max(min, baseValue) : baseValue;
  return max !== undefined ? Math.min(max, minApplied) : minApplied;
};

const getInputValue = (container, selector, fallback = null) => {
  const el = container?.querySelector(selector);
  return el?.value !== undefined ? el.value : fallback;
};

const getCheckboxValue = (container, selector, fallback = false) => {
  const el = container?.querySelector(selector);
  return el?.checked !== undefined ? el.checked : fallback;
};

export function applySettingsFromForm(container, settings) {
  if (!container || !settings) return settings;

  // Información básica
  settings.gameTitle = getInputValue(container, "#game-title", settings.gameTitle);
  settings.gameVersion = getInputValue(container, "#game-version", settings.gameVersion);
  settings.author = getInputValue(container, "#game-author", settings.author);
  settings.iconId = getInputValue(container, "#game-icon", null) || null;
  settings.startScreenImageId =
    getInputValue(container, "#start-screen-image", null) || null;
  settings.startScreenPrompt =
    getInputValue(container, "#start-screen-prompt", settings.startScreenPrompt) || settings.startScreenPrompt;
  settings.startScreenBlurPercent = clampNumber(
    getInputValue(container, "#start-screen-blur"),
    settings.startScreenBlurPercent,
    0,
    100
  );
  settings.startScreenOverlayOpacity = clampNumber(
    getInputValue(container, "#start-screen-overlay-opacity"),
    settings.startScreenOverlayOpacity,
    0,
    1
  );
  settings.startScreenTitleSize = clampNumber(
    getInputValue(container, "#start-screen-title-size"),
    settings.startScreenTitleSize,
    18,
    120
  );
  settings.startScreenPromptSize = clampNumber(
    getInputValue(container, "#start-screen-prompt-size"),
    settings.startScreenPromptSize,
    12,
    80
  );
  settings.startScreenTextAlign =
    getInputValue(container, "#start-screen-align") || settings.startScreenTextAlign;
  settings.startScreenTextVertical =
    getInputValue(container, "#start-screen-vertical") || settings.startScreenTextVertical;

  // Menú de inicio y sistema de guardado
  settings.startMenuOverlayColor = sanitizeHexColor(
    getInputValue(container, "#start-menu-overlay-color"),
    settings.startMenuOverlayColor
  );
  settings.startMenuOverlayOpacity = clampNumber(
    getInputValue(container, "#start-menu-overlay-opacity"),
    settings.startMenuOverlayOpacity,
    0,
    1
  );
  settings.startMenuPanelColor = sanitizeHexColor(
    getInputValue(container, "#start-menu-panel-color"),
    settings.startMenuPanelColor
  );
  settings.startMenuPanelAccentColor = sanitizeHexColor(
    getInputValue(container, "#start-menu-panel-accent-color"),
    settings.startMenuPanelAccentColor
  );
  settings.startMenuBorderColor = sanitizeHexColor(
    getInputValue(container, "#start-menu-border-color"),
    settings.startMenuBorderColor
  );
  settings.startMenuBorderOpacity = clampNumber(
    getInputValue(container, "#start-menu-border-opacity"),
    settings.startMenuBorderOpacity,
    0,
    1
  );
  settings.startMenuPanelRadius = clampNumber(
    getInputValue(container, "#start-menu-panel-radius"),
    settings.startMenuPanelRadius,
    0,
    48
  );
  settings.startMenuTitleColor = sanitizeHexColor(
    getInputValue(container, "#start-menu-title-color"),
    settings.startMenuTitleColor
  );
  settings.startMenuButtonBgColor = sanitizeHexColor(
    getInputValue(container, "#start-menu-button-bg-color"),
    settings.startMenuButtonBgColor
  );
  settings.startMenuButtonHoverBgColor = sanitizeHexColor(
    getInputValue(container, "#start-menu-button-hover-bg-color"),
    settings.startMenuButtonHoverBgColor
  );
  settings.startMenuButtonTextColor = sanitizeHexColor(
    getInputValue(container, "#start-menu-button-text-color"),
    settings.startMenuButtonTextColor
  );
  settings.startMenuButtonRadius = clampNumber(
    getInputValue(container, "#start-menu-button-radius"),
    settings.startMenuButtonRadius,
    0,
    24
  );

  settings.saveOverlayColor = sanitizeHexColor(
    getInputValue(container, "#save-overlay-color"),
    settings.saveOverlayColor
  );
  settings.saveOverlayOpacity = clampNumber(
    getInputValue(container, "#save-overlay-opacity"),
    settings.saveOverlayOpacity,
    0,
    1
  );
  settings.saveModalBgColor = sanitizeHexColor(
    getInputValue(container, "#save-modal-bg-color"),
    settings.saveModalBgColor
  );
  settings.saveModalBorderColor = sanitizeHexColor(
    getInputValue(container, "#save-modal-border-color"),
    settings.saveModalBorderColor
  );
  settings.saveHeaderBgColor = sanitizeHexColor(
    getInputValue(container, "#save-header-bg-color"),
    settings.saveHeaderBgColor
  );
  settings.saveHeaderTextColor = sanitizeHexColor(
    getInputValue(container, "#save-header-text-color"),
    settings.saveHeaderTextColor
  );
  settings.saveSlotBgColor = sanitizeHexColor(
    getInputValue(container, "#save-slot-bg-color"),
    settings.saveSlotBgColor
  );
  settings.saveSlotBorderColor = sanitizeHexColor(
    getInputValue(container, "#save-slot-border-color"),
    settings.saveSlotBorderColor
  );
  settings.saveSlotHoverBorderColor = sanitizeHexColor(
    getInputValue(container, "#save-slot-hover-border-color"),
    settings.saveSlotHoverBorderColor
  );
  settings.saveSlotRadius = clampNumber(
    getInputValue(container, "#save-slot-radius"),
    settings.saveSlotRadius,
    0,
    24
  );
  settings.saveSlotTextColor = sanitizeHexColor(
    getInputValue(container, "#save-slot-text-color"),
    settings.saveSlotTextColor
  );
  settings.saveSlotSubTextColor = sanitizeHexColor(
    getInputValue(container, "#save-slot-subtext-color"),
    settings.saveSlotSubTextColor
  );
  settings.savePrimaryButtonColor = sanitizeHexColor(
    getInputValue(container, "#save-primary-button-color"),
    settings.savePrimaryButtonColor
  );
  settings.savePrimaryButtonTextColor = sanitizeHexColor(
    getInputValue(container, "#save-primary-button-text-color"),
    settings.savePrimaryButtonTextColor
  );
  settings.saveDeleteButtonColor = sanitizeHexColor(
    getInputValue(container, "#save-delete-button-color"),
    settings.saveDeleteButtonColor
  );
  settings.saveDeleteButtonHoverColor = sanitizeHexColor(
    getInputValue(container, "#save-delete-button-hover-color"),
    settings.saveDeleteButtonHoverColor
  );

  // Diálogo
  settings.dialogueStyle = getInputValue(container, "#dialogue-style", settings.dialogueStyle);
  settings.dialogueBoxColor = sanitizeHexColor(
    getInputValue(container, "#dialogue-box-color"),
    settings.dialogueBoxColor
  );
  settings.dialogueTextColor = sanitizeHexColor(
    getInputValue(container, "#dialogue-text-color"),
    settings.dialogueTextColor
  );
  settings.dialogueNameColor = sanitizeHexColor(
    getInputValue(container, "#dialogue-name-color"),
    settings.dialogueNameColor
  );
  settings.dialogueFontSize = clampNumber(
    getInputValue(container, "#dialogue-font-size"),
    settings.dialogueFontSize,
    12,
    32
  );

  // Características
  settings.enableSaveLoad = getCheckboxValue(container, "#enable-save-load", settings.enableSaveLoad);
  settings.enableBacklog = getCheckboxValue(container, "#enable-backlog", settings.enableBacklog);

  // Opciones de juego
  settings.textSpeed = clampNumber(
    getInputValue(container, "#text-speed"),
    settings.textSpeed,
    0,
    200
  );
  settings.windowWidth = clampNumber(
    getInputValue(container, "#window-width"),
    settings.windowWidth,
    800,
    3840
  );
  settings.windowHeight = clampNumber(
    getInputValue(container, "#window-height"),
    settings.windowHeight,
    600,
    2160
  );
  settings.resizable = getCheckboxValue(container, "#window-resizable", settings.resizable);

  // Estilos del menú de pausa
  settings.pauseOverlayColor = sanitizeHexColor(
    getInputValue(container, "#pause-overlay-color"),
    settings.pauseOverlayColor
  );
  settings.pauseOverlayOpacity = clampNumber(
    getInputValue(container, "#pause-overlay-opacity"),
    settings.pauseOverlayOpacity,
    0,
    1
  );
  settings.pauseMenuBgColor = sanitizeHexColor(
    getInputValue(container, "#pause-menu-bg-color"),
    settings.pauseMenuBgColor
  );
  settings.pauseMenuBorderColor = sanitizeHexColor(
    getInputValue(container, "#pause-menu-border-color"),
    settings.pauseMenuBorderColor
  );
  settings.pauseMenuBorderOpacity = clampNumber(
    getInputValue(container, "#pause-menu-border-opacity"),
    settings.pauseMenuBorderOpacity,
    0,
    1
  );
  settings.pauseMenuRadius = clampNumber(
    getInputValue(container, "#pause-menu-radius"),
    settings.pauseMenuRadius,
    0,
    24
  );
  settings.pauseTitleColor = sanitizeHexColor(
    getInputValue(container, "#pause-title-color"),
    settings.pauseTitleColor
  );
  settings.pauseButtonBgColor = sanitizeHexColor(
    getInputValue(container, "#pause-button-bg-color"),
    settings.pauseButtonBgColor
  );
  settings.pauseButtonHoverBgColor = sanitizeHexColor(
    getInputValue(container, "#pause-button-hover-bg-color"),
    settings.pauseButtonHoverBgColor
  );
  settings.pauseButtonTextColor = sanitizeHexColor(
    getInputValue(container, "#pause-button-text-color"),
    settings.pauseButtonTextColor
  );
  settings.pauseButtonBorderColor = sanitizeHexColor(
    getInputValue(container, "#pause-button-border-color"),
    settings.pauseButtonBorderColor
  );
  settings.pauseButtonBorderOpacity = clampNumber(
    getInputValue(container, "#pause-button-border-opacity"),
    settings.pauseButtonBorderOpacity,
    0,
    1
  );
  settings.pauseButtonRadius = clampNumber(
    getInputValue(container, "#pause-button-radius"),
    settings.pauseButtonRadius,
    0,
    24
  );

  return settings;
}
