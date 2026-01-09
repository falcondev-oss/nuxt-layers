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
      title: opts?.leaveTitle || 'Unsaved Changes',
      description:
        opts?.leaveDescription ||
        'You have unsaved changes. Are you sure you want to leave this page?',
      submitLabel: 'Leave Page',
    })
    if (allowLeave) return next()
  })
}
