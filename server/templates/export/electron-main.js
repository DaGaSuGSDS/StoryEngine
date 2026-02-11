const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;

/**
 * CONFIGURACIÓN DE EXPORTACIÓN
 * Este objeto es reemplazado dinámicamente por ExportService.js durante la generación del ZIP.
 * Contiene los ajustes específicos del proyecto como tamaño de ventana, icono, etc.
 */
const EXPORT_CONFIG = {
    width: 1280,
    height: 720,
    resizable: true,
    iconFileName: null,
};

function createWindow() {
    // Resolver ruta del icono si está configurado
    const iconPath = EXPORT_CONFIG.iconFileName
        ? path.join(__dirname, "images", EXPORT_CONFIG.iconFileName)
        : undefined;

    const win = new BrowserWindow({
        width: EXPORT_CONFIG.width,
        height: EXPORT_CONFIG.height,
        resizable: EXPORT_CONFIG.resizable,
        icon: iconPath,
        webPreferences: {
            contextIsolation: true, // Seguridad: Aísla el contexto de la página del proceso principal
            nodeIntegration: false, // Seguridad: Deshabilita Node.js en el renderizador
            preload: path.join(__dirname, "preload.js"), // Script puente seguro
        },
    });

    // Cargar el punto de entrada del juego
    win.loadFile("index.html");
}

/* ==========================================================================
   HANDLERS DE IPC (Inter-Process Communication)
   Estos métodos son llamados desde el frontend via preload.js para operaciones de sistema.
   ========================================================================== */

// Guardar partida en disco
ipcMain.handle("save-game", async (event, filepath, data) => {
    try {
        await fs.writeFile(filepath, data, "utf-8");
        return { success: true };
    } catch (err) {
        console.error("Failed to save game:", err);
        throw err;
    }
});

// Cargar partida desde disco
ipcMain.handle("load-game", async (event, filepath) => {
    try {
        const data = await fs.readFile(filepath, "utf-8");
        return data;
    } catch (err) {
        console.error("Failed to load game:", err);
        throw err;
    }
});

// Borrar archivo
ipcMain.handle("delete-file", async (event, filepath) => {
    try {
        await fs.unlink(filepath);
        return { success: true };
    } catch (err) {
        console.error("Failed to delete file:", err);
        throw err;
    }
});

// Verificar existencia de archivo
ipcMain.handle("file-exists", async (event, filepath) => {
    try {
        await fs.access(filepath);
        return true;
    } catch (err) {
        return false;
    }
});

// Asegurar que un directorio existe (mkdir -p)
ipcMain.handle("ensure-dir", async (event, dirpath) => {
    try {
        await fs.mkdir(dirpath, { recursive: true });
        return { success: true };
    } catch (err) {
        console.error("Failed to create directory:", err);
        throw err;
    }
});

// Obtener ruta de datos de usuario (AppData/Application Support)
ipcMain.handle("get-user-data-path", () => {
    return app.getPath("userData");
});

// Utilidades de Rutas (path join/basename/dirname)
// Necesarias porque 'path' no está disponible directamente en el frontend
ipcMain.handle("path-join", (event, args) => {
    return path.join(...args);
});

ipcMain.handle("path-basename", (event, p) => {
    return path.basename(p);
});

ipcMain.handle("path-dirname", (event, p) => {
    return path.dirname(p);
});

// Ciclo de vida de la aplicación
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
