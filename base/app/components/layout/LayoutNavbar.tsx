import type {
  BreadcrumbItem,
  BreadcrumbProps,
  DashboardNavbarProps,
  DashboardNavbarSlots,
  DashboardPanelProps,
  DashboardToolbarProps,
  NavigationMenuItem,
  NavigationMenuProps,
} from '@nuxt/ui'
import type { MaybeRefOrGetter, Ref, VNode } from 'vue'
import type { ToolbarTool } from '../../composables/useToolbar'
import type { AddPropertyPrefix } from '../../types/helpers'
import { useResizeObserver } from '@vueuse/core'
import * as R from 'remeda'
import {
  ForwardSlots,
  UBreadcrumb,
  UDashboardNavbar,
  UDashboardPanel,
  UDashboardSidebarCollapse,
  UDashboardToolbar,
  UNavigationMenu,
  UOverflowButtons,
  USeparator,
} from '#components'
import { useFreeSpace } from '../../composables/useFreeSpace'
import { toolbarToolsKey } from '../../composables/useToolbar'
import { mergeSlotClass } from '../../utils/ui'

export default defineSetupComponent(
  (_: {
    props: {
      panel?: DashboardPanelProps
      navbar?: {
        sidebarToggle?: boolean
        title?: string
        breadcrumb?: BreadcrumbItem[]
        breadcrumbUi?: BreadcrumbProps<BreadcrumbItem>['ui']
        ui?: DashboardNavbarProps['ui']
      }
      tabs?: {
        items?: NavigationMenuItem[]
        ui?: NavigationMenuProps['ui']
      }
      tools?: {
        items?: NavigationMenuItem[]
        left?: boolean
        ui?: NavigationMenuProps['ui']
      }
      toolbarUi?: DashboardToolbarProps['ui']
    }
    slots: {
      'default': () => VNode[]
      'navbar-left'?: () => VNode[]
      'navbar-leading'?: () => VNode[]
      'navbar-title'?: () => VNode[]
      'navbar-trailing'?: () => VNode[]
      'navbar-actions'?: () => VNode[]
    } & AddPropertyPrefix<DashboardNavbarSlots, 'navbar'>
  }) =>
    options(_, {
      name: 'LayoutNavbar',
      props: ['panel', 'navbar', 'tabs', 'tools', 'toolbarUi'],
      emits: [],
      setup: (props, { slots }) => {
        const appConfig = useAppConfig()

        // rendered manually in the `left` slot below
        const omitNavbarSlots = [
          'navbar-left',
          'navbar-leading',
          'navbar-title',
          'navbar-trailing',
          'navbar-right',
          'navbar-actions',
        ] satisfies (keyof typeof slots)[]
        const navbarSlots = computed(() =>
          R.pipe(
            slots,
            R.pickBy((_slot, key) => key.startsWith('navbar-')),
            R.omit(omitNavbarSlots),
            R.mapKeys((key) => key.replace('navbar-', '')),
          ),
        )

        // added by the content rendered inside this navbar through `useToolbar()`
        // `ref()`'s deep unwrapping blows up on the recursive `NavigationMenuItem` type
        const providedTools = ref([]) as Ref<MaybeRefOrGetter<ToolbarTool>[]>
        provide(toolbarToolsKey, providedTools)

        const toolItems = computed(() => [
          ...(props.tools?.items ?? []),
          ...providedTools.value.map((tool) => toValue(tool)),
        ])

        /** `compact`: tighter rows, for the wrapped toolbar where the tools are the only line. */
        const toolsMenu = (compact = false) => (
          <UNavigationMenu
            items={toolItems.value}
            ui={{
              ...props.tools?.ui,
              ...(compact && {
                item: mergeSlotClass(props.tools?.ui?.item, 'py-1'),
              }),
            }}
          />
        )

        // how much of the tabs' toolbar is left for the tools, next to the tabs. Measured off an
        // anchor that stays at the end of that toolbar, so the answer doesn't change once the
        // tools have moved to a toolbar of their own — they'd have no way back.
        const toolsAnchor = ref<HTMLElement>()
        const toolsSpace = useFreeSpace(toolsAnchor)
        // only ever the inline row — the wrapped one is compact, and a width measured there
        // would not be the width the tools need to come back up
        const toolsRow = ref<HTMLElement>()
        // `shrink-0`, so this stays the tools' natural width even once the row runs short
        const toolsWidth = ref(0)
        useResizeObserver(toolsRow, () => {
          const width = toolsRow.value?.offsetWidth
          if (width) toolsWidth.value = width
        })
        // while wrapped the tools are out of the inline row, so nothing would re-measure them
        // there. Forget the width when they change, and they come back up to be measured again.
        watch(toolItems, () => {
          toolsWidth.value = 0
        })

        const toolsWrapped = computed(
          () => toolsSpace.value < toolsWidth.value + 7 /* 2*gap-1.5 + 1px divider */,
        )
        // the tools sit flush right, so what is left of the row past their own width is the
        // clear space between them and the tabs
        const toolsCrowded = computed(
          () => !toolsWrapped.value && toolsSpace.value - toolsWidth.value < 3 * 16 /* 3rem */,
        )
        /** A divider goes between the tabs and the tools whenever they share a line and sit
         * close enough to run together. Left-aligned tools always do — they follow the tabs. */
        const showDivider = computed(
          () =>
            !!props.tabs &&
            toolItems.value.length > 0 &&
            !toolsWrapped.value &&
            (props.tools?.left || toolsCrowded.value),
        )

        // This `h1` stands in for the navbar's own, which never renders once `left` is taken
        // over — so everything upstream would have layered onto that slot has to be layered on
        // by hand: the theme's own classes come from `app.config`, the per-instance ones from
        // `ui.title`, and either may be a replacer function rather than classes to merge.
        const navbarTitleClass = computed(() =>
          mergeSlotClass(
            props.navbar?.ui?.title,
            mergeSlotClass(
              appConfig.ui?.dashboardNavbar?.slots?.title,
              'text-highlighted font-semibold whitespace-nowrap',
            )(''),
          )(''),
        )

        const navbarUi = computed<DashboardNavbarProps['ui']>(() => ({
          ...props.navbar?.ui,
          toggle: mergeSlotClass(props.navbar?.ui?.toggle, '-ml-1'),
          // Exactly as wide as the title and breadcrumb need — neither truncates, and no room
          // is held back from the actions.
          left: mergeSlotClass(
            props.navbar?.ui?.left,
            // A breadcrumb wraps, so this column may give way once the row runs short — down to
            // the widest line it still has to show whole. With nothing to reflow, `shrink-0`
            // instead keeps that edge put: an action giving way would otherwise free space for
            // the title to grow into and come straight back.
            props.navbar?.breadcrumb ? 'min-w-0' : 'shrink-0',
          ),
          ...(props.navbar?.breadcrumb && {
            root: mergeSlotClass(props.navbar.ui?.root, 'h-auto min-h-(--ui-header-height) py-2'),
          }),
        }))

        return () => (
          <UDashboardPanel
            {...props.panel}
            v-slots={vSlots(UDashboardPanel, {
              header: () => [
                ...(props.navbar
                  ? [
                      <ForwardSlots slots={navbarSlots.value}>
                        <UDashboardNavbar
                          ui={navbarUi.value}
                          {...useFreeSpace.root}
                          class="bg-white"
                          title={props.navbar.title}
                          v-slots={vSlots(UDashboardNavbar, {
                            left: () => [
                              // the toggle stays outside `left` upstream, so it survives a
                              // `navbar-left` that replaces everything beside it
                              ...(props.navbar?.sidebarToggle
                                ? [<UDashboardSidebarCollapse class="-ml-1" />]
                                : []),

                              ...(slots['navbar-left']?.() ?? [
                                <div class="flex min-w-0 flex-col items-start gap-0.5">
                                  {/* title and breadcrumb size the column between them, so
                                    neither is ever cut off */}
                                  <div class="flex items-center gap-1.5">
                                    {slots['navbar-leading']?.()}
                                    <h1 data-slot="title" class={navbarTitleClass.value}>
                                      {slots['navbar-title']?.() ?? props.navbar?.title}
                                    </h1>
                                    {slots['navbar-trailing']?.()}
                                  </div>

                                  {props.navbar?.breadcrumb ? (
                                    <UBreadcrumb
                                      items={props.navbar.breadcrumb}
                                      ui={{
                                        ...props.navbar.breadcrumbUi,
                                        link: mergeSlotClass(
                                          props.navbar.breadcrumbUi?.link,
                                          'text-xs',
                                        ),
                                        separatorIcon: mergeSlotClass(
                                          props.navbar.breadcrumbUi?.separatorIcon,
                                          'size-3.5',
                                        ),
                                        // onto further lines once the row runs short, rather
                                        // than truncating the trail
                                        list: mergeSlotClass(
                                          props.navbar.breadcrumbUi?.list,
                                          'flex-wrap',
                                        ),
                                      }}
                                    />
                                  ) : null}
                                </div>,
                              ]),
                            ],
                            right: (slotProps) => [
                              <>{slots['navbar-right']?.(slotProps)}</>,
                              <UOverflowButtons id="navbar-actions">
                                {slots['navbar-actions']?.()}
                              </UOverflowButtons>,
                            ],
                          })}
                        />
                      </ForwardSlots>,
                    ]
                  : []),
                ...(props.tabs || toolItems.value.length > 0
                  ? [
                      <UDashboardToolbar
                        ui={{
                          ...props.toolbarUi,
                          // right-aligned tools: stretched, so the space held open past the
                          // tabs is the row's own and the divider can centre itself in it
                          ...(!props.tools?.left &&
                            props.tabs && {
                              left: mergeSlotClass(props.toolbarUi?.left, 'grow'),
                            }),
                        }}
                        {...useFreeSpace.root}
                        class={['bg-white', (props.tabs || props.tools?.left) && '*:first:-ml-2']}
                        v-slots={vSlots(UDashboardToolbar, {
                          ...((props.tabs || props.tools?.left) && {
                            left: () => [
                              // the fixed edge the room for the tools is measured from
                              ...(props.tabs
                                ? [
                                    <UNavigationMenu
                                      items={props.tabs.items}
                                      highlight
                                      variant="link"
                                      class="shrink-0"
                                      ui={props.tabs.ui}
                                    />,
                                  ]
                                : []),
                              // Everything past the tabs is room the tools may take, so all of it
                              // counts as free for the measurement, whether the tools are
                              // standing in it or not, and they keep their way back.
                              ...(props.tools?.left
                                ? [
                                    ...(showDivider.value
                                      ? [
                                          <USeparator
                                            {...useFreeSpace.free}
                                            orientation="vertical"
                                            class="h-7"
                                          />,
                                        ]
                                      : []),
                                    ...(toolsWrapped.value
                                      ? []
                                      : [
                                          <div
                                            ref={toolsRow}
                                            {...useFreeSpace.free}
                                            class="shrink-0"
                                          >
                                            {toolsMenu()}
                                          </div>,
                                        ]),
                                  ]
                                : // right-aligned: held open here, for the divider to centre in
                                  [
                                    <div {...useFreeSpace.free} class="flex grow justify-center">
                                      {showDivider.value ? (
                                        <USeparator orientation="vertical" class="h-7" />
                                      ) : null}
                                    </div>,
                                  ]),
                            ],
                          }),
                          right: () => [
                            // `hidden`, so it measures the row without taking a place in it
                            <div ref={toolsAnchor} class="hidden" />,
                            // the room the tools stand in is the room the anchor measures — read
                            // as free whether they are in it or not, so they keep their way back
                            ...(!props.tools?.left && !toolsWrapped.value
                              ? [
                                  <div ref={toolsRow} {...useFreeSpace.free} class="shrink-0">
                                    {toolsMenu()}
                                  </div>,
                                ]
                              : []),
                          ],
                        })}
                      />,
                    ]
                  : []),
                ...(toolsWrapped.value
                  ? [
                      <UDashboardToolbar
                        ui={props.toolbarUi}
                        class="min-h-fit! bg-white"
                        v-slots={vSlots(UDashboardToolbar, {
                          default: () => [<div class="-ml-2 shrink-0">{toolsMenu(true)}</div>],
                        })}
                      />,
                    ]
                  : []),
              ],
              body: () => slots.default?.() ?? [],
            })}
          />
        )
      },
    }),
)
