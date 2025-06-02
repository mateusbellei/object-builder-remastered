<template>
  <div class="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
    <!-- Header -->
    <div class="border-b border-gray-200 p-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-gray-900">Sprite Manager</h3>
        <div class="flex space-x-1">
          <button
            @click="importSprites"
            class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            :disabled="!projectState.isLoaded"
          >
            Import
          </button>
          <button
            @click="addNewSprite"
            class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            :disabled="!projectState.isLoaded"
          >
            Add
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="text-sm text-gray-600">
        <div>Total Sprites: {{ sprites.length }}</div>
        <div v-if="selectedSprite">Selected: {{ selectedSprite.id }}</div>
      </div>
    </div>

    <!-- Sprite Grid -->
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="sprites.length > 0" class="grid grid-cols-4 gap-2">
        <div
          v-for="sprite in sprites.slice(0, 100)"
          :key="sprite.id"
          @click="selectSprite(sprite)"
          class="relative cursor-pointer border rounded hover:border-blue-400 transition-colors group"
          :class="
            selectedSprite?.id === sprite.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200'
          "
        >
          <!-- Sprite Preview -->
          <div class="w-16 h-16 bg-gray-100 flex items-center justify-center">
            <canvas
              :ref="(el: any) => { if (el) spriteCanvases[sprite.id] = el as HTMLCanvasElement }"
              width="32"
              height="32"
              class="w-8 h-8 pixelated"
            />
          </div>

          <!-- Sprite Info -->
          <div class="p-1 text-xs text-center">
            <div class="font-medium">{{ sprite.id }}</div>
            <div class="text-gray-500">
              {{ sprite.width }}x{{ sprite.height }}
            </div>
          </div>

          <!-- Hover Actions -->
          <div
            class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              @click.stop="exportSprite(sprite)"
              class="text-white text-xs px-1 py-0.5 bg-blue-500 rounded mr-1 hover:bg-blue-600"
            >
              Export
            </button>
            <button
              @click.stop="deleteSprite(sprite)"
              class="text-white text-xs px-1 py-0.5 bg-red-500 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div
          class="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center"
        >
          <span class="text-gray-500 text-xl">🖼️</span>
        </div>
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
    <div class="border-t border-gray-200 p-4">
      <h4 class="text-sm font-semibold text-gray-900 mb-3">Properties</h4>

      <div v-if="selectedSprite" class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-gray-600 mb-1">Width</label>
            <input
              v-model.number="selectedSprite.width"
              type="number"
              class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
          <div>
            <label class="block text-gray-600 mb-1">Height</label>
            <input
              v-model.number="selectedSprite.height"
              type="number"
              class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="flex items-center space-x-2">
            <input
              v-model="selectedSprite.transparent"
              type="checkbox"
              class="text-blue-500"
            />
            <span class="text-gray-600">Has Transparency</span>
          </label>
          <label class="flex items-center space-x-2">
            <input
              v-model="selectedSprite.isEmpty"
              type="checkbox"
              class="text-blue-500"
            />
            <span class="text-gray-600">Is Empty</span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2 pt-2">
          <button
            @click="exportSprite(selectedSprite)"
            class="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            Export
          </button>
          <button
            @click="deleteSprite(selectedSprite)"
            class="flex-1 px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div v-else class="text-xs text-gray-500 text-center py-4">
        No sprite selected
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TibiaSprite } from "~/types/tibia";

const { projectState, getSprites, importSpriteSheet } = useTibiaFiles();

const selectedSprite = ref<TibiaSprite | null>(null);
const spriteCanvases = ref<Record<number, HTMLCanvasElement>>({});

// Get sprites from the new system
const sprites = computed(() => getSprites.value);

const selectSprite = (sprite: TibiaSprite) => {
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
  const newId = Math.max(...sprites.value.map((s) => s.id), 0) + 1;
  const newSprite: TibiaSprite = {
    id: newId,
    width: 32,
    height: 32,
    transparent: true,
    compressedPixels: new Uint8Array(0),
    pixelData: new Uint8Array(32 * 32 * 4),
    bitmapData: null,
    isEmpty: true,
  };

  // Note: This would need to be implemented in the composable
  // For now, just select null to avoid errors
  selectedSprite.value = null;
  console.log("Would add new sprite:", newSprite);
};

const exportSprite = (sprite: TibiaSprite) => {
  if (!sprite) return;
  // TODO: Implement sprite export
  console.log("Exporting sprite:", sprite);
};

const deleteSprite = (sprite: TibiaSprite) => {
  if (!sprite) return;

  // TODO: Implement sprite deletion in composable
  console.log("Would delete sprite:", sprite);
  selectedSprite.value = null;
};

// Generate placeholder sprite thumbnails
const generatePlaceholderSprite = (
  canvas: HTMLCanvasElement,
  spriteId: number
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

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
    sprites.value.forEach((sprite) => {
      const canvas = spriteCanvases.value[sprite.id];
      if (canvas) {
        generatePlaceholderSprite(canvas, sprite.id);
      }
    });
  });
});

// Watch for new sprites and generate their thumbnails
watch(
  sprites,
  (newList) => {
    nextTick(() => {
      newList.forEach((sprite) => {
        const canvas = spriteCanvases.value[sprite.id];
        if (canvas && sprite.isEmpty) {
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

<style scoped>
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
</style>
