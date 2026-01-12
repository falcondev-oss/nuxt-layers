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
