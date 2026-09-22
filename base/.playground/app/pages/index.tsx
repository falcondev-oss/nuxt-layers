import { Teleport } from 'vue'
import { NuxtPage, UButton } from '#components'

function render() {
  return (
    <>
      <Teleport defer to="#navbar-actions">
        <UButton
          label="Projektplan exportieren"
          icon="i-lucide-download"
          color="neutral"
          variant="subtle"
        />
        <UButton label="Projekt hinzufügen" icon="i-lucide-plus" color="primary" />
      </Teleport>

      <NuxtPage />
    </>
  )
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'IndexPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Projekte',
        breadcrumb: [
          { label: 'Übersicht', to: '/' },
          { label: 'Kunden', to: '/' },
          { label: 'Projekte' },
        ],
        tabs: [
          { label: 'Alle Projekte', icon: 'i-lucide-list', to: '/', exact: true },
          { label: 'Archiv', icon: 'i-lucide-archive', to: '/archiv' },
        ],
      })

      return render
    },
  }),
)
