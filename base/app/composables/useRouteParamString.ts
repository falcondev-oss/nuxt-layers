import { useRouteParams } from '@vueuse/router'

export function useRouteParamString(
  paramName: string,
  options?: { optional?: false },
): WritableComputedRef<string, string | undefined>
export function useRouteParamString(
  paramName: string,
  options: { optional: true },
): WritableComputedRef<string | undefined>
export function useRouteParamString(paramName: string, options?: { optional?: boolean }) {
  const optional = options?.optional ?? false

  const param = useRouteParams<string | undefined>(paramName)

  const paramRef = ref(param.value)
  const stop = watch(
    param,
    () => {
      if (param.value !== undefined && typeof param.value !== 'string')
        throw new Error(`Route parameter '[${paramName}]' must be a string`)
      if (!optional && param.value === undefined)
        throw new Error(`Route parameter '[${paramName}]' is required`)
      paramRef.value = param.value
    },
    { immediate: true },
  )

  onBeforeRouteLeave((_, __, next) => {
    stop()
    next()
  })

  return computed({
    get: () => paramRef.value,
    set: (value) => {
      param.value = value
    },
  })
}
