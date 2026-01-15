<script setup lang="ts">
import type { ButtonProps, FooterSlots, HeaderSlots, NavigationMenuItem } from '@nuxt/ui'
import { omit, pickBy, pipe } from 'remeda'

defineProps<{
  header?: {
    logo?: {
      src?: string
      iconSrc?: string
    }
    items?: NavigationMenuItem[]
    actions?: ButtonProps[]
  }
  footer?: {
    items?: NavigationMenuItem[]
    actions?: ButtonProps[]
  }
}>()

const slots = defineSlots<
  {
    default: any
  } & AddPropertyPrefix<HeaderSlots, 'header'> &
    AddPropertyPrefix<FooterSlots, 'footer'>
>()

type AddPropertyPrefix<T extends object, P extends string> = {
  [K in keyof T as `${P}-${K & string}`]: T[K]
}

const omitHeaderSlots = [
  'header-title',
  'header-right',
  'header-default',
] satisfies (keyof typeof slots)[]

const omitFooterSlots = [
  'footer-left',
  'footer-right',
  'footer-default',
] satisfies (keyof typeof slots)[]
</script>

<!-- eslint-disable vue/require-explicit-slots -->
<template>
  <div>
    <UHeader v-if="header">
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

      <UNavigationMenu v-if="header.items" :items="header.items" />

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

      <template
        v-for="(_, name) in pipe(
          slots,
          pickBy((_, key) => key.startsWith('header-')),
          omit(omitHeaderSlots),
        )"
        #[name]="slotData"
      >
        <!-- @vue-ignore -->
        <slot :name="name.replace('header-', '')" v-bind="slotData || {}" />
      </template>
    </UHeader>
    <UMain>
      <UContainer>
        <slot />
      </UContainer>
    </UMain>
    <UFooter v-if="footer">
      <template #left>
        <p class="text-muted text-sm">Copyright © {{ new Date().getFullYear() }}</p>
      </template>

      <UNavigationMenu v-if="footer.items" :items="footer.items" variant="link" />

      <template v-if="footer.actions" #right>
        <UActions
          :actions="footer.actions"
          :defaults="{
            variant: 'ghost',
          }"
        />
      </template>

      <template
        v-for="(_, name) in pipe(
          slots,
          pickBy((_, key) => key.startsWith('footer-')),
          omit(omitFooterSlots),
        )"
        #[name]="slotData"
      >
        <!-- @vue-ignore -->
        <slot :name="name.replace('footer-', '')" v-bind="slotData || {}" />
      </template>
    </UFooter>
  </div>
</template>
