import type { ButtonProps } from '@nuxt/ui'
import { Teleport } from 'vue'
import { z } from 'zod'
import {
  UAttribute,
  UButton,
  UField,
  UForm,
  UInput,
  UPageSection,
  USection,
  UTable,
} from '#components'

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

function Table() {
  return (
    <UTable
      data={rows}
      columns={[
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'role', header: 'Rolle' },
      ]}
    />
  )
}

function SlotAction() {
  return <UButton label="Slot-Aktion" icon="i-lucide-puzzle" size="sm" variant="soft" />
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'PageSectionSandboxPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Page Section Sandbox',
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

      const renderCards = () => [
        <UPageSection title="Nur Titel">
          <Placeholder />
        </UPageSection>,
        <UPageSection title="Mit Icon" icon="i-lucide-star">
          <Placeholder />
        </UPageSection>,
        <UPageSection title="Mit Badge" icon="i-lucide-tag" badge={{ label: 'Standard' }}>
          <Placeholder />
        </UPageSection>,
        <UPageSection
          title="Badge eigene Farbe & Icon"
          icon="i-lucide-tag"
          badge={{ label: 'Neu', color: 'info', icon: 'i-lucide-sparkles' }}
        >
          <Placeholder />
        </UPageSection>,
        <UPageSection
          title="Eine Aktion"
          icon="i-lucide-mouse-pointer-click"
          actions={[{ label: 'Bearbeiten', icon: 'i-lucide-pencil' }]}
        >
          <Placeholder />
        </UPageSection>,
        <UPageSection
          title="Aktion mit eigener Variante & Größe"
          icon="i-lucide-mouse-pointer-click"
          actions={[{ label: 'Speichern', variant: 'solid', size: 'md' }]}
        >
          <Placeholder />
        </UPageSection>,
        <UPageSection
          title="Viele Aktionen (Overflow)"
          icon="i-lucide-ellipsis"
          badge={{ label: '4' }}
          actions={manyActions}
        >
          <Placeholder />
        </UPageSection>,
        <UPageSection
          title="Aktionen per Slot"
          icon="i-lucide-puzzle"
          v-slots={vSlots(UPageSection, {
            actions: () => [<SlotAction />],
            default: () => [<Placeholder />],
          })}
        />,
        <UPageSection
          title="Slot + Aktionen"
          icon="i-lucide-puzzle"
          actions={[{ label: 'Prop-Aktion' }]}
          v-slots={vSlots(UPageSection, {
            actions: () => [<SlotAction />],
            default: () => [<Placeholder />],
          })}
        />,
        <UPageSection title="Teleport in Header" icon="i-lucide-arrow-up-right">
          <HeaderTeleport />
          <Placeholder />
        </UPageSection>,
        <UPageSection
          title="Teleport + Aktionen"
          icon="i-lucide-arrow-up-right"
          actions={[{ label: 'Prop-Aktion' }]}
        >
          <HeaderTeleport />
          <Placeholder />
        </UPageSection>,
        <UPageSection title="Tabelle" icon="i-lucide-table" variant="table">
          <Table />
        </UPageSection>,
        <UPageSection
          title="Tabelle + Teleport"
          icon="i-lucide-table"
          variant="table"
          badge={{ label: String(rows.length) }}
        >
          <HeaderTeleport />
          <Table />
        </UPageSection>,
        <UPageSection title="Formular" icon="i-lucide-square-pen">
          <UForm form={form} submitLabel="Speichern">
            <UField
              field={form.fields.name.$use()}
              v-slots={{ default: ({ bind }) => [<UInput class="w-full" {...bind} />] }}
            />
          </UForm>
        </UPageSection>,
        <UPageSection
          title="Nur Header (ohne Inhalt)"
          icon="i-lucide-panel-top"
          actions={[{ label: 'Aktion' }]}
        />,
        <UPageSection
          title="Ein sehr langer Titel, der zeigt, wie sich der Header verhält, wenn kaum Platz bleibt"
          icon="i-lucide-wrap-text"
          badge={{ label: 'Badge' }}
          actions={manyActions}
        >
          <Placeholder />
        </UPageSection>,
        <UPageSection title="Mit Sections" icon="i-lucide-list">
          <div class="flex flex-col gap-6">
            <USection title="Nur Titel">
              <UAttribute label="Kundennummer">K-10427</UAttribute>
              <UAttribute label="Firma">Nordwind GmbH</UAttribute>
            </USection>
            <USection
              title="Icon + Badge + Aside"
              icon="i-lucide-tag"
              badge={{ label: 'Neu' }}
              aside="2 offen"
            >
              <UAttribute label="Telefon">{null}</UAttribute>
              <UAttribute label="Ort">20457 Hamburg</UAttribute>
            </USection>
            <USection
              title="Eine Aktion"
              icon="i-lucide-mouse-pointer-click"
              actions={[{ label: 'Bearbeiten', icon: 'i-lucide-pencil' }]}
            >
              <UAttribute label="Straße">Hafenstraße 12</UAttribute>
            </USection>
            <USection
              title="Slot + viele Aktionen (Overflow)"
              icon="i-lucide-ellipsis"
              actions={manyActions}
              v-slots={vSlots(USection, {
                actions: () => [
                  <UButton label="Slot-Aktion" icon="i-lucide-puzzle" size="xs" variant="soft" />,
                ],
                default: () => [
                  <UAttribute label="Notiz" wide>
                    Lieferungen nur werktags zwischen 7 und 15 Uhr.
                  </UAttribute>,
                ],
              })}
            />
            <USection
              title="Tabelle"
              icon="i-lucide-table"
              aside={`${rows.length} Einträge`}
              variant="table"
            >
              <Table />
            </USection>
          </div>
        </UPageSection>,
      ]

      return () => (
        <div class="grid grid-cols-1 gap-10 p-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div class="flex flex-col gap-8">
            <h2 class="-mb-5 text-sm font-semibold">Breit</h2>
            {renderCards()}
          </div>
          <div class="flex flex-col gap-8">
            <h2 class="-mb-5 text-sm font-semibold">Schmal (24rem)</h2>
            {renderCards()}
          </div>
        </div>
      )
    },
  }),
)
