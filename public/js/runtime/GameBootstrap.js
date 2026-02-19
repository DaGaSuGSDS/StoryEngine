import { ProjectStore } from "../state/ProjectStore.js";
/**
 * GameBootstrap.js
 * Entry point for launching the game runtime (start screen, menus, etc.).
 */
import { StoryEngine } from "./StoryEngine.js";

let SETTINGS = {};
let ENABLE_SAVE_LOAD = true;
const START_PROMPT_DEFAULT = "Pulse cualquier tecla para empezar...";
let START_PROMPT = START_PROMPT_DEFAULT;
let START_OVERLAY_OPACITY = 1;
let START_TITLE_SIZE = 48;
let START_PROMPT_SIZE = 18;
let START_BLUR_PERCENT = 50;
let START_BLUR_PX = 6;
let START_ALIGN = "center";
let START_VERTICAL = "center";
let PROJECT_DATA = null;

let engine = null;
let saveManager = null;
let saveLoadUI = null;
let saveSystemReady = false;
let startScreenEl = null;
let startMenuEl = null;

// Helper functions for clamping and color conversion
/**
 * Clamps a number between min and max.
 * @param {string|number} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clampNumber = (value, fallback, min, max) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    const minApplied = min !== undefined ? Math.max(min, num) : num;
    return max !== undefined ? Math.min(max, minApplied) : minApplied;
};

/**
 * Clamps opacity between 0 and 1.
 * @param {string|number} value
 * @param {number} fallback
 * @returns {number}
 */
const clampOpacity = (value, fallback = 1) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(1, Math.max(0, num));
};

/**
 * Converts a color string to RGBA.
 * @param {string} color
 * @param {number} opacity
 * @param {string} fallback
 * @returns {string}
 */
const toRgba = (color, opacity, fallback) => {
    if (!color || typeof color !== "string") return fallback;
    if (color.trim().startsWith("rgb")) {
        return color;
    }
    let hex = color.replace("#", "");
    if (hex.length === 3) {
        hex = hex
            .split("")
            .map((c) => c + c)
            .join("");
    }
    if (hex.length !== 6) return fallback;
    const int = Number.parseInt(hex, 16);
    if (Number.isNaN(int)) return fallback;
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    const alpha = clampOpacity(opacity, 1);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
};

/**
 * Applies CSS variables from settings for the menu.
 */
function applyMenuStylesFromSettings() {
    const root = document.documentElement;
    const setVar = (name, value) => {
        if (value === undefined || value === null) return;
        root.style.setProperty(name, value);
    };
    const panelAlpha = 0.95;
    const panelAccentAlpha = 0.92;
    setVar(
        "--start-menu-overlay",
        toRgba(
            SETTINGS.startMenuOverlayColor,
            SETTINGS.startMenuOverlayOpacity ?? 0.82,
            "rgba(0,0,0,0.82)"
        )
    );
    setVar(
        "--start-menu-panel-start",
        toRgba(
            SETTINGS.startMenuPanelColor,
            panelAlpha,
            "rgba(32, 32, 38, 0.95)"
        )
    );
    setVar(
        "--start-menu-panel-end",
        toRgba(
            SETTINGS.startMenuPanelAccentColor,
            panelAccentAlpha,
            "rgba(22, 22, 26, 0.92)"
        )
    );
    setVar(
        "--start-menu-border",
        toRgba(
            SETTINGS.startMenuBorderColor,
            SETTINGS.startMenuBorderOpacity ?? 0.35,
            "rgba(79, 195, 247, 0.35)"
        )
    );
    setVar(
        "--start-menu-panel-radius",
        (SETTINGS.startMenuPanelRadius ?? 0) + "px"
    );
    setVar("--start-menu-title", SETTINGS.startMenuTitleColor || "#e9f7ff");
    setVar("--start-menu-hint", SETTINGS.startMenuHintColor || "#b9c6d3");
    setVar(
        "--start-menu-button-bg",
        SETTINGS.startMenuButtonBgColor || "#2a2d34"
    );
    setVar(
        "--start-menu-button-hover",
        SETTINGS.startMenuButtonHoverBgColor || "#323641"
    );
    setVar(
        "--start-menu-button-text",
        SETTINGS.startMenuButtonTextColor || "#f5f5f5"
    );
    setVar(
        "--start-menu-button-radius",
        (SETTINGS.startMenuButtonRadius ?? 6) + "px"
    );
    setVar(
        "--start-menu-primary-from",
        SETTINGS.startMenuPrimaryFromColor || "#4a4f58"
    );
    setVar("--start-menu-primary-to", SETTINGS.startMenuPrimaryToColor || "#5a606b");
    setVar(
        "--start-menu-primary-text",
        SETTINGS.startMenuPrimaryTextColor || "#f2f4f7"
    );
    setVar(
        "--start-menu-primary-border",
        SETTINGS.startMenuPrimaryBorderColor ||
        SETTINGS.startMenuPrimaryToColor ||
        SETTINGS.startMenuPrimaryFromColor ||
        "#6b7280"
    );

    setVar(
        "--save-overlay",
        toRgba(
            SETTINGS.saveOverlayColor,
            SETTINGS.saveOverlayOpacity ?? 0.8,
            "rgba(0,0,0,0.8)"
        )
    );
    setVar("--save-modal-bg", SETTINGS.saveModalBgColor || "#252526");
    setVar("--save-modal-border", SETTINGS.saveModalBorderColor || "#3e3e42");
    setVar("--save-header-bg", SETTINGS.saveHeaderBgColor || "#2d2d30");
    setVar("--save-header-text", SETTINGS.saveHeaderTextColor || "#f0f0f0");
    setVar("--save-slot-bg", SETTINGS.saveSlotBgColor || "#1e1e1e");
    setVar("--save-slot-border", SETTINGS.saveSlotBorderColor || "#3e3e42");
    setVar(
        "--save-slot-hover-border",
        SETTINGS.saveSlotHoverBorderColor || "#007acc"
    );
    setVar("--save-slot-radius", (SETTINGS.saveSlotRadius ?? 4) + "px");
    setVar("--save-slot-text", SETTINGS.saveSlotTextColor || "#f0f0f0");
    setVar("--save-slot-subtext", SETTINGS.saveSlotSubTextColor || "#aaaaaa");
    setVar("--btn-primary-bg", SETTINGS.savePrimaryButtonColor || "#4a4f58");
    setVar("--btn-primary-text", SETTINGS.savePrimaryButtonTextColor || "#f2f4f7");
    setVar("--save-delete-bg", SETTINGS.saveDeleteButtonColor || "#c92a2a");
    setVar("--save-delete-hover-bg", SETTINGS.saveDeleteButtonHoverColor || "#a61e1e");
}

/**
 * Gets the URL for the start screen image.
 * @returns {string|null}
 */
function getStartImageUrl() {
    const images = Array.isArray(PROJECT_DATA.images) ? PROJECT_DATA.images : [];
    const byId = (id) => images.find((img) => img.id === id);
    const chosen =
        (SETTINGS.startScreenImageId && byId(SETTINGS.startScreenImageId)) ||
        (SETTINGS.iconId && byId(SETTINGS.iconId)) ||
        images[0];
    return chosen ? `./images/${chosen.fileName}` : null;
}

/**
 * Renders the start screen.
 * @param {HTMLElement} playView
 * @param {Object} store
 */
function renderStartScreen(playView, store) {
    removeStartScreen();

    const imageUrl = getStartImageUrl();
    startScreenEl = document.createElement("div");
    startScreenEl.className = "start-screen";
    startScreenEl.style.justifyContent =
        START_VERTICAL === "top"
            ? "flex-start"
            : START_VERTICAL === "bottom"
                ? "flex-end"
                : "center";
    startScreenEl.style.alignItems =
        START_ALIGN === "left"
            ? "flex-start"
            : START_ALIGN === "right"
                ? "flex-end"
                : "center";
    startScreenEl.innerHTML = `
    ${imageUrl ? `<div class="start-screen__background" style="--start-blur: ${START_BLUR_PX}px; background-image: url('${imageUrl}')"></div>` : ""}
    <div class="start-screen__overlay" style="background: rgba(0,0,0,${START_OVERLAY_OPACITY});"></div>
    <div class="start-screen__content">
      <h1 class="start-screen__title" style="font-size: ${START_TITLE_SIZE}px;">${SETTINGS.gameTitle || "StoryEngine"}</h1>
      <p class="start-screen__prompt" style="font-size: ${START_PROMPT_SIZE}px;">${START_PROMPT}</p>
    </div>
  `;

    const contentEl = startScreenEl.querySelector(".start-screen__content");
    if (contentEl) {
        contentEl.style.textAlign =
            START_ALIGN === "left"
                ? "left"
                : START_ALIGN === "right"
                    ? "right"
                    : "center";
        contentEl.style.alignItems =
            START_ALIGN === "left"
                ? "flex-start"
                : START_ALIGN === "right"
                    ? "flex-end"
                    : "center";
    }

    const continueToMenu = () => {
        removeStartScreen();
        document.removeEventListener("keydown", handleKey);
        if (saveSystemReady && saveLoadUI) {
            renderStartMenu(playView, store);
        } else {
            startNewGame(playView, store);
        }
    };

    const handleKey = (e) => {
        if (e.repeat) return;
        continueToMenu();
    };

    startScreenEl.addEventListener("click", continueToMenu);
    document.addEventListener("keydown", handleKey);
    document.body.appendChild(startScreenEl);
}

/**
 * Renders the start menu (New Game / Load Game).
 * @param {HTMLElement} playView
 * @param {Object} store
 */
function renderStartMenu(playView, store) {
    removeStartMenu();

    startMenuEl = document.createElement("div");
    startMenuEl.className = "start-menu";
    startMenuEl.innerHTML = `
    <div class="start-menu__panel">
      <h2 class="start-menu__title">${SETTINGS.gameTitle || "StoryEngine"}</h2>
      <div class="start-menu__buttons">
        <button class="start-menu__button" data-action="new">Nueva partida</button>
        <button class="start-menu__button" data-action="load">Cargar partida</button>
      </div>
    </div>
  `;

    startMenuEl.querySelector('[data-action="new"]').addEventListener("click", () => {
        startNewGame(playView, store);
    });

    const loadBtn = startMenuEl.querySelector('[data-action="load"]');
    if (loadBtn) {
        loadBtn.addEventListener("click", () => {
            if (saveLoadUI) {
                saveLoadUI.showLoadModal();
            }
        });
    }

    document.body.appendChild(startMenuEl);
}

/**
 * Removes the start menu.
 */
function removeStartMenu() {
    if (startMenuEl && startMenuEl.parentNode) {
        startMenuEl.parentNode.removeChild(startMenuEl);
    }
    startMenuEl = null;
}

/**
 * Removes the start screen.
 */
function removeStartScreen() {
    if (startScreenEl && startScreenEl.parentNode) {
        startScreenEl.parentNode.removeChild(startScreenEl);
    }
    startScreenEl = null;
}

/**
 * Starts a new game.
 * @param {HTMLElement} playView
 * @param {Object} store
 */
async function startNewGame(playView, store) {
    if (saveSystemReady && saveLoadUI && saveManager) {
        await saveLoadUI.showSlotSelector(
            async (slotNumber) => {
                engine.currentSaveSlot = slotNumber;
                playView.innerHTML = "";
                await engine.playScene(store.currentScene.id, playView);
                removeStartMenu();
                setTimeout(async () => {
                    try {
                        const gameState = await engine.captureGameState();
                        if (gameState) {
                            await saveManager.saveGame(slotNumber, gameState);
                        }
                    } catch (err) {
                        console.error("Initial save failed:", err);
                    }
                }, 200);
            },
            { forceNewGame: true }
        );
        return;
    }
    playView.innerHTML = "";
    await engine.playScene(store.currentScene.id, playView);
    removeStartMenu();
}

/**
 * Initializes save system if enabled.
 * @returns {Promise<boolean>}
 */
async function initSaveSystemIfEnabled() {
    if (!ENABLE_SAVE_LOAD) {
        return false;
    }

    try {
        const [{ SaveManager }, { SaveLoadUI }] = await Promise.all([
            import("../save/SaveManager.js"),
            import("../save/SaveLoadUI.js"),
        ]);

        saveManager = new SaveManager(PROJECT_DATA.id);
        await saveManager.ensureInitialized();

        if (!saveManager.isAvailable()) {
            console.warn("Sistema de guardado no disponible (no es entorno Electron).");
            return false;
        }

        saveLoadUI = new SaveLoadUI(saveManager, engine);
        engine.saveManager = saveManager;

        saveLoadUI.onGameLoaded = () => {
            removeStartMenu();
        };

        setupKeyboardShortcuts();

        return true;
    } catch (err) {
        console.error("Save system initialization failed:", err);
        return false;
    }
}

/**
 * Sets up global keyboard shortcuts.
 */
function setupKeyboardShortcuts() {
    document.addEventListener("keydown", async (e) => {
        // ESC - Abrir menú de carga
        if (e.key === "Escape") {
            if (!saveLoadUI || !saveSystemReady) return;
            if (startScreenEl || startMenuEl) return;
            if (!saveLoadUI.isOpen) {
                saveLoadUI.showLoadModal();
            } else {
                saveLoadUI.closeModal();
            }
        }
    });
}

/**
 * Bootstraps the game execution.
 * @param {Object} projectData
 */
export async function bootstrapGame(projectData) {
    PROJECT_DATA = projectData;
    const store = new ProjectStore();
    store.setProject(PROJECT_DATA);

    SETTINGS = (store.project && store.project.settings) || {};
    ENABLE_SAVE_LOAD =
        SETTINGS.enableSaveLoad !== undefined ? SETTINGS.enableSaveLoad : true;
    START_PROMPT = SETTINGS.startScreenPrompt || START_PROMPT_DEFAULT;
    START_OVERLAY_OPACITY = clampNumber(
        SETTINGS.startScreenOverlayOpacity,
        0.75,
        0,
        1
    );
    START_TITLE_SIZE = clampNumber(SETTINGS.startScreenTitleSize, 48, 18, 120);
    START_PROMPT_SIZE = clampNumber(SETTINGS.startScreenPromptSize, 18, 12, 80);
    START_BLUR_PERCENT = clampNumber(
        SETTINGS.startScreenBlurPercent,
        50,
        0,
        100
    );
    START_BLUR_PX = (START_BLUR_PERCENT / 100) * 12;
    START_ALIGN = SETTINGS.startScreenTextAlign || "center";
    START_VERTICAL = SETTINGS.startScreenTextVertical || "center";

    applyMenuStylesFromSettings();

    engine = new StoryEngine(store, null, {
        imageBaseUrl: "./images/",
        audioBaseUrl: "./audio/",
    });

    const playView = document.getElementById("play-view");
    if (!store.currentScene) {
        console.error("No hay escena inicial configurada.");
        const msg = document.createElement("div");
        msg.textContent = "No hay escena inicial configurada.";
        playView.appendChild(msg);
        return;
    }

    saveSystemReady = await initSaveSystemIfEnabled();

    renderStartScreen(playView, store);
}
