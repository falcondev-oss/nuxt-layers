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
              'border-default -mt-px -ml-px flex min-w-fit flex-col gap-1.5 border-l px-3 py-2',
              // the row separator spans the full ribbon width (clipped by its overflow-hidden), so a
              // partially filled wrapped line still gets an unbroken line above it
              'before:border-default relative before:absolute before:inset-x-[-100vw] before:top-0 before:border-t',
              // end sections hug their content, so the leading sections absorb the spare space
              props.end ? 'flex-none' : 'flex-1',
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
