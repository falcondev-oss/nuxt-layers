import type { OperationLink, TRPCLink } from '@trpc/client'
import type { AnyTRPCRouter } from '@trpc/server'
import type { FetchOptions } from 'ofetch'
import type { ObjectPlugin } from '#app'
import { typedFormDataLink } from '@falcondev-oss/trpc-typed-form-data/client'
import { createTRPCVueQueryClient, vueQueryContext } from '@falcondev-oss/trpc-vue-query'
import { useQueryClient } from '@tanstack/vue-query'
import { httpSubscriptionLink, splitLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import superjsonDefault from 'superjson'
import { httpBatchLink, httpLink } from 'trpc-nuxt/client'
import { toastRequestError } from './helper/request-error'

/**
 * Toasts errors of requests that vue-query doesn't handle itself, i.e. plain
 * `.query()` / `.mutate()` calls. Requests made through vue-query get their toast
 * from the query/mutation cache instead.
 */
const toastRequestErrors: OperationLink<AnyTRPCRouter> = ({ op, next }) =>
  observable((observer) => {
    const subscription = next(op).subscribe({
      next: (value) => observer.next(value),
      complete: () => observer.complete(),
      error(err) {
        if (!op.context[vueQueryContext] && op.type !== 'subscription') {
          console.error(err)
          toastRequestError(err)
        }

        observer.error(err)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
export const requestErrorToastLink: TRPCLink<AnyTRPCRouter> = () => toastRequestErrors

interface TrpcNuxtPluginOptions {
  url: string
  /**
   * ofetch options passed to the HTTP links.
   * @see https://github.com/unjs/ofetch
   */
  fetchOptions?: FetchOptions
  /**
   * ofetch options for queries, merged over `fetchOptions`.
   */
  queryFetchOptions?: FetchOptions
  /**
   * ofetch options for mutations, merged over `fetchOptions`.
   */
  mutationFetchOptions?: FetchOptions
  /**
   * Custom superjson instance, e.g. one with registered custom transformers.
   * @default superjson
   */
  transformer?: typeof superjsonDefault
  /**
   * Batching options passed to the `httpBatchLink`.
   */
  batchOptions?: {
    maxURLLength?: number
    maxItems?: number
    methodOverride?: 'POST'
  }
}
export function trpcPlugin<Router extends AnyTRPCRouter>(opts: TrpcNuxtPluginOptions) {
  return {
    name: 'trpc',
    // eslint-disable-next-line ts/no-unsafe-assignment
    dependsOn: ['vue-query'] as any,
    setup() {
      const queryClient = useQueryClient()
      const headers = useRequestHeaders()
      const superjson = opts.transformer ?? superjsonDefault

      const trpc = createTRPCVueQueryClient<Router>({
        queryClient,
        trpc: {
          links: [
            requestErrorToastLink,
            typedFormDataLink<AnyTRPCRouter>({ transformer: superjson }),
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
                  fetchOptions: { ...opts.fetchOptions, ...opts.mutationFetchOptions },
                }),
                false: httpBatchLink({
                  transformer: superjson,
                  url: opts.url,
                  headers,
                  maxURLLength: 2000,
                  ...opts.batchOptions,
                  fetchOptions: { ...opts.fetchOptions, ...opts.queryFetchOptions },
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
