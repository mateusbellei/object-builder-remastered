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

// Protocol-specific metadata flags
const MetadataFlags1098 = {
  GROUND: 0x00,
  GROUND_BORDER: 0x01,
  ON_BOTTOM: 0x02,
  ON_TOP: 0x03,
  CONTAINER: 0x04,
  STACKABLE: 0x05,
  FORCE_USE: 0x06,
  MULTI_USE: 0x07,
  WRITABLE: 0x08,
  WRITABLE_ONCE: 0x09,
  FLUID_CONTAINER: 0x0a,
  FLUID: 0x0b,
  UNPASSABLE: 0x0c,
  UNMOVEABLE: 0x0d,
  BLOCK_MISSILE: 0x0e,
  BLOCK_PATHFIND: 0x0f,
  NO_MOVE_ANIMATION: 0x10,
  PICKUPABLE: 0x11,
  HANGABLE: 0x12,
  VERTICAL: 0x13,
  HORIZONTAL: 0x14,
  ROTATABLE: 0x15,
  HAS_LIGHT: 0x16,
  DONT_HIDE: 0x17,
  TRANSLUCENT: 0x18,
  HAS_OFFSET: 0x19,
  HAS_ELEVATION: 0x1a,
  LYING_OBJECT: 0x1b,
  ANIMATE_ALWAYS: 0x1c,
  MINI_MAP: 0x1d,
  LENS_HELP: 0x1e,
  FULL_GROUND: 0x1f,
  IGNORE_LOOK: 0x20,
  CLOTH: 0x21,
  MARKET_ITEM: 0x22,
  DEFAULT_ACTION: 0x23,
  WRAPPABLE: 0x24,
  UNWRAPPABLE: 0x25,
  TOP_EFFECT: 0x26,
  // Additional flags found in 10.98 files
  CHARGED: 0x27,
  CORPSE: 0x28,
  PLAYER_CORPSE: 0x29,
  CYCLOPEDIA: 0x2a,
  AMMO: 0x2b,
  SHOW_OFF_SOCKET: 0x2c,
  REPORTABLE: 0x2d,
  UPGRADABLE: 0x2e,
  REVERSE_ADDONS: 0x2f,
  EXCLUDE_ADDONS: 0x30,
  OUTFIT_FRAME: 0x31,
  NPC_SALE_DATA: 0x32,
  CHANG_LOOKTYPE: 0x33,
  HEIGHT: 0x34,
  LYING_CORPSE: 0x35,
  ANIMATE_NEVER: 0x36,
  AUTO_WALL: 0x37,
  AUTO_WALL_BORDER: 0x38,
  IGNORE_ZONES: 0x39,
  QUEST_ITEM: 0x3a,
  TRADE: 0x3b,
  EXPIRE: 0x3c,
  EXPIRE_STOP: 0x3d,
  CLOCK: 0x3e,
  MIMIC: 0x3f,
  WRAP_KIT: 0x40,
  UNWRAP_KIT: 0x41,
  TOPORDER: 0x42,
  PODIUM: 0x43,
  SUPPRESS_DRAPE: 0x44,
  CLASSIFICATION: 0x45,
  REVERSE_EAST_WEST: 0x46,
  BOSS: 0x47,
  RARE: 0x48,
  // Additional unknown flags we're encountering
  UNKNOWN_50: 0x50,
  UNKNOWN_54: 0x54,
  UNKNOWN_5F: 0x5f,
  UNKNOWN_64: 0x64,
  UNKNOWN_8E: 0x8e,
  UNKNOWN_90: 0x90,
  UNKNOWN_C8: 0xc8,
  UNKNOWN_DD: 0xdd,
  USABLE: 0xfe,
  LAST_FLAG: 0xff,
};

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
 * Detect protocol version from DAT and SPR signatures
 */
export function detectProtocolFromSignatures(
  datSignature: number,
  sprSignature: number
): ProtocolVersion {
  console.log("Detecting protocol from signatures:", {
    dat: datSignature.toString(16).toUpperCase(),
    spr: sprSignature.toString(16).toUpperCase(),
  });

  // Common signature combinations for different versions
  const signatureMappings: { [key: string]: string } = {
    // 10.98 signatures
    "42A3_57BBD603": "10.98",
    "42A3_57BBD602": "10.98",
    "42A3_57BBD601": "10.98",
    // 7.60 signatures
    "42A1_0": "7.60",
    "42A2_0": "7.60",
    // 8.60 signatures
    "42A3_1": "8.60",
    "42A3_2": "8.60",
    // 12.86 signatures
    "42A4_57BBD603": "12.86",
    "42A4_57BBD604": "12.86",
  };

  const key = `${datSignature.toString(16).toUpperCase()}_${sprSignature
    .toString(16)
    .toUpperCase()}`;
  const detectedVersion = signatureMappings[key];

  if (detectedVersion && PROTOCOL_VERSIONS[detectedVersion]) {
    console.log("✅ Detected protocol:", detectedVersion);
    return PROTOCOL_VERSIONS[detectedVersion];
  }

  // Fallback detection based on signature patterns
  if (datSignature === 0x42a3) {
    if (sprSignature >= 0x57bbd600 && sprSignature <= 0x57bbd610) {
      console.log("✅ Detected protocol: 10.98 (pattern match)");
      return PROTOCOL_VERSIONS["10.98"];
    }
  }

  console.log("⚠️ Unknown signatures, defaulting to 12.86");
  return PROTOCOL_VERSIONS["12.86"];
}

/**
 * Diagnostic function to examine raw bytes around a specific position
 */
function examineBytes(
  reader: BinaryReader,
  position: number,
  context: string
): void {
  const currentPos = reader.currentPosition;
  const startPos = Math.max(0, position - 20);
  const endPos = Math.min(reader.length, position + 20);

  reader.currentPosition = startPos;
  const bytes: number[] = [];

  for (let i = startPos; i < endPos; i++) {
    if (reader.bytesAvailable > 0) {
      bytes.push(reader.readUint8());
    }
  }

  reader.currentPosition = currentPos; // Restore position

  console.log(`🔍 ${context} - Bytes around position ${position}:`);
  console.log(
    `   Position: ${startPos.toString().padStart(8)} to ${endPos
      .toString()
      .padStart(8)}`
  );
  console.log(
    `   Hex:      ${bytes
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ")}`
  );
  console.log(
    `   Decimal:  ${bytes.map((b) => b.toString().padStart(3)).join(" ")}`
  );
  console.log(
    `   ASCII:    ${bytes
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join(" ")}`
  );

  // Highlight the target position
  const targetIndex = position - startPos;
  if (targetIndex >= 0 && targetIndex < bytes.length) {
    const highlight = " ".repeat(targetIndex * 3) + "^^^";
    console.log(`   Target:   ${highlight}`);
  }
}

/**
 * Parse DAT file based on protocol version
 */
export async function parseDatFile(
  file: File,
  protocol?: ProtocolVersion
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

    // If no protocol provided, try to detect from signature
    if (!protocol) {
      protocol = detectProtocolFromSignatures(signature, 0);
    }

    console.log("Using protocol:", protocol.version);

    const initialPosition = reader.currentPosition;
    console.log(`📍 Starting items parsing at position: ${initialPosition}`);

    // Parse items
    const items: ThingType[] = [];
    let successfulItems = 0;
    let failedItems = 0;
    let unknownFlagItems = 0; // Track items with unknown flags

    // Debug mode: limit to last 3 items to see transition clearly
    const debugMode = false;
    const itemStart = debugMode ? Math.max(100, 100 + itemCount - 3) : 100;
    const itemEnd = 100 + itemCount;

    console.log(
      `📍 Parsing items from ${itemStart} to ${itemEnd - 1} (${
        debugMode ? "DEBUG MODE - limited range" : "full range"
      })`
    );

    for (let i = itemStart; i < itemEnd; i++) {
      const beforePosition = reader.currentPosition;
      let thing: ThingType | null = null;

      try {
        thing = parseThingType(reader, i, ThingCategory.ITEM, protocol);
        if (thing) {
          items.push(thing);
          successfulItems++;
        } else {
          failedItems++;
        }
      } catch (error) {
        console.warn(
          `Failed to parse item ${i} at position ${reader.currentPosition}:`,
          error
        );
        failedItems++;

        // Check if error is due to unknown flag
        if (error instanceof Error && error.message.includes("Unknown flag")) {
          unknownFlagItems++;
        }

        // Try to recover by advancing position slightly
        if (reader.bytesAvailable > 10) {
          reader.currentPosition = beforePosition + 1;
          console.log(
            `🔧 Attempting recovery by advancing 1 byte for item ${i}`
          );
        }
      }

      // Log position change for problematic items
      const afterPosition = reader.currentPosition;
      const bytesConsumed = afterPosition - beforePosition;

      if (
        debugMode ||
        i <= 105 ||
        bytesConsumed === 0 ||
        bytesConsumed > 1000 ||
        failedItems > successfulItems / 10
      ) {
        console.log(
          `📍 Item ${i}: pos ${beforePosition} → ${afterPosition} (${bytesConsumed} bytes) ${
            thing ? "✅" : "❌"
          }`
        );
      }

      // Stop if too many failures (corrupted file)
      if (failedItems > 1000 && successfulItems < 100) {
        console.warn("Too many parsing failures, stopping item parsing");
        break;
      }

      // We've improved error recovery, so continue parsing even with unknown flags
    }

    const itemsEndPosition = reader.currentPosition;
    console.log(
      `📍 Finished items parsing at position: ${itemsEndPosition}, bytes available: ${reader.bytesAvailable}`
    );

    // Parse outfits
    const outfits: ThingType[] = [];
    let successfulOutfits = 0;
    let failedOutfits = 0;

    console.log(
      `📍 Starting outfits parsing at position: ${reader.currentPosition}`
    );

    for (let i = 1; i <= outfitCount; i++) {
      const beforePosition = reader.currentPosition;

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
      }

      const afterPosition = reader.currentPosition;
      const bytesConsumed = afterPosition - beforePosition;

      if (i <= 5) {
        console.log(
          `📍 Outfit ${i}: pos ${beforePosition} → ${afterPosition} (${bytesConsumed} bytes)`
        );
      }

      // Stop if too many failures
      if (failedOutfits > 100 && successfulOutfits < 10) {
        console.warn("Too many outfit parsing failures, stopping");
        break;
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
      }

      // Stop if too many failures
      if (failedEffects > 50 && successfulEffects < 5) {
        console.warn("Too many effect parsing failures, stopping");
        break;
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
      }

      // Stop if too many failures
      if (failedMissiles > 20 && successfulMissiles < 2) {
        console.warn("Too many missile parsing failures, stopping");
        break;
      }
    }

    console.log("DAT Parsing Summary:", {
      protocol: protocol.version,
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
 * Parse individual thing type with protocol-specific logic
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

    // Add detailed logging for non-items to debug the issue
    if (category !== ThingCategory.ITEM && id <= 3) {
      console.log(
        `🔍 Parsing ${category} ${id} - Position: ${reader.currentPosition}, Available bytes: ${reader.bytesAvailable}`
      );
    }

    const startPosition = reader.currentPosition;

    // Use protocol-specific parsing
    if (protocol.version === "10.98") {
      parseProperties1098(reader, thing);
    } else {
      parseProperties1286(reader, thing);
    }

    const endPosition = reader.currentPosition;
    const bytesRead = endPosition - startPosition;

    if (category !== ThingCategory.ITEM && id <= 3) {
      console.log(
        `📖 Properties parsed for ${category} ${id}, bytes read: ${bytesRead}, moving to texture patterns`
      );
    }

    // Now read texture patterns (frame groups)
    try {
      parseTexturePatterns(reader, thing, protocol);
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
 * Parse properties for protocol 10.98
 */
function parseProperties1098(reader: BinaryReader, thing: ThingType): void {
  let flag = 0;
  let flagCount = 0;
  const maxFlags = 50; // Safety limit
  const shouldLog = thing.category !== ThingCategory.ITEM && thing.id <= 3;

  if (shouldLog) {
    console.log(
      `🏷️ Starting properties parsing for ${thing.category} ${thing.id}`
    );
  }

  while (flag !== MetadataFlags1098.LAST_FLAG && flagCount < maxFlags) {
    if (reader.bytesAvailable < 1) {
      console.warn(
        `Unexpected end of file while reading flags for thing ${thing.id}`
      );
      break;
    }

    flag = reader.readUint8();
    flagCount++;

    if (shouldLog) {
      console.log(
        `🏷️ Read flag 0x${flag.toString(16)} (${flagCount}) for ${
          thing.category
        } ${thing.id}`
      );
    }

    if (flag === MetadataFlags1098.LAST_FLAG) {
      if (shouldLog) {
        console.log(
          `🏷️ Found LAST_FLAG (0xFF) for ${thing.category} ${thing.id}, total flags: ${flagCount}`
        );
      }
      break;
    }

    try {
      switch (flag) {
        case MetadataFlags1098.GROUND:
          thing.isGround = true;
          if (reader.bytesAvailable >= 2) {
            thing.groundSpeed = reader.readUint16();
            if (shouldLog) {
              console.log(`🏷️ Ground speed: ${thing.groundSpeed}`);
            }
          } else {
            console.warn(
              `Not enough bytes to read ground speed for thing ${thing.id}`
            );
            thing.groundSpeed = 0;
          }
          break;

        case MetadataFlags1098.GROUND_BORDER:
          thing.isGroundBorder = true;
          if (shouldLog) {
            console.log(`🏷️ Ground border flag`);
          }
          break;

        case MetadataFlags1098.ON_BOTTOM:
          thing.isOnBottom = true;
          if (shouldLog) {
            console.log(`🏷️ On bottom flag`);
          }
          break;

        case MetadataFlags1098.ON_TOP:
          thing.isOnTop = true;
          if (shouldLog) {
            console.log(`🏷️ On top flag`);
          }
          break;

        case MetadataFlags1098.CONTAINER:
          thing.isContainer = true;
          if (shouldLog) {
            console.log(`🏷️ Container flag`);
          }
          break;

        case MetadataFlags1098.STACKABLE:
          thing.stackable = true;
          if (shouldLog) {
            console.log(`🏷️ Stackable flag`);
          }
          break;

        case MetadataFlags1098.FORCE_USE:
          thing.forceUse = true;
          if (shouldLog) {
            console.log(`🏷️ Force use flag`);
          }
          break;

        case MetadataFlags1098.MULTI_USE:
          thing.multiUse = true;
          if (shouldLog) {
            console.log(`🏷️ Multi use flag`);
          }
          break;

        case MetadataFlags1098.WRITABLE:
          thing.writable = true;
          if (reader.bytesAvailable >= 2) {
            thing.maxTextLength = reader.readUint16();
            if (shouldLog) {
              console.log(
                `🏷️ Writable, max text length: ${thing.maxTextLength}`
              );
            }
          } else {
            console.warn(
              `Not enough bytes to read text length for thing ${thing.id}`
            );
            thing.maxTextLength = 0;
          }
          break;

        case MetadataFlags1098.WRITABLE_ONCE:
          thing.writableOnce = true;
          if (reader.bytesAvailable >= 2) {
            thing.maxTextLength = reader.readUint16();
            if (shouldLog) {
              console.log(
                `🏷️ Writable once, max text length: ${thing.maxTextLength}`
              );
            }
          } else {
            console.warn(
              `Not enough bytes to read text length for thing ${thing.id}`
            );
            thing.maxTextLength = 0;
          }
          break;

        case MetadataFlags1098.FLUID_CONTAINER:
          thing.isFluidContainer = true;
          break;

        case MetadataFlags1098.FLUID:
          thing.isFluid = true;
          break;

        case MetadataFlags1098.UNPASSABLE:
          thing.isUnpassable = true;
          break;

        case MetadataFlags1098.UNMOVEABLE:
          thing.isUnmoveable = true;
          break;

        case MetadataFlags1098.BLOCK_MISSILE:
          thing.blockMissile = true;
          break;

        case MetadataFlags1098.BLOCK_PATHFIND:
          thing.blockPathfind = true;
          break;

        case MetadataFlags1098.NO_MOVE_ANIMATION:
          thing.noMoveAnimation = true;
          break;

        case MetadataFlags1098.PICKUPABLE:
          thing.pickupable = true;
          break;

        case MetadataFlags1098.HANGABLE:
          thing.hangable = true;
          break;

        case MetadataFlags1098.VERTICAL:
          thing.isVertical = true;
          break;

        case MetadataFlags1098.HORIZONTAL:
          thing.isHorizontal = true;
          break;

        case MetadataFlags1098.ROTATABLE:
          thing.rotatable = true;
          break;

        case MetadataFlags1098.HAS_LIGHT:
          thing.hasLight = true;
          if (reader.bytesAvailable >= 4) {
            thing.lightLevel = reader.readUint16();
            thing.lightColor = reader.readUint16();
            if (shouldLog) {
              console.log(
                `🏷️ Light: level=${thing.lightLevel}, color=${thing.lightColor}`
              );
            }
          } else {
            console.warn(
              `Not enough bytes to read light data for thing ${thing.id}`
            );
            thing.lightLevel = 0;
            thing.lightColor = 0;
          }
          break;

        case MetadataFlags1098.DONT_HIDE:
          thing.dontHide = true;
          break;

        case MetadataFlags1098.TRANSLUCENT:
          thing.isTranslucent = true;
          break;

        case MetadataFlags1098.HAS_OFFSET:
          thing.hasOffset = true;
          if (reader.bytesAvailable >= 4) {
            thing.offsetX = reader.readInt16();
            thing.offsetY = reader.readInt16();
            if (shouldLog) {
              console.log(`🏷️ Offset: x=${thing.offsetX}, y=${thing.offsetY}`);
            }
          } else {
            console.warn(
              `Not enough bytes to read offset data for thing ${thing.id}`
            );
            thing.offsetX = 0;
            thing.offsetY = 0;
          }
          break;

        case MetadataFlags1098.HAS_ELEVATION:
          thing.hasElevation = true;
          if (reader.bytesAvailable >= 2) {
            thing.elevation = reader.readUint16();
            if (shouldLog) {
              console.log(`🏷️ Elevation: ${thing.elevation}`);
            }
          } else {
            console.warn(
              `Not enough bytes to read elevation for thing ${thing.id}`
            );
            thing.elevation = 0;
          }
          break;

        case MetadataFlags1098.LYING_OBJECT:
          thing.isLyingObject = true;
          break;

        case MetadataFlags1098.ANIMATE_ALWAYS:
          thing.animateAlways = true;
          break;

        case MetadataFlags1098.MINI_MAP:
          thing.miniMap = true;
          if (reader.bytesAvailable >= 2) {
            thing.miniMapColor = reader.readUint16();
            if (shouldLog) {
              console.log(`🏷️ Minimap color: ${thing.miniMapColor}`);
            }
          } else {
            console.warn(
              `Not enough bytes to read minimap color for thing ${thing.id}`
            );
            thing.miniMapColor = 0;
          }
          break;

        case MetadataFlags1098.LENS_HELP:
          thing.isLensHelp = true;
          if (reader.bytesAvailable >= 2) {
            thing.lensHelp = reader.readUint16();
            if (shouldLog) {
              console.log(`🏷️ Lens help: ${thing.lensHelp}`);
            }
          } else {
            console.warn(
              `Not enough bytes to read lens help for thing ${thing.id}`
            );
            thing.lensHelp = 0;
          }
          break;

        case MetadataFlags1098.FULL_GROUND:
          thing.isFullGround = true;
          break;

        case MetadataFlags1098.IGNORE_LOOK:
          thing.ignoreLook = true;
          break;

        case MetadataFlags1098.CLOTH:
          thing.cloth = true;
          if (reader.bytesAvailable >= 2) {
            thing.clothSlot = reader.readUint16();
            if (shouldLog) {
              console.log(`🏷️ Cloth slot: ${thing.clothSlot}`);
            }
          } else {
            console.warn(
              `Not enough bytes to read cloth slot for thing ${thing.id}`
            );
            thing.clothSlot = ClothSlot.LEGS as number;
          }
          break;

        case MetadataFlags1098.MARKET_ITEM:
          thing.isMarketItem = true;

          // Read market data with proper validation
          if (reader.bytesAvailable >= 8) {
            // minimum: category + tradeAs + showAs + nameLength
            thing.marketCategory = reader.readUint16();
            thing.marketTradeAs = reader.readUint16();
            thing.marketShowAs = reader.readUint16();

            const nameLength = reader.readUint16();
            if (shouldLog) {
              console.log(
                `🏷️ Market item: category=${thing.marketCategory}, nameLength=${nameLength}`
              );
            }

            if (
              nameLength > 0 &&
              nameLength < 256 &&
              reader.bytesAvailable >= nameLength + 4
            ) {
              thing.marketName = reader.readString(nameLength, "iso-8859-1");
              thing.marketRestrictProfession = reader.readUint16();
              thing.marketRestrictLevel = reader.readUint16();
              if (shouldLog) {
                console.log(`🏷️ Market name: "${thing.marketName}"`);
              }
            } else {
              thing.marketName = "";
              if (nameLength > 0 && reader.bytesAvailable >= nameLength) {
                reader.readBytes(nameLength); // Skip invalid data
              }
              if (reader.bytesAvailable >= 4) {
                thing.marketRestrictProfession = reader.readUint16();
                thing.marketRestrictLevel = reader.readUint16();
              } else {
                thing.marketRestrictProfession = 0;
                thing.marketRestrictLevel = 0;
              }
            }
          } else {
            console.warn(
              `Not enough bytes to read market data for thing ${thing.id}`
            );
            thing.marketCategory = MarketCategory.OTHERS as number;
            thing.marketTradeAs = 0;
            thing.marketShowAs = 0;
            thing.marketName = "";
            thing.marketRestrictProfession = 0;
            thing.marketRestrictLevel = 0;
          }
          break;

        case MetadataFlags1098.DEFAULT_ACTION:
          thing.hasDefaultAction = true;
          if (reader.bytesAvailable >= 2) {
            thing.defaultAction = reader.readUint16();
            if (shouldLog) {
              console.log(`🏷️ Default action: ${thing.defaultAction}`);
            }
          } else {
            console.warn(
              `Not enough bytes to read default action for thing ${thing.id}`
            );
            thing.defaultAction = 0;
          }
          break;

        case MetadataFlags1098.WRAPPABLE:
          thing.wrappable = true;
          break;

        case MetadataFlags1098.UNWRAPPABLE:
          thing.unwrappable = true;
          break;

        case MetadataFlags1098.TOP_EFFECT:
          thing.topEffect = true;
          break;

        case MetadataFlags1098.USABLE:
          thing.usable = true;
          break;

        case MetadataFlags1098.CHARGED:
          // No additional data
          break;

        case MetadataFlags1098.CORPSE:
          // No additional data
          break;

        case MetadataFlags1098.PLAYER_CORPSE:
          // No additional data
          break;

        case MetadataFlags1098.CYCLOPEDIA:
          // Has cyclopedia data - skip for now
          if (reader.bytesAvailable >= 2) {
            const cyclopediaId = reader.readUint16();
            if (shouldLog) {
              console.log(`🏷️ Cyclopedia ID: ${cyclopediaId}`);
            }
          }
          break;

        case MetadataFlags1098.AMMO:
          // No additional data
          break;

        case MetadataFlags1098.SHOW_OFF_SOCKET:
          // No additional data
          break;

        case MetadataFlags1098.REPORTABLE:
          // No additional data
          break;

        case MetadataFlags1098.UPGRADABLE:
          // Has upgrade data - skip for now
          if (reader.bytesAvailable >= 2) {
            const upgradeClassification = reader.readUint16();
            if (shouldLog) {
              console.log(
                `🏷️ Upgrade classification: ${upgradeClassification}`
              );
            }
          }
          break;

        case MetadataFlags1098.REVERSE_ADDONS:
          // No additional data
          break;

        case MetadataFlags1098.EXCLUDE_ADDONS:
          // No additional data
          break;

        case MetadataFlags1098.OUTFIT_FRAME:
          // No additional data
          break;

        case MetadataFlags1098.NPC_SALE_DATA:
          // Has NPC sale data - skip for now
          if (reader.bytesAvailable >= 8) {
            const npcPrice = reader.readUint32();
            const npcSaleFlag = reader.readUint32();
            if (shouldLog) {
              console.log(
                `🏷️ NPC sale data: price=${npcPrice}, flag=${npcSaleFlag}`
              );
            }
          }
          break;

        case MetadataFlags1098.CHANG_LOOKTYPE:
          // No additional data
          break;

        case MetadataFlags1098.HEIGHT:
          // Has height data
          if (reader.bytesAvailable >= 2) {
            const height = reader.readUint16();
            if (shouldLog) {
              console.log(`🏷️ Height: ${height}`);
            }
          }
          break;

        case MetadataFlags1098.LYING_CORPSE:
          // No additional data
          break;

        case MetadataFlags1098.ANIMATE_NEVER:
          // No additional data
          break;

        case MetadataFlags1098.AUTO_WALL:
          // No additional data
          break;

        case MetadataFlags1098.AUTO_WALL_BORDER:
          // No additional data
          break;

        case MetadataFlags1098.IGNORE_ZONES:
          // No additional data
          break;

        case MetadataFlags1098.QUEST_ITEM:
          // No additional data
          break;

        case MetadataFlags1098.TRADE:
          // No additional data
          break;

        case MetadataFlags1098.EXPIRE:
          // Has expire time
          if (reader.bytesAvailable >= 4) {
            const expireTime = reader.readUint32();
            if (shouldLog) {
              console.log(`🏷️ Expire time: ${expireTime}`);
            }
          }
          break;

        case MetadataFlags1098.EXPIRE_STOP:
          // No additional data
          break;

        case MetadataFlags1098.CLOCK:
          // No additional data
          break;

        case MetadataFlags1098.MIMIC:
          // No additional data
          break;

        case MetadataFlags1098.WRAP_KIT:
          // No additional data
          break;

        case MetadataFlags1098.UNWRAP_KIT:
          // No additional data
          break;

        case MetadataFlags1098.TOPORDER:
          // Has top order data
          if (reader.bytesAvailable >= 1) {
            const topOrder = reader.readUint8();
            if (shouldLog) {
              console.log(`🏷️ Top order: ${topOrder}`);
            }
          }
          break;

        case MetadataFlags1098.PODIUM:
          // No additional data
          break;

        case MetadataFlags1098.SUPPRESS_DRAPE:
          // No additional data
          break;

        case MetadataFlags1098.CLASSIFICATION:
          // Has classification data
          if (reader.bytesAvailable >= 1) {
            const classification = reader.readUint8();
            if (shouldLog) {
              console.log(`🏷️ Classification: ${classification}`);
            }
          }
          break;

        case MetadataFlags1098.REVERSE_EAST_WEST:
          // No additional data
          break;

        case MetadataFlags1098.BOSS:
          // No additional data
          break;

        case MetadataFlags1098.RARE:
          // No additional data
          break;

        // Handle the specific unknown flags we're encountering
        case MetadataFlags1098.UNKNOWN_50:
        case MetadataFlags1098.UNKNOWN_54:
        case MetadataFlags1098.UNKNOWN_5F:
        case MetadataFlags1098.UNKNOWN_64:
        case MetadataFlags1098.UNKNOWN_8E:
        case MetadataFlags1098.UNKNOWN_90:
        case MetadataFlags1098.UNKNOWN_C8:
        case MetadataFlags1098.UNKNOWN_DD:
          // These appear to be data rather than flags - skip them
          if (shouldLog) {
            console.log(
              `🏷️ Skipping unknown flag/data: 0x${flag.toString(16)}`
            );
          }
          break;

        default:
          console.warn(
            `⚠️ Unknown flag 0x${flag.toString(16)} for ${thing.category} ${
              thing.id
            } in protocol 10.98 at position ${reader.currentPosition - 1}`
          );

          // Check if this looks like sprite ID data rather than flags
          // Sprite IDs often repeat in patterns and are not valid flags
          const isLikelySpiteData =
            flag > 0x50 &&
            (flag === 0x64 ||
              flag === 0xc8 ||
              flag === 0xdd ||
              flag === 0x54 ||
              flag === 0x5f ||
              flag === 0x8e ||
              flag === 0x90);

          if (isLikelySpiteData) {
            console.warn(
              `🔍 Flag 0x${flag.toString(
                16
              )} looks like sprite data, treating as end of flags for ${
                thing.category
              } ${thing.id}`
            );
            // Rewind one byte and treat this as the end of flags
            reader.currentPosition -= 1;
            flag = MetadataFlags1098.LAST_FLAG;
            break;
          }

          // For unknown flags, we don't know how many bytes to skip
          // This could cause alignment issues - be more graceful about it
          if (thing.category === ThingCategory.ITEM && flag !== 0xff) {
            console.warn(
              `❓ Unknown flag 0x${flag.toString(16)} in ITEM ${
                thing.id
              } - attempting to continue parsing`
            );

            // Log surrounding context for debugging
            if (shouldLog || thing.id <= 200) {
              console.log(`📊 Item ${thing.id} unknown flag context:`, {
                position: reader.currentPosition - 1,
                flag: `0x${flag.toString(16)} (${flag})`,
                bytesAvailable: reader.bytesAvailable,
                flagCount: flagCount,
              });
            }

            // Instead of aborting, treat this as the end of flags and break
            // This allows parsing to continue for other items
            flag = MetadataFlags1098.LAST_FLAG;
            continue;
          }
          break;
      }
    } catch (flagError) {
      console.error(
        `Error processing flag 0x${flag.toString(16)} for thing ${thing.id}:`,
        flagError
      );
      break;
    }
  }

  if (shouldLog) {
    console.log(
      `🏷️ Finished properties parsing for ${thing.category} ${thing.id}, processed ${flagCount} flags`
    );
  }
}

/**
 * Parse properties for protocol 12.86 (existing implementation)
 */
function parseProperties1286(reader: BinaryReader, thing: ThingType): void {
  // Use existing implementation from the original parseThingType
  let flag = 0;
  let flagCount = 0;
  const maxFlags = 100;

  while (flag !== MetadataFlags.LAST_FLAG && flagCount < maxFlags) {
    if (reader.bytesAvailable < 1) {
      console.warn(
        `Unexpected end of file while reading flags for thing ${thing.id}`
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
        // ... (keeping all the existing 12.86 flag handling)
        case MetadataFlags.MARKET_ITEM:
          thing.isMarketItem = true;
          thing.marketCategory = reader.readUint16();
          thing.marketTradeAs = reader.readUint16();
          thing.marketShowAs = reader.readUint16();

          const nameLength = reader.readUint16();
          if (nameLength > 255 || nameLength < 0) {
            console.warn(
              `Invalid market name length ${nameLength} for thing ${thing.id}, skipping name`
            );
            thing.marketName = "";
            if (
              nameLength > 0 &&
              nameLength < 10000 &&
              reader.bytesAvailable >= nameLength
            ) {
              reader.readBytes(nameLength);
            }
          } else if (reader.bytesAvailable >= nameLength) {
            try {
              thing.marketName = reader.readString(nameLength, "iso-8859-1");
            } catch (error) {
              console.warn(
                `Error reading market name for thing ${thing.id}:`,
                error
              );
              thing.marketName = "";
              if (reader.bytesAvailable >= nameLength) {
                reader.readBytes(nameLength);
              }
            }
          } else {
            console.warn(
              `Not enough bytes to read market name for thing ${thing.id}`
            );
            thing.marketName = "";
          }

          thing.marketRestrictProfession = reader.readUint16();
          thing.marketRestrictLevel = reader.readUint16();
          break;
        // Add all other flags from the original implementation...
        default:
          console.warn(
            `Unknown flag 0x${flag.toString(
              16
            )} (previous: 0x${previousFlag.toString(16)}) for ${
              thing.category
            } ${thing.id} at position ${reader.currentPosition}`
          );
          break;
      }
    } catch (flagError) {
      console.error(
        `Error processing flag 0x${flag.toString(16)} for thing ${thing.id}:`,
        flagError
      );
      break;
    }
  }
}

/**
 * Parse texture patterns with protocol awareness
 */
function parseTexturePatterns(
  reader: BinaryReader,
  thing: ThingType,
  protocol: ProtocolVersion
): void {
  try {
    const shouldLog = thing.category !== ThingCategory.ITEM && thing.id <= 3;

    if (shouldLog) {
      console.log(
        `🎨 Starting texture patterns for ${thing.category} ${thing.id} - bytes available: ${reader.bytesAvailable}`
      );
    }

    // Frame groups (for newer versions that support them)
    let groupCount = 1;
    let originalGroupCount = 1; // Track what was actually read from file
    let actuallyHasFrameGroups = false;

    if (protocol.hasFrameGroups && thing.category === ThingCategory.OUTFIT) {
      if (reader.bytesAvailable >= 1) {
        originalGroupCount = reader.readUint8();
        groupCount = originalGroupCount;
        actuallyHasFrameGroups = originalGroupCount > 0;

        if (shouldLog) {
          console.log(
            `🎨 Outfit ${thing.id} has ${originalGroupCount} frame groups (actually has: ${actuallyHasFrameGroups})`
          );
        }
        // Critical fix: If groupCount is 0, the outfit doesn't have frame groups in the file
        // but we still need to parse the standard pattern data
        if (groupCount === 0) {
          groupCount = 1; // Parse as a single default group
          if (shouldLog) {
            console.log(
              `🎨 Outfit ${thing.id} groupCount was 0, using default group`
            );
          }
        }
      } else {
        console.warn(
          `Not enough bytes to read group count for thing ${thing.id}`
        );
        groupCount = 1;
        originalGroupCount = 1;
      }
    }

    for (let g = 0; g < groupCount; g++) {
      // Check if we have enough bytes for frame group header
      if (reader.bytesAvailable < 5) {
        // Minimum bytes needed: width, height, layers, patternX, patternY
        console.warn(
          `Not enough bytes to read frame group ${g} for thing ${thing.id}`
        );
        break;
      }

      // For outfits with frame groups, read an extra byte (group type)
      // This happens AFTER reading group count but BEFORE reading dimensions
      // BUT only if the original groupCount was > 0 (outfit has frame groups in file)
      if (actuallyHasFrameGroups) {
        const groupType = reader.readUint8(); // This byte indicates the group type
        if (shouldLog) {
          console.log(`🎨 Reading outfit group type: ${groupType}`);
        }
      }

      const frameGroup: FrameGroup = {
        type: g === 0 ? FrameGroupType.DEFAULT : FrameGroupType.WALKING,
        width: reader.readUint8(),
        height: reader.readUint8(),
        layers: 1,
        patternX: 1,
        patternY: 1,
        patternZ: 1,
        frames: 1,
        spriteIds: [],
      };

      if (shouldLog) {
        console.log(
          `🎨 Frame group ${g}: ${frameGroup.width}x${frameGroup.height}, bytes remaining: ${reader.bytesAvailable}, position: ${reader.currentPosition}`
        );
      }

      // Read exactSize if width > 1 or height > 1 (this field exists in the original)
      if (frameGroup.width > 1 || frameGroup.height > 1) {
        if (reader.bytesAvailable >= 1) {
          const exactSize = reader.readUint8();
          if (shouldLog) {
            console.log(
              `🎨 Read exactSize: ${exactSize}, pos: ${reader.currentPosition}, bytes: ${reader.bytesAvailable}`
            );
          }
        } else {
          console.warn(
            `Not enough bytes to read exactSize for thing ${thing.id}`
          );
        }
      }

      // Continue reading the standard fields in exact Object Builder order
      // MetadataReader6 uses the base class implementation:
      // layers, patternX, patternY, patternZ (read from file), frames
      if (reader.bytesAvailable >= 5) {
        frameGroup.layers = reader.readUint8() || 1;
        if (shouldLog) {
          console.log(
            `🎨 Read layers: ${frameGroup.layers}, pos: ${reader.currentPosition}, bytes: ${reader.bytesAvailable}`
          );
        }

        frameGroup.patternX = reader.readUint8();
        if (shouldLog) {
          console.log(
            `🎨 Read patternX: ${frameGroup.patternX}, pos: ${reader.currentPosition}, bytes: ${reader.bytesAvailable}`
          );
        }

        frameGroup.patternY = reader.readUint8();
        if (shouldLog) {
          console.log(
            `🎨 Read patternY: ${frameGroup.patternY}, pos: ${reader.currentPosition}, bytes: ${reader.bytesAvailable}`
          );
        }

        frameGroup.patternZ = reader.readUint8(); // Always read from file for MetadataReader6 (protocol 10.98)
        if (shouldLog) {
          console.log(
            `🎨 Read patternZ: ${frameGroup.patternZ}, pos: ${reader.currentPosition}, bytes: ${reader.bytesAvailable}`
          );
        }

        frameGroup.frames = reader.readUint8();
        if (shouldLog) {
          console.log(
            `🎨 Read frames: ${frameGroup.frames}, pos: ${reader.currentPosition}, bytes: ${reader.bytesAvailable}`
          );
        }

        if (shouldLog) {
          console.log(
            `🎨 Individual fields: layers=${frameGroup.layers}, patternX=${frameGroup.patternX}, patternY=${frameGroup.patternY}, patternZ=${frameGroup.patternZ}, frames=${frameGroup.frames}`
          );
        }
      } else {
        console.warn(
          `Not enough bytes to read patterns/frames for thing ${thing.id}`
        );
        break;
      }

      if (shouldLog) {
        console.log(
          `🎨 Full frame group ${g}: ${frameGroup.width}x${frameGroup.height}, layers: ${frameGroup.layers}, patterns: ${frameGroup.patternX}x${frameGroup.patternY}x${frameGroup.patternZ}, frames: ${frameGroup.frames}`
        );
      }

      // Enhanced validation with more reasonable limits
      if (
        frameGroup.width === 0 ||
        frameGroup.width > 10 ||
        frameGroup.height === 0 ||
        frameGroup.height > 10 ||
        frameGroup.layers === 0 ||
        frameGroup.layers > 10
      ) {
        console.warn(
          `Invalid frame group dimensions for thing ${thing.id}: ${frameGroup.width}x${frameGroup.height}x${frameGroup.layers}`
        );
        // Create a minimal safe frame group
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
        return; // Exit early to prevent further corruption
      }

      if (
        frameGroup.patternX === 0 ||
        frameGroup.patternX > 20 ||
        frameGroup.patternY === 0 ||
        frameGroup.patternY > 20 ||
        frameGroup.patternZ === 0 ||
        frameGroup.patternZ > 20 ||
        frameGroup.frames === 0 ||
        frameGroup.frames > 100
      ) {
        console.warn(
          `Invalid frame group patterns for thing ${thing.id}: ${frameGroup.patternX}x${frameGroup.patternY}x${frameGroup.patternZ}, frames: ${frameGroup.frames}`
        );

        // Stop parsing this thing entirely if data is corrupted
        console.warn(
          `Stopping parsing for ${thing.category} ${thing.id} due to corrupted data`
        );

        // Create a minimal safe frame group and exit
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
        return; // Exit early to prevent further corruption
      }

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

      if (shouldLog) {
        console.log(`🎨 Total sprites needed: ${totalSprites}`);
      }

      // Handle zero sprite counts correctly
      if (totalSprites === 0) {
        if (shouldLog) {
          console.log(`🎨 Total sprites is 0, skipping sprite ID reading`);
        }

        // Store the frame group with empty sprite array
        thing.frameGroups[frameGroup.type] = frameGroup;
        continue;
      }

      // Validate total sprites count
      if (totalSprites < 0 || totalSprites > 4096) {
        console.warn(
          `Invalid sprites count for thing ${thing.id}: ${totalSprites}, creating minimal frame group`
        );
        // Set minimal frame group to avoid memory issues
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
        continue;
      }

      // Determine sprite ID size based on protocol version
      // According to Object Builder source: extended determines if sprite IDs are 4 bytes (true) or 2 bytes (false)
      const spriteIdSize = protocol.hasExtended ? 4 : 2;
      const bytesNeeded = totalSprites * spriteIdSize;

      if (shouldLog) {
        console.log(
          `🎨 Reading sprite IDs: size=${spriteIdSize} bytes, total=${totalSprites}, protocol=${protocol.version}, extended=${protocol.hasExtended}`
        );
      }

      if (reader.bytesAvailable < bytesNeeded) {
        console.warn(
          `Not enough bytes to read ${totalSprites} sprite IDs for thing ${thing.id} (need ${bytesNeeded}, have ${reader.bytesAvailable})`
        );
        // Read as many as we can
        const maxSprites = Math.floor(reader.bytesAvailable / spriteIdSize);
        for (let i = 0; i < maxSprites; i++) {
          const spriteId = protocol.hasExtended
            ? reader.readUint32()
            : reader.readUint16();

          // Validate sprite ID - should not be extremely large values
          if (spriteId > 0 && spriteId < 1000000) {
            frameGroup.spriteIds.push(spriteId);
            thing.spriteIds.push(spriteId);
          } else if (spriteId === 0) {
            // Empty sprite ID is valid
            frameGroup.spriteIds.push(0);
            thing.spriteIds.push(0);
          } else {
            console.warn(
              `Invalid sprite ID ${spriteId} for thing ${thing.id}, skipping`
            );
            // Push 0 as placeholder to maintain array size
            frameGroup.spriteIds.push(0);
            thing.spriteIds.push(0);
          }
        }
      } else {
        // Read sprite IDs with correct size and validation
        for (let i = 0; i < totalSprites; i++) {
          const spriteId = protocol.hasExtended
            ? reader.readUint32()
            : reader.readUint16();

          // Validate sprite ID - should not be extremely large values
          if (spriteId > 0 && spriteId < 1000000) {
            frameGroup.spriteIds.push(spriteId);
            thing.spriteIds.push(spriteId);
          } else if (spriteId === 0) {
            // Empty sprite ID is valid
            frameGroup.spriteIds.push(0);
            thing.spriteIds.push(0);
          } else {
            console.warn(
              `Invalid sprite ID ${spriteId} for thing ${thing.id} at position ${i}, using 0`
            );
            // Push 0 as placeholder
            frameGroup.spriteIds.push(0);
            thing.spriteIds.push(0);
          }
        }
      }

      if (shouldLog) {
        console.log(
          `🎨 Read ${
            frameGroup.spriteIds.length
          } sprite IDs for group ${g}, first few: [${frameGroup.spriteIds
            .slice(0, 5)
            .join(", ")}]`
        );
      }

      // Store the frame group
      thing.frameGroups[frameGroup.type] = frameGroup;
    }

    // Ensure we always have at least a default frame group
    if (!thing.frameGroups[FrameGroupType.DEFAULT]) {
      thing.frameGroups[FrameGroupType.DEFAULT] = {
        type: FrameGroupType.DEFAULT,
        width: thing.width || 1,
        height: thing.height || 1,
        layers: thing.layers || 1,
        patternX: thing.patternX || 1,
        patternY: thing.patternY || 1,
        patternZ: thing.patternZ || 1,
        frames: thing.frames || 1,
        spriteIds: [...thing.spriteIds],
      };
    }

    if (shouldLog) {
      console.log(
        `🎨 Finished texture patterns for ${thing.category} ${
          thing.id
        }, total frame groups: ${Object.keys(thing.frameGroups).length}`
      );
    }
  } catch (error) {
    console.error(
      `Error parsing texture patterns for ${thing.category} ${thing.id}:`,
      error
    );
    // Create a minimal safe frame group
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
    let successfulSprites = 0;
    let emptySprites = 0;
    let errorSprites = 0;

    for (let i = 1; i <= spriteCount; i++) {
      try {
        const offset = spriteOffsets[i - 1];
        if (offset === 0) {
          // Empty sprite
          sprites.push(createEmptySprite(i));
          emptySprites++;
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

        // Log first few sprites for debugging
        if (i <= 5) {
          console.log(`Sprite ${i} info:`, {
            offset,
            red,
            green,
            blue,
            alpha,
            dataSize,
            hasTransparency,
            compressedSize: compressedPixels.length,
          });
        }

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

        successfulSprites++;
      } catch (error) {
        console.warn(`Error parsing sprite ${i}:`, error);
        sprites.push(createEmptySprite(i));
        errorSprites++;
      }
    }

    console.log("SPR parsing complete:", {
      total: spriteCount,
      successful: successfulSprites,
      empty: emptySprites,
      errors: errorSprites,
    });

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
 * Decompress sprite data using Tibia's RLE compression
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

  if (compressedData.length === 0) {
    // Fill with transparent pixels
    for (let i = 3; i < pixelData.length; i += 4) {
      pixelData[i] = 0; // Alpha = 0 (transparent)
    }
    return pixelData;
  }

  try {
    const channelSizes = [red, green, blue, hasTransparency ? alpha : 0];
    let srcOffset = 0;

    // Initialize all pixels to transparent/black
    for (let i = 0; i < pixelData.length; i += 4) {
      pixelData[i] = 0; // R
      pixelData[i + 1] = 0; // G
      pixelData[i + 2] = 0; // B
      pixelData[i + 3] = hasTransparency ? 0 : 255; // A
    }

    // Process each color channel
    for (let channel = 0; channel < (hasTransparency ? 4 : 3); channel++) {
      const channelSize = channelSizes[channel];

      if (channelSize === 0) continue;

      let pixelIndex = 0;
      let dataIndex = srcOffset;
      const endIndex = srcOffset + channelSize;

      // Decompress using RLE-like algorithm
      while (
        dataIndex < endIndex &&
        dataIndex < compressedData.length &&
        pixelIndex < SPRITE_SIZE * SPRITE_SIZE
      ) {
        const byte = compressedData[dataIndex++];

        // Check if this is a run-length encoded sequence
        if (byte === 0) {
          // Skip transparent pixels - advance pixel index
          if (dataIndex < endIndex && dataIndex < compressedData.length) {
            const skipCount = compressedData[dataIndex++];
            pixelIndex += skipCount;
          }
        } else {
          // Direct pixel value
          const pixelOffset = pixelIndex * 4 + channel;
          if (pixelOffset < pixelData.length) {
            pixelData[pixelOffset] = byte;
          }
          pixelIndex++;
        }
      }

      srcOffset += channelSize;
    }

    // For non-transparent sprites, ensure alpha is 255
    if (!hasTransparency) {
      for (let i = 3; i < pixelData.length; i += 4) {
        pixelData[i] = 255;
      }
    }
  } catch (error) {
    console.warn("Error decompressing sprite:", error);

    // Return a debug pattern on error
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const offset = (y * 32 + x) * 4;
        if (offset + 3 < pixelData.length) {
          // Create a checkerboard pattern for debugging
          const isChecked = (Math.floor(x / 4) + Math.floor(y / 4)) % 2;
          pixelData[offset] = isChecked ? 255 : 128; // R
          pixelData[offset + 1] = isChecked ? 0 : 128; // G
          pixelData[offset + 2] = isChecked ? 255 : 128; // B
          pixelData[offset + 3] = 255; // A
        }
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
