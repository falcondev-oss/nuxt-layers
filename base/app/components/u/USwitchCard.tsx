import type { VNode } from 'vue'
import { UCard, UIcon, USwitch } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      title: string
      modelValue: boolean
      icon?: string
      loading?: boolean
      alwaysExpanded?: boolean
    }
    emits: {
      'toggle': (value: boolean, controller: AbortController) => void
      'update:modelValue': (value: boolean) => void
    }
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'USwitchCard',
      props: ['title', 'modelValue', 'icon', 'loading', 'alwaysExpanded'],
      emits: ['toggle', 'update:modelValue'],
      setup: (props, { emit, slots }) => {
        const expanded = computed(() => props.alwaysExpanded || props.modelValue)

        function onToggle(value: boolean) {
          const controller = new AbortController()
          emit('toggle', value, controller)
          if (controller.signal.aborted) return

          emit('update:modelValue', value)
        }

        return () => (
          <UCard
            class="m-px"
            variant="subtle"
            ui={{
              header: `text-sm font-semibold py-2 px-3! ${expanded.value ? '' : 'border-b-0'}`,
              body: `p-3! ${expanded.value ? '' : 'hidden'}`,
            }}
            v-slots={vSlots(UCard, {
              header: () => [
                <div class="flex items-center justify-between gap-8">
                  <span class="flex items-center gap-2">
                    {props.icon ? <UIcon name={props.icon} class="text-muted size-5" /> : null}
                    {props.title}
                  </span>
                  <USwitch
                    modelValue={props.modelValue}
                    loading={props.loading}
                    onUpdate:modelValue={(value) => onToggle(value)}
                  />
                </div>,
              ],
              default: () => slots.default?.() ?? [],
            })}
          />
        )
      },
    }),
)
