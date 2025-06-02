export interface TibiaSprite {
  id: number;
  width: number;
  height: number;
  xOffset?: number;
  yOffset?: number;
  hasTransparency?: boolean;
  isCompressed?: boolean;
  data?: string | null;
  canvas?: HTMLCanvasElement;
}

export interface TibiaObject {
  id: number;
  name?: string;
  width: number;
  height: number;
  layers: number;
  patternX: number;
  patternY: number;
  patternZ: number;
  frames: number;
  spriteIds: number[];
  properties: Record<string, any>;
}

export interface DatFileData {
  signature: number;
  itemCount: number;
  outfitCount: number;
  effectCount: number;
  missileCount: number;
  items: TibiaObject[];
  outfits: TibiaObject[];
  effects: TibiaObject[];
  missiles: TibiaObject[];
}

export interface SprFileData {
  signature: number;
  spriteCount: number;
  sprites: TibiaSprite[];
  spriteOffsets: number[];
}

export const useTibiaFiles = () => {
  // Protocol versions and their characteristics
  const protocols = {
    "7.10": {
      datSignature: 0x00000000,
      sprSignature: 0x00000000,
      hasExtended: false,
      hasFrameGroups: false,
    },
    "7.60": {
      datSignature: 0x00000000,
      sprSignature: 0x00000000,
      hasExtended: false,
      hasFrameGroups: false,
    },
    "8.60": {
      datSignature: 0x00000000,
      sprSignature: 0x00000000,
      hasExtended: true,
      hasFrameGroups: false,
    },
    "9.86": {
      datSignature: 0x00000000,
      sprSignature: 0x00000000,
      hasExtended: true,
      hasFrameGroups: false,
    },
    "10.98": {
      datSignature: 0x00000000,
      sprSignature: 0x00000000,
      hasExtended: true,
      hasFrameGroups: true,
    },
    "12.86": {
      datSignature: 0x00000000,
      sprSignature: 0x00000000,
      hasExtended: true,
      hasFrameGroups: true,
    },
  };

  // Current project state
  const projectState = reactive({
    protocol: "12.86",
    datFile: null as DatFileData | null,
    sprFile: null as SprFileData | null,
    items: [] as TibiaObject[],
    outfits: [] as TibiaObject[],
    effects: [] as TibiaObject[],
    missiles: [] as TibiaObject[],
    sprites: [] as TibiaSprite[],
    isLoaded: false,
    loadedFiles: {
      dat: false,
      spr: false,
      otfi: false,
    },
  });

  /**
   * Parse .DAT file
   */
  const parseDatFile = async (file: File): Promise<DatFileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const dataView = new DataView(buffer);

          // Read DAT header
          const signature = dataView.getUint32(0, true);
          const itemCount = dataView.getUint16(4, true);
          const outfitCount = dataView.getUint16(6, true);
          const effectCount = dataView.getUint16(8, true);
          const missileCount = dataView.getUint16(10, true);

          console.log("DAT File Info:", {
            signature: signature.toString(16),
            itemCount,
            outfitCount,
            effectCount,
            missileCount,
          });

          // Create placeholder objects (in real implementation, this would parse the actual data)
          const items: TibiaObject[] = Array.from(
            { length: itemCount },
            (_, i) => ({
              id: i + 100,
              name: `Item ${i + 100}`,
              width: 1,
              height: 1,
              layers: 1,
              patternX: 1,
              patternY: 1,
              patternZ: 1,
              frames: 1,
              spriteIds: [],
              properties: {},
            })
          );

          const outfits: TibiaObject[] = Array.from(
            { length: outfitCount },
            (_, i) => ({
              id: i + 1068,
              name: i % 5 === 0 ? `Object ${i + 1068}` : undefined,
              width: 1,
              height: 1,
              layers: 1,
              patternX: 1,
              patternY: 1,
              patternZ: 1,
              frames: 6,
              spriteIds: [],
              properties: {},
            })
          );

          const effects: TibiaObject[] = Array.from(
            { length: effectCount },
            (_, i) => ({
              id: i + 1,
              name: `Effect ${i + 1}`,
              width: 1,
              height: 1,
              layers: 1,
              patternX: 1,
              patternY: 1,
              patternZ: 1,
              frames: 1,
              spriteIds: [],
              properties: {},
            })
          );

          const missiles: TibiaObject[] = Array.from(
            { length: missileCount },
            (_, i) => ({
              id: i + 1,
              name: `Missile ${i + 1}`,
              width: 1,
              height: 1,
              layers: 1,
              patternX: 1,
              patternY: 1,
              patternZ: 1,
              frames: 1,
              spriteIds: [],
              properties: {},
            })
          );

          const result: DatFileData = {
            signature,
            itemCount,
            outfitCount,
            effectCount,
            missileCount,
            items,
            outfits,
            effects,
            missiles,
          };

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read DAT file"));
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Parse .SPR file
   */
  const parseSprFile = async (file: File): Promise<SprFileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const dataView = new DataView(buffer);

          // Read SPR header
          const signature = dataView.getUint32(0, true);
          const spriteCount = dataView.getUint32(4, true);

          console.log("SPR File Info:", {
            signature: signature.toString(16),
            spriteCount,
          });

          const sprites: TibiaSprite[] = [];
          let offset = 8;

          // Read sprite offsets
          const spriteOffsets: number[] = [];
          for (let i = 0; i < spriteCount; i++) {
            spriteOffsets.push(dataView.getUint32(offset, true));
            offset += 4;
          }

          // Create placeholder sprites (in real implementation, this would parse actual sprite data)
          for (let i = 0; i < Math.min(spriteCount, 50); i++) {
            sprites.push({
              id: 201529 + i,
              width: 32,
              height: 32,
              xOffset: 0,
              yOffset: 0,
              hasTransparency: true,
              isCompressed: false,
              data: null,
            });
          }

          console.log(`Loaded ${spriteOffsets.length} sprite offsets`);

          const result: SprFileData = {
            signature,
            spriteCount,
            sprites,
            spriteOffsets,
          };

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read SPR file"));
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Parse .OTFI file
   */
  const parseOtfiFile = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;

          // OTFI is typically a JSON-based format
          const text = new TextDecoder().decode(buffer);
          const otfiData = JSON.parse(text);

          console.log("OTFI File loaded:", otfiData);

          resolve(otfiData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read OTFI file"));
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Load project files
   */
  const loadProject = async (files: {
    dat?: File;
    spr?: File;
    otfi?: File;
  }) => {
    try {
      projectState.isLoaded = false;
      projectState.loadedFiles = { dat: false, spr: false, otfi: false };

      if (files.dat) {
        const datData = await parseDatFile(files.dat);
        projectState.datFile = datData;
        projectState.items = datData.items;
        projectState.outfits = datData.outfits;
        projectState.effects = datData.effects;
        projectState.missiles = datData.missiles;
        projectState.loadedFiles.dat = true;
      }

      if (files.spr) {
        const sprData = await parseSprFile(files.spr);
        projectState.sprFile = sprData;
        projectState.sprites = sprData.sprites;
        projectState.loadedFiles.spr = true;
      }

      if (files.otfi) {
        const otfiData = await parseOtfiFile(files.otfi);
        // Merge OTFI data with existing project
        console.log("OTFI data loaded:", otfiData);
        projectState.loadedFiles.otfi = true;
      }

      projectState.isLoaded =
        projectState.loadedFiles.dat || projectState.loadedFiles.spr;
      console.log("Project loaded successfully");
    } catch (error) {
      console.error("Error loading project:", error);
      throw error;
    }
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
   * Load files from file dialog
   */
  const loadFromFileDialog = async () => {
    console.log("🚀 loadFromFileDialog called!");
    console.log("🔍 Environment check:", {
      isClient: process.client,
      hasWindow: typeof window !== "undefined",
      hasProcess: typeof window !== "undefined" && !!window.process,
      processType: typeof window !== "undefined" && window.process?.type,
      hasElectronAPI:
        typeof window !== "undefined" && !!(window as any).electronAPI,
    });

    try {
      const files = await openFileDialog();
      if (!files || files.length === 0) {
        console.log("❌ No files selected");
        return;
      }

      console.log(
        "✅ Selected files:",
        Array.from(files).map((f) => f.name)
      );

      const filesToLoad: { dat?: File; spr?: File; otfi?: File } = {};

      Array.from(files).forEach((file) => {
        const extension = file.name.toLowerCase().split(".").pop();
        console.log(
          `📁 Processing file: ${file.name}, extension: ${extension}`
        );

        if (extension === "dat") filesToLoad.dat = file;
        if (extension === "spr") filesToLoad.spr = file;
        if (extension === "otfi") filesToLoad.otfi = file;
      });

      console.log("📂 Files to load:", filesToLoad);

      if (Object.keys(filesToLoad).length === 0) {
        throw new Error("No valid .dat, .spr, or .otfi files selected");
      }

      await loadProject(filesToLoad);
      console.log("🎉 Project loaded successfully!");
    } catch (error) {
      console.error("💥 Error in loadFromFileDialog:", error);
      throw error;
    }
  };

  /**
   * Export project files
   */
  const exportProject = async (format: "dat" | "spr" | "otfi" | "all") => {
    // TODO: Implement export functionality
    console.log(`Exporting project as ${format}`);
  };

  /**
   * Generate sprite sheet from sprites
   */
  const generateSpriteSheet = (
    sprites: TibiaSprite[],
    options: {
      columns: number;
      spriteSize: number;
      padding: number;
    }
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
    options: {
      spriteWidth: number;
      spriteHeight: number;
      columns: number;
      rows: number;
    }
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

              sprites.push({
                id: projectState.sprites.length + sprites.length + 1,
                width: spriteWidth,
                height: spriteHeight,
                data: canvas.toDataURL(),
                canvas,
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

  return {
    protocols,
    projectState: readonly(projectState),
    parseDatFile,
    parseSprFile,
    parseOtfiFile,
    loadProject,
    loadFromFileDialog,
    openFileDialog,
    exportProject,
    generateSpriteSheet,
    importSpriteSheet,
  };
};
