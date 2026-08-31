import type { VNode } from 'vue'

export default defineSetupComponent(
  <T extends object>(_: {
    props: {
      value: T
    }
    slots: {
      default: (props: T) => VNode[]
    }
  }) =>
    options(_, {
      name: 'Define',
      props: ['value'],
      emits: [],
      setup:
        (props, { slots }) =>
        () =>
          slots.default?.(props.value),
    }),
)
