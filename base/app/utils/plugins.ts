import type { DehydratedState, QueryClientConfig, VueQueryPluginOptions } from '@tanstack/vue-query'
import type { OperationLink, TRPCClientError, TRPCLink } from '@trpc/client'
import type { AnyTRPCRouter, TRPC_ERROR_CODE_KEY, TRPCDefaultErrorData } from '@trpc/server'
import type { FetchOptions } from 'ofetch'
import type { ObjectPlugin } from '#app'
import type { ToastOptions } from '../composables/useToast'
import { typedFormDataLink } from '@falcondev-oss/trpc-typed-form-data/client'
import { createTRPCVueQueryClient, vueQueryContext } from '@falcondev-oss/trpc-vue-query'
import {
  dehydrate,
  hydrate,
  MutationCache,
  QueryCache,
  QueryClient,
  useIsFetching,
  useQueryClient,
  VueQueryPlugin,
} from '@tanstack/vue-query'
import { httpSubscriptionLink, isTRPCClientError, splitLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import defu from 'defu'
import superjson from 'superjson'
import { httpBatchLink, httpLink } from 'trpc-nuxt/client'
import { useState } from '#app'

interface VueQueryNuxtPluginOptions {
  queryClientOptions?: QueryClientConfig
  vuePluginOptions?: VueQueryPluginOptions
}

interface ToastOpts {
  title?: string
  description?: string
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

/** a request that never got a response, i.e. `fetch` itself failed (offline, DNS, CORS, …) */
function isNetworkError(err: unknown) {
  return isTRPCClientError<AnyTRPCRouter>(err) && !err.meta?.response
}

/** `AnyTRPCRouter` widens the error shape to `any` */
function errorData(err: TRPCClientError<AnyTRPCRouter>) {
  return err.data as TRPCDefaultErrorData | undefined
}

const retryableHttpStatuses = new Set([408, 425, 429, 502, 503, 504])

function isRetryableError(err: unknown) {
  // unknown errors are usually a bug in the query fn, which a retry won't fix
  if (!isTRPCClientError<AnyTRPCRouter>(err)) return false

  return isNetworkError(err) || retryableHttpStatuses.has(errorData(err)?.httpStatus ?? 0)
}

/** zod reports its issues as a JSON-encoded list in the error message */
function isSchemaIssueList(message: string) {
  if (!message.startsWith('[')) return false

  try {
    const issues = JSON.parse(message) as unknown[]
    return (
      issues.length > 0 &&
      issues.every((issue) => typeof (issue as { message?: unknown }).message === 'string')
    )
  } catch {
    return false
  }
}

const errorTitles: Partial<Record<TRPC_ERROR_CODE_KEY, string>> = {
  BAD_REQUEST: 'Ungültige Eingabe',
  UNAUTHORIZED: 'Nicht angemeldet',
  FORBIDDEN: 'Keine Berechtigung',
  NOT_FOUND: 'Nicht vorhanden',
}

function requestErrorToast(err: unknown): ToastOpts {
  if (isNetworkError(err))
    return { title: 'Keine Verbindung', description: 'Der Server ist nicht erreichbar.' }

  if (!isTRPCClientError<AnyTRPCRouter>(err)) return { title: 'Unbekannter Fehler' }

  // internal errors leak implementation details and mean nothing to the user
  if (errorData(err)?.httpStatus === 500) return { title: 'Server-Fehler' }

  const code = errorData(err)?.code

  return {
    title: (code && errorTitles[code]) ?? 'Anfrage-Fehler',
    description: isSchemaIssueList(err.message) ? 'Bitte Eingaben überprüfen.' : err.message,
  }
}

/** during SSR a toast would be serialized into the payload and pop up after hydration */
function toastAdd(opts: ToastOptions) {
  if (import.meta.server) return

  useToast().add({ duration: 5000, ...opts })
}

/** toasts a failed request, using `opts` if given, otherwise a generic message */
function toastRequestError(err: unknown, opts?: ToastOpts) {
  toastAdd({
    preset: 'error',
    ...(opts ?? requestErrorToast(err)),
  })
}

export function vueQueryPlugin(opts?: VueQueryNuxtPluginOptions) {
  return {
    name: 'vue-query',
    setup(nuxt) {
      const vueQueryState = useState<Partial<DehydratedState>>('vue-query', () => ({}))

      const queryClient = new QueryClient(
        defu<QueryClientConfig, QueryClientConfig[]>(opts?.queryClientOptions, {
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
        }),
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
            requestErrorToastLink,
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
                    fetchOptions: opts.fetchOptions,
                  }),
                ],
                false: httpBatchLink({
                  transformer: superjson,
                  url: opts.url,
                  maxURLLength: 2000,
                  fetchOptions: opts.fetchOptions,
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
