<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

const inputDate = useTemplateRef('inputDate')

const model = defineModel<DateValue | null>({ required: true })
const open = ref(false)
</script>

<template>
  <UInputDate ref="inputDate" v-model="model">
    <template #trailing>
      <UPopover v-model:open="open" :reference="inputDate?.inputsRef[3]?.$el">
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-calendar"
          aria-label="Datum auswählen"
          class="px-0"
        />

        <template #content>
          <UCalendar
            :model-value="model ?? undefined"
            :multiple="false"
            :range="false"
            class="p-2"
            @update:model-value="
              (val) => {
                model = val ?? null
                open = false
              }
            "
          />
        </template>
      </UPopover>
    </template>
  </UInputDate>
</template>
