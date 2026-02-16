<script setup lang="ts">
import type { DashboardSidebarProps, NavigationMenuItem, NavigationMenuProps } from '@nuxt/ui'

defineProps<{
  sidebar?: DashboardSidebarProps
  logo?: {
    src?: string
    iconSrc?: string
  }
  items?: NavigationMenuItem[]
  bottomItems?: NavigationMenuItem[]
  userMenu?: {
    name: string
    avatarSrc?: string
  }
  itemsUi?: NavigationMenuProps['ui']
  bottomItemsUi?: NavigationMenuProps['ui']
}>()

const slots = defineSlots<{
  default: any
  logo: any
  icon: any
}>()

const config = useRuntimeConfig()
</script>

<template>
  <UDashboardGroup storage="local" :storage-key="`${config.public.projectId}-dashboard`" unit="rem">
    <UDashboardSidebar v-bind="sidebar" class="bg-white" mode="drawer">
      <template v-if="logo?.src || logo?.iconSrc" #header="{ collapsed }">
        <slot v-if="!collapsed" name="logo">
          <img v-if="logo.src" class="h-5 w-auto shrink-0" :src="logo.src" />
        </slot>
        <slot v-if="collapsed || (!logo.src && !slots.logo)" name="icon">
          <img
            v-if="logo.iconSrc"
            class="size-5"
            :src="logo.iconSrc"
            :class="{
              'mx-auto': collapsed,
            }"
          />
        </slot>
      </template>
      <template #default="{ collapsed }">
        <UNavigationMenu
          v-if="items"
          :collapsed="collapsed"
          :items="items"
          orientation="vertical"
          :ui="itemsUi"
        />

        <UNavigationMenu
          v-if="bottomItems"
          :collapsed="collapsed"
          :items="bottomItems"
          orientation="vertical"
          class="mt-auto"
          :ui="bottomItemsUi"
        />
      </template>
      <template v-if="userMenu" #footer="{ collapsed }">
        <UButton
          :label="collapsed ? undefined : userMenu.name"
          :avatar="{
            src: userMenu.avatarSrc,
            alt: userMenu.name,
          }"
          color="neutral"
          variant="ghost"
          class="w-full"
          :block="collapsed"
        />
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
