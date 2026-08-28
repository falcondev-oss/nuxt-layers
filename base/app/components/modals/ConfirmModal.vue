<script setup lang="ts" generic="const O extends RadioGroupItem[], R extends ConfirmModalResult<O>">
import type { ButtonProps, RadioGroupItem, RadioGroupProps } from '@nuxt/ui'
import type { ComponentPublicInstance } from 'vue'
import type { ConfirmModalResult } from '../../composables/confirm'
import type { templateParts } from '../../utils/display'

export type ConfirmModalProps<O extends RadioGroupItem[]> = {
  title: string
  confirmLabel: string
  confirmDisabled?: () => boolean
  text?: string | ReturnType<typeof templateParts>
  slotRef?: ComponentPublicInstance
  options?: O
  color?: ButtonProps['color']
}

defineProps<ConfirmModalProps<O>>()

const emit = defineEmits<{
  close: [result: R]
}>()

const selectedOption = ref<RadioGroupProps<O>['modelValue']>()
</script>

<template>
  <UModal
    :title
    :close="{ onClick: () => emit('close', false as R) }"
    :dismissible="false"
    :ui="{ header: 'border-b-0!', body: 'pt-0!' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p v-if="text && typeof text === 'string'">{{ text }}</p>
        <TemplateText v-else-if="text && typeof text === 'object'" :text />

        <SlotRef :slot-ref />

        <URadioGroup
          v-model="selectedOption"
          :items="options"
          variant="table"
          :color="color ?? 'error'"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="soft"
          label="Abbrechen"
          @click="() => emit('close', false as R)"
        />
        <UButton
          :color="color ?? 'error'"
          :label="confirmLabel"
          :disabled="(!!options?.length && selectedOption === undefined) || confirmDisabled?.()"
          @click="() => emit('close', (selectedOption ?? true) as R)"
        />
      </div>
    </template>
  </UModal>
</template>
