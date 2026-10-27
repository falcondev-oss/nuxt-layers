import type { RadioGroupItem } from '@nuxt/ui'
import type {
  AskOptions,
  AskResult,
  AskSelectOptions,
  AskSelectValue,
} from '../components/overlay/modal/ModalAsk'
import { LazyModalAsk } from '#components'

/** What a preset asks about. */
type Subject = {
  /** The kind of thing, e.g. `Projekt`. Starts the title. */
  type: string
  /** Which one, e.g. `Website Relaunch`. Without it, only `askDelete` has a description. */
  name?: string
}

const presets = {
  delete: ({ type, name }: Subject) => ({
    title: `${type} löschen`,
    description: name
      ? templateParts`Soll ${name} endgültig gelöscht werden?`
      : 'Das kann nicht rückgängig gemacht werden.',
    confirmLabel: 'Löschen',
    color: 'error',
  }),
  archive: ({ type, name }: Subject) => ({
    title: `${type} archivieren`,
    description: name ? templateParts`Soll ${name} archiviert werden?` : undefined,
    confirmLabel: 'Archivieren',
    color: 'warning',
  }),
  restore: ({ type, name }: Subject) => ({
    title: `${type} wiederherstellen`,
    description: name ? templateParts`Soll ${name} wiederhergestellt werden?` : undefined,
    confirmLabel: 'Wiederherstellen',
    color: 'success',
  }),
  discard: () => ({
    title: 'Änderungen verwerfen?',
    description: 'Ungespeicherte Änderungen gehen verloren.',
    confirmLabel: 'Verwerfen',
    color: 'error',
  }),
} satisfies Record<string, (subject: Subject) => AskOptions>

type PresetOptions = Partial<AskOptions>

/**
 * A preset asks like `askSelect` when it gets `items`, and like `askConfirm` without them. The
 * `items` overload comes first, so an options object holding `items` never types as a `boolean`.
 */
type Preset<In> = {
  <const T extends RadioGroupItem[]>(
    opts: In & PresetOptions & Pick<AskSelectOptions<T>, 'items' | 'defaultValue'>,
  ): Promise<AskSelectValue<T> | undefined>
  (opts: In & PresetOptions): Promise<boolean>
}

/**
 * Asks the user in a modal and resolves with the answer. Closing the modal any other way than
 * confirming answers with `false` / `undefined`.
 */
export const useDialog = createGlobalState(() => {
  const overlay = useOverlay()
  // one overlay per ask: `destroyOnClose` drops it from the overlays once closed
  const open = async (props: AskOptions | AskSelectOptions<RadioGroupItem[]>) =>
    overlay.create(LazyModalAsk, { destroyOnClose: true }).open(props).result

  async function askConfirm(opts: AskOptions) {
    const result = (await open(opts)) as AskResult<undefined>
    return result !== undefined
  }

  /** Resolves with the picked item's value, or `undefined` when cancelled. */
  async function askSelect<const T extends RadioGroupItem[]>(opts: AskSelectOptions<T>) {
    const result = (await open(opts)) as AskResult<AskSelectValue<T>>
    return result?.value
  }

  async function ask(opts: AskOptions & { items?: RadioGroupItem[] }) {
    return opts.items ? askSelect({ ...opts, items: opts.items }) : askConfirm(opts)
  }

  // the casts pick the answer type by `items`, which `ask` decides at runtime
  const askAbout = (preset: (subject: Subject) => AskOptions) =>
    (async ({ type, name, ...opts }: Subject & PresetOptions & { items?: RadioGroupItem[] }) =>
      ask({ ...preset({ type, name }), ...opts })) as Preset<Subject>

  return {
    askConfirm,
    askSelect,
    askDelete: askAbout(presets.delete),
    askArchive: askAbout(presets.archive),
    askRestore: askAbout(presets.restore),
    askDiscard: (async (opts?: PresetOptions & { items?: RadioGroupItem[] }) =>
      ask({ ...presets.discard(), ...opts })) as Preset<object> & (() => Promise<boolean>),
  }
})
