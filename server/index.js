const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const archiver = require("archiver");

const {
  listProjects,
  createProject,
  loadProject,
  saveProject,
  addImageToProject,
  deleteImageFromProject,
  addAudioToProject,
  deleteAudioFromProject,
} = require("./projectService");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const publicDir = path.join(__dirname, "..", "public");
const projectsDir = path.join(__dirname, "..", "projects");

app.use(express.static(publicDir));
app.use("/projects", express.static(projectsDir));

if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const projectId = req.params.id;
    const imgDir = path.join(projectsDir, projectId, "images");
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }
    cb(null, imgDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const projectId = req.params.id;
    const audioDir = path.join(projectsDir, projectId, "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    cb(null, audioDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const uploadImage = multer({ storage: imageStorage });
const uploadAudio = multer({ storage: audioStorage });

app.get("/api/projects", async (req, res) => {
  try {
    const projects = await listProjects();
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error listando proyectos");
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const body = req.body || {};
    const name =
      typeof body.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : "Proyecto";
    const project = await createProject(name);
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creando proyecto");
  }
});

app.get("/api/projects/:id", async (req, res) => {
  try {
    const project = await loadProject(req.params.id);
    if (!project) {
      res.status(404).send("Proyecto no encontrado");
      return;
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error cargando proyecto");
  }
});

app.put("/api/projects/:id", async (req, res) => {
  try {
    const project = req.body;
    if (!project || typeof project !== "object") {
      res.status(400).send("Proyecto inválido");
      return;
    }

    project.id = req.params.id;
    project.name =
      typeof project.name === "string" && project.name.trim().length > 0
        ? project.name.trim()
        : project.id;
    project.scenes = Array.isArray(project.scenes) ? project.scenes : [];
    project.characters = Array.isArray(project.characters)
      ? project.characters
      : [];
    project.flags = Array.isArray(project.flags) ? project.flags : [];
    project.images = Array.isArray(project.images) ? project.images : [];
    project.audio = Array.isArray(project.audio) ? project.audio : [];
    project.settings =
      project.settings && typeof project.settings === "object"
        ? project.settings
        : {};

    await saveProject(project);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error guardando proyecto");
  }
});

app.post(
  "/api/projects/:id/images",
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const projectId = req.params.id;
      const file = req.file;
      if (!file) {
        res.status(400).send("Falta archivo");
        return;
      }
      const asset = await addImageToProject(projectId, {
        originalName: file.originalname,
        fileName: file.filename,
      });
      res.json(asset);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error subiendo imagen");
    }
  }
);

app.delete("/api/projects/:id/images/:imageId", async (req, res) => {
  try {
    await deleteImageFromProject(req.params.id, req.params.imageId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error eliminando imagen");
  }
});

app.post(
  "/api/projects/:id/audio",
  uploadAudio.single("audio"),
  async (req, res) => {
    try {
      const projectId = req.params.id;
      const file = req.file;
      if (!file) {
        res.status(400).send("Falta archivo");
        return;
      }
      const asset = await addAudioToProject(projectId, {
        originalName: file.originalname,
        fileName: file.filename,
      });
      res.json(asset);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error subiendo audio");
    }
  }
);

app.delete("/api/projects/:id/audio/:audioId", async (req, res) => {
  try {
    await deleteAudioFromProject(req.params.id, req.params.audioId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error eliminando audio");
  }
});

app.get("/api/projects/:id/export", async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await loadProject(projectId);
    if (!project) {
      res.status(404).send("Proyecto no encontrado");
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${projectId}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res);

    archive.append(JSON.stringify(project, null, 2), {
      name: "project.json",
    });

    archive.file(path.join(publicDir, "css", "main.css"), {
      name: "styles.css",
    });
    archive.file(path.join(publicDir, "css", "save-load.css"), {
      name: "save-load.css",
    });

    const jsDir = path.join(publicDir, "js");

    archive.directory(path.join(jsDir, "models"), "js/models");
    archive.directory(path.join(jsDir, "runtime"), "js/runtime");
    archive.directory(path.join(jsDir, "save"), "js/save");
    archive.directory(path.join(jsDir, "state"), "js/state");
    archive.directory(path.join(jsDir, "utils"), "js/utils");
    archive.directory(path.join(jsDir, "commands"), "js/commands");

const inlinedProject = JSON.stringify(project, null, 2);
const gameJs = `import { ProjectStore } from "./state/ProjectStore.js";
import { StoryEngine } from "./runtime/StoryEngine.js";

const PROJECT_DATA = ${inlinedProject};
let SETTINGS = PROJECT_DATA.settings || {};
let ENABLE_SAVE_LOAD =
  SETTINGS.enableSaveLoad !== undefined ? SETTINGS.enableSaveLoad : true;
const START_PROMPT_DEFAULT = "Pulse cualquier tecla para empezar...";
let START_PROMPT = SETTINGS.startScreenPrompt || START_PROMPT_DEFAULT;
const clampNumber = (value, fallback, min, max) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const minApplied = min !== undefined ? Math.max(min, num) : num;
  return max !== undefined ? Math.min(max, minApplied) : minApplied;
};
let START_OVERLAY_OPACITY = clampNumber(
  SETTINGS.startScreenOverlayOpacity,
  0.75,
  0,
  1
);
let START_TITLE_SIZE = clampNumber(SETTINGS.startScreenTitleSize, 48, 18, 120);
let START_PROMPT_SIZE = clampNumber(SETTINGS.startScreenPromptSize, 18, 12, 80);
let START_BLUR_PERCENT = clampNumber(
  SETTINGS.startScreenBlurPercent,
  50,
  0,
  100
);
let START_BLUR_PX = (START_BLUR_PERCENT / 100) * 12;
let START_ALIGN = SETTINGS.startScreenTextAlign || "center";
let START_VERTICAL = SETTINGS.startScreenTextVertical || "center";

const clampOpacity = (value, fallback = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(1, Math.max(0, num));
};

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

let engine = null;
let saveManager = null;
let saveLoadUI = null;
let saveSystemReady = false;
let startScreenEl = null;
let startMenuEl = null;

async function bootstrap() {
  const store = new ProjectStore();
  store.setProject(PROJECT_DATA);

  SETTINGS = (store.project && store.project.settings) || SETTINGS;
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

function getStartImageUrl() {
  const images = Array.isArray(PROJECT_DATA.images) ? PROJECT_DATA.images : [];
  const byId = (id) => images.find((img) => img.id === id);
  const chosen =
    (SETTINGS.startScreenImageId && byId(SETTINGS.startScreenImageId)) ||
    (SETTINGS.iconId && byId(SETTINGS.iconId)) ||
    images[0];
  return chosen ? \`./images/\${chosen.fileName}\` : null;
}

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
  startScreenEl.innerHTML = \`
    \${imageUrl ? \`<div class="start-screen__background" style="--start-blur: \${START_BLUR_PX}px; background-image: url('\${imageUrl}')"></div>\` : ""}
    <div class="start-screen__overlay" style="background: rgba(0,0,0,\${START_OVERLAY_OPACITY});"></div>
    <div class="start-screen__content">
      <h1 class="start-screen__title" style="font-size: \${START_TITLE_SIZE}px;">\${SETTINGS.gameTitle || "StoryEngine"}</h1>
      <p class="start-screen__prompt" style="font-size: \${START_PROMPT_SIZE}px;">\${START_PROMPT}</p>
    </div>
  \`;

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

function renderStartMenu(playView, store) {
  removeStartMenu();

  startMenuEl = document.createElement("div");
  startMenuEl.className = "start-menu";
  startMenuEl.innerHTML = \`
    <div class="start-menu__panel">
      <h2 class="start-menu__title">\${SETTINGS.gameTitle || "StoryEngine"}</h2>
      <div class="start-menu__buttons">
        <button class="start-menu__button" data-action="new">Nueva partida</button>
        <button class="start-menu__button" data-action="load">Cargar partida</button>
      </div>
    </div>
  \`;

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

function removeStartMenu() {
  if (startMenuEl && startMenuEl.parentNode) {
    startMenuEl.parentNode.removeChild(startMenuEl);
  }
  startMenuEl = null;
}

function removeStartScreen() {
  if (startScreenEl && startScreenEl.parentNode) {
    startScreenEl.parentNode.removeChild(startScreenEl);
  }
  startScreenEl = null;
}

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

async function initSaveSystemIfEnabled() {
  if (!ENABLE_SAVE_LOAD) {
    return false;
  }

  try {
    const [{ SaveManager }, { SaveLoadUI }] = await Promise.all([
      import("./save/SaveManager.js"),
      import("./save/SaveLoadUI.js"),
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

bootstrap().catch((err) => {
  console.error(err);
  alert("Error inicializando el juego exportado.");
});
`;

    archive.append(gameJs, { name: "js/game.js" });

    const electronPackageJson = `{
  "name": "storyengine_${projectId}",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "devDependencies": {
    "electron": "^33.0.0"
  }
}
`;

    const settings = project.settings || {};
    const windowWidth = settings.windowWidth || 1280;
    const windowHeight = settings.windowHeight || 720;
    const resizable =
      settings.resizable !== undefined ? settings.resizable : true;
    const iconAsset =
      settings.iconId && Array.isArray(project.images)
        ? project.images.find((img) => img.id === settings.iconId) || null
        : null;
    const iconFileName = iconAsset ? iconAsset.fileName : null;

    const electronMainJs = `const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;

const iconPath = ${iconFileName ? `path.join(__dirname, "images", "${iconFileName}")` : "null"};

function createWindow() {
  const win = new BrowserWindow({
    width: ${windowWidth},
    height: ${windowHeight},
    resizable: ${resizable},
    icon: iconPath || undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.loadFile("index.html");
}

// IPC Handlers for save system
ipcMain.handle("save-game", async (event, filepath, data) => {
  try {
    await fs.writeFile(filepath, data, "utf-8");
    return { success: true };
  } catch (err) {
    console.error("Failed to save game:", err);
    throw err;
  }
});

ipcMain.handle("load-game", async (event, filepath) => {
  try {
    const data = await fs.readFile(filepath, "utf-8");
    return data;
  } catch (err) {
    console.error("Failed to load game:", err);
    throw err;
  }
});

ipcMain.handle("delete-file", async (event, filepath) => {
  try {
    await fs.unlink(filepath);
    return { success: true };
  } catch (err) {
    console.error("Failed to delete file:", err);
    throw err;
  }
});

ipcMain.handle("file-exists", async (event, filepath) => {
  try {
    await fs.access(filepath);
    return true;
  } catch (err) {
    return false;
  }
});

ipcMain.handle("ensure-dir", async (event, dirpath) => {
  try {
    await fs.mkdir(dirpath, { recursive: true });
    return { success: true };
  } catch (err) {
    console.error("Failed to create directory:", err);
    throw err;
  }
});

ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});

// Path utilities handlers
ipcMain.handle("path-join", (event, args) => {
  return path.join(...args);
});

ipcMain.handle("path-basename", (event, p) => {
  return path.basename(p);
});

ipcMain.handle("path-dirname", (event, p) => {
  return path.dirname(p);
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
`;

    archive.append(electronPackageJson, { name: "package.json" });
    archive.append(electronMainJs, { name: "main.js" });

    // Agregar preload script
    const preloadJs = `const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  path: {
    join: (...args) => ipcRenderer.invoke("path-join", args),
    basename: (p) => ipcRenderer.invoke("path-basename", p),
    dirname: (p) => ipcRenderer.invoke("path-dirname", p),
  },
  saveGame: (filepath, data) => ipcRenderer.invoke("save-game", filepath, data),
  loadGame: (filepath) => ipcRenderer.invoke("load-game", filepath),
  deleteFile: (filepath) => ipcRenderer.invoke("delete-file", filepath),
  fileExists: (filepath) => ipcRenderer.invoke("file-exists", filepath),
  ensureDir: (dirpath) => ipcRenderer.invoke("ensure-dir", dirpath),
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
});
`;

    archive.append(preloadJs, { name: "preload.js" });

    const indexHtml = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Juego exportado</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="./styles.css" />
    <link rel="stylesheet" href="./save-load.css" />
  </head>
  <body>
    <div id="app">
      <main class="tab-content">
        <div id="play-view" class="play-view"></div>
      </main>
    </div>
    <script type="module" src="./js/game.js"></script>
  </body>
</html>
`;

    archive.append(indexHtml, { name: "index.html" });

    const imagesDir = path.join(projectsDir, projectId, "images");
    if (fs.existsSync(imagesDir)) {
      archive.directory(imagesDir, "images");
    }

    const audioDir = path.join(projectsDir, projectId, "audio");
    if (fs.existsSync(audioDir)) {
      archive.directory(audioDir, "audio");
    }

    archive.finalize();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).send("Error exportando proyecto");
    } else {
      res.end();
    }
  }
});

app.listen(port, () => {
  console.log(`StoryEnginev2 escuchando en http://localhost:${port}`);
});
