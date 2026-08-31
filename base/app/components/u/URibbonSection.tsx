import type { VNode } from 'vue'

export default defineSetupComponent(
  (_: {
    props: {
      title?: string
      end?: boolean
    }
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'URibbonSection',
      inheritAttrs: false,
      props: ['title', 'end'],
      emits: [],
      setup:
        (props, { slots, attrs }) =>
        () => (
          <div
            data-end={props.end || undefined}
            class={[
              'flex shrink-0 flex-col gap-1.5 px-3 py-2',
              props.end &&
                'border-default [&:not([data-end]~*)]:ml-auto [&:not([data-end]~*)]:border-l',
            ]}
          >
            {props.title ? <p class="text-dimmed text-[10px] leading-none">{props.title}</p> : null}
            <div class="flex flex-1 flex-wrap items-center gap-1" {...attrs}>
              {slots.default?.()}
            </div>
          </div>
        ),
    }),
)
