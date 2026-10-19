import type { ButtonProps } from '@nuxt/ui'
import { Teleport } from 'vue'
import { z } from 'zod'
import { UButton, UConfigurationCards, UField, UForm, UInput, UTable } from '#components'

const rows = [
  { name: 'Tom Weinhold', role: 'Admin' },
  { name: 'Mara Lindqvist', role: 'Mitglied' },
]

const manyActions: ButtonProps[] = [
  { label: 'Exportieren', icon: 'i-lucide-download' },
  { label: 'Importieren', icon: 'i-lucide-upload' },
  { label: 'Duplizieren', icon: 'i-lucide-copy' },
  { label: 'Löschen', icon: 'i-lucide-trash', color: 'error' },
]

/** Teleports a button into the header of the card it sits in. */
const HeaderTeleport = defineSetupComponent((_: object) =>
  options(_, {
    name: 'HeaderTeleport',
    props: [],
    emits: [],
    setup: () => {
      const target = useCardActionsTarget()

      return () => (
        <Teleport defer disabled={!target} to={target}>
          <UButton icon="i-lucide-user-plus" label="Teleportiert" size="sm" variant="soft" />
        </Teleport>
      )
    },
  }),
)

const Placeholder = () => <p class="text-muted text-sm">Inhalt</p>

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'ConfigurationCardsSandboxPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Konfiguration Sandbox',
      })

      const values = ref({ name: 'Nordwind GmbH' })
      const form = useForm({
        schema: z.object({ name: z.string().min(3).meta({ title: 'Name' }) }),
        sourceValues: () => values.value,
        async submit({ values: next }) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          values.value = next
        },
      })

      const renderCards = () => (
        <UConfigurationCards
          items={[
            { id: 'plain', title: 'Nur Titel' },
            { id: 'icon', title: 'Mit Icon', icon: 'i-lucide-star' },
            {
              id: 'badge',
              title: 'Mit Badge',
              icon: 'i-lucide-tag',
              badge: { label: 'Standard' },
            },
            {
              id: 'badgeCustom',
              title: 'Badge eigene Farbe & Icon',
              icon: 'i-lucide-tag',
              badge: { label: 'Neu', color: 'info', icon: 'i-lucide-sparkles' },
            },
            {
              id: 'action',
              title: 'Eine Aktion',
              icon: 'i-lucide-mouse-pointer-click',
              actions: [{ label: 'Bearbeiten', icon: 'i-lucide-pencil' }],
            },
            {
              id: 'actionOverrides',
              title: 'Aktion mit eigener Variante & Größe',
              icon: 'i-lucide-mouse-pointer-click',
              actions: [{ label: 'Speichern', variant: 'solid', size: 'md' }],
            },
            {
              id: 'manyActions',
              title: 'Viele Aktionen (Overflow)',
              icon: 'i-lucide-ellipsis',
              badge: { label: '4' },
              actions: manyActions,
            },
            { id: 'actionsSlot', title: 'Aktionen per Slot', icon: 'i-lucide-puzzle' },
            {
              id: 'actionsBoth',
              title: 'Slot + Aktionen',
              icon: 'i-lucide-puzzle',
              actions: [{ label: 'Prop-Aktion' }],
            },
            { id: 'teleport', title: 'Teleport in Header', icon: 'i-lucide-arrow-up-right' },
            {
              id: 'teleportAndActions',
              title: 'Teleport + Aktionen',
              icon: 'i-lucide-arrow-up-right',
              actions: [{ label: 'Prop-Aktion' }],
            },
            { id: 'table', title: 'Tabelle', icon: 'i-lucide-table', type: 'table' },
            {
              id: 'tableTeleport',
              title: 'Tabelle + Teleport',
              icon: 'i-lucide-table',
              type: 'table',
              badge: { label: String(rows.length) },
            },
            { id: 'form', title: 'Formular', icon: 'i-lucide-square-pen' },
            {
              id: 'headerOnly',
              title: 'Nur Header (content: false)',
              icon: 'i-lucide-panel-top',
              content: false,
              actions: [{ label: 'Aktion' }],
            },
            { id: 'hidden', title: 'Versteckt (hidden: true)', hidden: true },
            false,
            null,
            {
              id: 'longTitle',
              title:
                'Ein sehr langer Titel, der zeigt, wie sich der Header verhält, wenn kaum Platz bleibt',
              icon: 'i-lucide-wrap-text',
              badge: { label: 'Badge' },
              actions: manyActions,
            },
          ]}
          v-slots={{
            'plain': () => [<Placeholder />],
            'icon': () => [<Placeholder />],
            'badge': () => [<Placeholder />],
            'badgeCustom': () => [<Placeholder />],
            'action': () => [<Placeholder />],
            'actionOverrides': () => [<Placeholder />],
            'manyActions': () => [<Placeholder />],
            'actionsSlot': () => [<Placeholder />],
            'actionsSlot-actions': () => [
              <UButton label="Slot-Aktion" icon="i-lucide-puzzle" size="sm" variant="soft" />,
            ],
            'actionsBoth': () => [<Placeholder />],
            'actionsBoth-actions': () => [<UButton label="Slot-Aktion" size="sm" variant="soft" />],
            'teleport': () => [<HeaderTeleport />, <Placeholder />],
            'teleportAndActions': () => [<HeaderTeleport />, <Placeholder />],
            'table': () => [
              <UTable
                data={rows}
                columns={[
                  { accessorKey: 'name', header: 'Name' },
                  { accessorKey: 'role', header: 'Rolle' },
                ]}
              />,
            ],
            'tableTeleport': () => [
              <HeaderTeleport />,
              <UTable
                data={rows}
                columns={[
                  { accessorKey: 'name', header: 'Name' },
                  { accessorKey: 'role', header: 'Rolle' },
                ]}
              />,
            ],
            'form': () => [
              <UForm form={form} submitLabel="Speichern">
                <UField
                  field={form.fields.name.$use()}
                  v-slots={{ default: ({ bind }) => [<UInput class="w-full" {...bind} />] }}
                />
              </UForm>,
            ],
            'hidden': () => [<Placeholder />],
            'longTitle': () => [<Placeholder />],
          }}
        />
      )

      return () => (
        <div class="grid grid-cols-1 gap-10 p-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div class="flex flex-col gap-3">
            <h2 class="text-sm font-semibold">Breit</h2>
            {renderCards()}
          </div>
          <div class="flex flex-col gap-3">
            <h2 class="text-sm font-semibold">Schmal (24rem)</h2>
            {renderCards()}
          </div>
        </div>
      )
    },
  }),
)
