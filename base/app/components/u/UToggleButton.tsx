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
            class={[
              'ring-accented px-1.5! py-1.5! ring ring-inset',
              props.modelValue && 'bg-white',
            ]}
            label={props.label}
            ui={{ label: props.modelValue ? undefined : 'text-toned' }}
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
                    props.modelValue
                      ? 'bg-primary text-inverted'
                      : 'text-muted bg-white/50 shadow-[inset_0_0_2px_1px_rgb(0_0_0/0.04),inset_0_0_2px_rgb(0_0_0/0.1)]',
                  ]}
                >
                  <Icon name={props.icon} class="size-4" />
                </span>
              ),
            }}
          </UButton>
        ),
    }),
)
