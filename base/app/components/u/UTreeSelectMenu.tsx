import type { InputProps, SelectMenuProps } from '@nuxt/ui'
import type { VNode } from 'vue'
import { chunk } from 'remeda'
import { UButton, UCheckbox, UIcon, UInput, UModal, USelectMenu, UTabs } from '#components'

export type TreeSelectMenuItem = {
  label: string
  value: string
  hint: string
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
    > & {
      items: T[]
      groups: TreeSelectMenuGroup[]
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
      // awaited before emit, spinner meanwhile. throws: no emit, stays open, single restores pick
      onChange?: (value: Single extends true ? string | null : string[]) => Promise<void> | void
      onBlur?: () => void
      disabled?: boolean
      // items/groups loading: trigger spinner, loading note instead of no matches
      loading?: boolean
      // save button label by pick count
      submitLabel?: (count: number) => string
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
      ],
      emits: ['update:modelValue'],
      // two roots (the menu and its mobile sheet), so the attributes are placed by hand
      inheritAttrs: false,
      setup: (props, { emit, attrs, slots }) => {
        // `USelectMenu`'s own filter would drop the group headers, so we filter ourselves.
        const searchTerm = ref('')

        const view = ref<'tree' | 'list'>('tree')

        const filterValues = ref<string[]>([])

        // sheet on phone widths and short landscape touch screens; opens a modal
        const isMobile = useMediaQuery(
          '(max-width: 639px), (pointer: coarse) and (orientation: landscape) and (max-height: 499px)',
        )
        // phone widths: search + results at the bottom (thumb reach); wider: bar on top
        const isThumbReach = useMediaQuery('(max-width: 639px)')
        const draft = ref<Set<string>>()

        // set on open: below while the trigger sits high, else beside (keeps list height);
        // short screens always beside
        const isShort = useMediaQuery('(max-height: 799px)')
        const menu = ref<{ triggerRef?: HTMLElement }>()
        const isBeside = ref(false)
        const isOpen = ref(false)

        function place() {
          const top = menu.value?.triggerRef?.getBoundingClientRect().top ?? 0
          isBeside.value = isShort.value || top >= window.innerHeight / 2
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
        // clear empties pick before `onChange` settles; keep button till then
        const isClearing = ref(false)
        // single: Clear while pick unchanged, Save once changed
        const showsClear = computed(
          () =>
            props.single &&
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

        // sheet, and menu if single or `onChange`: pick into draft; save emits, dismiss cancels
        function startDraft() {
          draft.value = new Set(committed.value)
          pickedOnOpen.value = picked.value
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
        const showsSave = computed(() =>
          props.single ? !closesOnPick.value && picked.value !== pickedOnOpen.value : true,
        )

        function pick(value: string) {
          toggle(value)
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

          if (view.value === 'list') {
            const rows = props.items.filter((item) => passes(item) && matchesItem(item))
            return { groups: [], list: rows }
          }

          const byValue = new Map(props.items.map((item) => [item.value, item]))

          // ungrouped items stay selectable: own group, or listed below the groups
          const inGroup = new Set(props.groups.flatMap((group) => group.values))
          const ungrouped = props.items.filter((item) => !inGroup.has(item.value))
          const entries = [...props.groups]
          if (!props.listUngrouped && ungrouped.length > 0)
            entries.push({
              label: props.ungroupedLabel ?? 'Ohne Gruppe',
              values: ungrouped.map((item) => item.value),
            })

          // one menu group each, so each renders as its own box
          const groups = entries.map<(ItemRow<T> | GroupRow)[]>(
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
                  ungrouped: index === props.groups.length,
                },
                ...(isCollapsed ? [] : items.map((item) => ({ ...item, indent: 1 }))),
              ]
            },
          )

          return {
            groups: groups.filter((rows) => rows.length > 0),
            list: props.listUngrouped
              ? ungrouped.filter((item) => passes(item) && matchesItem(item))
              : [],
          }
        })

        // an empty group would still draw its box
        const grouped = computed(() =>
          tree.value.list.length > 0 ? [...tree.value.groups, tree.value.list] : tree.value.groups,
        )

        // Enter toggles all matches, not just the highlighted row; captured ahead of reka.
        // `searchId` scopes it to this instance: menu and sheet share it, never both mounted.
        // Backspace right after clears the search.
        const searchId = useId()
        let clearsOnBackspace = false
        watch(
          () => isOpen.value || !!draft.value,
          () => (clearsOnBackspace = false),
        )
        useEventListener(
          document,
          'keydown',
          (event) => {
            if (!(event.target instanceof HTMLInputElement) || event.target.id !== searchId) return
            if (event.isComposing) return
            const clears = clearsOnBackspace
            clearsOnBackspace = false
            if (clears && event.key === 'Backspace') {
              event.preventDefault()
              searchTerm.value = ''
              return
            }
            // single: Enter picks highlighted row (default)
            if (props.single || event.key !== 'Enter' || !searchTerm.value.trim()) return
            event.preventDefault()
            event.stopPropagation()
            toggleGroup(grouped.value.flat().flatMap((row) => ('type' in row ? [] : row.value)))
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

        // `compact` for a header row that shares its width with the search and buttons
        const filterBar = (compact = false) => (
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
              <div />
            )}
            {compact ? (
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
            )}
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
                  <div class="shrink-0" style={{ width: `${item.indent * 0.5}rem` }} />
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
                <span class="truncate">{item.label}</span>,
                ...(slots.suffix?.({ item }) ?? []),
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

        const searchInput = (inputProps: Pick<InputProps, 'variant' | 'class'>) => (
          <UInput
            v-model={searchTerm.value}
            type="search"
            icon="lucide:search"
            placeholder={attrs.placeholder ?? 'Suchen…'}
            id={searchId}
            {...inputProps}
          />
        )

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
              color="neutral"
              variant="outline"
              icon="lucide:x"
              label="Auswahl aufheben"
              loading={isSaving.value}
              onClick={() => {
                isClearing.value = true
                if (draft.value) draft.value = new Set()
                void save(null as Value).finally(() => (isClearing.value = false))
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
            loading={props.loading}
            // held shut on mobile, where opening shows the sheet instead
            open={!isMobile.value && isOpen.value}
            onUpdate:open={(open: boolean) => {
              if (isMobile.value) return open && openSheet()
              // save closes once `onChange` settles
              if (!open && isSaving.value) return
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
            searchInput={{ type: 'search', id: searchId }}
            // beside: right (reka flips left), bottom-aligned, grows up.
            // below: left-aligned, no flip above, shrinks to fit
            content={
              isBeside.value
                ? { side: 'right', align: 'end' }
                : { side: 'bottom', align: 'start', sideFlip: false }
            }
            arrow={isBeside.value}
            ui={{
              group: groupBox,
              // striped from the header on; stripe hides the default `before` highlight,
              // so the row highlights itself
              item: 'items-center py-2 rounded-none border-b border-default last:border-b-0 even:bg-elevated/30 data-highlighted:not-data-disabled:bg-elevated',
              // grows with the list up to what fits; min 24rem, below also trigger width
              content: [
                'max-h-(--reka-combobox-content-available-height) w-max max-w-(--reka-combobox-content-available-width)',
                isBeside.value
                  ? 'min-w-96'
                  : 'min-w-[max(var(--reka-combobox-trigger-width),24rem)]',
              ].join(' '),
              empty: 'order-2',
              // stable gutter: collapsing can end the overflow
              viewport: 'order-2 scrollbar-gutter-stable divide-y-0 space-y-3 p-2',
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
              'content-top': () => filterBar(),
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
                    <div class="shrink-0 *:border-b-0 *:p-0">
                      {filterBar(!isLandscapeColumns.value)}
                    </div>,
                    searchInput({ class: 'min-w-0 flex-1' }),
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
                    <div>{filterBar()}</div>,
                    searchInput({ variant: 'none', class: 'border-default border-b px-1 py-2' }),
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
