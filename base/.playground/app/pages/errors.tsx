import type { AppRouter } from '~~/server/trpc'
import { createTRPCVueQueryClient } from '@falcondev-oss/trpc-vue-query'
import { useQueryClient } from '@tanstack/vue-query'
import superjson from 'superjson'
import { httpLink } from 'trpc-nuxt/client'
import { UButton, UCard, UContainer } from '#components'

const cardUi = { body: 'flex flex-col items-start gap-4' }

export default defineSetupComponent((_: object) =>
  options(_, {
    name: 'ErrorsPage',
    props: [],
    emits: [],
    setup: () => {
      const trpc = useTrpc()

      // zeigt auf einen nicht erreichbaren Port -> `fetch` schlägt clientseitig fehl
      const offlineTrpc = createTRPCVueQueryClient<AppRouter>({
        queryClient: useQueryClient(),
        trpc: {
          links: [
            requestErrorToastLink,
            httpLink({ url: 'http://localhost:1/trpc', transformer: superjson }),
          ],
        },
      })

      const plainError = ref<string>()
      async function runPlain(fn: () => Promise<unknown>) {
        plainError.value = undefined
        try {
          await fn()
        } catch (err) {
          plainError.value = err instanceof Error ? err.message : String(err)
        }
      }

      function invalidInputMutation() {
        return trpc.validatedMutation.mutate({ count: 'nope' as unknown as number })
      }

      const failingMutation = trpc.failingMutation.useMutation()
      const unhandledMutation = trpc.unhandledMutation.useMutation()
      const toastMutation = trpc.failingMutation.useMutation({
        meta: {
          toast: {
            error: {
              title: 'Eigener Fehler-Toast',
              description: 'kommt aus mutation.meta.toast.error',
            },
          },
        },
      })

      const fetchErrorQuery = offlineTrpc.ok.useQuery(undefined, { enabled: false })

      const failingQuery = trpc.failingQuery.useQuery(undefined, { enabled: false, retry: false })
      const okQuery = trpc.ok.useQuery(undefined, { enabled: false, retry: false })

      return () => (
        <UContainer class="flex flex-col gap-4 py-8">
          <UCard
            ui={cardUi}
            v-slots={vSlots(UCard, {
              header: () => [<>Plain (ohne vue-query)</>],
            })}
          >
            <UButton
              label="Mutation: BAD_REQUEST"
              variant="subtle"
              onClick={() => void runPlain(() => trpc.failingMutation.mutate())}
            />
            <UButton
              label="Mutation: unerwarteter Fehler"
              variant="subtle"
              onClick={() => void runPlain(() => trpc.unhandledMutation.mutate())}
            />
            <UButton
              label="Mutation: ungültiger Input"
              variant="subtle"
              onClick={() => void runPlain(invalidInputMutation)}
            />
            <UButton
              label="Mutation: unabgefangen"
              variant="subtle"
              color="warning"
              onClick={() => void trpc.unhandledMutation.mutate()}
            />
            <UButton
              label="Query: Netzwerkfehler (fetch)"
              variant="subtle"
              onClick={() => void runPlain(() => offlineTrpc.ok.query())}
            />
            <UButton
              label="Query: INTERNAL_SERVER_ERROR"
              variant="subtle"
              onClick={() => void runPlain(() => trpc.failingQuery.query())}
            />

            <div class="text-error text-sm">{plainError.value ?? '–'}</div>
          </UCard>

          <UCard
            ui={cardUi}
            v-slots={vSlots(UCard, {
              header: () => [<>Mutations (vue-query)</>],
            })}
          >
            <UButton
              label="BAD_REQUEST"
              variant="subtle"
              loading={failingMutation.isPending.value}
              onClick={() => failingMutation.mutate()}
            />
            <UButton
              label="unerwarteter Fehler"
              variant="subtle"
              loading={unhandledMutation.isPending.value}
              onClick={() => unhandledMutation.mutate()}
            />
            <UButton
              label="mit meta.toast.error"
              variant="subtle"
              loading={toastMutation.isPending.value}
              onClick={() => toastMutation.mutate()}
            />

            <div class="text-error text-sm">{failingMutation.error.value?.message ?? '–'}</div>
          </UCard>

          <UCard
            ui={cardUi}
            v-slots={vSlots(UCard, {
              header: () => [<>Queries (vue-query)</>],
            })}
          >
            <UButton
              label="fehlerhafte Query laden"
              variant="subtle"
              loading={failingQuery.isFetching.value}
              onClick={() => void failingQuery.refetch()}
            />
            <UButton
              label="erfolgreiche Query laden"
              variant="subtle"
              loading={okQuery.isFetching.value}
              onClick={() => void okQuery.refetch()}
            />

            <UButton
              label="Query mit Netzwerkfehler laden (retry)"
              variant="subtle"
              loading={fetchErrorQuery.isFetching.value}
              onClick={() => void fetchErrorQuery.refetch()}
            />

            <div class="text-error text-sm">{failingQuery.error.value?.message ?? '–'}</div>
            <div class="text-error text-sm">{fetchErrorQuery.error.value?.message ?? '–'}</div>
            <div class="text-sm">{okQuery.data.value ?? '–'}</div>
          </UCard>
        </UContainer>
      )
    },
  }),
)
