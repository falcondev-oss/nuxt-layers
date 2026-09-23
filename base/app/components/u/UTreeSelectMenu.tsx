import type { InputProps, SelectMenuProps } from '@nuxt/ui'
import type { FunctionalComponent, VNode } from 'vue'
import { Slot } from 'reka-ui'
import { chunk } from 'remeda'
import { h, Teleport } from 'vue'
import { UButton, UCheckbox, UIcon, UInput, UModal, USelectMenu, UTabs } from '#components'

export type TreeSelectMenuItem = {
  label: string
  value: string
  hint: string
  description?: string
  // extra text the search matches, besides the label
  search?: string
}
export type TreeSelectMenuFilter = { label: string; value: string }
export type TreeSelectMenuGroup = { label: string; values: string[] }

type ItemRow<T> = T & { indent?: number }

type GroupRow = {
  type: 'group'
  label: string
  value: string
  values: string[]
  collapsed: boolean
  // leftover items' group; styled muted
  ungrouped?: boolean
  hint?: never
}

const groupBox = 'p-0 rounded-md border border-default overflow-hidden'

// NUL can't appear in a value coming from `items`, so a group row never collides with one.
const groupValue = (index: number) => `\0${index}`

// `URadioGroup`'s radio look; it only renders whole groups
function radio(checked: boolean) {
  return (
    <span class="ring-accented pointer-events-none size-4 shrink-0 overflow-hidden rounded-full ring ring-inset">
      {checked && (
        <span class="bg-primary after:bg-default flex size-full items-center justify-center after:size-1.5 after:rounded-full" />
      )}
    </span>
  )
}

// the trigger's props for the custom trigger, minus the input's class
const CustomTrigger: FunctionalComponent = (_, { attrs: { class: __, ...attrs }, slots }) =>
  h(Slot, attrs, slots)
CustomTrigger.inheritAttrs = false

function loadingNote() {
  return (
    <span class="inline-flex items-center gap-1.5">
      <UIcon name="lucide:loader-circle" class="size-4 shrink-0 animate-spin" />
      Wird geladen…
    </span>
  )
}

export default defineSetupComponent(
  <
    T extends TreeSelectMenuItem,
    F extends TreeSelectMenuFilter = TreeSelectMenuFilter,
    Single extends boolean = false,
  >(_: {
    props: Omit<
      SelectMenuProps<(ItemRow<T> | GroupRow)[][], 'value', true>,
      | 'items'
      | 'valueKey'
      | 'labelKey'
      | 'descriptionKey'
      | 'modelValue'
      | 'defaultValue'
      | 'disabled'
      | 'loading'
      | 'clear'
    > & {
      items: T[]
      // without, a flat list with no view toggle
      groups?: TreeSelectMenuGroup[]
      // list ungrouped items flat below
      listUngrouped?: boolean
      // label for the group of ungrouped items
      ungroupedLabel?: string
      filters?: readonly F[]
      // only called while at least one filter is selected
      filterFn?: (item: T, filters: F[]) => boolean
      single?: Single
      // multiple: `null` only from form bindings, never emitted
      modelValue?: (Single extends true ? string : (string | null)[]) | null
      // awaited before emit, spinner meanwhile. throws: no emit, stays open; single restores
      // pick, multiple keeps picks
      onChange?: (value: Single extends true ? string | null : string[]) => Promise<void> | void
      onBlur?: () => void
      disabled?: boolean
      // items/groups loading: trigger spinner, loading note instead of no matches
      loading?: boolean
      // save button label by pick count
      submitLabel?: (count: number) => string
      // single: clear button label
      deselectLabel?: string
      // clear x in the trigger; single: also the clear button
      clear?: boolean
      // no search input, in the dropdown and the sheet
      hideSearch?: boolean
    }
    slots: {
      // custom trigger, e.g. a button; no clear x or spinner
      'default': (props: { open: boolean }) => VNode[]
      'prefix': (props: { item: T }) => VNode[]
      'description': (props: { item: T }) => VNode[]
      'suffix': (props: { item: T }) => VNode[]
      'hint': (props: { item: T }) => VNode[]
      'filter-item': (props: { item: F }) => VNode[]
      // trigger with more than one pick; default "N ausgewählt"
      'selected': (props: { items: T[] }) => VNode[]
      // replaces the filter select; spread the props onto the replacement to bind the selection
      'filter': (props: {
        'filters': readonly F[]
        'modelValue': string[]
        'onUpdate:modelValue': (value: string[]) => void
      }) => VNode[]
    }
    // the rest reaches `USelectMenu` as inherited attributes
    propKeys:
      | 'items'
      | 'groups'
      | 'listUngrouped'
      | 'ungroupedLabel'
      | 'filters'
      | 'filterFn'
      | 'single'
      | 'modelValue'
      | 'onChange'
      | 'disabled'
      | 'loading'
      | 'submitLabel'
      | 'deselectLabel'
      | 'clear'
      | 'hideSearch'
    emits: {
      'update:modelValue': (value: Single extends true ? string | null : (string | null)[]) => void
    }
  }) =>
    options(_, {
      name: 'UTreeSelectMenu',
      props: [
        'items',
        'groups',
        'listUngrouped',
        'ungroupedLabel',
        'filters',
        'filterFn',
        'single',
        'modelValue',
        'onChange',
        'disabled',
        'loading',
        'submitLabel',
        'deselectLabel',
        'clear',
        'hideSearch',
      ],
      emits: ['update:modelValue'],
      // two roots (the menu and its mobile sheet), so the attributes are placed by hand
      inheritAttrs: false,
      setup: (props, { emit, attrs, slots }) => {
        // `USelectMenu`'s own filter would drop the group headers, so we filter ourselves.
        const searchTerm = ref('')

        const view = ref<'tree' | 'list'>('tree')
        const hasGroups = computed(() => !!props.groups?.length)
        // groups gone: reset, so they return in the tree
        watch(hasGroups, (has) => {
          if (!has) view.value = 'tree'
        })
        const hasFilterBar = computed(() => !!props.filters || hasGroups.value)
        // spares the dropdown the row beneath the search
        const togglesInSearch = computed(
          () => hasGroups.value && !props.filters && !props.hideSearch,
        )

        const filterValues = ref<string[]>([])

        // sheet on phone widths and short landscape touch screens; opens a modal
        const isMobile = useMediaQuery(
          '(max-width: 639px), (pointer: coarse) and (orientation: landscape) and (max-height: 499px)',
        )
        // phone widths: search + results at the bottom (thumb reach); wider: bar on top
        const isThumbReach = useMediaQuery('(max-width: 639px)')
        const draft = ref<Set<string>>()

        // set on open: below while the trigger sits high, else beside (keeps list height);
        // high = top half of the window and of its visible scroll container; short screens always beside
        const isShort = useMediaQuery('(max-height: 799px)')
        const menu = ref<{ triggerRef?: Element | CharacterData }>()
        const isBeside = ref(false)
        const isOpen = ref(false)

        // one that scrolls vertically: `overflow-x-auto` computes `overflow-y: auto` too
        function scrollParent(el: Element) {
          for (let parent = el.parentElement; parent; parent = parent.parentElement) {
            if (
              parent.scrollHeight > parent.clientHeight &&
              /auto|scroll|overlay/.test(getComputedStyle(parent).overflowY)
            )
              return parent
          }
        }

        function place() {
          // a fragment root (e.g. `UButton`) exposes its text anchor, as reka handles too
          const el = menu.value?.triggerRef
          const trigger = el instanceof Element ? el : el?.nextElementSibling
          if (!trigger) return void (isBeside.value = isShort.value)
          const { top } = trigger.getBoundingClientRect()
          const box = scrollParent(trigger)?.getBoundingClientRect()
          // visible part of the container: clipped to the window
          const boxMiddle = box
            ? (Math.max(box.top, 0) + Math.min(box.bottom, window.innerHeight)) / 2
            : Infinity
          isBeside.value = isShort.value || top >= Math.min(window.innerHeight / 2, boxMiddle)
        }

        type Value = Single extends true ? string | null : string[]

        const committed = computed(() => {
          const model = props.modelValue
          const values: (string | null | undefined)[] = Array.isArray(model) ? model : [model]
          return new Set(values.filter((value) => value != null))
        })
        const selected = computed(() => draft.value ?? committed.value)

        const toValue = (values: Set<string>) =>
          (props.single ? ([...values][0] ?? null) : [...values]) as Value

        const isSaving = ref(false)

        function update(next: Set<string>) {
          if (isSaving.value) return
          if (draft.value) draft.value = next
          else emit('update:modelValue', toValue(next))
        }

        // single: always picks; clear has own button
        function toggle(value: string) {
          if (props.single) return update(new Set([value]))
          const next = new Set(selected.value)
          if (!next.delete(value)) next.add(value)
          update(next)
        }

        // single: pick at open, restored on failed save
        const pickedOnOpen = ref<string>()
        const picked = computed(() => [...selected.value][0])
        // clear empties pick before `onChange` settles; keep button till closed
        const isClearing = ref(false)
        // single + `clear`: Clear while pick unchanged, Save once changed
        const showsClear = computed(
          () =>
            props.single &&
            props.clear &&
            (isClearing.value ||
              (picked.value !== undefined && picked.value === pickedOnOpen.value)),
        )

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

        // refetch while open: drop picks whose item is gone.
        // not mid-load: an empty or stale list would drop picks for good
        watch(
          () => [props.items, props.loading] as const,
          ([items, loading]) => {
            if (!draft.value && !isOpen.value) return
            if (loading || items.length === 0) return
            const kept = new Set(items.map((item) => item.value)).intersection(selected.value)
            if (kept.size < selected.value.size) update(kept)
          },
        )

        // single + `onChange`: same row picked twice in a row saves. click/tap: within 500ms;
        // Enter: any time. the pick from open just closes
        let lastPick: { value: string; at: number } | undefined
        // set by the keydown listener for the pick its Enter causes (its own or reka's)
        let isEnterPick = false

        // sheet, and menu if single or `onChange`: pick into draft; save emits, dismiss cancels
        function startDraft() {
          draft.value = new Set(committed.value)
          pickedOnOpen.value = picked.value
          isClearing.value = false
          lastPick = undefined
        }

        function openSheet() {
          searchTerm.value = ''
          startDraft()
        }

        function close() {
          draft.value = undefined
          // prop close skips `USelectMenu`'s blur
          isOpen.value = false
          attrs.onBlur?.()
        }

        // single, no `onChange`: pick closes, no save button
        const closesOnPick = computed(() => props.single && !props.onChange)
        const isDirty = computed(
          // receiver must be raw: `draft` is a reactive proxy
          () => !!draft.value && committed.value.symmetricDifference(draft.value).size > 0,
        )
        // nothing picked: "Keine auswählen" only for a changed draft
        const showsSave = computed(() => {
          if (selected.value.size === 0) return isDirty.value
          return props.single ? !closesOnPick.value && picked.value !== pickedOnOpen.value : true
        })

        function pick(value: string) {
          if (isSaving.value) return
          toggle(value)
          if (props.single && props.onChange && draft.value) {
            const at = Date.now()
            const isDouble = lastPick?.value === value && (isEnterPick || at - lastPick.at < 500)
            lastPick = isDouble ? undefined : { value, at }
            if (!isDouble) return
            if (picked.value === pickedOnOpen.value) return close()
            return void save(toValue(draft.value))
          }
          if (!closesOnPick.value) return
          if (draft.value) emit('update:modelValue', toValue(draft.value))
          close()
        }

        async function save(value: Value) {
          isSaving.value = true
          try {
            await props.onChange?.(value)
          } catch (err) {
            // multiple: keep picks for retry
            if (props.single && draft.value)
              draft.value = new Set(pickedOnOpen.value === undefined ? [] : [pickedOnOpen.value])
            // click handler not awaited; rethrow = unhandled rejection
            console.error(err)
            return
          } finally {
            isSaving.value = false
          }
          emit('update:modelValue', value)
          close()
        }

        // menu remounts on flip; sheet draft must not leak in
        watch(isMobile, () => {
          draft.value = undefined
          isOpen.value = false
        })

        // `list` holds the rows without a header: the list view's, or the ungrouped ones
        const tree = computed<{ groups: (ItemRow<T> | GroupRow)[][]; list: ItemRow<T>[] }>(() => {
          const search = searchTerm.value.trim().toLowerCase()
          const matches = (label: string) => label.toLowerCase().includes(search)
          const matchesItem = (item: T) =>
            matches(item.label) || (item.search !== undefined && matches(item.search))

          const active = props.filters?.filter(({ value }) => filterValues.value.includes(value))
          const passes = (item: T) =>
            !active?.length || !props.filterFn || props.filterFn(item, active)

          // a const, so it stays narrowed inside the callbacks
          const groups = props.groups
          if (view.value === 'list' || !groups?.length) {
            const rows = props.items.filter((item) => passes(item) && matchesItem(item))
            return { groups: [], list: rows }
          }

          const byValue = new Map(props.items.map((item) => [item.value, item]))

          // ungrouped items stay selectable: own group, or listed below the groups
          const inGroup = new Set(groups.flatMap((group) => group.values))
          const ungrouped = props.items.filter((item) => !inGroup.has(item.value))
          const entries = [...groups]
          if (!props.listUngrouped && ungrouped.length > 0)
            entries.push({
              label: props.ungroupedLabel ?? 'Ohne Gruppe',
              values: ungrouped.map((item) => item.value),
            })

          // one menu group each, so each renders as its own box
          const boxes = entries.map<(ItemRow<T> | GroupRow)[]>(
            ({ label, values: groupValues }, index) => {
              const claimed = groupValues.filter((value) => byValue.has(value))
              // `values` ignores the search (header checkbox stays stable), not the filter
              // (toggling mustn't select hidden items)
              const values = claimed.filter((value) => passes(byValue.get(value)!))
              const items = claimed.flatMap((value) => {
                const item = byValue.get(value)!
                byValue.delete(value)
                // matching group label keeps the whole group
                return passes(item) && (matches(label) || matchesItem(item)) ? item : []
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
                  // the ungrouped entry is only ever pushed after the given groups
                  ungrouped: index === groups.length,
                },
                ...(isCollapsed ? [] : items.map((item) => ({ ...item, indent: 1 }))),
              ]
            },
          )

          return {
            groups: boxes.filter((rows) => rows.length > 0),
            list: props.listUngrouped
              ? ungrouped.filter((item) => passes(item) && matchesItem(item))
              : [],
          }
        })

        // an empty group would still draw its box
        const grouped = computed(() =>
          tree.value.list.length > 0 ? [...tree.value.groups, tree.value.list] : tree.value.groups,
        )

        const isList = computed(() => view.value === 'list' || !hasGroups.value)

        // Enter toggles all matches (single: a sole match); captured ahead of reka.
        // after an arrow key, Enter is reka's again: picks the highlighted row, ringed meanwhile.
        // `searchId` scopes it to this instance: menu and sheet share it, never both mounted.
        // Backspace right after clears the search.
        const searchId = useId()
        // reka sets the content's own id; falls through as an attribute
        const contentAttrs = { 'data-tree-select': searchId }
        let clearsOnBackspace = false
        // typing moves the highlight to the first match, so it ends arrowing
        const isArrowing = ref(false)
        watch(searchTerm, () => (isArrowing.value = false))
        watch(
          () => isOpen.value || !!draft.value,
          () => {
            clearsOnBackspace = false
            isArrowing.value = false
          },
        )
        // the mouse takes over the highlight. movement only: keyboard scrolling under a
        // resting cursor fires synthetic moves without it
        useEventListener(document, 'pointermove', (event) => {
          if (isArrowing.value && (event.movementX || event.movementY)) isArrowing.value = false
        })
        useEventListener(
          document,
          'keydown',
          (event) => {
            const target = event.target instanceof HTMLElement ? event.target : undefined
            // no search: focus sits on the listbox or a row; a nested filter's rows aren't ours
            const list = target?.matches('[role="listbox"]')
              ? target
              : target?.closest('[role="option"]')?.closest('[role="listbox"]')
            const inList = !!list?.matches(`[data-tree-select="${CSS.escape(searchId)}"]`)
            if (target?.id !== searchId && !inList) return
            if (event.isComposing) return
            const clears = clearsOnBackspace
            clearsOnBackspace = false
            if (clears && event.key === 'Backspace') {
              event.preventDefault()
              searchTerm.value = ''
              return
            }
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') isArrowing.value = true
            if (event.key !== 'Enter') return
            // Enter passed on to reka: its keydown clicks the highlighted row after this listener;
            // reset once all have run
            isEnterPick = true
            setTimeout(() => (isEnterPick = false), 0)
            if (isArrowing.value) return
            // no arrow key yet: the highlight is incidental, never reka's pick
            event.preventDefault()
            event.stopPropagation()
            if (!searchTerm.value.trim()) return
            const matches = grouped.value.flat().flatMap((row) => ('type' in row ? [] : row.value))
            if (props.single) {
              if (matches.length === 1) pick(matches[0]!)
              return
            }
            toggleGroup(matches)
            clearsOnBackspace = true
          },
          { capture: true },
        )

        // wide enough for two columns of boxes in the sheet (a phone held sideways)
        const isLandscapeColumns = useMediaQuery('(min-width: 768px)')

        // each group joins the shorter column, measured expanded so collapsing never reshuffles;
        // a collapsed header's `values` = its rows (no search while collapsed)
        const groupColumns = computed(() => {
          const columns: { height: number; groups: (ItemRow<T> | GroupRow)[][] }[] = [
            { height: 0, groups: [] },
            { height: 0, groups: [] },
          ]
          for (const rows of tree.value.groups) {
            const header = rows[0] as GroupRow
            const column = columns[0]!.height <= columns[1]!.height ? columns[0]! : columns[1]!
            column.height += header.collapsed ? 1 + header.values.length : rows.length
            column.groups.push(rows)
          }
          return columns.map((column) => column.groups)
        })

        // `inset`: 24px tall, centred in the search input's 32px;
        // `sheet`: sm, for fingers, fits the sheet search's 48px.
        // both sit in a search input: a divider sets them apart from its clear x
        const viewTabs = (fit?: 'inset' | 'sheet') => {
          const tabs = (
            <UTabs
              size={fit === 'sheet' ? 'sm' : 'xs'}
              content={false}
              class="w-auto"
              ui={
                fit === 'inset'
                  ? { list: 'p-0.5', indicator: 'inset-y-0.5', trigger: 'px-1.5 py-0.5' }
                  : undefined
              }
              items={[
                { value: 'tree', icon: 'lucide:folder-tree' },
                { value: 'list', icon: 'lucide:list' },
              ]}
              v-model={view.value}
            />
          )
          return fit ? (
            <span class="border-default my-1 flex items-center self-stretch border-s ps-1">
              {tabs}
            </span>
          ) : (
            tabs
          )
        }

        // `compact` for a header row that shares its width with the search and buttons
        const filterBar = (compact = false) =>
          hasFilterBar.value && (
            <div class="border-default relative z-10 order-1 flex items-center justify-between gap-2 border-b px-2.5 py-1.5">
              {props.filters && slots.filter ? (
                slots.filter({
                  'filters': props.filters,
                  'modelValue': filterValues.value,
                  'onUpdate:modelValue': (value) => (filterValues.value = value),
                })
              ) : props.filters ? (
                <USelectMenu
                  // compact sits beside the search input, so it takes its height
                  size={compact ? 'md' : 'xs'}
                  class={compact ? 'w-auto' : 'w-40'}
                  valueKey="value"
                  // compact: funnel in the value; a leading icon overlaps the padding, gives no width
                  icon={compact ? undefined : 'lucide:funnel'}
                  placeholder={compact ? undefined : 'Filter'}
                  // list defaults to the trigger's width, too narrow when compact
                  ui={{ content: 'min-w-40' }}
                  multiple
                  clear
                  searchInput={false}
                  // portaled: focus moving there would blur the search and close the menu
                  portal={false}
                  // only read, but `USelectMenu` types `items` as mutable
                  items={props.filters as F[]}
                  v-model={filterValues.value}
                  v-slots={{
                    // just the count, as the labels don't fit
                    ...(compact && {
                      default: () => [
                        <UIcon name="lucide:funnel" class="size-5 shrink-0" />,
                        filterValues.value.length > 0 && <span>{filterValues.value.length}</span>,
                      ],
                    }),
                    'item-label': slots['filter-item']
                      ? ({ item }: { item: F }) => slots['filter-item']!({ item })
                      : undefined,
                  }}
                />
              ) : (
                // holds the toggle at the end; compact has no width to fill
                !compact && <div />
              )}
              {hasGroups.value &&
                (compact ? (
                  // one button that switches, showing the view it's in
                  <UButton
                    size="md"
                    color="neutral"
                    variant="outline"
                    icon={view.value === 'tree' ? 'lucide:folder-tree' : 'lucide:list'}
                    aria-label={view.value === 'tree' ? 'Listenansicht' : 'Baumansicht'}
                    onClick={() => (view.value = view.value === 'tree' ? 'list' : 'tree')}
                  />
                ) : (
                  viewTabs()
                ))}
            </div>
          )

        const itemContent = (item: ItemRow<T> | GroupRow) =>
          'type' in item
            ? [
                !props.single && (
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
                  />
                ),
                <span
                  class={
                    item.ungrouped
                      ? 'text-muted truncate text-sm'
                      : 'text-highlighted truncate text-sm font-semibold'
                  }
                >
                  {item.label}
                </span>,
                <button
                  type="button"
                  class="text-muted hover:text-highlighted hover:bg-accented -my-1 ms-auto flex rounded-md p-1"
                  aria-label={item.collapsed ? 'Aufklappen' : 'Zuklappen'}
                  aria-expanded={!item.collapsed}
                  // keeps focus in the search input, whose blur would close the menu
                  onMousedown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    // else row click toggles group (single: collapses)
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
                // spacer, not row padding: a class on the reused item survives view switches
                item.indent ? (
                  <div class="shrink-0" style={{ width: `${item.indent * 0.25}rem` }} />
                ) : undefined,
                props.single ? (
                  radio(selected.value.has(item.value))
                ) : (
                  <UCheckbox
                    size="md"
                    class="pointer-events-none shrink-0"
                    modelValue={selected.value.has(item.value)}
                  />
                ),
                ...(slots.prefix?.({ item }) ?? []),
                <span class="flex min-w-0 flex-col">
                  {/* suffix beside the label: a longer description would push it aside */}
                  <span class="flex min-w-0 items-center gap-1.5">
                    <span class="truncate">{item.label}</span>
                    {slots.suffix?.({ item })}
                  </span>
                  {(slots.description || item.description) && (
                    <span class="text-muted truncate text-xs">
                      {slots.description?.({ item }) ?? item.description}
                    </span>
                  )}
                </span>,
                <span class="text-muted ms-auto text-xs">
                  {slots.hint?.({ item }) ?? item.hint}
                </span>,
              ]

        const sheetRows = (rows: (ItemRow<T> | GroupRow)[]) =>
          rows.map((item) => (
            // not a <button>: a group row holds the collapse button
            <div
              role="button"
              class="border-default even:bg-elevated/30 flex w-full items-center gap-1.5 border-b px-2.5 py-3.5 text-start text-sm last:border-b-0"
              onClick={() => {
                if (!('type' in item)) pick(item.value)
                else if (props.single) toggleCollapsed(item.label)
                else toggleGroup(item.values)
              }}
            >
              {itemContent(item)}
            </div>
          ))

        // `toggles`: view tabs inside, at the end
        const searchInput = (inputProps: Pick<InputProps, 'variant' | 'class'>, toggles = false) =>
          props.hideSearch
            ? []
            : [
                <UInput
                  v-model={searchTerm.value}
                  type="search"
                  icon="lucide:search"
                  placeholder={attrs.placeholder ?? 'Suchen…'}
                  id={searchId}
                  ui={toggles ? { base: 'pe-24', trailing: 'pe-1' } : undefined}
                  {...inputProps}
                  v-slots={toggles ? { trailing: () => viewTabs('sheet') } : undefined}
                />,
              ]

        // single: no count, max one
        const saveLabel = () =>
          props.submitLabel?.(selected.value.size) ??
          (selected.value.size === 0
            ? 'Keine auswählen'
            : props.single
              ? 'Auswählen'
              : `${selected.value.size} auswählen`)

        const footerButton = () =>
          showsClear.value ? (
            <UButton
              class="flex-1 justify-center"
              color="primary"
              variant="subtle"
              icon="lucide:x"
              label={props.deselectLabel ?? 'Auswahl aufheben'}
              loading={isSaving.value}
              onClick={() => {
                // closing after a clear: a second tap would save again
                if (isClearing.value) return
                isClearing.value = true
                if (draft.value) draft.value = new Set()
                // success closes (draft gone): keep the button through the close animation
                void save(null as Value).finally(() => {
                  if (draft.value) isClearing.value = false
                })
              }}
            />
          ) : (
            showsSave.value && (
              <UButton
                class="flex-1 justify-center"
                label={saveLabel()}
                loading={isSaving.value}
                // live picks (multiple, no `onChange`) already emitted; re-emit harmless
                onClick={() => void save(toValue(selected.value))}
              />
            )
          )

        const sheetButtons = () => [
          <UButton
            class="flex-1 justify-center"
            color="neutral"
            variant="outline"
            label="Abbrechen"
            disabled={isSaving.value}
            onClick={close}
          />,
          footerButton(),
        ]

        return () => [
          <USelectMenu
            {...attrs}
            // reka fixes controlled `open` at mount, media query settles later: remount on flip
            key={isMobile.value ? 'mobile' : 'desktop'}
            ref={menu}
            disabled={props.disabled}
            // closed-menu clear saves with no other spinner
            loading={props.loading || isSaving.value}
            clear={props.clear}
            // nothing beside the custom trigger
            {...(slots.default && {
              asChild: true,
              loading: false,
              clear: false,
              trailingIcon: '',
            })}
            // reka's reset goes through `onUpdate:modelValue`, where single re-picks the cleared row
            resetModelValueOnClear={false}
            onClear={() => {
              if (isSaving.value) return
              const picks = draft.value
              if (picks) draft.value = new Set()
              // single: keeps the clear button while saving, as the footer's does
              isClearing.value = true
              // failed (draft still open): multiple gets its picks back for retry
              void save(toValue(new Set())).then(() => {
                if (!draft.value) return
                isClearing.value = false
                if (!props.single) draft.value = picks
              })
            }}
            // held shut on mobile, where opening shows the sheet instead
            open={!isMobile.value && isOpen.value}
            onUpdate:open={(open: boolean) => {
              // save closes once `onChange` settles; a clear's save would close a fresh open
              if (isSaving.value) return
              if (isMobile.value) return open && openSheet()
              isOpen.value = open
              if (!open) return void (draft.value = undefined)
              place()
              if (props.single || props.onChange) startDraft()
            }}
            items={grouped.value}
            valueKey="value"
            // single too: pick = row that differs from draft
            multiple
            ignoreFilter
            // multiple: pick several matches per search
            resetSearchTermOnSelect={false}
            v-model:searchTerm={searchTerm.value}
            searchInput={
              !props.hideSearch && {
                type: 'search',
                id: searchId,
                // room for the view toggle laid over its end
                ui: togglesInSearch.value ? { base: 'pe-20' } : undefined,
              }
            }
            // beside: right (reka flips left), bottom-aligned, grows up.
            // below: left-aligned, no flip above, shrinks to fit
            content={{
              ...contentAttrs,
              collisionPadding: { top: 8, right: 8, bottom: 56, left: 8 },
              ...(isBeside.value
                ? { side: 'right', align: 'end' }
                : { side: 'bottom', align: 'start', sideFlip: false }),
            }}
            arrow={isBeside.value}
            ui={{
              // flat (list view or no groups): a plain list, edge to edge
              group: isList.value ? 'p-0' : groupBox,
              // striped from the header on; stripe hides the default `before` highlight,
              // so the row highlights itself: hover fill for the mouse, ring while arrowing,
              // as Enter picks it
              item: [
                'items-center py-2 rounded-none border-b border-default last:border-b-0 even:bg-elevated/30',
                // ring follows the corners; list view: square beside the search or footer
                !(isList.value && (!props.hideSearch || hasFilterBar.value)) &&
                  'first:rounded-t-md',
                !(isList.value && (showsClear.value || showsSave.value)) && 'last:rounded-b-md',
                isList.value && 'px-2.5',
                isArrowing.value
                  ? 'data-highlighted:not-data-disabled:ring-2 data-highlighted:not-data-disabled:ring-inset data-highlighted:not-data-disabled:ring-primary'
                  : 'data-highlighted:not-data-disabled:bg-elevated',
              ]
                .filter(Boolean)
                .join(' '),
              // grows with the list up to what fits; min 24rem, below also trigger width
              content: [
                'max-h-(--reka-combobox-content-available-height) w-max max-w-(--reka-combobox-content-available-width)',
                isBeside.value
                  ? 'min-w-96'
                  : 'min-w-[max(var(--reka-combobox-trigger-width),24rem)]',
              ].join(' '),
              empty: 'order-2',
              // tree: stable gutter, as collapsing can end the overflow
              viewport: [
                'order-2 divide-y-0 space-y-3',
                !isList.value && 'p-2 scrollbar-gutter-stable',
              ]
                .filter(Boolean)
                .join(' '),
            }}
            modelValue={[...selected.value]}
            // headers select like rows (reka keeps scroll); header toggles group (single: collapses)
            onUpdate:modelValue={(value) => {
              const values = value as string[]
              const header = grouped.value
                .flat()
                .find((row): row is GroupRow => 'type' in row && values.includes(row.value))
              if (header && props.single) toggleCollapsed(header.label)
              else if (header) toggleGroup(header.values)
              else if (props.single) {
                // changed row: newly picked or unpicked
                const changed =
                  values.find((row) => !selected.value.has(row)) ??
                  [...selected.value].find((row) => !values.includes(row))
                if (changed !== undefined) pick(changed)
              } else {
                update(new Set(values))
              }
            }}
            v-slots={{
              // `content-top` renders above the search; flex order moves it below.
              // `z-10`: unportaled filter dropdown stays above the `relative` viewport
              'content-top': () => [
                !togglesInSearch.value && filterBar(),
                // the search takes no slots, so the toggle moves into its wrapper;
                // deferred, as the search renders after this slot
                togglesInSearch.value && (
                  <Teleport to={`:has(> #${searchId})`} defer>
                    <span class="absolute inset-y-0 inset-e-0 flex items-center pe-1">
                      {viewTabs('inset')}
                    </span>
                  </Teleport>
                ),
              ],
              'content-bottom': () => [
                (showsClear.value || showsSave.value) && (
                  <div
                    class="border-default order-3 flex border-t p-2"
                    // keeps focus in the search input, whose blur would close the menu first
                    onMousedown={(event) => event.preventDefault()}
                  >
                    {footerButton()}
                  </div>
                ),
              ],
              'default': ({ ui }: { ui: { placeholder: () => string; value: () => string } }) => {
                if (slots.default)
                  return [
                    <CustomTrigger>
                      {() => slots.default!({ open: isOpen.value || !!draft.value })}
                    </CustomTrigger>,
                  ]
                const values = [...committed.value]
                if (values.length === 0)
                  return [<span class={ui.placeholder()}>{attrs.placeholder ?? '\u{A0}'}</span>]
                if (values.length > 1) {
                  const items = props.items.filter((item) => committed.value.has(item.value))
                  return [
                    <span class={ui.value()}>
                      {slots.selected?.({ items }) ?? `${values.length} ausgewählt`}
                    </span>,
                  ]
                }

                // one pick with its prefix, as in the list
                const item = props.items.find((item) => item.value === values[0])
                return [
                  <span class={[ui.value(), 'flex items-center gap-1.5']}>
                    {item && slots.prefix?.({ item })}
                    <span class="truncate">{item?.label ?? values[0]}</span>
                  </span>,
                ]
              },
              'item': ({ item }: { item: ItemRow<T> | GroupRow }) => itemContent(item),
              ...(props.loading && { empty: loadingNote }),
            }}
          />,
          isMobile.value && (
            <UModal
              fullscreen
              close={false}
              open={!!draft.value}
              onUpdate:open={(open) => !open && !isSaving.value && close()}
              ui={{
                // sideways there's little height, so everything shares one row
                header: 'min-h-0 gap-2 p-4',
                // column, so results can sit at the bottom by the search
                body: 'flex flex-col p-4 scrollbar-gutter-stable',
                // in thumb reach, filter and search sit above the buttons
                footer: 'flex-col items-stretch gap-0 p-0',
              }}
              v-slots={vSlots(UModal, {
                ...(!isThumbReach.value && {
                  header: () => [
                    // the row pads itself and needs no divider
                    ...(hasFilterBar.value
                      ? [
                          <div class="shrink-0 *:border-b-0 *:p-0">
                            {filterBar(!isLandscapeColumns.value)}
                          </div>,
                        ]
                      : []),
                    ...searchInput({ class: 'min-w-0 flex-1' }),
                    <div class="flex w-64 shrink-0 gap-1.5">{sheetButtons()}</div>,
                  ],
                }),
                body: () => [
                  // `mt-auto`, not `justify-end`, which clips the top on overflow
                  <div class={isThumbReach.value && 'mt-auto'}>
                    {grouped.value.length === 0 ? (
                      <p class="text-muted p-4 text-center text-sm">
                        {props.loading ? loadingNote() : 'Keine Treffer'}
                      </p>
                    ) : (
                      <div class="space-y-3">
                        {tree.value.groups.length > 0 &&
                          (isLandscapeColumns.value ? (
                            <div class="grid grid-cols-2 items-start gap-3">
                              {groupColumns.value.map((groups) => (
                                <div class="space-y-3">
                                  {groups.map((rows) => (
                                    <div class={groupBox}>{sheetRows(rows)}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div class="space-y-3">
                              {tree.value.groups.map((rows) => (
                                <div class={groupBox}>{sheetRows(rows)}</div>
                              ))}
                            </div>
                          ))}
                        {tree.value.list.length > 0 &&
                          (isLandscapeColumns.value ? (
                            // no headers to hold them: span both columns, split into two boxes
                            <div class="grid grid-cols-2 items-start gap-3">
                              {chunk(tree.value.list, Math.ceil(tree.value.list.length / 2)).map(
                                (half) => (
                                  <div class={groupBox}>{sheetRows(half)}</div>
                                ),
                              )}
                            </div>
                          ) : (
                            <div class={groupBox}>{sheetRows(tree.value.list)}</div>
                          ))}
                      </div>
                    )}
                  </div>,
                ],
                ...(isThumbReach.value && {
                  // filter, then search, so the search sits next to the results
                  footer: () => [
                    // wrapped, since the row's `order-1` would put it below its siblings here
                    ...(hasFilterBar.value && !togglesInSearch.value
                      ? [<div>{filterBar()}</div>]
                      : []),
                    ...searchInput(
                      { variant: 'none', class: 'border-default border-b px-1 py-2' },
                      togglesInSearch.value,
                    ),
                    <div class="flex gap-1.5 p-4">{sheetButtons()}</div>,
                  ],
                }),
              })}
            />
          ),
        ]
      },
    }),
)
