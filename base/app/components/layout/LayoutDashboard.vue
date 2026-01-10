<script setup lang="ts">
import type { ButtonProps, NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  sidebar?: {
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
  }
  navbar?: {
    title?: string
  }
  toolbar?: {
    items?: NavigationMenuItem[]
    itemsEnd?: NavigationMenuItem[]
  }
  container?: boolean
}>()

defineSlots<{
  default: any
}>()

const config = useRuntimeConfig()
</script>

<template>
  <UDashboardGroup storage="local" :storage-key="`${config.public.projectId}-dashboard`" unit="rem">
    <UDashboardSidebar v-if="sidebar" collapsible resizable class="bg-white" mode="drawer">
      <template v-if="sidebar.logo?.src || sidebar.logo?.iconSrc" #header="{ collapsed }">
        <img
          v-if="!collapsed && sidebar.logo.src"
          class="h-5 w-auto shrink-0"
          :src="sidebar.logo.src"
        />
        <img
          v-if="(collapsed || !sidebar.logo.src) && sidebar.logo.iconSrc"
          class="size-5"
          :src="sidebar.logo.iconSrc"
          :class="{
            'mx-auto': collapsed,
          }"
        />
      </template>
      <template #default="{ collapsed }">
        <UNavigationMenu
          v-if="sidebar.items"
          :collapsed="collapsed"
          :items="sidebar.items"
          orientation="vertical"
        />

        <UNavigationMenu
          v-if="sidebar.bottomItems"
          :collapsed="collapsed"
          :items="sidebar.bottomItems"
          orientation="vertical"
          class="mt-auto"
        />
      </template>
      <template v-if="sidebar.userMenu" #footer="{ collapsed }">
        <UButton
          :label="collapsed ? undefined : sidebar.userMenu.name"
          :avatar="{
            src: sidebar.userMenu.avatarSrc,
            alt: sidebar.userMenu.name,
          }"
          color="neutral"
          variant="ghost"
          class="w-full"
          :block="collapsed"
        />
      </template>
    </UDashboardSidebar>
    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar v-if="navbar" class="bg-white" :title="navbar.title">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
        <UDashboardToolbar v-if="toolbar" class="bg-white">
          <UNavigationMenu :items="toolbar.items" highlight />
          <UNavigationMenu :items="toolbar.itemsEnd" class="ml-auto" highlight />
        </UDashboardToolbar>
      </template>
      <template #body>
        <UContainer v-if="container">
          <slot />
        </UContainer>
        <slot v-else />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
