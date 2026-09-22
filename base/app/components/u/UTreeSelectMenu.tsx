import type { SelectMenuProps } from '@nuxt/ui'
import type { VNode } from 'vue'
import { UButton, UCheckbox, UIcon, UInput, UModal, USelectMenu, UTabs } from '#components'

export type TreeSelectMenuItem = { label: string; value: string; hint: string }
export type TreeSelectMenuFilter = { label: string; value: string }

type ItemRow<T> = T & { indent?: number }

// A group header is an ordinary item, not a `type: 'label'` entry, because only items
// reach the `item` slot — and so can carry a checkbox.
type GroupRow = {
  type: 'group'
  label: string
  value: string
  values: string[]
  collapsed: boolean
  onSelect: (event: Event) => void
  hint?: never
}

const groupBox = 'p-0 rounded-md border border-default overflow-hidden'

// NUL can't appear in a value coming from `items`, so a group row never collides with one.
const groupValue = (index: number) => `\0${index}`

export default defineSetupComponent(
  <T extends TreeSelectMenuItem, F extends TreeSelectMenuFilter = TreeSelectMenuFilter>(_: {
    props: Omit<
      SelectMenuProps<(ItemRow<T> | GroupRow)[][], 'value', true>,
      'items' | 'valueKey' | 'labelKey' | 'descriptionKey' | 'modelValue' | 'defaultValue'
    > & {
      items: T[]
      // group label → the values of the items it holds
      groups: Record<string, string[]>
      filters?: readonly F[]
      // only called while at least one filter is selected
      filterFn?: (item: T, filters: F[]) => boolean
      // `null` elements only ever arrive from a form binding, which types every value of a
      // draft as nullable; nothing here ever emits one.
      modelValue?: (string | null)[] | null
      onBlur?: () => void
    }
    slots: {
      'prefix': (props: { item: T }) => VNode[]
      'suffix': (props: { item: T }) => VNode[]
      'hint': (props: { item: T }) => VNode[]
      'filter-item': (props: { item: F }) => VNode[]
      // replaces the filter select; spread the props onto the replacement to bind the selection
      'filter': (props: {
        'filters': readonly F[]
        'modelValue': string[]
        'onUpdate:modelValue': (value: string[]) => void
      }) => VNode[]
    }
    // the rest reaches `USelectMenu` as inherited attributes
    propKeys: 'items' | 'groups' | 'filters' | 'filterFn' | 'modelValue'
    emits: { 'update:modelValue': (value: (string | null)[]) => void }
  }) =>
    options(_, {
      name: 'UTreeSelectMenu',
      props: ['items', 'groups', 'filters', 'filterFn', 'modelValue'],
      emits: ['update:modelValue'],
      // two roots (the menu and its mobile sheet), so the attributes are placed by hand
      inheritAttrs: false,
      setup: (props, { emit, attrs, slots }) => {
        // `USelectMenu`'s own filter would drop the group headers, so we filter ourselves.
        const searchTerm = ref('')

        const view = ref<'tree' | 'list'>('tree')

        const filterValues = ref<string[]>([])

        // On small screens the menu opens as a fullscreen sheet that edits a draft
        const isMobile = useMediaQuery('(max-width: 639px)')
        const draft = ref<Set<string>>()

        // Set as it opens: below the trigger while it sits in the top third of the viewport,
        // where there's room to grow down, otherwise beside it, so the list keeps its height.
        const menu = ref<{ triggerRef?: HTMLElement }>()
        const isBeside = ref(false)
        const isOpen = ref(false)

        function place() {
          const top = menu.value?.triggerRef?.getBoundingClientRect().top ?? 0
          isBeside.value = top >= window.innerHeight / 2
        }

        const committed = computed(
          () => new Set(props.modelValue?.filter((value) => value !== null)),
        )
        const selected = computed(() => draft.value ?? committed.value)

        function update(next: Set<string>) {
          if (draft.value) draft.value = next
          else emit('update:modelValue', [...next])
        }

        function toggle(value: string) {
          const next = new Set(selected.value)
          if (!next.delete(value)) next.add(value)
          update(next)
        }

        function toggleGroup(values: string[]) {
          const next = new Set(selected.value)
          const isFullySelected = values.every((value) => next.has(value))
          for (const value of values) {
            if (isFullySelected) next.delete(value)
            else next.add(value)
          }
          update(next)
        }

        // group labels; a search shows every group expanded, so its matches are visible
        const collapsed = ref(new Set<string>())

        function toggleCollapsed(label: string) {
          const next = new Set(collapsed.value)
          if (!next.delete(label)) next.add(label)
          collapsed.value = next
        }

        function openSheet() {
          searchTerm.value = ''
          draft.value = new Set(committed.value)
        }

        function closeSheet(save: boolean) {
          if (save && draft.value) emit('update:modelValue', [...draft.value])
          draft.value = undefined
          attrs.onBlur?.()
        }

        const grouped = computed<(ItemRow<T> | GroupRow)[][]>(() => {
          const search = searchTerm.value.trim().toLowerCase()
          const matches = (label: string) => label.toLowerCase().includes(search)

          const active = props.filters?.filter(({ value }) => filterValues.value.includes(value))
          const passes = (item: T) =>
            !active?.length || !props.filterFn || props.filterFn(item, active)

          if (view.value === 'list') {
            const rows = props.items
              .filter((item) => passes(item) && matches(item.label))
              .toSorted((a, b) => a.label.localeCompare(b.label))
            // an empty group would still draw its box
            return rows.length > 0 ? [rows] : []
          }

          const byValue = new Map(props.items.map((item) => [item.value, item]))

          // one menu group each, so each renders as its own box
          const groups = Object.entries(props.groups).map<(ItemRow<T> | GroupRow)[]>(
            ([label, groupValues], index) => {
              const claimed = groupValues.filter((value) => byValue.has(value))
              // `values` stays the whole group so a search never changes what the header checkbox
              // says or what clicking it does; only the rows below it are filtered. The filter does
              // narrow it — toggling a group must not select what the filter hides.
              const values = claimed.filter((value) => passes(byValue.get(value)!))
              const items = claimed.flatMap((value) => {
                const item = byValue.get(value)!
                byValue.delete(value)
                // A matching group label keeps the whole group, so the group is searchable too.
                return passes(item) && (matches(label) || matches(item.label)) ? item : []
              })
              if (items.length === 0) return []
              const isCollapsed = !search && collapsed.value.has(label)

              return [
                {
                  type: 'group' as const,
                  label,
                  value: groupValue(index),
                  values,
                  collapsed: isCollapsed,
                  onSelect: (event: Event) => {
                    // let the row toggle its whole group instead of selecting itself
                    event.preventDefault()
                    toggleGroup(values)
                  },
                },
                ...(isCollapsed ? [] : items.map((item) => ({ ...item, indent: 1 }))),
              ]
            },
          )

          // Whatever no group claimed still has to be selectable, so it trails ungrouped.
          const ungrouped = [...byValue.values()].filter(
            (item) => passes(item) && matches(item.label),
          )
          return [...groups, ungrouped].filter((rows) => rows.length > 0)
        })

        const filterBar = () => (
          <div class="border-default relative z-10 order-1 flex items-center justify-between gap-2 border-b px-2.5 py-1.5">
            {props.filters && slots.filter ? (
              slots.filter({
                'filters': props.filters,
                'modelValue': filterValues.value,
                'onUpdate:modelValue': (value) => (filterValues.value = value),
              })
            ) : props.filters ? (
              <USelectMenu
                size="xs"
                class="w-40"
                valueKey="value"
                icon="lucide:funnel"
                placeholder="Filter"
                multiple
                clear
                searchInput={false}
                // Portaled out of our content, focus moving into it would count as
                // leaving the menu — the search input's blur handler would close it.
                portal={false}
                // only read, but `USelectMenu` types `items` as mutable
                items={props.filters as F[]}
                v-model={filterValues.value}
                v-slots={{
                  'item-label': slots['filter-item']
                    ? ({ item }: { item: F }) => slots['filter-item']!({ item })
                    : undefined,
                }}
              />
            ) : (
              <div />
            )}
            <UTabs
              size="xs"
              content={false}
              class="w-auto"
              items={[
                { value: 'tree', icon: 'lucide:folder-tree' },
                { value: 'list', icon: 'lucide:list' },
              ]}
              v-model={view.value}
            />
          </div>
        )

        const itemContent = (item: ItemRow<T> | GroupRow) =>
          'type' in item
            ? [
                <UCheckbox
                  size="md"
                  class="pointer-events-none shrink-0"
                  modelValue={
                    item.values.length > 0 &&
                    item.values.every((value) => selected.value.has(value))
                      ? true
                      : item.values.some((value) => selected.value.has(value))
                        ? 'indeterminate'
                        : false
                  }
                />,
                <span class="text-highlighted truncate text-sm font-semibold">{item.label}</span>,
                <button
                  type="button"
                  class="text-muted hover:text-highlighted hover:bg-accented -my-1 ms-auto flex rounded-md p-1"
                  aria-label={item.collapsed ? 'Aufklappen' : 'Zuklappen'}
                  aria-expanded={!item.collapsed}
                  // keeps focus in the search input, whose blur would close the menu
                  onMousedown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    // the row's own click would toggle the group's selection
                    event.stopPropagation()
                    toggleCollapsed(item.label)
                  }}
                >
                  <UIcon
                    name={item.collapsed ? 'lucide:chevron-right' : 'lucide:chevron-down'}
                    class="size-5"
                  />
                </button>,
              ]
            : [
                // A spacer rather than padding on the row: switching views patches the
                // node away, where a class on the reused item component stayed behind.
                item.indent ? (
                  <div class="shrink-0" style={{ width: `${item.indent * 0.5}rem` }} />
                ) : undefined,
                <UCheckbox
                  size="md"
                  class="pointer-events-none shrink-0"
                  modelValue={selected.value.has(item.value)}
                />,
                ...(slots.prefix?.({ item }) ?? []),
                <span class="truncate">{item.label}</span>,
                ...(slots.suffix?.({ item }) ?? []),
                <span class="text-muted ms-auto text-xs">
                  {slots.hint?.({ item }) ?? item.hint}
                </span>,
              ]

        return () => [
          <USelectMenu
            {...attrs}
            // reka decides at mount whether `open` is controlled, and the media query
            // only settles after mount, so remount when it flips
            key={isMobile.value ? 'mobile' : 'desktop'}
            ref={menu}
            // held shut on mobile, where opening shows the sheet instead
            open={!isMobile.value && isOpen.value}
            onUpdate:open={(open: boolean) => {
              if (isMobile.value) return open && openSheet()
              isOpen.value = open
              if (open) place()
            }}
            items={grouped.value}
            valueKey="value"
            multiple
            ignoreFilter
            v-model:searchTerm={searchTerm.value}
            searchInput={{ type: 'search' }}
            // Beside, it prefers the right (reka flips it left when that lacks room), its bottom
            // flush with the trigger's so it grows upwards. Below, it outgrows the trigger, so
            // it stays flush with the trigger's left edge.
            content={
              isBeside.value ? { side: 'right', align: 'end' } : { side: 'bottom', align: 'start' }
            }
            ui={{
              group: groupBox,
              // striped like a table, from the group's header on; the stripe covers the default
              // highlight (a `before` layer behind the row), so the highlight moves onto the row too
              item: 'items-center py-2 rounded-none border-b border-default last:border-b-0 even:bg-elevated/30 data-highlighted:not-data-disabled:bg-elevated',
              // grow with the list instead of the 15rem default, up to what fits on screen, and to
              // at least 24rem — below, also to at least the trigger's width
              content: [
                'max-h-(--reka-combobox-content-available-height) w-max max-w-(--reka-combobox-content-available-width)',
                isBeside.value
                  ? 'min-w-96'
                  : 'min-w-[max(var(--reka-combobox-trigger-width),24rem)]',
              ].join(' '),
              empty: 'order-2',
              // collapsing a group can end the overflow; keep the scrollbar's space so nothing shifts
              viewport: 'order-2 scrollbar-gutter-stable divide-y-0 space-y-3 p-2',
            }}
            modelValue={[...committed.value]}
            onUpdate:modelValue={(value) => emit('update:modelValue', value)}
            v-slots={{
              // `content-top` renders above the search input, so flex order puts the row below it.
              // `z-10` keeps the unportaled filter dropdown above the `relative` viewport after it.
              'content-top': filterBar,
              // selections already apply as they're made, so saving just closes the menu
              'content-bottom': () => [
                <div
                  class="border-default order-3 flex border-t p-2"
                  // keeps focus in the search input, whose blur would close the menu first
                  onMousedown={(event) => event.preventDefault()}
                >
                  <UButton
                    class="flex-1 justify-center"
                    label={`${selected.value.size} auswählen`}
                    onClick={() => {
                      // closing through the prop skips `USelectMenu`'s own blur
                      isOpen.value = false
                      attrs.onBlur?.()
                    }}
                  />
                </div>,
              ],
              'default': ({ ui }: { ui: { placeholder: () => string; value: () => string } }) => {
                const labels = [...committed.value].map(
                  (value) => props.items.find((item) => item.value === value)?.label ?? value,
                )
                if (labels.length === 0)
                  return [<span class={ui.placeholder()}>{attrs.placeholder ?? '\u{A0}'}</span>]

                return [
                  <span class={ui.value()}>
                    {labels.length > 3 ? `${labels.length} ausgewählt` : labels.join(', ')}
                  </span>,
                ]
              },
              'item': ({ item }: { item: ItemRow<T> | GroupRow }) => itemContent(item),
            }}
          />,
          isMobile.value && (
            <UModal
              fullscreen
              close={false}
              open={!!draft.value}
              onUpdate:open={(open) => !open && closeSheet(false)}
              ui={{
                // a column so the results can sit at the bottom, next to the search in thumb reach
                body: 'flex flex-col p-4 scrollbar-gutter-stable',
                // filter and search sit above the buttons, in thumb reach
                footer: 'flex-col items-stretch gap-0 p-0',
              }}
              v-slots={vSlots(UModal, {
                // `mt-auto` rather than `justify-end`, which would clip the top once the list overflows
                body: () => [
                  <div class="mt-auto">
                    {grouped.value.length === 0 ? (
                      <p class="text-muted p-4 text-center text-sm">Keine Treffer</p>
                    ) : (
                      <div class="space-y-3">
                        {grouped.value.map((rows) => (
                          <div class={groupBox}>
                            {rows.map((item) => (
                              // not a <button>: a group row holds the collapse button
                              <div
                                role="button"
                                class="border-default even:bg-elevated/30 flex w-full items-center gap-1.5 border-b px-2.5 py-3.5 text-start text-sm last:border-b-0"
                                onClick={() =>
                                  'type' in item ? toggleGroup(item.values) : toggle(item.value)
                                }
                              >
                                {itemContent(item)}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>,
                ],
                footer: () => [
                  // wrapped, since the row's `order-1` would put it below its siblings here
                  <div>{filterBar()}</div>,
                  <UInput
                    v-model={searchTerm.value}
                    type="search"
                    icon="lucide:search"
                    placeholder={attrs.placeholder ?? 'Suchen…'}
                    variant="none"
                    class="border-default border-b px-1 py-2"
                  />,
                  <div class="flex gap-1.5 p-4">
                    <UButton
                      class="flex-1 justify-center"
                      color="neutral"
                      variant="outline"
                      label="Abbrechen"
                      onClick={() => closeSheet(false)}
                    />
                    <UButton
                      class="flex-1 justify-center"
                      label={`${draft.value?.size ?? 0} auswählen`}
                      onClick={() => closeSheet(true)}
                    />
                  </div>,
                ],
              })}
            />
          ),
        ]
      },
    }),
)
