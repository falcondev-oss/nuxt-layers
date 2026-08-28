import type { RadioGroupItem } from '@nuxt/ui'
import type { ConfirmModalProps } from '~/components/modals/ConfirmModal.vue'
import { LazyConfirmModal } from '#components'

export type ConfirmModalSuccess<O extends RadioGroupItem[]> = 0 extends O['length']
  ? true
  : {
      [K in keyof O]: O[K] extends { value: infer V } ? V : never
    }[number]

export type ConfirmModalResult<O extends RadioGroupItem[]> = false | ConfirmModalSuccess<O>

export const useConfirm = createGlobalState(() => {
  const overlay = useOverlay()

  return async <const O extends RadioGroupItem[]>(props: ConfirmModalProps<O>) =>
    overlay
      .create(LazyConfirmModal, {
        destroyOnClose: true,
      })
      .open(props).result as Promise<ConfirmModalResult<O>>
})
