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

export function defineSetupComponent<
  const Opts extends {
    props: Record<string, any>
    emits: ObjectEmitsOptions
    slots: Record<string, any>
  },
  Slots extends SlotsType<Partial<Opts['slots']>>,
  Props extends Opts['props'] & EmitsToProps<Opts['emits']>,
  Setup extends (
    props: Props,
    ctx: SetupContext<Opts['emits'], Slots>,
  ) => RenderFunction | Promise<RenderFunction>,
  const RuntimeProps extends Readonly<UnionToTuple<keyof AllUnionFields<Opts['props']>>>,
  const RuntimeEmits extends Readonly<UnionToTuple<keyof AllUnionFields<Opts['emits']>>>,
>(
  define: (opts: Opts) => {
    props: NoInfer<RuntimeProps>
    emits: NoInfer<RuntimeEmits>
    setup: NoInfer<Setup>
  },
): new (
  props: Opts['props'],
) => CreateComponentPublicInstanceWithMixins<
  Props,
  {},
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  Opts['emits'],
  PublicProps & { vSlots?: Opts['slots'] },
  {},
  false,
  {},
  Slots
> {
  // eslint-disable-next-line ts/no-unsafe-argument
  const opts = define({} as any)
  // eslint-disable-next-line ts/no-unsafe-return, ts/no-unsafe-argument
  return defineComponent(opts.setup as any, {
    props: opts.props as unknown as string[],
    emits: opts.emits as unknown as string[],
  }) as any
}

export function props<
  const Opts extends {
    props: Record<string, any>
  },
  const RuntimeProps extends UnionToTuple<keyof AllUnionFields<Opts['props']>>,
  // eslint-disable-next-line no-shadow
>(_opts: Opts, props: NoInfer<RuntimeProps>): NoInfer<RuntimeProps> {
  return props
}

export function emits<
  const Opts extends {
    emits: ObjectEmitsOptions
  },
  const RuntimeEmits extends UnionToTuple<keyof AllUnionFields<Opts['emits']>>,
  // eslint-disable-next-line no-shadow
>(_opts: Opts, emits: NoInfer<RuntimeEmits>): NoInfer<RuntimeEmits> {
  return emits
}

export function generic<
  const Opts extends {
    props: Record<string, any>
    emits: ObjectEmitsOptions
    slots: Record<string, any>
  },
  Slots extends SlotsType<Partial<Opts['slots']>>,
  Props extends Opts['props'] & EmitsToProps<Opts['emits']>,
  Setup extends (
    props: Props,
    ctx: SetupContext<Opts['emits'], Slots>,
  ) => RenderFunction | Promise<RenderFunction>,
>(_opts: Opts, setup: Setup): NoInfer<Setup> {
  return setup
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
