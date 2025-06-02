import { contextBridge, ipcRenderer } from "electron";

// Expose Electron APIs to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  selectFile: () => ipcRenderer.invoke("select-file"),
  selectFiles: () => ipcRenderer.invoke("select-files"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  readFolder: (folderPath) => ipcRenderer.invoke("read-folder", folderPath),
  writeFile: (filePath, data) =>
    ipcRenderer.invoke("write-file", filePath, data),

  // App operations
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // Window operations
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),

  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // Environment detection
  isElectron: true,
  platform: process.platform,

  // For backward compatibility
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});

// Also expose a minimal require function for compatibility
contextBridge.exposeInMainWorld("require", (module) => {
  if (module === "electron") {
    return {
      ipcRenderer: {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
      },
    };
  }
  throw new Error(`Module ${module} is not allowed`);
});

// Mark that we're in Electron
contextBridge.exposeInMainWorld("process", {
  type: "renderer",
  platform: process.platform,
});
