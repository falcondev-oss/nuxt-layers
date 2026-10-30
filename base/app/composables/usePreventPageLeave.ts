import { useDialog } from './useDialog'

export function usePreventPageLeave(
  preventPageLeave: MaybeRefOrGetter<boolean> = true,
  opts?: {
    leaveTitle?: string
    leaveDescription?: string
  },
) {
  useEventListener('beforeunload', (event) => {
    if (!toValue(preventPageLeave)) return

    event.returnValue = opts?.leaveDescription
    return opts?.leaveDescription
  })

  const dialog = useDialog()

  // a global guard rather than `onBeforeRouteLeave`, so it also works outside a page (e.g. in a modal);
  // Nuxt's `onBeforeRouteLeave` passes `next` through, which vue-router 5 warns about
  const removeGuard = useRouter().beforeEach(async (to, from) => {
    if (to === from || !toValue(preventPageLeave)) return true

    return dialog.askDiscard({
      title: opts?.leaveTitle || 'Ungespeicherte Änderungen',
      description:
        opts?.leaveDescription || 'Es gibt ungespeicherte Änderungen. Seite trotzdem verlassen?',
      confirmLabel: 'Verlassen',
    })
  })
  onScopeDispose(removeGuard)
}
