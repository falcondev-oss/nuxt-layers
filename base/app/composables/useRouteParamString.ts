import { useRouteParams } from '@vueuse/router'

export function useRouteParamString(paramName: string) {
  const param = useRouteParams<string>(paramName)

  const paramRef = ref(param.value)
  const stop = watch(
    param,
    () => {
      if (typeof param.value !== 'string') throw new Error(`${paramName} must be string`)
      paramRef.value = param.value
    },
    { immediate: true },
  )

  onBeforeRouteLeave((_, __, next) => {
    stop()
    next()
  })

  return paramRef
}
