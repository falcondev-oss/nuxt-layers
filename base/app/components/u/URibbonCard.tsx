import type { CardProps, CardSlots } from '@nuxt/ui'
import type { VNode } from 'vue'
import { useForwardProps } from 'reka-ui'
import { omit, partition } from 'remeda'
import { Fragment } from 'vue'
import { UCard } from '#components'
import { mergeSlotClass } from '../../utils/ui'

/** `v-if`/`v-for` in the slot arrive as fragments — unpack them to reach the sections. */
function flattenSections(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) =>
    node.type === Fragment && Array.isArray(node.children)
      ? flattenSections(node.children as VNode[])
      : [node],
  )
}

export default defineSetupComponent(
  (_: {
    props: CardProps
    slots: CardSlots & {
      /** Ribbon strip above the body — fill it with `URibbonSection`s. */
      ribbon?: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'URibbonCard',
      props: ['as', 'title', 'description', 'variant', 'class', 'ui'],
      emits: [],
      inheritAttrs: false,
      setup: (props, { slots, attrs }) => {
        const forwarded = useForwardProps(props)

        return () => {
          const [endSections, leadingSections] = slots.ribbon
            ? partition(flattenSections(slots.ribbon()), (node) => Boolean(node.props?.end))
            : [[], []]

          return (
            <div class="flex flex-col">
              {slots.ribbon ? (
                // the ribbon's lower edge runs behind the card, so the card keeps its own rounded top;
                // sections draw their own top/left border shifted by -1px, so the outer ones get clipped
                <div
                  class={[
                    'ring-default bg-elevated flex flex-wrap overflow-hidden rounded-t-lg shadow-[inset_0_2px_3px_-2px_rgb(0_0_0/0.06),inset_2px_0_3px_-2px_rgb(0_0_0/0.06),inset_-2px_0_3px_-2px_rgb(0_0_0/0.06)] ring',
                    slots.default ? '-mb-2 pb-2' : 'rounded-b-lg',
                  ]}
                >
                  {leadingSections}

                  {endSections.length > 0 ? (
                    // one flex item, so the end sections wrap onto their own line as a group
                    // instead of splitting up — the leading sections give way first;
                    // `ml-auto` eats the spare space, so leading sections stay left on every line
                    <div class="ml-auto flex flex-wrap justify-end">{endSections}</div>
                  ) : null}
                </div>
              ) : null}

              {slots.default ? (
                <UCard
                  {...attrs}
                  {...forwarded.value}
                  ui={{
                    ...forwarded.value.ui,
                    body: mergeSlotClass(forwarded.value.ui?.body, 'p-0!'),
                  }}
                  class="relative shadow-[0_-2px_3px_-1px_rgb(0_0_0/0.08)]"
                  v-slots={vSlots(UCard, omit(slots, ['ribbon']))}
                />
              ) : null}
            </div>
          )
        }
      },
    }),
)
