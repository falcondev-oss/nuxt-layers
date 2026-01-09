export function refEffect<T>(getter: MaybeRefOrGetter<T>) {
  const getterRef = toRef(getter)
  const __ref = ref(getterRef.value as T)
  const _ref = __ref as typeof __ref & { reset: () => void }

  watchEffect(() => {
    // eslint-disable-next-line ts/no-unsafe-assignment
    _ref.value = getterRef.value
  })

  _ref.reset = () => {
    // eslint-disable-next-line ts/no-unsafe-assignment
    _ref.value = getterRef.value
  }

  return _ref
}
