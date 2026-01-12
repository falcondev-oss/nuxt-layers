import type { ButtonProps, TableColumn, TableRow } from '@nuxt/ui'
import type { UnwrapRef } from 'vue'
import { UActions } from '#components'

interface ActionsOptions<T> {
  onDelete?: (row: TableRow<T>) => any
  headerActions?: ButtonProps[]
  rowActions?: ButtonProps[] | ((row: TableRow<T>) => ButtonProps[])
}

type GetRowType<T extends MaybeRef<Record<string, any>[] | undefined | null>> = NonNullable<
  UnwrapRef<T>
>[number]

const rowActionDefaults = {
  variant: 'ghost',
} satisfies ButtonProps
const headerActionDefaults = {
  variant: 'subtle',
} satisfies ButtonProps

export function useTableColumns<T extends MaybeRef<Record<string, any>[] | undefined | null>>(
  columns: MaybeRefOrGetter<TableColumn<GetRowType<T>>[]>,
  actions?: ActionsOptions<GetRowType<T>>,
) {
  return computed(() => {
    const cols = [...toValue(columns)]
    if (!actions) return cols

    return [
      ...cols,
      {
        id: '$actions',
        header: () => (
          <UActions
            defaults={headerActionDefaults}
            class="justify-end"
            actions={actions.headerActions}
          />
        ),
        cell: ({ row }) => {
          const rowActions = [
            ...((typeof actions.rowActions === 'function'
              ? actions.rowActions(row)
              : actions.rowActions) ?? []),
          ]
          if (actions.onDelete)
            rowActions.push({
              icon: 'lucide:trash',
              color: 'error',
              loadingAuto: true,
              onClick: async () => {
                await actions.onDelete?.(row)
              },
            })

          return (
            <UActions
              defaults={rowActionDefaults}
              class="justify-end gap-2!"
              actions={rowActions}
            />
          )
        },
      },
    ] satisfies TableColumn<GetRowType<T>>[]
  })
}
