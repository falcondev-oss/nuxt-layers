import type {
  DefaultOptions,
  DehydratedState,
  QueryClientConfig,
  VueQueryPluginOptions,
} from '@tanstack/vue-query'
import type { ObjectPlugin } from '#app'
import type { ToastOpts } from './helper/request-error'
import {
  dehydrate,
  hydrate,
  MutationCache,
  QueryCache,
  QueryClient,
  useIsFetching,
  VueQueryPlugin,
} from '@tanstack/vue-query'
import defu from 'defu'
import { useState } from '#app'
import { isRetryableError, toastAdd, toastRequestError } from './helper/request-error'

interface VueQueryNuxtPluginOptions {
  queryDefaultOptions?: DefaultOptions
  vuePluginOptions?: VueQueryPluginOptions
}

export interface CustomMeta {
  queryMeta: {
    toast?: {
      error?: ToastOpts
    }
  }
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
      const vueQueryState = useState<Partial<DehydratedState>>('vue-query', () => ({}))

      const queryClient = new QueryClient(
        defu<QueryClientConfig, QueryClientConfig[]>(
          { defaultOptions: opts?.queryDefaultOptions },
          {
            defaultOptions: {
              queries: {
                retry(failureCount, error) {
                  if (!isRetryableError(error)) return false

                  return failureCount < 3
                },
              },
            },
            queryCache: new QueryCache({
              onError(err, query) {
                console.error(err)

                toastRequestError(err, query.meta?.toast?.error)
              },
            }),
            mutationCache: new MutationCache({
              onSuccess(_res, _input, _onMutateRes, mutation) {
                if (mutation.meta?.toast?.success) {
                  toastAdd({
                    preset: 'success',
                    ...mutation.meta.toast.success,
                  })
                }
              },
              onError(err, _input, __onMutateRes, mutation) {
                console.error(err)

                toastRequestError(err, mutation.meta?.toast?.error)
              },
            }),
          },
        ),
      )

      const options: VueQueryPluginOptions = { queryClient, ...opts?.vuePluginOptions }
      nuxt.vueApp.use(VueQueryPlugin, options)

      if (import.meta.server) {
        nuxt.hooks.hook('app:rendered', () => {
          try {
            vueQueryState.value = dehydrate(queryClient)
          } catch (err) {
            console.error('[vue-query] dehydrating state failed:', err)
          }
        })
      }

      if (import.meta.client) {
        nuxt.hooks.hook('app:created', () => {
          try {
            hydrate(queryClient, vueQueryState.value)
          } catch (err) {
            console.error('[vue-query] hydrating state failed:', err)
          }
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
