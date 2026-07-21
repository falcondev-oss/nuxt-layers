<script setup lang="ts" generic="T">
const props = defineProps<{
  input: T
  deep?: boolean
  once?: boolean
}>()

const output = defineModel<T>('output', { required: true })

watch(
  () => props.input,
  () => {
    output.value = props.input
  },
  {
    immediate: true,
    deep: props.deep,
    once: props.once,
  },
)
</script>

<!-- eslint-disable-next-line vue/valid-template-root -->
<template></template>
