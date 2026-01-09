<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

console.error(props.error)
</script>

<template>
  <UApp>
    <UError :error />
  </UApp>
</template>
