import type { VNode } from 'vue'
import { ForwardSlots, UButton, UIcon, UPopover, USelectMenu, USeparator } from '#components'

/** the slice of the TanStack column API this header drives */
type HeaderColumn = {
  getIsSorted: () => false | 'asc' | 'desc'
  toggleSorting: (desc: boolean) => void
  clearSorting: () => void
}

const sortOptions = [
  { direction: 'asc', label: 'Aufsteigend', icon: 'i-lucide-arrow-up-narrow-wide' },
  { direction: 'desc', label: 'Absteigend', icon: 'i-lucide-arrow-down-wide-narrow' },
] as const

/** both variants open under the header, left-aligned */
const content = { align: 'start' } as const

/** `as` isn't declared on `USelectMenu` — it reaches Reka's trigger through `$attrs` */
const selectMenuAttrs = { as: 'div' }

export default defineSetupComponent(
  (_: {
    props: {
      column: HeaderColumn
      label: string
      /** the picked filter options, only used in the select menu variant */
      modelValue?: string[]
      /** whether this column's filter is active — `column.getIsFiltered()` lags a render behind */
      filtered?: boolean
      /**
       * the column's filter options — with them the header filters through a select menu, without them
       * it opens a popover holding whatever the default slot renders
       */
      items?: string[]
      /** the select menu's search input — the options variant only */
      noSearch?: boolean
    }
    emits: {
      /** clear this column's filter — only fired from the button shown while `filtered` */
      'clear': () => void
      'update:modelValue': (value: string[]) => void
    }
    slots: {
      /** the filter controls, shown under the sort options — the popover variant only */
      default?: () => VNode[]
      /** the active filter, shown subtly under the column name */
      subtitle?: () => VNode[]
      /** every `USelectMenu` item slot is forwarded, e.g. `#item-label` */
      [key: `item${string}`]: (props: any) => any
    }
  }) =>
    options(_, {
      name: 'TableColumnHeader',
      // the shared render helpers make the root a fragment, so extra attributes are handed to the
      // popup component explicitly
      inheritAttrs: false,
      props: ['column', 'label', 'modelValue', 'filtered', 'items', 'noSearch'],
      emits: ['clear', 'update:modelValue'],
      setup: (props, { emit, slots, attrs }) => {
        /** clicking the active direction again clears the sorting */
        function toggleSorting(direction: 'asc' | 'desc') {
          if (props.column.getIsSorted() === direction) props.column.clearSorting()
          else props.column.toggleSorting(direction === 'desc')
        }

        const sortedIcon = computed(() => {
          const sorted = props.column.getIsSorted()
          return sorted
            ? sortOptions.find((option) => option.direction === sorted)!.icon
            : undefined
        })

        /** the item slots the page passed, forwarded to the select menu */
        const itemSlots = computed(() =>
          Object.fromEntries(Object.entries(slots).filter(([name]) => name.startsWith('item'))),
        )

        // only the column name opens the header — the subtitle below it stays inert
        const renderTrigger = () => (
          <div class="hover:bg-elevated data-[state=open]:bg-elevated -mx-2.5 flex w-fit cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left">
            {props.label}
            {sortedIcon.value ? <UIcon name={sortedIcon.value} class="size-4 shrink-0" /> : null}
          </div>
        )

        const renderSubtitle = () =>
          slots.subtitle ? (
            <span class="text-muted w-full text-xs font-normal wrap-break-word whitespace-normal">
              {props.filtered ? (
                <UIcon name="i-lucide-funnel" class="mr-1 size-3 shrink-0 align-[-1px]" />
              ) : null}
              {slots.subtitle()}
            </span>
          ) : null

        const renderSortOptions = () => (
          <div class="flex gap-1 p-1">
            {sortOptions.map((option) => (
              <UButton
                key={option.direction}
                label={option.label}
                icon={option.icon}
                size="sm"
                color={props.column.getIsSorted() === option.direction ? 'primary' : 'neutral'}
                variant={props.column.getIsSorted() === option.direction ? 'soft' : 'ghost'}
                onClick={() => toggleSorting(option.direction)}
              />
            ))}
          </div>
        )

        const renderClearButton = () =>
          props.filtered ? (
            <div class="p-1">
              <UButton
                label="Filter löschen"
                icon="i-lucide-funnel-x"
                size="sm"
                variant="ghost"
                color="neutral"
                block
                onClick={() => emit('clear')}
              />
            </div>
          ) : null

        return () =>
          props.items ? (
            // the options variant: the filter is the select menu's own list
            <div class="flex w-full flex-col items-start">
              <ForwardSlots slots={itemSlots.value}>
                <USelectMenu
                  {...{ ...attrs, ...selectMenuAttrs }}
                  modelValue={props.modelValue ?? []}
                  onUpdate:modelValue={(value) => emit('update:modelValue', value)}
                  multiple
                  items={props.items}
                  searchInput={!props.noSearch}
                  content={content}
                  ui={{ content: 'w-fit min-w-48' }}
                  variant="none"
                  class="w-fit p-0"
                  trailing={false}
                  v-slots={vSlots(USelectMenu, {
                    'default': () => [renderTrigger()],
                    'content-top': () => [renderSortOptions(), <USeparator />],
                    'content-bottom': () => [
                      ...(props.filtered ? [<USeparator />] : []),
                      <>{renderClearButton()}</>,
                    ],
                  })}
                />
              </ForwardSlots>

              {renderSubtitle()}
            </div>
          ) : (
            // the custom variant: the filter is whatever the page renders into the default slot
            <div class="flex w-full flex-col items-start">
              <UPopover
                {...attrs}
                content={content}
                v-slots={vSlots(UPopover, {
                  content: () => [
                    renderSortOptions(),
                    ...(slots.default
                      ? [<USeparator />, <div class="p-2">{slots.default()}</div>]
                      : []),
                    ...(props.filtered ? [<USeparator />, <>{renderClearButton()}</>] : []),
                  ],
                })}
              >
                {renderTrigger()}
              </UPopover>

              {renderSubtitle()}
            </div>
          )
      },
    }),
)
