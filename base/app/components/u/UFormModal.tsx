import type { FormHandle } from '@falcondev-oss/form-core'
import type { ModalEmits, ModalProps, ModalSlots } from '@nuxt/ui'
import type { EmitsToProps, FormHTMLAttributes } from 'vue'
import type { UFormProps } from './UForm'
import modalTheme from '#build/ui/modal'
import { UButton, UForm, UModal } from '#components'

export default defineSetupComponent(
  (_: {
    props: ModalProps &
      EmitsToProps<AsEmits<ModalEmits>> & {
        form: FormHandle
        formProps?: Omit<UFormProps, 'form' | 'actionsTeleportTo'> & FormHTMLAttributes
      }
    // the rest reaches `UModal` as inherited attributes
    propKeys: 'form' | 'formProps'
    // `body` holds the form fields, the footer holds the form's buttons
    slots: Omit<ModalSlots, 'footer'>
  }) =>
    options(_, {
      name: 'UFormModal',
      props: ['form', 'formProps'],
      emits: [],
      // placed by hand, so `close` and `dismissible` can be overridden below
      inheritAttrs: false,
      setup: (props, { slots, attrs }) => {
        const appConfig = useAppConfig()
        const dialog = useDialog()

        // only the modal's slots receive `close`, the last render's is kept for the hooks below
        let close: (() => void) | undefined

        // a pending save can't be left, and unsaved changes are only dropped once the user agrees to
        async function requestClose() {
          if (props.form.isLoading) return
          if (props.form.isChanged) {
            if (!(await dialog.askDiscard())) return
            // the form usually outlives the modal, so the discarded edits would show on reopening
            props.form.reset()
          }
          close?.()
        }

        watch(
          () => props.form,
          (form, _, onCleanup) => {
            onCleanup(
              form.hooks.addHooks({
                afterSubmit({ success }) {
                  if (success) close?.()
                },
              }),
            )
          },
          { immediate: true },
        )

        const actionsId = useId()

        return () => (
          <UModal
            {...attrs}
            // an outside click or Escape with unsaved changes asks first, through `close:prevent`
            dismissible={attrs.dismissible ?? (!props.form.isChanged && !props.form.isLoading)}
            onClose:prevent={() => void requestClose()}
            // `UModal`'s x closes right away, so it's replaced with one that asks first
            close={false}
            v-slots={vSlots(UModal, {
              ...slots,
              actions: () => [
                ...(slots.actions?.() ?? []),
                ...(attrs.close === false
                  ? []
                  : [
                      <UButton
                        class={modalTheme.slots.close}
                        // `closeIcon` is typed `any` in `@nuxt/ui`
                        icon={(attrs.closeIcon as string | undefined) ?? appConfig.ui.icons.close}
                        color="neutral"
                        variant="ghost"
                        aria-label="Schließen"
                        {...(typeof attrs.close === 'object' ? attrs.close : {})}
                        disabled={props.form.isLoading}
                        onClick={() => void requestClose()}
                      />,
                    ]),
              ],
              body: (slotProps) => {
                close = slotProps.close
                return [
                  <UForm
                    submitLabel="Speichern"
                    {...props.formProps}
                    // replaced rather than merged, so a consumer's layout doesn't fight the default gap
                    class={props.formProps?.class ?? 'flex flex-col gap-4'}
                    form={props.form}
                    actionsTeleportTo={`#${actionsId}`}
                    v-slots={{ default: () => slots.body?.(slotProps) ?? [] }}
                  />,
                ]
              },
              footer: () => [
                <div id={actionsId} class="flex w-full justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="soft"
                    label="Abbrechen"
                    disabled={props.form.isLoading}
                    onClick={() => void requestClose()}
                  />
                </div>,
              ],
            })}
          />
        )
      },
    }),
)
