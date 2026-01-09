import { OverlayModalConfirm } from '#components'

export const useConfirm = createGlobalState(() => {
  const overlay = useOverlay()

  return {
    confirmDestructive: async (props: {
      description: string
      submitLabel: string
      title: string
    }) => {
      const modal = overlay.create(OverlayModalConfirm)
      return modal.open(props).result as Promise<boolean>
    },
  }
})
