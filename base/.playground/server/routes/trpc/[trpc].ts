import { createTRPCNuxtHandler } from 'trpc-nuxt/server'
import { appRouter } from '~~/server/trpc'

export default createTRPCNuxtHandler({
  endpoint: '/trpc',
  router: appRouter,
})
