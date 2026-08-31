import type { FormField } from '@falcondev-oss/form-core'
import type { FormFieldProps, FormFieldSlots } from '@nuxt/ui'
import type { VNode, WritableComputedRef } from 'vue'
import { useForwardProps } from 'reka-ui'
import * as R from 'remeda'
import { DevOnly, UFormField, UIcon, UPopover } from '#components'
import { mergeSlotClass } from '../../utils/ui'

type InputProps<T> = {
  'modelValue': T
  'onUpdate:modelValue': (value: T) => void
  'onBlur': () => void
  'disabled': boolean
  'loading': boolean
  'modelModifiers': { nullable: true }
  'placeholder'?: string
}

function renderErrors(errors: string[]) {
  if (errors.length === 1) return <p>{errors.join('\n')}</p>

  return (
    <ul>
      {errors.map((error, index) => (
        <li key={error + index} class="list-inside">
          {error}
        </li>
      ))}
    </ul>
  )
}

export default defineSetupComponent(
  <T,>(_: {
    props: FormFieldProps & {
      field: FormField<T>
      errorInline?: boolean
      errorPreferPlaceholder?: boolean
    }
    slots: {
      default: (slot: {
        bind: InputProps<T>
        model: WritableComputedRef<T>
        field: FormField<T>
      }) => VNode[]
    } & Omit<FormFieldSlots, 'default'>
  }) =>
    options(_, {
      name: 'UField',
      props: [
        'as',
        'name',
        'errorPattern',
        'label',
        'description',
        'help',
        'error',
        'hint',
        'size',
        'required',
        'eagerValidation',
        'validateOnInputDelay',
        'orientation',
        'class',
        'ui',
        'field',
        'errorInline',
        'errorPreferPlaceholder',
      ],
      emits: [],
      setup: (props, { slots }) => {
        const forwardedProps = useForwardProps(props)

        const isOverMaxLength = computed(() => {
          const field = forwardedProps.value.field

          return field.schema.maxLength === undefined || field.value == null
            ? false
            : (field.value as string | number)?.toString().length > field.schema.maxLength
        })

        const formFieldProps = computed<FormFieldProps>(() => {
          const { field, ...rest } = forwardedProps.value

          const hint =
            field.schema.maxLength === undefined ||
            field.schema.maxLength === field.schema.minLength
              ? undefined
              : `${(field.value as string | number | null)?.toString().length ?? 0}/${field.schema.maxLength}`

          return {
            required: field.schema.required,
            label: field.schema.title,
            description: field.schema.description,
            hint,
            ...R.omitBy(rest, (v) => v === undefined),
          }
        })

        const bind = computed(() => {
          const field = forwardedProps.value.field

          const placeholder = (field.errors && field.errors[0]) || field.schema.default?.toString()

          return {
            'modelValue': field.value,
            'onUpdate:modelValue': (value) => field.handleChange(value),
            'onBlur': () => field.handleBlur(),
            'disabled': field.disabled,
            'loading': field.isPending,
            placeholder,
            'modelModifiers': { nullable: true },
          } satisfies InputProps<T>
        })

        const model = computed({
          get() {
            return forwardedProps.value.field.value
          },
          set(value: T) {
            forwardedProps.value.field.handleChange(value)
          },
        })

        return () => {
          const field = props.field
          /** the error is only worth showing where it can't be read off the placeholder */
          const showErrors =
            !!field.errors && (props.errorPreferPlaceholder ? String(field.value).length > 0 : true)

          return (
            <UFormField
              {...formFieldProps.value}
              ui={{
                ...formFieldProps.value.ui,
                hint: mergeSlotClass(
                  formFieldProps.value.ui?.hint,
                  isOverMaxLength.value ? 'text-error' : '',
                ),
                error: mergeSlotClass(formFieldProps.value.ui?.error, 'mt-1!'),
              }}
              error={!!field.errors}
              class={['u-field', props.class]}
              v-slots={vSlots(UFormField, {
                default: () =>
                  slots.default?.({
                    bind: bind.value,
                    model,
                    field: forwardedProps.value.field,
                  }) ?? [
                    <DevOnly>
                      <p class="font-black text-red-500">UField missing slot</p>
                    </DevOnly>,
                  ],

                ...(props.errorInline && showErrors
                  ? {
                      error: () => [
                        renderErrors(field.errors!),
                        ...(typeof props.error === 'string' ? [<>{props.error}</>] : []),
                      ],
                    }
                  : {
                      hint: ({ hint }) => [
                        <span class="flex items-center gap-1.5">
                          {showErrors ? (
                            <UPopover
                              mode="hover"
                              openDelay={0}
                              ui={{
                                content: 'bg-error-50 ring-error-200! rounded py-1 px-2',
                              }}
                              v-slots={vSlots(UPopover, {
                                content: () => [
                                  <div class="max-w-sm text-xs text-(--ui-color-neutral-800)">
                                    {renderErrors(field.errors!)}
                                  </div>,
                                ],
                              })}
                            >
                              <UIcon name="lucide:circle-alert" class="text-error" />
                            </UPopover>
                          ) : null}

                          {hint}
                        </span>,
                      ],
                    }),

                ...(field.schema.examples && {
                  help: () => [
                    Array.isArray(field.schema.examples) ? (
                      <ul>
                        {field.schema.examples.map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{field.schema.examples}</p>
                    ),
                  ],
                }),

                ...R.omit(slots, ['default']),
              })}
            />
          )
        }
      },
    }),
)
