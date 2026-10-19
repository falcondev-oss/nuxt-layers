import type { FormHandle } from '@falcondev-oss/form-core'
import type { ButtonProps } from '@nuxt/ui'
import type { VNode } from 'vue'
import type { Toast } from '#ui/composables'
import { Teleport } from 'vue'
import { UActions, UDisabled } from '#components'

export type UFormProps = {
  form: FormHandle
  submitLabel?: string
  submitButtonProps?: ButtonProps
  actions?: ButtonProps[]
  actionsTeleportTo?: string
  disableSubmitIfUnchanged?: boolean
  successToast?: Partial<Toast>
  preventPageLeave?: boolean
}

export default defineSetupComponent(
  (_: {
    props: UFormProps
    slots: {
      default: () => VNode[]
    }
  }) =>
    options(_, {
      name: 'UForm',
      props: [
        'form',
        'submitLabel',
        'submitButtonProps',
        'actions',
        'actionsTeleportTo',
        'disableSubmitIfUnchanged',
        'successToast',
        'preventPageLeave',
      ],
      emits: [],
      setup: (props, { slots, attrs }) => {
        const preventPageLeave = () => props.preventPageLeave ?? true
        const disableSubmitIfUnchanged = () => props.disableSubmitIfUnchanged ?? true

        usePreventPageLeave(
          () => preventPageLeave() && props.form.isChanged && !props.form.isLoading,
        )

        const toast = useToast()
        // the cleanup also runs on unmount, so a form outliving this component doesn't keep the hook
        watch(
          () => props.form,
          (form, _, onCleanup) => {
            const unhook = form.hooks.addHooks({
              afterSubmit(result) {
                if (!result.success || !props.successToast) return

                toast.add({
                  preset: 'success',
                  ...props.successToast,
                })
              },
            })
            onCleanup(unhook)
          },
          { immediate: true },
        )

        // `form` links the submit button to the form even when teleported out of it,
        // so Enter submits forms with more than one field (implicit submission).
        // A consumer `id` falls through to `<form>` and wins, so the button must use it too.
        const generatedId = useId()
        const formId = () => String(attrs.id ?? generatedId)
        // read in render, as `attrs` is not reactive
        const actionsWithSubmit = () => {
          const submit = {
            ...props.submitButtonProps,
            variant: 'solid',
            label: props.submitButtonProps?.label ?? props.submitLabel ?? 'Submit',
            disabled: disableSubmitIfUnchanged()
              ? !props.form.isChanged || props.form.isLoading
              : props.form.isLoading,
            loading: props.form.isLoading,
            type: 'submit',
            form: formId(),
          } satisfies ButtonProps
          if (!props.actions) return [submit]

          return [...props.actions, submit]
        }

        const rootErrors = computed(() =>
          props.form.errors?.filter((error) => error.path?.length === 0),
        )

        return () => (
          <form
            id={formId()}
            // schema validation is the single source of truth, not native constraints
            novalidate
            class="w-full"
            onSubmit={(event) => {
              event.preventDefault()
              void props.form.submit()
            }}
          >
            <UDisabled
              disabled={props.form.isLoading}
              v-slots={{ default: () => slots.default?.() ?? [] }}
            />
            <div
              style={{
                display: rootErrors.value?.length || !props.actionsTeleportTo ? undefined : 'none',
              }}
              class="col-span-full flex w-full flex-col gap-4"
            >
              {rootErrors.value?.length ? (
                <ul class="text-error text-sm">
                  {rootErrors.value.map((error) => (
                    <li key={`${String(error.path)}:${error.message}`}>
                      {error.path}:{error.message}
                    </li>
                  ))}
                </ul>
              ) : null}

              <hr class="h-px w-full text-(--ui-border-muted)" />

              <div
                style={{ display: props.actionsTeleportTo ? 'none' : undefined }}
                class="flex items-center justify-end gap-4"
              >
                <Teleport defer disabled={!props.actionsTeleportTo} to={props.actionsTeleportTo}>
                  <UActions
                    defaults={{ variant: 'subtle' }}
                    actions={actionsWithSubmit()}
                    class="contents!"
                  />
                </Teleport>
              </div>
            </div>
          </form>
        )
      },
    }),
)
