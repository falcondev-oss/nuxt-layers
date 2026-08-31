import { LayoutNavbar, LayoutSidebar, NuxtPage, UButton, UIcon } from '#components'

function render() {
  return (
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
          active: true,
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
            <span class="text-highlighted text-lg leading-none font-semibold">Falkenflug</span>
          </div>,
        ],
        icon: () => [<UIcon name="i-lucide-orbit" class="text-primary size-6" />],
        default: () => [
          <LayoutNavbar
            navbar={{
              title: 'Projekte',
              sidebarToggle: true,
              breadcrumb: [
                { label: 'Übersicht', to: '/' },
                { label: 'Kunden', to: '/' },
                { label: 'Projekte' },
              ],
            }}
            tabs={{
              items: [
                {
                  label: 'Alle Projekte',
                  icon: 'i-lucide-list',
                  to: '/',
                  exact: true,
                },
                {
                  label: 'Archiv',
                  icon: 'i-lucide-archive',
                  to: '/archiv',
                },
              ],
            }}
            v-slots={vSlots(LayoutNavbar, {
              'navbar-actions': () => [
                <UButton
                  label="Projektplan exportieren"
                  icon="i-lucide-download"
                  color="neutral"
                  variant="subtle"
                />,
                <UButton label="Projekt hinzufügen" icon="i-lucide-plus" color="primary" />,
              ],
              'default': () => [<NuxtPage />],
            })}
          />,
        ],
      })}
    />
  )
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'IndexPage',
    props: [],
    emits: [],
    setup: () => render,
  }),
)
