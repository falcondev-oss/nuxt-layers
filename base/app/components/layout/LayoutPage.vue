<script setup lang="ts">
import type {
  ButtonProps,
  FooterProps,
  FooterSlots,
  HeaderProps,
  HeaderSlots,
  NavigationMenuItem,
  NavigationMenuProps,
} from '@nuxt/ui'
import type { AddPropertyPrefix } from '~/types/helpers'
import { keys, omit, pickBy, pipe, pullObject } from 'remeda'

defineProps<{
  header?: {
    logo?: {
      src?: string
      iconSrc?: string
    }
    navigation?: NavigationMenuProps
    actions?: ButtonProps[]
    ui?: HeaderProps['ui']
  }
  footer?: {
    items?: NavigationMenuItem[]
    actions?: ButtonProps[]
    ui?: FooterProps['ui']
  }
}>()

const slots = defineSlots<
  {
    default: any
  } & AddPropertyPrefix<HeaderSlots, 'header'> &
    AddPropertyPrefix<FooterSlots, 'footer'>
>()

const omitHeaderSlots = [
  'header-title',
  'header-right',
  'header-default',
] satisfies (keyof typeof slots)[]

const headerSlots = computed(() =>
  pipe(
    slots,
    pickBy((_, key) => key.startsWith('header-')),
    omit(omitHeaderSlots),
    keys(),
    pullObject(
      (key) => key.replace('header-', ''),
      (key) => key,
    ),
  ),
)

const omitFooterSlots = [
  'footer-left',
  'footer-right',
  'footer-default',
] satisfies (keyof typeof slots)[]

const footerSlots = computed(() =>
  pipe(
    slots,
    pickBy((_, key) => key.startsWith('footer-')),
    omit(omitFooterSlots),
    keys(),
    pullObject(
      (key) => key.replace('footer-', ''),
      (key) => key,
    ),
  ),
)
</script>

<!-- eslint-disable vue/require-explicit-slots -->
<template>
  <div>
    <UHeader v-if="header" :ui="header.ui">
      <template v-if="header.logo || slots['header-title']" #title>
        <slot name="header-title">
          <template v-if="header.logo">
            <img v-if="header.logo.src" class="h-5 w-auto shrink-0" :src="header.logo.src" />
            <img
              v-if="!header.logo.src && header.logo.iconSrc"
              class="size-5"
              :src="header.logo.iconSrc"
            />
          </template>
        </slot>
      </template>

      <UNavigationMenu v-if="header.navigation" v-bind="header.navigation" />

      <template v-if="header.actions || slots['header-right']" #right>
        <slot name="header-right">
          <UActions
            v-if="header.actions"
            :actions="header.actions"
            :defaults="{
              variant: 'subtle',
            }"
          />
        </slot>
      </template>

      <template v-for="(originalName, slotName) in headerSlots" #[slotName]="slotData">
        <!-- @vue-ignore -->
        <slot :name="originalName" v-bind="slotData || {}" />
      </template>
    </UHeader>
    <UMain>
      <slot />
    </UMain>
    <UFooter v-if="footer" :ui="footer.ui">
      <template #left>
        <slot name="footer-left">
          <p class="text-muted text-sm">Copyright © {{ new Date().getFullYear() }}</p>
        </slot>
      </template>

      <UNavigationMenu v-if="footer.items" :items="footer.items" variant="link" />

      <template v-if="footer.actions || slots['footer-right']" #right>
        <slot name="footer-right">
          <UActions
            :actions="footer.actions"
            :defaults="{
              variant: 'ghost',
            }"
          />
        </slot>
      </template>

      <template v-for="(originalName, slotName) in footerSlots" #[slotName]="slotData">
        <!-- @vue-ignore -->
        <slot :name="originalName" v-bind="slotData || {}" />
      </template>
    </UFooter>
  </div>
</template>
