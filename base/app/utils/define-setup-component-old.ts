/* eslint-disable ts/no-empty-object-type */
import type { AllUnionFields, UnionToTuple } from 'type-fest'
import type {
  ComponentOptionsMixin,
  CreateComponentPublicInstanceWithMixins,
  EmitsOptions,
  EmitsToProps,
  PublicProps,
  RenderFunction,
  SetupContext,
  SlotsType,
} from 'vue'

export function defineSetupComponentOld<
  const Opts extends {
    props: Record<string, any>
    emits: Record<string, any>
    slots: Record<string, any>
  },
  Setup extends (
    props: Props,
    ctx: SetupContext<Opts['emits'], SlotsType<Partial<Opts['slots']>>>,
  ) => RenderFunction | Promise<RenderFunction>,
  const PropsRuntime extends Readonly<UnionToTuple<keyof AllUnionFields<Opts['props']>>>,
  E extends EmitsOptions = Opts['emits'],
  Props extends Record<string, any> = Opts['props'] & EmitsToProps<E>,
  PP = PublicProps & { vSlots?: Opts['slots'] },
  S extends SlotsType<Partial<Opts['slots']>> = SlotsType<Partial<Opts['slots']>>,
>(
  define: (opts: Opts) => { props: PropsRuntime },
  setup: Setup,
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
  E,
  PP,
  {},
  false,
  {},
  S
> {
  // eslint-disable-next-line ts/no-unsafe-argument
  const opts = define({} as any)
  // eslint-disable-next-line ts/no-unsafe-return
  return defineComponent(setup, {
    props: opts.props as unknown as string[],
  }) as any
}
