import type { H3Error } from 'h3'
import { consola } from 'consola'

const nitroLogger = consola.withTag('nitro')

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    filterStackLines(error)

    if (!event) {
      nitroLogger.error(error)
      return
    }

    const logger = nitroLogger.withTag(event.method).withTag(event.path)
    const _error = error as H3Error

    logger.error(_error.statusCode, error)
  })
})
