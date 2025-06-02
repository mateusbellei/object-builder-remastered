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
            class="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
          >
            <option
              v-for="(protocol, key) in protocols"
              :key="key"
              :value="key"
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
          class="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          :disabled="isLoading"
        >
          <span class="text-sm">📁</span>
          <span class="text-sm font-medium">{{
            isLoading ? "Loading..." : "Open"
          }}</span>
        </button>

        <span class="text-gray-300">|</span>

        <button
          @click="handleSave"
          class="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          :disabled="!projectState.isLoaded || isLoading"
        >
          <span class="text-sm">💾</span>
          <span class="text-sm font-medium">Save</span>
        </button>

        <button
          @click="handleExport"
          class="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
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
  </header>
</template>

<script setup lang="ts">
const { projectState, protocols, loadFromFileDialog, exportProject } =
  useTibiaFiles();

const isLoading = ref(false);
const currentProtocol = ref(projectState.protocol);

// Note: Protocol is read-only in the current implementation
// TODO: Add protocol change functionality in the composable

const handleOpen = async () => {
  console.log("🚀 Open button clicked!");
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    await loadFromFileDialog();
    console.log("✅ Files loaded successfully!");
  } catch (error) {
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
  } catch (error) {
    console.error("❌ Error exporting:", error);
  }
};

const handleHelp = () => {
  console.log("❓ Help button clicked!");
  // TODO: Show help modal or navigate to help page
  console.log("Help function not implemented yet");
};
</script>
