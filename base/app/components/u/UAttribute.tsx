import type { VNode } from 'vue'
import { Comment } from 'vue'
import { UDash } from '#components'

/** A labelled read-only value inside a `USection`, a dash when empty; `wide` spans both columns */
export default defineSetupComponent(
  (_: { props: { label: string; wide?: boolean }; slots: { default?: () => VNode[] } }) =>
    options(_, {
      name: 'UAttribute',
      props: ['label', 'wide'],
      emits: [],
      setup:
        (props, { slots }) =>
        () => {
          // Vue renders a missing value, null or undefined, as a comment
          const value = slots.default?.().filter((node) => node.type !== Comment) ?? []
          return (
            <div class={['flex min-w-0 flex-col gap-0.5', props.wide && 'col-span-full']}>
              <span class="text-muted text-xs">{props.label}</span>
              <span class="text-sm break-words">{value.length > 0 ? value : <UDash />}</span>
            </div>
          )
        },
    }),
)
