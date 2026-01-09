import type { Toast } from '#ui/composables'
import { useToast as useNuxtUiToast } from '#ui/composables'

const presets = {
  success: {
    color: 'success',
    icon: 'ph:check-circle',
  },
  error: {
    color: 'error',
    icon: 'ph:x-circle',
  },
  warning: {
    color: 'warning',
    icon: 'ph:warning-circle',
  },
} as const satisfies Record<string, Partial<Toast>>

interface ToastOptions extends Partial<Toast> {
  preset?: keyof typeof presets
}

export const useToast = createGlobalState(() => {
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
})
