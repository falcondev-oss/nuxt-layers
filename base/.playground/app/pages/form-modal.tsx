import { z } from 'zod'
import { UButton, UContainer, UField, UFormModal, UInput } from '#components'

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'FormModalPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Formular-Modal',
      })

      const project = ref({ name: 'Website Relaunch', customer: 'Nordwind GmbH' })

      const form = useForm({
        schema: z.object({
          name: z.string().min(3).meta({ title: 'Projekt' }),
          customer: z.string().min(1).meta({ title: 'Kunde' }),
        }),
        sourceValues: () => project.value,
        async submit({ values }) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          project.value = values
        },
      })

      const open = ref(false)

      return () => (
        <UContainer class="flex flex-col items-start gap-4 py-6 text-sm">
          <p>
            {project.value.name} · {project.value.customer}
          </p>
          <UButton label="Bearbeiten" icon="i-lucide-pencil" onClick={() => (open.value = true)} />

          <UFormModal
            open={open.value}
            onUpdate:open={(value) => (open.value = value)}
            title="Projekt bearbeiten"
            form={form}
            formProps={{ successToast: { title: 'Projekt gespeichert' } }}
            v-slots={vSlots(UFormModal, {
              body: () => [
                <UField
                  field={form.fields.name.$use()}
                  v-slots={{ default: ({ bind }) => [<UInput class="w-full" {...bind} />] }}
                />,
                <UField
                  field={form.fields.customer.$use()}
                  v-slots={{ default: ({ bind }) => [<UInput class="w-full" {...bind} />] }}
                />,
              ],
            })}
          />
        </UContainer>
      )
    },
  }),
)
