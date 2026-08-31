import type { FormHandle } from '@falcondev-oss/form-core'
import type { ButtonProps } from '@nuxt/ui'
import type { VNode } from 'vue'
import type { Toast } from '#ui/composables'
import { Teleport } from 'vue'
import { UActions } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      form: FormHandle
      submitLabel?: string
      submitButtonProps?: ButtonProps
      actions?: ButtonProps[]
      actionsTeleportTo?: string
      disableSubmitIfUnchanged?: boolean
      successToast?: Partial<Toast>
      preventPageLeave?: boolean
    }
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
      setup: (props, { slots }) => {
        const preventPageLeave = () => props.preventPageLeave ?? true
        const disableSubmitIfUnchanged = () => props.disableSubmitIfUnchanged ?? true

        usePreventPageLeave(
          () => preventPageLeave() && props.form.isChanged && !props.form.isLoading,
        )

        const toast = useToast()
        let unhook: (() => void) | null = null
        watch(
          () => props.form,
          (form) => {
            unhook?.()
            unhook = form.hooks.addHooks({
              afterSubmit(result) {
                if (!result.success || !props.successToast) return

                toast.add({
                  preset: 'success',
                  ...props.successToast,
                })
              },
            })
          },
          { immediate: true },
        )

        const actionsWithSubmit = computed(() => {
          const submit = {
            ...props.submitButtonProps,
            variant: 'solid',
            label: props.submitButtonProps?.label ?? props.submitLabel ?? 'Submit',
            disabled: disableSubmitIfUnchanged()
              ? !props.form.isChanged || props.form.isLoading
              : props.form.isLoading,
            loading: props.form.isLoading,
            // `loadingAuto` awaits the handler, which `ButtonProps` still types as `void`
            // eslint-disable-next-line ts/no-misused-promises
            onClick: async () => {
              await props.form.submit()
            },
          } satisfies ButtonProps
          if (!props.actions) return [submit]

          return [...props.actions, submit]
        })

        const rootErrors = computed(() =>
          props.form.errors?.filter((error) => error.path?.length === 0),
        )

        return () => (
          <form
            class="w-full"
            onSubmit={(event) => {
              event.preventDefault()
              void props.form.submit()
            }}
          >
            {slots.default?.()}
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
                    actions={actionsWithSubmit.value}
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
