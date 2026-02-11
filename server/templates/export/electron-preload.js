const { contextBridge, ipcRenderer } = require("electron");

/**
 * PRELOAD SCRIPT
 * Expone una API segura ("electronAPI") al contexto global del navegador (window).
 * Esto permite que el juego se comunique con el proceso principal de Electron
 * sin tener acceso directo a Node.js por razones de seguridad.
 */
contextBridge.exposeInMainWorld("electronAPI", {
    // Sistema de archivos (Save/Load)
    saveGame: (filepath, data) => ipcRenderer.invoke("save-game", filepath, data),
    loadGame: (filepath) => ipcRenderer.invoke("load-game", filepath),
    deleteFile: (filepath) => ipcRenderer.invoke("delete-file", filepath),
    fileExists: (filepath) => ipcRenderer.invoke("file-exists", filepath),
    ensureDir: (dirpath) => ipcRenderer.invoke("ensure-dir", dirpath),

    // Utilidades
    getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),

    // Manipulación de rutas (equivalente a path.join, path.basename, etc.)
    pathJoin: (...args) => ipcRenderer.invoke("path-join", args),
    pathBasename: (p) => ipcRenderer.invoke("path-basename", p),
    pathDirname: (p) => ipcRenderer.invoke("path-dirname", p),
});
