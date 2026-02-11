const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;

// Configuración inyectada durante la exportación
const EXPORT_CONFIG = {
    width: 1280,
    height: 720,
    resizable: true,
    iconFileName: null,
};

function createWindow() {
    const iconPath = EXPORT_CONFIG.iconFileName
        ? path.join(__dirname, "images", EXPORT_CONFIG.iconFileName)
        : undefined;

    const win = new BrowserWindow({
        width: EXPORT_CONFIG.width,
        height: EXPORT_CONFIG.height,
        resizable: EXPORT_CONFIG.resizable,
        icon: iconPath,
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
