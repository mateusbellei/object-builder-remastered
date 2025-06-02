/**
 * Tibia File Parser
 * Real implementation based on Object Builder source code
 */

import type {
  DatFileData,
  SprFileData,
  OtfiMetadata,
  ThingType,
  TibiaSprite,
  FrameGroup,
  ProtocolVersion,
  ParseError,
} from "~/types/tibia";

import {
  ThingCategory,
  MetadataFlags,
  ClothSlot,
  MarketCategory,
  TibiaFileError,
  FrameGroupType,
  PROTOCOL_VERSIONS,
} from "~/types/tibia";

// Constants
const SPRITE_SIZE = 32;
const SPRITE_DATA_SIZE = SPRITE_SIZE * SPRITE_SIZE * 4; // RGBA

/**
 * Binary data reader utility
 */
class BinaryReader {
  private view: DataView;
  private position: number = 0;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  readUint8(): number {
    const value = this.view.getUint8(this.position);
    this.position += 1;
    return value;
  }

  readUint16(): number {
    const value = this.view.getUint16(this.position, true); // little endian
    this.position += 2;
    return value;
  }

  readInt16(): number {
    const value = this.view.getInt16(this.position, true); // little endian
    this.position += 2;
    return value;
  }

  readUint32(): number {
    const value = this.view.getUint32(this.position, true); // little endian
    this.position += 4;
    return value;
  }

  readString(length: number, encoding?: string): string {
    const bytes = new Uint8Array(this.view.buffer, this.position, length);
    this.position += length;

    // Simple UTF-8 decoding for now
    return new TextDecoder(encoding || "utf-8").decode(bytes);
  }

  readBytes(count: number): Uint8Array {
    const bytes = new Uint8Array(this.view.buffer, this.position, count);
    this.position += count;
    return bytes;
  }

  get bytesAvailable(): number {
    return this.view.byteLength - this.position;
  }

  get currentPosition(): number {
    return this.position;
  }

  set currentPosition(pos: number) {
    this.position = pos;
  }

  get length(): number {
    return this.view.byteLength;
  }

  get isEOF(): boolean {
    return this.position >= this.view.byteLength;
  }
}

/**
 * Parse DAT file based on protocol version
 */
export async function parseDatFile(
  file: File,
  protocol: ProtocolVersion
): Promise<DatFileData> {
  try {
    const buffer = await file.arrayBuffer();
    const reader = new BinaryReader(buffer);

    // Read header
    const signature = reader.readUint32();
    const itemCount = reader.readUint16();
    const outfitCount = reader.readUint16();
    const effectCount = reader.readUint16();
    const missileCount = reader.readUint16();

    console.log("DAT Header:", {
      signature: signature.toString(16),
      itemCount,
      outfitCount,
      effectCount,
      missileCount,
    });

    // Parse items
    const items: ThingType[] = [];
    let successfulItems = 0;
    let failedItems = 0;

    for (let i = 100; i < 100 + itemCount; i++) {
      try {
        const thing = parseThingType(reader, i, ThingCategory.ITEM, protocol);
        if (thing) {
          items.push(thing);
          successfulItems++;
        } else {
          failedItems++;
        }
      } catch (error) {
        console.warn(`Failed to parse item ${i}:`, error);
        failedItems++;
        // Continue with next item
      }
    }

    // Parse outfits
    const outfits: ThingType[] = [];
    let successfulOutfits = 0;
    let failedOutfits = 0;

    for (let i = 1; i <= outfitCount; i++) {
      try {
        const thing = parseThingType(reader, i, ThingCategory.OUTFIT, protocol);
        if (thing) {
          outfits.push(thing);
          successfulOutfits++;
        } else {
          failedOutfits++;
        }
      } catch (error) {
        console.warn(`Failed to parse outfit ${i}:`, error);
        failedOutfits++;
        // Continue with next outfit
      }
    }

    // Parse effects
    const effects: ThingType[] = [];
    let successfulEffects = 0;
    let failedEffects = 0;

    for (let i = 1; i <= effectCount; i++) {
      try {
        const thing = parseThingType(reader, i, ThingCategory.EFFECT, protocol);
        if (thing) {
          effects.push(thing);
          successfulEffects++;
        } else {
          failedEffects++;
        }
      } catch (error) {
        console.warn(`Failed to parse effect ${i}:`, error);
        failedEffects++;
        // Continue with next effect
      }
    }

    // Parse missiles
    const missiles: ThingType[] = [];
    let successfulMissiles = 0;
    let failedMissiles = 0;

    for (let i = 1; i <= missileCount; i++) {
      try {
        const thing = parseThingType(
          reader,
          i,
          ThingCategory.MISSILE,
          protocol
        );
        if (thing) {
          missiles.push(thing);
          successfulMissiles++;
        } else {
          failedMissiles++;
        }
      } catch (error) {
        console.warn(`Failed to parse missile ${i}:`, error);
        failedMissiles++;
        // Continue with next missile
      }
    }

    console.log("DAT Parsing Summary:", {
      items: `${successfulItems}/${itemCount} (${failedItems} failed)`,
      outfits: `${successfulOutfits}/${outfitCount} (${failedOutfits} failed)`,
      effects: `${successfulEffects}/${effectCount} (${failedEffects} failed)`,
      missiles: `${successfulMissiles}/${missileCount} (${failedMissiles} failed)`,
    });

    return {
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
  } catch (error) {
    throw new TibiaFileError(
      `Failed to parse DAT file: ${
        error instanceof Error ? error.message : error
      }`,
      "dat"
    );
  }
}

/**
 * Parse individual thing type
 */
function parseThingType(
  reader: BinaryReader,
  id: number,
  category: ThingCategory,
  protocol: ProtocolVersion
): ThingType | null {
  try {
    const thing: ThingType = {
      id,
      category,
      // Basic properties
      width: 1,
      height: 1,
      layers: 1,
      patternX: 1,
      patternY: 1,
      patternZ: 1,
      frames: 1,
      // Flags - all default to false/0
      isGround: false,
      groundSpeed: 0,
      isGroundBorder: false,
      isOnBottom: false,
      isOnTop: false,
      isContainer: false,
      stackable: false,
      forceUse: false,
      multiUse: false,
      writable: false,
      writableOnce: false,
      maxTextLength: 0,
      isFluidContainer: false,
      isFluid: false,
      isUnpassable: false,
      isUnmoveable: false,
      blockMissile: false,
      blockPathfind: false,
      noMoveAnimation: false,
      pickupable: false,
      hangable: false,
      isVertical: false,
      isHorizontal: false,
      rotatable: false,
      hasLight: false,
      lightLevel: 0,
      lightColor: 0,
      dontHide: false,
      isTranslucent: false,
      hasOffset: false,
      offsetX: 0,
      offsetY: 0,
      hasElevation: false,
      elevation: 0,
      isLyingObject: false,
      animateAlways: false,
      miniMap: false,
      miniMapColor: 0,
      isLensHelp: false,
      lensHelp: 0,
      isFullGround: false,
      ignoreLook: false,
      cloth: false,
      clothSlot: ClothSlot.LEGS as number,
      isMarketItem: false,
      marketName: "",
      marketCategory: MarketCategory.OTHERS as number,
      marketTradeAs: 0,
      marketShowAs: 0,
      marketRestrictProfession: 0,
      marketRestrictLevel: 0,
      hasDefaultAction: false,
      defaultAction: 0,
      wrappable: false,
      unwrappable: false,
      topEffect: false,
      usable: false,
      // Frame groups - initialize with proper type
      frameGroups: {} as Record<FrameGroupType, FrameGroup>,
      spriteIds: [],
    };

    // Check if we have enough bytes to read
    if (reader.bytesAvailable < 1) {
      console.warn(`Not enough bytes to read thing ${id}, skipping`);
      return null;
    }

    // Read properties flags until LAST_FLAG
    let flag = 0;
    let flagCount = 0;
    const maxFlags = 100; // Safety limit

    while (flag !== MetadataFlags.LAST_FLAG && flagCount < maxFlags) {
      if (reader.bytesAvailable < 1) {
        console.warn(
          `Unexpected end of file while reading flags for thing ${id}`
        );
        break;
      }

      const previousFlag = flag;
      flag = reader.readUint8();
      flagCount++;

      if (flag === MetadataFlags.LAST_FLAG) {
        break;
      }

      try {
        switch (flag) {
          case MetadataFlags.GROUND:
            thing.isGround = true;
            thing.groundSpeed = reader.readUint16();
            break;

          case MetadataFlags.GROUND_BORDER:
            thing.isGroundBorder = true;
            break;

          case MetadataFlags.ON_BOTTOM:
            thing.isOnBottom = true;
            break;

          case MetadataFlags.ON_TOP:
            thing.isOnTop = true;
            break;

          case MetadataFlags.CONTAINER:
            thing.isContainer = true;
            break;

          case MetadataFlags.STACKABLE:
            thing.stackable = true;
            break;

          case MetadataFlags.FORCE_USE:
            thing.forceUse = true;
            break;

          case MetadataFlags.MULTI_USE:
            thing.multiUse = true;
            break;

          case MetadataFlags.WRITABLE:
            thing.writable = true;
            thing.maxTextLength = reader.readUint16();
            break;

          case MetadataFlags.WRITABLE_ONCE:
            thing.writableOnce = true;
            thing.maxTextLength = reader.readUint16();
            break;

          case MetadataFlags.FLUID_CONTAINER:
            thing.isFluidContainer = true;
            break;

          case MetadataFlags.FLUID:
            thing.isFluid = true;
            break;

          case MetadataFlags.UNPASSABLE:
            thing.isUnpassable = true;
            break;

          case MetadataFlags.UNMOVEABLE:
            thing.isUnmoveable = true;
            break;

          case MetadataFlags.BLOCK_MISSILE:
            thing.blockMissile = true;
            break;

          case MetadataFlags.BLOCK_PATHFIND:
            thing.blockPathfind = true;
            break;

          case MetadataFlags.NO_MOVE_ANIMATION:
            thing.noMoveAnimation = true;
            break;

          case MetadataFlags.PICKUPABLE:
            thing.pickupable = true;
            break;

          case MetadataFlags.HANGABLE:
            thing.hangable = true;
            break;

          case MetadataFlags.VERTICAL:
            thing.isVertical = true;
            break;

          case MetadataFlags.HORIZONTAL:
            thing.isHorizontal = true;
            break;

          case MetadataFlags.ROTATABLE:
            thing.rotatable = true;
            break;

          case MetadataFlags.HAS_LIGHT:
            thing.hasLight = true;
            thing.lightLevel = reader.readUint16();
            thing.lightColor = reader.readUint16();
            break;

          case MetadataFlags.DONT_HIDE:
            thing.dontHide = true;
            break;

          case MetadataFlags.TRANSLUCENT:
            thing.isTranslucent = true;
            break;

          case MetadataFlags.HAS_OFFSET:
            thing.hasOffset = true;
            thing.offsetX = reader.readInt16();
            thing.offsetY = reader.readInt16();
            break;

          case MetadataFlags.HAS_ELEVATION:
            thing.hasElevation = true;
            thing.elevation = reader.readUint16();
            break;

          case MetadataFlags.LYING_OBJECT:
            thing.isLyingObject = true;
            break;

          case MetadataFlags.ANIMATE_ALWAYS:
            thing.animateAlways = true;
            break;

          case MetadataFlags.MINI_MAP:
            thing.miniMap = true;
            thing.miniMapColor = reader.readUint16();
            break;

          case MetadataFlags.LENS_HELP:
            thing.isLensHelp = true;
            thing.lensHelp = reader.readUint16();
            break;

          case MetadataFlags.FULL_GROUND:
            thing.isFullGround = true;
            break;

          case MetadataFlags.IGNORE_LOOK:
            thing.ignoreLook = true;
            break;

          case MetadataFlags.CLOTH:
            thing.cloth = true;
            thing.clothSlot = reader.readUint16();
            break;

          case MetadataFlags.MARKET_ITEM:
            thing.isMarketItem = true;
            thing.marketCategory = reader.readUint16();
            thing.marketTradeAs = reader.readUint16();
            thing.marketShowAs = reader.readUint16();

            const nameLength = reader.readUint16();

            // Add validation for name length
            if (nameLength > 255 || nameLength < 0) {
              console.warn(
                `Invalid market name length ${nameLength} for thing ${id}, skipping name`
              );
              thing.marketName = "";
              // Skip the invalid data - try to continue parsing
              if (
                nameLength > 0 &&
                nameLength < 10000 &&
                reader.bytesAvailable >= nameLength
              ) {
                reader.readBytes(nameLength); // Skip the invalid name data
              }
            } else if (reader.bytesAvailable >= nameLength) {
              try {
                thing.marketName = reader.readString(nameLength, "iso-8859-1");
              } catch (error) {
                console.warn(
                  `Error reading market name for thing ${id}:`,
                  error
                );
                thing.marketName = "";
                if (reader.bytesAvailable >= nameLength) {
                  reader.readBytes(nameLength); // Skip the problematic data
                }
              }
            } else {
              console.warn(
                `Not enough bytes to read market name for thing ${id}`
              );
              thing.marketName = "";
            }

            thing.marketRestrictProfession = reader.readUint16();
            thing.marketRestrictLevel = reader.readUint16();
            break;

          case MetadataFlags.DEFAULT_ACTION:
            thing.hasDefaultAction = true;
            thing.defaultAction = reader.readUint16();
            break;

          case MetadataFlags.WRAPPABLE:
            thing.wrappable = true;
            break;

          case MetadataFlags.UNWRAPPABLE:
            thing.unwrappable = true;
            break;

          case MetadataFlags.TOP_EFFECT:
            thing.topEffect = true;
            break;

          case MetadataFlags.USABLE:
            thing.usable = true;
            break;

          default:
            console.warn(
              `Unknown flag 0x${flag.toString(
                16
              )} (previous: 0x${previousFlag.toString(
                16
              )}) for ${category} ${id} at position ${reader.currentPosition}`
            );
            // Don't throw error, just skip unknown flags
            break;
        }
      } catch (flagError) {
        console.error(
          `Error processing flag 0x${flag.toString(16)} for thing ${id}:`,
          flagError
        );
        // Try to continue parsing by breaking out of flag loop
        break;
      }
    }

    if (flagCount >= maxFlags) {
      console.warn(
        `Maximum flag count reached for thing ${id}, stopping flag parsing`
      );
    }

    // Now read texture patterns (frame groups)
    try {
      parseTexturePatterns(reader, thing);
    } catch (textureError) {
      console.warn(
        `Error parsing texture patterns for thing ${id}:`,
        textureError
      );
      // Set minimal frame group as fallback
      thing.frameGroups[FrameGroupType.DEFAULT] = {
        type: FrameGroupType.DEFAULT,
        width: 1,
        height: 1,
        layers: 1,
        patternX: 1,
        patternY: 1,
        patternZ: 1,
        frames: 1,
        spriteIds: [],
      };
    }

    return thing;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error parsing thing ${id}:`, error);
    // Return null instead of throwing to allow parsing to continue
    return null;
  }
}

/**
 * Parse frame group
 */
function parseFrameGroup(reader: BinaryReader): FrameGroup {
  const frameGroup: FrameGroup = {
    type: reader.readUint8(),
    width: reader.readUint8(),
    height: reader.readUint8(),
    exactSize: SPRITE_SIZE,
    layers: reader.readUint8(),
    patternX: reader.readUint8(),
    patternY: reader.readUint8(),
    patternZ: reader.readUint8(),
    frames: reader.readUint8(),
    spriteIndex: [],
    spriteIds: [], // Add the missing property
    isAnimation: false,
    animationMode: 0,
    loopCount: 0,
    startFrame: 0,
    frameDurations: null,
  };

  // Check if it's animated
  if (frameGroup.frames > 1) {
    frameGroup.isAnimation = true;
    frameGroup.animationMode = reader.readUint8();
    frameGroup.loopCount = reader.readUint32();
    frameGroup.startFrame = reader.readUint8();

    // Read frame durations
    frameGroup.frameDurations = [];
    for (let i = 0; i < frameGroup.frames; i++) {
      const min = reader.readUint32();
      const max = reader.readUint32();
      frameGroup.frameDurations.push({ minimum: min, maximum: max });
    }
  }

  // Calculate total sprites and read sprite IDs
  const totalSprites =
    frameGroup.width *
    frameGroup.height *
    frameGroup.layers *
    frameGroup.patternX *
    frameGroup.patternY *
    frameGroup.patternZ *
    frameGroup.frames;

  frameGroup.spriteIndex = [];
  frameGroup.spriteIds = [];
  for (let i = 0; i < totalSprites; i++) {
    const spriteId = reader.readUint32();
    frameGroup.spriteIndex.push(spriteId);
    frameGroup.spriteIds.push(spriteId);
  }

  return frameGroup;
}

/**
 * Parse SPR file
 */
export async function parseSprFile(file: File): Promise<SprFileData> {
  try {
    const buffer = await file.arrayBuffer();
    const reader = new BinaryReader(buffer);

    // Read header
    const signature = reader.readUint32();
    const spriteCount = reader.readUint32();

    console.log("SPR Header:", {
      signature: signature.toString(16),
      spriteCount,
    });

    // Read sprite offsets
    const spriteOffsets: number[] = [];
    for (let i = 0; i < spriteCount; i++) {
      spriteOffsets.push(reader.readUint32());
    }

    // Parse sprites
    const sprites: TibiaSprite[] = [];
    const spritePositions = [];

    for (let i = 1; i <= spriteCount; i++) {
      try {
        const offset = spriteOffsets[i - 1];
        if (offset === 0) {
          // Empty sprite
          sprites.push(createEmptySprite(i));
          continue;
        }

        reader.currentPosition = offset;

        // Read sprite data size
        const red = reader.readUint16();
        const green = reader.readUint16();
        const blue = reader.readUint16();
        const alpha = reader.readUint16();

        const dataSize = red + green + blue + alpha;
        const hasTransparency = alpha > 0;

        spritePositions.push({
          address: offset,
          size: dataSize + 8, // +8 for the RGBA headers
        });

        // Read compressed pixel data
        const compressedPixels = reader.readBytes(dataSize);

        // Decompress sprite data
        const pixelData = decompressSprite(
          compressedPixels,
          hasTransparency,
          red,
          green,
          blue,
          alpha
        );

        sprites.push({
          id: i,
          width: SPRITE_SIZE,
          height: SPRITE_SIZE,
          transparent: hasTransparency,
          compressedPixels,
          pixelData,
          bitmapData: null,
          isEmpty: dataSize === 0,
        });
      } catch (error) {
        console.warn(`Error parsing sprite ${i}:`, error);
        sprites.push(createEmptySprite(i));
      }
    }

    return {
      signature,
      spriteCount,
      sprites,
      spriteOffsets,
      spritePositions,
    };
  } catch (error) {
    throw new TibiaFileError(
      `Failed to parse SPR file: ${
        error instanceof Error ? error.message : error
      }`,
      "spr"
    );
  }
}

/**
 * Create empty sprite
 */
function createEmptySprite(id: number): TibiaSprite {
  return {
    id,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    transparent: true,
    compressedPixels: new Uint8Array(0),
    pixelData: new Uint8Array(SPRITE_DATA_SIZE),
    bitmapData: null,
    isEmpty: true,
  };
}

/**
 * Decompress sprite data (simplified implementation)
 */
function decompressSprite(
  compressedData: Uint8Array,
  hasTransparency: boolean,
  red: number,
  green: number,
  blue: number,
  alpha: number
): Uint8Array {
  const pixelData = new Uint8Array(SPRITE_DATA_SIZE);

  // This is a simplified decompression
  // The actual implementation would need to handle Tibia's specific compression format
  let srcOffset = 0;
  let dstOffset = 0;

  // For now, just copy the data as-is (placeholder)
  const channelSizes = [red, green, blue, alpha];
  let channelOffset = 0;

  for (let channel = 0; channel < (hasTransparency ? 4 : 3); channel++) {
    const channelSize = channelSizes[channel];

    for (let i = 0; i < channelSize && srcOffset < compressedData.length; i++) {
      if (dstOffset + channel < pixelData.length) {
        pixelData[dstOffset + channel] = compressedData[srcOffset];
      }
      srcOffset++;

      if ((i + 1) % (hasTransparency ? 4 : 3) === 0) {
        dstOffset += 4;
      }
    }
  }

  return pixelData;
}

/**
 * Parse OTFI file (OTML format)
 */
export async function parseOtfiFile(file: File): Promise<OtfiMetadata> {
  try {
    const text = await file.text();

    // Try to parse as JSON first (newer format)
    try {
      const jsonData = JSON.parse(text);
      return {
        signature: jsonData.signature || "OTFI",
        version: jsonData.version || "1.0",
        clientVersion: jsonData.client_version || jsonData.clientVersion,
        spriteSignature: jsonData.sprite_signature || jsonData.spriteSignature,
        datSignature: jsonData.dat_signature || jsonData.datSignature,
        extended: jsonData.extended || false,
        transparency: jsonData.transparency !== false,
        improvedAnimations:
          jsonData.improved_animations || jsonData.improvedAnimations || false,
        frameGroups: jsonData.frame_groups || jsonData.frameGroups || false,
        customProperties:
          jsonData.custom_properties || jsonData.customProperties || {},
      };
    } catch {
      // Parse as OTML format
      return parseOtmlFormat(text);
    }
  } catch (error) {
    throw new TibiaFileError(
      `Failed to parse OTFI file: ${
        error instanceof Error ? error.message : error
      }`,
      "otfi"
    );
  }
}

/**
 * Parse OTML format
 */
function parseOtmlFormat(text: string): OtfiMetadata {
  const metadata: OtfiMetadata = {
    signature: "OTFI",
    version: "1.0",
    customProperties: {},
  };

  const lines = text.split("\n");
  let currentSection = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("//") || trimmed === "") {
      continue; // Skip comments and empty lines
    }

    if (trimmed.endsWith(":")) {
      currentSection = trimmed.slice(0, -1);
      continue;
    }

    const [key, value] = trimmed.split(":").map((s) => s.trim());

    if (key && value) {
      switch (key.toLowerCase()) {
        case "version":
          metadata.version = value;
          break;
        case "client_version":
        case "clientversion":
          metadata.clientVersion = parseInt(value);
          break;
        case "dat_signature":
        case "datsignature":
          metadata.datSignature = parseInt(value, 16);
          break;
        case "spr_signature":
        case "sprsignature":
          metadata.spriteSignature = parseInt(value, 16);
          break;
        case "extended":
          metadata.extended = value.toLowerCase() === "true";
          break;
        case "transparency":
          metadata.transparency = value.toLowerCase() === "true";
          break;
        case "improved_animations":
        case "improvedanimations":
          metadata.improvedAnimations = value.toLowerCase() === "true";
          break;
        case "frame_groups":
        case "framegroups":
          metadata.frameGroups = value.toLowerCase() === "true";
          break;
        default:
          if (metadata.customProperties) {
            metadata.customProperties[key] = value;
          }
          break;
      }
    }
  }

  return metadata;
}

/**
 * Get protocol version for client version
 */
export function getProtocolForClientVersion(
  clientVersion: number
): ProtocolVersion {
  for (const protocol of Object.values(PROTOCOL_VERSIONS)) {
    if (
      clientVersion >= protocol.clientVersionMin &&
      clientVersion <= protocol.clientVersionMax
    ) {
      return protocol;
    }
  }

  // Default to latest version
  return PROTOCOL_VERSIONS["12.86"];
}

function parseTexturePatterns(reader: BinaryReader, thing: ThingType): void {
  try {
    // Frame groups (for newer versions that support them)
    let groupCount = 1;
    if (thing.category === ThingCategory.OUTFIT) {
      // Outfits can have multiple frame groups
      groupCount = reader.readUint8();
    }

    for (let g = 0; g < groupCount; g++) {
      const frameGroup: FrameGroup = {
        type: g === 0 ? FrameGroupType.DEFAULT : FrameGroupType.WALKING,
        width: reader.readUint8(),
        height: reader.readUint8(),
        layers: reader.readUint8() || 1,
        patternX: reader.readUint8(),
        patternY: reader.readUint8(),
        patternZ: reader.readUint8(),
        frames: reader.readUint8(),
        spriteIds: [],
      };

      // Update thing dimensions from first frame group
      if (g === 0) {
        thing.width = frameGroup.width;
        thing.height = frameGroup.height;
        thing.layers = frameGroup.layers;
        thing.patternX = frameGroup.patternX;
        thing.patternY = frameGroup.patternY;
        thing.patternZ = frameGroup.patternZ;
        thing.frames = frameGroup.frames;
      }

      // Calculate total sprites needed
      const totalSprites =
        frameGroup.width *
        frameGroup.height *
        frameGroup.layers *
        frameGroup.patternX *
        frameGroup.patternY *
        frameGroup.patternZ *
        frameGroup.frames;

      // Read sprite IDs
      for (let i = 0; i < totalSprites; i++) {
        const spriteId = reader.readUint32();
        frameGroup.spriteIds.push(spriteId);
        thing.spriteIds.push(spriteId);
      }

      // Store frame group
      thing.frameGroups[frameGroup.type] = frameGroup;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Error parsing texture patterns for thing ${thing.id}: ${message}`
    );
    // Set defaults if parsing fails
    thing.frameGroups[FrameGroupType.DEFAULT] = {
      type: FrameGroupType.DEFAULT,
      width: 1,
      height: 1,
      layers: 1,
      patternX: 1,
      patternY: 1,
      patternZ: 1,
      frames: 1,
      spriteIds: [],
    };
  }
}
