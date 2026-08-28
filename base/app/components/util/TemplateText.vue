<script setup lang="ts">
import type { templateParts } from '~/utils/display'

defineProps<{
  text: ReturnType<typeof templateParts>
}>()
</script>

<template>
  <p>
    <span v-for="(string, index) in text.strings" :key="index">
      <span>{{ string }}</span>
      <strong v-if="text.values[index]" class="font-semibold">
        <UBadge variant="soft" color="neutral" size="lg" class="h-6! p-1! font-semibold">
          {{ text.values[index] }}
        </UBadge>
      </strong>
    </span>
  </p>
</template>
