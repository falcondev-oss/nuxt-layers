<script setup lang="ts" generic="T">
defineProps<{
  value: T
}>()

defineSlots<{
  default: (props: { value: T }) => any
}>()
</script>

<template>
  <slot v-bind="{ value }" />
</template>
