import type { BreadcrumbItem, NavigationMenuItem } from '@nuxt/ui'
import type { VNode } from 'vue'
import { LayoutNavbar, LayoutSidebar, UIcon } from '#components'

/** The flat subset of `NavigationMenuItem` a page needs — the recursive full type blows up
 * `RouteMeta`'s inference when it reaches it through this augmentation. */
type ShellTab = { label: string; icon?: string; to?: string; exact?: boolean }

declare module '#app' {
  interface PageMeta {
    title?: string
    breadcrumb?: { label: string; to?: string }[]
    tabs?: ShellTab[]
  }
}

export default defineSetupComponent(
  (_: {
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'ShellLayout',
      props: [],
      emits: [],
      setup: (_props, { slots }) => {
        const route = useRoute()

        const navbar = computed<{
          title?: string
          sidebarToggle: boolean
          breadcrumb?: BreadcrumbItem[]
        }>(() => ({
          title: route.meta.title,
          sidebarToggle: true,
          breadcrumb: route.meta.breadcrumb,
        }))
        const tabs = computed<{ items: NavigationMenuItem[] } | undefined>(() => {
          const items = route.meta.tabs
          return items && { items }
        })

        return () => (
          <LayoutSidebar
            search={{
              placeholder: 'Projekte, Aufgaben, Kunden …',
              groups: [
                {
                  id: 'navigation',
                  label: 'Navigation',
                  items: [
                    { label: 'Übersicht', icon: 'i-lucide-layout-dashboard', to: '/' },
                    { label: 'Projekte', icon: 'i-lucide-folder-kanban', to: '/' },
                    { label: 'Archiv', icon: 'i-lucide-archive', to: '/archiv' },
                    { label: 'Zeiterfassung', icon: 'i-lucide-timer', to: '/zeiterfassung' },
                    { label: 'Einstellungen', icon: 'i-lucide-settings', to: '/' },
                  ],
                },
                {
                  id: 'projects',
                  label: 'Projekte',
                  items: [
                    { label: 'Website Relaunch', suffix: 'Acme GmbH', icon: 'i-lucide-folder' },
                    { label: 'Mobile App', suffix: 'Nordwind AG', icon: 'i-lucide-folder' },
                    { label: 'Intranet Migration', suffix: 'Stadtwerke', icon: 'i-lucide-folder' },
                  ],
                },
              ],
            }}
            items={[
              {
                label: 'Übersicht',
                icon: 'i-lucide-layout-dashboard',
              },
              {
                label: 'Projekte',
                icon: 'i-lucide-folder-kanban',
                badge: '6',
                to: '/',
              },
              {
                label: 'Aufgaben',
                icon: 'i-lucide-circle-check',
                badge: '23',
              },
              {
                label: 'Kunden',
                icon: 'i-lucide-building-2',
              },
              {
                label: 'Zeiterfassung',
                icon: 'i-lucide-timer',
                to: '/zeiterfassung',
              },
              {
                label: 'Einstellungen',
                icon: 'i-lucide-settings',
                children: [
                  { label: 'Organisation' },
                  { label: 'Mitglieder' },
                  { label: 'Benachrichtigungen' },
                  { label: 'Abrechnung' },
                ],
              },
            ]}
            bottomItems={[
              {
                label: 'Hilfe & Support',
                icon: 'i-lucide-life-buoy',
              },
              {
                label: 'Feedback geben',
                icon: 'i-lucide-message-circle',
              },
              {
                label: 'Was ist neu?',
                icon: 'i-lucide-sparkles',
                badge: 'v0.37',
              },
            ]}
            userMenu={{
              name: 'Tom Weinhold',
              avatar: { src: 'https://github.com/DrJume.png' },
              items: [
                {
                  icon: 'lucide:user-round',
                  label: 'Profil',
                },
                {
                  icon: 'lucide:settings',
                  label: 'Kontoeinstellungen',
                },
                {
                  icon: 'lucide:log-out',
                  label: 'Abmelden',
                },
              ],
            }}
            v-slots={vSlots(LayoutSidebar, {
              logo: () => [
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-orbit" class="text-primary size-6 shrink-0" />
                  <span class="text-highlighted text-lg leading-none font-semibold">
                    Falkenflug
                  </span>
                </div>,
              ],
              icon: () => [<UIcon name="i-lucide-orbit" class="text-primary size-6" />],
              default: () => [
                <LayoutNavbar
                  navbar={navbar.value}
                  tabs={tabs.value}
                  v-slots={vSlots(LayoutNavbar, {
                    default: () => slots.default?.() ?? [],
                  })}
                />,
              ],
            })}
          />
        )
      },
    }),
)
