<script setup lang="ts">
import type { CardProps, CardSlots } from '@nuxt/ui'
import { useForwardProps } from 'reka-ui'
const props = defineProps<CardProps>()
const slots = defineSlots<CardSlots>()

const forwarded = useForwardProps(props)
</script>

<template>
  <UCard
    v-bind="forwarded"
    :ui="{
      body: 'p-0!',
      ...forwarded.ui,
    }"
  >
    <template v-for="(_, name) of slots" #[name]>
      <slot :name />
    </template>
  </UCard>
</template>
