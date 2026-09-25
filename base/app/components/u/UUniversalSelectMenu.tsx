import type { InputProps, SelectMenuProps } from '@nuxt/ui'
import type { FunctionalComponent, VNode } from 'vue'
import { Slot } from 'reka-ui'
import { chunk, uniqueBy } from 'remeda'
import { h, Teleport } from 'vue'
import { UButton, UCheckbox, UIcon, UInput, UModal, USelectMenu, UTabs } from '#components'

type Primitive = string | number | boolean | null

export type UniversalSelectMenuItem<V extends Primitive = Primitive> = {
  label: string
  value: V
  hint: string
  description?: string
  // extra text the search matches, besides the label
  search?: string
  // labels of the groups it's listed under, in the order they first appear across `items`;
  // no item with one: a flat list with no view toggle
  groups?: string[]
  // listed first, above a divider, instead of under its groups; search and filters don't hide it
  pinned?: boolean
}
export type UniversalSelectMenuFilter = { label: string; value: string }

// `rowKey`: `USelectMenu`'s value for the row, one string space for item and group rows
type ItemRow<T> = T & { rowKey: string }

type GroupRow<V> = {
  type: 'group'
  label: string
  rowKey: string
  values: V[]
  collapsed: boolean
  // leftover items' group; styled muted
  ungrouped?: boolean
  // the pinned items' header; never collapses
  pinned?: boolean
  hint?: never
}

// `USelectMenu` draws it as a line between the pinned rows and the rest; `rowKey` only for its types
const separator = { type: 'separator' as const, rowKey: '\0' }
type LabelRow = { type: 'label'; label: string; rowKey: string }

const groupBox = 'p-0 rounded-md border border-default overflow-hidden'

// JSON keeps `1`, `'1'`, `true` and `null` apart, and never starts with NUL like a group row's key
const toKey = (value: Primitive) => JSON.stringify(value)
const fromKey = (key: string) => JSON.parse(key) as Primitive
const groupKey = (index: number) => `\0${index}`

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

function emptyNote() {
  return (
    <span class="flex flex-col items-center gap-1.5">
      <UIcon name="lucide:list-x" class="size-6 shrink-0" />
      Keine Treffer
    </span>
  )
}

export default defineSetupComponent(
  <
    T extends UniversalSelectMenuItem,
    F extends UniversalSelectMenuFilter = UniversalSelectMenuFilter,
    Multiple extends boolean = false,
  >(_: {
    props: Omit<
      SelectMenuProps<
        (ItemRow<T> | GroupRow<T['value']> | LabelRow | typeof separator)[][],
        'rowKey',
        true
      >,
      | 'items'
      | 'valueKey'
      | 'labelKey'
      | 'descriptionKey'
      | 'modelValue'
      | 'defaultValue'
      | 'disabled'
      | 'loading'
      | 'clear'
      | 'multiple'
    > & {
      items: T[]
      // `false`: a flat list with no view toggle, whatever `item.groups` say
      group?: boolean
      // list ungrouped items flat below
      listUngrouped?: boolean
      // label for the group of ungrouped items
      ungroupedLabel?: string
      // header over the pinned items; without, they're listed bare
      pinnedLabel?: string
      filters?: readonly F[]
      // only called while at least one filter is selected
      filterFn?: (item: T, filters: F[]) => boolean
      multiple?: Multiple
      // a value no item holds is dropped once `items` are in: single to `undefined`, multiple
      // filtered out
      modelValue?: (Multiple extends true ? (T['value'] | null)[] : T['value']) | null
      // awaited before emit, spinner meanwhile. throws: no emit, stays open; single restores
      // pick, multiple keeps picks
      onChange?: (
        value: Multiple extends true ? T['value'][] : T['value'] | undefined,
      ) => Promise<void> | void
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
      // custom trigger, e.g. a button; no clear x or spinner. `items`: the saved picks
      'default': (props: { open: boolean; items: T[] }) => VNode[]
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
      | 'group'
      | 'listUngrouped'
      | 'ungroupedLabel'
      | 'pinnedLabel'
      | 'filters'
      | 'filterFn'
      | 'multiple'
      | 'modelValue'
      | 'onChange'
      | 'disabled'
      | 'loading'
      | 'submitLabel'
      | 'deselectLabel'
      | 'clear'
      | 'hideSearch'
    emits: {
      'update:modelValue': (
        value: Multiple extends true ? T['value'][] : T['value'] | undefined,
      ) => void
    }
  }) =>
    options(_, {
      name: 'UUniversalSelectMenu',
      props: [
        'items',
        'group',
        'listUngrouped',
        'ungroupedLabel',
        'pinnedLabel',
        'filters',
        'filterFn',
        'multiple',
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

        // a repeated value would list its row twice
        const items = computed(() => uniqueBy(props.items, (item) => item.value))

        const view = ref<'tree' | 'list'>('tree')
        const hasGroups = computed(
          () => props.group !== false && items.value.some((item) => !!item.groups?.length),
        )
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
        const draft = ref<Set<T['value']>>()

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

        type Value = Multiple extends true ? T['value'][] : T['value'] | undefined

        const committed = computed(() => {
          const model = props.modelValue as T['value'] | (T['value'] | null)[] | null | undefined
          const values = Array.isArray(model) ? model : [model]
          return new Set(values.filter((value): value is T['value'] => value !== undefined))
        })
        const selected = computed(() => draft.value ?? committed.value)
        // saved picks with an item, in item order: mid-load, a value no item holds yet is missing
        const pickedItems = computed(() =>
          items.value.filter((item) => committed.value.has(item.value)),
        )

        const order = computed(() => new Map(items.value.map((item, index) => [item.value, index])))
        // in item order, not pick order; values without an item trail
        const toValue = (values: Set<T['value']>) => {
          const rank = (value: T['value']) => order.value.get(value) ?? order.value.size
          const sorted = [...values].toSorted((a, b) => rank(a) - rank(b))
          return (props.multiple ? sorted : sorted[0]) as Value
        }

        const isSaving = ref(false)
        const isBusy = computed(() => props.loading || isSaving.value)

        function update(next: Set<T['value']>) {
          if (isSaving.value) return
          if (draft.value) draft.value = next
          else emit('update:modelValue', toValue(next))
        }

        // single: always picks; clear has own button
        function toggle(value: T['value']) {
          if (!props.multiple) return update(new Set([value]))
          const next = new Set(selected.value)
          if (!next.delete(value)) next.add(value)
          update(next)
        }

        // single: pick at open, restored on failed save
        const pickedOnOpen = ref<T['value']>()
        const picked = computed(() => [...selected.value][0])
        // clear empties pick before `onChange` settles; keep button till closed
        const isClearing = ref(false)

        function toggleGroup(values: T['value'][]) {
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

        // drop values no item holds, from the model and an open draft.
        // not mid-load: an empty or stale list would drop picks for good
        watch(
          () => [items.value, props.loading, committed.value] as const,
          ([items, loading, model]) => {
            if (loading || items.length === 0) return
            const known = new Set(items.map((item) => item.value))
            // receiver must be raw: `draft` is a reactive proxy
            if (draft.value && !known.isSupersetOf(draft.value))
              draft.value = known.intersection(draft.value)
            if (!model.isSubsetOf(known))
              emit('update:modelValue', toValue(known.intersection(model)))
          },
          { immediate: true },
        )

        // single + `onChange`: same row picked twice in a row saves. click/tap: within 500ms;
        // Enter: any time. the pick from open just closes
        let lastPick: { value: T['value']; at: number } | undefined
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
        const closesOnPick = computed(() => !props.multiple && !props.onChange)
        const isDirty = computed(
          // receiver must be raw: `draft` is a reactive proxy
          () => !!draft.value && committed.value.symmetricDifference(draft.value).size > 0,
        )
        // `clear`: Clear while the picks are unchanged, Save once changed.
        // multiple without `onChange` picks live, so it keeps Save
        const showsClear = computed(
          () =>
            props.clear &&
            (isClearing.value ||
              (props.multiple
                ? !!props.onChange && selected.value.size > 0 && !isDirty.value
                : picked.value !== undefined && picked.value === pickedOnOpen.value)),
        )
        // nothing picked: "Keine auswählen" only for a changed draft
        const showsSave = computed(() => {
          if (selected.value.size === 0) return isDirty.value
          return props.multiple ? true : !closesOnPick.value && picked.value !== pickedOnOpen.value
        })

        function pick(value: T['value']) {
          if (isSaving.value) return
          toggle(value)
          if (!props.multiple && props.onChange && draft.value) {
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
            if (!props.multiple && draft.value)
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
        const toRow = (item: T): ItemRow<T> => ({ ...item, rowKey: toKey(item.value) })

        const tree = computed<{
          pinned: ItemRow<T>[]
          pinnedHeader?: LabelRow | GroupRow<T['value']>
          groups: (ItemRow<T> | GroupRow<T['value']>)[][]
          list: ItemRow<T>[]
        }>(() => {
          const search = searchTerm.value.trim().toLowerCase()
          const matches = (label: string) => label.toLowerCase().includes(search)
          const matchesItem = (item: T) =>
            matches(item.label) || (item.search !== undefined && matches(item.search))

          const active = props.filters?.filter(({ value }) => filterValues.value.includes(value))
          const passes = (item: T) =>
            !active?.length || !props.filterFn || props.filterFn(item, active)

          const pinnedItems = items.value.filter((item) => item.pinned)
          const pinned = pinnedItems.map((item) => toRow(item))
          const label = props.pinnedLabel
          const isFlat = view.value === 'list' || !hasGroups.value
          // tree view, multiple: a header like a group's, toggling every pinned item; else a caption
          const pinnedHeader =
            pinned.length === 0 || !label
              ? undefined
              : !props.multiple || isFlat
                ? { type: 'label' as const, label, rowKey: '\0pinned' }
                : {
                    type: 'group' as const,
                    label,
                    rowKey: '\0pinned',
                    values: pinnedItems.map((item) => item.value),
                    collapsed: false,
                    pinned: true,
                  }
          const rest = items.value.filter((item) => !item.pinned)

          if (isFlat) {
            const rows = rest.filter((item) => passes(item) && matchesItem(item))
            return { pinned, pinnedHeader, groups: [], list: rows.map((item) => toRow(item)) }
          }

          // an item may sit in several groups; listed under each
          const labels = [...new Set(rest.flatMap((item) => item.groups ?? []))]
          const entries = labels.map((label) => ({
            label,
            items: rest.filter((item) => item.groups?.includes(label)),
          }))
          // ungrouped items stay selectable: own group, or listed below the groups
          const ungrouped = rest.filter((item) => !item.groups?.length)
          if (!props.listUngrouped && ungrouped.length > 0)
            entries.push({ label: props.ungroupedLabel ?? 'Ohne Gruppe', items: ungrouped })

          // one menu group each, so each renders as its own box
          const boxes = entries.map<(ItemRow<T> | GroupRow<T['value']>)[]>(
            ({ label, items: groupItems }, index) => {
              // `values` ignores the search (header checkbox stays stable), not the filter
              // (toggling mustn't select hidden items)
              const values = groupItems.filter(passes).map((item) => item.value)
              // matching group label keeps the whole group
              const items = groupItems.filter(
                (item) => passes(item) && (matches(label) || matchesItem(item)),
              )
              if (items.length === 0) return []
              const isCollapsed = !search && collapsed.value.has(label)

              return [
                {
                  type: 'group' as const,
                  label,
                  rowKey: groupKey(index),
                  values,
                  collapsed: isCollapsed,
                  // the ungrouped entry is only ever pushed after the labelled groups
                  ungrouped: index === labels.length,
                },
                ...(isCollapsed ? [] : items.map((item) => toRow(item))),
              ]
            },
          )

          return {
            pinned,
            pinnedHeader,
            groups: boxes.filter((rows) => rows.length > 0),
            list: props.listUngrouped
              ? ungrouped
                  .filter((item) => passes(item) && matchesItem(item))
                  .map((item) => toRow(item))
              : [],
          }
        })

        // an empty group would still draw its box
        const grouped = computed(() => {
          const { pinned, pinnedHeader, groups, list } = tree.value
          const rest = list.length > 0 ? [...groups, list] : groups
          if (pinned.length === 0) return rest
          const box = pinnedHeader ? [pinnedHeader, ...pinned] : pinned
          return rest.length > 0 ? [box, [separator], ...rest] : [box]
        })

        const isList = computed(() => view.value === 'list' || !hasGroups.value)

        // Enter toggles all matches (single: a sole match); captured ahead of reka.
        // after an arrow key, Enter is reka's again: picks the highlighted row, ringed meanwhile.
        // `searchId` scopes it to this instance: menu and sheet share it, never both mounted.
        // Backspace right after clears the search.
        const searchId = useId()
        // reka sets the content's own id; falls through as an attribute
        const contentAttrs = {
          'data-universal-select': searchId,
          // a clicked row (`tabindex=-1`) would take focus from the search, and reka's arrow keys
          // only work there
          'onMousedown': (event: MouseEvent) => {
            if (props.hideSearch) return
            if ((event.target as Element).closest('[role="option"]')) event.preventDefault()
          },
        }
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
            const inList = !!list?.matches(`[data-universal-select="${CSS.escape(searchId)}"]`)
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
            // a value under several groups counts once; pinned rows show regardless, so match nothing
            const matches = [
              ...new Set(
                grouped.value
                  .flat()
                  .flatMap((row) => ('type' in row || row.pinned ? [] : row.value)),
              ),
            ]
            if (!props.multiple) {
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
          const columns: { height: number; groups: (ItemRow<T> | GroupRow<T['value']>)[][] }[] = [
            { height: 0, groups: [] },
            { height: 0, groups: [] },
          ]
          for (const rows of tree.value.groups) {
            const header = rows[0] as GroupRow<T['value']>
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

        // `inHeader`: the sheet's header row, beside the search, so it takes the search's height;
        // compact there while the row is narrow, as it shares its width with the search and buttons
        const filterBar = (inHeader = false) => {
          const compact = inHeader && !isLandscapeColumns.value
          return (
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
                    size={inHeader ? 'md' : 'xs'}
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
          )
        }

        const itemContent = (item: ItemRow<T> | GroupRow<T['value']>) =>
          'type' in item
            ? [
                props.multiple && (
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
                  data-group-header
                  class={
                    item.ungrouped
                      ? 'text-muted truncate text-sm'
                      : 'text-highlighted truncate text-sm font-semibold'
                  }
                >
                  {item.label}
                </span>,
                !item.pinned && (
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
                  </button>
                ),
              ]
            : [
                props.multiple ? (
                  <UCheckbox
                    size="md"
                    class="pointer-events-none shrink-0"
                    modelValue={selected.value.has(item.value)}
                  />
                ) : (
                  radio(selected.value.has(item.value))
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

        const sheetRows = (rows: (ItemRow<T> | GroupRow<T['value']>)[]) =>
          rows.map((item) => (
            // not a <button>: a group row holds the collapse button
            <div
              role="button"
              class="border-default even:bg-elevated/30 flex w-full items-center gap-1.5 border-b px-2.5 py-3.5 text-start text-sm last:border-b-0"
              onClick={() => {
                if (!('type' in item)) pick(item.value)
                else if (props.multiple) {
                  toggleGroup(item.values)
                } else {
                  toggleCollapsed(item.label)
                }
              }}
            >
              {itemContent(item)}
            </div>
          ))

        const sheetPinned = () => {
          const { pinned, pinnedHeader, groups, list } = tree.value
          if (pinned.length === 0) return []
          const box = (
            <div class={groupBox}>
              {pinnedHeader?.type === 'label' && (
                <div class="text-highlighted border-default border-b px-2.5 py-3.5 text-sm font-semibold">
                  {pinnedHeader.label}
                </div>
              )}
              {sheetRows(pinnedHeader?.type === 'group' ? [pinnedHeader, ...pinned] : pinned)}
            </div>
          )
          if (groups.length === 0 && list.length === 0) return [box]
          // the dropdown's band, across the body's padding
          const divider = <div class="bg-accented -mx-4 h-0.75" />
          return [box, divider]
        }

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
            : props.multiple
              ? `${selected.value.size} auswählen`
              : 'Auswählen')

        // success closes (draft gone): keeps the clear button through the close animation
        function clearAll() {
          if (isSaving.value) return
          const picks = draft.value
          if (picks) draft.value = new Set()
          isClearing.value = true
          // failed (draft still open): multiple gets its picks back for retry
          void save(toValue(new Set())).then(() => {
            if (!draft.value) return
            isClearing.value = false
            if (props.multiple) draft.value = picks
          })
        }

        const footerButton = () =>
          showsClear.value ? (
            <UButton
              class="flex-1 justify-center"
              color="primary"
              variant="subtle"
              icon="lucide:x"
              label={props.deselectLabel ?? 'Auswahl aufheben'}
              loading={isSaving.value}
              // closing after a clear: a second tap would save again
              onClick={() => !isClearing.value && clearAll()}
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
            loading={isBusy.value}
            // spinner alone while loading
            clear={props.clear && !isBusy.value}
            // nothing beside the custom trigger
            {...(slots.default && {
              asChild: true,
              loading: false,
              clear: false,
              trailingIcon: '',
            })}
            // reka's reset goes through `onUpdate:modelValue`, where single re-picks the cleared row
            resetModelValueOnClear={false}
            onClear={clearAll}
            // held shut on mobile, where opening shows the sheet instead
            open={!isMobile.value && isOpen.value}
            onUpdate:open={(open: boolean) => {
              // save closes once `onChange` settles; a clear's save would close a fresh open
              if (isSaving.value) return
              if (isMobile.value) return open && openSheet()
              isOpen.value = open
              if (!open) return void (draft.value = undefined)
              place()
              // live picks start no draft to reset it: a clear button would stay
              isClearing.value = false
              if (!props.multiple || props.onChange) startDraft()
            }}
            items={grouped.value}
            valueKey="rowKey"
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
              collisionPadding: { top: 8, right: 8, bottom: 48 * 2 + 8, left: 8 },
              ...(isBeside.value
                ? { side: 'right', align: 'end' }
                : { side: 'bottom', align: 'start', sideFlip: false }),
            }}
            arrow={isBeside.value}
            ui={{
              // flat (list view or no groups): a plain list, edge to edge.
              // the divider's own group draws no box, nor clips the band's bleed
              group: [
                isList.value ? 'p-0' : groupBox,
                'has-data-[slot=separator]:border-0 has-data-[slot=separator]:overflow-visible',
              ].join(' '),
              // rows, the band and the caption keep their classes across a view switch, as
              // `USelectMenu` reuses rendered rows: the view reaches them as `is-list` on the viewport.
              // a band, as each row already ends in a line; tree view: across the viewport's padding
              separator: 'my-0 h-0.75 bg-accented -mx-2 in-[.is-list]:mx-0',
              // the pinned header, lined up with the rows as a group header is.
              // list view: a light caption, as no group header sets the tone there
              label:
                'border-b border-default py-2 text-sm in-[.is-list]:px-2.5 in-[.is-list]:py-1 in-[.is-list]:text-xs in-[.is-list]:font-medium',
              // striped from the header on; stripe hides the default `before` highlight,
              // so the row highlights itself: hover fill for the mouse, ring while arrowing,
              // as Enter picks it
              item: [
                'items-center py-2 rounded-none border-b border-default last:border-b-0 even:bg-elevated/30',
                // ring follows the corners; list view: square beside the search or footer
                'first:rounded-t-md last:rounded-b-md in-[.is-list]:px-2.5',
                (!props.hideSearch || hasFilterBar.value) && 'in-[.is-list]:first:rounded-t-none',
                (showsClear.value || showsSave.value) && 'in-[.is-list]:last:rounded-b-none',
                // a header row, marked by its label, gets no hover fill, nor `USelectMenu`'s own
                'has-data-group-header:before:hidden',
                isArrowing.value
                  ? 'data-highlighted:not-data-disabled:ring-2 data-highlighted:not-data-disabled:ring-inset data-highlighted:not-data-disabled:ring-primary'
                  : 'data-highlighted:not-data-disabled:not-has-data-group-header:bg-elevated',
              ]
                .filter(Boolean)
                .join(' '),
              // footer and arrow hang outside the box: the open animation's transform would clip them
              // till it ends
              content: [
                'overflow-visible max-h-(--reka-combobox-content-available-height) w-max min-w-(--reka-combobox-trigger-width) max-w-(--reka-combobox-content-available-width)',
                (showsClear.value || showsSave.value) && 'rounded-b-none',
              ]
                .filter(Boolean)
                .join(' '),
              // clips for the box instead, rounded with it
              focusScope: 'overflow-hidden rounded-[inherit]',
              empty: 'order-2',
              // tree: stable gutter, as collapsing can end the overflow;
              // empty: its padding would pad the empty text's bottom
              viewport: [
                'order-2 divide-y-0 empty:hidden',
                isList.value ? 'is-list' : 'space-y-2 p-2 scrollbar-gutter-stable',
              ]
                .filter(Boolean)
                .join(' '),
            }}
            modelValue={[...selected.value].map(toKey)}
            // headers select like rows (reka keeps scroll); header toggles group (single: collapses)
            onUpdate:modelValue={(value) => {
              const keys = value as string[]
              const header = grouped.value
                .flat()
                .find(
                  (row): row is GroupRow<T['value']> =>
                    'type' in row && row.type === 'group' && keys.includes(row.rowKey),
                )
              if (header && !props.multiple) toggleCollapsed(header.label)
              else if (header) toggleGroup(header.values)
              else if (props.multiple) {
                update(new Set(keys.map((key) => fromKey(key) as T['value'])))
              } else {
                // changed row: newly picked or unpicked
                const selectedKeys = [...selected.value].map(toKey)
                const changed =
                  keys.find((key) => !selectedKeys.includes(key)) ??
                  selectedKeys.find((key) => !keys.includes(key))
                if (changed !== undefined) pick(fromKey(changed))
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
                (showsClear.value || showsSave.value) && [
                  // flat and invisible: widens the box to the hanging button's label
                  <div aria-hidden="true" class="invisible flex h-0 overflow-hidden px-2">
                    {footerButton()}
                  </div>,
                  // hangs below, so showing it never moves the list; fits the collision padding's bottom gap
                  <div
                    class="bg-default ring-default absolute inset-x-0 top-full flex rounded-b-md p-2 shadow-lg ring"
                    // keeps focus in the search input, whose blur would close the menu first
                    onMousedown={(event) => event.preventDefault()}
                  >
                    {footerButton()}
                  </div>,
                ],
              ],
              'default': ({ ui }: { ui: { placeholder: () => string; value: () => string } }) => {
                if (slots.default)
                  return [
                    <CustomTrigger>
                      {() =>
                        slots.default!({
                          open: isOpen.value || !!draft.value,
                          items: pickedItems.value,
                        })
                      }
                    </CustomTrigger>,
                  ]
                const picks = pickedItems.value
                const [item] = picks
                if (!item)
                  return [<span class={ui.placeholder()}>{attrs.placeholder ?? '\u{A0}'}</span>]
                if (picks.length > 1)
                  return [
                    <span class={ui.value()}>
                      {slots.selected?.({ items: picks }) ?? `${picks.length} ausgewählt`}
                    </span>,
                  ]

                // one pick with its prefix, as in the list
                return [
                  <span class={[ui.value(), 'flex items-center gap-1.5']}>
                    {slots.prefix?.({ item })}
                    <span class="truncate">{item.label}</span>
                  </span>,
                ]
              },
              'item': ({ item }: { item: ItemRow<T> | GroupRow<T['value']> }) => itemContent(item),
              'empty': props.loading ? loadingNote : emptyNote,
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
                      ? [<div class="shrink-0 *:border-b-0 *:p-0">{filterBar(true)}</div>]
                      : []),
                    ...searchInput({ class: 'min-w-0 flex-1' }),
                    // `ms-auto`: at the end even without a search to push it there
                    <div class="ms-auto flex w-64 shrink-0 gap-1.5">{sheetButtons()}</div>,
                  ],
                }),
                body: () => [
                  // search at the bottom: the list starts halfway down, in thumb reach, and
                  // scrolls up into the space above
                  ...(isThumbReach.value
                    ? [<div aria-hidden="true" class="h-1/2 shrink-0" />]
                    : []),
                  // `mt-auto`, not `justify-end`, which clips the top on overflow
                  <div class={isThumbReach.value && 'mt-auto'}>
                    {grouped.value.length === 0 ? (
                      <p class="text-muted p-4 text-center text-sm">
                        {props.loading ? loadingNote() : emptyNote()}
                      </p>
                    ) : (
                      <div class="space-y-3">
                        {sheetPinned()}
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
