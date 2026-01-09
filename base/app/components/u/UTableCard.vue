<script setup lang="ts">
import type { CardSlots } from '@nuxt/ui'
const slots = defineSlots<CardSlots>()
</script>

<template>
  <UCard
    :ui="{
      body: 'p-0!',
    }"
  >
    <template v-for="(_, name) of slots" #[name]>
      <slot :name />
    </template>
  </UCard>
</template>
