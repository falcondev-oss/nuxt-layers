import type { ButtonProps, RadioGroupItem } from '@nuxt/ui'
import type { VNodeChild } from 'vue'
import type { GetItemValue } from '#ui/types'
import type { TemplateParts } from '../../../utils/display'
import { TemplateText, UButton, UModal, URadioGroup } from '#components'

export type AskOptions = {
  title: string
  /** A `templateParts` text shows its values highlighted, e.g. the name of what gets deleted. */
  description?: string | TemplateParts
  /** Content above the items, e.g. a warning or an input. Renders reactively. */
  body?: () => VNodeChild
  confirmLabel?: string
  cancelLabel?: string
  /** Disables confirming while it returns `true`, e.g. until an input in `body` is filled. */
  confirmDisabled?: () => boolean
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
        'body',
        'confirmLabel',
        'cancelLabel',
        'confirmDisabled',
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

        return () => {
          const description = props.description
          const hasBody = !!(description || props.body || props.items)

          return (
            <UModal
              title={props.title}
              close={false}
              ui={{
                // the header border only stays without a body, so a border always sets off the buttons
                header: hasBody ? 'border-b-0!' : undefined,
                body: 'pt-0!',
              }}
              v-slots={vSlots(UModal, {
                body: hasBody
                  ? () => [
                      <div class="flex flex-col gap-4">
                        {description ? (
                          <p>
                            {typeof description === 'string' ? (
                              description
                            ) : (
                              <TemplateText text={description} />
                            )}
                          </p>
                        ) : null}
                        {props.body?.()}
                        {props.items ? (
                          <URadioGroup
                            modelValue={picked.value?.value}
                            onUpdate:modelValue={(value) => {
                              picked.value = { value }
                            }}
                            items={props.items}
                            variant="table"
                            color={color()}
                          />
                        ) : null}
                      </div>,
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
                      disabled={(!!props.items && !picked.value) || !!props.confirmDisabled?.()}
                      onClick={confirm}
                    />
                  </div>,
                ],
              })}
            />
          )
        }
      },
    }),
)
