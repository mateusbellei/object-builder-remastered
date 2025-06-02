<template>
  <div class="flex-1 bg-gray-900 flex flex-col">
    <!-- Canvas Header with Controls -->
    <div class="bg-gray-800 border-b border-gray-700 p-4 space-y-3">
      <!-- Animation Controls -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h3 class="text-sm font-semibold">Animation</h3>
          <div class="flex items-center space-x-2">
            <UButton
              @click="toggleAnimation"
              :variant="isAnimating ? 'solid' : 'outline'"
              size="xs"
              :icon="isAnimating ? 'heroicons:pause' : 'heroicons:play'"
              :disabled="!selectedObject"
            >
              {{ isAnimating ? "Pause" : "Play" }}
            </UButton>
            <span class="text-xs text-gray-400"
              >{{ currentFrame }}/{{
                selectedObject?.frames || totalFrames
              }}</span
            >
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <span class="text-xs text-gray-400">Group:</span>
          <USelect
            v-model="selectedGroup"
            :options="groupOptions"
            size="xs"
            class="w-24"
            :disabled="!selectedObject"
          />
        </div>
      </div>

      <!-- Properties -->
      <div class="grid grid-cols-4 gap-4 text-xs">
        <div class="space-y-2">
          <label class="block text-gray-400">Width</label>
          <UInput
            v-model="objectProperties.width"
            size="xs"
            type="number"
            :disabled="!selectedObject"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-gray-400">Height</label>
          <UInput
            v-model="objectProperties.height"
            size="xs"
            type="number"
            :disabled="!selectedObject"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-gray-400">Crop Size</label>
          <UInput
            v-model="objectProperties.cropSize"
            size="xs"
            type="number"
            :disabled="!selectedObject"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-gray-400">Layers</label>
          <UInput
            v-model="objectProperties.layers"
            size="xs"
            type="number"
            :disabled="!selectedObject"
          />
        </div>
      </div>

      <!-- Pattern Controls -->
      <div class="grid grid-cols-3 gap-4 text-xs">
        <div class="space-y-2">
          <label class="block text-gray-400">Pattern X</label>
          <UInput
            v-model="objectProperties.patternX"
            size="xs"
            type="number"
            :disabled="!selectedObject"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-gray-400">Pattern Y</label>
          <UInput
            v-model="objectProperties.patternY"
            size="xs"
            type="number"
            :disabled="!selectedObject"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-gray-400">Pattern Z</label>
          <UInput
            v-model="objectProperties.patternZ"
            size="xs"
            type="number"
            :disabled="!selectedObject"
          />
        </div>
      </div>

      <!-- Checkboxes -->
      <div class="flex items-center space-x-6 text-xs">
        <UCheckbox
          v-model="objectProperties.hasTransparency"
          label="Transparency"
          :disabled="!selectedObject"
        />
        <UCheckbox
          v-model="objectProperties.isExtended"
          label="Extended"
          :disabled="!selectedObject"
        />
        <UCheckbox
          v-model="objectProperties.hasFrameGroups"
          label="Frame Groups"
          :disabled="!selectedObject"
        />
      </div>
    </div>

    <!-- Main Canvas Area -->
    <div class="flex-1 flex items-center justify-center p-8 relative">
      <!-- Canvas Background -->
      <div class="relative">
        <!-- Transparency grid background -->
        <div
          class="absolute inset-0 opacity-20"
          :style="{
            backgroundImage:
              'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAKElEQVQYV2NkYGAwZkAD////RzYyMjICMRYgOwNIA2Mg+v8fC5JNBgANEQoK+K/OQwAAAABJRU5ErkJggg==)',
            backgroundSize: '8px 8px',
          }"
        ></div>

        <!-- Canvas -->
        <canvas
          ref="spriteCanvas"
          :width="canvasSize.width"
          :height="canvasSize.height"
          class="border border-gray-600 bg-transparent"
          @dragover.prevent
          @drop="handleDrop"
        ></canvas>

        <!-- Canvas overlay for selection -->
        <div
          v-if="selectedSprite"
          class="absolute border-2 border-blue-500 pointer-events-none"
          :style="selectionStyle"
        ></div>
      </div>

      <!-- Drop Zone Overlay -->
      <div
        v-if="isDragging"
        class="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 flex items-center justify-center"
      >
        <div class="text-center">
          <Icon
            name="heroicons:cloud-arrow-up"
            class="w-12 h-12 text-blue-500 mx-auto mb-2"
          />
          <p class="text-blue-300">Drop sprite sheet here</p>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!selectedObject"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center">
          <Icon
            name="heroicons:cursor-arrow-rays"
            class="w-16 h-16 mx-auto mb-4 text-gray-600"
          />
          <p class="text-gray-500 mb-2">No object selected</p>
          <p class="text-xs text-gray-600">
            {{
              projectState.isLoaded
                ? "Select an object from the left panel"
                : "Load a project to get started"
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Canvas Footer -->
    <div
      class="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between text-xs"
    >
      <div class="flex items-center space-x-4">
        <span class="text-gray-400">Zoom:</span>
        <URange
          v-model="zoomLevel"
          :min="0.5"
          :max="5"
          :step="0.1"
          class="w-20"
        />
        <span>{{ Math.round(zoomLevel * 100) }}%</span>
      </div>

      <div class="flex items-center space-x-4">
        <span class="text-gray-400"
          >Canvas: {{ canvasSize.width }}x{{ canvasSize.height }}</span
        >
        <span class="text-gray-400">|</span>
        <span class="text-gray-400"
          >Sprite: {{ spriteSize.width }}x{{ spriteSize.height }}</span
        >
        <span class="text-gray-400">|</span>
        <span class="text-gray-400">
          Object: {{ selectedObject?.id || "None" }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTibiaFiles } from "../composables/useTibiaFiles";

const { projectState, importSpriteSheet } = useTibiaFiles();

const spriteCanvas = ref(null);
const isAnimating = ref(false);
const currentFrame = ref(1);
const totalFrames = ref(6);
const isDragging = ref(false);
const selectedSprite = ref(null);
const selectedObject = ref(null);
const zoomLevel = ref(1);

const selectedGroup = ref({ label: "Walking", value: "walking" });
const groupOptions = [
  { label: "Walking", value: "walking" },
  { label: "Idle", value: "idle" },
  { label: "Attack", value: "attack" },
];

const objectProperties = reactive({
  width: 1,
  height: 1,
  cropSize: 32,
  layers: 1,
  patternX: 1,
  patternY: 1,
  patternZ: 1,
  hasTransparency: true,
  isExtended: true,
  hasFrameGroups: true,
});

const canvasSize = reactive({
  width: 400,
  height: 300,
});

const spriteSize = reactive({
  width: 32,
  height: 32,
});

const selectionStyle = computed(() => {
  if (!selectedSprite.value) return {};
  return {
    left: `${selectedSprite.value.x}px`,
    top: `${selectedSprite.value.y}px`,
    width: `${selectedSprite.value.width}px`,
    height: `${selectedSprite.value.height}px`,
  };
});

// Listen for object selection from left panel
const objectSelectionBus = useNuxtApp().$bus || {
  emit: () => {},
  on: () => {},
};

// Animation control
const toggleAnimation = () => {
  if (!selectedObject.value) return;

  isAnimating.value = !isAnimating.value;
  if (isAnimating.value) {
    startAnimation();
  }
};

const startAnimation = () => {
  if (!isAnimating.value || !selectedObject.value) return;

  setTimeout(() => {
    const maxFrames = selectedObject.value.frames || totalFrames.value;
    currentFrame.value =
      currentFrame.value >= maxFrames ? 1 : currentFrame.value + 1;
    if (isAnimating.value) {
      startAnimation();
    }
  }, 200); // 200ms per frame
};

// File drop handling
const handleDrop = async (event) => {
  event.preventDefault();
  isDragging.value = false;

  const files = Array.from(event.dataTransfer.files);
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  if (imageFiles.length > 0) {
    try {
      const sprites = await importSpriteSheet(imageFiles[0], {
        spriteWidth: 32,
        spriteHeight: 32,
        columns: 8,
        rows: 8,
      });

      projectState.sprites.push(...sprites);
      console.log(`Imported ${sprites.length} sprites from sheet`);
    } catch (error) {
      console.error("Error importing sprite sheet:", error);
    }
  }
};

const loadSpriteSheet = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      drawSpriteSheet(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const drawSpriteSheet = (img) => {
  const canvas = spriteCanvas.value;
  const ctx = canvas.getContext("2d");

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the sprite sheet
  ctx.drawImage(img, 0, 0);

  console.log("Sprite sheet loaded and drawn");
};

const drawSelectedObject = () => {
  if (!selectedObject.value || !spriteCanvas.value) return;

  const canvas = spriteCanvas.value;
  const ctx = canvas.getContext("2d");

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw placeholder for selected object
  ctx.fillStyle = "#4F46E5";
  ctx.fillRect(canvas.width / 2 - 16, canvas.height / 2 - 16, 32, 32);

  // Draw object ID
  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    selectedObject.value.id.toString(),
    canvas.width / 2,
    canvas.height / 2 + 4
  );
};

// Watch for object selection changes
const updateObjectProperties = (object) => {
  if (object) {
    objectProperties.width = object.width;
    objectProperties.height = object.height;
    objectProperties.layers = object.layers;
    objectProperties.patternX = object.patternX;
    objectProperties.patternY = object.patternY;
    objectProperties.patternZ = object.patternZ;
    objectProperties.hasTransparency = true;
    objectProperties.isExtended = true;
    objectProperties.hasFrameGroups = true;

    currentFrame.value = 1;
    totalFrames.value = object.frames || 1;

    drawSelectedObject();
  }
};

// Listen for global object selection (we'll emit this from left panel)
if (process.client) {
  window.addEventListener("object-selected", (event) => {
    selectedObject.value = event.detail;
    updateObjectProperties(event.detail);
  });
}

// Drag events for drop zone
onMounted(() => {
  document.addEventListener("dragenter", (e) => {
    e.preventDefault();
    isDragging.value = true;
  });

  document.addEventListener("dragleave", (e) => {
    e.preventDefault();
    if (!document.querySelector(":hover")) {
      isDragging.value = false;
    }
  });

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
    isDragging.value = false;
  });
});

// Reset when project changes
watch(
  () => projectState.isLoaded,
  (isLoaded) => {
    if (!isLoaded) {
      selectedObject.value = null;
      isAnimating.value = false;
    }
  }
);
</script>
