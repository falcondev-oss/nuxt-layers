import { onBeforeRouteLeave } from '#app'
import { useConfirm } from './useConfirm'

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

  const confirm = useConfirm()

  onBeforeRouteLeave(async (_, __, next) => {
    if (!toValue(preventPageLeave)) return next()

    const allowLeave = await confirm.confirmDestructive({
      title: opts?.leaveTitle || 'Ungespeicherte Änderungen',
      description:
        opts?.leaveDescription || 'Es gibt ungespeicherte Änderungen. Seite trotzdem verlassen?',
      submitLabel: 'Verlassen',
    })
    if (allowLeave) return next()
  })
}
