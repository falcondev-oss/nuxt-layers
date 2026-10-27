import type {
  ArrayOrNested,
  AvatarProps,
  DashboardSearchProps,
  DashboardSidebarProps,
  DropdownMenuItem,
  NavigationMenuItem,
  NavigationMenuProps,
  NavigationMenuSlots,
} from '@nuxt/ui'
import type { VNode } from 'vue'
import type { AddPropertyPrefix } from '../../types/helpers'
import { mapKeys, pickBy, pipe } from 'remeda'
import {
  UButton,
  UDashboardGroup,
  UDashboardSearch,
  UDashboardSearchButton,
  UDashboardSidebar,
  UDropdownMenu,
  UNavigationMenu,
} from '#components'
import { mergeSlotClass } from '../../utils/ui'

export default defineSetupComponent(
  (_: {
    props: {
      sidebar?: DashboardSidebarProps
      logo?: {
        src?: string
        iconSrc?: string
      }
      search?: DashboardSearchProps
      items?: NavigationMenuItem[]
      bottomItems?: NavigationMenuItem[]
      userMenu?: {
        name: string
        avatar?: AvatarProps
        items: ArrayOrNested<DropdownMenuItem>
      }
      itemsUi?: NavigationMenuProps['ui']
      bottomItemsUi?: NavigationMenuProps['ui']
    }
    /** `items-*` and `bottom-items-*` are the slots of the navigation menus, e.g. `items-<item.slot>`
     * for the content of an item with `slot` set */
    slots: {
      default: () => VNode[]
      logo?: () => VNode[]
      icon?: () => VNode[]
    } & AddPropertyPrefix<NavigationMenuSlots, 'items'> &
      AddPropertyPrefix<NavigationMenuSlots, 'bottom-items'>
  }) =>
    options(_, {
      name: 'LayoutSidebar',
      props: [
        'sidebar',
        'logo',
        'search',
        'items',
        'bottomItems',
        'userMenu',
        'itemsUi',
        'bottomItemsUi',
      ],
      emits: [],
      setup: (props, { slots }) => {
        const config = useRuntimeConfig()

        // picked on every render: `slots` is not reactive, so a `computed` would miss a slot that
        // comes and goes with a `v-if`
        const menuSlots = (prefix: string) =>
          pipe(
            slots,
            pickBy((_slot, key) => key.startsWith(prefix)),
            mapKeys((key) => key.slice(prefix.length)),
          )

        return () => (
          <UDashboardGroup
            storage="local"
            storageKey={`${config.public.projectId}-dashboard`}
            unit="rem"
          >
            <UDashboardSidebar
              {...props.sidebar}
              class="bg-white"
              mode="drawer"
              collapsible
              ui={{
                ...props.sidebar?.ui,
                header: mergeSlotClass(props.sidebar?.ui?.header, 'border-b border-default'),
                footer: mergeSlotClass(props.sidebar?.ui?.footer, 'border-t border-default'),
              }}
              v-slots={vSlots(UDashboardSidebar, {
                ...((props.logo?.src || props.logo?.iconSrc || slots.logo || slots.icon) && {
                  header: ({ collapsed }) => [
                    ...(collapsed
                      ? []
                      : (slots.logo?.() ??
                        (props.logo?.src
                          ? [<img class="h-5 w-auto shrink-0" src={props.logo.src} />]
                          : []))),
                    ...(collapsed || (!props.logo?.src && !slots.logo)
                      ? [
                          <div class={{ 'mx-auto': collapsed }}>
                            {slots.icon?.() ??
                              (props.logo?.iconSrc ? (
                                <img class="size-5" src={props.logo.iconSrc} />
                              ) : null)}
                          </div>,
                        ]
                      : []),
                  ],
                }),
                default: ({ collapsed }) => [
                  ...(props.search
                    ? [
                        // height and negative margins line the border up with the `LayoutNavbar` toolbar's, cancelling the sidebar body's padding
                        <div class="border-default -mx-4 -mt-2 -mb-2 flex h-[calc(--spacing(12)+1px)] shrink-0 items-center border-b px-4 sm:max-lg:-mx-6 sm:max-lg:px-6">
                          <UDashboardSearchButton
                            collapsed={collapsed}
                            variant="outline"
                            tooltip
                            block
                          />
                        </div>,
                      ]
                    : []),
                  ...(props.items
                    ? [
                        <UNavigationMenu
                          collapsed={collapsed}
                          items={props.items}
                          orientation="vertical"
                          ui={props.itemsUi}
                          v-slots={menuSlots('items-')}
                        />,
                      ]
                    : []),
                  ...(props.bottomItems
                    ? [
                        <UNavigationMenu
                          collapsed={collapsed}
                          items={props.bottomItems}
                          orientation="vertical"
                          class="mt-auto"
                          ui={props.bottomItemsUi}
                          v-slots={menuSlots('bottom-items-')}
                        />,
                      ]
                    : []),
                ],
                ...(props.userMenu && {
                  footer: ({ collapsed }) => [
                    <UDropdownMenu
                      items={props.userMenu!.items}
                      // the collapsed trigger is only an icon wide
                      ui={{
                        content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
                      }}
                    >
                      <UButton
                        label={collapsed ? undefined : props.userMenu!.name}
                        trailingIcon={collapsed ? undefined : 'ph:caret-up-down'}
                        icon={props.userMenu!.avatar ? undefined : 'lucide:user-round'}
                        avatar={props.userMenu!.avatar}
                        color="neutral"
                        variant="ghost"
                        block
                        square={collapsed}
                        class="data-[state=open]:bg-elevated"
                        ui={{
                          leadingIcon: 'text-accented',
                          trailingIcon: 'text-dimmed',
                        }}
                      />
                    </UDropdownMenu>,
                  ],
                }),
              })}
            />

            {props.search ? <UDashboardSearch colorMode={false} {...props.search} /> : null}

            {slots.default?.()}
          </UDashboardGroup>
        )
      },
    }),
)
