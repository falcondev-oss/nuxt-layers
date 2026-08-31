import type {
  AuthFormField,
  AuthFormProps,
  AuthFormSlots,
  FormSchema,
  FormSubmitEvent,
  InferInput,
  InferOutput,
} from '@nuxt/ui'
import type { Reactive } from 'vue'
import NuxtUIAuthForm from '@nuxt/ui/components/AuthForm.vue'

export default defineSetupComponent(
  <T extends FormSchema = FormSchema<object>, F extends AuthFormField = AuthFormField>(_: {
    props: Omit<AuthFormProps<T, F>, 'onSubmit'> & {
      onSubmit?: (event: FormSubmitEvent<InferOutput<T>>) => void | Promise<void>
    }
    // nothing is read here, so every prop reaches `NuxtUIAuthForm` as an inherited attribute
    propKeys: never
    slots: AuthFormSlots<Reactive<InferInput<T>>, F>
  }) =>
    options(_, {
      name: 'UAuthForm',
      props: [],
      emits: [],
      setup:
        (_props, { slots }) =>
        () => <NuxtUIAuthForm v-slots={slots} />,
    }),
)
