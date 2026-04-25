import { UButton, UCard } from '#components'

export type ListItems = { label: string; value: string }[]

export default defineSetupComponent(
  <T extends ListItems>(_: {
    props: {
      items: T
    }
    emits: {
      choose: (value: T[number]) => void
    }
    slots: {
      selected: (props: { item: T[number] }) => any
    }
  }) => ({
    props: props(_, ['items']),
    // props: ['items'],
    emits: emits(_, ['choose']),
    // emits: ['choose'],
    setup: generic(_, (props, { emit, slots }) => {
      const selected = ref<T[number]>()

      return () => (
        <UCard
          class="w-fit"
          vSlots={vSlots(UCard, {
            header: () => <h1>Select an item</h1>,
          })}
        >
          <div class="flex flex-col gap-2">
            {props.items.map((item) => (
              <UButton
                variant="subtle"
                key={item.value}
                class="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                onClick={() => {
                  selected.value = item
                  emit('choose', item)
                }}
                vSlots={vSlots(UButton, {
                  leading: () => `[${selected.value?.value === item.value ? 'x' : ' '}] `,
                })}
              >
                {item.label}
              </UButton>
            ))}

            {slots.selected && selected.value ? (
              <div class="mt-4">{slots.selected({ item: selected.value })}</div>
            ) : null}
          </div>
        </UCard>
      )
    }),
  }),
)
