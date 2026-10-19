import type { InjectionKey } from 'vue'

export const cardActionsTargetKey: InjectionKey<string> = Symbol('card-actions-target')

/** Selector of the enclosing `UConfigurationCard`'s header actions, to `Teleport` into, e.g.
 * a table's header actions. `undefined` outside of one. */
export function useCardActionsTarget() {
  return inject(cardActionsTargetKey, undefined)
}
