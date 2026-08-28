<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

defineProps<{
  slotRef?: ComponentPublicInstance
}>()

defineSlots<{
  default: () => any
}>()
</script>

<template>
  <component :is="slotRef.$slots.default" v-if="slotRef" />
  <!-- eslint-disable-next-line vue/no-lone-template -->
  <template v-else />
</template>
