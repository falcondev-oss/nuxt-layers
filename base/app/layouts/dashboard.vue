<script setup lang="ts">
defineSlots<{
  default: any
}>()

const config = useRuntimeConfig()
</script>

<template>
  <UDashboardGroup storage="local" :storage-key="`${config.public.projectId}-dashboard`" unit="rem">
    <template #header>
      <UDashboardNavbar />
      <UDashboardToolbar />
    </template>
    <UDashboardSidebar collapsed resizable class="bg-white" mode="drawer" />
    <slot />
  </UDashboardGroup>
</template>
