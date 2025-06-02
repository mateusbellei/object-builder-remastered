import { ref, computed, reactive } from "vue";
import type {
  ProjectData,
  DatFileData,
  SprFileData,
  OtfiMetadata,
  ThingType,
  TibiaSprite,
  ProtocolVersion,
  LoadFileOptions,
  ExportOptions,
  SpriteSheetOptions,
  ImportSpriteSheetOptions,
} from "~/types/tibia";

import {
  PROTOCOL_VERSIONS,
  TibiaFileError,
  ThingCategory,
} from "~/types/tibia";

import {
  parseDatFile,
  parseSprFile,
  parseOtfiFile,
  getProtocolForClientVersion,
  detectProtocolFromSignatures,
} from "~/utils/tibiaFileParser";

// Type declarations for browser APIs
declare global {
  interface Window {
    electronAPI?: {
      selectFolder(): Promise<{ cancelled: boolean; folderPath?: string }>;
      readFolder(folderPath: string): Promise<string[]>;
      readFile(filePath: string): Promise<File>;
      selectFile(): Promise<{ cancelled: boolean; filePaths?: string[] }>;
      selectFiles(): Promise<{ cancelled: boolean; filePaths?: string[] }>;
    };
    showDirectoryPicker?(): Promise<any>;
  }
}

interface LoadingProgress {
  isLoading: boolean;
  currentFile: string;
  progress: number;
  datProgress: number;
  sprProgress: number;
  stage: string;
}

const loadingProgress = ref<LoadingProgress>({
  isLoading: false,
  currentFile: "",
  progress: 0,
  datProgress: 0,
  sprProgress: 0,
  stage: "",
});

export const useTibiaFiles = () => {
  // Current project state
  const projectState = reactive<ProjectData>({
    protocol: "12.86",
    clientVersion: 1286,
    datFile: null,
    sprFile: null,
    otfiMetadata: null,
    isLoaded: false,
    loadedFiles: {
      dat: false,
      spr: false,
      otfi: false,
    },
  });

  /**
   * Load project files with real parsing
   */
  const loadProject = async (files: LoadFileOptions) => {
    try {
      // Initialize loading progress
      loadingProgress.value = {
        isLoading: true,
        currentFile: "",
        progress: 0,
        datProgress: 0,
        sprProgress: 0,
        stage: "Starting...",
      };

      projectState.isLoaded = false;
      projectState.loadedFiles = { dat: false, spr: false, otfi: false };

      let detectedProtocol: ProtocolVersion | null = null;
      let datSignature: number | null = null;
      let sprSignature: number | null = null;

      // Load OTFI first to get metadata
      if (files.otfi) {
        loadingProgress.value.stage = "Loading OTFI metadata...";
        loadingProgress.value.progress = 10;

        try {
          const otfiData = await parseOtfiFile(files.otfi);
          projectState.otfiMetadata = otfiData;
          projectState.loadedFiles.otfi = true;

          console.log("OTFI metadata loaded:", otfiData);
        } catch (error) {
          console.error("Error loading OTFI file:", error);
          throw error;
        }
      }

      // Pre-read signatures to detect protocol
      if (files.dat && files.spr) {
        loadingProgress.value.stage = "Detecting protocol...";
        loadingProgress.value.progress = 20;

        try {
          // Read DAT signature
          const datBuffer = await files.dat.arrayBuffer();
          const datView = new DataView(datBuffer);
          datSignature = datView.getUint32(0, true); // little endian

          // Read SPR signature
          const sprBuffer = await files.spr.arrayBuffer();
          const sprView = new DataView(sprBuffer);
          sprSignature = sprView.getUint32(0, true); // little endian

          // Detect protocol from signatures
          detectedProtocol = detectProtocolFromSignatures(
            datSignature,
            sprSignature
          );

          console.log("🔍 Protocol detected from signatures:", {
            dat: datSignature.toString(16).toUpperCase(),
            spr: sprSignature.toString(16).toUpperCase(),
            protocol: detectedProtocol.version,
          });

          // Update project state with detected protocol
          projectState.protocol = detectedProtocol.version;

          // Try to get client version from protocol
          if (detectedProtocol.clientVersionMin) {
            projectState.clientVersion = detectedProtocol.clientVersionMin;
          }
        } catch (error) {
          console.warn("Could not detect protocol from signatures:", error);
        }
      }

      // Load DAT file
      if (files.dat) {
        loadingProgress.value.stage = "Parsing DAT file...";
        loadingProgress.value.currentFile = files.dat.name;
        loadingProgress.value.progress = 30;

        try {
          const datData = await parseDatFile(
            files.dat,
            detectedProtocol || undefined
          );
          projectState.datFile = datData;
          projectState.loadedFiles.dat = true;
          loadingProgress.value.datProgress = 100;

          console.log(
            `Loaded DAT file: ${datData.items.length} items, ${datData.outfits.length} outfits, ${datData.effects.length} effects, ${datData.missiles.length} missiles`
          );
        } catch (error) {
          console.error("Error loading DAT file:", error);
          throw error;
        }
      }

      // Load SPR file
      if (files.spr) {
        loadingProgress.value.stage = "Parsing SPR file...";
        loadingProgress.value.currentFile = files.spr.name;
        loadingProgress.value.progress = 70;

        try {
          const sprData = await parseSprFile(files.spr);
          projectState.sprFile = sprData;
          projectState.loadedFiles.spr = true;
          loadingProgress.value.sprProgress = 100;

          console.log(`Loaded SPR file: ${sprData.sprites.length} sprites`);
        } catch (error) {
          console.error("Error loading SPR file:", error);
          throw error;
        }
      }

      loadingProgress.value.stage = "Finalizing...";
      loadingProgress.value.progress = 100;

      projectState.isLoaded =
        projectState.loadedFiles.dat || projectState.loadedFiles.spr;

      console.log("Project loaded successfully:", {
        protocol: projectState.protocol,
        clientVersion: projectState.clientVersion,
        loadedFiles: projectState.loadedFiles,
      });

      // Hide loading after a short delay
      setTimeout(() => {
        loadingProgress.value.isLoading = false;
      }, 500);
    } catch (error) {
      console.error("Error loading project:", error);
      loadingProgress.value.isLoading = false;
      throw error;
    }
  };

  /**
   * Get all items from the loaded DAT file
   */
  const getItems = computed(() => {
    return projectState.datFile?.items || [];
  });

  /**
   * Get all outfits from the loaded DAT file
   */
  const getOutfits = computed(() => {
    return projectState.datFile?.outfits || [];
  });

  /**
   * Get all effects from the loaded DAT file
   */
  const getEffects = computed(() => {
    return projectState.datFile?.effects || [];
  });

  /**
   * Get all missiles from the loaded DAT file
   */
  const getMissiles = computed(() => {
    return projectState.datFile?.missiles || [];
  });

  /**
   * Get all sprites from the loaded SPR file
   */
  const getSprites = computed(() => {
    return projectState.sprFile?.sprites || [];
  });

  /**
   * Get thing by category and ID
   */
  const getThing = (category: ThingCategory, id: number): ThingType | null => {
    switch (category) {
      case ThingCategory.ITEM:
        return (
          projectState.datFile?.items.find((item) => item.id === id) || null
        );
      case ThingCategory.OUTFIT:
        return (
          projectState.datFile?.outfits.find((outfit) => outfit.id === id) ||
          null
        );
      case ThingCategory.EFFECT:
        return (
          projectState.datFile?.effects.find((effect) => effect.id === id) ||
          null
        );
      case ThingCategory.MISSILE:
        return (
          projectState.datFile?.missiles.find((missile) => missile.id === id) ||
          null
        );
      default:
        return null;
    }
  };

  /**
   * Get sprite by ID
   */
  const getSprite = (id: number): TibiaSprite | null => {
    return (
      projectState.sprFile?.sprites.find((sprite) => sprite.id === id) || null
    );
  };

  /**
   * Check if running in Electron
   */
  const isElectron = () => {
    return (
      typeof window !== "undefined" &&
      (window.process?.type === "renderer" ||
        (window as any).electronAPI?.isElectron)
    );
  };

  /**
   * Open file dialog (Electron-aware)
   */
  const openFileDialog = async () => {
    console.log("Opening file dialog...");

    if (isElectron()) {
      console.log("Running in Electron, using native dialog");
      try {
        // Use the exposed electronAPI
        const electronAPI = (window as any).electronAPI;
        if (electronAPI?.showOpenDialog) {
          const result = await electronAPI.showOpenDialog({
            properties: ["openFile", "multiSelections"],
            filters: [
              { name: "Tibia Files", extensions: ["dat", "spr", "otfi"] },
              { name: "DAT Files", extensions: ["dat"] },
              { name: "SPR Files", extensions: ["spr"] },
              { name: "OTFI Files", extensions: ["otfi"] },
              { name: "All Files", extensions: ["*"] },
            ],
          });

          if (result.canceled || !result.filePaths.length) {
            console.log("File dialog cancelled");
            return null;
          }

          console.log("Selected file paths:", result.filePaths);

          // Convert file paths to File objects using electronAPI
          const files = await Promise.all(
            result.filePaths.map(async (filePath: string) => {
              const fileBuffer = await electronAPI.readFile(filePath);
              const fileName = filePath.split(/[/\\]/).pop() || "unknown";
              return new File([fileBuffer], fileName);
            })
          );

          console.log(
            "Converted to File objects:",
            files.map((f) => f.name)
          );

          // Create a FileList-like object
          const fileList = {
            length: files.length,
            item: (index: number) => files[index] || null,
            [Symbol.iterator]: function* () {
              for (let i = 0; i < files.length; i++) {
                yield files[i];
              }
            },
          };

          // Add array-like access
          files.forEach((file, index) => {
            (fileList as any)[index] = file;
          });

          return fileList as FileList;
        } else {
          // Fallback to old method
          const { ipcRenderer } = window.require("electron");
          const result = await ipcRenderer.invoke("show-open-dialog", {
            properties: ["openFile", "multiSelections"],
            filters: [
              { name: "Tibia Files", extensions: ["dat", "spr", "otfi"] },
              { name: "DAT Files", extensions: ["dat"] },
              { name: "SPR Files", extensions: ["spr"] },
              { name: "OTFI Files", extensions: ["otfi"] },
              { name: "All Files", extensions: ["*"] },
            ],
          });

          if (result.canceled || !result.filePaths.length) {
            console.log("File dialog cancelled");
            return null;
          }

          console.log("Selected file paths:", result.filePaths);

          // Convert file paths to File objects
          const files = await Promise.all(
            result.filePaths.map(async (filePath: string) => {
              const fileBuffer = await ipcRenderer.invoke(
                "read-file",
                filePath
              );
              const fileName = filePath.split(/[/\\]/).pop() || "unknown";
              return new File([fileBuffer], fileName);
            })
          );

          console.log(
            "Converted to File objects:",
            files.map((f) => f.name)
          );

          // Create a FileList-like object
          const fileList = {
            length: files.length,
            item: (index: number) => files[index] || null,
            [Symbol.iterator]: function* () {
              for (let i = 0; i < files.length; i++) {
                yield files[i];
              }
            },
          };

          // Add array-like access
          files.forEach((file, index) => {
            (fileList as any)[index] = file;
          });

          return fileList as FileList;
        }
      } catch (error) {
        console.error("Error using Electron file dialog:", error);
        // Fallback to web version
        return await openWebFileDialog();
      }
    } else {
      console.log("Running in browser, using web dialog");
      return await openWebFileDialog();
    }
  };

  /**
   * Web-based file dialog
   */
  const openWebFileDialog = async () => {
    return new Promise<FileList | null>((resolve) => {
      try {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ".dat,.spr,.otfi";

        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          console.log("Files selected:", target.files);
          resolve(target.files);
        };

        input.oncancel = () => {
          console.log("File dialog cancelled");
          resolve(null);
        };

        // Make sure the input is in the DOM temporarily
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      } catch (error) {
        console.error("Error opening web file dialog:", error);
        resolve(null);
      }
    });
  };

  /**
   * Load project from file dialog
   */
  const loadFromFileDialog = async (): Promise<void> => {
    try {
      let folderHandle: any = null;

      if (
        process.client &&
        "showDirectoryPicker" in window &&
        window.showDirectoryPicker
      ) {
        // Use native folder picker on web
        try {
          folderHandle = await window.showDirectoryPicker();
        } catch (error) {
          console.log("🚫 User cancelled folder selection");
          return;
        }
      } else if (process.client && window.electronAPI) {
        // Use Electron folder dialog
        try {
          const result = await window.electronAPI.selectFolder();
          if (result.cancelled || !result.folderPath) {
            console.log("🚫 User cancelled folder selection");
            return;
          }

          console.log("📁 Selected folder:", result.folderPath);

          // Find and load files from the selected folder
          const files = await window.electronAPI.readFolder(result.folderPath);
          await loadFromFileList(files);
          return;
        } catch (error) {
          console.error("❌ Error selecting folder:", error);
          throw error;
        }
      }

      // Web File System Access API path
      if (folderHandle) {
        const files: { [key: string]: File } = {};

        // Look for .dat, .spr, and .otfi files in the folder
        try {
          for await (const [name, handle] of folderHandle.entries()) {
            if (handle.kind === "file") {
              const extension = name.toLowerCase().split(".").pop();
              if (["dat", "spr", "otfi"].includes(extension || "")) {
                const file = await (handle as any).getFile();
                files[extension as string] = file;
              }
            }
          }
          await loadFromFileDict(files);
        } catch (error) {
          console.error("❌ Error reading folder:", error);
          throw error;
        }
      } else {
        // Fallback to individual file selection if folder picker not available
        console.log(
          "📂 Folder picker not available, falling back to file selection"
        );

        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ".dat,.spr,.otfi";

        return new Promise((resolve, reject) => {
          input.onchange = async (event) => {
            try {
              const files = (event.target as HTMLInputElement).files;
              if (!files || files.length === 0) {
                resolve();
                return;
              }

              console.log("📁 Files selected:", files);
              await loadFromFileList(Array.from(files));
              resolve();
            } catch (error) {
              reject(error);
            }
          };

          input.oncancel = () => resolve();
          input.click();
        });
      }
    } catch (error) {
      console.error("❌ Error in loadFromFileDialog:", error);
      throw error;
    }
  };

  /**
   * Load from a list of files (either File objects or file paths)
   */
  const loadFromFileList = async (files: (File | string)[]): Promise<void> => {
    const fileDict: { [key: string]: File | string } = {};

    console.log(
      "✅ Selected files:",
      files.map((f) =>
        typeof f === "string" ? f.split(/[/\\]/).pop() : f.name
      )
    );

    // Group files by extension
    for (const file of files) {
      const fileName =
        typeof file === "string" ? file.split(/[/\\]/).pop() || "" : file.name;
      const extension = fileName.toLowerCase().split(".").pop();

      console.log("📁 Processing file:", fileName, "extension:", extension);

      if (extension && ["dat", "spr", "otfi"].includes(extension)) {
        fileDict[extension] = file;
      }
    }

    await loadFromFileDict(fileDict);
  };

  /**
   * Load from a dictionary of files by extension
   */
  const loadFromFileDict = async (files: {
    [key: string]: File | string;
  }): Promise<void> => {
    console.log("📂 Files to load:", files);

    // Check if we have at least DAT and SPR files
    if (!files.dat || !files.spr) {
      const missing = [];
      if (!files.dat) missing.push("DAT");
      if (!files.spr) missing.push("SPR");
      throw new Error(`Missing required files: ${missing.join(", ")}`);
    }

    // Load files
    const filesToLoad: LoadFileOptions = {};

    if (files.dat) {
      filesToLoad.dat =
        typeof files.dat === "string" && window.electronAPI
          ? await window.electronAPI.readFile(files.dat)
          : (files.dat as File);
    }

    if (files.spr) {
      filesToLoad.spr =
        typeof files.spr === "string" && window.electronAPI
          ? await window.electronAPI.readFile(files.spr)
          : (files.spr as File);
    }

    if (files.otfi) {
      filesToLoad.otfi =
        typeof files.otfi === "string" && window.electronAPI
          ? await window.electronAPI.readFile(files.otfi)
          : (files.otfi as File);
    }

    await loadProject(filesToLoad);
    console.log("🎉 Project loaded successfully!");
  };

  /**
   * Export project files
   */
  const exportProject = async (options: ExportOptions) => {
    // TODO: Implement export functionality
    console.log(`Exporting project as ${options.format}`);
  };

  /**
   * Generate sprite sheet from sprites
   */
  const generateSpriteSheet = (
    sprites: TibiaSprite[],
    options: SpriteSheetOptions
  ) => {
    const { columns, spriteSize, padding } = options;
    const rows = Math.ceil(sprites.length / columns);

    const canvas = document.createElement("canvas");
    canvas.width = columns * (spriteSize + padding) - padding;
    canvas.height = rows * (spriteSize + padding) - padding;

    const ctx = canvas.getContext("2d")!;

    sprites.forEach((sprite, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = col * (spriteSize + padding);
      const y = row * (spriteSize + padding);

      // Draw sprite at position (this would use actual sprite data)
      ctx.fillStyle = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      ctx.fillRect(x, y, spriteSize, spriteSize);
    });

    return canvas;
  };

  /**
   * Import sprite sheet and split into individual sprites
   */
  const importSpriteSheet = async (
    file: File,
    options: ImportSpriteSheetOptions
  ) => {
    return new Promise<TibiaSprite[]>((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const sprites: TibiaSprite[] = [];
          const { spriteWidth, spriteHeight, columns, rows } = options;

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              const canvas = document.createElement("canvas");
              canvas.width = spriteWidth;
              canvas.height = spriteHeight;

              const ctx = canvas.getContext("2d")!;
              ctx.drawImage(
                img,
                col * spriteWidth,
                row * spriteHeight,
                spriteWidth,
                spriteHeight,
                0,
                0,
                spriteWidth,
                spriteHeight
              );

              const imageData = ctx.getImageData(
                0,
                0,
                spriteWidth,
                spriteHeight
              );

              sprites.push({
                id: getSprites.value.length + sprites.length + 1,
                width: spriteWidth,
                height: spriteHeight,
                transparent: true,
                compressedPixels: new Uint8Array(0),
                pixelData: new Uint8Array(imageData.data),
                bitmapData: imageData,
                isEmpty: false,
              });
            }
          }

          resolve(sprites);
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  // Helper functions for progress tracking
  const parseDatFileWithProgress = async (
    file: File,
    protocol: ProtocolVersion
  ) => {
    // This would be the same as parseDatFile but with progress callbacks
    // For now, just call the original function
    return await parseDatFile(file, protocol);
  };

  const parseSprFileWithProgress = async (file: File) => {
    // This would be the same as parseSprFile but with progress callbacks
    // For now, just call the original function
    return await parseSprFile(file);
  };

  /**
   * Get current protocol information
   */
  const protocolInfo = computed(() => {
    return PROTOCOL_VERSIONS[projectState.protocol] || null;
  });

  return {
    // Protocol and version info
    protocols: PROTOCOL_VERSIONS,
    projectState: readonly(projectState),
    loadingProgress: readonly(loadingProgress),
    protocolInfo,

    // File operations
    loadProject,
    loadFromFileDialog,
    openFileDialog,
    exportProject,

    // Data getters
    getItems,
    getOutfits,
    getEffects,
    getMissiles,
    getSprites,
    getThing,
    getSprite,

    // Utility operations
    generateSpriteSheet,
    importSpriteSheet,
  };
};
