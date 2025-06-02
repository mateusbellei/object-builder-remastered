<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- Header -->
    <ObjectBuilderHeader />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Panel -->
      <div class="w-80 flex-shrink-0">
        <ObjectBuilderLeftPanel @item-selected="handleItemSelected" />
      </div>

      <!-- Main Panel -->
      <ObjectBuilderMainPanel :selected-item="selectedItem" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThingType } from "~/types/tibia";

const selectedItem = ref<ThingType | null>(null);

const handleItemSelected = (item: ThingType) => {
  selectedItem.value = item;
  console.log("Item selected in main page:", item);
};
</script>
