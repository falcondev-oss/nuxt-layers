<script setup lang="ts" generic="T extends Extract<RadioGroupItem, object>">
import type { GetItemValue, NestedItem, RadioGroupItem } from '#ui/types'
import { UModal } from '#components'

const props = defineProps<{
  items: T[]
  defaultValue: GetItemValue<T[], 'value', NestedItem<T>>
  title: string
  submitButtonLabel: string
  description?: string
}>()

const emit = defineEmits<{
  close: [value: T['value'] | undefined]
}>()

const selectedValue = ref(props.defaultValue)
</script>

<template>
  <UModal :title :description>
    <template #body>
      <div class="flex flex-col gap-4">
        <URadioGroup v-model="selectedValue" variant="table" :items />
        <div class="flex w-full justify-end gap-4">
          <UButton
            label="Abbrechen"
            variant="ghost"
            color="neutral"
            @click="() => emit('close', undefined)"
          />
          <UButton :label="submitButtonLabel" @click="() => emit('close', selectedValue)" />
        </div>
      </div>
    </template>
  </UModal>
</template>
