import { Icon, UButton } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      modelValue: boolean
      label: string
      icon: string
    }
    emits: { 'update:modelValue': (value: boolean) => void }
  }) =>
    options(_, {
      name: 'UToggleButton',
      props: ['modelValue', 'label', 'icon'],
      emits: ['update:modelValue'],
      setup:
        (props, { emit }) =>
        () => (
          <UButton
            color="neutral"
            variant="soft"
            class={['ring-accented px-1.5! ring', props.modelValue && 'bg-white']}
            aria-pressed={props.modelValue}
            onClick={() => {
              emit('update:modelValue', !props.modelValue)
            }}
          >
            {{
              leading: () => (
                <span
                  class={[
                    'flex size-5 items-center justify-center rounded-sm transition-colors',
                    props.modelValue ? 'bg-primary text-inverted' : 'text-muted',
                  ]}
                >
                  <Icon name={props.icon} class="size-4" />
                </span>
              ),
              default: () => props.label,
            }}
          </UButton>
        ),
    }),
)
