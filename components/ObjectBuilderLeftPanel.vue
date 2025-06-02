<template>
  <div class="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
    <!-- Project Info -->
    <div class="border-b border-gray-200 p-4">
      <h3 class="font-semibold text-gray-900 mb-2">Project Info</h3>
      <div class="space-y-1 text-sm text-gray-600">
        <div>Protocol: {{ projectState.protocol }}</div>
        <div>Client Version: {{ projectState.clientVersion }}</div>
        <div class="flex space-x-2">
          <span
            class="px-2 py-1 rounded text-xs"
            :class="
              projectState.loadedFiles.dat
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            "
          >
            DAT {{ projectState.loadedFiles.dat ? "✓" : "✗" }}
          </span>
          <span
            class="px-2 py-1 rounded text-xs"
            :class="
              projectState.loadedFiles.spr
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            "
          >
            SPR {{ projectState.loadedFiles.spr ? "✓" : "✗" }}
          </span>
          <span
            class="px-2 py-1 rounded text-xs"
            :class="
              projectState.loadedFiles.otfi
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            "
          >
            OTFI {{ projectState.loadedFiles.otfi ? "✓" : "✗" }}
          </span>
        </div>
      </div>
    </div>

    <!-- Object Browser -->
    <div class="flex-1 flex flex-col">
      <div class="border-b border-gray-200 p-4">
        <h3 class="font-semibold text-gray-900 mb-2">Object Browser</h3>

        <!-- Category Tabs -->
        <div class="flex space-x-1 mb-2">
          <button
            v-for="category in categories"
            :key="category.key"
            @click="selectedCategory = category.key"
            class="px-3 py-1 text-xs rounded-md"
            :class="
              selectedCategory === category.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
          >
            {{ category.label }} ({{ category.count }})
          </button>
        </div>

        <!-- Search -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search objects..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <!-- Object List -->
      <div class="flex-1 overflow-y-auto p-2">
        <div class="space-y-1">
          <div
            v-for="object in filteredObjects"
            :key="`${selectedCategory}-${object.id}`"
            @click="selectObject(object)"
            class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100"
            :class="
              selectedObject?.id === object.id &&
              selectedObjectCategory === selectedCategory
                ? 'bg-blue-100 border border-blue-300'
                : ''
            "
          >
            <!-- Object Preview (placeholder) -->
            <div
              class="w-8 h-8 bg-gray-200 rounded border mr-3 flex items-center justify-center"
            >
              <span class="text-xs text-gray-500">{{ object.id }}</span>
            </div>

            <!-- Object Info -->
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">
                ID {{ object.id }}
              </div>
              <div class="text-xs text-gray-500 truncate">
                {{ getObjectDescription(object) }}
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="filteredObjects.length === 0"
            class="text-center py-8 text-gray-500"
          >
            <div class="text-sm">No objects found</div>
            <div class="text-xs mt-1">
              {{
                !projectState.isLoaded
                  ? "Load a project to see objects"
                  : "Try adjusting your search"
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThingType, ThingCategory } from "~/types/tibia";
import { ThingCategory as TC } from "~/types/tibia";

const { projectState, getItems, getOutfits, getEffects, getMissiles } =
  useTibiaFiles();

// Component state
const selectedCategory = ref<ThingCategory>(TC.ITEM);
const selectedObject = ref<ThingType | null>(null);
const selectedObjectCategory = ref<ThingCategory>(TC.ITEM);
const searchQuery = ref("");

// Categories configuration
const categories = computed(() => [
  {
    key: TC.ITEM,
    label: "Items",
    count: getItems.value.length,
  },
  {
    key: TC.OUTFIT,
    label: "Outfits",
    count: getOutfits.value.length,
  },
  {
    key: TC.EFFECT,
    label: "Effects",
    count: getEffects.value.length,
  },
  {
    key: TC.MISSILE,
    label: "Missiles",
    count: getMissiles.value.length,
  },
]);

// Get objects for selected category
const currentObjects = computed(() => {
  switch (selectedCategory.value) {
    case TC.ITEM:
      return getItems.value;
    case TC.OUTFIT:
      return getOutfits.value;
    case TC.EFFECT:
      return getEffects.value;
    case TC.MISSILE:
      return getMissiles.value;
    default:
      return [];
  }
});

// Filter objects based on search
const filteredObjects = computed(() => {
  if (!searchQuery.value) {
    return currentObjects.value;
  }

  const query = searchQuery.value.toLowerCase();
  return currentObjects.value.filter((object) => {
    const idMatch = object.id.toString().includes(query);
    const description = getObjectDescription(object).toLowerCase();
    return idMatch || description.includes(query);
  });
});

// Get object description
const getObjectDescription = (object: ThingType): string => {
  const parts: string[] = [];

  // Add property-based descriptions
  if (object.stackable) parts.push("Stackable");
  if (object.isContainer) parts.push("Container");
  if (object.writable) parts.push("Writable");
  if (object.isFluid) parts.push("Fluid");
  if (object.hasLight) parts.push(`Light ${object.lightLevel}`);
  if (object.isMarketItem) parts.push(object.marketName || "Market Item");

  // Add frame group info
  if (object.frameGroups.length > 0) {
    const frameGroup = object.frameGroups[0];
    if (frameGroup.frames > 1) {
      parts.push(`${frameGroup.frames} frames`);
    }
    if (frameGroup.patternX > 1 || frameGroup.patternY > 1) {
      parts.push(`${frameGroup.patternX}x${frameGroup.patternY} patterns`);
    }
  }

  return parts.length > 0 ? parts.join(", ") : "Basic object";
};

// Select object
const selectObject = (object: ThingType) => {
  selectedObject.value = object;
  selectedObjectCategory.value = selectedCategory.value;

  console.log("Selected object:", {
    id: object.id,
    category: selectedCategory.value,
    properties: {
      stackable: object.stackable,
      container: object.isContainer,
      writable: object.writable,
      frameGroups: object.frameGroups.length,
    },
  });
};

// Watch for category changes
watch(selectedCategory, () => {
  selectedObject.value = null;
  searchQuery.value = "";
});
</script>
