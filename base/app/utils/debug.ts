function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d_2b_79_f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function debug(label: string, ...ref: MaybeRefOrGetter<unknown>[]) {
  let error: Error | undefined
  try {
    // eslint-disable-next-line unicorn/error-message
    throw new Error()
  } catch (err: unknown) {
    if (!(err instanceof Error)) return
    err.name = 'LookAtThisCallstackError'
    err.stack = err.stack
      ?.split('\n')
      .filter((_, i) => [0, 2].includes(i))
      .join('\n')
    error = err
  }

  const random = mulberry32([...label].reduce((acc, c) => acc + c.codePointAt(0)!, 0))()

  watch(
    () => ref.map(toValue),
    (value) => {
      // eslint-disable-next-line no-console
      console.groupCollapsed(
        `%c ${label} `,
        `font-weight: normal !important; background: hsl(${Math.floor(
          random * 360,
        )}, 70%, 70%); color: #111;`,
        ...value,
      )
      console.debug(error)
      // eslint-disable-next-line no-console
      console.groupEnd()
    },
    {
      immediate: true,
      flush: 'sync',
      deep: true,
    },
  )
}
