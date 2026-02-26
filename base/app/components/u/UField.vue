<script setup lang="ts" generic="T, const Nullable extends boolean = false">
import type { FormField } from '@falcondev-oss/form-core'
import type { FormFieldProps, FormFieldSlots } from '@nuxt/ui'
import { useForwardProps } from 'reka-ui'
import * as R from 'remeda'

type InputSlotProps<T, Nullable extends boolean> = {
  'modelValue': T
  'onUpdate:modelValue': (value: T) => void
  'onBlur': () => void
  'disabled': boolean
  'loading': boolean
  'modelModifiers': true extends Nullable ? { nullable: true } : undefined
  'placeholder'?: string
}

const props = defineProps<
  FormFieldProps & {
    field: FormField<T>
  } & { nullable?: Nullable }
>()
const slots = defineSlots<
  {
    default: (slot: { props: InputSlotProps<T, Nullable>; field: FormField<T> }) => any
  } & Omit<FormFieldSlots, 'default'>
>()

const forwardedProps = useForwardProps(props)

const isOverMaxLength = computed(() => {
  const field = forwardedProps.value.field

  return field.schema.maxLength === undefined || field.value == null
    ? false
    : (field.value as string | number)?.toString().length > field.schema.maxLength
})

const formFieldProps = computed<FormFieldProps>(() => {
  const { field, ...rest } = forwardedProps.value

  const hint =
    field.schema.maxLength === undefined
      ? undefined
      : `${(field.value as string | number | null)?.toString().length ?? 0}/${field.schema.maxLength}`

  return {
    required: field.schema.required,
    label: field.schema.title,
    description: field.schema.description,
    hint,
    ...R.omitBy(rest, (v) => v === undefined),
  }
})

const inputProps = computed(() => {
  const field = forwardedProps.value.field

  const placeholder = field.errors && field.errors.join('\n')

  return {
    'modelValue': field.value,
    'onUpdate:modelValue': (value) => field.handleChange(value),
    'onBlur': () => field.handleBlur(),
    'disabled': field.disabled,
    'loading': field.isPending,
    'modelModifiers': (props.nullable === true
      ? { nullable: true }
      : undefined) as true extends Nullable ? { nullable: true } : undefined,
    placeholder,
  } satisfies InputSlotProps<T, Nullable>
})
</script>

<template>
  <UFormField
    v-bind="formFieldProps"
    :ui="{
      hint: isOverMaxLength ? 'text-error' : '',
    }"
    :error="!!field.errors"
  >
    <template #hint="{ hint }">
      <span class="flex items-center gap-1.5">
        <UPopover
          v-if="!!field.errors"
          mode="hover"
          :open-delay="0"
          :ui="{
            content: 'bg-error-50 ring-error-200! rounded py-1 px-2',
          }"
        >
          <UIcon name="lucide:circle-alert" class="text-error" />
          <template #content>
            <p class="text-(--ui-color-neutral-800) max-w-sm whitespace-normal text-xs">
              {{ field.errors.join('\n') }}
            </p>
          </template>
        </UPopover>

        {{ hint }}
      </span>
    </template>

    <slot v-bind="{ props: inputProps, field: forwardedProps.field }">
      <DevOnly>
        <p class="font-black text-red-500">UField missing slot</p>
      </DevOnly>
    </slot>

    <template v-for="(_, name) in R.omit(slots, ['default'])" #[name]="slotData">
      <!-- @vue-ignore -->
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </UFormField>
</template>

<style scoped>
:deep([aria-invalid='true']) {
  &::placeholder {
    color: var(--ui-color-error-500);
  }
}
</style>
