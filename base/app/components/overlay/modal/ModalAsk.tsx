import type { ButtonProps, RadioGroupItem } from '@nuxt/ui'
import type { VNodeChild } from 'vue'
import type { GetItemValue } from '#ui/types'
import type { TemplateParts } from '../../../utils/display'
import { TemplateText, UButton, UModal, URadioGroup } from '#components'

export type AskOptions = {
  /** A `templateParts` text shows its values highlighted, e.g. the kind of thing that gets deleted. */
  title: string | TemplateParts
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
  /** Shows the X in the header, which cancels like the cancel button. Defaults to `true`. */
  close?: boolean
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

function text(value: string | TemplateParts) {
  return typeof value === 'string' ? <>{value}</> : <TemplateText text={value} />
}

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
        'close',
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
          const close = props.close !== false

          return (
            <UModal
              close={close ? { onClick: () => emit('close', undefined) } : false}
              ui={{
                // the border above the buttons comes from the body, so a dialog without a body has none
                header: 'border-b-0',
                // the X sits absolutely over the header's end, so a long title keeps clear of it
                title: close ? 'pe-10 sm:pe-8' : undefined,
                body: 'pt-0!',
              }}
              v-slots={vSlots(UModal, {
                title: () => [text(props.title)],
                body: hasBody
                  ? () => [
                      <div class="flex flex-col gap-4">
                        {description ? <p>{text(description)}</p> : null}
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
