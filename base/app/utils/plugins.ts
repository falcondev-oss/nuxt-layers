import type { ObjectPlugin } from '#app'
import type { DehydratedState, QueryClientConfig, VueQueryPluginOptions } from '@tanstack/vue-query'
import type { AnyTRPCRouter } from '@trpc/server'
import { useState } from '#app'
import { typedFormDataLink } from '@falcondev-oss/trpc-typed-form-data/client'
import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import {
  dehydrate,
  hydrate,
  MutationCache,
  QueryClient,
  useIsFetching,
  useQueryClient,
  VueQueryPlugin,
} from '@tanstack/vue-query'
import { httpSubscriptionLink, isTRPCClientError, splitLink, TRPCClientError } from '@trpc/client'
import defu from 'defu'
import superjson from 'superjson'
import { httpBatchLink, httpLink } from 'trpc-nuxt/client'

interface VueQueryNuxtPluginOptions {
  queryClientOptions?: QueryClientConfig
  vuePluginOptions?: VueQueryPluginOptions
}

interface ToastOpts {
  title?: string
  description?: string
}

export interface CustomMeta {
  mutationMeta: {
    toast?: {
      success?: ToastOpts
      error?: ToastOpts
    }
  }
}

declare module '@tanstack/vue-query' {
  interface Register extends CustomMeta {}
}

export function vueQueryPlugin(opts?: VueQueryNuxtPluginOptions) {
  return {
    name: 'vue-query',
    setup(nuxt) {
      const toast = useToast()
      const vueQueryState = useState<DehydratedState | null>('vue-query')

      const queryClient = new QueryClient(
        defu<QueryClientConfig, QueryClientConfig[]>(opts?.queryClientOptions, {
          defaultOptions: {
            queries: {
              experimental_prefetchInRender: true,
              retry(failureCount, error) {
                if (
                  isTRPCClientError<AnyTRPCRouter>(error) &&
                  error.data &&
                  // eslint-disable-next-line ts/no-unsafe-member-access
                  error.data.httpStatus >= 400 &&
                  // eslint-disable-next-line ts/no-unsafe-member-access
                  error.data.httpStatus < 500
                )
                  return false
                return failureCount < 3
              },
            },
          },
          mutationCache: new MutationCache({
            onSuccess(_res, _input, _onMutateRes, mutation) {
              if (mutation.meta?.toast?.success) {
                toast.add({
                  preset: 'success',
                  duration: 5000,
                  ...mutation.meta.toast.success,
                })
              }
            },
            onError(err, _input, __onMutateRes, mutation) {
              console.error(err)

              if (mutation.meta?.toast?.error) {
                toast.add({
                  preset: 'error',
                  duration: 5000,
                  ...mutation.meta.toast.error,
                })
              } else if (err instanceof TRPCClientError)
                toast.add({
                  preset: 'error',
                  title: 'Request Error',
                  description: err.message,
                  duration: 5000,
                })
              else
                toast.add({
                  preset: 'error',
                  title: 'An unknown error occurred',
                  duration: 5000,
                })
            },
          }),
        }),
      )
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

      // global nuxt loading indicator
      const loadingIndicator = useLoadingIndicator()
      const isFetching = useIsFetching()

      let timeout: ReturnType<typeof setTimeout> | null = null
      watch(isFetching, () => {
        if (isFetching.value > 0) {
          loadingIndicator.start()
          timeout = setTimeout(() => {
            loadingIndicator.set(0)
          }, 300)
        } else {
          if (timeout) clearTimeout(timeout)
          loadingIndicator.finish()
        }
      })
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
                true: [
                  typedFormDataLink<AnyTRPCRouter>({
                    transformer: superjson,
                  }),
                  httpLink({
                    transformer: superjson,
                    url: opts.url,
                  }),
                ],
                false: httpBatchLink({
                  transformer: superjson,
                  url: opts.url,
                  maxURLLength: 2000,
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
