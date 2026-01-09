<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import { UModal } from '#components'

defineProps<{
  actions: ButtonProps[]
  title: string
  description?: string
}>()
</script>

<template>
  <UModal :title :description :ui="{ content: 'max-w-fit', footer: 'flex flex-col gap-4' }">
    <template #footer>
      <UButton
        v-for="action of actions"
        :key="action.label"
        variant="subtle"
        class="w-full justify-center"
        size="xl"
        v-bind="action"
      />
    </template>
  </UModal>
</template>
