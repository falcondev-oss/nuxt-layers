import type { FormSchema, FormSourceValues, FormSubmitValues } from '@falcondev-oss/form-core'
import type { ModalEmits, ModalProps } from '@nuxt/ui'
import type { DefaultError, UseQueryOptions } from '@tanstack/vue-query'
import type { If, IsNever } from 'type-fest'
import type { EmitsToProps, VNode } from 'vue'
import type { UFormModalFormProps } from '../u/UFormModal'
import { useForm } from '@falcondev-oss/form-vue'
import { useQuery } from '@tanstack/vue-query'
import { UAlert, UFormModal } from '#components'

export default defineSetupComponent(
  <
    Schema extends FormSchema,
    QueryData extends NonNullable<FormSourceValues<Schema>>,
    Select extends QueryData = QueryData,
    Id extends string | null = string | null,
  >(_: {
    props: ModalProps &
      EmitsToProps<AsEmits<ModalEmits>> & {
        id: Id
        name: string
        schema: Schema
        getQueryOptions: (
          id: Id,
        ) => UseQueryOptions<If<IsNever<Select>, QueryData, any>, DefaultError, Select>
        newValues: NonNullable<FormSourceValues<Schema>>
        mutate: (values: FormSubmitValues<Schema> & { id: Id }) => Promise<unknown>
        // merged over the entity defaults (submit label, success toast)
        formProps?: UFormModalFormProps
      }
    // the rest (`open`, any `UModal` prop) falls through to `UFormModal`
    propKeys: 'id' | 'name' | 'schema' | 'getQueryOptions' | 'newValues' | 'mutate' | 'formProps'
    emits: {
      close: () => void
    }
    slots: {
      default: (props: {
        form: ReturnType<typeof useForm<Schema>>
        data: Select | undefined
      }) => VNode[]
    }
  }) =>
    options(_, {
      name: 'EntityCrudModal',
      props: ['id', 'name', 'schema', 'getQueryOptions', 'newValues', 'mutate', 'formProps'],
      emits: ['close'],
      setup: (props, { emit, slots }) => {
        const { data, error, isLoading } = useQuery(computed(() => props.getQueryOptions(props.id)))

        const form = useForm({
          schema: props.schema,
          sourceValues: () => {
            // a failed edit query must not offer `newValues` to save over the entity
            if (props.id) return data.value
            // a create query (e.g. server-side defaults) is waited for, a disabled or failed one falls back
            if (isLoading.value) return
            return data.value ?? props.newValues
          },
          async submit({ values }) {
            await props.mutate({
              ...values,
              id: props.id,
            })
          },
        })

        // closing, saving and the discard guard are `UFormModal`'s, this only adds the entity copy
        return () => (
          <UFormModal
            title={`${props.name} ${props.id ? 'bearbeiten' : 'erstellen'}`}
            form={form}
            formProps={{
              submitLabel: props.id ? 'Speichern' : 'Erstellen',
              ...props.formProps,
              // merged, so a caller's description doesn't drop the entity title
              successToast: {
                title: `${props.name} ${props.id ? 'aktualisiert' : 'erstellt'}`,
                ...props.formProps?.successToast,
              },
            }}
            // resolves a `useOverlay` promise without waiting for the leave transition
            onUpdate:open={(open) => {
              if (!open) emit('close')
            }}
            v-slots={vSlots(UFormModal, {
              body: () => [
                ...(props.id && error.value
                  ? [
                      <UAlert
                        color="error"
                        variant="subtle"
                        icon="lucide:circle-x"
                        title={`${props.name} konnte nicht geladen werden`}
                        description={error.value.message}
                      />,
                    ]
                  : []),
                ...(slots.default?.({ form, data: data.value }) ?? []),
              ],
            })}
          />
        )
      },
    }),
)
