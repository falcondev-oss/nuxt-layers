<script setup lang="ts">
import { useImage } from '@vueuse/core'

const props = defineProps<{
  src?: string
  alt?: string
  fallbackSrc?: string
}>()

defineSlots<{
  default: () => any
}>()

const { error, isReady } = props.src
  ? useImage(() => ({
      src: props.src ?? '',
    }))
  : {
      isReady: false,
      error: true,
    }
</script>

<template>
  <img v-if="isReady" :src="src" :alt="alt" />
  <USkeleton v-else-if="!error" />
  <div v-else>
    <slot name="default">
      <!-- eslint-disable-next-line vue/no-duplicate-attr-inheritance -->
      <img v-if="fallbackSrc" :src="fallbackSrc" v-bind="$attrs" />
      <!-- eslint-disable-next-line vue/no-duplicate-attr-inheritance -->
      <USkeleton v-else v-bind="$attrs" />
    </slot>
  </div>
</template>
