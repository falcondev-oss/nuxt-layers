<script setup lang="ts">
defineProps<{
  title: string
  description: string
  submitLabel: string
}>()

const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal :close="{ onClick: () => emit('close', false) }" :title :description class="max-w-sm">
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          label="Abbrechen"
          @click="() => emit('close', false)"
        />
        <UButton :label="submitLabel" color="error" @click="() => emit('close', true)" />
      </div>
    </template>
  </UModal>
</template>
