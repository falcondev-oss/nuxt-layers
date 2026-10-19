import { onBeforeRouteLeave } from '#app'
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

  // Nuxt's wrapper takes `next`, so the guard's return value is ignored and `next` must always be called
  onBeforeRouteLeave(async (_, __, next) => {
    if (!toValue(preventPageLeave)) return next()

    next(
      await dialog.askDiscard({
        title: opts?.leaveTitle || 'Ungespeicherte Änderungen',
        description:
          opts?.leaveDescription || 'Es gibt ungespeicherte Änderungen. Seite trotzdem verlassen?',
        confirmLabel: 'Verlassen',
      }),
    )
  })
}
