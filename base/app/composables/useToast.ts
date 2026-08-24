import type { Toast } from '#ui/composables'
import { useToast as useNuxtUiToast } from '#ui/composables'

const presets = {
  success: {
    color: 'success',
    icon: 'lucide:circle-check',
  },
  error: {
    color: 'error',
    icon: 'lucide:circle-x',
  },
  warning: {
    color: 'warning',
    icon: 'lucide:circle-alert',
  },
} as const satisfies Record<string, Partial<Toast>>

export interface ToastOptions extends Partial<Toast> {
  preset?: keyof typeof presets
}

function createToast() {
  const toast = useNuxtUiToast()

  return {
    ...toast,
    add: (toastOpts: ToastOptions) => {
      const { preset, ...opts } = toastOpts
      return toast.add(
        preset
          ? {
              ...presets[preset],
              ...opts,
            }
          : opts,
      )
    },
  }
}

let clientToast: ReturnType<typeof createToast> | undefined

/**
 * Cached on the client only, since `useNuxtUiToast()` needs Nuxt's async context that
 * cache callbacks have left, while caching it on the server would hand one request's
 * instance to every later request.
 */
export function useToast() {
  if (import.meta.server) return createToast()

  // eslint-disable-next-line unicorn/no-top-level-assignment-in-function
  return (clientToast ??= createToast())
}
