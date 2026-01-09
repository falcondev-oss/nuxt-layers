<script setup lang="ts">
import type { InputEmits, InputProps } from '@nuxt/ui'
import type { MaskOptions } from 'maska'
import { regex } from 'arkregex'
import { vMaska } from 'maska/vue'
import { useForwardPropsEmits } from 'reka-ui'

const props =
  defineProps<Omit<InputProps<string>, 'modelValue' | 'defaultValue' | 'modelModifiers'>>()
const emit = defineEmits<Omit<InputEmits<string>, 'update:modelValue'>>()
const forwardedProps = useForwardPropsEmits(props, emit)

const model = defineModel<number | null>({
  required: true,
})

// eslint-disable-next-line unicorn/prefer-string-raw
const parser = regex('^-?(?<hours>\\d{1,}):?(?<minutes>\\d{1,2})?$')
const duration = computed({
  get: () => {
    if (model.value === null) return null

    const absoluteMinutes = Math.abs(model.value)

    const hours = Math.floor(absoluteMinutes / 60)
    const minutes = absoluteMinutes % 60
    const sign = model.value < 0 ? '-' : ''

    // don't always add :00 if minutes is 0
    if (minutes > 0)
      return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

    return `${sign}${hours.toString()}`
  },
  set: (val) => {
    if (!val) {
      model.value = null
      return
    }

    const parsed = parser.exec(val)
    if (!parsed) {
      model.value = null
      return
    }

    const isNegative = val.startsWith('-')

    const hours = Number.parseInt(parsed.groups.hours) * 60
    const minutes = parsed.groups.minutes ? Number.parseInt(parsed.groups.minutes) : 0

    model.value = isNegative ? (hours + minutes) * -1 : hours + minutes
  },
})

const maskOptions: MaskOptions = {
  // S: sign, H: hours (unlimited), 5: tens digit of minutes, D: digit of minutes
  mask: 'SH:5D',
  tokens: {
    'S': { pattern: /[-+]/, optional: true },
    'D': { pattern: /\d/ },
    'H': { pattern: /\d/, multiple: true },
    '5': {
      pattern: /[0-5]/,
      transform(char) {
        // clamp char to max 5, otherwise maska would just block input if user tries to input 6-9
        const num = Number.parseInt(char)
        if (Number.isNaN(num)) return char
        return num > 5 ? '5' : char
      },
    },
  },
}
</script>

<template>
  <UInput
    v-bind="forwardedProps"
    v-model="duration"
    v-maska="maskOptions"
    :model-modifiers="{
      nullable: true,
      lazy: true,
    }"
    placeholder="HH:mm"
    trailing-icon="ph:timer"
  />
</template>
