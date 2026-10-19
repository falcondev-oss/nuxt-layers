import type { BadgeProps, ButtonProps } from '@nuxt/ui'
import type { VNode } from 'vue'
import type { Falsy } from '../../../shared/types/helpers'
import { UBadge, UButton, UCard, UIcon, UOverflowButtons } from '#components'
import { cardActionsTargetKey } from '../../composables/useCardActionsTarget'
import { useFreeSpace } from '../../composables/useFreeSpace'

const CardActionsTargetProvider = defineSetupComponent(
  (_: {
    slots: {
      default: (props: { targetId: string }) => VNode[]
    }
  }) =>
    options(_, {
      name: 'CardActionsTargetProvider',
      props: [],
      emits: [],
      setup: (_props, { slots }) => {
        const targetId = useId()
        provide(cardActionsTargetKey, `#${targetId}`)

        return () => slots.default?.({ targetId })
      },
    }),
)

/**
 * A stack of titled cards, each rendering the slot named after its `id`; `<id>-actions` sits in
 * its header, before `actions`. Content can teleport into the header too, see
 * `useCardActionsTarget`. `type: 'table'` drops the body padding, so a table sits flush.
 */
export default defineSetupComponent(
  <T extends string>(_: {
    props: {
      // `| Falsy` so a conditional card is `cond && { ... }`. The spread form
      // (`...(cond ? [{ ... }] : [])`) widens `id` to `string`, which silently costs every
      // call site its slot-name check.
      items: (
        | Falsy
        | {
            id: T
            title: string
            icon?: string
            badge?: BadgeProps
            hidden?: boolean
            /** `false` shows the header alone. */
            content?: boolean
            type?: 'default' | 'table'
            actions?: ButtonProps[]
          }
      )[]
    }
    // `NoInfer` so `T` comes from `items` alone. Without it a slot name is an inference
    // site too, and a typo'd one just widens `T` to include itself instead of erroring.
    slots: Record<`${NoInfer<T>}-actions`, () => VNode[]> & Record<NoInfer<T>, () => VNode[]>
  }) =>
    options(_, {
      name: 'UConfigurationCards',
      props: ['items'],
      emits: [],
      setup: (props, { slots }) => {
        const visibleItems = computed(() =>
          props.items.filter((item): item is Exclude<typeof item, Falsy> => !!item && !item.hidden),
        )

        return () => {
          // The slot names are built from `item.id`, so they are only known as `string` here;
          // the declared slot types keep the call site honest.
          const namedSlots = slots as Record<string, (() => VNode[]) | undefined>

          return (
            <div class="@container flex flex-col gap-8 contain-layout">
              {visibleItems.value.map((item) => {
                const actionsSlot = namedSlots[`${item.id}-actions`]

                return (
                  <CardActionsTargetProvider
                    key={item.id}
                    v-slots={vSlots(CardActionsTargetProvider, {
                      default: ({ targetId }) => [
                        <section aria-label={item.title} class="flex flex-col gap-2">
                          <div class="flex items-center gap-2">
                            {item.icon ? (
                              <UIcon name={item.icon} class="text-primary size-4.5" />
                            ) : null}
                            <h3 class="text-highlighted text-base leading-tight font-semibold">
                              {item.title}
                            </h3>
                            {item.badge ? (
                              <UBadge variant="subtle" color="primary" {...item.badge} />
                            ) : null}
                            <div class="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
                              {item.actions?.length || actionsSlot ? (
                                <div {...useFreeSpace.free} class="min-w-0">
                                  <UOverflowButtons>
                                    {actionsSlot?.()}
                                    {item.actions?.map((action) => (
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

                          {item.content === false ? null : (
                            <UCard
                              class={item.type === 'table' ? 'overflow-visible' : undefined}
                              ui={item.type === 'table' ? { body: 'p-0!' } : undefined}
                            >
                              <div class="flex h-full flex-col">{namedSlots[item.id]?.()}</div>
                            </UCard>
                          )}
                        </section>,
                      ],
                    })}
                  />
                )
              })}
            </div>
          )
        }
      },
    }),
)
