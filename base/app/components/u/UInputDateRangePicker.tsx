import type { CalendarDate, DateValue } from '@internationalized/date'
import type { ComponentPublicInstance } from 'vue'
import { toCalendarDate } from '@internationalized/date'
import { UButton, UCalendar, UInputDate, UPopover } from '#components'

type Range = {
  start: CalendarDate
  end: CalendarDate
}

export default defineSetupComponent(
  (_: {
    props: {
      modelValue: Range | null
    }
    emits: {
      'update:modelValue': (value: Range | null) => void
    }
  }) =>
    options(_, {
      name: 'UInputDateRangePicker',
      props: ['modelValue'],
      emits: ['update:modelValue'],
      setup: (props, { emit }) => {
        // only the slice of `UInputDate`'s exposed API the popover anchors to
        const inputDate = ref<{ inputsRef: ComponentPublicInstance[] }>()

        const localModel = shallowRef({
          start: props.modelValue?.start,
          end: props.modelValue?.end,
        } as
          | {
              start: DateValue | undefined
              end: DateValue | undefined
            }
          | undefined
          | null)

        const open = ref(false)

        let syncingModelValue = false
        watch(
          localModel,
          (newValue) => {
            // prevent infinite loop
            if (syncingModelValue) return

            if (newValue?.start && newValue.end) {
              emit('update:modelValue', {
                start: toCalendarDate(newValue.start),
                end: toCalendarDate(newValue.end),
              })
              open.value = false
            } else if (!newValue?.start && !newValue?.end) {
              emit('update:modelValue', null)
              open.value = false
            }
          },
          {
            flush: 'sync',
          },
        )

        watch(
          () => props.modelValue,
          (newValue) => {
            syncingModelValue = true
            localModel.value = newValue
              ? {
                  start: newValue.start,
                  end: newValue.end,
                }
              : {
                  start: undefined,
                  end: undefined,
                }
            syncingModelValue = false
          },
        )

        return () => (
          <UInputDate
            ref={inputDate}
            modelValue={localModel.value}
            onUpdate:modelValue={(value) => {
              localModel.value = value
            }}
            range
            v-slots={vSlots(UInputDate, {
              trailing: () => [
                <UPopover
                  open={open.value}
                  onUpdate:open={(value) => {
                    open.value = value
                  }}
                  reference={inputDate.value?.inputsRef[0]?.$el as HTMLElement | undefined}
                  v-slots={vSlots(UPopover, {
                    content: () => [
                      <div class="p-2">
                        <UCalendar
                          modelValue={localModel.value}
                          onUpdate:modelValue={(value) => {
                            localModel.value = value
                          }}
                          numberOfMonths={2}
                          range
                        />
                        {props.modelValue ? (
                          <div class="flex justify-end">
                            <UButton
                              variant="ghost"
                              icon="tabler:trash"
                              color="error"
                              label="Löschen"
                              size="sm"
                              onClick={() => {
                                localModel.value = {
                                  start: undefined,
                                  end: undefined,
                                }
                              }}
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
