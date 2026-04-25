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
  const PropsRuntime extends Readonly<UnionToTuple<keyof AllUnionFields<Opts['props']>>>,
>(
  define: (opts: Opts) => { props: PropsRuntime; setup: NoInfer<Setup> },
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
    // slots: {} as unknown as SlotsType<Opts['slots']>,
  }) as any
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
>(_opts: Opts, setup: Setup) {
  return setup
}
