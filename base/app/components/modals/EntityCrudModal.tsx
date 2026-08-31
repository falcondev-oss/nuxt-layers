import type { FormSchema, FormSourceValues, FormSubmitValues } from '@falcondev-oss/form-core'
import type { DefaultError, UseQueryOptions } from '@tanstack/vue-query'
import type { If, IsNever } from 'type-fest'
import type { VNode } from 'vue'
import { useForm } from '@falcondev-oss/form-vue'
import { useQuery } from '@tanstack/vue-query'
import modalTheme from '#build/ui/modal'
import { Sync, UButton, UForm, UModal } from '#components'

export default defineSetupComponent(
  <
    Schema extends FormSchema,
    QueryData extends NonNullable<FormSourceValues<Schema>>,
    Select extends QueryData = QueryData,
    Id extends string | null = string | null,
  >(_: {
    props: {
      id: Id
      name: string
      schema: Schema
      getQueryOptions: (
        id: Id,
      ) => UseQueryOptions<If<IsNever<Select>, QueryData, any>, DefaultError, Select>
      newValues: NonNullable<FormSourceValues<Schema>>
      mutate: (values: FormSubmitValues<Schema> & { id: Id }) => Promise<unknown>
    }
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
      props: ['id', 'name', 'schema', 'getQueryOptions', 'newValues', 'mutate'],
      emits: ['close'],
      setup: (props, { emit, slots }) => {
        const toast = useToast()
        const appConfig = useAppConfig()

        const { data, isLoading } = useQuery(computed(() => props.getQueryOptions(props.id)))

        const form = useForm({
          schema: props.schema,
          sourceValues: () => {
            if (isLoading.value) return

            return data.value ?? props.newValues
          },
          async submit({ values }) {
            await props.mutate({
              ...values,
              id: props.id,
            })

            emit('close')
            toast.add({
              title: `${props.name} ${props.id ? 'aktualisiert' : 'erstellt'}`,
              color: 'success',
              icon: 'lucide:check',
            })
          },
        })

        const formActionsTeleportId = useId()
        const closeHandle = ref<(() => void) | null>(null)

        return () => (
          <UModal
            close={false}
            title={`${props.name} ${props.id ? 'bearbeiten' : 'erstellen'}`}
            dismissible={false}
            v-slots={vSlots(UModal, {
              actions: () => [
                <UButton
                  class={modalTheme.slots.close}
                  icon={appConfig.ui.icons.close}
                  color="neutral"
                  variant="ghost"
                  aria-label="Schließen"
                  loadingAuto
                  onClick={() => {
                    closeHandle.value?.()
                  }}
                />,
              ],
              body: ({ close }) => [
                <Sync
                  input={close}
                  output={closeHandle.value}
                  onUpdate:output={(value: (() => void) | null) => {
                    closeHandle.value = value
                  }}
                />,
                <UForm
                  class="flex flex-col gap-2"
                  form={form}
                  submitLabel={props.id ? 'Speichern' : 'Erstellen'}
                  actionsTeleportTo={`#${formActionsTeleportId}`}
                  v-slots={{
                    default: () => slots.default?.({ form, data: data.value }) ?? [],
                  }}
                />,
              ],
              footer: () => [
                <div id={formActionsTeleportId} class="flex w-full justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="soft"
                    label="Abbrechen"
                    onClick={() => emit('close')}
                  />
                </div>,
              ],
            })}
          />
        )
      },
    }),
)
