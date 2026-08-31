import { LayoutPage, UContainer } from '#components'

function render() {
  return (
    <LayoutPage
      header={{
        navigation: {
          variant: 'pill',
          items: [
            {
              label: 'test',
              to: '/',
            },
          ],
        },
      }}
      footer={{
        items: [
          {
            label: 'hallo',
            to: '/',
          },
        ],
        ui: {
          root: 'bg-primary-200',
        },
      }}
      v-slots={vSlots(LayoutPage, {
        'default': () => [<UContainer>test</UContainer>],
        'footer-left': () => [<>left</>],
        'footer-bottom': () => [<>bottom</>],
      })}
    />
  )
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'PagePage',
    props: [],
    emits: [],
    setup: () => render,
  }),
)
