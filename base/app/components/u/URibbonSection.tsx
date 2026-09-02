import type { ClassValue } from 'tailwind-variants'
import type { VNode } from 'vue'
import { cnMerge } from 'tailwind-variants'

export default defineSetupComponent(
  (_: {
    props: {
      title?: string
      end?: boolean
      ui?: {
        root?: ClassValue
        content?: ClassValue
      }
    }
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'URibbonSection',
      inheritAttrs: false,
      props: ['title', 'end', 'ui'],
      emits: [],
      setup:
        (props, { slots, attrs }) =>
        () => (
          <div
            data-end={props.end || undefined}
            class={cnMerge(
              // no `flex-none`/`min-w-fit`: a section still hugs its content (grow 0) and still wraps onto
              // its own ribbon line, but one too wide for the whole ribbon shrinks instead of
              // overflowing, so its content can wrap
              'border-default -mt-px -ml-px flex flex-col gap-1.5 border-l px-3 py-2',
              // the row separator spans the full ribbon width (clipped by its overflow-hidden), so a
              // partially filled wrapped line still gets an unbroken line above it
              'before:border-default relative before:absolute before:inset-x-[-100vw] before:top-0 before:border-t',
              props.ui?.root,
            )()}
          >
            {props.title ? <p class="text-dimmed text-[10px] leading-none">{props.title}</p> : null}
            <div
              class={cnMerge('flex flex-1 flex-wrap items-center gap-1', props.ui?.content)()}
              {...attrs}
            >
              {slots.default?.()}
            </div>
          </div>
        ),
    }),
)
