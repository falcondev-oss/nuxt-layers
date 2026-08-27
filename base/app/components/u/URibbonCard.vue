<script setup lang="ts">
import type { CardProps, CardSlots } from '@nuxt/ui'
import { useForwardProps } from 'reka-ui'

const props = defineProps<CardProps>()
const slots = defineSlots<
  CardSlots & {
    /** Ribbon strip above the body — fill it with `URibbonSection`s. */
    ribbon?: () => any
  }
>()

const forwarded = useForwardProps(props)

const cardSlots = computed(
  () => Object.keys(slots).filter((name) => name !== 'ribbon') as (keyof CardSlots)[],
)
</script>

<template>
  <div class="flex flex-col">
    <!-- the ribbon's lower edge runs behind the card, so the card keeps its own rounded top -->
    <div
      v-if="slots.ribbon"
      class="divide-default ring-default bg-elevated -mb-2 flex items-stretch divide-x overflow-x-auto rounded-t-lg pb-2 shadow-[inset_0_2px_3px_-2px_rgb(0_0_0/0.06),inset_2px_0_3px_-2px_rgb(0_0_0/0.06),inset_-2px_0_3px_-2px_rgb(0_0_0/0.06)] ring"
    >
      <slot name="ribbon" />
    </div>

    <UCard
      v-bind="forwarded"
      :ui="{
        body: 'p-0!',
        ...forwarded.ui,
      }"
      class="ring-accented relative shadow-[0_-2px_3px_-1px_rgb(0_0_0/0.08)]"
    >
      <template v-for="name of cardSlots" #[name]>
        <slot :name />
      </template>
    </UCard>
  </div>
</template>
