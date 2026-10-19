import { UAttribute, UBadge, UButton, UContainer, UDash, USection, UTable } from '#components'

const invoices = [
  { number: 'RE-2026-0412', date: '03.10.2026', amount: '1.240,00 €' },
  { number: 'RE-2026-0388', date: '01.09.2026', amount: '980,50 €' },
]

function render() {
  return (
    <UContainer class="flex max-w-3xl flex-col gap-10 py-6">
      <USection title="Stammdaten">
        <UAttribute label="Kundennummer">
          <span class="font-medium">K-10427</span>
        </UAttribute>
        <UAttribute label="Firma">Nordwind GmbH</UAttribute>
        <UAttribute label="Ansprechpartner">Tom Weinhold</UAttribute>
        <UAttribute label="Telefon">{null}</UAttribute>
        <UAttribute label="Status">
          <UBadge label="Aktiv" color="success" variant="subtle" />
        </UAttribute>
        <UAttribute label="USt-IdNr.">{undefined}</UAttribute>
        <UAttribute label="Notiz" wide>
          Lieferungen nur werktags zwischen 7 und 15 Uhr. Zufahrt über das Tor an der Rückseite,
          vorher beim Pförtner melden.
        </UAttribute>
      </USection>

      <USection title="Rechnungen" aside={`${invoices.length} offen`}>
        <UTable
          class="col-span-full"
          data={invoices}
          columns={[
            { accessorKey: 'number', header: 'Nummer' },
            { accessorKey: 'date', header: 'Datum' },
            { accessorKey: 'amount', header: 'Betrag' },
          ]}
        />
      </USection>

      <USection
        title="Adresse"
        aside="Hauptsitz"
        v-slots={vSlots(USection, {
          actions: () => [
            <UButton icon="i-lucide-pencil" size="xs" color="neutral" variant="ghost" />,
          ],
          default: () => [
            <UAttribute label="Straße">Hafenstraße 12</UAttribute>,
            <UAttribute label="Ort">20457 Hamburg</UAttribute>,
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
