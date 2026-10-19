import type { BadgeProps, ButtonProps } from '@nuxt/ui'
import type { VNode } from 'vue'
import { UBadge, UButton, UCard, UIcon, UOverflowButtons } from '#components'
import { useFreeSpace } from '../../composables/useFreeSpace'

/**
 * A titled part of a form or detail view, e.g. inside a `UPageSection`, with the same header
 * a size smaller. Its children sit in two columns without a card; a child spanning both, takes
 * `col-span-full`. `variant: 'table'` instead puts them in a subtle card without padding, so a
 * table sits flush. `aside` follows the title, e.g. a count; the `actions` slot sits before
 * `actions`.
 */
export default defineSetupComponent(
  (_: {
    props: {
      title: string
      icon?: string
      badge?: BadgeProps
      aside?: string
      variant?: 'default' | 'table'
      actions?: ButtonProps[]
    }
    slots: { default: () => VNode[]; actions?: () => VNode[] }
  }) =>
    options(_, {
      name: 'USection',
      props: ['title', 'icon', 'badge', 'aside', 'variant', 'actions'],
      emits: [],
      setup:
        (props, { slots }) =>
        () => (
          <section aria-label={props.title} class="flex flex-col gap-1">
            <div class="flex min-h-7 items-center gap-1.5">
              {props.icon ? <UIcon name={props.icon} class="text-primary size-4 shrink-0" /> : null}
              <h4 class="text-highlighted text-sm leading-tight font-semibold">{props.title}</h4>
              {props.badge ? (
                <UBadge
                  variant="subtle"
                  color="primary"
                  size="sm"
                  class="shrink-0"
                  {...props.badge}
                />
              ) : null}
              {props.aside ? <span class="text-muted text-sm">{props.aside}</span> : null}
              {props.actions?.length || slots.actions ? (
                <div {...useFreeSpace.free} class="ml-auto flex min-w-8 flex-1 justify-end">
                  <UOverflowButtons>
                    {slots.actions?.()}
                    {props.actions?.map((action) => (
                      <UButton
                        key={action.label}
                        {...action}
                        variant={action.variant ?? 'soft'}
                        size={action.size ?? 'xs'}
                      />
                    ))}
                  </UOverflowButtons>
                </div>
              ) : null}
            </div>
            {props.variant === 'table' ? (
              <UCard variant="subtle" class="overflow-visible" ui={{ body: 'p-0!' }}>
                {slots.default?.()}
              </UCard>
            ) : (
              <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{slots.default?.()}</div>
            )}
          </section>
        ),
    }),
)
