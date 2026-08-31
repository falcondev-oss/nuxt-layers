import type { DateValue } from '@internationalized/date'
import type { CalendarProps, InputDateProps } from '@nuxt/ui'
import type { ComponentPublicInstance } from 'vue'
import { UButton, UCalendar, UInputDate, UPopover } from '#components'

export default defineSetupComponent(
  (_: {
    props: {
      modelValue: DateValue | null
      input?: InputDateProps
      calendar?: CalendarProps
      disabled?: boolean
      loading?: boolean
    }
    emits: {
      'blur': () => void
      'update:modelValue': (value: DateValue | null) => void
    }
  }) =>
    options(_, {
      name: 'UInputDatePicker',
      props: ['modelValue', 'input', 'calendar', 'disabled', 'loading'],
      emits: ['blur', 'update:modelValue'],
      setup: (props, { emit }) => {
        // only the slice of `UInputDate`'s exposed API the popover anchors to
        const inputDate = ref<{ inputsRef: ComponentPublicInstance[] }>()
        const open = ref(false)

        watch(open, () => {
          if (!open.value) emit('blur')
        })

        return () => (
          <UInputDate
            ref={inputDate}
            {...props.input}
            disabled={props.disabled}
            loading={props.loading}
            range={false}
            modelValue={props.modelValue}
            onBlur={() => emit('blur')}
            onUpdate:modelValue={(value) => emit('update:modelValue', value ?? null)}
            v-slots={vSlots(UInputDate, {
              trailing: () => [
                <UPopover
                  open={open.value}
                  onUpdate:open={(value) => {
                    open.value = value
                  }}
                  reference={inputDate.value?.inputsRef[3]?.$el as HTMLElement | undefined}
                  v-slots={vSlots(UPopover, {
                    content: () => [
                      <div class="p-2">
                        <UCalendar
                          {...props.calendar}
                          modelValue={props.modelValue ?? undefined}
                          multiple={false}
                          range={false}
                          onUpdate:modelValue={(value) => {
                            emit('update:modelValue', value ?? null)
                            open.value = false
                          }}
                        />
                        {props.modelValue ? (
                          <div class="flex justify-end">
                            <UButton
                              variant="ghost"
                              icon="tabler:trash"
                              color="error"
                              label="Löschen"
                              size="sm"
                              onClick={() => emit('update:modelValue', null)}
                            />
                          </div>
                        ) : null}
                      </div>,
                    ],
                  })}
                >
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    class="px-0"
                  />
                </UPopover>,
              ],
            })}
          />
        )
      },
    }),
)
