import { de } from '@nuxt/ui/locale'
import { Settings } from 'luxon'
import { UCustomApp } from '#components'

function render() {
  return <UCustomApp app={{ locale: de }} />
}

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'PlaygroundApp',
    props: [],
    emits: [],
    setup: () => {
      Settings.throwOnInvalid = true
      Settings.defaultLocale = 'de'

      return render
    },
  }),
)
