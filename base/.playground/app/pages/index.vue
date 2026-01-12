<script setup lang="ts">
import { LazyOverlayModalActions } from '#components'
import z from 'zod'

const confirm = useConfirm()
const overlay = useOverlay()

const form = useForm({
  schema: z.object({
    duration: z.number(),
    dateIso: z.string(),
  }),
  sourceValues: () => ({
    dateIso: null,
    duration: null,
  }),
  async submit({ values }) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
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
        icon: 'lucide:pencil',
        onClick: () => {
          console.log('Edit row')
        },
      },
    ],
  },
)
</script>

<template>
  <LayoutDashboard
    :sidebar="{
      items: [
        {
          label: 'Home',
          icon: 'i-lucide-house',
          active: true,
        },
        {
          label: 'Inbox',
          icon: 'i-lucide-inbox',
          badge: '4',
        },
        {
          label: 'Contacts',
          icon: 'i-lucide-users',
        },
        {
          label: 'Settings',
          icon: 'i-lucide-settings',
          defaultOpen: true,
          children: [
            {
              label: 'General',
            },
            {
              label: 'Members',
            },
            {
              label: 'Notifications',
            },
          ],
        },
      ],
      bottomItems: [
        {
          label: 'Home',
          icon: 'i-lucide-house',
          active: true,
        },
        {
          label: 'Inbox',
          icon: 'i-lucide-inbox',
          badge: '4',
        },
        {
          label: 'Contacts',
          icon: 'i-lucide-users',
        },
        {
          label: 'Settings',
          icon: 'i-lucide-settings',
          defaultOpen: true,
          children: [
            {
              label: 'General',
            },
            {
              label: 'Members',
            },
            {
              label: 'Notifications',
            },
          ],
        },
      ],
      userMenu: {
        name: 'Benjamin Canac',
        avatarSrc: 'https://github.com/benjamincanac.png',
      },
    }"
    :navbar="{
      title: 'Dashboard',
    }"
    :toolbar="{
      items: [
        {
          label: 'General',
          icon: 'i-lucide-user',
          active: true,
        },
        {
          label: 'Members',
          icon: 'i-lucide-users',
        },
        {
          label: 'Notifications',
          icon: 'i-lucide-bell',
        },
      ],
      itemsEnd: [
        {
          label: 'General',
          icon: 'i-lucide-user',
          active: true,
        },
        {
          label: 'Members',
          icon: 'i-lucide-users',
        },
        {
          label: 'Notifications',
          icon: 'i-lucide-bell',
        },
      ],
    }"
  >
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
        body: 'flex flex-col gap-4 items-start ',
      }"
    >
      <UForm
        :form
        :success-toast="{
          title: 'test',
          description: 'wow',
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
      </UForm>
    </UCard>
  </LayoutDashboard>
</template>
