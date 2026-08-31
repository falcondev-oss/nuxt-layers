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
import * as R from 'remeda'
import {
  ForwardSlots,
  UBreadcrumb,
  UDashboardNavbar,
  UDashboardPanel,
  UDashboardSidebarCollapse,
  UDashboardToolbar,
  UNavigationMenu,
} from '#components'
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
        ui?: NavigationMenuProps['ui']
      }
      toolbarUi?: DashboardToolbarProps['ui']
    }
    slots: {
      'default': () => VNode[]
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

        const navbarUi = computed<DashboardNavbarProps['ui']>(() => ({
          ...props.navbar?.ui,
          toggle: mergeSlotClass(props.navbar?.ui?.toggle, '-ml-1'),
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
                          class="bg-white"
                          title={props.navbar.title}
                          v-slots={vSlots(UDashboardNavbar, {
                            left: () => [
                              ...(props.navbar?.sidebarToggle
                                ? [<UDashboardSidebarCollapse class="-ml-1" />]
                                : []),

                              <div class="flex min-w-0 flex-col items-start gap-0.5">
                                <div class="flex min-w-0 items-center gap-1.5">
                                  <h1 class="text-highlighted truncate font-semibold">
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
                                    }}
                                  />
                                ) : null}
                              </div>,
                            ],
                            right: (slotProps) => [
                              <>{slots['navbar-right']?.(slotProps)}</>,
                              <div id="navbar-actions" class="flex items-center gap-2">
                                {slots['navbar-actions']?.()}
                              </div>,
                            ],
                          })}
                        />
                      </ForwardSlots>,
                    ]
                  : []),
                ...(props.tabs || toolItems.value.length > 0
                  ? [
                      <UDashboardToolbar
                        ui={props.toolbarUi}
                        class="bg-white *:first:-ml-2"
                        v-slots={vSlots(UDashboardToolbar, {
                          left: () => [
                            props.tabs ? (
                              <UNavigationMenu
                                items={props.tabs.items}
                                highlight
                                variant="link"
                                ui={props.tabs.ui}
                              />
                            ) : (
                              <UNavigationMenu
                                items={toolItems.value}
                                highlight
                                ui={props.tools?.ui}
                              />
                            ),
                          ],
                          ...(props.tabs && {
                            right: () => [
                              <UNavigationMenu
                                items={toolItems.value}
                                highlight
                                ui={props.tools?.ui}
                              />,
                            ],
                          }),
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
