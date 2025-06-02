import { contextBridge, ipcRenderer } from "electron";

// Expose Electron APIs to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // File operations
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),

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
