<script setup lang="ts" generic="T">
import type { FormField } from '@falcondev-oss/form-core'
import type { FormFieldProps, FormFieldSlots } from '@nuxt/ui'
import type { ModelModifiers } from '@nuxt/ui/runtime/types/input.js'
import { useForwardProps } from 'reka-ui'
import { omit } from 'remeda'

type FieldSlotProps<T> = {
  'modelValue': T
  'onUpdate:modelValue': (value: T) => void
  'onBlur': () => void
  'disabled': boolean
  'loading': boolean
  'modelModifiers'?: Pick<ModelModifiers, 'nullable'>
}

const props = defineProps<
  FormFieldProps & {
    field: FormField<T>
  }
>()
const slots = defineSlots<
  {
    default: (props: Omit<FieldSlotProps<T>, 'modelModifiers'>) => any
  } & Omit<FormFieldSlots, 'default'>
>()

const forwardedProps = useForwardProps(props)

const formFieldProps = computed(() => {
  const { field, ...rest } = forwardedProps.value
  return rest
})

const slotProps = computed(
  () =>
    ({
      'modelValue': forwardedProps.value.field.value,
      'onUpdate:modelValue': (value) => forwardedProps.value.field.handleChange(value),
      'onBlur': () => forwardedProps.value.field.handleBlur(),
      'disabled': forwardedProps.value.field.disabled,
      'loading': forwardedProps.value.field.isPending,
      'modelModifiers': {
        nullable: true,
      },
    }) satisfies FieldSlotProps<T>,
)
</script>

<template>
  <UFormField
    v-bind="formFieldProps"
    :error="forwardedProps.field.errors && forwardedProps.field.errors.join('\n')"
  >
    <slot v-bind="slotProps">
      <DevOnly>
        <p class="font-black text-red-500">UField missing slot</p>
      </DevOnly>
    </slot>

    <template v-for="(_, name) in omit(slots, ['default'])" #[name]="slotData">
      <!-- @vue-ignore -->
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </UFormField>
</template>
