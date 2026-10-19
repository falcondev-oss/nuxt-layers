import type { VNode } from 'vue'
import { disabledKey, useDisabled } from '../../composables/useDisabled'

/**
 * Disables every `UField` inside it, and every component reading `useDisabled()`. Nested ones
 * can't re-enable what an outer one disables.
 */
export default defineSetupComponent(
  (_: {
    props: {
      /** @default true */
      disabled?: boolean
    }
    slots: { default: () => VNode[] }
  }) =>
    options(_, {
      name: 'UDisabled',
      props: ['disabled'],
      emits: [],
      setup: (props, { slots }) => {
        const outer = useDisabled()
        provide(disabledKey, () => (props.disabled ?? true) || outer.value)

        return () => slots.default?.()
      },
    }),
)
