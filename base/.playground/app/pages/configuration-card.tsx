import { Teleport } from 'vue'
import { z } from 'zod'
import {
  UButton,
  UConfigurationCard,
  UContainer,
  UField,
  UForm,
  UInput,
  USwitch,
  UTable,
} from '#components'

const members = [
  { name: 'Tom Weinhold', role: 'Admin' },
  { name: 'Mara Lindqvist', role: 'Mitglied' },
]

/** Stands in for a table that teleports its own header actions into the card. */
const MembersTable = defineSetupComponent((_: object) =>
  options(_, {
    name: 'MembersTable',
    props: [],
    emits: [],
    setup: () => {
      const target = useCardActionsTarget()

      return () => (
        <>
          <Teleport defer disabled={!target} to={target}>
            <UButton icon="i-lucide-user-plus" label="Einladen" size="sm" variant="soft" />
          </Teleport>
          <UTable
            data={members}
            columns={[
              { accessorKey: 'name', header: 'Name' },
              { accessorKey: 'role', header: 'Rolle' },
            ]}
          />
        </>
      )
    },
  }),
)

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'ConfigurationCardPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Konfiguration',
      })

      const organisation = ref({ name: 'Nordwind GmbH' })
      const form = useForm({
        schema: z.object({
          name: z.string().min(3).meta({ title: 'Name' }),
        }),
        sourceValues: () => organisation.value,
        async submit({ values }) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          organisation.value = values
        },
      })

      const notifications = ref(true)
      const showBeta = ref(false)

      return () => (
        <UContainer class="flex max-w-3xl flex-col gap-8 py-6">
          <UConfigurationCard title="Organisation" icon="i-lucide-building-2">
            <UForm form={form} submitLabel="Speichern">
              <UField
                field={form.fields.name.$use()}
                v-slots={{ default: ({ bind }) => [<UInput class="w-full" {...bind} />] }}
              />
            </UForm>
          </UConfigurationCard>

          <UConfigurationCard
            title="Mitglieder"
            icon="i-lucide-users"
            type="table"
            badge={{ label: String(members.length) }}
          >
            <MembersTable />
          </UConfigurationCard>

          <UConfigurationCard
            title="Benachrichtigungen"
            icon="i-lucide-bell"
            actions={[
              { label: 'Beta anzeigen', onClick: () => (showBeta.value = !showBeta.value) },
            ]}
            v-slots={vSlots(UConfigurationCard, {
              actions: () => [
                <UButton icon="i-lucide-send" label="Test senden" size="sm" variant="soft" />,
              ],
              default: () => [
                <USwitch
                  label="E-Mail bei neuen Aufgaben"
                  modelValue={notifications.value}
                  onUpdate:modelValue={(value) => (notifications.value = value)}
                />,
              ],
            })}
          />

          {showBeta.value ? (
            <UConfigurationCard
              title="Beta"
              icon="i-lucide-flask-conical"
              badge={{ label: 'Neu', color: 'info' }}
            />
          ) : null}
        </UContainer>
      )
    },
  }),
)
