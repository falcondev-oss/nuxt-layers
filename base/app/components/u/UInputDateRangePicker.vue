<script setup lang="ts">
import type { CalendarDate, DateValue } from '@internationalized/date'
import { toCalendarDate } from '@internationalized/date'

const inputDate = useTemplateRef('inputDate')

const model = defineModel<{
  start: CalendarDate
  end: CalendarDate
} | null>({
  required: true,
})

const localModel = shallowRef({
  // eslint-disable-next-line vue/no-ref-object-reactivity-loss
  start: model.value?.start,
  // eslint-disable-next-line vue/no-ref-object-reactivity-loss
  end: model.value?.end,
} as
  | {
      start: DateValue | undefined
      end: DateValue | undefined
    }
  | undefined
  | null)

const open = ref(false)

let syncingModelValue = false
watch(
  localModel,
  (newValue) => {
    // prevent infinite loop
    if (syncingModelValue) return

    if (newValue?.start && newValue.end) {
      model.value = {
        start: toCalendarDate(newValue.start),
        end: toCalendarDate(newValue.end),
      }
      open.value = false
    } else if (!newValue?.start && !newValue?.end) {
      model.value = null
      open.value = false
    }
  },
  {
    flush: 'sync',
  },
)

watch(model, (newValue) => {
  syncingModelValue = true
  if (newValue) {
    localModel.value = {
      start: newValue.start,
      end: newValue.end,
    }
  } else {
    localModel.value = {
      start: undefined,
      end: undefined,
    }
  }
  syncingModelValue = false
})
</script>

<template>
  <UInputDate ref="inputDate" v-model="localModel" range>
    <template #trailing>
      <UPopover v-model:open="open" :reference="inputDate?.inputsRef[0]?.$el">
        <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />

        <template #content>
          <div class="p-2">
            <UCalendar v-model="localModel" :number-of-months="2" range />
            <div v-if="model" class="flex justify-end">
              <UButton
                variant="ghost"
                icon="tabler:trash"
                color="error"
                label="Löschen"
                size="sm"
                @click="
                  () => {
                    localModel = {
                      start: undefined,
                      end: undefined,
                    }
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
