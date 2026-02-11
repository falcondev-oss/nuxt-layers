const emptyArgsSymbol = Symbol('emptyArgs')
// https://github.com/vueuse/vueuse/blob/6f880000165cebcb76e4f8a1f031bb98f99f37d6/packages/shared/createGlobalState/index.ts
export function createUsable<Fn extends (...args: any[]) => any>(stateFactory: Fn): Fn {
  const states = new WeakMap<object | symbol, any>()

  return ((...args: any[]) => {
    const key = args.length === 0 ? emptyArgsSymbol : args
    if (!states.has(key)) {
      // eslint-disable-next-line ts/no-unsafe-argument
      states.set(key, stateFactory(...args))
    }
    // eslint-disable-next-line ts/no-unsafe-return
    return states.get(key)
  }) as Fn
}
