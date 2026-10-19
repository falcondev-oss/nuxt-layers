import type { InjectionKey } from 'vue'

export const disabledKey: InjectionKey<() => boolean> = Symbol('disabled')

/** Whether an ancestor `UDisabled` disables this component. */
export function useDisabled() {
  const disabled = inject(disabledKey, () => false)
  return computed(disabled)
}
