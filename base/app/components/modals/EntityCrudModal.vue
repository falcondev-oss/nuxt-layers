<script
  setup
  lang="ts"
  generic="
    Schema extends FormSchema,
    QueryData extends NonNullable<FormSourceValues<Schema>>,
    Select extends QueryData = QueryData,
    Id extends string | null = string | null
  "
>
import type { FormSchema, FormSourceValues, FormSubmitValues } from '@falcondev-oss/form-core'
import type { DefaultError, UseQueryOptions } from '@tanstack/vue-query'
import type { If, IsNever } from 'type-fest'
import { useForm } from '@falcondev-oss/form-vue'
import { useQuery } from '@tanstack/vue-query'
import modalTheme from '#build/ui/modal'

const props = defineProps<{
  id: Id
  name: string
  schema: Schema
  getQueryOptions: (
    id: Id,
  ) => UseQueryOptions<If<IsNever<Select>, QueryData, any>, DefaultError, Select>
  newValues: NonNullable<FormSourceValues<Schema>>
  mutate: (values: FormSubmitValues<Schema> & { id: Id }) => Promise<unknown>
}>()

const emit = defineEmits<{
  close: []
}>()

defineSlots<{
  default: (props: { form: ReturnType<typeof useForm<Schema>>; data: typeof data.value }) => any
}>()

const toast = useToast()
const appConfig = useAppConfig()

const { data, isLoading } = useQuery(computed(() => props.getQueryOptions(props.id)))

const form = useForm({
  schema: props.schema,
  sourceValues: () => {
    if (isLoading.value) return

    return data.value ?? props.newValues
  },
  async submit({ values }) {
    await props.mutate({
      ...values,
      id: props.id,
    })

    emit('close')
    toast.add({
      title: `${props.name} ${props.id ? 'aktualisiert' : 'erstellt'}`,
      color: 'success',
      icon: 'lucide:check',
    })
  },
})

const formActionsTeleportId = useId()
const closeHandle = ref<(() => void) | null>(null)

// const { tryLeave, onLeave } = usePreventLeave()
// onLeave(() => {
//   console.warn('leave')
//   closeHandle.value?.()
// })
</script>

<template>
  <UModal :close="false" :title="`${name} ${id ? 'bearbeiten' : 'erstellen'}`" :dismissible="false">
    <template #actions>
      <UButton
        :class="modalTheme.slots.close"
        :icon="appConfig.ui.icons.close"
        color="neutral"
        variant="ghost"
        aria-label="Schließen"
        loading-auto
        @click="
          async () => {
            // if (!(await tryLeave())) return
            closeHandle?.()
          }
        "
      />
    </template>
    <template #body="{ close }">
      <Sync v-model:output="closeHandle" :input="close" />
      <UForm
        class="flex flex-col gap-2"
        :form
        :submit-label="id ? 'Speichern' : 'Erstellen'"
        :actions-teleport-to="`#${formActionsTeleportId}`"
      >
        <slot :form :data />
      </UForm>
    </template>
    <template #footer>
      <div :id="formActionsTeleportId" class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="soft" label="Abbrechen" @click="() => emit('close')" />
      </div>
    </template>
  </UModal>
</template>
