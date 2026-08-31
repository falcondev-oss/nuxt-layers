import type { ButtonProps } from '@nuxt/ui'
import { UButton } from '#components'

function getActionKey(action: ButtonProps): string | undefined {
  return action.label || (action.icon as string | undefined)
}

export default defineSetupComponent(
  (_: {
    props: {
      actions?: ButtonProps[]
      defaults?: Partial<ButtonProps>
    }
  }) =>
    options(_, {
      name: 'UActions',
      props: ['actions', 'defaults'],
      emits: [],
      setup: (props) => () =>
        props.actions ? (
          <div class="flex gap-4">
            {props.actions.map((action) => (
              <UButton key={getActionKey(action)} {...{ ...props.defaults, ...action }} />
            ))}
          </div>
        ) : (
          <div />
        ),
    }),
)
