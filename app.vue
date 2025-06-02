<template>
  <div class="h-screen bg-gray-900 text-white overflow-hidden">
    <!-- Header -->
    <ObjectBuilderHeader />

    <!-- Main Content -->
    <div class="flex h-full">
      <!-- Left Sidebar - Info & Outfits -->
      <ObjectBuilderLeftPanel />

      <!-- Center Content - Main Canvas -->
      <ObjectBuilderMainCanvas />

      <!-- Right Sidebar - Sprites -->
      <ObjectBuilderRightPanel />
    </div>
  </div>
</template>

<script setup>
// Set the page title
useHead({
  title: "Object Builder Online - Tibia Sprite Editor",
});
</script>
