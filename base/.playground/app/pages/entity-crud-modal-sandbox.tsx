import { z } from 'zod'
import { EntityCrudModal, UButton, UContainer, UField, UInput } from '#components'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Case = {
  label: string
  load: () => Promise<{ name: string; customer: string }>
  formProps?: { class?: string; successToast?: { description: string } }
}

const cases: Record<string, Case> = {
  slow: {
    label: 'Lädt 5 Sekunden',
    load: async () => {
      await wait(5000)
      return { name: 'Website Relaunch', customer: 'Nordwind GmbH' }
    },
  },
  failing: {
    label: 'Laden schlägt fehl',
    load: async () => {
      await wait(500)
      throw new Error('Das Projekt wurde nicht gefunden.')
    },
  },
  compact: {
    label: 'Enger Abstand',
    load: async () => ({ name: 'Intranet', customer: 'Tom Weinhold' }),
    formProps: { class: 'flex flex-col gap-2' },
  },
  toast: {
    label: 'Toast mit Beschreibung',
    load: async () => ({ name: 'Intranet', customer: 'Tom Weinhold' }),
    formProps: { successToast: { description: 'Die Änderungen sind für alle sichtbar.' } },
  },
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'EntityCrudModalSandboxPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Entity-Modal Sandbox',
      })

      const schema = z.object({
        name: z.string().min(3).meta({ title: 'Projekt' }),
        customer: z.string().min(1).meta({ title: 'Kunde' }),
      })

      const open = ref(false)
      const caseId = ref('slow')

      return () => (
        <UContainer class="flex flex-col items-start gap-4 py-6 text-sm">
          {Object.entries(cases).map(([id, { label }]) => (
            <UButton
              key={id}
              label={label}
              icon="i-lucide-pencil"
              color="neutral"
              variant="outline"
              onClick={() => {
                caseId.value = id
                open.value = true
              }}
            />
          ))}

          <EntityCrudModal
            key={caseId.value}
            open={open.value}
            onUpdate:open={(value) => (open.value = value)}
            id={caseId.value}
            formProps={cases[caseId.value]!.formProps}
            name="Projekt"
            schema={schema}
            getQueryOptions={(id) => ({
              queryKey: ['entity-crud-modal-sandbox', id],
              queryFn: async () => cases[id]!.load(),
              // fail right away instead of after 3 retries
              retry: false,
              // load again on every open
              gcTime: 0,
            })}
            newValues={{ name: '', customer: '' }}
            mutate={async () => wait(1000)}
            v-slots={{
              default: ({ form }) => [
                <UField
                  field={form.fields.name.$use()}
                  v-slots={{ default: ({ bind }) => [<UInput class="w-full" {...bind} />] }}
                />,
                <UField
                  field={form.fields.customer.$use()}
                  v-slots={{ default: ({ bind }) => [<UInput class="w-full" {...bind} />] }}
                />,
              ],
            }}
          />
        </UContainer>
      )
    },
  }),
)
