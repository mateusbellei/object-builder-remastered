<template>
  <div class="h-full flex flex-col bg-gray-50 border-r border-gray-200">
    <!-- Project Info -->
    <div class="p-4 border-b border-gray-200 bg-white">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Project Info</h2>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Protocol:</span>
          <span class="font-medium text-blue-600">{{
            projectState.protocol
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Client Version:</span>
          <span class="font-medium">{{ projectState.clientVersion }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Items:</span>
          <span class="font-medium text-green-600">{{ getItems.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Outfits:</span>
          <span class="font-medium text-blue-600">{{ getOutfits.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Effects:</span>
          <span class="font-medium text-purple-600">{{
            getEffects.length
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Missiles:</span>
          <span class="font-medium text-red-600">{{ getMissiles.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Sprites:</span>
          <span class="font-medium text-gray-600">{{
            getSprites.length.toLocaleString()
          }}</span>
        </div>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="flex border-b border-gray-200 bg-white">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors"
        :class="
          activeTab === tab.id
            ? 'border-blue-500 text-blue-600 bg-blue-50'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        "
      >
        {{ tab.name }} ({{ tab.count }})
      </button>
    </div>

    <!-- Search -->
    <div class="p-3 border-b border-gray-200 bg-white">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by ID or name..."
          class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <span class="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
      </div>
    </div>

    <!-- Object List -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-2 space-y-1">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          @click="selectItem(item)"
          class="p-3 rounded-lg cursor-pointer transition-colors border"
          :class="
            selectedItem?.id === item.id
              ? 'bg-blue-100 border-blue-300'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          "
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-900"
                  >ID: {{ item.id }}</span
                >
                <span
                  class="text-xs px-2 py-1 rounded"
                  :class="getCategoryBadgeClass(item.category)"
                >
                  {{ item.category }}
                </span>
              </div>
              <div class="mt-1 text-xs text-gray-600">
                Size: {{ item.width }}x{{ item.height }}
                <span v-if="item.layers && item.layers > 1"
                  >x{{ item.layers }}</span
                >
                <span v-if="item.frames && item.frames > 1">
                  | {{ item.frames }} frames</span
                >
              </div>
              <!-- Properties -->
              <div
                v-if="getItemProperties(item).length > 0"
                class="mt-1 flex flex-wrap gap-1"
              >
                <span
                  v-for="prop in getItemProperties(item).slice(0, 3)"
                  :key="prop"
                  class="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  {{ prop }}
                </span>
                <span
                  v-if="getItemProperties(item).length > 3"
                  class="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  +{{ getItemProperties(item).length - 3 }}
                </span>
              </div>
            </div>
            <div class="ml-2 w-8 h-8 bg-gray-100 rounded border">
              <!-- Sprite preview placeholder -->
              <div
                class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded"
              ></div>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-if="!projectState.isLoaded"
          class="p-4 text-center text-gray-500"
        >
          <div class="text-sm">No project loaded</div>
          <div class="text-xs mt-1">Use "Open Folder" to load Tibia files</div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredItems.length === 0"
          class="p-4 text-center text-gray-500"
        >
          <div class="text-sm" v-if="searchQuery">
            No items match your search
          </div>
          <div class="text-sm" v-else>No {{ activeTab }} loaded</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThingType } from "~/types/tibia";
import { ThingCategory } from "~/types/tibia";

// Emits
const emit = defineEmits<{
  "item-selected": [item: ThingType];
}>();

const {
  projectState,
  getItems,
  getOutfits,
  getEffects,
  getMissiles,
  getSprites,
} = useTibiaFiles();

const activeTab = ref("items");
const searchQuery = ref("");
const selectedItem = ref<ThingType | null>(null);

const tabs = computed(() => [
  { id: "items", name: "Items", count: getItems.value.length },
  { id: "outfits", name: "Outfits", count: getOutfits.value.length },
  { id: "effects", name: "Effects", count: getEffects.value.length },
  { id: "missiles", name: "Missiles", count: getMissiles.value.length },
]);

const currentItems = computed(() => {
  switch (activeTab.value) {
    case "items":
      return getItems.value;
    case "outfits":
      return getOutfits.value;
    case "effects":
      return getEffects.value;
    case "missiles":
      return getMissiles.value;
    default:
      return [];
  }
});

const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return currentItems.value.slice(0, 500); // Limit for performance
  }

  const query = searchQuery.value.toLowerCase();
  return currentItems.value
    .filter((item) => {
      return (
        item.id.toString().includes(query) ||
        (item.marketName && item.marketName.toLowerCase().includes(query))
      );
    })
    .slice(0, 100); // Limit search results
});

const selectItem = (item: ThingType) => {
  selectedItem.value = item;
  emit("item-selected", item);
  console.log("Selected item:", item);
};

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

const getItemProperties = (item: ThingType): string[] => {
  const props: string[] = [];

  if (item.isGround) props.push("Ground");
  if (item.isContainer) props.push("Container");
  if (item.stackable) props.push("Stackable");
  if (item.pickupable) props.push("Pickupable");
  if (item.hasLight) props.push("Light");
  if (item.isMarketItem) props.push("Marketable");
  if (item.writable) props.push("Writable");
  if (item.isFluidContainer) props.push("Fluid Container");
  if (item.hasOffset) props.push("Offset");
  if (item.rotatable) props.push("Rotatable");
  if (item.hangable) props.push("Hangable");
  if (item.frames && item.frames > 1) props.push("Animated");

  return props;
};
</script>
