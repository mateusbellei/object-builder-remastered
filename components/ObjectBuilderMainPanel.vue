<template>
  <div class="flex-1 bg-white flex flex-col">
    <!-- Header -->
    <div class="border-b border-gray-200 p-4">
      <div v-if="selectedItem" class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ selectedItem.category }} ID: {{ selectedItem.id }}
          </h2>
          <p v-if="selectedItem.marketName" class="text-sm text-gray-600 mt-1">
            {{ selectedItem.marketName }}
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <span
            class="text-xs px-2 py-1 rounded"
            :class="getCategoryBadgeClass(selectedItem.category)"
          >
            {{ selectedItem.category }}
          </span>
          <span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
            {{ selectedItem.width }}x{{ selectedItem.height }}
          </span>
        </div>
      </div>
      <div v-else class="text-center text-gray-500">
        <h2 class="text-xl font-semibold">Object Builder</h2>
        <p class="text-sm mt-1">
          Select an item from the left panel to view details
        </p>
      </div>
    </div>

    <!-- Content -->
    <div v-if="selectedItem" class="flex-1 overflow-y-auto">
      <div class="p-6 space-y-6">
        <!-- Basic Properties -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-3">
            Basic Properties
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-600">ID:</span>
              <span class="ml-2 font-medium">{{ selectedItem.id }}</span>
            </div>
            <div>
              <span class="text-gray-600">Category:</span>
              <span class="ml-2 font-medium">{{ selectedItem.category }}</span>
            </div>
            <div>
              <span class="text-gray-600">Size:</span>
              <span class="ml-2 font-medium"
                >{{ selectedItem.width }}x{{ selectedItem.height }}</span
              >
            </div>
            <div v-if="selectedItem.layers && selectedItem.layers > 1">
              <span class="text-gray-600">Layers:</span>
              <span class="ml-2 font-medium">{{ selectedItem.layers }}</span>
            </div>
            <div v-if="selectedItem.frames && selectedItem.frames > 1">
              <span class="text-gray-600">Frames:</span>
              <span class="ml-2 font-medium">{{ selectedItem.frames }}</span>
            </div>
            <div v-if="selectedItem.spriteIds.length > 0">
              <span class="text-gray-600">Sprites:</span>
              <span class="ml-2 font-medium">{{
                selectedItem.spriteIds.length
              }}</span>
            </div>
          </div>
        </div>

        <!-- Item Properties -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-3">
            Item Properties
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div
              v-for="property in getItemProperties(selectedItem)"
              :key="property.key"
              class="flex items-center"
            >
              <span
                class="w-3 h-3 rounded-full mr-2"
                :class="property.value ? 'bg-green-500' : 'bg-gray-300'"
              ></span>
              <span
                class="text-sm"
                :class="property.value ? 'text-gray-900' : 'text-gray-500'"
              >
                {{ property.label }}
              </span>
              <span v-if="property.extra" class="ml-1 text-xs text-gray-500">
                ({{ property.extra }})
              </span>
            </div>
          </div>
        </div>

        <!-- Market Information -->
        <div v-if="selectedItem.isMarketItem" class="bg-blue-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-3">
            Market Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Name:</span>
              <span class="ml-2 font-medium">{{
                selectedItem.marketName || "Unnamed"
              }}</span>
            </div>
            <div>
              <span class="text-gray-600">Category:</span>
              <span class="ml-2 font-medium">{{
                getMarketCategoryName(selectedItem.marketCategory)
              }}</span>
            </div>
            <div>
              <span class="text-gray-600">Trade As:</span>
              <span class="ml-2 font-medium">{{
                selectedItem.marketTradeAs
              }}</span>
            </div>
            <div>
              <span class="text-gray-600">Show As:</span>
              <span class="ml-2 font-medium">{{
                selectedItem.marketShowAs
              }}</span>
            </div>
            <div v-if="selectedItem.marketRestrictLevel > 0">
              <span class="text-gray-600">Min Level:</span>
              <span class="ml-2 font-medium">{{
                selectedItem.marketRestrictLevel
              }}</span>
            </div>
            <div v-if="selectedItem.marketRestrictProfession > 0">
              <span class="text-gray-600">Profession:</span>
              <span class="ml-2 font-medium">{{
                selectedItem.marketRestrictProfession
              }}</span>
            </div>
          </div>
        </div>

        <!-- Light Information -->
        <div v-if="selectedItem.hasLight" class="bg-yellow-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-3">
            Light Information
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Light Level:</span>
              <span class="ml-2 font-medium">{{
                selectedItem.lightLevel
              }}</span>
            </div>
            <div>
              <span class="text-gray-600">Light Color:</span>
              <span class="ml-2 font-medium">{{
                selectedItem.lightColor
              }}</span>
            </div>
          </div>
        </div>

        <!-- Frame Groups -->
        <div
          v-if="Object.keys(selectedItem.frameGroups).length > 0"
          class="bg-purple-50 rounded-lg p-4"
        >
          <h3 class="text-lg font-medium text-gray-900 mb-3">Frame Groups</h3>
          <div class="space-y-3">
            <div
              v-for="(frameGroup, type) in selectedItem.frameGroups"
              :key="type"
              class="border border-purple-200 rounded p-3"
            >
              <h4 class="font-medium text-purple-900 mb-2">
                {{ getFrameGroupTypeName(type) }}
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span class="text-gray-600">Size:</span>
                  <span class="ml-1"
                    >{{ frameGroup.width }}x{{ frameGroup.height }}</span
                  >
                </div>
                <div>
                  <span class="text-gray-600">Layers:</span>
                  <span class="ml-1">{{ frameGroup.layers }}</span>
                </div>
                <div>
                  <span class="text-gray-600">Patterns:</span>
                  <span class="ml-1"
                    >{{ frameGroup.patternX }}x{{ frameGroup.patternY }}x{{
                      frameGroup.patternZ
                    }}</span
                  >
                </div>
                <div>
                  <span class="text-gray-600">Frames:</span>
                  <span class="ml-1">{{ frameGroup.frames }}</span>
                </div>
                <div class="col-span-2 md:col-span-4">
                  <span class="text-gray-600">Sprites:</span>
                  <span class="ml-1"
                    >{{ frameGroup.spriteIds.length }} IDs</span
                  >
                  <span
                    v-if="frameGroup.spriteIds.length > 0"
                    class="ml-2 text-gray-500"
                  >
                    ({{ frameGroup.spriteIds.slice(0, 5).join(", ")
                    }}{{ frameGroup.spriteIds.length > 5 ? "..." : "" }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sprite Preview -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Sprite Preview</h3>
          <div class="grid grid-cols-8 gap-2">
            <div
              v-for="(spriteId, index) in selectedItem.spriteIds.slice(0, 32)"
              :key="spriteId"
              class="aspect-square bg-white border border-gray-200 rounded flex items-center justify-center"
            >
              <span class="text-xs text-gray-500">{{ spriteId }}</span>
            </div>
          </div>
          <div
            v-if="selectedItem.spriteIds.length > 32"
            class="mt-2 text-xs text-gray-500"
          >
            Showing 32 of {{ selectedItem.spriteIds.length }} sprites
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center text-gray-500">
        <div
          class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <span class="text-2xl">📦</span>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Item Selected</h3>
        <p class="text-sm">
          Choose an item from the left panel to view its details and properties.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThingType } from "~/types/tibia";
import { ThingCategory, MarketCategory, FrameGroupType } from "~/types/tibia";

// Props
interface Props {
  selectedItem?: ThingType | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedItem: null,
});

const getCategoryBadgeClass = (category: ThingCategory) => {
  switch (category) {
    case ThingCategory.ITEM:
      return "bg-green-100 text-green-800";
    case ThingCategory.OUTFIT:
      return "bg-blue-100 text-blue-800";
    case ThingCategory.EFFECT:
      return "bg-purple-100 text-purple-800";
    case ThingCategory.MISSILE:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getItemProperties = (item: ThingType) => {
  return [
    {
      key: "ground",
      label: "Ground",
      value: item.isGround,
      extra: item.groundSpeed ? `Speed: ${item.groundSpeed}` : null,
    },
    { key: "container", label: "Container", value: item.isContainer },
    { key: "stackable", label: "Stackable", value: item.stackable },
    { key: "pickupable", label: "Pickupable", value: item.pickupable },
    { key: "moveable", label: "Moveable", value: !item.isUnmoveable },
    { key: "blockMissile", label: "Block Missile", value: item.blockMissile },
    {
      key: "blockPathfind",
      label: "Block Pathfind",
      value: item.blockPathfind,
    },
    {
      key: "writable",
      label: "Writable",
      value: item.writable,
      extra: item.maxTextLength ? `Max: ${item.maxTextLength}` : null,
    },
    { key: "readable", label: "Readable", value: item.writableOnce },
    {
      key: "fluidContainer",
      label: "Fluid Container",
      value: item.isFluidContainer,
    },
    { key: "fluid", label: "Fluid", value: item.isFluid },
    { key: "unpassable", label: "Unpassable", value: item.isUnpassable },
    { key: "hangable", label: "Hangable", value: item.hangable },
    { key: "rotatable", label: "Rotatable", value: item.rotatable },
    { key: "hasLight", label: "Has Light", value: item.hasLight },
    { key: "translucent", label: "Translucent", value: item.isTranslucent },
    {
      key: "hasOffset",
      label: "Has Offset",
      value: item.hasOffset,
      extra: item.hasOffset ? `${item.offsetX},${item.offsetY}` : null,
    },
    {
      key: "hasElevation",
      label: "Has Elevation",
      value: item.hasElevation,
      extra: item.elevation ? `${item.elevation}` : null,
    },
    { key: "lyingObject", label: "Lying Object", value: item.isLyingObject },
    {
      key: "animateAlways",
      label: "Animate Always",
      value: item.animateAlways,
    },
    {
      key: "miniMap",
      label: "Mini Map",
      value: item.miniMap,
      extra: item.miniMapColor ? `Color: ${item.miniMapColor}` : null,
    },
    { key: "fullGround", label: "Full Ground", value: item.isFullGround },
    { key: "ignoreLook", label: "Ignore Look", value: item.ignoreLook },
    { key: "cloth", label: "Cloth", value: item.cloth },
    { key: "marketItem", label: "Market Item", value: item.isMarketItem },
  ];
};

const getMarketCategoryName = (category: number) => {
  const categories: Record<number, string> = {
    [MarketCategory.ARMORS]: "Armors",
    [MarketCategory.AMULETS]: "Amulets",
    [MarketCategory.BOOTS]: "Boots",
    [MarketCategory.CONTAINERS]: "Containers",
    [MarketCategory.DECORATION]: "Decoration",
    [MarketCategory.FOOD]: "Food",
    [MarketCategory.HELMETS_HATS]: "Helmets & Hats",
    [MarketCategory.LEGS]: "Legs",
    [MarketCategory.OTHERS]: "Others",
    [MarketCategory.POTIONS]: "Potions",
    [MarketCategory.RINGS]: "Rings",
    [MarketCategory.RUNES]: "Runes",
    [MarketCategory.SHIELDS]: "Shields",
    [MarketCategory.TOOLS]: "Tools",
    [MarketCategory.VALUABLES]: "Valuables",
    [MarketCategory.AMMUNITION]: "Ammunition",
    [MarketCategory.AXES]: "Axes",
    [MarketCategory.CLUBS]: "Clubs",
    [MarketCategory.DISTANCE_WEAPONS]: "Distance Weapons",
    [MarketCategory.SWORDS]: "Swords",
    [MarketCategory.WANDS_RODS]: "Wands & Rods",
    [MarketCategory.PREMIUM_SCROLLS]: "Premium Scrolls",
  };
  return categories[category] || `Unknown (${category})`;
};

const getFrameGroupTypeName = (type: FrameGroupType) => {
  const types: Record<FrameGroupType, string> = {
    [FrameGroupType.DEFAULT]: "Default",
    [FrameGroupType.WALKING]: "Walking",
    [FrameGroupType.IDLE]: "Idle",
  };
  return types[type] || `Type ${type}`;
};
</script>
