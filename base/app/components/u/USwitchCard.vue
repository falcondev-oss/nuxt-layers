<script lang="ts" setup>
const props = defineProps<{
  title: string
  icon?: string
  loading?: boolean
  alwaysExpanded?: boolean
}>()

const emit = defineEmits<{
  toggle: [value: boolean, controller: AbortController]
}>()

defineSlots<{
  default: () => any
}>()

const model = defineModel<boolean>({ required: true })

const expanded = computed(() => props.alwaysExpanded || model.value)

function onToggle(value: boolean) {
  const controller = new AbortController()
  emit('toggle', value, controller)
  if (controller.signal.aborted) return

  model.value = value
}
</script>

<template>
  <UCard
    class="m-px"
    variant="subtle"
    :ui="{
      header: `text-sm font-semibold py-2 px-3! ${expanded ? '' : 'border-b-0'}`,
      body: `p-3! ${expanded ? '' : 'hidden'}`,
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-8">
        <span class="flex items-center gap-2">
          <UIcon v-if="icon" :name="icon" class="text-muted size-5" />
          {{ title }}
        </span>
        <USwitch :model-value="model" :loading @update:model-value="(value) => onToggle(value)" />
      </div>
    </template>

    <slot />
  </UCard>
</template>
