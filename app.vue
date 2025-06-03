<template>
  <div class="h-screen bg-gray-900 text-white overflow-hidden flex flex-col">
    <!-- Header -->
    <ObjectBuilderHeader class="flex-shrink-0" />

    <!-- Main Content - 3 Panel Layout -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Panel - Project/Objects (25%) -->
      <div class="w-1/4 min-w-64 max-w-80 flex-shrink-0">
        <ObjectBuilderLeftPanel />
      </div>

      <!-- Center Panel - Canvas (50%) -->
      <div class="flex-1">
        <ObjectBuilderMainCanvas />
      </div>

      <!-- Right Panel - Sprites (25%) -->
      <div class="w-1/4 min-w-64 max-w-80 flex-shrink-0">
        <ObjectBuilderRightPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
// Set the page title
useHead({
  title: "Object Builder Online - Tibia Sprite Editor",
});
</script>
