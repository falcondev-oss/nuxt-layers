import type { ButtonProps, RadioGroupItem } from '@nuxt/ui'
import type { GetItemValue } from '#ui/types'
import { UButton, UModal, URadioGroup } from '#components'

export type AskOptions = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Color of the confirm button and the radios. */
  color?: ButtonProps['color']
}

/** What picking an item answers: the item itself, or its `value` for an object. */
export type AskSelectValue<T extends RadioGroupItem[]> = GetItemValue<T, 'value'>

export type AskSelectOptions<T extends RadioGroupItem[]> = AskOptions & {
  items: T
  /** Picked when the modal opens. Without it, confirming needs a pick first. */
  defaultValue?: NoInfer<AskSelectValue<T>>
}

// wrapped, so a picked `null` is told apart from a cancel
export type AskResult<V> = { value: V } | undefined

export default defineSetupComponent(
  <T extends RadioGroupItem[]>(_: {
    props: AskOptions & Partial<Omit<AskSelectOptions<T>, keyof AskOptions>>
    emits: {
      close: (result: AskResult<AskSelectValue<T>>) => void
    }
  }) =>
    options(_, {
      name: 'ModalAsk',
      props: [
        'title',
        'description',
        'confirmLabel',
        'cancelLabel',
        'color',
        'items',
        'defaultValue',
      ],
      emits: ['close'],
      setup: (props, { emit }) => {
        const picked = shallowRef<AskResult<AskSelectValue<T>>>(
          props.defaultValue === undefined ? undefined : { value: props.defaultValue },
        )

        const color = () => props.color ?? 'primary'
        const confirm = () =>
          emit('close', props.items ? picked.value : ({ value: undefined } as never))

        return () => (
          <UModal
            title={props.title}
            description={props.description}
            close={false}
            ui={{
              header: 'min-h-0 border-b-0 pb-0',
              body: 'sm:pt-4',
              title: 'text-lg',
              description: 'mt-0 text-base',
            }}
            v-slots={vSlots(UModal, {
              body: props.items
                ? () => [
                    <URadioGroup
                      modelValue={picked.value?.value}
                      onUpdate:modelValue={(value) => {
                        picked.value = { value }
                      }}
                      items={props.items}
                      variant="table"
                      color={color()}
                    />,
                  ]
                : undefined,
              footer: () => [
                <div class="flex w-full justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="soft"
                    label={props.cancelLabel ?? 'Abbrechen'}
                    onClick={() => emit('close', undefined)}
                  />
                  <UButton
                    color={color()}
                    label={props.confirmLabel ?? 'Bestätigen'}
                    disabled={!!props.items && !picked.value}
                    onClick={confirm}
                  />
                </div>,
              ],
            })}
          />
        )
      },
    }),
)
