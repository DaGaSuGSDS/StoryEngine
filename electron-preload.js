/**
 * Electron Preload Script
 * Expone APIs seguras de Node.js al renderer process
 */
const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");

contextBridge.exposeInMainWorld("electron", {
  // Path utilities
  path: {
    join: (...args) => path.join(...args),
    basename: (p) => path.basename(p),
    dirname: (p) => path.dirname(p),
  },

  // File system operations (via IPC to main process)
  saveGame: (filepath, data) => ipcRenderer.invoke("save-game", filepath, data),
  loadGame: (filepath) => ipcRenderer.invoke("load-game", filepath),
  deleteFile: (filepath) => ipcRenderer.invoke("delete-file", filepath),
  fileExists: (filepath) => ipcRenderer.invoke("file-exists", filepath),
  ensureDir: (dirpath) => ipcRenderer.invoke("ensure-dir", dirpath),
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
});
