<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

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

const columns: TableColumn<ArchivedProject>[] = [
  { accessorKey: 'name', header: 'Projekt' },
  { accessorKey: 'customer', header: 'Kunde' },
  { accessorKey: 'archivedAt', header: 'Archiviert am' },
  { accessorKey: 'hours', header: 'Stunden' },
]
</script>

<template>
  <URibbonCard>
    <template #ribbon>
      <URibbonSection title="Suche">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Archiv durchsuchen …"
          class="w-56"
        />
      </URibbonSection>

      <URibbonSection title="Filter">
        <USelect
          v-model="customerFilter"
          :items="customers"
          icon="i-lucide-building-2"
          class="w-48"
        />
      </URibbonSection>

      <URibbonSection title="Ansicht" end>
        <UButton
          icon="i-lucide-rows-3"
          color="neutral"
          :variant="density === 'comfortable' ? 'soft' : 'ghost'"
          @click="() => (density = 'comfortable')"
        />
        <UButton
          icon="i-lucide-rows-4"
          color="neutral"
          :variant="density === 'compact' ? 'soft' : 'ghost'"
          @click="() => (density = 'compact')"
        />
      </URibbonSection>
    </template>

    <UTable
      :data="filtered"
      :columns="columns"
      :ui="{ td: density === 'compact' ? 'py-1' : undefined }"
    >
      <template #name-cell="{ row }">
        <span class="font-medium">{{ row.original.name }}</span>
      </template>

      <template #hours-cell="{ row }">
        <span class="tabular-nums">{{ row.original.hours }} h</span>
      </template>
    </UTable>
  </URibbonCard>
</template>
