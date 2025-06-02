<template>
  <header class="bg-white border-b border-gray-200 px-4 py-3">
    <div class="flex items-center justify-between">
      <!-- Logo/Title -->
      <div class="flex items-center space-x-3">
        <div
          class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center"
        >
          <span class="text-white font-bold text-sm">OB</span>
        </div>
        <h1 class="text-lg font-semibold text-gray-900">
          Object Builder Online
        </h1>
      </div>

      <!-- File Status Indicators -->
      <div class="flex items-center space-x-4">
        <!-- Protocol Selector -->
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-600">Protocol:</label>
          <select
            v-model="selectedProtocol"
            class="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-900 min-w-[80px]"
            @change="handleProtocolChange"
          >
            <option
              v-for="(protocol, key) in protocols"
              :key="key"
              :value="key"
              class="text-gray-900"
            >
              {{ key }}
            </option>
          </select>
        </div>

        <!-- Status badges with separators -->
        <div class="flex items-center space-x-2">
          <span class="text-gray-300">|</span>
          <span
            class="px-2 py-1 rounded text-xs font-medium"
            :class="
              projectState.loadedFiles.dat
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            "
          >
            DAT {{ projectState.loadedFiles.dat ? "✓" : "✗" }}
          </span>
          <span
            class="px-2 py-1 rounded text-xs font-medium"
            :class="
              projectState.loadedFiles.spr
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            "
          >
            SPR {{ projectState.loadedFiles.spr ? "✓" : "✗" }}
          </span>
          <span
            class="px-2 py-1 rounded text-xs font-medium"
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

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2">
        <button
          @click="handleOpenFolder"
          class="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          <span class="text-sm">📁</span>
          <span class="text-sm font-medium">{{
            isLoading ? "Loading..." : "Open Folder"
          }}</span>
        </button>

        <span class="text-gray-300">|</span>

        <button
          @click="handleSave"
          class="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!projectState.isLoaded || isLoading"
        >
          <span class="text-sm">💾</span>
          <span class="text-sm font-medium">Save</span>
        </button>

        <button
          @click="handleExport"
          class="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!projectState.isLoaded || isLoading"
        >
          <span class="text-sm">📤</span>
          <span class="text-sm font-medium">Export</span>
        </button>

        <span class="text-gray-300">|</span>

        <button
          @click="handleHelp"
          class="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          <span class="text-sm">❓</span>
          <span class="text-sm font-medium">Help</span>
        </button>
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="errorMessage"
      class="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md"
    >
      <div class="flex items-center">
        <span class="text-red-500 mr-2">⚠️</span>
        <span class="text-sm">{{ errorMessage }}</span>
        <button
          @click="clearError"
          class="ml-auto text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Success Display -->
    <div
      v-if="successMessage"
      class="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md"
    >
      <div class="flex items-center">
        <span class="text-green-500 mr-2">✅</span>
        <span class="text-sm">{{ successMessage }}</span>
        <button
          @click="clearSuccess"
          class="ml-auto text-green-500 hover:text-green-700"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Loading Progress -->
    <div
      v-if="loadingProgress.isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Loading Tibia Files
        </h3>

        <!-- Overall Progress -->
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>{{ loadingProgress.stage }}</span>
            <span>{{ loadingProgress.progress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: loadingProgress.progress + '%' }"
            ></div>
          </div>
        </div>

        <!-- DAT Progress -->
        <div class="mb-3">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>DAT File</span>
            <span>{{ loadingProgress.datProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-1.5">
            <div
              class="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              :style="{ width: loadingProgress.datProgress + '%' }"
            ></div>
          </div>
        </div>

        <!-- SPR Progress -->
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>SPR File</span>
            <span>{{ loadingProgress.sprProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-1.5">
            <div
              class="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              :style="{ width: loadingProgress.sprProgress + '%' }"
            ></div>
          </div>
        </div>

        <!-- Current file info -->
        <div
          v-if="loadingProgress.currentFile"
          class="text-xs text-gray-500 text-center"
        >
          Processing: {{ loadingProgress.currentFile }}
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { protocols, projectState, loadingProgress, loadFromFileDialog } =
  useTibiaFiles();

// Local refs
const selectedProtocol = ref(projectState.protocol);
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Watch for protocol changes
watch(selectedProtocol, (newProtocol) => {
  console.log("Protocol changed to:", newProtocol);
  // TODO: Implement protocol change if needed
});

const handleProtocolChange = () => {
  console.log("Protocol changed to:", selectedProtocol.value);
};

const clearError = () => {
  errorMessage.value = "";
};

const clearSuccess = () => {
  successMessage.value = "";
};

const handleOpenFolder = async () => {
  try {
    console.log("🚀 Open button clicked!");
    await loadFromFileDialog();
    console.log("✅ Files loaded successfully!");
  } catch (error) {
    console.error("❌ Error loading files:", error);
  }
};

const handleSave = () => {
  console.log("💾 Save button clicked!");
  // TODO: Implement save functionality
  console.log("Save function not implemented yet");
};

const handleExport = () => {
  console.log("📤 Export clicked - not implemented yet");
};

const handleHelp = () => {
  console.log("❓ Help button clicked!");
  // TODO: Show help modal or navigate to help page
  console.log("Help function not implemented yet");
};
</script>
