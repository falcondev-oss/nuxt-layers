import type { CardProps, CardSlots } from '@nuxt/ui'
import type { VNode } from 'vue'
import { useForwardProps } from 'reka-ui'
import { omit } from 'remeda'
import { UCard } from '#components'
import { mergeSlotClass } from '../../utils/ui'

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

        return () => (
          <div class="flex flex-col">
            {slots.ribbon ? (
              // the ribbon's lower edge runs behind the card, so the card keeps its own rounded top
              <div
                class={[
                  'divide-default ring-default bg-elevated flex items-stretch divide-x overflow-x-auto rounded-t-lg shadow-[inset_0_2px_3px_-2px_rgb(0_0_0/0.06),inset_2px_0_3px_-2px_rgb(0_0_0/0.06),inset_-2px_0_3px_-2px_rgb(0_0_0/0.06)] ring',
                  slots.default ? '-mb-2 pb-2' : 'rounded-b-lg',
                ]}
              >
                {slots.ribbon()}
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
                class="ring-accented relative shadow-[0_-2px_3px_-1px_rgb(0_0_0/0.08)]"
                v-slots={vSlots(UCard, omit(slots, ['ribbon']))}
              />
            ) : null}
          </div>
        )
      },
    }),
)
