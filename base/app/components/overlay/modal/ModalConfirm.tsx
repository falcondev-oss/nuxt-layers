import { UButton, UModal } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      title: string
      description: string
      submitLabel: string
    }
    emits: {
      close: (confirmed: boolean) => void
    }
  }) =>
    options(_, {
      name: 'ModalConfirm',
      props: ['title', 'description', 'submitLabel'],
      emits: ['close'],
      setup:
        (props, { emit }) =>
        () => (
          <UModal
            close={{ onClick: () => emit('close', false) }}
            title={props.title}
            description={props.description}
            class="max-w-sm"
            v-slots={vSlots(UModal, {
              footer: () => [
                <div class="flex w-full justify-end gap-2">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    label="Abbrechen"
                    onClick={() => emit('close', false)}
                  />
                  <UButton
                    label={props.submitLabel}
                    color="error"
                    onClick={() => emit('close', true)}
                  />
                </div>,
              ],
            })}
          />
        ),
    }),
)
