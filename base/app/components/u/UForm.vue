<script setup lang="ts">
import type { Toast } from '#ui/composables'
import type { FormHandle } from '@falcondev-oss/form-core'
import type { ButtonProps } from '@nuxt/ui'

const props = withDefaults(
  defineProps<{
    submitLabel?: string
    submitButtonProps?: ButtonProps
    actions?: ButtonProps[]
    form: FormHandle
    disableSubmitIfUnchanged?: boolean
    successToast?: Partial<Toast>
  }>(),
  {
    disableSubmitIfUnchanged: true,
  },
)

defineSlots<{
  default: any
}>()

const actionsWithSubmit = computed(() => {
  const submit = {
    ...props.submitButtonProps,
    variant: 'solid',
    label: props.submitButtonProps?.label ?? props.submitLabel ?? 'Submit',
    disabled: props.disableSubmitIfUnchanged
      ? !props.form.isChanged || props.form.isLoading
      : props.form.isLoading,
    loading: props.form.isLoading,
    onClick: async () => {
      await props.form.submit()
    },
  } satisfies ButtonProps
  if (!props.actions) return [submit]

  return [...props.actions, submit]
})

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
  {
    immediate: true,
  },
)
</script>

<template>
  <form class="w-full" @submit.prevent="() => form.submit()">
    <slot />
    <div class="col-span-full flex w-full items-center justify-end gap-4">
      <UActions
        :defaults="{
          variant: 'subtle',
        }"
        :actions="actionsWithSubmit"
      />
    </div>
  </form>
</template>
