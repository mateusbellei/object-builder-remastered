<template>
  <div class="flex flex-col h-full bg-gray-50 border-r border-gray-200">
    <!-- Project Info Header -->
    <div class="p-4 bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold text-gray-900">Project</h2>
        <UBadge :color="projectLoaded ? 'success' : 'neutral'" variant="subtle">
          {{ projectLoaded ? "Loaded" : "No Project" }}
        </UBadge>
      </div>

      <div v-if="projectLoaded" class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Protocol:</span>
          <span class="font-medium">{{
            currentProtocol?.version || "Unknown"
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Client:</span>
          <span class="font-medium">{{
            currentProtocol?.clientVersionMin || "Unknown"
          }}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-3">
          <div class="text-center p-2 bg-blue-50 rounded">
            <div class="text-lg font-bold text-blue-600">{{ totalItems }}</div>
            <div class="text-xs text-blue-500">Items</div>
          </div>
          <div class="text-center p-2 bg-green-50 rounded">
            <div class="text-lg font-bold text-green-600">
              {{ totalOutfits }}
            </div>
            <div class="text-xs text-green-500">Outfits</div>
          </div>
          <div class="text-center p-2 bg-purple-50 rounded">
            <div class="text-lg font-bold text-purple-600">
              {{ totalEffects }}
            </div>
            <div class="text-xs text-purple-500">Effects</div>
          </div>
          <div class="text-center p-2 bg-orange-50 rounded">
            <div class="text-lg font-bold text-orange-600">
              {{ totalMissiles }}
            </div>
            <div class="text-xs text-orange-500">Missiles</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Object Type Tabs -->
    <div v-if="projectLoaded" class="bg-white border-b border-gray-200">
      <div class="flex">
        <button
          v-for="tab in objectTabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          <div class="flex items-center justify-center space-x-1">
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Object List -->
    <div v-if="projectLoaded" class="flex-1 flex flex-col overflow-hidden">
      <!-- List Header with pagination -->
      <div class="p-3 bg-white border-b border-gray-200">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-gray-900">
            {{ currentTabData.label }}
            <span class="text-gray-500">({{ currentTabData.total }})</span>
          </h3>
          <div class="text-xs text-gray-500">
            Page {{ currentTabData.currentPage }} of
            {{ currentTabData.totalPages }}
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center justify-between">
          <UButton
            @click="goToPreviousPage"
            :disabled="currentTabData.currentPage <= 1"
            size="xs"
            variant="outline"
            icon="i-heroicons-chevron-left"
          >
            Previous
          </UButton>

          <div class="flex space-x-1">
            <input
              v-model.number="pageInput"
              @keyup.enter="goToPage(pageInput)"
              type="number"
              :min="1"
              :max="currentTabData.totalPages"
              class="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center"
              :placeholder="currentTabData.currentPage.toString()"
            />
            <UButton @click="goToPage(pageInput)" size="xs" variant="outline">
              Go
            </UButton>
          </div>

          <UButton
            @click="goToNextPage"
            :disabled="currentTabData.currentPage >= currentTabData.totalPages"
            size="xs"
            variant="outline"
            icon="i-heroicons-chevron-right"
            trailing
          >
            Next
          </UButton>
        </div>
      </div>

      <!-- Object Grid -->
      <div class="flex-1 overflow-y-auto p-3">
        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="object in currentTabData.items"
            :key="`${activeTab}-${object.id}`"
            @click="selectObject(object, activeTab)"
            :class="[
              'relative aspect-square border-2 rounded-lg cursor-pointer transition-all hover:shadow-md',
              selectedObject?.id === object.id &&
              selectedObjectType === activeTab
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300',
            ]"
          >
            <!-- Object Preview -->
            <div
              class="absolute inset-1 bg-gray-100 rounded flex items-center justify-center"
            >
              <div v-if="getObjectPreview(object)" class="w-8 h-8">
                <img
                  :src="getObjectPreview(object) || undefined"
                  :alt="`${activeTab} ${object.id}`"
                  class="w-full h-full object-contain pixelated"
                />
              </div>
              <div
                v-else
                class="w-8 h-8 bg-gray-300 rounded flex items-center justify-center"
              >
                <span class="text-xs text-gray-500">{{ object.id }}</span>
              </div>
            </div>

            <!-- Object ID -->
            <div
              class="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5 rounded-b"
            >
              {{ object.id }}
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="currentTabData.items.length === 0" class="text-center py-8">
          <div class="text-gray-400 text-sm">No {{ activeTab }}s found</div>
        </div>
      </div>
    </div>

    <!-- No Project State -->
    <div v-else class="flex-1 flex items-center justify-center p-4">
      <div class="text-center text-gray-500">
        <div class="text-lg font-medium mb-2">No Project Loaded</div>
        <div class="text-sm">Load DAT and SPR files to browse objects</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";

const {
  // Project state
  projectState,
  protocols,

  // Data counts
  totalItems,
  totalOutfits,
  totalEffects,
  totalMissiles,

  // Paginated data
  paginatedItems,
  paginatedOutfits,
  paginatedEffects,
  paginatedMissiles,

  // Current pages
  currentItemPage,
  currentOutfitPage,
  currentEffectPage,
  currentMissilePage,

  // Total pages
  totalItemPages,
  totalOutfitPages,
  totalEffectPages,
  totalMissilePages,

  // Navigation
  goToItemPage,
  goToOutfitPage,
  goToEffectPage,
  goToMissilePage,

  // Selection
  selectedObject,
  selectedObjectType,
  selectObject,
  getSpriteImageData,
} = useTibiaFiles();

// Active tab
const activeTab = ref<"item" | "outfit" | "effect" | "missile">("item");

// Page input for quick navigation
const pageInput = ref(1);

// Object type tabs configuration
const objectTabs = [
  { key: "item", label: "Items", icon: "i-heroicons-cube" },
  { key: "outfit", label: "Outfits", icon: "i-heroicons-user" },
  { key: "effect", label: "Effects", icon: "i-heroicons-sparkles" },
  { key: "missile", label: "Missiles", icon: "i-heroicons-arrow-right" },
] as const;

// Computed properties
const projectLoaded = computed(() => projectState.isLoaded);
const currentProtocol = computed(
  () => protocols[projectState.protocol] || null
);

// Current tab data computed
const currentTabData = computed(() => {
  switch (activeTab.value) {
    case "item":
      return {
        label: "Items",
        items: paginatedItems.value,
        currentPage: currentItemPage.value,
        totalPages: totalItemPages.value,
        total: totalItems.value,
      };
    case "outfit":
      return {
        label: "Outfits",
        items: paginatedOutfits.value,
        currentPage: currentOutfitPage.value,
        totalPages: totalOutfitPages.value,
        total: totalOutfits.value,
      };
    case "effect":
      return {
        label: "Effects",
        items: paginatedEffects.value,
        currentPage: currentEffectPage.value,
        totalPages: totalEffectPages.value,
        total: totalEffects.value,
      };
    case "missile":
      return {
        label: "Missiles",
        items: paginatedMissiles.value,
        currentPage: currentMissilePage.value,
        totalPages: totalMissilePages.value,
        total: totalMissiles.value,
      };
  }
});

// Debug: Log when data changes (moved after currentTabData definition)
watch(
  () => projectState.isLoaded,
  (newVal) => {
    console.log("🔄 Left Panel - Project state changed:", {
      isLoaded: newVal,
      datFile: !!projectState.datFile,
      sprFile: !!projectState.sprFile,
      loadedFiles: projectState.loadedFiles,
      items: projectState.datFile?.items?.length || 0,
      outfits: projectState.datFile?.outfits?.length || 0,
      sprites: projectState.sprFile?.sprites?.length || 0,
    });

    if (newVal) {
      console.log("🔄 Left Panel - Project loaded:", {
        items: totalItems.value,
        outfits: totalOutfits.value,
        effects: totalEffects.value,
        missiles: totalMissiles.value,
      });
    }
  }
);

watch(
  () => currentTabData.value,
  (newData) => {
    console.log(`🔄 Left Panel - Tab data changed for ${activeTab.value}:`, {
      total: newData.total,
      currentPage: newData.currentPage,
      itemsOnPage: newData.items.length,
    });
  }
);

// Additional debug watchers
watch(
  () => projectState.datFile,
  (datFile) => {
    console.log("🔄 Left Panel - DAT file changed:", {
      exists: !!datFile,
      items: datFile?.items?.length || 0,
      outfits: datFile?.outfits?.length || 0,
      effects: datFile?.effects?.length || 0,
      missiles: datFile?.missiles?.length || 0,
    });
  }
);

watch(
  () => projectState.sprFile,
  (sprFile) => {
    console.log("🔄 Left Panel - SPR file changed:", {
      exists: !!sprFile,
      sprites: sprFile?.sprites?.length || 0,
    });
  }
);

// Log computed values changes
watch(projectLoaded, (loaded) => {
  console.log("🔄 Left Panel - projectLoaded computed changed:", loaded);
});

watch(totalItems, (total) => {
  console.log("🔄 Left Panel - totalItems computed changed:", total);
});

// Debug on mount
onMounted(() => {
  console.log("🔄 Left Panel - Component mounted, current state:", {
    projectLoaded: projectLoaded.value,
    isLoaded: projectState.isLoaded,
    datFile: !!projectState.datFile,
    sprFile: !!projectState.sprFile,
    loadedFiles: projectState.loadedFiles,
    items: totalItems.value,
    outfits: totalOutfits.value,
    effects: totalEffects.value,
    missiles: totalMissiles.value,
  });

  if (process.client) {
    const style = document.createElement("style");
    style.textContent = `
      .pixelated {
        image-rendering: -moz-crisp-edges;
        image-rendering: -webkit-crisp-edges;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
      }
    `;
    document.head.appendChild(style);
  }
});

// Navigation functions
const goToPreviousPage = () => {
  const currentPage = currentTabData.value.currentPage;
  if (currentPage > 1) {
    goToCurrentTabPage(currentPage - 1);
  }
};

const goToNextPage = () => {
  const currentPage = currentTabData.value.currentPage;
  const totalPages = currentTabData.value.totalPages;
  if (currentPage < totalPages) {
    goToCurrentTabPage(currentPage + 1);
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= currentTabData.value.totalPages) {
    goToCurrentTabPage(page);
  }
};

const goToCurrentTabPage = (page: number) => {
  switch (activeTab.value) {
    case "item":
      goToItemPage(page);
      break;
    case "outfit":
      goToOutfitPage(page);
      break;
    case "effect":
      goToEffectPage(page);
      break;
    case "missile":
      goToMissilePage(page);
      break;
  }
};

// Get object preview image
const getObjectPreview = (object: any): string | null => {
  if (!object) {
    console.log("🖼️ getObjectPreview: No object provided");
    return null;
  }

  // Log first few objects for debugging
  if (object.id <= 5) {
    console.log(
      `🖼️ getObjectPreview: Processing ${activeTab.value} ${object.id}`,
      {
        spriteIds: object.spriteIds?.slice(0, 3),
        frameGroups: Object.keys(object.frameGroups || {}),
        hasFrameGroups: !!object.frameGroups,
      }
    );
  }

  // Get the first sprite ID from the object
  if (object.spriteIds && object.spriteIds.length > 0) {
    const spriteId = object.spriteIds[0];
    if (spriteId > 0 && spriteId < 1000000) {
      const preview = getSpriteImageData(spriteId);
      if (object.id <= 5) {
        console.log(
          `🖼️ getObjectPreview: Using spriteIds[0]=${spriteId} for ${
            activeTab.value
          } ${object.id}, preview: ${preview ? "found" : "null"}`
        );
      }
      return preview;
    }
  }

  // Try to get from frame groups
  if (object.frameGroups) {
    for (const [groupType, frameGroup] of Object.entries(
      object.frameGroups
    ) as [string, any][]) {
      if (
        frameGroup &&
        frameGroup.spriteIds &&
        frameGroup.spriteIds.length > 0
      ) {
        const spriteId = frameGroup.spriteIds[0];
        if (spriteId > 0 && spriteId < 1000000) {
          const preview = getSpriteImageData(spriteId);
          if (object.id <= 5) {
            console.log(
              `🖼️ getObjectPreview: Using frameGroup[${groupType}].spriteIds[0]=${spriteId} for ${
                activeTab.value
              } ${object.id}, preview: ${preview ? "found" : "null"}`
            );
          }
          return preview;
        }
      }
    }
  }

  if (object.id <= 5) {
    console.log(
      `🖼️ getObjectPreview: No valid sprite found for ${activeTab.value} ${object.id}`
    );
  }

  return null;
};

// Update page input when current page changes
watch(
  () => currentTabData.value.currentPage,
  (newPage) => {
    pageInput.value = newPage;
  }
);
</script>
