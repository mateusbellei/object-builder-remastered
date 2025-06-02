<template>
  <div class="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
    <!-- Info Section -->
    <div class="p-4 border-b border-gray-700">
      <h3 class="text-sm font-semibold text-gray-300 mb-3">Project Info</h3>
      <div v-if="projectState.isLoaded" class="space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-400">Version:</span>
          <span>{{ projectState.protocol }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Sprite Dimension:</span>
          <span>32x32</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Dat:</span>
          <span>{{
            projectState.datFile?.signature?.toString(16) || "Not loaded"
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Items:</span>
          <span>{{ projectState.items.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Outfits:</span>
          <span>{{ projectState.outfits.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Effects:</span>
          <span>{{ projectState.effects.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Missiles:</span>
          <span>{{ projectState.missiles.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Spr:</span>
          <span>{{ projectState.sprites.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Extended:</span>
          <span>{{
            protocols[projectState.protocol]?.hasExtended ? "Yes" : "No"
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Transparency:</span>
          <span>Yes</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Frame Groups:</span>
          <span>{{
            protocols[projectState.protocol]?.hasFrameGroups ? "Yes" : "No"
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Improv. Anim.:</span>
          <span>Yes</span>
        </div>
      </div>
      <div v-else class="text-xs text-gray-500 text-center py-4">
        No project loaded. Click "Open" to load .dat/.spr files.
      </div>
    </div>

    <!-- Object Type Selector -->
    <div class="p-4 border-b border-gray-700">
      <USelect
        v-model="selectedObjectType"
        :options="objectTypes"
        size="sm"
        class="w-full"
        :disabled="!projectState.isLoaded"
      />
    </div>

    <!-- Object List -->
    <div class="flex-1 overflow-hidden">
      <div class="p-4">
        <h3 class="text-sm font-semibold text-gray-300 mb-3">
          {{ selectedObjectType.label }}
        </h3>
        <div
          v-if="currentObjectList.length > 0"
          class="space-y-1 max-h-96 overflow-y-auto"
        >
          <div
            v-for="item in currentObjectList"
            :key="item.id"
            @click="selectObject(item)"
            :class="[
              'flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-700 transition-colors',
              selectedObject?.id === item.id ? 'bg-blue-600' : '',
            ]"
          >
            <div
              class="w-8 h-8 bg-gray-600 rounded flex items-center justify-center"
            >
              <span class="text-xs">{{ item.id }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm">{{ item.id }}</div>
              <div class="text-xs text-gray-400 truncate">
                {{ item.name || "Unnamed" }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-xs text-gray-500 text-center py-8">
          <Icon
            name="heroicons:folder-open"
            class="w-8 h-8 mx-auto mb-2 opacity-50"
          />
          <p>
            {{
              projectState.isLoaded
                ? "No objects found"
                : "Load a project to see objects"
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { projectState, protocols } = useTibiaFiles();

const selectedObjectType = ref({ label: "Outfit", value: "outfit" });
const selectedObject = ref(null);

const objectTypes = [
  { label: "Outfit", value: "outfit" },
  { label: "Item", value: "item" },
  { label: "Effect", value: "effect" },
  { label: "Missile", value: "missile" },
];

// Computed property to get the current object list based on selected type
const currentObjectList = computed(() => {
  switch (selectedObjectType.value.value) {
    case "outfit":
      return projectState.outfits;
    case "item":
      return projectState.items;
    case "effect":
      return projectState.effects;
    case "missile":
      return projectState.missiles;
    default:
      return [];
  }
});

const selectObject = (object) => {
  selectedObject.value = object;

  // Emit event for main canvas to listen
  if (process.client) {
    window.dispatchEvent(
      new CustomEvent("object-selected", { detail: object })
    );
  }

  console.log("Selected object:", object);
};

// Watch for object type changes
watch(selectedObjectType, (newType) => {
  selectedObject.value = null; // Clear selection when changing type
  console.log("Object type changed to:", newType);
});

// Watch for project changes to reset selection
watch(
  () => projectState.isLoaded,
  (isLoaded) => {
    if (!isLoaded) {
      selectedObject.value = null;
    }
  }
);
</script>
