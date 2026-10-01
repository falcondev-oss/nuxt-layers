import type { InputProps, SelectMenuProps } from '@nuxt/ui'
import type { FunctionalComponent, VNode } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { Slot } from 'reka-ui'
import { chunk, isNonNull, isNonNullish } from 'remeda'
import { Comment, Fragment, h, isVNode, Teleport } from 'vue'
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
  // listed first, above a divider; tree view: in its boxes as well (the ungrouped one too), only
  // there during a search. a filter keeps it up top too
  pinned?: boolean
}
export type UniversalSelectMenuFilter = { label: string; value: string }

// `rowKey`: `USelectMenu`'s value for the row, one string space for item and group rows.
// wraps the item: its own keys (e.g. a `type`) would reach `USelectMenu` and mistype the row
type ItemRow<T> = { type: 'item'; rowKey: string; item: T }

// a slot's output, or `undefined` if it rendered nothing, for a `??` default: Vue wraps every
// slot, so one whose `v-if` didn't take still returns a comment, not `null`
function slotContent(nodes: VNode[] | undefined) {
  return nodes?.some(isContent) ? nodes : undefined
}
function isContent(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(isContent)
  if (!isVNode(node)) return node != null && typeof node !== 'boolean' && node !== ''
  if (node.type === Comment) return false
  if (node.type === Fragment && Array.isArray(node.children)) return node.children.some(isContent)
  return true
}

type GroupRow<V> = {
  type: 'group'
  label: string
  rowKey: string
  // what the checkbox reflects: ignores search and filter
  values: V[]
  // what a click toggles: the shown ones, so a search or filter picks only its matches
  shown: V[]
  collapsed: boolean
  // leftover items' group; styled muted
  ungrouped?: boolean
  // the pinned items' header; never collapses
  pinned?: boolean
}

// collapsed: no `rows`, while `header.shown` still holds its matches
type Group<T extends UniversalSelectMenuItem> = { header: GroupRow<T['value']>; rows: ItemRow<T>[] }

type ModelValue<V, Multiple extends boolean> = (Multiple extends true ? NonNullable<V>[] : V) | null

function checkState<V>(values: V[], picked: Set<V>) {
  if (values.length > 0 && values.every((value) => picked.has(value))) return true
  return values.some((value) => picked.has(value)) ? ('indeterminate' as const) : false
}

// multiple, unless `hideToggleAll` or a `null` item: toggles all shown items as a group header does
type AllRow<V> = {
  type: 'all'
  label: string
  rowKey: string
  // what the click toggles: the shown ones, so a search or filter picks only its matches
  shown: V[]
  // what the checkbox reflects: all items, ignoring search and filter
  checked: boolean | 'indeterminate'
}

// `USelectMenu` draws it as a line between the pinned rows and the rest; `rowKey` only for its types
const separator = { type: 'separator' as const, rowKey: '\0' }
type LabelRow = { type: 'label'; label: string; rowKey: string }

// `USelectMenu` props with no effect here: set by the wrapper, bypassed by its rendering, or
// working on `rowKey`s instead of values
type IneffectiveSelectMenuProps =
  | 'ui'
  | 'content'
  | 'arrow'
  | 'searchInput'
  | 'open'
  | 'defaultOpen'
  | 'ignoreFilter'
  | 'resetSearchTermOnSelect'
  | 'resetModelValueOnClear'
  | 'selectedIcon'
  | 'filterFields'
  | 'by'
  | 'modelModifiers'
  | 'name'
  | 'createItem'
  | 'virtualize'

const groupBox = 'p-0 rounded-md border border-default overflow-hidden'

// reka's `ComboboxItem` throws on a `''` value (its "cleared" value, even in multiple mode), which
// JSON turns into `'""'`. never starts with NUL like a group row's key
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
        (ItemRow<T> | GroupRow<T['value']> | AllRow<T['value']> | LabelRow | typeof separator)[][],
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
      | IneffectiveSelectMenuProps
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
      // `fn` is only called while at least one option is selected
      filter?: { options: readonly F[]; fn: (item: T, filters: F[]) => boolean }
      multiple?: Multiple
      // `null`: no pick; single: also picks an item with value `null`. multiple: an item with value
      // `null` is no pick but clears, to `null`. a value no item holds is dropped once `items` are in
      modelValue?: ModelValue<T['value'], Multiple>
      // awaited before emit, spinner meanwhile. throws: no emit, stays open; single restores
      // pick, multiple keeps picks
      onChange?: (value: ModelValue<T['value'], Multiple>) => Promise<void> | void
      onBlur?: () => void
      disabled?: boolean
      // items/groups loading: trigger spinner, loading note instead of no matches
      loading?: boolean
      // save button label by pick count; `none`: the `null` item is picked (multiple: nothing is)
      submitLabel?: (count: number, none: boolean) => string
      // single: clear button label
      deselectLabel?: string
      // clear x in the trigger; single: also the clear button
      clear?: boolean
      // no search input, in the dropdown and the sheet
      hideSearch?: boolean
      // multiple: no row up top that picks or unpicks all shown items; a `null` item hides it too
      hideToggleAll?: boolean
    }
    slots: {
      // custom trigger, e.g. a button; no clear x or spinner. `picks`: the saved picks; multiple,
      // none saved: the `null` item (`undefined` model: none)
      'default': (props: { open: boolean; picks: T[] }) => VNode[]
      'prefix': (props: { item: T }) => VNode[]
      'description': (props: { item: T }) => VNode[]
      'suffix': (props: { item: T }) => VNode[]
      'hint': (props: { item: T }) => VNode[]
      'filter-item': (props: { item: F }) => VNode[]
      // trigger with more than one pick; default "N ausgewählt"
      'summary': (props: { picks: T[] }) => VNode[]
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
      | 'filter'
      | 'multiple'
      | 'modelValue'
      | 'onChange'
      | 'disabled'
      | 'loading'
      | 'submitLabel'
      | 'deselectLabel'
      | 'clear'
      | 'hideSearch'
      | 'hideToggleAll'
    emits: {
      'update:modelValue': (value: ModelValue<T['value'], Multiple>) => void
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
        'filter',
        'multiple',
        'modelValue',
        'onChange',
        'disabled',
        'loading',
        'submitLabel',
        'deselectLabel',
        'clear',
        'hideSearch',
        'hideToggleAll',
      ],
      emits: ['update:modelValue'],
      // two roots (the menu and its mobile sheet), so the attributes are placed by hand
      inheritAttrs: false,
      setup: (props, { emit, attrs, slots }) => {
        // `USelectMenu`'s own filter would drop the group headers, so we filter ourselves.
        const searchTerm = ref('')

        // a repeated value would list its row twice: the first copy stays, with every copy's groups.
        // an `undefined` value is no value: dropped
        const items = computed(() => {
          const byValue = new Map<T['value'], T>()
          // only repeated values with groups get one; merged into their row once, at the end
          const groupsOf = new Map<T['value'], Set<string>>()
          for (const item of props.items) {
            if (item.value === undefined) {
              console.warn('UUniversalSelectMenu: dropped an item with value `undefined`', item)
              continue
            }
            const first = byValue.get(item.value)
            if (!first) byValue.set(item.value, item)
            else if (item.groups?.length) {
              let groups = groupsOf.get(item.value)
              if (!groups) groupsOf.set(item.value, (groups = new Set(first.groups)))
              for (const group of item.groups) groups.add(group)
            }
          }
          if (groupsOf.size === 0) return [...byValue.values()]
          return Array.from(byValue.values(), (item) => {
            const groups = groupsOf.get(item.value)
            return groups ? { ...item, groups: [...groups] } : item
          })
        })

        const view = ref<'tree' | 'list'>('tree')
        const hasGroups = computed(
          () => props.group !== false && items.value.some((item) => !!item.groups?.length),
        )
        // groups gone: reset, so they return in the tree
        watch(hasGroups, (has) => {
          if (!has) view.value = 'tree'
        })
        const hasFilterBar = computed(() => !!props.filter || hasGroups.value)
        // spares the dropdown the row beneath the search
        const togglesInSearch = computed(
          () => hasGroups.value && !props.filter && !props.hideSearch,
        )

        const filterValues = ref<string[]>([])
        // a pick whose option is gone would filter nothing, yet still count as narrowing
        watch(
          () => props.filter?.options,
          (options) => {
            const kept = filterValues.value.filter((value) =>
              options?.some((option) => option.value === value),
            )
            if (kept.length < filterValues.value.length) filterValues.value = kept
          },
        )

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
        // the menu open, or the sheet
        const isShown = computed(() => isOpen.value || !!draft.value)

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

        // mid-load: an empty or stale list would drop picks for good. the `null` item can be
        // preset before the query settles, so a list of only it is still loading
        const isLoading = computed(
          () => props.loading || items.value.every((item) => item.value === null),
        )
        const known = computed(() => new Set(items.value.map((item) => item.value)))
        // a `null` item is the clear: single picks it by the clear's `null`, multiple clears by it.
        // `items` is deduped, so one at most
        const nullItem = computed(() => items.value.find((item) => item.value === null))
        // `null` is no pick, not a stale one; single: the `null` item's pick once listed
        const model = computed(() => {
          const value = props.modelValue as T['value'] | (T['value'] | null)[] | null | undefined
          if (Array.isArray(value)) return new Set(value.filter(isNonNullish))
          if (value === undefined || (value === null && (props.multiple || !nullItem.value)))
            return new Set<T['value']>()
          return new Set([value])
        })
        // only values an item holds: a stale one looks unpicked (clear x, footer) even while a
        // one-way binding keeps it in the model. mid-load all: a draft opened then would drop one
        // not listed yet
        const committed = computed(() =>
          isLoading.value ? model.value : known.value.intersection(model.value),
        )
        const selected = computed(() => draft.value ?? committed.value)
        // picks a pending `onChange` saves: the trigger shows them till it settles
        const savingPicks = ref<Set<T['value']>>()
        // saved (or saving) picks with an item, in item order: mid-load, a value no item holds yet
        // is missing. a clear saving, or multiple with nothing saved: the `null` item stands for it;
        // no model yet: the placeholder; only stale values: none, so the trigger says unavailable
        const pickedItems = computed(() => {
          const picks = savingPicks.value ?? committed.value
          const savesNothing = savingPicks.value
            ? savingPicks.value.size === 0
            : props.multiple && props.modelValue !== undefined && model.value.size === 0
          if (savesNothing && nullItem.value) return [nullItem.value]
          return items.value.filter((item) => picks.has(item.value))
        })

        const order = computed(() => new Map(items.value.map((item, index) => [item.value, index])))
        // in item order, not pick order; values without an item trail
        const toValue = (values: Set<T['value']>) => {
          const rank = (value: T['value']) => order.value.get(value) ?? order.value.size
          const sorted = [...values].toSorted((a, b) => rank(a) - rank(b))
          // no pick: `null`, never `[]`
          if (sorted.length === 0) return null
          return (props.multiple ? sorted : sorted[0]) as ModelValue<T['value'], Multiple>
        }

        const isSaving = ref(false)
        // no writes: mid-load, a pick or save would go out against a partial list
        const isBusy = computed(() => props.loading || isSaving.value)

        function update(next: Set<T['value']>) {
          if (isBusy.value) return
          if (draft.value) draft.value = next
          else emit('update:modelValue', toValue(next))
        }

        // single: always picks; clear has own button. multiple: the `null` item clears
        function toggle(value: T['value']) {
          if (!props.multiple) return update(new Set([value]))
          if (value === null) return update(new Set())
          const next = new Set(selected.value)
          if (!next.delete(value)) next.add(value)
          update(next)
        }

        // single: pick at open, restored on failed save
        const pickedOnOpen = ref<T['value']>()
        const picked = computed(() => [...selected.value][0])
        const selectedKeys = computed(() => [...selected.value].map(toKey))
        // clear empties pick before `onChange` settles; keep button till closed
        const isClearing = ref(false)

        function toggleMany(values: T['value'][]) {
          const next = new Set(selected.value)
          const isFullySelected = values.every((value) => next.has(value))
          for (const value of values) {
            if (isFullySelected) next.delete(value)
            else next.add(value)
          }
          update(next)
        }

        // group labels, `\0` for the ungrouped box, whose label a real group may share. a search or
        // filter collapses its own, from all expanded, so its matches show; a new search term or
        // filter expands them again
        const collapsed = ref(new Set<string>())
        const narrowedCollapsed = ref(new Set<string>())
        const isNarrowed = computed(
          () => !!searchTerm.value.trim() || filterValues.value.length > 0,
        )
        watch([searchTerm, filterValues], () => (narrowedCollapsed.value = new Set()))

        const collapseKey = ({
          label,
          ungrouped,
        }: Pick<GroupRow<unknown>, 'label' | 'ungrouped'>) => (ungrouped ? '\0' : label)

        function toggleCollapsed(row: GroupRow<T['value']>) {
          const set = isNarrowed.value ? narrowedCollapsed : collapsed
          const next = new Set(set.value)
          const key = collapseKey(row)
          if (!next.delete(key)) next.add(key)
          set.value = next
        }

        // a header click toggles its group (single: collapses it)
        function activate(row: GroupRow<T['value']> | AllRow<T['value']>) {
          if (row.type === 'all' || props.multiple) toggleMany(row.shown)
          else toggleCollapsed(row)
        }

        // drop values no item holds, from the model and an open draft (also once a failed save
        // restores it)
        watch(
          () => [isLoading.value, known.value, model.value, draft.value] as const,
          ([isLoading, known, model]) => {
            if (isLoading) return
            // receiver must be raw: `draft` is a reactive proxy
            if (draft.value && !known.isSupersetOf(draft.value))
              draft.value = known.intersection(draft.value)
            if (committed.value.size < model.size)
              emit('update:modelValue', toValue(committed.value))
          },
          { immediate: true },
        )

        // single + `onChange`: same row picked twice in a row saves. click/tap: within 500ms;
        // Enter: any time
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

        // footer as it was at close, held through the close animation: the saved picks would
        // turn Save into Clear, an empty save would drop it. next open unfreezes
        const frozenFooter = ref<{ clear: boolean; save: boolean; label: string }>()
        watch(isShown, (open) => open && (frozenFooter.value = undefined))

        function close() {
          endDraft()
          // prop close skips `USelectMenu`'s blur, and its search reset: the next open keeps the search
          isOpen.value = false
          attrs.onBlur?.()
        }

        // single, no `onChange`: pick closes, no save button
        const closesOnPick = computed(() => !props.multiple && !props.onChange)
        const isDirty = computed(
          // receiver must be raw: `draft` is a reactive proxy
          () => !!draft.value && committed.value.symmetricDifference(draft.value).size > 0,
        )
        // the `null` item is picked (multiple: nothing is)
        const isNone = computed(
          () => !!nullItem.value && [...selected.value].every((value) => value === null),
        )
        // `clear`: Clear while the picks are unchanged, Save once changed.
        // multiple without `onChange` picks live in the menu, so it keeps Save; the sheet drafts
        const showsClear = computed(
          () =>
            !!props.clear &&
            !nullItem.value &&
            (isClearing.value ||
              (props.multiple
                ? (!!props.onChange || isMobile.value) && selected.value.size > 0 && !isDirty.value
                : picked.value !== undefined && picked.value === pickedOnOpen.value)),
        )
        // nothing picked: "Keine auswählen" only for a changed draft, or while a clear saves
        const showsSave = computed(() => {
          if (selected.value.size === 0) return isDirty.value || isSaving.value
          return props.multiple ? true : !closesOnPick.value && picked.value !== pickedOnOpen.value
        })

        function pick(value: T['value']) {
          if (isBusy.value) return
          // single: the saved row changes nothing, so it closes without a save or emit
          if (!props.multiple && draft.value && value === pickedOnOpen.value) return close()
          toggle(value)
          // sheet, multiple: the `null` row with nothing picked is the clear
          if (props.multiple && value === null && draft.value && !isDirty.value) return clearAll()
          if (!props.multiple && props.onChange && draft.value) {
            const at = Date.now()
            const isDouble = lastPick?.value === value && (isEnterPick || at - lastPick.at < 500)
            lastPick = isDouble ? undefined : { value, at }
            if (!isDouble) return
            return void save(draft.value)
          }
          if (!closesOnPick.value) return
          if (draft.value) emit('update:modelValue', toValue(draft.value))
          close()
        }

        async function save(picks: Set<T['value']>) {
          if (isBusy.value) return
          const value = toValue(picks)
          isSaving.value = true
          savingPicks.value = picks
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
            savingPicks.value = undefined
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
        const toRow = (item: T): ItemRow<T> => ({ type: 'item', rowKey: toKey(item.value), item })

        const isList = computed(() => view.value === 'list' || !hasGroups.value)

        const tree = computed<{
          none: ItemRow<T>[]
          pinned: ItemRow<T>[]
          pinnedHeader?: LabelRow | GroupRow<T['value']>
          groups: Group<T>[]
          list: ItemRow<T>[]
        }>(() => {
          const search = searchTerm.value.trim().toLowerCase()
          const matches = (label: string) => label.toLowerCase().includes(search)
          const matchesSearch = (item: T) =>
            matches(item.label) || (item.search !== undefined && matches(item.search))

          const active = props.filter?.options.filter(({ value }) =>
            filterValues.value.includes(value),
          )
          const passesFilter = (item: T) => !active?.length || props.filter!.fn(item, active)
          const isMatch = (item: T) => passesFilter(item) && matchesSearch(item)

          // the `null` item is the clear, so it sits apart, above the pinned ones
          const none = nullItem.value && isMatch(nullItem.value) ? [toRow(nullItem.value)] : []
          const listed = items.value.filter((item) => isNonNull(item.value))

          // tree view, searching: a match in a box (the ungrouped one too) shows there only.
          // filtering doesn't: a pinned match stays up top as well
          const inBox = (item: T) => !!item.groups?.length || !props.listUngrouped
          const pinned = listed
            .filter(
              (item) => item.pinned && isMatch(item) && (isList.value || !search || !inBox(item)),
            )
            .map(toRow)
          const label = props.pinnedLabel
          // tree view, multiple: a header like a group's, toggling the shown pinned items; else a caption
          const pinnedHeader =
            pinned.length === 0 || !label
              ? undefined
              : !props.multiple || isList.value
                ? { type: 'label' as const, label, rowKey: '\0pinned' }
                : {
                    type: 'group' as const,
                    label,
                    rowKey: '\0pinned',
                    values: listed.filter((item) => item.pinned).map((item) => item.value),
                    shown: pinned.map((row) => row.item.value),
                    collapsed: false,
                    pinned: true,
                  }

          if (isList.value) {
            const rows = listed.filter((item) => !item.pinned && isMatch(item))
            return { none, pinned, pinnedHeader, groups: [], list: rows.map(toRow) }
          }

          // an item may sit in several groups; listed under each, pinned ones too
          const labels = [...new Set(listed.flatMap((item) => item.groups ?? []))]
          const entries = labels.map((label) => ({
            label,
            items: listed.filter((item) => item.groups?.includes(label)),
          }))
          // ungrouped items stay selectable: own group, pinned ones too, or listed below the groups
          // (a pinned one already is, up top)
          const ungrouped = listed.filter((item) => !item.groups?.length)
          if (!props.listUngrouped && ungrouped.length > 0)
            entries.push({ label: props.ungroupedLabel ?? 'Ohne Gruppe', items: ungrouped })

          // one menu group each, so each renders as its own box
          const groups = entries.flatMap<Group<T>>(({ label, items: groupItems }, index) => {
            // matching group label keeps the whole group
            const items = groupItems.filter(
              (item) => passesFilter(item) && (matches(label) || matchesSearch(item)),
            )
            if (items.length === 0) return []
            // the ungrouped entry is only ever pushed after the labelled groups
            const ungrouped = index === labels.length
            const isCollapsed = (isNarrowed.value ? narrowedCollapsed : collapsed).value.has(
              collapseKey({ label, ungrouped }),
            )
            return {
              header: {
                type: 'group',
                label,
                rowKey: groupKey(index),
                values: groupItems.map((item) => item.value),
                shown: items.map((item) => item.value),
                collapsed: isCollapsed,
                ungrouped,
              },
              rows: isCollapsed ? [] : items.map(toRow),
            }
          })

          return {
            none,
            pinned,
            pinnedHeader,
            groups,
            list: props.listUngrouped
              ? ungrouped.filter((item) => !item.pinned && isMatch(item)).map(toRow)
              : [],
          }
        })

        // above the pinned ones: the `null` item, or else the toggle-all row, as unpicking all clears
        const specialRows = computed<(ItemRow<T> | AllRow<T['value']>)[]>(() => {
          const { none, pinned, groups, list } = tree.value
          if (!props.multiple || props.hideToggleAll || nullItem.value) return none
          // a value under several groups counts once; a collapsed group's are left out, as on Enter
          const shown = [
            ...new Set(
              [...pinned, ...groups.flatMap(({ rows }) => rows), ...list].map(
                (row) => row.item.value,
              ),
            ),
          ]
          if (shown.length === 0) return []
          const allShownSelected = shown.every((value) => selected.value.has(value))
          return [
            {
              type: 'all',
              label: allShownSelected ? 'Alle abwählen' : 'Alle auswählen',
              rowKey: '\0all',
              shown,
              checked: checkState(
                items.value.map((item) => item.value).filter(isNonNull),
                selected.value,
              ),
            },
          ]
        })

        // an empty group would still draw its box
        const grouped = computed(() => {
          const { pinned, pinnedHeader, groups, list } = tree.value
          const boxes = groups.map(({ header, rows }) => [header, ...rows])
          const rest = list.length > 0 ? [...boxes, list] : boxes
          const tops = [
            specialRows.value,
            pinnedHeader ? [pinnedHeader, ...pinned] : pinned,
          ].filter((rows) => rows.length > 0)
          const sections = [...tops.flatMap((box) => [box, [separator]]), ...rest]
          return rest.length > 0 ? sections : sections.slice(0, -1)
        })

        // Enter toggles all shown matches (single: a sole match); captured ahead of reka.
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
        // widest since open: a search or filter narrows the rows, the menu keeps its width
        const contentEl = shallowRef<HTMLElement>()
        const openWidth = ref(0)
        watch(
          isOpen,
          (open) => {
            openWidth.value = 0
            contentEl.value = open
              ? (document.querySelector<HTMLElement>(
                  `[data-universal-select="${CSS.escape(searchId)}"]`,
                ) ?? undefined)
              : undefined
          },
          { flush: 'post' },
        )
        useResizeObserver(contentEl, () => {
          if (contentEl.value)
            openWidth.value = Math.max(openWidth.value, contentEl.value.offsetWidth)
        })
        let clearsOnBackspace = false
        // typing moves the highlight to the first match, so it ends arrowing
        const isArrowing = ref(false)
        watch(searchTerm, () => (isArrowing.value = false))
        watch(isShown, () => {
          clearsOnBackspace = false
          isArrowing.value = false
        })
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
            // the sheet has no highlight to arrow to
            if (!isMobile.value && (event.key === 'ArrowUp' || event.key === 'ArrowDown'))
              isArrowing.value = true
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
            // a value under several groups counts once; a collapsed group's are left out
            const matches = [
              ...new Set(
                grouped.value
                  .flat()
                  .flatMap((row) => (row.type === 'item' ? [row.item.value] : [])),
              ),
            ]
            if (!props.multiple) {
              if (matches.length === 1) pick(matches[0]!)
              return
            }
            // the `null` item clears, it's no pick
            const picks = matches.filter(isNonNull)
            // nothing toggled: Backspace stays a Backspace
            if (picks.length === 0) return
            toggleMany(picks)
            clearsOnBackspace = true
          },
          { capture: true },
        )

        // wide enough for two columns of boxes in the sheet (a phone held sideways)
        const isLandscapeColumns = useMediaQuery('(min-width: 768px)')

        // each group joins the shorter column, measured expanded so collapsing never reshuffles
        const groupColumns = computed(() => {
          const columns: { height: number; groups: Group<T>[] }[] = [
            { height: 0, groups: [] },
            { height: 0, groups: [] },
          ]
          for (const group of tree.value.groups) {
            const column = columns[0]!.height <= columns[1]!.height ? columns[0]! : columns[1]!
            column.height += 1 + group.header.shown.length
            column.groups.push(group)
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
                {props.filter && slots.filter ? (
                  slots.filter({
                    'filters': props.filter.options,
                    'modelValue': filterValues.value,
                    'onUpdate:modelValue': (value) => (filterValues.value = value),
                  })
                ) : props.filter ? (
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
                    items={props.filter.options as F[]}
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

        const itemContent = (row: ItemRow<T> | GroupRow<T['value']> | AllRow<T['value']>) => {
          if (row.type === 'all')
            return [
              <UCheckbox size="md" class="pointer-events-none shrink-0" modelValue={row.checked} />,
              <span class="truncate font-medium">{row.label}</span>,
            ]
          if (row.type === 'group')
            return [
              props.multiple && (
                <UCheckbox
                  size="md"
                  class="pointer-events-none shrink-0"
                  modelValue={checkState(row.values, selected.value)}
                />
              ),
              <span
                data-group-header
                class={
                  row.ungrouped
                    ? 'text-muted truncate text-sm'
                    : 'text-highlighted truncate text-sm font-semibold'
                }
              >
                {row.label}
              </span>,
              !row.pinned && (
                <button
                  type="button"
                  class="text-muted hover:text-highlighted hover:bg-accented -my-1 ms-auto flex rounded-md p-1"
                  aria-label={row.collapsed ? 'Aufklappen' : 'Zuklappen'}
                  aria-expanded={!row.collapsed}
                  // keeps focus in the search input, whose blur would close the menu
                  onMousedown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    // else row click toggles group (single: collapses)
                    event.stopPropagation()
                    toggleCollapsed(row)
                  }}
                >
                  <UIcon
                    name={row.collapsed ? 'lucide:chevron-right' : 'lucide:chevron-down'}
                    class="size-5"
                  />
                </button>
              ),
            ]
          const { item } = row
          const description = slotContent(slots.description?.({ item })) ?? item.description
          return [
            props.multiple ? (
              item.value === null ? (
                // clears, no pick to check; keeps the labels aligned
                <span class="size-4 shrink-0" />
              ) : (
                <UCheckbox
                  size="md"
                  class="pointer-events-none shrink-0"
                  modelValue={selected.value.has(item.value)}
                />
              )
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
              {description && <span class="text-muted truncate text-xs">{description}</span>}
            </span>,
            <span class="text-muted ms-auto text-xs">
              {slotContent(slots.hint?.({ item })) ?? item.hint}
            </span>,
          ]
        }

        const sheetRows = (rows: (ItemRow<T> | GroupRow<T['value']> | AllRow<T['value']>)[]) =>
          rows.map((row) => (
            // not a <button>: a group row holds the collapse button
            <div
              role="button"
              class="border-default even:bg-elevated/30 flex w-full items-center gap-1.5 border-b px-2.5 py-3.5 text-start text-sm last:border-b-0"
              onClick={() => (row.type === 'item' ? pick(row.item.value) : activate(row))}
            >
              {itemContent(row)}
            </div>
          ))

        const sheetPinned = () => {
          const { pinned, pinnedHeader, groups, list } = tree.value
          const special = specialRows.value
          const boxes = [
            ...(special.length > 0 ? [<div class={groupBox}>{sheetRows(special)}</div>] : []),
            ...(pinned.length > 0
              ? [
                  <div class={groupBox}>
                    {pinnedHeader?.type === 'label' && (
                      <div class="text-highlighted border-default border-b px-2.5 py-3.5 text-sm font-semibold">
                        {pinnedHeader.label}
                      </div>
                    )}
                    {sheetRows(pinnedHeader?.type === 'group' ? [pinnedHeader, ...pinned] : pinned)}
                  </div>,
                ]
              : []),
          ]
          // the dropdown's band, across the body's padding
          const sections = boxes.flatMap((box) => [box, <div class="bg-accented -mx-4 h-0.75" />])
          return groups.length > 0 || list.length > 0 ? sections : sections.slice(0, -1)
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
                  placeholder="Suchen…"
                  id={searchId}
                  ui={toggles ? { base: 'pe-24', trailing: 'pe-1' } : undefined}
                  {...inputProps}
                  v-slots={toggles ? { trailing: () => viewTabs('sheet') } : undefined}
                />,
              ]

        // single: no count, max one
        const saveLabel = () =>
          props.submitLabel?.(selected.value.size, isNone.value) ??
          (selected.value.size === 0
            ? 'Keine auswählen'
            : props.multiple
              ? `${selected.value.size} auswählen`
              : 'Auswählen')

        const footer = computed(
          () =>
            frozenFooter.value ?? {
              clear: showsClear.value,
              save: showsSave.value,
              label: saveLabel(),
            },
        )

        const hasFooter = computed(() => footer.value.clear || footer.value.save)

        function endDraft() {
          if (draft.value) frozenFooter.value = { ...footer.value }
          draft.value = undefined
        }

        // success closes (draft gone): keeps the clear button through the close animation
        function clearAll() {
          if (isBusy.value) return
          // `null` saved: clearing changes nothing, so it only closes. no model yet: saves the `null`
          if (committed.value.size === 0 && props.modelValue !== undefined) return close()
          const picks = draft.value
          if (picks) draft.value = new Set()
          isClearing.value = true
          // failed (draft still open): multiple gets its picks back for retry
          void save(new Set()).then(() => {
            if (!draft.value) return
            isClearing.value = false
            if (props.multiple) draft.value = picks
          })
        }

        const footerButton = () =>
          footer.value.clear ? (
            <UButton
              class="flex-1 justify-center"
              color="primary"
              variant="subtle"
              icon="lucide:x"
              label={props.deselectLabel ?? 'Auswahl aufheben'}
              loading={isSaving.value}
              disabled={props.loading}
              // closing after a clear: a second tap would save again
              onClick={() => !isClearing.value && clearAll()}
            />
          ) : (
            footer.value.save && (
              <UButton
                class="flex-1 justify-center"
                label={footer.value.label}
                loading={isSaving.value}
                disabled={props.loading}
                // live picks (multiple, no `onChange`) already emitted; re-emit harmless
                onClick={() => void save(selected.value)}
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
            // `null` item picked: the x would clear to it.
            // the menu shows the x for the draft: nothing saved (a value no item holds counts as
            // nothing), nothing to clear
            clear={props.clear && !isBusy.value && !isNone.value && committed.value.size > 0}
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
              if (!open) return endDraft()
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
              // falls through as an attribute; still within the window
              ...(openWidth.value && {
                style: {
                  minWidth: `min(${openWidth.value}px, var(--reka-combobox-content-available-width))`,
                },
              }),
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
                // list view: groups run on as one list, so only its outer ends round
                '[.is-list>:not(:first-child)>&]:rounded-t-none [.is-list>:not(:last-child)>&]:rounded-b-none',
                (!props.hideSearch || hasFilterBar.value) && 'in-[.is-list]:first:rounded-t-none',
                hasFooter.value && 'in-[.is-list]:last:rounded-b-none',
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
                hasFooter.value && 'rounded-b-none',
              ]
                .filter(Boolean)
                .join(' '),
              // clips for the box instead, rounded with it
              focusScope: 'overflow-hidden rounded-[inherit]',
              empty: 'order-2',
              // empty: its padding would pad the empty text's bottom
              viewport: `order-2 divide-y-0 empty:hidden ${isList.value ? 'is-list' : 'space-y-2 p-2'}`,
            }}
            modelValue={selectedKeys.value}
            // headers select like rows (reka keeps scroll); header toggles group (single: collapses)
            onUpdate:modelValue={(value) => {
              const keys = value as string[]
              const header = grouped.value
                .flat()
                .find(
                  (row): row is GroupRow<T['value']> | AllRow<T['value']> =>
                    (row.type === 'group' || row.type === 'all') && keys.includes(row.rowKey),
                )
              if (header) activate(header)
              // the `null` row is never selected: it only shows up as a click, which saves the clear
              else if (props.multiple && keys.includes(toKey(null))) clearAll()
              else if (props.multiple)
                update(new Set(keys.map((key) => fromKey(key) as T['value'])))
              else {
                // changed row: newly picked or unpicked
                const changed =
                  keys.find((key) => !selectedKeys.value.includes(key)) ??
                  selectedKeys.value.find((key) => !keys.includes(key))
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
                hasFooter.value && [
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
                          open: isShown.value,
                          picks: pickedItems.value,
                        })
                      }
                    </CustomTrigger>,
                  ]
                const picks = pickedItems.value
                const [item] = picks
                // loaded, only values no item holds saved (a one-way binding keeps them): say so.
                // an empty list may still be on its way
                if (!item && !isLoading.value && !savingPicks.value && model.value.size > 0)
                  return [
                    <span class={[ui.value(), 'text-muted flex items-center gap-1.5']}>
                      <UIcon name="lucide:circle-alert" class="size-4 shrink-0" />
                      <span class="truncate">Nicht verfügbar</span>
                    </span>,
                  ]
                if (!item)
                  return [<span class={ui.placeholder()}>{attrs.placeholder ?? '\u{A0}'}</span>]
                if (picks.length > 1)
                  return [
                    <span class={ui.value()}>
                      {slotContent(slots.summary?.({ picks })) ?? `${picks.length} ausgewählt`}
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
              'item': ({
                item,
              }: {
                item: ItemRow<T> | GroupRow<T['value']> | AllRow<T['value']>
              }) => itemContent(item),
              'empty': props.loading ? loadingNote : emptyNote,
            }}
          />,
          isMobile.value && (
            <UModal
              fullscreen
              close={false}
              open={!!draft.value}
              onUpdate:open={(open) => !open && !isSaving.value && close()}
              // reka focuses the first tabbable, the search: the keyboard would cover the rows.
              // the dialog takes focus instead, so the trap holds
              content={{
                onOpenAutoFocus: (event: Event) => {
                  event.preventDefault()
                  ;(event.currentTarget as HTMLElement | null)?.focus()
                },
              }}
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
                                  {groups.map(({ header, rows }) => (
                                    <div class={groupBox}>{sheetRows([header, ...rows])}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div class="space-y-3">
                              {tree.value.groups.map(({ header, rows }) => (
                                <div class={groupBox}>{sheetRows([header, ...rows])}</div>
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
