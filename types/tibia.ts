/**
 * Tibia Object Builder TypeScript Definitions
 * Based on the original Object Builder ActionScript source code
 */

// ====================
// ENUMS AND CONSTANTS
// ====================

export enum ThingCategory {
  ITEM = "item",
  OUTFIT = "outfit",
  EFFECT = "effect",
  MISSILE = "missile",
}

export enum FrameGroupType {
  DEFAULT = 0,
  IDLE = 1,
  WALKING = 2,
}

export enum AnimationMode {
  ASYNCHRONOUS = 0,
  SYNCHRONOUS = 1,
}

export enum MetadataFlags {
  // Version 6+ flags (Tibia 10.10 - 12.86+)
  GROUND = 0x00,
  GROUND_BORDER = 0x01,
  ON_BOTTOM = 0x02,
  ON_TOP = 0x03,
  CONTAINER = 0x04,
  STACKABLE = 0x05,
  FORCE_USE = 0x06,
  MULTI_USE = 0x07,
  WRITABLE = 0x08,
  WRITABLE_ONCE = 0x09,
  FLUID_CONTAINER = 0x0a,
  FLUID = 0x0b,
  UNPASSABLE = 0x0c,
  UNMOVEABLE = 0x0d,
  BLOCK_MISSILE = 0x0e,
  BLOCK_PATHFIND = 0x0f,
  NO_MOVE_ANIMATION = 0x10,
  PICKUPABLE = 0x11,
  HANGABLE = 0x12,
  VERTICAL = 0x13,
  HORIZONTAL = 0x14,
  ROTATABLE = 0x15,
  HAS_LIGHT = 0x16,
  DONT_HIDE = 0x17,
  TRANSLUCENT = 0x18,
  HAS_OFFSET = 0x19,
  HAS_ELEVATION = 0x1a,
  LYING_OBJECT = 0x1b,
  ANIMATE_ALWAYS = 0x1c,
  MINI_MAP = 0x1d,
  LENS_HELP = 0x1e,
  FULL_GROUND = 0x1f,
  IGNORE_LOOK = 0x20,
  CLOTH = 0x21,
  MARKET_ITEM = 0x22,
  DEFAULT_ACTION = 0x23,
  WRAPPABLE = 0x24,
  UNWRAPPABLE = 0x25,
  TOP_EFFECT = 0x26,
  USABLE = 0xfe,
  LAST_FLAG = 0xff,
}

export enum ClothSlot {
  LEGS = 1,
  FEET = 2,
  HEAD = 3,
  TORSO = 4,
  TWO_HANDED = 5,
  SHIRT = 6,
}

export enum MarketCategory {
  ARMORS = 1,
  AMULETS = 2,
  BOOTS = 3,
  CONTAINERS = 4,
  DECORATION = 5,
  FOOD = 6,
  HELMETS_HATS = 7,
  LEGS = 8,
  OTHERS = 9,
  POTIONS = 10,
  RINGS = 11,
  RUNES = 12,
  SHIELDS = 13,
  TOOLS = 14,
  VALUABLES = 15,
  AMMUNITION = 16,
  AXES = 17,
  CLUBS = 18,
  DISTANCE_WEAPONS = 19,
  SWORDS = 20,
  WANDS_RODS = 21,
  PREMIUM_SCROLLS = 22,
  TIBIA_COINS = 23,
  CREATURE_PRODUCTS = 24,
}

// ====================
// CORE INTERFACES
// ====================

export interface FrameDuration {
  minimum: number;
  maximum: number;
}

export interface FrameGroup {
  type: FrameGroupType;
  width: number;
  height: number;
  exactSize?: number;
  layers: number;
  patternX: number;
  patternY: number;
  patternZ: number;
  frames: number;
  spriteIndex?: number[];
  spriteIds: number[];
  isAnimation?: boolean;
  animationMode?: AnimationMode;
  loopCount?: number;
  startFrame?: number;
  frameDurations?: FrameDuration[] | null;
}

export interface TibiaSprite {
  id: number;
  width: number;
  height: number;
  transparent: boolean;
  compressedPixels: Uint8Array;
  pixelData: Uint8Array | null;
  bitmapData: ImageData | null;
  isEmpty: boolean;
  hash?: string;
}

export interface SpriteExtent {
  DEFAULT_SIZE: 32;
  DEFAULT_DATA_SIZE: 4096; // 32 * 32 * 4 (RGBA)
}

export interface ThingTypeProperties {
  // Basic properties
  id: number;
  category: ThingCategory;

  // Dimensions (added for compatibility)
  width?: number;
  height?: number;
  layers?: number;
  patternX?: number;
  patternY?: number;
  patternZ?: number;
  frames?: number;

  // Ground properties
  isGround: boolean;
  groundSpeed: number;
  isGroundBorder: boolean;

  // Position properties
  isOnBottom: boolean;
  isOnTop: boolean;

  // Container properties
  isContainer: boolean;

  // Stack properties
  stackable: boolean;

  // Use properties
  forceUse: boolean;
  multiUse: boolean;
  usable: boolean;

  // Charges
  hasCharges?: boolean;

  // Writable properties
  writable: boolean;
  writableOnce: boolean;
  maxTextLength: number;

  // Fluid properties
  isFluidContainer: boolean;
  isFluid: boolean;

  // Movement properties
  isUnpassable: boolean;
  isUnmoveable: boolean;
  blockMissile: boolean;
  blockPathfind: boolean;
  noMoveAnimation: boolean;

  // Pickup properties
  pickupable: boolean;

  // Hanging properties
  hangable: boolean;

  // Orientation properties
  isVertical: boolean;
  isHorizontal: boolean;
  rotatable: boolean;

  // Light properties
  hasLight: boolean;
  lightLevel: number;
  lightColor: number;

  // Visibility properties
  dontHide: boolean;
  isTranslucent: boolean;

  // Floor properties
  floorChange?: boolean;

  // Offset properties
  hasOffset: boolean;
  offsetX: number;
  offsetY: number;

  // Elevation properties
  hasElevation: boolean;
  elevation: number;

  // Lying object
  isLyingObject: boolean;

  // Animation properties
  animateAlways: boolean;

  // Minimap properties
  miniMap: boolean;
  miniMapColor: number;

  // Lens help properties
  isLensHelp: boolean;
  lensHelp: number;

  // Full ground
  isFullGround: boolean;

  // Look properties
  ignoreLook: boolean;

  // Cloth properties
  cloth: boolean;
  clothSlot: number;

  // Market properties
  isMarketItem: boolean;
  marketName: string;
  marketCategory: number;
  marketTradeAs: number;
  marketShowAs: number;
  marketRestrictProfession: number;
  marketRestrictLevel: number;

  // Default action
  hasDefaultAction: boolean;
  defaultAction: number;

  // Wrapping
  wrappable: boolean;
  unwrappable: boolean;

  // Top effect
  topEffect: boolean;
}

export interface ThingType extends ThingTypeProperties {
  frameGroups: Record<FrameGroupType, FrameGroup>;
  spriteIds: number[];
}

export interface SpriteData {
  id: number;
  pixels: Uint8Array;
}

export interface ThingData {
  obdVersion: number;
  clientVersion: number;
  thing: ThingType;
  sprites: Record<FrameGroupType, SpriteData[]>;
}

// ====================
// FILE FORMAT INTERFACES
// ====================

export interface DatFileHeader {
  signature: number;
  itemCount: number;
  outfitCount: number;
  effectCount: number;
  missileCount: number;
}

export interface DatFileData extends DatFileHeader {
  items: ThingType[];
  outfits: ThingType[];
  effects: ThingType[];
  missiles: ThingType[];
}

export interface SpriteFilePosition {
  address: number;
  size: number;
}

export interface SprFileHeader {
  signature: number;
  spriteCount: number;
}

export interface SprFileData extends SprFileHeader {
  sprites: TibiaSprite[];
  spriteOffsets: number[];
  spritePositions: SpriteFilePosition[];
}

export interface OtfiMetadata {
  signature?: string;
  version?: string;
  clientVersion?: number;
  spriteSignature?: number;
  datSignature?: number;

  // Extended properties
  extended?: boolean;
  transparency?: boolean;
  improvedAnimations?: boolean;
  frameGroups?: boolean;

  // Custom properties
  customProperties?: Record<string, any>;
}

export interface ProjectData {
  protocol: string;
  clientVersion: number;
  datFile: DatFileData | null;
  sprFile: SprFileData | null;
  otfiMetadata: OtfiMetadata | null;
  isLoaded: boolean;
  loadedFiles: {
    dat: boolean;
    spr: boolean;
    otfi: boolean;
  };
}

// ====================
// PROTOCOL DEFINITIONS
// ====================

export interface ProtocolVersion {
  version: string;
  datSignature: number;
  sprSignature: number;
  hasExtended: boolean;
  hasFrameGroups: boolean;
  hasImprovedAnimations: boolean;
  clientVersionMin: number;
  clientVersionMax: number;
}

export const PROTOCOL_VERSIONS: Record<string, ProtocolVersion> = {
  "7.10": {
    version: "7.10",
    datSignature: 0x00000000,
    sprSignature: 0x00000000,
    hasExtended: false,
    hasFrameGroups: false,
    hasImprovedAnimations: false,
    clientVersionMin: 710,
    clientVersionMax: 759,
  },
  "7.60": {
    version: "7.60",
    datSignature: 0x42a1,
    sprSignature: 0x00000000,
    hasExtended: false,
    hasFrameGroups: false,
    hasImprovedAnimations: false,
    clientVersionMin: 760,
    clientVersionMax: 859,
  },
  "8.60": {
    version: "8.60",
    datSignature: 0x42a3,
    sprSignature: 0x00000001,
    hasExtended: true,
    hasFrameGroups: false,
    hasImprovedAnimations: false,
    clientVersionMin: 860,
    clientVersionMax: 985,
  },
  "9.86": {
    version: "9.86",
    datSignature: 0x42a3,
    sprSignature: 0x00000002,
    hasExtended: true,
    hasFrameGroups: false,
    hasImprovedAnimations: false,
    clientVersionMin: 986,
    clientVersionMax: 1097,
  },
  "10.98": {
    version: "10.98",
    datSignature: 0x42a3,
    sprSignature: 0x57bbd603,
    hasExtended: true,
    hasFrameGroups: true,
    hasImprovedAnimations: true,
    clientVersionMin: 1098,
    clientVersionMax: 1199,
  },
  "12.86": {
    version: "12.86",
    datSignature: 0x42a4,
    sprSignature: 0x57bbd603,
    hasExtended: true,
    hasFrameGroups: true,
    hasImprovedAnimations: true,
    clientVersionMin: 1200,
    clientVersionMax: 99999,
  },
};

// ====================
// UTILITY TYPES
// ====================

export interface LoadFileOptions {
  dat?: File;
  spr?: File;
  otfi?: File;
}

export interface ExportOptions {
  format: "dat" | "spr" | "otfi" | "all";
  protocol?: string;
  compression?: boolean;
}

export interface SpriteSheetOptions {
  columns: number;
  spriteSize: number;
  padding: number;
  backgroundColor: string;
}

export interface ImportSpriteSheetOptions {
  spriteWidth: number;
  spriteHeight: number;
  columns: number;
  rows: number;
}

// ====================
// ERROR TYPES
// ====================

export class TibiaFileError extends Error {
  constructor(message: string, public fileType: "dat" | "spr" | "otfi") {
    super(message);
    this.name = "TibiaFileError";
  }
}

export class InvalidProtocolError extends Error {
  constructor(message: string, public protocol: string) {
    super(message);
    this.name = "InvalidProtocolError";
  }
}

export class ParseError extends Error {
  constructor(message: string, public position: number) {
    super(message);
    this.name = "ParseError";
  }
}
