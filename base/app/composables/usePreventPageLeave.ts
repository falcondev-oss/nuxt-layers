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

  // what Nuxt's `onBeforeRouteLeave` does (a global guard, so it also works in a modal), minus the
  // `next` parameter it passes through, which vue-router 5 warns about
  const removeGuard = useRouter().beforeEach(async () => {
    if (!toValue(preventPageLeave)) return true

    return dialog.askDiscard({
      title: opts?.leaveTitle || 'Ungespeicherte Änderungen',
      description:
        opts?.leaveDescription || 'Es gibt ungespeicherte Änderungen. Seite trotzdem verlassen?',
      confirmLabel: 'Verlassen',
    })
  })
  onScopeDispose(removeGuard)
}
