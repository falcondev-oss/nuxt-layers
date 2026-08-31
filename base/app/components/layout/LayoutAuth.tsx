import type { VNode } from 'vue'
import { UPageCard } from '#components'

export default defineSetupComponent(
  (_: {
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'LayoutAuth',
      props: [],
      emits: [],
      setup:
        (_props, { slots }) =>
        () => (
          <div class="flex min-h-full flex-col items-center justify-center gap-4 p-4">
            <UPageCard class="w-full max-w-md">{slots.default?.()}</UPageCard>
          </div>
        ),
    }),
)
