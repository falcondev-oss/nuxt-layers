import type { TRPCClientError } from '@trpc/client'
import type { AnyTRPCRouter, TRPC_ERROR_CODE_KEY, TRPCDefaultErrorData } from '@trpc/server'
import type { ToastOptions } from '../../../composables/useToast'
import { isTRPCClientError } from '@trpc/client'

export interface ToastOpts {
  title?: string
  description?: string
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

export function isRetryableError(err: unknown) {
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
export function toastAdd(opts: ToastOptions) {
  if (import.meta.server) return

  useToast().add({ duration: 5000, ...opts })
}

/** toasts a failed request, using `opts` if given, otherwise a generic message */
export function toastRequestError(err: unknown, opts?: ToastOpts) {
  toastAdd({
    preset: 'error',
    ...(opts ?? requestErrorToast(err)),
  })
}
