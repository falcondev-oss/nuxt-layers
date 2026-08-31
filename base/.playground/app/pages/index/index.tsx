import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { DateRange } from 'reka-ui'
import {
  TableColumnHeader,
  UBadge,
  UButton,
  UCalendar,
  UCheckbox,
  UDropdownMenu,
  UIcon,
  UInput,
  UModal,
  UProgress,
  URibbonCard,
  URibbonSection,
  USeparator,
  UTable,
  UTooltip,
} from '#components'

type Project = {
  name: string
  customer: string
  status: 'Läuft' | 'Geplant' | 'Pausiert'
  /** ISO date — sorts chronologically as a plain string */
  due: string
  progress: number
}

const statusColors = {
  Läuft: 'success',
  Geplant: 'neutral',
  Pausiert: 'warning',
} as const

/** headers are rendered by slots, so the column picker needs its own labels */
const columnLabels: Record<string, string> = {
  name: 'Projekt',
  customer: 'Kunde',
  status: 'Status',
  due: 'Fällig',
  progress: 'Fortschritt',
}

const bom = '\u{FEFF}'

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'ProjectsPage',
    props: [],
    emits: [],
    setup: () => {
      const conflictsOpen = ref(false)

      // this page doesn't render the navbar itself, so it adds its tool through the composable
      const { addTool } = useToolbar()
      addTool({
        label: 'Konflikte anzeigen',
        icon: 'i-lucide-triangle-alert',
        onSelect: () => (conflictsOpen.value = true),
      })

      const projects = ref<Project[]>([
        {
          name: 'Website Relaunch',
          customer: 'Nordwind GmbH',
          status: 'Läuft',
          due: '2026-03-28',
          progress: 62,
        },
        {
          name: 'Shop Migration',
          customer: 'Bergblick AG',
          status: 'Geplant',
          due: '2026-04-05',
          progress: 0,
        },
        {
          name: 'Intranet Portal',
          customer: 'Stadtwerke Seeblick',
          status: 'Pausiert',
          due: '2026-05-17',
          progress: 35,
        },
      ])

      const search = ref('')
      const view = ref<'list' | 'kanban' | 'calendar'>('list')
      const selection = ref<Record<string, boolean>>({})
      const sorting = ref([{ id: 'due', desc: false }])
      const columnFilters = ref<{ id: string; value: string[] }[]>([])
      const columnVisibility = ref<Record<string, boolean>>({})
      // `shallowRef`, so `ref`'s deep unwrapping doesn't mangle the `DateValue` class types
      const dueRange = shallowRef<DateRange | null>(null)

      const selected = computed(() =>
        Object.keys(selection.value).filter((name) => selection.value[name]),
      )

      function deleteSelected() {
        projects.value = projects.value.filter((p) => !selection.value[p.name])
        selection.value = {}
      }

      function deleteProject(name: string) {
        projects.value = projects.value.filter((p) => p.name !== name)
      }

      const filtered = computed(() =>
        projects.value.filter(
          (p) =>
            // UCalendar reports a half-picked range too, which filters nothing
            (!dueRange.value?.start ||
              !dueRange.value.end ||
              (p.due >= dueRange.value.start.toString() &&
                p.due <= dueRange.value.end.toString())) &&
            `${p.name} ${p.customer}`.toLowerCase().includes(search.value.toLowerCase()),
        ),
      )

      /** the picked range, shown subtly under the column header */
      const dueRangeLabel = computed(() =>
        dueRange.value?.start && dueRange.value.end
          ? `${formatDate(dueRange.value.start.toString())} – ${formatDate(dueRange.value.end.toString())}`
          : null,
      )

      /** two-way access to one column's `arrIncludesSome` filter */
      function useColumnFilter(id: string) {
        return computed<string[]>({
          get: () => columnFilters.value.find((filter) => filter.id === id)?.value ?? [],
          set: (value) => {
            columnFilters.value = [
              ...columnFilters.value.filter((filter) => filter.id !== id),
              ...(value.length > 0 ? [{ id, value }] : []),
            ]
          },
        })
      }

      const statusFilter = useColumnFilter('status')
      const customerFilter = useColumnFilter('customer')

      const statusOptions = Object.keys(statusColors) as Project['status'][]
      const customerOptions = computed(() => [...new Set(projects.value.map((p) => p.customer))])

      /**
       * only the slice of the table API `visible` reads — the annotation breaks the type cycle
       * between this ref and the render function that reads `visible`
       */
      const table = ref<{
        $el?: HTMLElement
        tableApi?: { getFilteredRowModel: () => { rows: { original: Project }[] } }
      }>()

      // the column widths are pinned once, so picking filter options can't resize the columns
      useStableColumnWidths(table)

      /** rows the table actually shows — `filtered` plus whatever the column filters removed */
      const visible = computed(
        () =>
          table.value?.tableApi?.getFilteredRowModel().rows.map((row) => row.original) ??
          filtered.value,
      )

      /** ISO today, so it compares directly against `Project['due']` */
      const today = new Date().toISOString().slice(0, 10)

      const inSevenDays = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

      const stats = computed(() => {
        // paused projects have no live deadline
        const open = visible.value.filter((p) => p.status !== 'Pausiert')
        return {
          overdue: open.filter((p) => p.due < today).length,
          // the next seven days, overdue ones excluded
          dueSoon: open.filter((p) => p.due >= today && p.due <= inSevenDays).length,
          progress:
            visible.value.length > 0
              ? Math.round(
                  visible.value.reduce((sum, p) => sum + p.progress, 0) / visible.value.length,
                )
              : 0,
        }
      })

      function exportCsv() {
        const csvColumns = ['name', 'customer', 'status', 'due', 'progress'] as const
        const csv = [
          csvColumns.map((id) => escapeCsv(columnLabels[id]!)),
          ...visible.value.map((project) => csvColumns.map((id) => escapeCsv(project[id]))),
        ]
          .map((row) => row.join(';'))
          .join('\n')

        // BOM, so Excel reads the umlauts as UTF-8
        const url = URL.createObjectURL(new Blob([bom + csv], { type: 'text/csv' }))
        const link = Object.assign(document.createElement('a'), {
          href: url,
          download: 'projekte.csv',
        })
        link.click()
        URL.revokeObjectURL(url)
      }

      const columns: TableColumn<Project>[] = [
        {
          id: 'select',
          meta: { class: { td: 'w-0', th: 'w-0 *:pt-1.5' } },
          header: ({ table }) =>
            h(UCheckbox, {
              'modelValue': table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : table.getIsAllRowsSelected(),
              // any selection at all → the header checkbox clears it, so partial state needs one click, not two
              'onUpdate:modelValue': () =>
                table.toggleAllRowsSelected(
                  !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected(),
                ),
            }),
          cell: ({ row }) =>
            h(UCheckbox, {
              'modelValue': row.getIsSelected(),
              'onUpdate:modelValue': (value) => row.toggleSelected(!!value),
            }),
        },
        // every header is rendered by its `#<id>-header` slot via `TableColumnHeader`
        { accessorKey: 'name' },
        { accessorKey: 'customer', filterFn: 'arrIncludesSome' },
        { accessorKey: 'status', filterFn: 'arrIncludesSome' },
        // a date range picker needs no `filterFn` — `dueRange` filters the data
        { accessorKey: 'due' },
        { accessorKey: 'progress' },
        {
          id: 'actions',
          meta: { class: { td: 'w-0 text-right', th: 'w-0 text-right' } },
          header: ({ table }) =>
            h(
              UDropdownMenu,
              {
                items: table
                  .getAllColumns()
                  .filter((column) => column.getCanHide() && columnLabels[column.id])
                  .map<DropdownMenuItem>((column) => ({
                    label: columnLabels[column.id],
                    type: 'checkbox',
                    checked: column.getIsVisible(),
                    onUpdateChecked: (checked: boolean) => column.toggleVisibility(checked),
                    // keep the menu open so several columns can be toggled in one go
                    onSelect: (event: Event) => event.preventDefault(),
                  })),
                content: { align: 'end' },
              },
              () =>
                h(UButton, {
                  'icon': 'i-lucide-columns-3',
                  'color': 'neutral',
                  'variant': 'ghost',
                  'aria-label': 'Spalten auswählen',
                }),
            ),
          cell: ({ row }) =>
            h(
              UDropdownMenu,
              {
                items: [
                  {
                    label: 'Löschen',
                    icon: 'i-lucide-trash-2',
                    color: 'error',
                    onSelect: () => deleteProject(row.original.name),
                  },
                ] satisfies DropdownMenuItem[],
                content: { align: 'end' },
              },
              () =>
                h(UButton, {
                  'icon': 'i-lucide-ellipsis-vertical',
                  'color': 'neutral',
                  'variant': 'ghost',
                  'aria-label': `Aktionen für ${row.original.name}`,
                }),
            ),
        },
      ]

      return () => (
        <>
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
                    placeholder="Projekt oder Kunde …"
                    class="w-56"
                  />
                </URibbonSection>,

                <URibbonSection title="Kennzahlen">
                  <div class="flex items-center gap-3 text-sm tabular-nums">
                    <p>
                      <span class="text-highlighted font-medium">{visible.value.length}</span>
                      <span class="text-dimmed">/ {projects.value.length}</span>
                    </p>

                    <USeparator orientation="vertical" class="h-5" />

                    <UTooltip text="Überfällig">
                      <p
                        class={[
                          'flex items-center gap-1',
                          stats.value.overdue ? 'text-error' : 'text-dimmed',
                        ]}
                      >
                        <UIcon name="i-lucide-alarm-clock" class="size-4" />
                        {stats.value.overdue}
                      </p>
                    </UTooltip>

                    <UTooltip text="Fällig in 7 Tagen">
                      <p
                        class={[
                          'flex items-center gap-1',
                          stats.value.dueSoon ? 'text-warning' : 'text-dimmed',
                        ]}
                      >
                        <UIcon name="i-lucide-hourglass" class="size-4" />
                        {stats.value.dueSoon}
                      </p>
                    </UTooltip>

                    <USeparator orientation="vertical" class="h-5" />

                    <UTooltip text="Ø Fortschritt">
                      <div class="flex items-center gap-2">
                        <UProgress modelValue={stats.value.progress} size="sm" class="w-16" />
                        <span class="text-dimmed">{stats.value.progress} %</span>
                      </div>
                    </UTooltip>
                  </div>
                </URibbonSection>,

                <URibbonSection
                  title={selected.value.length > 0 ? 'Auswahl exportieren' : 'Export'}
                  class="-mx-2"
                  end
                >
                  <UButton
                    icon="i-lucide-file-spreadsheet"
                    color="neutral"
                    variant="ghost"
                    aria-label="Als CSV exportieren"
                    disabled={visible.value.length === 0}
                    onClick={() => exportCsv()}
                  />
                  <UButton
                    icon="i-lucide-printer"
                    color="neutral"
                    variant="ghost"
                    aria-label="Drucken"
                    onClick={() => window.print()}
                  />
                </URibbonSection>,

                ...(selected.value.length > 0
                  ? [
                      <URibbonSection title={`${selected.value.length} ausgewählt`} end>
                        <UButton
                          label="Löschen"
                          icon="i-lucide-trash-2"
                          color="error"
                          onClick={() => deleteSelected()}
                        />
                      </URibbonSection>,
                    ]
                  : [
                      <URibbonSection title="Ansicht" end>
                        <UButton
                          icon="i-lucide-list"
                          color="neutral"
                          variant={view.value === 'list' ? 'soft' : 'ghost'}
                          onClick={() => (view.value = 'list')}
                        />
                        <UButton
                          icon="i-lucide-kanban"
                          color="neutral"
                          variant={view.value === 'kanban' ? 'soft' : 'ghost'}
                          onClick={() => (view.value = 'kanban')}
                        />
                        <UButton
                          icon="i-lucide-calendar-days"
                          color="neutral"
                          variant={view.value === 'calendar' ? 'soft' : 'ghost'}
                          onClick={() => (view.value = 'calendar')}
                        />
                      </URibbonSection>,
                    ]),
              ],
              default: () => [
                <UTable
                  ref={table}
                  rowSelection={selection.value}
                  onUpdate:rowSelection={(value) => {
                    selection.value = value ?? {}
                  }}
                  sorting={sorting.value}
                  onUpdate:sorting={(value) => {
                    sorting.value = value ?? []
                  }}
                  columnFilters={columnFilters.value}
                  onUpdate:columnFilters={(value) => {
                    columnFilters.value = value as { id: string; value: string[] }[]
                  }}
                  columnVisibility={columnVisibility.value}
                  onUpdate:columnVisibility={(value) => {
                    columnVisibility.value = value ?? {}
                  }}
                  data={filtered.value}
                  columns={columns}
                  getRowId={(project) => project.name}
                  ui={{ th: 'align-top', td: 'truncate' }}
                  v-slots={vSlots(UTable<Project>, {
                    'name-header': ({ column }) => [
                      <TableColumnHeader column={column} label="Projekt" />,
                    ],

                    'customer-header': ({ column }) => [
                      <TableColumnHeader
                        modelValue={customerFilter.value}
                        onUpdate:modelValue={(value: string[]) => {
                          customerFilter.value = value
                        }}
                        column={column}
                        label="Kunde"
                        items={customerOptions.value}
                        filtered={customerFilter.value.length > 0}
                        onClear={() => (customerFilter.value = [])}
                        v-slots={vSlots(TableColumnHeader, {
                          subtitle: () => [<>{customerFilter.value.join(', ')}</>],
                        })}
                      />,
                    ],

                    'status-header': ({ column }) => [
                      <TableColumnHeader
                        modelValue={statusFilter.value}
                        onUpdate:modelValue={(value: string[]) => {
                          statusFilter.value = value
                        }}
                        column={column}
                        label="Status"
                        items={statusOptions}
                        noSearch
                        filtered={statusFilter.value.length > 0}
                        onClear={() => (statusFilter.value = [])}
                        v-slots={vSlots(TableColumnHeader, {
                          'subtitle': () => [<>{statusFilter.value.join(', ')}</>],
                          'item-label': ({ item }: { item: string }) => [
                            <UBadge
                              label={item}
                              color={statusColors[item as Project['status']]}
                              variant="subtle"
                              size="sm"
                            />,
                          ],
                        })}
                      />,
                    ],

                    'due-header': ({ column }) => [
                      <TableColumnHeader
                        column={column}
                        label="Fällig"
                        filtered={!!dueRangeLabel.value}
                        onClear={() => (dueRange.value = null)}
                        v-slots={vSlots(TableColumnHeader, {
                          ...(dueRangeLabel.value && {
                            subtitle: () => [<>{dueRangeLabel.value}</>],
                          }),
                          default: () => [
                            <UCalendar
                              modelValue={dueRange.value}
                              onUpdate:modelValue={(value) => {
                                dueRange.value = value
                              }}
                              range
                              numberOfMonths={2}
                            />,
                          ],
                        })}
                      />,
                    ],

                    'progress-header': ({ column }) => [
                      <TableColumnHeader column={column} label="Fortschritt" />,
                    ],

                    'name-cell': ({ row }) => [
                      <span class="font-medium">{row.original.name}</span>,
                    ],

                    'status-cell': ({ row }) => [
                      <UBadge
                        label={row.original.status}
                        color={statusColors[row.original.status]}
                        variant="subtle"
                      />,
                    ],

                    'due-cell': ({ row }) => [<>{formatDate(row.original.due)}</>],

                    'progress-cell': ({ row }) => [
                      <UProgress modelValue={row.original.progress} class="w-32" />,
                    ],
                  })}
                />,
              ],
            })}
          />

          <UModal
            open={conflictsOpen.value}
            onUpdate:open={(value) => {
              conflictsOpen.value = value
            }}
            title="Konflikte"
            description="2 Projekte überschneiden sich im gewählten Zeitraum."
            v-slots={vSlots(UModal, {
              body: () => [
                <ul class="text-sm">
                  <li>Website Relaunch – 12.03. bis 28.03.</li>
                  <li>Shop Migration – 20.03. bis 05.04.</li>
                </ul>,
              ],
              footer: () => [
                <UButton
                  label="Schließen"
                  color="neutral"
                  variant="subtle"
                  onClick={() => (conflictsOpen.value = false)}
                />,
              ],
            })}
          />
        </>
      )
    },
  }),
)
