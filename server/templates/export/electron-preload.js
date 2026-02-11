const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    saveGame: (filepath, data) => ipcRenderer.invoke("save-game", filepath, data),
    loadGame: (filepath) => ipcRenderer.invoke("load-game", filepath),
    deleteFile: (filepath) => ipcRenderer.invoke("delete-file", filepath),
    fileExists: (filepath) => ipcRenderer.invoke("file-exists", filepath),
    ensureDir: (dirpath) => ipcRenderer.invoke("ensure-dir", dirpath),
    getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
    pathJoin: (...args) => ipcRenderer.invoke("path-join", args),
    pathBasename: (p) => ipcRenderer.invoke("path-basename", p),
    pathDirname: (p) => ipcRenderer.invoke("path-dirname", p),
});
