<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

defineProps<{
  title?: string
  end?: boolean
}>()

defineSlots<{
  default: () => any
}>()
</script>

<template>
  <div
    :data-end="end || undefined"
    class="flex shrink-0 flex-col gap-1.5 px-3 py-2"
    :class="end && 'border-default [&:not([data-end]~*)]:ml-auto [&:not([data-end]~*)]:border-l'"
  >
    <p v-if="title" class="text-dimmed text-[10px] leading-none">
      {{ title }}
    </p>
    <div class="flex flex-1 flex-wrap items-center gap-1" v-bind="$attrs">
      <slot />
    </div>
  </div>
</template>
