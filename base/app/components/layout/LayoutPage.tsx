import type {
  ButtonProps,
  FooterProps,
  FooterSlots,
  HeaderProps,
  HeaderSlots,
  NavigationMenuItem,
  NavigationMenuProps,
} from '@nuxt/ui'
import type { VNode } from 'vue'
import type { AddPropertyPrefix } from '../../types/helpers'
import { mapKeys, omit, pickBy, pipe } from 'remeda'
import { UActions, UFooter, UHeader, UMain, UNavigationMenu, USeparator } from '#components'

const actionDefaults = {
  variant: 'subtle',
} satisfies Partial<ButtonProps>

export default defineSetupComponent(
  (_: {
    props: {
      header?: {
        logo?: {
          src?: string
          iconSrc?: string
        }
        navigation?: NavigationMenuProps
        actions?: ButtonProps[]
        ui?: HeaderProps['ui']
        mobileActions?: ButtonProps[]
      }
      footer?: {
        items?: NavigationMenuItem[]
        actions?: ButtonProps[]
        ui?: FooterProps['ui']
      }
    }
    slots: {
      default: () => VNode[]
    } & AddPropertyPrefix<HeaderSlots, 'header'> &
      AddPropertyPrefix<FooterSlots, 'footer'>
  }) =>
    options(_, {
      name: 'LayoutPage',
      props: ['header', 'footer'],
      emits: [],
      setup: (props, { slots }) => {
        const omitHeaderSlots = [
          'header-title',
          'header-right',
          'header-default',
          'header-body',
        ] satisfies (keyof typeof slots)[]

        const headerSlots = computed(() =>
          pipe(
            slots,
            pickBy((_slot, key) => key.startsWith('header-')),
            omit(omitHeaderSlots),
            mapKeys((key) => key.replace('header-', '')),
          ),
        )

        const omitFooterSlots = [
          'footer-left',
          'footer-right',
          'footer-default',
        ] satisfies (keyof typeof slots)[]

        const footerSlots = computed(() =>
          pipe(
            slots,
            pickBy((_slot, key) => key.startsWith('footer-')),
            omit(omitFooterSlots),
            mapKeys((key) => key.replace('footer-', '')),
          ),
        )

        return () => (
          <div>
            {props.header ? (
              <UHeader
                ui={props.header.ui}
                v-slots={vSlots(UHeader, {
                  ...((props.header.logo || slots['header-title']) && {
                    title: () =>
                      slots['header-title']?.() ??
                      (props.header?.logo
                        ? [
                            ...(props.header.logo.src
                              ? [<img class="h-5 w-auto shrink-0" src={props.header.logo.src} />]
                              : []),
                            ...(!props.header.logo.src && props.header.logo.iconSrc
                              ? [<img class="size-5" src={props.header.logo.iconSrc} />]
                              : []),
                          ]
                        : []),
                  }),

                  default: () =>
                    props.header?.navigation
                      ? [<UNavigationMenu {...props.header.navigation} />]
                      : [],

                  ...((props.header.actions || slots['header-right']) && {
                    right: () =>
                      slots['header-right']?.() ?? [
                        ...(props.header?.mobileActions
                          ? [
                              <UActions
                                class="md:hidden"
                                actions={props.header.mobileActions}
                                defaults={actionDefaults}
                              />,
                            ]
                          : []),
                        ...(props.header?.actions
                          ? [
                              <UActions
                                class="max-sm:hidden"
                                actions={props.header.actions}
                                defaults={actionDefaults}
                              />,
                            ]
                          : []),
                      ],
                  }),

                  body: () =>
                    slots['header-body']?.() ?? [
                      <div class="flex flex-col gap-4">
                        {props.header?.navigation ? (
                          <UNavigationMenu {...props.header.navigation} orientation="vertical" />
                        ) : null}
                        {props.header?.navigation && props.header.actions ? <USeparator /> : null}
                        {props.header?.actions ? (
                          <UActions
                            class="flex-col"
                            actions={props.header.actions}
                            defaults={actionDefaults}
                          />
                        ) : null}
                      </div>,
                    ],

                  ...headerSlots.value,
                })}
              />
            ) : null}
            <UMain>{slots.default?.()}</UMain>
            {props.footer ? (
              <UFooter
                ui={props.footer.ui}
                v-slots={vSlots(UFooter, {
                  left: () =>
                    slots['footer-left']?.() ?? [
                      <p class="text-muted text-sm">Copyright © {new Date().getFullYear()}</p>,
                    ],

                  default: () =>
                    props.footer?.items
                      ? [<UNavigationMenu items={props.footer.items} variant="link" />]
                      : [],

                  ...((props.footer.actions || slots['footer-right']) && {
                    right: () =>
                      slots['footer-right']?.() ?? [
                        <UActions
                          actions={props.footer?.actions}
                          defaults={{ variant: 'ghost' }}
                        />,
                      ],
                  }),

                  ...footerSlots.value,
                })}
              />
            ) : null}
          </div>
        )
      },
    }),
)
