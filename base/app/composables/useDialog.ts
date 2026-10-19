import type { RadioGroupItem } from '@nuxt/ui'
import type {
  AskOptions,
  AskResult,
  AskSelectOptions,
  AskSelectValue,
} from '../components/overlay/modal/ModalAsk'
import { LazyModalAsk } from '#components'

const presets = {
  delete: {
    title: 'Wirklich löschen?',
    description: 'Das kann nicht rückgängig gemacht werden.',
    confirmLabel: 'Löschen',
    color: 'error',
  },
  archive: {
    title: 'Archivieren?',
    confirmLabel: 'Archivieren',
    color: 'warning',
  },
  restore: {
    title: 'Wiederherstellen?',
    confirmLabel: 'Wiederherstellen',
    color: 'primary',
  },
  discard: {
    title: 'Änderungen verwerfen?',
    description: 'Ungespeicherte Änderungen gehen verloren.',
    confirmLabel: 'Verwerfen',
    color: 'error',
  },
} as const satisfies Record<string, AskOptions>

type PresetOptions = Partial<AskOptions>

/**
 * Asks the user in a modal and resolves with the answer. Closing the modal any other way than
 * confirming answers with `false` / `undefined`.
 *
 * Name candidates: `useDialog`, `useAsk`, `usePrompt`, `useConfirm`.
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

  return {
    askConfirm,
    askSelect,
    askDelete: async (opts?: PresetOptions) => askConfirm({ ...presets.delete, ...opts }),
    askArchive: async (opts?: PresetOptions) => askConfirm({ ...presets.archive, ...opts }),
    askRestore: async (opts?: PresetOptions) => askConfirm({ ...presets.restore, ...opts }),
    askDiscard: async (opts?: PresetOptions) => askConfirm({ ...presets.discard, ...opts }),
  }
})
