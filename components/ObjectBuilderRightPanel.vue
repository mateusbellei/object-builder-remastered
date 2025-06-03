<template>
  <div class="flex flex-col h-full bg-gray-50 border-l border-gray-200">
    <!-- Sprites Header -->
    <div class="p-4 bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold text-gray-900">Sprites</h2>
        <UBadge :color="projectLoaded ? 'success' : 'neutral'" variant="subtle">
          {{ projectLoaded ? totalSprites.toLocaleString() : "No Data" }}
        </UBadge>
      </div>

      <div v-if="projectLoaded" class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Total Sprites:</span>
          <span class="font-medium">{{ totalSprites.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Page:</span>
          <span class="font-medium"
            >{{ currentSpritePage }} / {{ totalSpritePages }}</span
          >
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Range:</span>
          <span class="font-medium">{{ spriteRangeText }}</span>
        </div>
      </div>
    </div>

    <!-- Sprite Navigation -->
    <div v-if="projectLoaded" class="p-3 bg-white border-b border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <UButton
          @click="goToPreviousSpritePage"
          :disabled="currentSpritePage <= 1"
          size="xs"
          variant="outline"
          icon="i-heroicons-chevron-left"
        >
          Previous
        </UButton>

        <div class="flex space-x-2 items-center">
          <span class="text-xs text-gray-500">Go to:</span>
          <input
            v-model.number="spritePageInput"
            @keyup.enter="goToSpritePage(spritePageInput)"
            type="number"
            :min="1"
            :max="totalSpritePages"
            class="w-20 px-2 py-1 text-xs border border-gray-300 rounded text-center"
            :placeholder="currentSpritePage.toString()"
          />
          <UButton
            @click="goToSpritePage(spritePageInput)"
            size="xs"
            variant="outline"
          >
            Go
          </UButton>
        </div>

        <UButton
          @click="goToNextSpritePage"
          :disabled="currentSpritePage >= totalSpritePages"
          size="xs"
          variant="outline"
          icon="i-heroicons-chevron-right"
          trailing
        >
          Next
        </UButton>
      </div>

      <!-- Quick Jump Buttons -->
      <div class="flex space-x-1 justify-center">
        <UButton
          @click="goToSpritePage(1)"
          size="xs"
          variant="ghost"
          :disabled="currentSpritePage === 1"
        >
          First
        </UButton>
        <UButton
          @click="goToSpritePage(Math.max(1, currentSpritePage - 10))"
          size="xs"
          variant="ghost"
        >
          -10
        </UButton>
        <UButton
          @click="
            goToSpritePage(Math.min(totalSpritePages, currentSpritePage + 10))
          "
          size="xs"
          variant="ghost"
        >
          +10
        </UButton>
        <UButton
          @click="goToSpritePage(totalSpritePages)"
          size="xs"
          variant="ghost"
          :disabled="currentSpritePage === totalSpritePages"
        >
          Last
        </UButton>
      </div>
    </div>

    <!-- Sprite Grid -->
    <div v-if="projectLoaded" class="flex-1 overflow-y-auto p-3">
      <div class="grid grid-cols-10 gap-1">
        <div
          v-for="sprite in paginatedSprites"
          :key="sprite.id"
          @click="selectSprite(sprite)"
          :class="[
            'relative aspect-square border rounded cursor-pointer transition-all hover:shadow-sm',
            selectedSpriteId === sprite.id
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300',
          ]"
          :title="`Sprite ID: ${sprite.id}`"
        >
          <!-- Sprite Image -->
          <div class="absolute inset-0.5 bg-gray-100 rounded overflow-hidden">
            <div v-if="getSpriteImageData(sprite.id)" class="w-full h-full">
              <img
                :src="getSpriteImageData(sprite.id) || undefined"
                :alt="`Sprite ${sprite.id}`"
                class="w-full h-full object-contain pixelated"
              />
            </div>
            <div
              v-else
              class="w-full h-full bg-gray-200 flex items-center justify-center"
            >
              <span class="text-xs text-gray-400">{{ sprite.id }}</span>
            </div>
          </div>

          <!-- Sprite ID overlay -->
          <div
            class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 text-center"
          >
            {{ sprite.id }}
          </div>

          <!-- Empty sprite indicator -->
          <div v-if="sprite.isEmpty" class="absolute top-0 right-0">
            <div class="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="paginatedSprites.length === 0" class="text-center py-8">
        <div class="text-gray-400 text-sm">No sprites found</div>
      </div>
    </div>

    <!-- Selected Sprite Info -->
    <div
      v-if="projectLoaded && selectedSprite"
      class="p-4 bg-white border-t border-gray-200"
    >
      <h3 class="text-sm font-medium text-gray-900 mb-2">Sprite Info</h3>
      <div class="space-y-1 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-600">ID:</span>
          <span class="font-medium">{{ selectedSprite.id }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Size:</span>
          <span class="font-medium"
            >{{ selectedSprite.width }}x{{ selectedSprite.height }}</span
          >
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Transparent:</span>
          <span class="font-medium">{{
            selectedSprite.transparent ? "Yes" : "No"
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Empty:</span>
          <span class="font-medium">{{
            selectedSprite.isEmpty ? "Yes" : "No"
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Data Size:</span>
          <span class="font-medium"
            >{{ selectedSprite.compressedPixels?.length || 0 }} bytes</span
          >
        </div>
      </div>
    </div>

    <!-- No Project State -->
    <div v-else class="flex-1 flex items-center justify-center p-4">
      <div class="text-center text-gray-500">
        <div class="text-lg font-medium mb-2">No Sprites Loaded</div>
        <div class="text-sm">Load SPR file to browse sprites</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";

const {
  // Project state
  projectState,

  // Sprite data
  paginatedSprites,
  currentSpritePage,
  totalSpritePages,
  totalSprites,
  goToSpritePage,
  getSpriteImageData,
} = useTibiaFiles();

// Selected sprite
const selectedSpriteId = ref<number | null>(null);
const spritePageInput = ref(1);

// Computed properties
const projectLoaded = computed(() => projectState.isLoaded);

const selectedSprite = computed(() => {
  if (!selectedSpriteId.value || !projectState.sprFile?.sprites) return null;
  return (
    projectState.sprFile.sprites.find((s) => s.id === selectedSpriteId.value) ||
    null
  );
});

const spriteRangeText = computed(() => {
  if (!projectLoaded.value || totalSprites.value === 0) return "N/A";

  const itemsPerPage = 100;
  const start = (currentSpritePage.value - 1) * itemsPerPage + 1;
  const end = Math.min(
    currentSpritePage.value * itemsPerPage,
    totalSprites.value
  );
  return `${start}-${end}`;
});

// Navigation functions
const goToPreviousSpritePage = () => {
  if (currentSpritePage.value > 1) {
    goToSpritePage(currentSpritePage.value - 1);
  }
};

const goToNextSpritePage = () => {
  if (currentSpritePage.value < totalSpritePages.value) {
    goToSpritePage(currentSpritePage.value + 1);
  }
};

// Sprite selection
const selectSprite = (sprite: any) => {
  selectedSpriteId.value = sprite.id;
  console.log(`🎨 Selected sprite ${sprite.id}:`, sprite);
};

// Update page input when current page changes
watch(
  () => currentSpritePage.value,
  (newPage) => {
    spritePageInput.value = newPage;
  }
);

// CSS for pixelated sprites - only on client side
onMounted(() => {
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
</script>
