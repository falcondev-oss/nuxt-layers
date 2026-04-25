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
  SlotsType,
} from 'vue'

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

export function defineProps<
  const Opts extends {
    props: Record<string, any>
  },
  const RuntimeProps extends UnionToTuple<keyof AllUnionFields<Opts['props']>>,
>(_opts: Opts, props: NoInfer<RuntimeProps>): NoInfer<RuntimeProps> {
  return props
}

export function defineEmits<
  const Opts extends {
    emits: ObjectEmitsOptions
  },
  const RuntimeEmits extends UnionToTuple<keyof AllUnionFields<Opts['emits']>>,
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
