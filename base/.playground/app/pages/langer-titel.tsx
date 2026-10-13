import { UContainer } from '#components'

function render() {
  return (
    <UContainer class="text-muted space-y-2 py-6 text-sm">
      <p>
        Fenster schmaler ziehen: Der Titel bricht um, bevor eine Aktion ins Überlaufmenü wandert.
      </p>
      <p>
        Erst wenn der Titel bei seinem längsten Wort angekommen ist, weichen die Aktionen — und
        kommen zurück, sobald das Fenster wieder breiter wird.
      </p>
    </UContainer>
  )
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'LangerTitelPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Gefährdungsbeurteilung für Arbeiten an elektrischen Anlagen und Betriebsmitteln',
        actions: [
          { label: 'Als PDF herunterladen', icon: 'i-lucide-file-down', variant: 'outline' },
          { label: 'Kopie bearbeiten', icon: 'i-lucide-copy' },
        ],
      })

      return render
    },
  }),
)
