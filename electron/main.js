import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
    title: "Object Builder Online - Tibia Sprite Editor",
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  win.once("ready-to-show", () => {
    win.show();
  });

  // Try different ports for development
  const tryLoadURL = async (port) => {
    try {
      await win.loadURL(`http://localhost:${port}`);
      console.log(`Loaded on port ${port}`);
    } catch (error) {
      if (port === 3001) {
        console.log("Port 3001 failed, trying 3000...");
        await tryLoadURL(3000);
      } else {
        console.error("Failed to load on both ports:", error);
      }
    }
  };

  tryLoadURL(3001);
};

// IPC Handlers for file operations
ipcMain.handle("show-open-dialog", async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const buffer = await readFile(filePath);
    return buffer;
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

// IPC Handlers
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Tibia Files", extensions: ["dat", "spr", "otfi"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  return {
    cancelled: result.canceled,
    filePaths: result.filePaths,
  };
});

ipcMain.handle("select-files", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Tibia Files", extensions: ["dat", "spr", "otfi"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  return {
    cancelled: result.canceled,
    filePaths: result.filePaths,
  };
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });

  return {
    cancelled: result.canceled,
    folderPath:
      result.filePaths && result.filePaths.length > 0
        ? result.filePaths[0]
        : null,
  };
});

ipcMain.handle("read-folder", async (event, folderPath) => {
  try {
    const fs = require("fs").promises;
    const path = require("path");

    const files = await fs.readdir(folderPath);
    const tibiaFiles = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if ([".dat", ".spr", ".otfi"].includes(ext)) {
        tibiaFiles.push(path.join(folderPath, file));
      }
    }

    return tibiaFiles;
  } catch (error) {
    console.error("Error reading folder:", error);
    throw error;
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const fs = require("fs").promises;
    const path = require("path");

    const buffer = await fs.readFile(filePath);
    const fileName = path.basename(filePath);

    // Convert buffer to File-like object
    return {
      name: fileName,
      size: buffer.length,
      type: "",
      lastModified: Date.now(),
      arrayBuffer: () =>
        Promise.resolve(
          buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
          )
        ),
      text: () => Promise.resolve(buffer.toString()),
      stream: () => {
        throw new Error("Stream not supported in Electron");
      },
      slice: (start, end) => {
        const sliced = buffer.slice(start, end);
        return new Blob([sliced]);
      },
    };
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
