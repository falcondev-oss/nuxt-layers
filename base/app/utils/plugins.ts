import type { DehydratedState, QueryClientConfig, VueQueryPluginOptions } from '@tanstack/vue-query'
import type { AnyTRPCRouter } from '@trpc/server'
import type { ObjectPlugin } from 'nuxt/app'
import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import {
  dehydrate,
  hydrate,
  QueryClient,
  useQueryClient,
  VueQueryPlugin,
} from '@tanstack/vue-query'
import { httpSubscriptionLink, splitLink } from '@trpc/client'
import defu from 'defu'
import { useState } from 'nuxt/app'
import superjson from 'superjson'
import { httpBatchLink, httpLink } from 'trpc-nuxt/client'

interface VueQueryNuxtPluginOptions {
  queryClientOptions: QueryClientConfig
  vuePluginOptions?: VueQueryPluginOptions
}
export function vueQueryPlugin(opts?: VueQueryNuxtPluginOptions) {
  return {
    name: 'vue-query',
    setup(nuxt) {
      const vueQueryState = useState<DehydratedState | null>('vue-query')

      const queryClient = new QueryClient(defu(opts?.queryClientOptions, {}))
      const options: VueQueryPluginOptions = { queryClient, ...opts?.vuePluginOptions }

      nuxt.vueApp.use(VueQueryPlugin, options)

      if (import.meta.server) {
        nuxt.hooks.hook('app:rendered', () => {
          vueQueryState.value = dehydrate(queryClient)
        })
      }

      if (import.meta.client) {
        nuxt.hooks.hook('app:created', () => {
          hydrate(queryClient, vueQueryState.value)
        })
      }
    },
  } satisfies ObjectPlugin
}

interface TrpcNuxtPluginOptions {
  url: string
}
export function trpcPlugin<Router extends AnyTRPCRouter>(opts: TrpcNuxtPluginOptions) {
  return {
    name: 'trpc',
    // eslint-disable-next-line ts/no-unsafe-assignment
    dependsOn: ['vue-query'] as any,
    setup() {
      const queryClient = useQueryClient()
      const headers = useRequestHeaders()

      const trpc = createTRPCVueQueryClient<Router>({
        queryClient,
        trpc: {
          links: [
            splitLink({
              condition: (op) => op.type === 'subscription',
              true: httpSubscriptionLink({
                url: opts.url,
                transformer: superjson,
              }),
              false: splitLink({
                condition: (op) => op.type === 'mutation',
                true: httpLink({
                  transformer: superjson,
                  url: opts.url,
                  headers,
                }),
                false: httpBatchLink({
                  transformer: superjson,
                  url: opts.url,
                  maxURLLength: 2000,
                  headers,
                }),
              }),
            }),
          ],
        },
      })
      return {
        provide: {
          trpc,
        },
      }
    },
  } satisfies ObjectPlugin
}
