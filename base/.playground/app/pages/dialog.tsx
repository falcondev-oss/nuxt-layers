import { UAlert, UButton, UContainer, UInput } from '#components'

const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'DialogPage',
    props: [],
    emits: [],
    setup: () => {
      definePageMeta({
        layout: 'shell',
        title: 'Dialog',
      })

      const dialog = useDialog()
      const result = ref<string>()

      function show(label: string, ask: () => Promise<unknown>) {
        return (
          <UButton
            label={label}
            color="neutral"
            variant="outline"
            onClick={() => {
              void ask().then((answer) => (result.value = `${label}: ${JSON.stringify(answer)}`))
            }}
          />
        )
      }

      return () => (
        <UContainer class="flex flex-col gap-6 py-6 text-sm">
          <p class="font-mono">{result.value ?? 'Noch keine Antwort'}</p>

          <section class="flex flex-col gap-2">
            <h2 class="font-medium">askConfirm</h2>
            <div class="flex flex-wrap gap-2">
              {show('Nur Titel', () => dialog.askConfirm({ title: 'Fortfahren?' }))}
              {show('Mit Beschreibung', () =>
                dialog.askConfirm({
                  title: 'Fortfahren?',
                  description: 'Die Änderungen werden sofort für alle sichtbar.',
                }),
              )}
              {show('Eigene Labels', () =>
                dialog.askConfirm({
                  title: 'Rechnung senden?',
                  confirmLabel: 'Senden',
                  cancelLabel: 'Später',
                }),
              )}
              {show('Kurze Labels', () =>
                dialog.askConfirm({ title: 'Speichern?', confirmLabel: 'Ja', cancelLabel: 'Nein' }),
              )}
              {show('Ohne X', () =>
                dialog.askConfirm({
                  title: 'Fortfahren?',
                  description: 'Die Änderungen werden sofort für alle sichtbar.',
                  close: false,
                }),
              )}
              {show('Nur Titel mit X', () =>
                dialog.askConfirm({ title: 'Fortfahren?', close: true }),
              )}
              {show('Langer Titel', () =>
                dialog.askConfirm({
                  title:
                    'Sollen alle offenen Aufgaben des Projekts Website Relaunch an Tom Weinhold übergeben werden?',
                  description: 'Tom Weinhold wird per E-Mail benachrichtigt.',
                }),
              )}
              {colors.map((color) =>
                show(color, () => dialog.askConfirm({ title: `Farbe ${color}?`, color })),
              )}
            </div>
          </section>

          <section class="flex flex-col gap-2">
            <h2 class="font-medium">Presets</h2>
            <div class="flex flex-wrap gap-2">
              {show('askDelete', () =>
                dialog.askDelete({ type: 'Projekt', name: 'Website Relaunch' }),
              )}
              {show('askDelete überschrieben', () =>
                dialog.askDelete({
                  type: 'Projekt',
                  name: 'Website Relaunch',
                  description: 'Alle Aufgaben des Projekts werden mitgelöscht.',
                }),
              )}
              {show('askDelete ohne Namen', () => dialog.askDelete({ type: 'Projekt' }))}
              {show('askArchive', () =>
                dialog.askArchive({ type: 'Projekt', name: 'Website Relaunch' }),
              )}
              {show('askArchive ohne Namen', () => dialog.askArchive({ type: 'Projekt' }))}
              {show('askRestore', () =>
                dialog.askRestore({ type: 'Projekt', name: 'Website Relaunch' }),
              )}
              {show('askRestore ohne Namen', () => dialog.askRestore({ type: 'Projekt' }))}
              {show('askDiscard', () => dialog.askDiscard())}
              {show('askDelete mit Auswahl', () =>
                dialog.askDelete({
                  type: 'Termin',
                  name: 'Teammeeting',
                  items: [
                    { label: 'Nur diesen Termin', value: 'single' },
                    { label: 'Diesen und alle folgenden Termine', value: 'future' },
                  ],
                }),
              )}
              {show('askArchive mit defaultValue', () =>
                dialog.askArchive({
                  type: 'Projekt',
                  name: 'Website Relaunch',
                  items: [
                    { label: 'Nur das Projekt', value: 'project' },
                    { label: 'Mit allen Aufgaben', value: 'tasks' },
                  ],
                  defaultValue: 'project',
                }),
              )}
            </div>
          </section>

          <section class="flex flex-col gap-2">
            <h2 class="font-medium">askSelect</h2>
            <div class="flex flex-wrap gap-2">
              {show('Einfach', () =>
                dialog.askSelect({
                  title: 'Priorität wählen',
                  items: [
                    { label: 'Niedrig', value: 1 },
                    { label: 'Mittel', value: 2 },
                    { label: 'Hoch', value: 3 },
                  ],
                }),
              )}
              {show('Mit defaultValue', () =>
                dialog.askSelect({
                  title: 'Priorität wählen',
                  items: [
                    { label: 'Niedrig', value: 1 },
                    { label: 'Mittel', value: 2 },
                    { label: 'Hoch', value: 3 },
                  ],
                  defaultValue: 2,
                }),
              )}
              {show('Beschreibung, disabled', () =>
                dialog.askSelect({
                  title: 'Export',
                  description: 'In welchem Format exportieren?',
                  confirmLabel: 'Exportieren',
                  items: [
                    { label: 'CSV', value: 'csv', description: 'Für Excel' },
                    { label: 'PDF', value: 'pdf', description: 'Zum Drucken' },
                    { label: 'XML', value: 'xml', disabled: true },
                  ],
                }),
              )}
              {show('Primitive Items', () =>
                dialog.askSelect({ title: 'Anzahl Kopien', items: [1, 2, 3], defaultValue: 1 }),
              )}
              {show('null als Wert', () =>
                dialog.askSelect({
                  title: 'Zuständig',
                  items: [
                    { label: 'Niemand', value: null },
                    { label: 'Tom Weinhold', value: 'tom' },
                    { label: 'Alina Berger', value: 'alina' },
                  ],
                }),
              )}
              {colors.map((color) =>
                show(`select ${color}`, () =>
                  dialog.askSelect({
                    title: `Farbe ${color}`,
                    color,
                    items: [
                      { label: 'A', value: 'a' },
                      { label: 'B', value: 'b' },
                    ],
                    defaultValue: 'a',
                  }),
                ),
              )}
            </div>
          </section>

          <section class="flex flex-col gap-2">
            <h2 class="font-medium">Inhalt</h2>
            <div class="flex flex-wrap gap-2">
              {show('templateParts', () =>
                dialog.askConfirm({
                  title: templateParts`${'Website Relaunch'} duplizieren`,
                  description: templateParts`Die Kopie heißt ${'Website Relaunch (Kopie)'}.`,
                }),
              )}
              {show('body und Auswahl', () =>
                dialog.askSelect({
                  title: 'Termin löschen?',
                  description: templateParts`Soll ${'Teammeeting'} gelöscht werden?`,
                  body: () => (
                    <UAlert
                      color="warning"
                      variant="soft"
                      icon="lucide:triangle-alert"
                      title="Dieser Termin gehört zu einer Serie"
                    />
                  ),
                  confirmLabel: 'Löschen',
                  color: 'error',
                  items: [
                    { label: 'Nur diesen Termin', value: 'single' },
                    { label: 'Diesen und alle folgenden Termine', value: 'future' },
                  ],
                }),
              )}
              {show('confirmDisabled', () => {
                const typed = ref('')
                return dialog.askDelete({
                  type: 'Projekt',
                  name: 'Website Relaunch',
                  description: templateParts`Zum Bestätigen ${'Website Relaunch'} eingeben.`,
                  body: () => (
                    <UInput
                      modelValue={typed.value}
                      onUpdate:modelValue={(value) => (typed.value = value)}
                      placeholder="Website Relaunch"
                      class="w-full"
                    />
                  ),
                  confirmDisabled: () => typed.value !== 'Website Relaunch',
                })
              })}
            </div>
          </section>
        </UContainer>
      )
    },
  }),
)
