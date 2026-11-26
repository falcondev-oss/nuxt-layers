import type { VNodeChild } from 'vue'
import { UBadge, UCard, UContainer, UUniversalSelectMenu } from '#components'

type Item = {
  label: string
  value: string
  hint?: string
  groups?: (string | { value: string })[]
  disabled?: boolean
}

// `Website Relaunch` and `Mobile App` are group items: their items name them by `{ value }`
const projects: Item[] = [
  { label: 'Website Relaunch', value: 'relaunch' },
  { label: 'Design', value: 'design', groups: [{ value: 'relaunch' }] },
  { label: 'Frontend', value: 'frontend', groups: [{ value: 'relaunch' }] },
  { label: 'Backend', value: 'backend', groups: [{ value: 'relaunch' }] },
  { label: 'Mobile App', value: 'app' },
  { label: 'iOS', value: 'ios', groups: [{ value: 'app' }] },
  { label: 'Android', value: 'android', groups: [{ value: 'app' }] },
  // no group item: grouped only visually
  { label: 'Intranet', value: 'intranet', groups: ['Weitere'] },
  { label: 'Shop', value: 'shop', groups: ['Weitere'] },
]

// `Mobile App` is listed under `Nordwind AG`, so its group nests in that one
const nested: Item[] = [
  { label: 'Nordwind AG', value: 'nordwind' },
  { label: 'Mobile App', value: 'app', groups: [{ value: 'nordwind' }] },
  { label: 'Wartung', value: 'wartung', groups: [{ value: 'nordwind' }] },
  { label: 'iOS', value: 'ios', groups: [{ value: 'app' }] },
  { label: 'Android', value: 'android', groups: [{ value: 'app' }] },
]

// two group items with the same label: each heads only the items that name its value
const sameLabels: Item[] = [
  { label: 'Mobile App', value: 'app-nordwind', hint: 'Nordwind AG' },
  { label: 'iOS', value: 'ios-nordwind', groups: [{ value: 'app-nordwind' }] },
  { label: 'Android', value: 'android-nordwind', groups: [{ value: 'app-nordwind' }] },
  { label: 'Mobile App', value: 'app-suedhafen', hint: 'Südhafen GmbH' },
  { label: 'iOS', value: 'ios-suedhafen', groups: [{ value: 'app-suedhafen' }] },
]

type StatusItem = Item & { status?: 'aktiv' | 'archiviert'; search?: string }

// `Aktiv` passes `Website Relaunch` but not its `Frontend`, and only the items of `Mobile App`;
// `Archiviert` passes `Mobile App` but none of its items. `Abnahme` has no status, so every
// filter passes it. searching `Nordwind` matches `Website Relaunch` by its search text alone
const withStatus: StatusItem[] = [
  { label: 'Website Relaunch', value: 'relaunch', status: 'aktiv', search: 'Nordwind AG' },
  { label: 'Design', value: 'design', groups: [{ value: 'relaunch' }], status: 'aktiv' },
  { label: 'Frontend', value: 'frontend', groups: [{ value: 'relaunch' }], status: 'archiviert' },
  { label: 'Backend', value: 'backend', groups: [{ value: 'relaunch' }], status: 'aktiv' },
  { label: 'Abnahme', value: 'abnahme', groups: [{ value: 'relaunch' }] },
  { label: 'Mobile App', value: 'app', status: 'archiviert' },
  { label: 'iOS', value: 'ios', groups: [{ value: 'app' }], status: 'aktiv' },
  { label: 'Android', value: 'android', groups: [{ value: 'app' }], status: 'aktiv' },
]

// `Aktiv` fails `Nordwind AG`, so its header toggles its shown items. `Mobile App`, its header
// or its row, then stands for `Android` only, not the hidden `iOS`
const nestedWithStatus: StatusItem[] = [
  { label: 'Nordwind AG', value: 'nordwind', status: 'archiviert' },
  { label: 'Mobile App', value: 'app', groups: [{ value: 'nordwind' }], status: 'aktiv' },
  { label: 'Wartung', value: 'wartung', groups: [{ value: 'nordwind' }], status: 'aktiv' },
  { label: 'iOS', value: 'ios', groups: [{ value: 'app' }], status: 'archiviert' },
  { label: 'Android', value: 'android', groups: [{ value: 'app' }], status: 'aktiv' },
]

const statusFilter = {
  options: [
    { label: 'Aktiv', value: 'aktiv' },
    { label: 'Archiviert', value: 'archiviert' },
  ],
  // no status: no filter value, so it passes
  fn: (item: StatusItem, filters: { value: string }[]) =>
    !item.status || filters.some((filter) => filter.value === item.status),
}

const statusSlots = {
  suffix: ({ item }: { item: StatusItem }) =>
    item.status
      ? [
          <UBadge
            size="sm"
            variant="subtle"
            color={item.status === 'aktiv' ? 'success' : 'neutral'}
          >
            {statusFilter.options.find((option) => option.value === item.status)?.label}
          </UBadge>,
        ]
      : [],
}

const withDisabled: Item[] = [
  { label: 'Website Relaunch', value: 'relaunch' },
  { label: 'Design', value: 'design', groups: [{ value: 'relaunch' }] },
  {
    label: 'Frontend (gesperrt)',
    value: 'frontend',
    groups: [{ value: 'relaunch' }],
    disabled: true,
  },
  // a disabled group item: its header toggles only its items
  { label: 'Mobile App', value: 'app', disabled: true },
  { label: 'iOS', value: 'ios', groups: [{ value: 'app' }] },
  { label: 'Android', value: 'android', groups: [{ value: 'app' }] },
]

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function demo(title: string, value: unknown, select: () => VNodeChild) {
  return (
    <UCard v-slots={{ header: () => <p class="font-medium">{title}</p> }}>
      <div class="flex flex-col gap-2">
        {select()}
        <code class="text-muted text-xs">{JSON.stringify(value)}</code>
      </div>
    </UCard>
  )
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'SelectGroupItemsPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Gruppeneinträge',
      })

      const implicit = ref<string[] | null>(null)
      const explicit = ref<string[] | null>(null)
      const explicitSaved = ref<string[] | null>(null)
      // every item of a group assigned directly, without the group item: opening the menu adds it
      const implicitDirect = ref<string[] | null>(['design', 'frontend', 'backend'])
      // the group item and direct assignments of its items, already in the model: these stay,
      // with a plain checkbox. picking the group item anew drops them
      const explicitGroupAndDirect = ref<string[] | null>(['relaunch', 'design', 'frontend'])
      const implicitNested = ref<string[] | null>(null)
      const explicitNested = ref<string[] | null>(null)
      const explicitDisabled = ref<string[] | null>(['relaunch', 'frontend'])
      // the unpicked disabled item keeps the group item unpicked
      const implicitDisabled = ref<string[] | null>(null)
      const implicitFiltered = ref<string[] | null>(null)
      const explicitFiltered = ref<string[] | null>(null)
      const implicitNestedFiltered = ref<string[] | null>(null)
      const explicitSameLabels = ref<string[] | null>(null)
      const single = ref<string | null>(null)

      return () => (
        <UContainer class="grid gap-4 py-6 text-sm sm:grid-cols-2">
          {demo('Implizit (Standard)', implicit.value, () => (
            <UUniversalSelectMenu
              multiple
              clear
              items={projects}
              v-model={implicit.value}
              placeholder="Projekte wählen"
            />
          ))}
          {demo('Explizit', explicit.value, () => (
            <UUniversalSelectMenu
              multiple
              explicitGroups
              clear
              items={projects}
              v-model={explicit.value}
              placeholder="Projekte wählen"
            />
          ))}
          {demo('Explizit mit Speichern (onChange)', explicitSaved.value, () => (
            <UUniversalSelectMenu
              multiple
              explicitGroups
              clear
              items={projects}
              v-model={explicitSaved.value}
              onChange={() => wait(800)}
              placeholder="Projekte wählen"
            />
          ))}
          {demo('Implizit, nur direkte Zuweisungen', implicitDirect.value, () => (
            <UUniversalSelectMenu
              multiple
              items={projects}
              v-model={implicitDirect.value}
              placeholder="Projekte wählen"
            />
          ))}
          {demo('Explizit, Gruppe und direkte Zuweisungen', explicitGroupAndDirect.value, () => (
            <UUniversalSelectMenu
              multiple
              explicitGroups
              items={projects}
              v-model={explicitGroupAndDirect.value}
              placeholder="Projekte wählen"
            />
          ))}
          {demo('Implizit, verschachtelt', implicitNested.value, () => (
            <UUniversalSelectMenu
              multiple
              items={nested}
              v-model={implicitNested.value}
              placeholder="Wählen"
            />
          ))}
          {demo('Explizit, verschachtelt', explicitNested.value, () => (
            <UUniversalSelectMenu
              multiple
              explicitGroups
              items={nested}
              v-model={explicitNested.value}
              placeholder="Wählen"
            />
          ))}
          {demo('Explizit, gleichnamige Gruppeneinträge', explicitSameLabels.value, () => (
            <UUniversalSelectMenu
              multiple
              explicitGroups
              items={sameLabels}
              v-model={explicitSameLabels.value}
              placeholder="Wählen"
            />
          ))}
          {demo('Implizit, gesperrter Eintrag', implicitDisabled.value, () => (
            <UUniversalSelectMenu
              multiple
              items={withDisabled}
              v-model={implicitDisabled.value}
              placeholder="Wählen"
            />
          ))}
          {demo('Explizit, gesperrter Eintrag', explicitDisabled.value, () => (
            <UUniversalSelectMenu
              multiple
              explicitGroups
              items={withDisabled}
              v-model={explicitDisabled.value}
              placeholder="Wählen"
            />
          ))}
          {demo('Implizit, mit Filter', implicitFiltered.value, () => (
            <UUniversalSelectMenu
              multiple
              items={withStatus}
              filter={statusFilter}
              v-model={implicitFiltered.value}
              placeholder="Projekte wählen"
              v-slots={statusSlots}
            />
          ))}
          {demo('Explizit, mit Filter', explicitFiltered.value, () => (
            <UUniversalSelectMenu
              multiple
              explicitGroups
              items={withStatus}
              filter={statusFilter}
              v-model={explicitFiltered.value}
              placeholder="Projekte wählen"
              v-slots={statusSlots}
            />
          ))}
          {demo('Implizit, verschachtelt mit Filter', implicitNestedFiltered.value, () => (
            <UUniversalSelectMenu
              multiple
              items={nestedWithStatus}
              filter={statusFilter}
              v-model={implicitNestedFiltered.value}
              placeholder="Wählen"
              v-slots={statusSlots}
            />
          ))}
          {demo('Einfachauswahl', single.value, () => (
            <UUniversalSelectMenu items={projects} v-model={single.value} placeholder="Wählen" />
          ))}
        </UContainer>
      )
    },
  }),
)
