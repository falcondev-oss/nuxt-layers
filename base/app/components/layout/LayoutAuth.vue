<script setup lang="ts">
defineSlots<{
  default: any
}>()
</script>

<template>
  <div class="flex min-h-full flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <slot />
    </UPageCard>
  </div>
</template>
