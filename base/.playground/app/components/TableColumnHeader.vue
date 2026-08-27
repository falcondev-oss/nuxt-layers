<script setup lang="ts">
/** the slice of the TanStack column API this header drives */
type HeaderColumn = {
  getIsSorted: () => false | 'asc' | 'desc'
  toggleSorting: (desc: boolean) => void
  clearSorting: () => void
}

// the reusable templates make the root a fragment, so extra attributes are handed to the popup
// component explicitly
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  column: HeaderColumn
  label: string
  /** whether this column's filter is active — `column.getIsFiltered()` lags a render behind */
  filtered?: boolean
  /**
   * the column's filter options — with them the header filters through a select menu, without them
   * it opens a popover holding whatever the default slot renders
   */
  items?: string[]
  /** the select menu's search input — the options variant only */
  noSearch?: boolean
}>()

const emit = defineEmits<{
  /** clear this column's filter — only fired from the button shown while `filtered` */
  clear: []
}>()

defineSlots<{
  /** the filter controls, shown under the sort options — the popover variant only */
  default?: () => any
  /** the active filter, shown subtly under the column name */
  subtitle?: () => any
  /** every `USelectMenu` item slot is forwarded, e.g. `#item-label` */
  [key: `item${string}`]: (props: any) => any
}>()

/** the picked filter options, only used in the select menu variant */
const model = defineModel<string[]>({ default: () => [] })

/** both variants share their trigger, subtitle and their sorting and clearing controls */
const [DefineTrigger, Trigger] = createReusableTemplate()
const [DefineSubtitle, Subtitle] = createReusableTemplate()
const [DefineSortOptions, SortOptions] = createReusableTemplate()
const [DefineClearButton, ClearButton] = createReusableTemplate()

const sortOptions = [
  { direction: 'asc', label: 'Aufsteigend', icon: 'i-lucide-arrow-up-narrow-wide' },
  { direction: 'desc', label: 'Absteigend', icon: 'i-lucide-arrow-down-wide-narrow' },
] as const

/** clicking the active direction again clears the sorting */
function toggleSorting(direction: 'asc' | 'desc') {
  if (props.column.getIsSorted() === direction) props.column.clearSorting()
  else props.column.toggleSorting(direction === 'desc')
}

const sortedIcon = computed(() => {
  const sorted = props.column.getIsSorted()
  return sorted ? sortOptions.find((option) => option.direction === sorted)!.icon : undefined
})

const slots = useSlots()
/** the item slots the page passed, forwarded to the select menu */
const itemSlots = computed(() =>
  Object.fromEntries(Object.entries(slots).filter(([name]) => name.startsWith('item'))),
)

/** both variants open under the header, left-aligned */
const content = { align: 'start' } as const

/** `as` isn't declared on `USelectMenu` — it reaches Reka's trigger through `$attrs` */
const selectMenuAttrs = { as: 'div' }
</script>

<template>
  <!-- only the column name opens the header — the subtitle below it stays inert -->
  <DefineTrigger>
    <div
      class="hover:bg-elevated data-[state=open]:bg-elevated -mx-2.5 flex w-fit cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left"
    >
      {{ label }}
      <UIcon v-if="sortedIcon" :name="sortedIcon" class="size-4 shrink-0" />
    </div>
  </DefineTrigger>

  <DefineSubtitle>
    <span
      v-if="$slots.subtitle"
      class="text-muted w-full text-xs font-normal wrap-break-word whitespace-normal"
    >
      <UIcon v-if="filtered" name="i-lucide-funnel" class="mr-1 size-3 shrink-0 align-[-1px]" />
      <slot name="subtitle" />
    </span>
  </DefineSubtitle>

  <DefineSortOptions>
    <div class="flex gap-1 p-1">
      <UButton
        v-for="option in sortOptions"
        :key="option.direction"
        :label="option.label"
        :icon="option.icon"
        size="sm"
        :color="column.getIsSorted() === option.direction ? 'primary' : 'neutral'"
        :variant="column.getIsSorted() === option.direction ? 'soft' : 'ghost'"
        @click="() => toggleSorting(option.direction)"
      />
    </div>
  </DefineSortOptions>

  <DefineClearButton>
    <div v-if="filtered" class="p-1">
      <UButton
        label="Filter löschen"
        icon="i-lucide-funnel-x"
        size="sm"
        variant="ghost"
        color="neutral"
        block
        @click="() => emit('clear')"
      />
    </div>
  </DefineClearButton>

  <!-- the options variant: the filter is the select menu's own list -->
  <div v-if="items" class="flex w-full flex-col items-start">
    <ForwardSlots :slots="itemSlots">
      <USelectMenu
        v-bind="{ ...$attrs, ...selectMenuAttrs }"
        v-model="model"
        multiple
        :items
        :search-input="!noSearch"
        :content
        :ui="{ content: 'w-fit min-w-48' }"
        variant="none"
        class="w-fit p-0"
        :trailing="false"
      >
        <Trigger />

        <template #content-top>
          <SortOptions />
          <USeparator />
        </template>

        <template #content-bottom>
          <USeparator v-if="filtered" />
          <ClearButton />
        </template>
      </USelectMenu>
    </ForwardSlots>

    <Subtitle />
  </div>

  <!-- the custom variant: the filter is whatever the page renders into the default slot -->
  <div v-else class="flex w-full flex-col items-start">
    <UPopover v-bind="$attrs" :content>
      <Trigger />

      <template #content>
        <SortOptions />

        <template v-if="$slots.default">
          <USeparator />
          <div class="p-2"><slot /></div>
        </template>

        <template v-if="filtered">
          <USeparator />
          <ClearButton />
        </template>
      </template>
    </UPopover>

    <Subtitle />
  </div>
</template>
