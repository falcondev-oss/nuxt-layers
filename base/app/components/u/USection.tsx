import type { VNode } from 'vue'

/**
 * A titled part of a form or detail view, its children in two columns; `aside` sits right of the
 * title, e.g. a count, and `actions` right of that. A child spanning both columns, such as a table,
 * takes `col-span-full`.
 */
export default defineSetupComponent(
  (_: {
    props: { title: string; aside?: string }
    slots: { default: () => VNode[]; actions?: () => VNode[] }
  }) =>
    options(_, {
      name: 'USection',
      props: ['title', 'aside'],
      emits: [],
      setup:
        (props, { slots }) =>
        () => (
          <section class="flex flex-col gap-4">
            <div class="border-default flex items-center gap-3 border-b pb-1.5">
              <h3 class="text-muted flex flex-1 items-baseline justify-between gap-2 text-xs font-semibold tracking-wide uppercase">
                {props.title}
                {props.aside ? (
                  <span class="font-normal tracking-normal normal-case">{props.aside}</span>
                ) : null}
              </h3>
              {slots.actions?.()}
            </div>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{slots.default?.()}</div>
          </section>
        ),
    }),
)
