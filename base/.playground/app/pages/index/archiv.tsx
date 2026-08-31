import type { TableColumn } from '@nuxt/ui'
import { UButton, UInput, URibbonCard, URibbonSection, USelect, UTable } from '#components'

type ArchivedProject = {
  name: string
  customer: string
  archivedAt: string
  hours: number
}

const projects: ArchivedProject[] = [
  { name: 'Kampagne Frühjahr', customer: 'Nordwind GmbH', archivedAt: '14.01.2026', hours: 128 },
  { name: 'App Prototyp', customer: 'Bergblick AG', archivedAt: '03.12.2025', hours: 76 },
  { name: 'CI Redesign', customer: 'Stadtwerke Seeblick', archivedAt: '21.11.2025', hours: 212 },
  { name: 'Newsletter Setup', customer: 'Nordwind GmbH', archivedAt: '08.10.2025', hours: 34 },
  { name: 'Datenmigration', customer: 'Hafen Logistik KG', archivedAt: '30.09.2025', hours: 305 },
  { name: 'Schulungsportal', customer: 'Bergblick AG', archivedAt: '12.08.2025', hours: 96 },
  { name: 'Messeauftritt', customer: 'Hafen Logistik KG', archivedAt: '27.06.2025', hours: 58 },
]

const columns: TableColumn<ArchivedProject>[] = [
  { accessorKey: 'name', header: 'Projekt' },
  { accessorKey: 'customer', header: 'Kunde' },
  { accessorKey: 'archivedAt', header: 'Archiviert am' },
  { accessorKey: 'hours', header: 'Stunden' },
]

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'ArchivPage',
    props: [],
    emits: [],
    setup: () => {
      const downloading = ref(false)

      // a reactive tool: pass a getter and the toolbar follows the state
      const { addTool } = useToolbar()
      addTool(() => ({
        label: downloading.value ? 'Wird heruntergeladen …' : 'Als ZIP herunterladen',
        icon: downloading.value ? 'i-lucide-loader-circle' : 'i-lucide-file-archive',
        disabled: downloading.value,
        ui: downloading.value ? { linkLeadingIcon: 'animate-spin' } : undefined,
        onSelect: () => (downloading.value = true),
      }))

      const search = ref('')
      const customerFilter = ref('Alle')
      const density = ref<'comfortable' | 'compact'>('comfortable')

      const customers = computed(() => ['Alle', ...new Set(projects.map((p) => p.customer))])

      const filtered = computed(() =>
        projects.filter(
          (p) =>
            (customerFilter.value === 'Alle' || p.customer === customerFilter.value) &&
            p.name.toLowerCase().includes(search.value.toLowerCase()),
        ),
      )

      return () => (
        <URibbonCard
          v-slots={vSlots(URibbonCard, {
            ribbon: () => [
              <URibbonSection title="Suche">
                <UInput
                  modelValue={search.value}
                  onUpdate:modelValue={(value) => {
                    search.value = value
                  }}
                  icon="i-lucide-search"
                  placeholder="Archiv durchsuchen …"
                  class="w-56"
                />
              </URibbonSection>,

              <URibbonSection title="Filter">
                <USelect
                  modelValue={customerFilter.value}
                  onUpdate:modelValue={(value) => {
                    customerFilter.value = value
                  }}
                  items={customers.value}
                  icon="i-lucide-building-2"
                  class="w-48"
                />
              </URibbonSection>,

              <URibbonSection title="Ansicht" end>
                <UButton
                  icon="i-lucide-rows-3"
                  color="neutral"
                  variant={density.value === 'comfortable' ? 'soft' : 'ghost'}
                  onClick={() => (density.value = 'comfortable')}
                />
                <UButton
                  icon="i-lucide-rows-4"
                  color="neutral"
                  variant={density.value === 'compact' ? 'soft' : 'ghost'}
                  onClick={() => (density.value = 'compact')}
                />
              </URibbonSection>,
            ],
            default: () => [
              <UTable
                data={filtered.value}
                columns={columns}
                ui={{ td: density.value === 'compact' ? 'py-1' : undefined }}
                v-slots={vSlots(UTable<ArchivedProject>, {
                  'name-cell': ({ row }) => [<span class="font-medium">{row.original.name}</span>],
                  'hours-cell': ({ row }) => [
                    <span class="tabular-nums">{row.original.hours} h</span>,
                  ],
                })}
              />,
            ],
          })}
        />
      )
    },
  }),
)
