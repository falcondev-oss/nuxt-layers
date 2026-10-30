import { useRouteParams } from '@vueuse/router'
import { matchedRouteKey } from 'vue-router'

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

  const route = useRoute()
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

  // outside a page (e.g. in a layout) there is no route record to attach a leave guard to
  if (inject(matchedRouteKey, null)?.value)
    onBeforeRouteLeave(() => {
      stop()
      return true
    })

  return computed({
    get: () => paramRef.value,
    set: (value) => {
      if (param.value === undefined && value !== undefined) {
        void navigateTo({
          name: `${String(route.name)}-${paramName}`,
          params: { ...route.params, [paramName]: value },
        })
        return
      }
      param.value = value
    },
  })
}
