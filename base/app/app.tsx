import { UCustomApp } from '#components'

function render() {
  return <UCustomApp />
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'App',
    props: [],
    emits: [],
    setup: () => render,
  }),
)
