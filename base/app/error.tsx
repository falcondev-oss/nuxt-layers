import type { NuxtError } from '#app'
import { UApp, UError } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      error: NuxtError
    }
  }) =>
    options(_, {
      name: 'Error',
      props: ['error'],
      emits: [],
      setup: (props) => {
        console.error(props.error)

        return () => (
          <UApp>
            <UError error={props.error} />
          </UApp>
        )
      },
    }),
)
