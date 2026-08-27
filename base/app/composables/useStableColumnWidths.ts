/**
 * pins a table's column widths at their measured auto-layout size, so filtering rows out can't
 * resize the columns underneath the user
 *
 * pass the `UTable` template ref — the widths re-measure when the table resizes or a column is
 * shown or hidden, and `freeze()` re-measures them by hand once late data has rendered
 */
export function useStableColumnWidths(
  table: MaybeRefOrGetter<{ $el?: HTMLElement } | null | undefined>,
) {
  const tableEl = computed(() => toValue(table)?.$el?.querySelector('table') ?? null)
  const headerRow = computed(() => tableEl.value?.tHead?.rows[0] ?? null)

  /** the table width the current widths were measured at */
  let measuredAt = 0

  function freeze() {
    const el = tableEl.value
    const cells = headerRow.value && [...headerRow.value.cells]
    if (!el || !cells) return

    // measure the natural layout first — the pinned widths would otherwise fix the old one in place
    el.style.tableLayout = ''
    for (const cell of cells) cell.style.width = ''

    const widths = cells.map((cell) => cell.getBoundingClientRect().width)
    for (const [index, cell] of cells.entries()) cell.style.width = `${widths[index]!}px`
    el.style.tableLayout = 'fixed'
    measuredAt = el.getBoundingClientRect().width
  }

  onMounted(freeze)
  // a resize gives the columns a different share of the table, so they re-measure
  useResizeObserver(tableEl, () => {
    if (tableEl.value?.getBoundingClientRect().width !== measuredAt) freeze()
  })
  // showing or hiding a column adds or removes header cells, so the pinned widths no longer line up
  useMutationObserver(headerRow, freeze, { childList: true })

  return { freeze }
}
