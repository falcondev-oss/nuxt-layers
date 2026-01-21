<script setup lang="ts">
import type {
  DashboardNavbarProps,
  DashboardNavbarSlots,
  DashboardPanelProps,
  DashboardSidebarProps,
  DashboardToolbarProps,
  NavigationMenuItem,
} from '@nuxt/ui'
import type { AddPropertyPrefix } from '../../types/helpers'
import { keys, omit, pickBy, pipe, pullObject } from 'remeda'

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
    ui?: DashboardSidebarProps['ui']
    itemsUi?: NavigationMenuItem['ui']
    bottomItemsUi?: NavigationMenuItem['ui']
  }
  panel?: {
    navbar?: {
      title?: string
      ui?: DashboardNavbarProps['ui']
    }
    toolbar?: {
      items?: NavigationMenuItem[]
      itemsEnd?: NavigationMenuItem[]
      ui?: DashboardToolbarProps['ui']
      itemsUi?: NavigationMenuItem['ui']
      itemsEndUi?: NavigationMenuItem['ui']
    }
    container?: boolean
    ui?: DashboardPanelProps['ui']
  }
}>()

const slots = defineSlots<
  {
    default: any
  } & AddPropertyPrefix<DashboardNavbarSlots, 'navbar'>
>()

const omitNavbarSlots = ['navbar-leading'] satisfies (keyof typeof slots)[]

const navbarSlots = computed(() =>
  pipe(
    slots,
    pickBy((_, key) => key.startsWith('navbar-')),
    omit(omitNavbarSlots),
    keys(),
    pullObject(
      (key) => key.replace('navbar-', ''),
      (key) => key,
    ),
  ),
)

const config = useRuntimeConfig()
</script>

<template>
  <UDashboardGroup storage="local" :storage-key="`${config.public.projectId}-dashboard`" unit="rem">
    <UDashboardSidebar
      v-if="sidebar"
      :ui="sidebar.ui"
      collapsible
      resizable
      class="bg-white"
      mode="drawer"
    >
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
          :ui="sidebar.itemsUi"
        />

        <UNavigationMenu
          v-if="sidebar.bottomItems"
          :collapsed="collapsed"
          :items="sidebar.bottomItems"
          orientation="vertical"
          class="mt-auto"
          :ui="sidebar.bottomItemsUi"
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
        <UDashboardNavbar
          v-if="panel?.navbar"
          :ui="panel.navbar.ui"
          class="bg-white"
          :title="panel.navbar.title"
        >
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template v-for="(originalName, slotName) in navbarSlots" #[slotName]="slotData">
            <!-- @vue-ignore -->
            <slot :name="originalName" v-bind="slotData || {}" />
          </template>
        </UDashboardNavbar>
        <UDashboardToolbar v-if="panel?.toolbar" :ui="panel.toolbar.ui" class="bg-white">
          <UNavigationMenu :items="panel.toolbar.items" highlight :ui="panel.toolbar.itemsUi" />
          <UNavigationMenu
            :items="panel.toolbar.itemsEnd"
            class="ml-auto"
            highlight
            :ui="panel.toolbar.itemsEndUi"
          />
        </UDashboardToolbar>
      </template>
      <template #body>
        <UContainer v-if="panel?.container">
          <slot />
        </UContainer>
        <slot v-else />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
