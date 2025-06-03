<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Canvas Header -->
    <div class="border-b border-gray-200 p-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {{
              selectedObject
                ? `${selectedObjectType?.toUpperCase()} ${selectedObject.id}`
                : "Canvas"
            }}
          </h2>
          <div v-if="selectedObject" class="text-sm text-gray-600">
            {{ getObjectDescription(selectedObject) }}
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Animation Controls -->
          <div
            v-if="selectedObject && isAnimated"
            class="flex items-center space-x-2"
          >
            <UButton
              @click="toggleAnimation"
              size="xs"
              variant="outline"
              :icon="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'"
            >
              {{ isPlaying ? "Pause" : "Play" }}
            </UButton>

            <div class="text-xs text-gray-500">
              Frame {{ currentFrame + 1 }} / {{ totalFrames }}
            </div>
          </div>

          <!-- Zoom Controls -->
          <div class="flex items-center space-x-1">
            <UButton
              @click="zoomOut"
              size="xs"
              variant="outline"
              icon="i-heroicons-magnifying-glass-minus"
              :disabled="zoomLevel <= 1"
            />
            <span class="text-xs text-gray-500 min-w-12 text-center"
              >{{ Math.round(zoomLevel * 100) }}%</span
            >
            <UButton
              @click="zoomIn"
              size="xs"
              variant="outline"
              icon="i-heroicons-magnifying-glass-plus"
              :disabled="zoomLevel >= 8"
            />
          </div>
        </div>
      </div>

      <!-- Object Info Bar -->
      <div
        v-if="selectedObject"
        class="flex items-center space-x-4 text-xs text-gray-600"
      >
        <span
          >Size: {{ selectedObject.width || 1 }}x{{
            selectedObject.height || 1
          }}</span
        >
        <span v-if="selectedObject.layers && selectedObject.layers > 1"
          >Layers: {{ selectedObject.layers }}</span
        >
        <span v-if="isAnimated">Frames: {{ totalFrames }}</span>
        <span>Sprites: {{ getTotalSprites(selectedObject) }}</span>
        <span v-if="selectedObject.isMarketItem" class="text-blue-600">{{
          selectedObject.marketName
        }}</span>
      </div>
    </div>

    <!-- Canvas Area -->
    <div class="flex-1 overflow-hidden relative">
      <div
        v-if="selectedObject"
        class="h-full flex items-center justify-center bg-gray-50 p-4"
      >
        <!-- Object Preview -->
        <div
          class="relative bg-white border border-gray-200 rounded-lg shadow-sm p-4"
          :style="{ transform: `scale(${zoomLevel})` }"
        >
          <!-- Grid Background -->
          <div class="absolute inset-0 opacity-20 pointer-events-none">
            <svg width="100%" height="100%" class="w-full h-full">
              <defs>
                <pattern
                  id="grid"
                  width="32"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 32 0 L 0 0 0 32"
                    fill="none"
                    stroke="#e5e7eb"
                    stroke-width="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <!-- Object Sprites -->
          <div class="relative">
            <div
              class="grid gap-0"
              :style="{
                gridTemplateColumns: `repeat(${
                  selectedObject.width || 1
                }, 32px)`,
                gridTemplateRows: `repeat(${selectedObject.height || 1}, 32px)`,
              }"
            >
              <div
                v-for="(spriteId, index) in getCurrentFrameSprites()"
                :key="`sprite-${index}`"
                class="w-8 h-8 relative bg-gray-100 border border-gray-200"
                :title="`Sprite ID: ${spriteId}`"
              >
                <img
                  v-if="spriteId > 0 && getSpriteImageData(spriteId)"
                  :src="getSpriteImageData(spriteId) || undefined"
                  :alt="`Sprite ${spriteId}`"
                  class="w-full h-full object-contain pixelated"
                />
                <div
                  v-else
                  class="w-full h-full bg-gray-200 flex items-center justify-center"
                >
                  <span class="text-xs text-gray-400">{{
                    spriteId || "E"
                  }}</span>
                </div>

                <!-- Sprite ID overlay on hover -->
                <div
                  class="absolute inset-0 bg-black/70 text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                >
                  {{ spriteId || "Empty" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Selection State -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center text-gray-500">
          <div
            class="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center"
          >
            <span class="text-2xl">🎨</span>
          </div>
          <div class="text-lg font-medium mb-2">No Object Selected</div>
          <div class="text-sm">
            Select an item, outfit, effect, or missile from the left panel
          </div>
        </div>
      </div>
    </div>

    <!-- Properties Panel (Bottom) -->
    <div v-if="selectedObject" class="border-t border-gray-200 bg-gray-50 p-4">
      <div class="grid grid-cols-3 gap-6">
        <!-- Basic Properties -->
        <div>
          <h3 class="text-sm font-medium text-gray-900 mb-2">
            Basic Properties
          </h3>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">ID:</span>
              <span class="font-medium">{{ selectedObject.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Category:</span>
              <span class="font-medium capitalize">{{
                selectedObjectType
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Size:</span>
              <span class="font-medium"
                >{{ selectedObject.width || 1 }}x{{
                  selectedObject.height || 1
                }}</span
              >
            </div>
            <div
              v-if="selectedObject.layers && selectedObject.layers > 1"
              class="flex justify-between"
            >
              <span class="text-gray-600">Layers:</span>
              <span class="font-medium">{{ selectedObject.layers }}</span>
            </div>
          </div>
        </div>

        <!-- Animation Properties -->
        <div v-if="isAnimated">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Animation</h3>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">Frames:</span>
              <span class="font-medium">{{ totalFrames }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Current:</span>
              <span class="font-medium">{{ currentFrame + 1 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Speed:</span>
              <span class="font-medium">{{ animationSpeed }}ms</span>
            </div>
          </div>
        </div>

        <!-- Special Properties -->
        <div>
          <h3 class="text-sm font-medium text-gray-900 mb-2">
            Special Properties
          </h3>
          <div class="space-y-1 text-xs">
            <div
              v-if="selectedObject.isGround"
              class="flex items-center space-x-1"
            >
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Ground (Speed: {{ selectedObject.groundSpeed || 0 }})</span>
            </div>
            <div
              v-if="selectedObject.isContainer"
              class="flex items-center space-x-1"
            >
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Container</span>
            </div>
            <div
              v-if="selectedObject.stackable"
              class="flex items-center space-x-1"
            >
              <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Stackable</span>
            </div>
            <div
              v-if="selectedObject.pickupable"
              class="flex items-center space-x-1"
            >
              <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Pickupable</span>
            </div>
            <div
              v-if="selectedObject.hasLight"
              class="flex items-center space-x-1"
            >
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span
                >Light ({{ selectedObject.lightLevel }}/{{
                  selectedObject.lightColor
                }})</span
              >
            </div>
            <div
              v-if="selectedObject.isMarketItem"
              class="flex items-center space-x-1"
            >
              <div class="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>Marketable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useTibiaFiles } from "../composables/useTibiaFiles";

const { selectedObject, selectedObjectType, getSpriteImageData } =
  useTibiaFiles();

// Canvas state
const zoomLevel = ref(2);
const currentFrame = ref(0);
const isPlaying = ref(false);
const animationSpeed = ref(500); // ms per frame

let animationInterval: NodeJS.Timeout | null = null;

// Computed properties
const isAnimated = computed(() => {
  return (
    selectedObject.value &&
    selectedObject.value.frames &&
    selectedObject.value.frames > 1
  );
});

const totalFrames = computed(() => {
  return selectedObject.value?.frames || 1;
});

// Get description for the selected object
const getObjectDescription = (object: any): string => {
  const parts = [];

  if (object.width && object.height) {
    parts.push(`${object.width}x${object.height}`);
  }

  if (object.layers && object.layers > 1) {
    parts.push(`${object.layers} layers`);
  }

  if (object.frames && object.frames > 1) {
    parts.push(`${object.frames} frames`);
  }

  if (object.isMarketItem && object.marketName) {
    parts.push(`"${object.marketName}"`);
  }

  return parts.join(" • ");
};

// Get total number of sprites for the object
const getTotalSprites = (object: any): number => {
  if (object.spriteIds && object.spriteIds.length > 0) {
    return object.spriteIds.length;
  }

  // Count from frame groups
  let total = 0;
  if (object.frameGroups) {
    for (const frameGroup of Object.values(object.frameGroups) as any[]) {
      if (frameGroup.spriteIds) {
        total += frameGroup.spriteIds.length;
      }
    }
  }

  return total;
};

// Get sprites for the current frame
const getCurrentFrameSprites = (): number[] => {
  if (!selectedObject.value) return [];

  const obj = selectedObject.value;
  const width = obj.width || 1;
  const height = obj.height || 1;
  const layers = obj.layers || 1;
  const spritesPerFrame = width * height * layers;

  // Get sprites from the first available source
  let allSprites: number[] = [];

  if (obj.spriteIds && obj.spriteIds.length > 0) {
    allSprites = obj.spriteIds;
  } else if (obj.frameGroups) {
    // Get sprites from the first frame group
    const frameGroup = Object.values(obj.frameGroups)[0] as any;
    if (frameGroup && frameGroup.spriteIds) {
      allSprites = frameGroup.spriteIds;
    }
  }

  // Extract sprites for current frame
  const startIndex = currentFrame.value * spritesPerFrame;
  const endIndex = startIndex + spritesPerFrame;

  return allSprites.slice(startIndex, endIndex);
};

// Zoom functions
const zoomIn = () => {
  if (zoomLevel.value < 8) {
    zoomLevel.value = Math.min(8, zoomLevel.value * 1.5);
  }
};

const zoomOut = () => {
  if (zoomLevel.value > 1) {
    zoomLevel.value = Math.max(1, zoomLevel.value / 1.5);
  }
};

// Animation functions
const toggleAnimation = () => {
  isPlaying.value = !isPlaying.value;
};

const nextFrame = () => {
  if (totalFrames.value > 1) {
    currentFrame.value = (currentFrame.value + 1) % totalFrames.value;
  }
};

// Watch for animation state changes
watch(isPlaying, (playing) => {
  if (playing && isAnimated.value) {
    animationInterval = setInterval(nextFrame, animationSpeed.value);
  } else {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
    }
  }
});

// Reset animation when object changes
watch(selectedObject, () => {
  currentFrame.value = 0;
  isPlaying.value = false;
  zoomLevel.value = 2;
});

// Cleanup on unmount
onUnmounted(() => {
  if (animationInterval) {
    clearInterval(animationInterval);
  }
});

// CSS for pixelated sprites
onMounted(() => {
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
});
</script>
