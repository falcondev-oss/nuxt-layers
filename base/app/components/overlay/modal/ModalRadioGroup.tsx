import type { GetItemValue, NestedItem, RadioGroupItem } from '#ui/types'
import { UButton, UModal, URadioGroup } from '#components'

export default defineSetupComponent(
  <T extends Extract<RadioGroupItem, object>>(_: {
    props: {
      items: T[]
      defaultValue: GetItemValue<T[], 'value', NestedItem<T>>
      title: string
      submitButtonLabel: string
      description?: string
    }
    emits: {
      close: (value: T['value'] | undefined) => void
    }
  }) =>
    options(_, {
      name: 'ModalRadioGroup',
      props: ['items', 'defaultValue', 'title', 'submitButtonLabel', 'description'],
      emits: ['close'],
      setup: (props, { emit }) => {
        // `RadioGroupItem['value']` is `any` in `@nuxt/ui`, so neither the picked value nor what
        // the radio group reports back can be typed any tighter — hence the disables below
        const selectedValue = ref<T['value'] | undefined>(props.defaultValue)

        return () => (
          <UModal
            title={props.title}
            description={props.description}
            v-slots={vSlots(UModal, {
              body: () => [
                <div class="flex flex-col gap-4">
                  <URadioGroup
                    // eslint-disable-next-line ts/no-unsafe-assignment
                    modelValue={selectedValue.value}
                    onUpdate:modelValue={(value) => {
                      selectedValue.value = value
                    }}
                    variant="table"
                    items={props.items}
                  />
                  <div class="flex w-full justify-end gap-4">
                    <UButton
                      label="Abbrechen"
                      variant="ghost"
                      color="neutral"
                      onClick={() => emit('close', undefined)}
                    />
                    <UButton
                      label={props.submitButtonLabel}
                      // eslint-disable-next-line ts/no-unsafe-argument
                      onClick={() => emit('close', selectedValue.value)}
                    />
                  </div>
                </div>,
              ],
            })}
          />
        )
      },
    }),
)
