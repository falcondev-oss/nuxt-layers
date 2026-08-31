import type { ButtonProps } from '@nuxt/ui'
import { UButton, UModal } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      actions: ButtonProps[]
      title: string
      description?: string
    }
  }) =>
    options(_, {
      name: 'ModalActions',
      props: ['actions', 'title', 'description'],
      emits: [],
      setup: (props) => () => (
        <UModal
          title={props.title}
          description={props.description}
          ui={{ content: 'max-w-fit', footer: 'flex flex-col gap-4' }}
          v-slots={vSlots(UModal, {
            footer: () =>
              props.actions.map((action) => (
                <UButton
                  key={action.label}
                  variant="subtle"
                  class="w-full justify-center"
                  size="xl"
                  {...action}
                />
              )),
          })}
        />
      ),
    }),
)
