<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

const inputDate = useTemplateRef('inputDate')

const model = defineModel<DateValue | null>({ required: true })
const open = ref(false)
</script>

<template>
  <UInputDate
    ref="inputDate"
    :model-value="model"
    :range="false"
    @update:model-value="
      (val) => {
        model = val ?? null
      }
    "
  >
    <template #trailing>
      <UPopover v-model:open="open" :reference="inputDate?.inputsRef[3]?.$el">
        <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />

        <template #content>
          <div class="p-2">
            <UCalendar
              :model-value="model ?? undefined"
              :multiple="false"
              :range="false"
              @update:model-value="
                (val) => {
                  model = val ?? null
                  open = false
                }
              "
            />
            <div v-if="model" class="flex justify-end">
              <UButton
                variant="ghost"
                icon="tabler:trash"
                color="error"
                label="Löschen"
                size="sm"
                @click="
                  () => {
                    model = null
                  }
                "
              />
            </div>
          </div>
        </template>
      </UPopover>
    </template>
  </UInputDate>
</template>
