import { UAvatar, UBadge, UCard, UTreeSelectMenu } from '#components'

const users = [
  { label: 'Tom Weinhold', value: 'tom', hint: '10427', tag: 'Vollzeit' },
  { label: 'Alina Berger', value: 'alina', hint: '10583', tag: 'Teilzeit' },
  { label: 'Mika Lindner', value: 'mika', hint: '10671', tag: 'Vollzeit' },
  { label: 'Jonas Kerner', value: 'jonas', hint: '10744', tag: 'Azubi' },
  { label: 'Svenja Rauh', value: 'svenja', hint: '10812', tag: 'Vollzeit' },
  { label: 'Lea Hofmann', value: 'lea', hint: '20138', tag: 'Teilzeit' },
  { label: 'Nico Brandt', value: 'nico', hint: '20256', tag: 'Vollzeit' },
  { label: 'Pia Sommer', value: 'pia', hint: '20390', tag: 'Vollzeit' },
  { label: 'Markus Thiel', value: 'markus', hint: '30119', tag: 'Vollzeit' },
  { label: 'Carolin Vogt', value: 'carolin', hint: '30264', tag: 'Teilzeit' },
  { label: 'Ben Ostermann', value: 'ben', hint: '30347', tag: 'Azubi' },
  { label: 'Yasmin Keller', value: 'yasmin', hint: '30455', tag: 'Vollzeit' },
  { label: 'Renate Bischof', value: 'renate', hint: '40172', tag: 'Teilzeit' },
  { label: 'Daniel Schuster', value: 'daniel', hint: '40288', tag: 'Vollzeit' },
  { label: 'Helena Wirtz', value: 'helena', hint: '40361', tag: 'Vollzeit' },
  { label: 'Felix Arnold', value: 'felix', hint: '10856', tag: 'Vollzeit' },
  { label: 'Sophie Krause', value: 'sophie', hint: '10913', tag: 'Teilzeit' },
  { label: 'Lukas Engel', value: 'lukas', hint: '10977', tag: 'Azubi' },
  { label: 'Hannah Pohl', value: 'hannah', hint: '11024', tag: 'Vollzeit' },
  { label: 'Tobias Reuter', value: 'tobias', hint: '11089', tag: 'Vollzeit' },
  { label: 'Marie Seidel', value: 'marie', hint: '20417', tag: 'Teilzeit' },
  { label: 'Jan Petersen', value: 'jan', hint: '20482', tag: 'Vollzeit' },
  { label: 'Emilia Graf', value: 'emilia', hint: '20533', tag: 'Azubi' },
  { label: 'Paul Winter', value: 'paul', hint: '30512', tag: 'Vollzeit' },
  { label: 'Laura Beck', value: 'laura', hint: '30578', tag: 'Teilzeit' },
  { label: 'Stefan Lorenz', value: 'stefan', hint: '30631', tag: 'Vollzeit' },
  { label: 'Nina Frank', value: 'nina', hint: '30694', tag: 'Vollzeit' },
  { label: 'Ursula Haas', value: 'ursula', hint: '40345', tag: 'Teilzeit' },
  { label: 'Oliver Kuhn', value: 'oliver', hint: '40419', tag: 'Vollzeit' },
  { label: 'Katharina Maier', value: 'katharina', hint: '50103', tag: 'Vollzeit' },
  { label: 'Dennis Roth', value: 'dennis', hint: '50167', tag: 'Teilzeit' },
  { label: 'Julia Schreiber', value: 'julia', hint: '50224', tag: 'Vollzeit' },
  { label: 'Kevin Albrecht', value: 'kevin', hint: '50289', tag: 'Azubi' },
  { label: 'Sarah Busch', value: 'sarah', hint: '50341', tag: 'Vollzeit' },
  { label: 'Moritz Jung', value: 'moritz', hint: '60118', tag: 'Vollzeit' },
  { label: 'Anna Lehmann', value: 'anna', hint: '60176', tag: 'Teilzeit' },
  { label: 'David Franke', value: 'david', hint: '60233', tag: 'Vollzeit' },
  { label: 'Clara Wolff', value: 'clara', hint: '60297', tag: 'Azubi' },
  { label: 'Simon Hartmann', value: 'simon', hint: '60354', tag: 'Vollzeit' },
  { label: 'Miriam Scholz', value: 'miriam', hint: '60412', tag: 'Teilzeit' },
  // in no team, so they trail the groups ungrouped
  { label: 'Frieda Brandl', value: 'frieda', hint: '70105', tag: 'Teilzeit' },
  { label: 'Konrad Weiß', value: 'konrad', hint: '70163', tag: 'Vollzeit' },
  { label: 'Ida Neumann', value: 'ida', hint: '70221', tag: 'Azubi' },
  { label: 'Theo Lang', value: 'theo', hint: '70284', tag: 'Vollzeit' },
].toSorted((a, b) => a.label.localeCompare(b.label))

const userTags = new Map(users.map((user) => [user.value, user.tag]))

const tags = [
  { label: 'Vollzeit', value: 'Vollzeit' },
  { label: 'Teilzeit', value: 'Teilzeit' },
  { label: 'Azubi', value: 'Azubi' },
] as const

const avatarColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error'] as const
const userColors = new Map(
  users.map((user, index) => [user.value, avatarColors[index % avatarColors.length]!]),
)

const teams = [
  {
    label: 'Entwicklung',
    values: [
      'tom',
      'alina',
      'mika',
      'jonas',
      'svenja',
      'felix',
      'sophie',
      'lukas',
      'hannah',
      'tobias',
    ],
  },
  { label: 'Design', values: ['lea', 'nico', 'pia', 'marie', 'jan', 'emilia'] },
  {
    label: 'Vertrieb',
    values: ['markus', 'carolin', 'ben', 'yasmin', 'paul', 'laura', 'stefan', 'nina'],
  },
  { label: 'Verwaltung', values: ['renate', 'daniel', 'helena', 'ursula', 'oliver'] },
  { label: 'Support', values: ['katharina', 'dennis', 'julia', 'kevin', 'sarah'] },
  { label: 'Marketing', values: ['moritz', 'anna', 'david', 'clara', 'simon', 'miriam'] },
]

function filterUser(user: (typeof users)[number], filters: { value: string }[]) {
  return filters.some((filter) => filter.value === user.tag)
}

const userSlots = {
  'filter-item': ({ item }: { item: { label: string } }) => [
    <UBadge size="sm" color="neutral" variant="subtle">
      {item.label}
    </UBadge>,
  ],
  'prefix': ({ item }: { item: { label: string; value: string } }) => [
    <UAvatar
      size="2xs"
      alt={item.label}
      color={userColors.get(item.value)}
      class="shrink-0"
      ui={{ fallback: 'overflow-visible text-clip' }}
    />,
  ],
  'suffix': ({ item }: { item: { value: string } }) => [
    <UBadge size="sm" color="neutral" variant="subtle">
      {userTags.get(item.value)}
    </UBadge>,
  ],
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'ZeiterfassungPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Zeiterfassung',
        breadcrumb: [{ label: 'Übersicht', to: '/' }, { label: 'Zeiterfassung' }],
      })

      // single/multiple × no `onChange`/succeeds/fails × without/with filters × with/without groups
      const sections = [
        { title: 'Single', single: true },
        { title: 'Multiple', single: false },
      ].map(({ title, single }) => ({
        title,
        single,
        groups: [
          { title: undefined, onChange: undefined },
          { title: 'onChange', onChange: () => wait(1000) },
          {
            title: 'onChange · Fehler',
            onChange: () =>
              wait(1000).then(() => {
                throw new Error('Speichern fehlgeschlagen')
              }),
          },
        ].map(({ title, onChange }) => ({
          title,
          onChange,
          variants: [false, true].flatMap((withFilters) =>
            [true, false].map((withGroups) => ({
              withFilters,
              withGroups,
              value: ref<string | string[] | null>(single ? null : []),
            })),
          ),
        })),
      }))

      return () => (
        <div class="flex flex-col gap-6">
          {sections.map(({ title, single, groups }) => (
            <UCard
              v-slots={vSlots(UCard, {
                header: () => [<h2 class="text-highlighted font-semibold">{title}</h2>],
                default: () => [
                  <div class="flex flex-col gap-6">
                    {groups.map(({ title, onChange, variants }) => (
                      <div class="flex flex-col gap-2">
                        {title && <h3 class="text-sm font-medium">{title}</h3>}
                        <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
                          {variants.map(({ withFilters, withGroups, value }) => (
                            <div class="flex flex-col gap-1">
                              <span class="text-muted text-xs">
                                {[withFilters && 'Filter', !withGroups && 'Ohne Gruppen']
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                              <UTreeSelectMenu
                                single={single}
                                onChange={onChange}
                                class="mt-auto w-full"
                                items={users}
                                groups={withGroups ? teams : undefined}
                                filters={withFilters ? tags : undefined}
                                filterFn={withFilters ? filterUser : undefined}
                                v-model={value.value}
                                placeholder="Mitarbeiter wählen"
                                v-slots={userSlots}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>,
                ],
              })}
            />
          ))}
        </div>
      )
    },
  }),
)
