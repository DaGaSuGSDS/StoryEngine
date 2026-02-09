const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;

async function loadWindowPreferences() {
  try {
    const raw = await fs.readFile(path.join(__dirname, "project.json"), "utf-8");
    const project = JSON.parse(raw);
    const settings = project.settings || {};
    const images = Array.isArray(project.images) ? project.images : [];

    const iconAsset =
      settings.iconId && images.length
        ? images.find((img) => img.id === settings.iconId) || null
        : null;

    return {
      width: settings.windowWidth || 1024,
      height: settings.windowHeight || 768,
      resizable:
        settings.resizable !== undefined ? settings.resizable : true,
      icon: iconAsset
        ? path.join(__dirname, "images", iconAsset.fileName)
        : undefined,
    };
  } catch (err) {
    console.warn("No se pudo leer project.json, usando valores por defecto.");
    return { width: 1024, height: 768, resizable: true, icon: undefined };
  }
}

async function createWindow() {
  const prefs = await loadWindowPreferences();
  const win = new BrowserWindow({
    width: prefs.width,
    height: prefs.height,
    resizable: prefs.resizable,
    icon: prefs.icon,
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
