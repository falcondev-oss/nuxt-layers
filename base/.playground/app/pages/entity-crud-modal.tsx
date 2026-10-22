import { useQueryClient } from '@tanstack/vue-query'
import { z } from 'zod'
import { EntityCrudModal, UButton, UContainer, UField, UInput } from '#components'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'EntityCrudModalPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Entity-Modal',
      })

      const queryClient = useQueryClient()

      const projects = ref<Record<string, { name: string; customer: string }>>({
        p1: { name: 'Website Relaunch', customer: 'Nordwind GmbH' },
        p2: { name: 'Intranet', customer: 'Tom Weinhold' },
      })

      const schema = z.object({
        name: z.string().min(3).meta({ title: 'Projekt' }),
        customer: z.string().min(1).meta({ title: 'Kunde' }),
      })

      const open = ref(false)
      const editId = ref<string | null>(null)

      function openModal(id: string | null) {
        editId.value = id
        open.value = true
      }

      return () => (
        <UContainer class="flex flex-col items-start gap-4 py-6 text-sm">
          <UButton label="Neues Projekt" icon="i-lucide-plus" onClick={() => openModal(null)} />
          {Object.entries(projects.value).map(([id, project]) => (
            <div key={id} class="flex items-center gap-2">
              <span>
                {project.name} · {project.customer}
              </span>
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                aria-label="Bearbeiten"
                onClick={() => openModal(id)}
              />
            </div>
          ))}

          <EntityCrudModal
            // a fresh form per entity, so a previous entity's state isn't carried over
            key={editId.value ?? 'new'}
            open={open.value}
            onUpdate:open={(value) => (open.value = value)}
            id={editId.value}
            name="Projekt"
            schema={schema}
            getQueryOptions={(id) => ({
              queryKey: ['entity-crud-modal', id],
              queryFn: async () => {
                await wait(500)
                return projects.value[id!]!
              },
              enabled: id !== null,
            })}
            newValues={{ name: '', customer: '' }}
            mutate={async ({ id, ...values }) => {
              await wait(1000)
              projects.value[id ?? crypto.randomUUID()] = values
              await queryClient.invalidateQueries({ queryKey: ['entity-crud-modal'] })
            }}
            // a plain object, as `vSlots()` would type the slot with the unbound generic schema
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
