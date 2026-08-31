import type { InputEmits, InputProps } from '@nuxt/ui'
import type { MaskOptions } from 'maska'
import { regex } from 'arkregex'
import { vMaska } from 'maska/vue'
import { withDirectives } from 'vue'
import { UInput } from '#components'

// `String.raw` would widen the pattern to `string`, and `arkregex` types the match groups off
// the literal
// eslint-disable-next-line unicorn/prefer-string-raw
const parser = regex('^-?(?<hours>\\d{1,}):?(?<minutes>\\d{1,2})?$')

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

export default defineSetupComponent(
  (_: {
    props: Omit<InputProps<string>, 'modelValue' | 'defaultValue' | 'modelModifiers'> & {
      modelValue: number | null
      showZeroMinutes?: boolean
    }
    // the rest reaches `UInput` as inherited attributes
    propKeys: 'modelValue' | 'showZeroMinutes'
    emits: AsEmits<Omit<InputEmits<string>, 'update:modelValue'>> & {
      'update:modelValue': (value: number | null) => void
    }
  }) =>
    options(_, {
      name: 'UInputDurationMinutes',
      props: ['modelValue', 'showZeroMinutes'],
      emits: ['blur', 'change', 'update:modelValue'],
      setup: (props, { emit }) => {
        const duration = computed({
          get: () => {
            if (props.modelValue === null) return null

            const absoluteMinutes = Math.abs(props.modelValue)

            const hours = Math.floor(absoluteMinutes / 60)
            const minutes = absoluteMinutes % 60
            const sign = props.modelValue < 0 ? '-' : ''

            // don't always add :00 if minutes is 0
            if (minutes > 0 || props.showZeroMinutes)
              return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

            return `${sign}${hours.toString()}`
          },
          set: (val: string | null) => {
            if (!val) {
              emit('update:modelValue', null)
              return
            }

            const parsed = parser.exec(val)
            if (!parsed) {
              emit('update:modelValue', null)
              return
            }

            const isNegative = val.startsWith('-')

            const hours = Number.parseInt(parsed.groups.hours) * 60
            const minutes = parsed.groups.minutes ? Number.parseInt(parsed.groups.minutes) : 0

            emit('update:modelValue', isNegative ? -(hours + minutes) : hours + minutes)
          },
        })

        return () =>
          withDirectives(
            <UInput
              modelValue={duration.value}
              onUpdate:modelValue={(value) => {
                duration.value = value
              }}
              modelModifiers={{
                nullable: true,
                lazy: true,
              }}
              placeholder="HH:mm"
              trailingIcon="lucide:timer"
              onBlur={(event) => emit('blur', event)}
              onChange={(event) => emit('change', event)}
            />,
            [[vMaska, maskOptions]],
          )
      },
    }),
)
