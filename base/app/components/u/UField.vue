<script setup lang="ts" generic="T">
import type { FormField } from '@falcondev-oss/form-core'
import type { FormFieldProps, FormFieldSlots } from '@nuxt/ui'
import { useForwardProps } from 'reka-ui'
import * as R from 'remeda'

type InputProps<T> = {
  'modelValue': T
  'onUpdate:modelValue': (value: T) => void
  'onBlur': () => void
  'disabled': boolean
  'loading': boolean
  'modelModifiers': { nullable: true }
  'placeholder'?: string
}

const props = defineProps<
  FormFieldProps & {
    field: FormField<T>
  }
>()

const slots = defineSlots<
  {
    default: (slot: {
      bind: InputProps<T>
      model: WritableComputedRef<T>
      field: FormField<T>
    }) => any
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
    field.schema.maxLength === undefined || field.schema.maxLength === field.schema.minLength
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

const bind = computed(() => {
  const field = forwardedProps.value.field

  const placeholder = (field.errors && field.errors.join('\n')) || field.schema.default?.toString()

  return {
    'modelValue': field.value,
    'onUpdate:modelValue': (value) => field.handleChange(value),
    'onBlur': () => field.handleBlur(),
    'disabled': field.disabled,
    'loading': field.isPending,
    placeholder,
    'modelModifiers': { nullable: true },
  } satisfies InputProps<T>
})

const model = computed({
  get() {
    return forwardedProps.value.field.value
  },
  set(value: T) {
    forwardedProps.value.field.handleChange(value)
  },
})

const model_ = { model }
</script>

<template>
  <UFormField
    v-bind="formFieldProps"
    :ui="{
      ...formFieldProps.ui,
      hint: [formFieldProps.ui?.hint ?? '', isOverMaxLength ? 'text-error' : ''].join(' ').trim(),
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
            <div class="text-(--ui-color-neutral-800) max-w-sm text-xs">
              <p v-if="field.errors.length === 1">
                {{ field.errors.join('\n') }}
              </p>

              <ul v-else>
                <li v-for="(error, index) in field.errors" :key="error + index" class="list-inside">
                  {{ error }}
                </li>
              </ul>
            </div>
          </template>
        </UPopover>

        {{ hint }}
      </span>
    </template>

    <template v-if="field.schema.examples" #help>
      <template v-if="Array.isArray(field.schema.examples)">
        <ul>
          <li v-for="(example, index) in field.schema.examples" :key="index">
            {{ example }}
          </li>
        </ul>
      </template>
      <p v-else>
        {{ field.schema.examples }}
      </p>
    </template>

    <slot v-bind="{ bind, model: model_.model, field: forwardedProps.field }">
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
    opacity: 0.5;
  }
}
</style>
