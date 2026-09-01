import type { MaybeComputedElementRef } from '@vueuse/core'
import { unrefElement, useResizeObserver } from '@vueuse/core'

/** `Number()` stops at the `px` suffix computed styles come with. */
// eslint-disable-next-line unicorn/prefer-number-coercion
const px = (value: string) => Number.parseFloat(value)

const FREE_ATTR = 'data-available-width-free'
const ROOT_ATTR = 'data-available-width-root'

const FREE = `[${FREE_ATTR}]`
const ROOT = `[${ROOT_ATTR}]`

/** The element next to `node` on `side`, skipping the ones that count as free. */
function siblingOf(node: Element | null | undefined, side: 'left' | 'right') {
  const step = (el: Element) =>
    side === 'left' ? el.previousElementSibling : el.nextElementSibling
  let sibling = node && step(node)
  while (sibling?.matches(FREE)) sibling = step(sibling)
  return (sibling ?? undefined) as HTMLElement | undefined
}

const leftOf = (node: Element | null | undefined) => siblingOf(node, 'left')
const rightOf = (node: Element | null | undefined) => siblingOf(node, 'right')

/** Which edge of an element the content left of `target` ends at. One that trails off into
 * opted-out children hands over to the last child that isn't; one made of nothing but those
 * ends where it begins, however wide it grew. */
function contentEdge(el: HTMLElement): { el: HTMLElement; side: 'left' | 'right' } {
  if (!el.lastElementChild?.matches(FREE)) return { el, side: 'right' }
  const last = leftOf(el.lastElementChild)
  return last ? contentEdge(last) : { el, side: 'left' }
}

/** The elements bounding `target` on either side, and the box they sit in. */
function anchors(target: MaybeComputedElementRef) {
  let node = unrefElement(target) as HTMLElement | null | undefined
  let blocker: HTMLElement | undefined
  while (node && !node.matches(ROOT)) {
    // the innermost right-hand neighbour along the climb: room `target` may not spill into
    blocker ??= rightOf(node)
    if (leftOf(node)) break
    node = node.parentElement
  }

  // at the root the climb ends whether or not something sits to its left: that is another row
  const neighbor = node?.matches(ROOT) ? undefined : leftOf(node)
  return {
    // the edge may sit inside the neighbour, past the opted-out elements it ends with
    edge: neighbor ? contentEdge(neighbor) : undefined,
    blocker,
    container: (node?.matches(ROOT) ? node : node?.parentElement) ?? undefined,
  }
}

/**
 * How much horizontal room `target` has to itself: from the right edge of the content left of it
 * to the left edge of whatever follows it, or to their shared container's content box where
 * nothing does. Stays meaningful when `target` overflows — unlike its own width, which is why it
 * can decide what still fits.
 *
 *   useAvailableWidth.root
 *  ┌───────────────────────────────────────────────────────┐
 *  │  ┌───────────┐  ┌╌╌╌╌╌╌╌╌╌┐  ┌────────┐  ┌─────────┐  │
 *  │  │ neighbour │  ╎  free   ╎  │ target │  │ blocker │  │
 *  │  └───────────┘  └╌╌╌╌╌╌╌╌╌┘  └────────┘  └─────────┘  │
 *  └─────────────────┬──────────────────────┬──────────────┘
 *                    from                   to
 *                    └─────── space ───────┘
 *
 * Elements spread with `useAvailableWidth.free` are read as empty space rather than as content
 * — the measurement runs straight through them, so `target` may grow into the room they hold. The
 * row containing `target` should carry `useAvailableWidth.root`: without it a target with nothing
 * to its left keeps climbing and ends up measured against something elsewhere on the page.
 *
 * Either neighbour may be missing, in which case that end falls back to the container's content
 * box. `target` itself is never measured — which is what keeps the answer meaningful once it
 * overflows, and what lets an element that has given way find its way back.
 */
export function useAvailableWidth(target: MaybeComputedElementRef) {
  // until measured, whatever asks gets "plenty" and renders in full
  const space = ref(Infinity)

  // which elements bound the gap is a fact about the current DOM, not a reactive derivation of
  // `target` — re-resolve it on every measure, or the observer keeps watching elements that left
  const container = shallowRef<HTMLElement>()
  const edge = shallowRef<HTMLElement>()
  const blocker = shallowRef<HTMLElement>()

  function measure() {
    const anchor = anchors(target)
    container.value = anchor.container
    edge.value = anchor.edge?.el
    blocker.value = anchor.blocker
    // detached, or no row to measure in: back to "plenty", not a stale answer about a gone DOM
    if (!anchor.container) {
      space.value = Infinity
      return
    }

    const style = getComputedStyle(anchor.container)
    const box = anchor.container.getBoundingClientRect()
    // the container's own gap is not room `target` may use — unless that side stands open
    const gap = px(style.columnGap) || 0

    const from = anchor.edge
      ? anchor.edge.el.getBoundingClientRect()[anchor.edge.side] +
        (anchor.edge.side === 'right' ? gap : 0)
      : box.left + px(style.paddingLeft)
    const to = anchor.blocker
      ? anchor.blocker.getBoundingClientRect().left - gap
      : box.right - px(style.paddingRight)

    space.value = to - from
  }

  useResizeObserver([container, edge, blocker], measure)
  onMounted(measure)
  // the elements bounding the gap come and go with the surrounding component's re-renders
  onUpdated(measure)

  return space
}

/** Spread onto the box the search for a target's neighbours stops at. */
useAvailableWidth.root = { [ROOT_ATTR]: '' }

/** Spread onto an element that only fills room the others left over — a divider centred in the
 * gap, say. It sits in the flow, but the width it covers still counts as free. */
useAvailableWidth.free = { [FREE_ATTR]: '' }
