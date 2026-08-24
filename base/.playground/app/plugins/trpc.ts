import type { AppRouter } from '~~/server/trpc'

export default defineNuxtPlugin(
  trpcPlugin<AppRouter>({
    url: '/trpc',
  }),
)
