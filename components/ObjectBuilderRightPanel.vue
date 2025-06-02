<template>
  <div class="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
    <!-- Sprites Header -->
    <div class="p-4 border-b border-gray-700">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-300">Sprites</h3>
        <UButton
          @click="importSprites"
          variant="outline"
          size="xs"
          icon="heroicons:plus"
          :disabled="!projectState.isLoaded"
        >
          Import
        </UButton>
      </div>

      <!-- Sprite Info -->
      <div class="space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-400">Total:</span>
          <span>{{ projectState.sprites.length }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Selected:</span>
          <span>{{ selectedSprite?.id || "None" }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">SPR Loaded:</span>
          <span>{{ projectState.loadedFiles.spr ? "Yes" : "No" }}</span>
        </div>
      </div>
    </div>

    <!-- Sprite Grid -->
    <div class="flex-1 overflow-y-auto p-4">
      <div
        v-if="projectState.sprites.length > 0"
        class="grid grid-cols-4 gap-2"
      >
        <div
          v-for="sprite in projectState.sprites"
          :key="sprite.id"
          @click="selectSprite(sprite)"
          :class="[
            'relative aspect-square bg-gray-700 border-2 rounded cursor-pointer hover:border-gray-500 transition-colors',
            selectedSprite?.id === sprite.id
              ? 'border-blue-500'
              : 'border-gray-600',
          ]"
        >
          <!-- Sprite Thumbnail -->
          <div class="w-full h-full flex items-center justify-center">
            <canvas
              :ref="
                (el) => {
                  if (el) spriteCanvases[sprite.id] = el;
                }
              "
              :width="32"
              :height="32"
              class="max-w-full max-h-full"
            ></canvas>
          </div>

          <!-- Sprite ID -->
          <div
            class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-xs text-center py-1"
          >
            {{ sprite.id }}
          </div>

          <!-- Selection indicator -->
          <div
            v-if="selectedSprite?.id === sprite.id"
            class="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"
          ></div>
        </div>

        <!-- Add new sprite placeholder -->
        <div
          @click="addNewSprite"
          class="aspect-square bg-gray-700 border-2 border-dashed border-gray-600 rounded cursor-pointer hover:border-gray-500 transition-colors flex items-center justify-center"
        >
          <Icon name="heroicons:plus" class="w-6 h-6 text-gray-500" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Icon
          name="heroicons:photo"
          class="w-12 h-12 mx-auto mb-4 text-gray-500"
        />
        <p class="text-sm text-gray-500 mb-2">No sprites loaded</p>
        <p class="text-xs text-gray-600">
          {{
            projectState.isLoaded
              ? "Load an SPR file to see sprites"
              : "Open a project first"
          }}
        </p>
      </div>
    </div>

    <!-- Sprite Properties -->
    <div class="border-t border-gray-700 p-4">
      <h4 class="text-sm font-semibold text-gray-300 mb-3">Properties</h4>

      <div v-if="selectedSprite" class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">Width</label>
            <UInput v-model="selectedSprite.width" size="xs" type="number" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Height</label>
            <UInput v-model="selectedSprite.height" size="xs" type="number" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-gray-400 mb-1">X Offset</label>
            <UInput v-model="selectedSprite.xOffset" size="xs" type="number" />
          </div>
          <div>
            <label class="block text-gray-400 mb-1">Y Offset</label>
            <UInput v-model="selectedSprite.yOffset" size="xs" type="number" />
          </div>
        </div>

        <div class="space-y-2">
          <UCheckbox
            v-model="selectedSprite.hasTransparency"
            label="Has Transparency"
          />
          <UCheckbox v-model="selectedSprite.isCompressed" label="Compressed" />
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2 pt-2">
          <UButton
            @click="exportSprite"
            variant="outline"
            size="xs"
            class="flex-1"
          >
            Export
          </UButton>
          <UButton
            @click="deleteSprite"
            variant="outline"
            size="xs"
            color="red"
            class="flex-1"
          >
            Delete
          </UButton>
        </div>
      </div>

      <div v-else class="text-xs text-gray-500 text-center py-4">
        No sprite selected
      </div>
    </div>
  </div>
</template>

<script setup>
const { projectState, importSpriteSheet } = useTibiaFiles();

const selectedSprite = ref(null);
const spriteCanvases = ref({});

const selectSprite = (sprite) => {
  selectedSprite.value = sprite;
  console.log("Selected sprite:", sprite);
};

const importSprites = async () => {
  try {
    // TODO: Open file dialog for sprite sheet import
    console.log("Importing sprites...");
  } catch (error) {
    console.error("Error importing sprites:", error);
  }
};

const addNewSprite = () => {
  const newId = Math.max(...projectState.sprites.map((s) => s.id), 0) + 1;
  const newSprite = {
    id: newId,
    width: 32,
    height: 32,
    xOffset: 0,
    yOffset: 0,
    hasTransparency: true,
    isCompressed: false,
    data: null,
  };

  projectState.sprites.push(newSprite);
  selectedSprite.value = newSprite;
};

const exportSprite = () => {
  if (!selectedSprite.value) return;
  // TODO: Implement sprite export
  console.log("Exporting sprite:", selectedSprite.value);
};

const deleteSprite = () => {
  if (!selectedSprite.value) return;

  const index = projectState.sprites.findIndex(
    (s) => s.id === selectedSprite.value.id
  );
  if (index > -1) {
    projectState.sprites.splice(index, 1);
    selectedSprite.value = null;
  }
};

// Generate placeholder sprite thumbnails
const generatePlaceholderSprite = (canvas, spriteId) => {
  const ctx = canvas.getContext("2d");

  // Create a simple pattern based on sprite ID
  const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
  const color = colors[spriteId % colors.length];

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 32, 32);

  // Add some pattern
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if ((i + j) % 2) {
        ctx.fillRect(i * 8, j * 8, 8, 8);
      }
    }
  }
};

onMounted(() => {
  // Generate placeholder sprites after component is mounted
  nextTick(() => {
    projectState.sprites.forEach((sprite) => {
      const canvas = spriteCanvases.value[sprite.id];
      if (canvas) {
        generatePlaceholderSprite(canvas, sprite.id);
      }
    });
  });
});

// Watch for new sprites and generate their thumbnails
watch(
  () => projectState.sprites,
  (newList) => {
    nextTick(() => {
      newList.forEach((sprite) => {
        const canvas = spriteCanvases.value[sprite.id];
        if (canvas && !sprite.data) {
          generatePlaceholderSprite(canvas, sprite.id);
        }
      });
    });
  },
  { deep: true }
);

// Reset selection when project changes
watch(
  () => projectState.isLoaded,
  (isLoaded) => {
    if (!isLoaded) {
      selectedSprite.value = null;
    }
  }
);
</script>
