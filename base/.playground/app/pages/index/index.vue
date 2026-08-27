<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { DateRange } from 'reka-ui'

const conflictsOpen = ref(false)

// this page doesn't render the navbar itself, so it adds its tool through the composable
const { addTool } = useToolbar()
addTool({
  label: 'Konflikte anzeigen',
  icon: 'i-lucide-triangle-alert',
  onSelect: () => (conflictsOpen.value = true),
})

type Project = {
  name: string
  customer: string
  status: 'Läuft' | 'Geplant' | 'Pausiert'
  /** ISO date — sorts chronologically as a plain string */
  due: string
  progress: number
}

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

const statusColors = {
  Läuft: 'success',
  Geplant: 'neutral',
  Pausiert: 'warning',
} as const

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
        (p.due >= dueRange.value.start.toString() && p.due <= dueRange.value.end.toString())) &&
      `${p.name} ${p.customer}`.toLowerCase().includes(search.value.toLowerCase()),
  ),
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

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
        ...(value.length ? [{ id, value }] : []),
      ]
    },
  })
}

const statusFilter = useColumnFilter('status')
const customerFilter = useColumnFilter('customer')

const statusOptions = Object.keys(statusColors) as Project['status'][]
const customerOptions = computed(() => [...new Set(projects.value.map((p) => p.customer))])

/**
 * only the slice of the table API `visible` reads — the annotation breaks the type cycle between
 * this ref and the template that renders `visible`
 */
const table = useTemplateRef<{
  $el?: HTMLElement
  tableApi?: { getFilteredRowModel: () => { rows: { original: Project }[] } }
}>('table')

// the column widths are pinned once, so picking filter options can't resize the columns
useStableColumnWidths(table)

/** rows the table actually shows — `filtered` plus whatever the column filters removed */
const visible = computed(
  () =>
    table.value?.tableApi?.getFilteredRowModel().rows.map((row) => row.original) ?? filtered.value,
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
    progress: visible.value.length
      ? Math.round(visible.value.reduce((sum, p) => sum + p.progress, 0) / visible.value.length)
      : 0,
  }
})

/** the browser's own print dialog — `window` isn't in template scope */
function print() {
  window.print()
}

const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

/** headers are rendered by slots, so the column picker needs its own labels */
const columnLabels: Record<string, string> = {
  name: 'Projekt',
  customer: 'Kunde',
  status: 'Status',
  due: 'Fällig',
  progress: 'Fortschritt',
}

function exportCsv() {
  const columns = ['name', 'customer', 'status', 'due', 'progress'] as const
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const csv = [
    columns.map((id) => escape(columnLabels[id]!)),
    ...visible.value.map((project) => columns.map((id) => escape(project[id]))),
  ]
    .map((row) => row.join(';'))
    .join('\n')

  // BOM, so Excel reads the umlauts as UTF-8
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'projekte.csv' })
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
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
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
</script>

<template>
  <URibbonCard>
    <template #ribbon>
      <URibbonSection title="Suche">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Projekt oder Kunde …"
          class="w-56"
        />
      </URibbonSection>

      <URibbonSection title="Kennzahlen">
        <div class="flex items-center gap-3 text-sm tabular-nums">
          <p>
            <span class="text-highlighted font-medium">{{ visible.length }}</span>
            <span class="text-dimmed">/ {{ projects.length }}</span>
          </p>

          <USeparator orientation="vertical" class="h-5" />

          <UTooltip text="Überfällig">
            <p
              class="flex items-center gap-1"
              :class="stats.overdue ? 'text-error' : 'text-dimmed'"
            >
              <UIcon name="i-lucide-alarm-clock" class="size-4" />
              {{ stats.overdue }}
            </p>
          </UTooltip>

          <UTooltip text="Fällig in 7 Tagen">
            <p
              class="flex items-center gap-1"
              :class="stats.dueSoon ? 'text-warning' : 'text-dimmed'"
            >
              <UIcon name="i-lucide-hourglass" class="size-4" />
              {{ stats.dueSoon }}
            </p>
          </UTooltip>

          <USeparator orientation="vertical" class="h-5" />

          <UTooltip text="Ø Fortschritt">
            <div class="flex items-center gap-2">
              <UProgress :model-value="stats.progress" size="sm" class="w-16" />
              <span class="text-dimmed">{{ stats.progress }} %</span>
            </div>
          </UTooltip>
        </div>
      </URibbonSection>

      <URibbonSection
        :title="selected.length ? 'Auswahl exportieren' : 'Export'"
        class="-mx-2"
        end
      >
        <UButton
          icon="i-lucide-file-spreadsheet"
          color="neutral"
          variant="ghost"
          aria-label="Als CSV exportieren"
          :disabled="!visible.length"
          @click="() => exportCsv()"
        />
        <UButton
          icon="i-lucide-printer"
          color="neutral"
          variant="ghost"
          aria-label="Drucken"
          @click="() => print()"
        />
      </URibbonSection>

      <URibbonSection v-if="selected.length" :title="`${selected.length} ausgewählt`" end>
        <UButton
          label="Löschen"
          icon="i-lucide-trash-2"
          color="error"
          @click="() => deleteSelected()"
        />
      </URibbonSection>

      <URibbonSection v-else title="Ansicht" end>
        <UButton
          icon="i-lucide-list"
          color="neutral"
          :variant="view === 'list' ? 'soft' : 'ghost'"
          @click="() => (view = 'list')"
        />
        <UButton
          icon="i-lucide-kanban"
          color="neutral"
          :variant="view === 'kanban' ? 'soft' : 'ghost'"
          @click="() => (view = 'kanban')"
        />
        <UButton
          icon="i-lucide-calendar-days"
          color="neutral"
          :variant="view === 'calendar' ? 'soft' : 'ghost'"
          @click="() => (view = 'calendar')"
        />
      </URibbonSection>
    </template>

    <UTable
      ref="table"
      v-model:row-selection="selection"
      v-model:sorting="sorting"
      v-model:column-filters="columnFilters"
      v-model:column-visibility="columnVisibility"
      :data="filtered"
      :columns="columns"
      :get-row-id="(project) => project.name"
      :ui="{ th: 'align-top', td: 'truncate' }"
    >
      <template #name-header="{ column }">
        <TableColumnHeader :column label="Projekt" />
      </template>

      <template #customer-header="{ column }">
        <TableColumnHeader
          v-model="customerFilter"
          :column
          label="Kunde"
          :items="customerOptions"
          :filtered="customerFilter.length > 0"
          @clear="() => (customerFilter = [])"
        >
          <template #subtitle>{{ customerFilter.join(', ') }}</template>
        </TableColumnHeader>
      </template>

      <template #status-header="{ column }">
        <TableColumnHeader
          v-model="statusFilter"
          :column
          label="Status"
          :items="statusOptions"
          no-search
          :filtered="statusFilter.length > 0"
          @clear="() => (statusFilter = [])"
        >
          <template #subtitle>{{ statusFilter.join(', ') }}</template>

          <template #item-label="{ item }">
            <UBadge
              :label="item"
              :color="statusColors[item as Project['status']]"
              variant="subtle"
              size="sm"
            />
          </template>
        </TableColumnHeader>
      </template>

      <template #due-header="{ column }">
        <TableColumnHeader
          :column
          label="Fällig"
          :filtered="!!dueRangeLabel"
          @clear="() => (dueRange = null)"
        >
          <template v-if="dueRangeLabel" #subtitle>{{ dueRangeLabel }}</template>

          <UCalendar v-model="dueRange" range :number-of-months="2" />
        </TableColumnHeader>
      </template>

      <template #progress-header="{ column }">
        <TableColumnHeader :column label="Fortschritt" />
      </template>

      <template #name-cell="{ row }">
        <span class="font-medium">{{ row.original.name }}</span>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          :label="row.original.status"
          :color="statusColors[row.original.status]"
          variant="subtle"
        />
      </template>

      <template #due-cell="{ row }">
        {{ formatDate(row.original.due) }}
      </template>

      <template #progress-cell="{ row }">
        <UProgress :model-value="row.original.progress" class="w-32" />
      </template>
    </UTable>
  </URibbonCard>

  <UModal
    v-model:open="conflictsOpen"
    title="Konflikte"
    description="2 Projekte überschneiden sich im gewählten Zeitraum."
  >
    <template #body>
      <ul class="text-sm">
        <li>Website Relaunch – 12.03. bis 28.03.</li>
        <li>Shop Migration – 20.03. bis 05.04.</li>
      </ul>
    </template>
    <template #footer>
      <UButton
        label="Schließen"
        color="neutral"
        variant="subtle"
        @click="() => (conflictsOpen = false)"
      />
    </template>
  </UModal>
</template>
