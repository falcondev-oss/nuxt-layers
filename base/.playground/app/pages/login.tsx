import type { AuthFormField } from '@nuxt/ui'
import { UAuthForm } from '#components'

const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true,
  },
  {
    name: 'remember',
    label: 'Remember me',
    type: 'checkbox',
  },
]

function render() {
  return <UAuthForm fields={fields} />
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'LoginPage',
    props: [],
    emits: [],
    setup: () => render,
  }),
)
