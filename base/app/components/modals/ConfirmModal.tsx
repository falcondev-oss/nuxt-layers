import type { ButtonProps, RadioGroupItem, RadioGroupProps } from '@nuxt/ui'
import type { ComponentPublicInstance } from 'vue'
import type { ConfirmModalResult } from '../../composables/confirm'
import type { templateParts } from '../../utils/display'
import { SlotRef, TemplateText, UButton, UModal, URadioGroup } from '#components'

export type ConfirmModalProps<O extends RadioGroupItem[]> = {
  title: string
  confirmLabel: string
  confirmDisabled?: () => boolean
  text?: string | ReturnType<typeof templateParts>
  slotRef?: ComponentPublicInstance
  options?: O
  color?: ButtonProps['color']
}

export default defineSetupComponent(
  <const O extends RadioGroupItem[], R extends ConfirmModalResult<O>>(_: {
    props: ConfirmModalProps<O>
    emits: {
      close: (result: R) => void
    }
  }) =>
    options(_, {
      name: 'ConfirmModal',
      props: ['title', 'confirmLabel', 'confirmDisabled', 'text', 'slotRef', 'options', 'color'],
      emits: ['close'],
      setup: (props, { emit }) => {
        const selectedOption = ref<RadioGroupProps<O>['modelValue']>()

        return () => (
          <UModal
            title={props.title}
            close={{ onClick: () => emit('close', false as R) }}
            dismissible={false}
            ui={{ header: 'border-b-0!', body: 'pt-0!' }}
            v-slots={vSlots(UModal, {
              body: () => [
                <div class="flex flex-col gap-4">
                  {props.text && typeof props.text === 'string' ? <p>{props.text}</p> : null}
                  {typeof props.text === 'object' ? <TemplateText text={props.text} /> : null}

                  <SlotRef slotRef={props.slotRef} />

                  <URadioGroup
                    modelValue={selectedOption.value}
                    onUpdate:modelValue={(value) => {
                      selectedOption.value = value
                    }}
                    items={props.options}
                    variant="table"
                    color={props.color ?? 'error'}
                  />
                </div>,
              ],
              footer: () => [
                <div class="flex w-full justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="soft"
                    label="Abbrechen"
                    onClick={() => emit('close', false as R)}
                  />
                  <UButton
                    color={props.color ?? 'error'}
                    label={props.confirmLabel}
                    disabled={
                      (!!props.options?.length && selectedOption.value === undefined) ||
                      props.confirmDisabled?.()
                    }
                    onClick={() => emit('close', (selectedOption.value ?? true) as R)}
                  />
                </div>,
              ],
            })}
          />
        )
      },
    }),
)
