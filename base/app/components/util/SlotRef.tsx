import type { ComponentPublicInstance, VNode } from 'vue'

export default defineSetupComponent(
  (_: {
    props: {
      slotRef?: ComponentPublicInstance
    }
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'SlotRef',
      props: ['slotRef'],
      emits: [],
      setup: (props) => () => {
        const slot = props.slotRef?.$slots.default
        return slot ? h(slot) : null
      },
    }),
)
