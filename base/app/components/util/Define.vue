<script setup lang="ts" generic="T extends object">
defineProps<{
  value: T
}>()

defineSlots<{
  default: (props: T) => any
}>()
</script>

<template>
  <slot v-bind="value" />
</template>
