<template>
  <div
    class="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between"
  >
    <!-- Logo and Title -->
    <div class="flex items-center space-x-3">
      <div
        class="w-8 h-8 bg-purple-600 rounded flex items-center justify-center"
      >
        <Icon name="heroicons:cube" class="w-5 h-5 text-white" />
      </div>
      <h1 class="text-lg font-semibold">Object Builder Online</h1>
      <span class="text-sm text-gray-400">v1.0.0</span>
      <!-- Debug: Show environment -->
      <UBadge
        :color="isElectronEnv ? 'purple' : 'gray'"
        variant="soft"
        size="xs"
      >
        {{ isElectronEnv ? "Electron" : "Web" }}
      </UBadge>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center space-x-4">
      <!-- File Operations with better spacing -->
      <div class="flex items-center space-x-3">
        <UButton
          @click="openProject"
          variant="outline"
          size="sm"
          icon="heroicons:folder-open"
          :loading="isLoading"
          class="min-w-[80px]"
        >
          Open
        </UButton>
        <UButton
          @click="saveProject"
          variant="outline"
          size="sm"
          icon="heroicons:floppy-disk"
          :disabled="!projectState.isLoaded"
          class="min-w-[80px]"
        >
          Save
        </UButton>
        <UButton
          @click="exportProject"
          variant="outline"
          size="sm"
          icon="heroicons:arrow-down-tray"
          :disabled="!projectState.isLoaded"
          class="min-w-[80px]"
        >
          Export
        </UButton>
      </div>

      <!-- Separator -->
      <div class="h-6 w-px bg-gray-600"></div>

      <!-- Protocol Selector -->
      <div class="flex items-center space-x-2">
        <span class="text-xs text-gray-400">Protocol:</span>
        <USelect
          v-model="selectedProtocol"
          :options="protocolOptions"
          size="sm"
          class="w-32"
        />
      </div>

      <!-- File Status Indicators -->
      <div class="flex items-center space-x-1">
        <UBadge
          v-if="projectState.loadedFiles.dat"
          color="green"
          variant="soft"
          size="xs"
        >
          DAT
        </UBadge>
        <UBadge
          v-if="projectState.loadedFiles.spr"
          color="blue"
          variant="soft"
          size="xs"
        >
          SPR
        </UBadge>
        <UBadge
          v-if="projectState.loadedFiles.otfi"
          color="purple"
          variant="soft"
          size="xs"
        >
          OTFI
        </UBadge>
      </div>

      <!-- Separator -->
      <div class="h-6 w-px bg-gray-600"></div>

      <!-- Settings -->
      <UButton
        @click="openSettings"
        variant="outline"
        size="sm"
        icon="heroicons:cog-6-tooth"
      />

      <!-- Debug Test Button (temporary) -->
      <UButton
        @click="debugTest"
        variant="solid"
        size="sm"
        color="green"
        class="ml-2"
      >
        Test
      </UButton>
    </div>

    <!-- Toast Notifications Container -->
    <UNotifications />
  </div>
</template>

<script setup>
import { computed } from "vue";

const {
  projectState,
  loadFromFileDialog,
  exportProject: exportProjectFiles,
  protocols,
} = useTibiaFiles();

const selectedProtocol = ref("12.86");
const isLoading = ref(false);
const toast = useToast();

// Check if running in Electron
const isElectronEnv = computed(() => {
  if (process.client) {
    return !!(
      (typeof window !== "undefined" && window.process?.type === "renderer") ||
      (typeof window !== "undefined" && window["electronAPI"])
    );
  }
  return false;
});

const protocolOptions = Object.keys(protocols).map((version) => ({
  label: version,
  value: version,
}));

// File operations
const openProject = async () => {
  console.log("🔵 OPEN BUTTON CLICKED!");
  console.log("🔍 Button state:", { isLoading: isLoading.value });

  try {
    isLoading.value = true;

    // Show loading toast
    toast.add({
      title: "Loading...",
      description: "Opening file dialog...",
      color: "blue",
    });

    console.log("📞 Calling loadFromFileDialog...");
    await loadFromFileDialog();

    if (projectState.isLoaded) {
      toast.add({
        title: "Success!",
        description: `Project loaded successfully! Files: ${Object.keys(
          projectState.loadedFiles
        )
          .filter((k) => projectState.loadedFiles[k])
          .join(", ")
          .toUpperCase()}`,
        color: "green",
        timeout: 5000,
      });
    } else {
      toast.add({
        title: "No files selected",
        description: "Please select .dat, .spr or .otfi files to load",
        color: "yellow",
      });
    }
  } catch (error) {
    console.error("💥 Error loading project:", error);
    toast.add({
      title: "Error!",
      description:
        "Failed to load project files. Please check the files and try again.",
      color: "red",
      timeout: 5000,
    });
  } finally {
    isLoading.value = false;
    console.log("✅ Open project finished");
  }
};

const saveProject = () => {
  console.log("🟡 SAVE BUTTON CLICKED!");
  if (!projectState.isLoaded) {
    console.log("❌ No project loaded");
    return;
  }

  toast.add({
    title: "Save Project",
    description: "Save functionality is coming soon...",
    color: "blue",
    timeout: 3000,
  });

  console.log("Saving project...");
};

const exportProject = async () => {
  console.log("🟢 EXPORT BUTTON CLICKED!");
  if (!projectState.isLoaded) {
    console.log("❌ No project loaded");
    return;
  }

  try {
    toast.add({
      title: "Export Project",
      description: "Export functionality is coming soon...",
      color: "blue",
      timeout: 3000,
    });

    await exportProjectFiles("all");
  } catch (error) {
    console.error("💥 Error exporting project:", error);
    toast.add({
      title: "Export Error",
      description: "Failed to export project",
      color: "red",
    });
  }
};

const openSettings = () => {
  console.log("⚙️ SETTINGS BUTTON CLICKED!");
  toast.add({
    title: "Settings",
    description: "Settings panel coming soon...",
    color: "blue",
  });
  console.log("Opening settings...");
};

// Watch protocol changes
watch(selectedProtocol, (newProtocol) => {
  projectState.protocol = newProtocol;
  toast.add({
    title: "Protocol Changed",
    description: `Switched to protocol ${newProtocol}`,
    color: "blue",
    timeout: 2000,
  });
  console.log("Protocol changed to:", newProtocol);
});

// Debug function for testing
const debugTest = () => {
  console.log("🧪 DEBUG TEST CLICKED!");
  console.log("🔍 Current state:", {
    isElectron: isElectronEnv.value,
    projectLoaded: projectState.isLoaded,
    loadedFiles: projectState.loadedFiles,
  });

  toast.add({
    title: "Debug Test",
    description: `Environment: ${
      isElectronEnv.value ? "Electron" : "Web"
    } | Button clicks working!`,
    color: "green",
  });
};

// Add debug info
onMounted(() => {
  console.log("Header mounted, projectState:", projectState);
});
</script>
