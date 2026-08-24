import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'

const t = initTRPC.create({ transformer: superjson })

export const appRouter = t.router({
  ok: t.procedure.query(() => ({ hello: 'world' })),
  failingQuery: t.procedure.query(() => {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Query ist fehlgeschlagen' })
  }),
  failingMutation: t.procedure.mutation(() => {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mutation ist fehlgeschlagen' })
  }),
  unhandledMutation: t.procedure.mutation(() => {
    throw new Error('Unerwarteter Fehler in der Mutation')
  }),
  validatedMutation: t.procedure
    .input(z.object({ count: z.number() }))
    .mutation(({ input }) => input),
})

export type AppRouter = typeof appRouter
