import type { VNode } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import { Comment, Fragment, isVNode } from 'vue'
import { UButton, UPopover } from '#components'
import { useSpaceToLeft } from '../../composables/useSpaceToLeft'

/** JSX children and `v-if`/`v-for` arrive nested — unpack them to reach the individual actions.
 * A `v-if` that didn't take leaves a comment placeholder behind, which is not an action. */
function flattenActions(nodes: unknown[]): VNode[] {
  return nodes.flatMap((node) => {
    if (Array.isArray(node)) return flattenActions(node)
    if (!isVNode(node) || node.type === Comment) return []
    if (node.type === Fragment && Array.isArray(node.children)) return flattenActions(node.children)
    return [node]
  })
}

/** `gap-2` between the actions, as a number to compute with. */
const GAP = 8

/** Out of flow, so the trigger keeps its measurable width without taking up a slot in the row. */
const PARKED = 'pointer-events-none invisible absolute left-0'

export default defineSetupComponent(
  (_: {
    props: {
      id?: string
    }
    // the id only labels the row in the DOM, so it rides along as an inherited attribute
    propKeys: never
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'UOverflowActions',
      props: [],
      emits: [],
      setup: (_props, { slots }) => {
        const root = ref<HTMLElement>()
        const space = useSpaceToLeft(root)

        const triggerWidth = ref(0)
        /** Action widths by index, kept from when the action last stood in the row — one that has
         * given way is in the popover instead, where its width says nothing about the row. */
        const widths = ref<(number | undefined)[]>([])

        function measure() {
          const next = [...widths.value]
          let changed = false
          const children = [...(root.value?.children ?? [])] as HTMLElement[]
          for (const child of children) {
            // `github/no-dataset` wants `getAttribute`, `unicorn/dom-node-dataset` wants this
            // eslint-disable-next-line github/no-dataset
            const index = child.dataset.actionIndex
            const width = child.offsetWidth
            if (index === undefined) {
              triggerWidth.value = width
            } else if (next[Number(index)] !== width) {
              next[Number(index)] = width
              changed = true
            }
          }
          if (changed) widths.value = next
        }
        onMounted(measure)
        onUpdated(measure)
        // an action that only reaches its final width later — an icon, a font — resizes the row
        useResizeObserver(root, measure)

        /** How many actions have to give way, counting from the left. */
        function overflowCount(count: number) {
          const actions = Array.from({ length: count }, (_, index) => widths.value[index])
          // an action that has never stood in the row has no width yet: show it and measure it
          if (actions.includes(undefined)) return 0

          const known = actions as number[]
          const full = known.reduce((sum, width) => sum + width + GAP, -GAP)
          if (full <= space.value) return 0

          let used = triggerWidth.value
          let visible = 0
          for (const width of known.toReversed()) {
            used += width + GAP
            if (used > space.value) break
            visible++
          }
          return count - visible
        }

        return () => {
          const actions = flattenActions(slots.default?.() ?? [])
          const overflowing = overflowCount(actions.length)

          return (
            <div ref={root} class="relative flex items-center gap-2">
              {/* always rendered, so its width is known before the row has to make room for it */}
              <div class={overflowing > 0 ? 'shrink-0' : PARKED}>
                <UPopover
                  // remounted when the row stops overflowing, so an open menu doesn't stay
                  // open and empty once its actions have gone back into the row
                  key={String(overflowing > 0)}
                  v-slots={vSlots(UPopover, {
                    content: () => [
                      <div class="flex flex-col items-stretch gap-2 p-2">
                        {/* a second call to the slot, but for the actions the row leaves out —
                            no action is ever mounted in both places.
                            Rightmost first, so the menu continues where the row leaves off. */}
                        {flattenActions(slots.default?.() ?? [])
                          .slice(0, overflowing)
                          .toReversed()}
                      </div>,
                    ],
                  })}
                >
                  <UButton
                    icon="i-lucide-ellipsis"
                    color="neutral"
                    variant="subtle"
                    aria-label="Weitere Aktionen"
                  />
                </UPopover>
              </div>

              {actions.slice(overflowing).map((action, index) => (
                // `shrink-0`, so a row that has run short measures the action's natural width
                // — the width it would need to stay — rather than its squeezed one
                <div
                  key={overflowing + index}
                  data-action-index={overflowing + index}
                  class="shrink-0"
                >
                  {action}
                </div>
              ))}
            </div>
          )
        }
      },
    }),
)
