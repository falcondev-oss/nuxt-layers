/* eslint-disable ts/no-empty-object-type, ts/no-unsafe-return, ts/no-unsafe-argument */
import type { AllUnionFields, Simplify } from 'type-fest'
import type {
  Attrs,
  ComponentOptionsMixin,
  CreateComponentPublicInstanceWithMixins,
  EmitsToProps,
  ObjectEmitsOptions,
  PublicProps,
  RenderFunction,
  SetupContext,
  SlotsType,
} from 'vue'
import { defineComponent } from 'vue'

declare module 'vue' {
  interface ComponentCustomProps {
    // `v-slots` is what `@vue/babel-plugin-jsx` turns into slot children, so the name has
    // to be spelled that way to reach the runtime at all.
    //
    // Deliberately loose: this only makes `v-slots` an accepted prop name on every
    // component. `Slots` would reject it for any component whose slots are declared as an
    // interface without an index signature (most of @nuxt/ui). The real check is the
    // `vSlots()` helper below, which types the object against the target's own slots.
    'v-slots'?: Record<string, any>
  }
}

interface ComponentTypes {
  props?: Record<string, any>
  emits?: ObjectEmitsOptions
  slots?: Record<string, any>
  /**
   * Prop names to register when they are deliberately fewer than `keyof props`; the rest
   * arrive as `attrs`.
   */
  propKeys?: string
  /**
   * What `ctx.expose()` publishes, so parents holding a template ref see it.
   *
   * `expose()` alone only works at runtime; without this the instance type has no trace
   * of it and `ref.value.selectDate()` is a type error at every call site.
   */
  expose?: Record<string, any>
}

/**
 * Reads field `K` from the declared types `T`, defaulting to `{}` when the field
 * is omitted. Omitting e.g. `emits` leaves `'emits'` out of `keyof T`, so the
 * declaration can drop empty `emits: {}` / `slots: {}` entries entirely instead of
 * resolving them to `undefined` and poisoning downstream inference.
 */
type Field<T extends ComponentTypes, K extends keyof ComponentTypes> = K extends keyof T
  ? NonNullable<T[K]>
  : {}

/**
 * Every key of `T`, flattened across union members. `never` when `T` has no keys,
 * which makes `readonly Keys<T>[]` accept only `[]`.
 */
type Keys<T> = [keyof T] extends [never] ? never : Extract<keyof AllUnionFields<T>, string>

/** The runtime prop names: `propKeys` when declared, the keys of `props` otherwise. */
type PropKeys<T extends ComponentTypes> = 'propKeys' extends keyof T
  ? Extract<NonNullable<T['propKeys']>, string>
  : Keys<Field<T, 'props'>>

/** Props not registered in `propKeys` arrive through `attrs` with Vue's `unknown` index signature. */
type AttrProps<T extends ComponentTypes> = Simplify<Omit<Field<T, 'props'>, PropKeys<T>> & Attrs>

type EmitKeys<T extends ComponentTypes> = Keys<Field<T, 'emits'>>

/** The shape no array satisfies; generic so the alias head names the missing keys. */
type MissingEntries<K extends string> = { readonly [P in K]: true }

/**
 * `unknown` when `Given` covers every key in `All`, otherwise an object that no array
 * satisfies. Intersected onto the `props`/`emits` parameter it turns a forgotten key
 * into an error that names the key.
 *
 * Deliberately *not* `UnionToTuple`: that fixes an order which TypeScript derives from
 * union member order, an implementation detail that shifts when unrelated declarations
 * move. A component would compile today and demand a reshuffled array tomorrow.
 */
export type Exhaustive<All extends string, Given extends readonly string[]> = [
  Exclude<All, Given[number]>,
] extends [never]
  ? unknown
  : MissingEntries<Exclude<All, Given[number]>>

/**
 * Vue's own `emit` type (`SetupContext<E>['emit']`) for declared emits, but an empty
 * emits declaration produces an *uncallable* `emit` (`event: never`) rather than Vue's
 * permissive `(event: string, ...args: any[])` fallback. So when `emits` is omitted,
 * `emit('click')` is a type error instead of silently allowed.
 */
type StrictEmitFn<E extends ObjectEmitsOptions> = [keyof E] extends [never]
  ? (event: never, ...args: never) => void
  : SetupContext<E>['emit']

/** Runtime config for a component, derived from its declared types `T`. */
interface SetupConfig<T extends ComponentTypes> {
  /**
   * The component's name, as Vue Devtools and warning traces show it.
   *
   * Without it every component built here reports as `<Setup>`, because the setup
   * function it is derived from is anonymous.
   */
  name?: string
  /** Vue's `inheritAttrs`. Set to `false` to place `ctx.attrs` yourself. */
  inheritAttrs?: boolean
  setup: (
    props: Field<T, 'props'> & EmitsToProps<Field<T, 'emits'>>,
    ctx: Omit<
      SetupContext<Field<T, 'emits'>, SlotsType<Partial<Field<T, 'slots'>>>>,
      'emit' | 'attrs'
    > & {
      emit: StrictEmitFn<Field<T, 'emits'>>
      attrs: AttrProps<T>
    },
  ) => RenderFunction | Promise<RenderFunction>
}

// Brand applied by `options()` and required by `defineSetupComponent`, so the config
// must go through `options()` (where props/emits are validated against `T`) rather than
// be returned as a raw object literal. The key is a readable string so bypassing it
// reports `Property '"use the options() helper"' is missing`.
type OptionsBrand = { readonly ['use the options() helper']: true }
type ViaOptions<T extends ComponentTypes> = SetupConfig<T> & {
  props: readonly PropKeys<T>[]
  emits: readonly EmitKeys<T>[]
} & OptionsBrand

// `defineSetupComponent`'s callback must return an `options()` result. This shape is
// intentionally independent of `T`: `options()` already validated everything and typed
// `setup`, so referencing `T` here again would only re-collapse `T` inference (and yield
// a confusing error) if `options()` is bypassed.
type LooseSetupConfig = {
  props: readonly string[]
  emits: readonly string[]
  name?: string
  inheritAttrs?: boolean
  setup: (...args: any) => any
} & OptionsBrand

/** `_` binds `T`, so key mismatches are reported on the offending config property. */
export function options<
  const T extends ComponentTypes,
  const P extends readonly PropKeys<T>[],
  const E extends readonly EmitKeys<T>[],
>(
  _: T,
  config: SetupConfig<T> & {
    props: P & Exhaustive<PropKeys<T>, P>
    emits: E & Exhaustive<EmitKeys<T>, E>
  },
): ViaOptions<T> {
  return config as unknown as ViaOptions<T>
}

export function defineSetupComponent<const T extends ComponentTypes>(
  options_: (opts: T) => LooseSetupConfig,
): new (props: Field<T, 'props'>) => CreateComponentPublicInstanceWithMixins<
  Field<T, 'props'> & EmitsToProps<Field<T, 'emits'>>,
  Field<T, 'expose'>,
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  Field<T, 'emits'>,
  // `Partial`, to match `SlotsType<Partial<...>>` below and the partial type `vSlots()`
  PublicProps & { 'v-slots'?: Partial<Field<T, 'slots'>> },
  {},
  false,
  {},
  SlotsType<Partial<Field<T, 'slots'>>>
> {
  // oxlint-disable-next-line typescript/no-unsafe-argument
  const opts = options_({} as any)
  // oxlint-disable-next-line typescript/no-unsafe-return, typescript/no-unsafe-argument
  return defineComponent(opts.setup as any, {
    props: opts.props as unknown as string[],
    emits: opts.emits as unknown as string[],
    name: opts.name,
    inheritAttrs: opts.inheritAttrs,
  }) as any
}

type ComponentSlots<T> = T extends new (...args: any) => { $slots: infer S }
  ? NonNullable<S>
  : T extends (props: any, ctx: { slots: infer S; attrs: any; emit: any }, ...args: any) => any
    ? NonNullable<S>
    : {}

/**
 * A slot whose declared type intersects several call signatures, collapsed into one that takes
 * the intersection of their props.
 *
 * `@nuxt/ui` builds `TableSlots` by intersecting a `Record` over header props with one over cell
 * props, each carrying a `string` index signature. The names those `Record`s spell out keep
 * their own props, but any other name — a column id that is no key of the row type — resolves to
 * both signatures at once, which no single function satisfies. Intersecting their props leaves
 * it writable, and its props inferrable.
 */
type MergeSlotSignatures<S> = S extends {
  (props: infer A): infer R
  (props: infer B): any
}
  ? // a slot declared with one signature matches the pattern too, inferring the same props
    // twice; rewriting it would turn `() => VNode[]` into `(props: unknown) => VNode[]`
    Same<A, B> extends true
    ? S
    : (props: A & B) => R
  : S

/** Whether `A` and `B` are the same type, wrapped in tuples so neither side distributes. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

export function vSlots<C>(
  component: C,
  slots: {
    [Name in keyof ComponentSlots<C>]?: MergeSlotSignatures<ComponentSlots<C>[Name]>
  },
): Partial<ComponentSlots<C>> {
  // the parameter type only relaxes *how* a slot may be written; what comes back is the target's
  // own slots, which is what its `v-slots` prop is declared as
  return slots
}

/**
 * Vue's short emit declaration (`{ change: [event: Event] }`) rewritten as the call
 * signatures `ComponentTypes['emits']` expects. Component libraries ship the short form,
 * so a wrapper forwarding their emits would otherwise have to restate every signature.
 */
export type AsEmits<E> = {
  [K in keyof E]: E[K] extends readonly any[] ? (...args: E[K]) => void : never
}

/**
 * A reusable, exhaustively checked list of the prop names of `T`.
 *
 * `defineSetupComponent` needs every prop spelled out at runtime, which is pure
 * repetition for the many wrapper components that re-declare a shared props type
 * (`FormGroupProps`, `GenericInputProps`, ...). Declare the list once here and spread
 * it into `options({ props: [...] })`; the spread keeps the literal types, so the
 * component's own exhaustiveness check still applies.
 *
 * ```ts
 * export const formGroupPropNames = propNames<FormGroupProps>()(['label', 'help'])
 * // ...
 * props: [...formGroupPropNames, 'field']
 * ```
 */
export function propNames<T>() {
  return <const P extends readonly Extract<keyof T, string>[]>(
    names: P & Exhaustive<Extract<keyof T, string>, P>,
  ): P => names
}
