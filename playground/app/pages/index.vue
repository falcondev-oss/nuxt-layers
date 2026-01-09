<script setup lang="ts">
import { LazyOverlayModalActions } from '#components'
import z from 'zod'

const confirm = useConfirm()
const overlay = useOverlay()

const form = useForm({
  schema: z.object({
    duration: z.number(),
    dateIso: z.string(),
    options: z.array(z.string()),
  }),
  sourceValues: () => ({
    dateIso: null,
    duration: null,
    options: null,
  }),
  async submit({ values }) {
    console.log(values)
  },
})

const data = ref([
  {
    hey: '',
    ho: 1,
  },
])

const columns = useTableColumns<typeof data>(
  () => [
    {
      accessorKey: 'hey',
    },
    {
      accessorKey: 'ho',
    },
  ],
  {
    headerActions: [
      {
        label: 'Add Row',
        onClick: () => {
          data.value.push({ hey: 'new', ho: data.value.length + 1 })
        },
      },
      {
        label: 'Add Row 2',
        onClick: () => {
          data.value.push({ hey: 'new', ho: data.value.length + 1 })
        },
      },
    ],
    onDelete(row) {
      data.value = data.value.filter((_, i) => i !== row.index)
    },
    rowActions: [
      {
        icon: 'ph:pencil',
        onClick: () => {
          console.log('Edit row')
        },
      },
    ],
  },
)
</script>

<template>
  <UContainer class="flex flex-col gap-4 p-4">
    <UTableCard>
      <UTable :data :columns @select="() => {}" />
    </UTableCard>
    <UCard
      :ui="{
        body: 'flex flex-col gap-4 items-start',
      }"
    >
      <UButton
        label="Confirm"
        variant="subtle"
        @click="
          () => {
            confirm.confirmDestructive({
              title: 'Are you sure?',
              description: 'This action cannot be undone.',
              submitLabel: 'Yes, delete it',
            })
          }
        "
      />
      <UButton
        label="Actions"
        variant="subtle"
        @click="
          () => {
            overlay.create(LazyOverlayModalActions, {
              defaultOpen: true,
              props: {
                title: 'Actions',
                description: 'Choose an action to perform',
                actions: [
                  {
                    label: 'Action 1',
                  },
                  {
                    label: 'Action 2',
                  },
                ],
              },
            })
          }
        "
      />
    </UCard>
    <UCard
      :ui="{
        body: 'flex flex-col gap-4 items-start',
      }"
    >
      {{ form.data }}
      <UField
        v-slot="props"
        :field="
          form.fields.dateIso.$use({
            translate: dateValueIsoTranslator(),
          })
        "
      >
        <UInputDatePicker v-bind="props" />
      </UField>
      <UField v-slot="props" :field="form.fields.duration.$use()">
        <UInputDurationMinutes v-bind="props" />
      </UField>
    </UCard>
  </UContainer>
</template>
