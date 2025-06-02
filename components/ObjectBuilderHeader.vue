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
            v-model="currentProtocol"
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
          @click="handleOpen"
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
  </header>
</template>

<script setup lang="ts">
const { projectState, protocols, loadFromFileDialog, exportProject } =
  useTibiaFiles();

const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const currentProtocol = ref(projectState.protocol);

// Watch for protocol changes in project state
watch(
  () => projectState.protocol,
  (newProtocol) => {
    currentProtocol.value = newProtocol;
  }
);

const handleProtocolChange = () => {
  // TODO: Implement protocol change functionality
  console.log("Protocol changed to:", currentProtocol.value);
};

const clearError = () => {
  errorMessage.value = "";
};

const clearSuccess = () => {
  successMessage.value = "";
};

const handleOpen = async () => {
  console.log("🚀 Open button clicked!");
  if (isLoading.value) return;

  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await loadFromFileDialog();
    successMessage.value = "Files loaded successfully!";
    console.log("✅ Files loaded successfully!");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errorMessage.value = `Failed to load files: ${message}`;
    console.error("❌ Error loading files:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleSave = () => {
  console.log("💾 Save button clicked!");
  // TODO: Implement save functionality
  console.log("Save function not implemented yet");
};

const handleExport = async () => {
  console.log("📤 Export button clicked!");
  try {
    await exportProject({ format: "all" });
    successMessage.value = "Project exported successfully!";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errorMessage.value = `Failed to export: ${message}`;
    console.error("❌ Error exporting:", error);
  }
};

const handleHelp = () => {
  console.log("❓ Help button clicked!");
  // TODO: Show help modal or navigate to help page
  console.log("Help function not implemented yet");
};
</script>
