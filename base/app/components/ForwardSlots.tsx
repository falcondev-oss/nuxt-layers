import type { Component, Slot, VNode } from 'vue'

/**
 * Passes a set of slot functions on to the component in the default slot.
 *
 * Slots can only be declared where a component is written, so forwarding a dynamic set of them has
 * to happen from the outside: the target's vnode is re-created with `slots` merged into the slots
 * written inline. Inline slots win on conflict.
 */
export default defineSetupComponent(
  (_: {
    props: {
      slots: Record<string, Slot | undefined>
    }
    slots: { default: () => VNode[] }
  }) =>
    options(_, {
      props: ['slots'],
      emits: [],
      setup: (props, ctx) => () => {
        const [target] = ctx.slots.default?.() ?? []
        if (!target) return null

        // dropping `_` makes Vue re-normalize the merged slots instead of treating them as stable
        const { _: _slotFlag, ...inlineSlots } = (target.children ?? {}) as Record<string, unknown>

        return h(target.type as Component, target.props, { ...props.slots, ...inlineSlots })
      },
    }),
)
