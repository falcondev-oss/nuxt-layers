<script setup lang="ts" generic="T">
const props = defineProps<{
  input: T
}>()

const output = defineModel<T>('output', { required: true })

watch(
  () => props.input,
  () => {
    output.value = props.input
  },
  { immediate: true },
)
</script>

<!-- eslint-disable-next-line vue/valid-template-root -->
<template></template>
