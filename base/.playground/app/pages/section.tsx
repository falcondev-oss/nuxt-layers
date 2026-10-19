import { UAttribute, UBadge, UButton, UContainer, UDash, USection, UTable } from '#components'

const milestones = [
  { name: 'Konzept', due: '03.10.2026', owner: 'Tom Weinhold' },
  { name: 'Design', due: '01.11.2026', owner: 'Mara Lindqvist' },
]

function render() {
  return (
    <UContainer class="flex max-w-3xl flex-col gap-10 py-6">
      <USection title="Projekt">
        <UAttribute label="Projektnummer">
          <span class="font-medium">P-0042</span>
        </UAttribute>
        <UAttribute label="Kunde">Nordwind GmbH</UAttribute>
        <UAttribute label="Ansprechpartner">Tom Weinhold</UAttribute>
        <UAttribute label="Telefon">{null}</UAttribute>
        <UAttribute label="Status">
          <UBadge label="Aktiv" color="success" variant="subtle" />
        </UAttribute>
        <UAttribute label="Budget">{undefined}</UAttribute>
        <UAttribute label="Notiz" wide>
          Abstimmung jeden Montag um 10 Uhr. Protokolle liegen im geteilten Projektordner, offene
          Punkte gehen vorher per Mail an alle Beteiligten.
        </UAttribute>
      </USection>

      <USection title="Meilensteine" aside={`${milestones.length} offen`}>
        <UTable
          class="col-span-full"
          data={milestones}
          columns={[
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'due', header: 'Fällig' },
            { accessorKey: 'owner', header: 'Verantwortlich' },
          ]}
        />
      </USection>

      <USection
        title="Ort"
        aside="Büro"
        v-slots={vSlots(USection, {
          actions: () => [
            <UButton icon="i-lucide-pencil" size="xs" color="neutral" variant="ghost" />,
          ],
          default: () => [
            <UAttribute label="Straße">Musterstraße 1</UAttribute>,
            <UAttribute label="Stadt">12345 Musterstadt</UAttribute>,
          ],
        })}
      />

      <p class="text-sm">
        UDash allein: <UDash />
      </p>
    </UContainer>
  )
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'SectionPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Section',
      })

      return render
    },
  }),
)
