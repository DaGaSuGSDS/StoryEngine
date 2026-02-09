/**
 * Normaliza colores hex a formato #rrggbb. Si no es válido, devuelve el fallback.
 */
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

/**
 * ProjectSettings - Configuración del proyecto exportado
 */
export class ProjectSettings {
  constructor(data = {}) {
    // Información básica
    this.gameTitle = data.gameTitle || "Mi Juego";
    this.gameVersion = data.gameVersion || "1.0.0";
    this.author = data.author || "";

    // Icono del juego (para Electron)
    this.iconId = data.iconId || null; // ID de imagen en imagesTab
    this.startScreenImageId = data.startScreenImageId || null; // Imagen de portada (opcional)
    this.startScreenPrompt =
      data.startScreenPrompt || "Pulse cualquier tecla para empezar...";
    this.startScreenBlurPercent =
      data.startScreenBlurPercent !== undefined
        ? data.startScreenBlurPercent
        : 50; // 0-100
    this.startScreenOverlayOpacity =
      data.startScreenOverlayOpacity !== undefined
        ? data.startScreenOverlayOpacity
        : 0.75;
    this.startScreenTitleSize =
      data.startScreenTitleSize !== undefined
        ? data.startScreenTitleSize
        : 48;
    this.startScreenPromptSize =
      data.startScreenPromptSize !== undefined
        ? data.startScreenPromptSize
        : 18;
    this.startScreenTextAlign = data.startScreenTextAlign || "center"; // left, center, right
    this.startScreenTextVertical =
      data.startScreenTextVertical || "center"; // top, center, bottom

    // Menú inicial y guardados
    this.startMenuOverlayColor = sanitizeHexColor(
      data.startMenuOverlayColor,
      "#000000"
    );
    this.startMenuOverlayOpacity =
      data.startMenuOverlayOpacity !== undefined
        ? data.startMenuOverlayOpacity
        : 0.82;
    this.startMenuPanelColor = sanitizeHexColor(
      data.startMenuPanelColor,
      "#202026"
    );
    this.startMenuPanelAccentColor = sanitizeHexColor(
      data.startMenuPanelAccentColor,
      "#16161a"
    );
    this.startMenuBorderColor = sanitizeHexColor(
      data.startMenuBorderColor,
      "#4fc3f7"
    );
    this.startMenuBorderOpacity =
      data.startMenuBorderOpacity !== undefined
        ? data.startMenuBorderOpacity
        : 0.35;
    this.startMenuPanelRadius =
      data.startMenuPanelRadius !== undefined ? data.startMenuPanelRadius : 0;
    this.startMenuTitleColor = sanitizeHexColor(
      data.startMenuTitleColor,
      "#e9f7ff"
    );
    this.startMenuHintColor = sanitizeHexColor(
      data.startMenuHintColor,
      "#b9c6d3"
    );
    this.startMenuButtonBgColor = sanitizeHexColor(
      data.startMenuButtonBgColor,
      "#2a2d34"
    );
    this.startMenuButtonHoverBgColor = sanitizeHexColor(
      data.startMenuButtonHoverBgColor,
      "#323641"
    );
    this.startMenuButtonTextColor = sanitizeHexColor(
      data.startMenuButtonTextColor,
      "#f5f5f5"
    );
    this.startMenuButtonRadius =
      data.startMenuButtonRadius !== undefined
        ? data.startMenuButtonRadius
        : 6;
    const startMenuBtnBase = this.startMenuButtonBgColor || "#2a2d34";
    const startMenuBtnHover =
      this.startMenuButtonHoverBgColor || startMenuBtnBase || "#323641";
    const startMenuBtnText = this.startMenuButtonTextColor || "#f5f5f5";
    this.startMenuPrimaryFromColor = sanitizeHexColor(
      data.startMenuPrimaryFromColor,
      startMenuBtnBase
    );
    this.startMenuPrimaryToColor = sanitizeHexColor(
      data.startMenuPrimaryToColor,
      startMenuBtnHover
    );
    this.startMenuPrimaryTextColor = sanitizeHexColor(
      data.startMenuPrimaryTextColor,
      startMenuBtnText
    );
    this.startMenuPrimaryBorderColor = sanitizeHexColor(
      data.startMenuPrimaryBorderColor,
      startMenuBtnHover || startMenuBtnBase
    );

    const replaceIfOld = (value, next, ...oldValues) => {
      if (!value) return value;
      const lower = String(value).toLowerCase();
      const oldMatches = oldValues.some(
        (oldVal) => oldVal && lower === String(oldVal).toLowerCase()
      );
      return oldMatches ? next : value;
    };

    this.startMenuPrimaryFromColor = replaceIfOld(
      this.startMenuPrimaryFromColor,
      startMenuBtnBase,
      "#4a4f58",
      "#0a84ff"
    );
    this.startMenuPrimaryToColor = replaceIfOld(
      this.startMenuPrimaryToColor,
      startMenuBtnHover,
      "#5a606b",
      "#00bcd4"
    );
    this.startMenuPrimaryTextColor = replaceIfOld(
      this.startMenuPrimaryTextColor,
      startMenuBtnText,
      "#f2f4f7",
      "#0b0b10"
    );
    this.startMenuPrimaryBorderColor = replaceIfOld(
      this.startMenuPrimaryBorderColor,
      startMenuBtnHover || startMenuBtnBase,
      "#6b7280",
      "#26c6da"
    );

    this.saveOverlayColor = sanitizeHexColor(
      data.saveOverlayColor,
      "#000000"
    );
    this.saveOverlayOpacity =
      data.saveOverlayOpacity !== undefined ? data.saveOverlayOpacity : 0.8;
    this.saveModalBgColor = sanitizeHexColor(
      data.saveModalBgColor,
      "#252526"
    );
    this.saveModalBorderColor = sanitizeHexColor(
      data.saveModalBorderColor,
      "#3e3e42"
    );
    this.saveHeaderBgColor = sanitizeHexColor(
      data.saveHeaderBgColor,
      "#2d2d30"
    );
    this.saveHeaderTextColor = sanitizeHexColor(
      data.saveHeaderTextColor,
      "#f0f0f0"
    );
    this.saveSlotBgColor = sanitizeHexColor(
      data.saveSlotBgColor,
      "#1e1e1e"
    );
    this.saveSlotBorderColor = sanitizeHexColor(
      data.saveSlotBorderColor,
      "#3e3e42"
    );
    this.saveSlotHoverBorderColor = sanitizeHexColor(
      data.saveSlotHoverBorderColor,
      "#007acc"
    );
    this.saveSlotRadius =
      data.saveSlotRadius !== undefined ? data.saveSlotRadius : 4;
    this.saveSlotTextColor = sanitizeHexColor(
      data.saveSlotTextColor,
      "#f0f0f0"
    );
    this.saveSlotSubTextColor = sanitizeHexColor(
      data.saveSlotSubTextColor,
      "#aaaaaa"
    );
    this.savePrimaryButtonColor = sanitizeHexColor(
      data.savePrimaryButtonColor,
      "#4a4f58"
    );
    this.savePrimaryButtonTextColor = sanitizeHexColor(
      data.savePrimaryButtonTextColor,
      "#f2f4f7"
    );
    this.saveDeleteButtonColor = sanitizeHexColor(
      data.saveDeleteButtonColor,
      "#c92a2a"
    );
    this.saveDeleteButtonHoverColor = sanitizeHexColor(
      data.saveDeleteButtonHoverColor,
      "#a61e1e"
    );
    this.savePrimaryButtonColor = replaceIfOld(
      this.savePrimaryButtonColor,
      "#4a4f58",
      "#007acc"
    );
    this.savePrimaryButtonTextColor = replaceIfOld(
      this.savePrimaryButtonTextColor,
      "#f2f4f7",
      "#f0f0f0"
    );

    // Estilo de diálogo
    this.dialogueStyle = data.dialogueStyle || "classic"; // "classic", "bubble", "minimal"
    this.dialogueBoxColor = sanitizeHexColor(
      data.dialogueBoxColor,
      "#1e1e1e"
    );
    this.dialogueTextColor = sanitizeHexColor(
      data.dialogueTextColor,
      "#ffffff"
    );
    this.dialogueNameColor = sanitizeHexColor(
      data.dialogueNameColor,
      "#4fc3f7"
    );
    this.dialogueFontSize = data.dialogueFontSize || 18;
    this.dialoguePosition = data.dialoguePosition || "bottom"; // "bottom", "center", "top", "full"

    // Características del juego
    this.enableSaveLoad =
      data.enableSaveLoad !== undefined ? data.enableSaveLoad : true;
    this.enableBacklog =
      data.enableBacklog !== undefined ? data.enableBacklog : true;

    // Velocidad de texto
    this.textSpeed = data.textSpeed || 50; // ms por carácter

    // Resolución de ventana
    this.windowWidth = data.windowWidth || 1280;
    this.windowHeight = data.windowHeight || 720;
    this.resizable = data.resizable !== undefined ? data.resizable : true;

    // Estilo del menú de pausa
    this.pauseOverlayColor = sanitizeHexColor(
      data.pauseOverlayColor,
      "#000000"
    );
    this.pauseOverlayOpacity =
      data.pauseOverlayOpacity !== undefined ? data.pauseOverlayOpacity : 0.85;
    this.pauseMenuBgColor = sanitizeHexColor(
      data.pauseMenuBgColor,
      "#1f1f1f"
    );
    this.pauseMenuBorderColor = sanitizeHexColor(
      data.pauseMenuBorderColor,
      "#9e9e9e"
    );
    this.pauseMenuBorderOpacity =
      data.pauseMenuBorderOpacity !== undefined
        ? data.pauseMenuBorderOpacity
        : 0.35;
    this.pauseMenuRadius =
      data.pauseMenuRadius !== undefined ? data.pauseMenuRadius : 8;
    this.pauseTitleColor = sanitizeHexColor(
      data.pauseTitleColor,
      "#f2f2f2"
    );
    this.pauseButtonBgColor = sanitizeHexColor(
      data.pauseButtonBgColor,
      "#2a2a2a"
    );
    this.pauseButtonHoverBgColor = sanitizeHexColor(
      data.pauseButtonHoverBgColor,
      "#3a3a3a"
    );
    this.pauseButtonTextColor = sanitizeHexColor(
      data.pauseButtonTextColor,
      "#e0e0e0"
    );
    this.pauseButtonBorderColor = sanitizeHexColor(
      data.pauseButtonBorderColor,
      "#9e9e9e"
    );
    this.pauseButtonBorderOpacity =
      data.pauseButtonBorderOpacity !== undefined
        ? data.pauseButtonBorderOpacity
        : 0.45;
    this.pauseButtonRadius =
      data.pauseButtonRadius !== undefined ? data.pauseButtonRadius : 4;
  }

  toJSON() {
    return {
      gameTitle: this.gameTitle,
      gameVersion: this.gameVersion,
      author: this.author,
      iconId: this.iconId,
      startScreenImageId: this.startScreenImageId,
      startScreenPrompt: this.startScreenPrompt,
      startScreenBlurPercent: this.startScreenBlurPercent,
      startScreenOverlayOpacity: this.startScreenOverlayOpacity,
      startScreenTitleSize: this.startScreenTitleSize,
      startScreenPromptSize: this.startScreenPromptSize,
      startScreenTextAlign: this.startScreenTextAlign,
      startScreenTextVertical: this.startScreenTextVertical,
      startMenuOverlayColor: this.startMenuOverlayColor,
      startMenuOverlayOpacity: this.startMenuOverlayOpacity,
      startMenuPanelColor: this.startMenuPanelColor,
      startMenuPanelAccentColor: this.startMenuPanelAccentColor,
      startMenuBorderColor: this.startMenuBorderColor,
      startMenuBorderOpacity: this.startMenuBorderOpacity,
      startMenuPanelRadius: this.startMenuPanelRadius,
      startMenuTitleColor: this.startMenuTitleColor,
      startMenuHintColor: this.startMenuHintColor,
      startMenuButtonBgColor: this.startMenuButtonBgColor,
      startMenuButtonHoverBgColor: this.startMenuButtonHoverBgColor,
      startMenuButtonTextColor: this.startMenuButtonTextColor,
      startMenuButtonRadius: this.startMenuButtonRadius,
      startMenuPrimaryFromColor: this.startMenuPrimaryFromColor,
      startMenuPrimaryToColor: this.startMenuPrimaryToColor,
      startMenuPrimaryTextColor: this.startMenuPrimaryTextColor,
      startMenuPrimaryBorderColor: this.startMenuPrimaryBorderColor,
      saveOverlayColor: this.saveOverlayColor,
      saveOverlayOpacity: this.saveOverlayOpacity,
      saveModalBgColor: this.saveModalBgColor,
      saveModalBorderColor: this.saveModalBorderColor,
      saveHeaderBgColor: this.saveHeaderBgColor,
      saveHeaderTextColor: this.saveHeaderTextColor,
      saveSlotBgColor: this.saveSlotBgColor,
      saveSlotBorderColor: this.saveSlotBorderColor,
      saveSlotHoverBorderColor: this.saveSlotHoverBorderColor,
      saveSlotRadius: this.saveSlotRadius,
      saveSlotTextColor: this.saveSlotTextColor,
      saveSlotSubTextColor: this.saveSlotSubTextColor,
      savePrimaryButtonColor: this.savePrimaryButtonColor,
      savePrimaryButtonTextColor: this.savePrimaryButtonTextColor,
      saveDeleteButtonColor: this.saveDeleteButtonColor,
      saveDeleteButtonHoverColor: this.saveDeleteButtonHoverColor,
      dialogueStyle: this.dialogueStyle,
      dialogueBoxColor: this.dialogueBoxColor,
      dialogueTextColor: this.dialogueTextColor,
      dialogueNameColor: this.dialogueNameColor,
      dialogueFontSize: this.dialogueFontSize,
      dialoguePosition: this.dialoguePosition,
      enableSaveLoad: this.enableSaveLoad,
      enableBacklog: this.enableBacklog,
      textSpeed: this.textSpeed,
      windowWidth: this.windowWidth,
      windowHeight: this.windowHeight,
      resizable: this.resizable,
      pauseOverlayColor: this.pauseOverlayColor,
      pauseOverlayOpacity: this.pauseOverlayOpacity,
      pauseMenuBgColor: this.pauseMenuBgColor,
      pauseMenuBorderColor: this.pauseMenuBorderColor,
      pauseMenuBorderOpacity: this.pauseMenuBorderOpacity,
      pauseMenuRadius: this.pauseMenuRadius,
      pauseTitleColor: this.pauseTitleColor,
      pauseButtonBgColor: this.pauseButtonBgColor,
      pauseButtonHoverBgColor: this.pauseButtonHoverBgColor,
      pauseButtonTextColor: this.pauseButtonTextColor,
      pauseButtonBorderColor: this.pauseButtonBorderColor,
      pauseButtonBorderOpacity: this.pauseButtonBorderOpacity,
      pauseButtonRadius: this.pauseButtonRadius,
    };
  }

  static fromJSON(json) {
    return new ProjectSettings(json);
  }
}
