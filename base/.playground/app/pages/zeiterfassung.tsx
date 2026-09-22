import { z } from 'zod'
import {
  UAvatar,
  UBadge,
  UCard,
  UField,
  UForm,
  UInputDurationMinutes,
  UTextarea,
  UTreeSelectMenu,
} from '#components'

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
]

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

const teams = {
  Entwicklung: [
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
  Design: ['lea', 'nico', 'pia', 'marie', 'jan', 'emilia'],
  Vertrieb: ['markus', 'carolin', 'ben', 'yasmin', 'paul', 'laura', 'stefan', 'nina'],
  Verwaltung: ['renate', 'daniel', 'helena', 'ursula', 'oliver'],
  Support: ['katharina', 'dennis', 'julia', 'kevin', 'sarah'],
  Marketing: ['moritz', 'anna', 'david', 'clara', 'simon', 'miriam'],
}

const schema = z.object({
  userIds: z.array(z.string()).min(1).meta({ title: 'Mitarbeiter' }),
  durationMinutes: z.number().min(1).meta({ title: 'Dauer' }),
  description: z.string().min(1).max(200).meta({ title: 'Beschreibung' }),
})

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

      const form = useForm({
        schema,
        sourceValues: () => ({
          userIds: [],
          durationMinutes: null,
          description: null,
        }),
        async submit({ values }) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          console.debug(values)
        },
      })

      return () => (
        <UCard
          class="max-w-md"
          v-slots={vSlots(UCard, {
            header: () => [<h1 class="text-highlighted font-semibold">Zeit erfassen</h1>],
            default: () => [
              <UForm form={form} submitLabel="Erstellen" successToast={{ title: 'Zeit erfasst' }}>
                <div class="flex flex-col gap-4 pb-4">
                  <UField
                    field={form.fields.userIds.$use()}
                    v-slots={{
                      default: ({ bind }) => [
                        <UTreeSelectMenu
                          class="w-48"
                          items={users}
                          groups={teams}
                          filters={tags}
                          filterFn={(user: (typeof users)[number], filters) =>
                            filters.some((filter) => filter.value === user.tag)
                          }
                          {...bind}
                          placeholder="Mitarbeiter wählen"
                          v-slots={{
                            'filter-item': ({ item }) => [
                              <UBadge size="sm" color="neutral" variant="subtle">
                                {item.label}
                              </UBadge>,
                            ],
                            'prefix': ({ item }) => [
                              <UAvatar
                                size="2xs"
                                alt={item.label}
                                color={userColors.get(item.value)}
                                class="shrink-0"
                                ui={{ fallback: 'overflow-visible text-clip' }}
                              />,
                            ],
                            'suffix': ({ item }) => [
                              <UBadge size="sm" color="neutral" variant="subtle">
                                {userTags.get(item.value)}
                              </UBadge>,
                            ],
                          }}
                        />,
                      ],
                    }}
                  />
                  <UField
                    field={form.fields.durationMinutes.$use()}
                    v-slots={{
                      default: ({ bind }) => [<UInputDurationMinutes class="w-full" {...bind} />],
                    }}
                  />
                  <UField
                    field={form.fields.description.$use()}
                    v-slots={{
                      default: ({ bind }) => [<UTextarea class="w-full" rows={3} {...bind} />],
                    }}
                  />
                </div>
              </UForm>,
            ],
          })}
        />
      )
    },
  }),
)
