/* eslint-disable ts/no-empty-object-type */
import type { AllUnionFields, UnionToTuple } from 'type-fest'
import type {
  ComponentOptionsMixin,
  CreateComponentPublicInstanceWithMixins,
  EmitsToProps,
  ObjectEmitsOptions,
  PublicProps,
  RenderFunction,
  SetupContext,
  Slots as SlotOptions,
  SlotsType,
} from 'vue'

declare module 'vue' {
  interface ComponentCustomProps {
    vSlots?: SlotOptions
  }
}

interface ComponentTypes {
  props: Record<string, any>
  emits: ObjectEmitsOptions
  slots: Record<string, any>
}

/**
 * Keys of `T` as a readonly tuple, or `readonly []` when `T` has no keys.
 *
 * `keyof {}` is `never` and `UnionToTuple<never>` resolves to `never` (not `[]`),
 * so the empty case is guarded explicitly. Without it an empty `props`/`emits`
 * declaration (e.g. `emits: {}`) poisons inference of the surrounding options object.
 */
type KeysTuple<T> = [keyof T] extends [never]
  ? readonly []
  : Readonly<UnionToTuple<keyof AllUnionFields<T>>>

/** Runtime config for a component, derived from its declared types `T`. */
interface SetupConfig<T extends ComponentTypes> {
  props: KeysTuple<T['props']>
  emits: KeysTuple<T['emits']>
  setup: (
    props: T['props'] & EmitsToProps<T['emits']>,
    ctx: SetupContext<T['emits'], SlotsType<Partial<T['slots']>>>,
  ) => RenderFunction | Promise<RenderFunction>
}

// Brand applied by `options()` and required by `defineSetupComponent`, so the config
// must go through `options()` (where props/emits are validated against `T`) rather than
// be returned as a raw object literal. The key is a readable string so bypassing it
// reports `Property '"use the options() helper"' is missing`.
type OptionsBrand = { readonly ['use the options() helper']: true }
type ViaOptions<T extends ComponentTypes> = SetupConfig<T> & OptionsBrand

// `defineSetupComponent`'s callback must return an `options()` result. This shape is
// intentionally independent of `T`: `options()` already validated everything and typed
// `setup`, so referencing `T` here again would only re-collapse `T` inference (and yield
// a confusing error) if `options()` is bypassed.
type LooseSetupConfig = {
  props: readonly string[]
  emits: readonly string[]
  setup: (...args: any) => any
} & OptionsBrand

/**
 * Validates the runtime `config` against the declared types `_` and types `setup`.
 *
 * `_` binds the declared types `T`, so `config` is checked as a plain argument (not as
 * an inferred callback return) — which means key mismatches are reported locally, right
 * on the offending `props`/`emits`/`setup` property.
 */
export function options<const T extends ComponentTypes>(
  _: T,
  config: SetupConfig<T>,
): ViaOptions<T> {
  return config as ViaOptions<T>
}

export function defineSetupComponent<const T extends ComponentTypes>(
  options_: (opts: T) => LooseSetupConfig,
): new (
  props: T['props'],
) => CreateComponentPublicInstanceWithMixins<
  T['props'] & EmitsToProps<T['emits']>,
  {},
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  T['emits'],
  PublicProps & { vSlots?: T['slots'] },
  {},
  false,
  {},
  SlotsType<Partial<T['slots']>>
> {
  // eslint-disable-next-line ts/no-unsafe-argument
  const opts = options_({} as any)
  // eslint-disable-next-line ts/no-unsafe-return, ts/no-unsafe-argument
  return defineComponent(opts.setup as any, {
    props: opts.props as unknown as string[],
    emits: opts.emits as unknown as string[],
  }) as any
}

// https://github.com/vuejs/language-tools/blob/master/packages/component-type-helpers/index.ts
type ComponentSlots<T> = T extends new (...args: any) => { $slots: infer S }
  ? NonNullable<S>
  : T extends (props: any, ctx: { slots: infer S; attrs: any; emit: any }, ...args: any) => any
    ? NonNullable<S>
    : {}

export function vSlots<C>(component: C, slots: ComponentSlots<C>) {
  return slots
}
