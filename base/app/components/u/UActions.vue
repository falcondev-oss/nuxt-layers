<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

defineProps<{
  actions?: ButtonProps[]
  defaults?: Partial<ButtonProps>
}>()

function getActionKey(action: ButtonProps) {
  return action.label || action.icon
}
</script>

<template>
  <div v-if="actions" class="flex gap-4">
    <UButton
      v-for="action of actions"
      :key="getActionKey(action)"
      v-bind="{ ...defaults, ...action }"
    />
  </div>
  <div v-else />
</template>
