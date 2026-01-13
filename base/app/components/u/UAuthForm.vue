<script
  setup
  lang="ts"
  generic="T extends FormSchema = FormSchema<object>, F extends AuthFormField = AuthFormField"
>
import type {
  AuthFormField,
  AuthFormProps,
  AuthFormSlots,
  FormSchema,
  FormSubmitEvent,
  InferInput,
  InferOutput,
} from '@nuxt/ui'
import type { Merge } from 'type-fest'
import type { Reactive } from 'vue'
import { useForwardProps } from 'reka-ui'

const props = defineProps<
  Merge<
    AuthFormProps<T, F>,
    {
      onSubmit?: (event: FormSubmitEvent<InferOutput<T>>) => void | Promise<void>
    }
  >
>()
const slots = defineSlots<AuthFormSlots<Reactive<InferInput<T>>, F>>()

const forwarded = useForwardProps(props)
</script>

<template>
  <UAuthForm v-bind="forwarded">
    <template v-for="(_, name) in slots" #[name]="slotData">
      <!-- @vue-ignore -->
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </UAuthForm>
</template>
