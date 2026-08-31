import type { AppProps } from '@nuxt/ui'
import { de } from '@nuxt/ui/locale'
import { useForwardProps } from 'reka-ui'
import { Suspense } from 'vue'
import { NuxtLayout, NuxtLoadingIndicator, NuxtPage, UApp } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      app?: AppProps
    }
  }) =>
    options(_, {
      name: 'UCustomApp',
      props: ['app'],
      emits: [],
      setup: (props) => {
        const forwarded = useForwardProps(props)
        const config = useRuntimeConfig()

        return () => (
          <UApp locale={de} {...forwarded.value.app} nonce={config.public.projectId}>
            <NuxtLoadingIndicator color="var(--color-brand-secondary, var(--color-brand-primary))" />
            <Suspense>
              <NuxtLayout>
                <NuxtPage />
              </NuxtLayout>
            </Suspense>
          </UApp>
        )
      },
    }),
)
