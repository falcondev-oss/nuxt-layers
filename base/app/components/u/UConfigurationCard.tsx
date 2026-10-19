import type { BadgeProps, ButtonProps } from '@nuxt/ui'
import type { VNode } from 'vue'
import { UBadge, UButton, UCard, UIcon, UOverflowButtons } from '#components'
import { cardActionsTargetKey } from '../../composables/useCardActionsTarget'
import { useFreeSpace } from '../../composables/useFreeSpace'

/**
 * A titled card. The `actions` slot sits in its header, before `actions`; content can teleport
 * there too, see `useCardActionsTarget`. Without a default slot only the header shows.
 * `type: 'table'` drops the body padding, so a table sits flush.
 */
export default defineSetupComponent(
  (_: {
    props: {
      title: string
      icon?: string
      badge?: BadgeProps
      type?: 'default' | 'table'
      actions?: ButtonProps[]
    }
    slots: {
      default?: () => VNode[]
      actions?: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'UConfigurationCard',
      props: ['title', 'icon', 'badge', 'type', 'actions'],
      emits: [],
      setup: (props, { slots }) => {
        const targetId = useId()
        provide(cardActionsTargetKey, `#${targetId}`)

        return () => (
          <section aria-label={props.title} class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              {props.icon ? <UIcon name={props.icon} class="text-primary size-4.5" /> : null}
              <h3 class="text-highlighted text-base leading-tight font-semibold">{props.title}</h3>
              {props.badge ? <UBadge variant="subtle" color="primary" {...props.badge} /> : null}
              <div class="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
                {props.actions?.length || slots.actions ? (
                  <div {...useFreeSpace.free} class="min-w-0">
                    <UOverflowButtons>
                      {slots.actions?.()}
                      {props.actions?.map((action) => (
                        <UButton
                          key={action.label}
                          {...action}
                          variant={action.variant ?? 'soft'}
                          size={action.size ?? 'sm'}
                        />
                      ))}
                    </UOverflowButtons>
                  </div>
                ) : null}
                <div id={targetId} class="min-w-0 empty:hidden" />
              </div>
            </div>

            {slots.default ? (
              <UCard
                class={props.type === 'table' ? 'overflow-visible' : undefined}
                ui={props.type === 'table' ? { body: 'p-0!' } : undefined}
              >
                <div class="flex h-full flex-col">{slots.default()}</div>
              </UCard>
            ) : null}
          </section>
        )
      },
    }),
)
