<script setup lang="ts">
import type {
  DashboardNavbarProps,
  DashboardNavbarSlots,
  DashboardPanelProps,
  DashboardToolbarProps,
  NavigationMenuItem,
  NavigationMenuProps,
} from '@nuxt/ui'
import type { AddPropertyPrefix } from '../../types/helpers'
import * as R from 'remeda'

defineProps<{
  panel?: DashboardPanelProps
  navbar?: {
    showSidebarToggle?: boolean
    title?: string
    ui?: DashboardNavbarProps['ui']
  }
  toolbar?: {
    items?: NavigationMenuItem[]
    itemsEnd?: NavigationMenuItem[]
    ui?: DashboardToolbarProps['ui']
    itemsUi?: NavigationMenuProps['ui']
    itemsEndUi?: NavigationMenuProps['ui']
  }
}>()

const slots = defineSlots<
  {
    default: any
  } & AddPropertyPrefix<DashboardNavbarSlots, 'navbar'>
>()

const omitNavbarSlots = ['navbar-leading'] satisfies (keyof typeof slots)[]
const navbarSlots = computed(() =>
  R.pipe(
    slots,
    R.pickBy((_, key) => key.startsWith('navbar-')),
    R.omit(omitNavbarSlots),
    R.keys(),
    R.pullObject(
      (key) => key.replace('navbar-', ''),
      (key) => key,
    ),
  ),
)
</script>

<template>
  <UDashboardPanel v-bind="panel">
    <template #header>
      <UDashboardNavbar v-if="navbar" :ui="navbar.ui" class="bg-white" :title="navbar.title">
        <template v-if="navbar.showSidebarToggle" #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template v-for="(originalName, slotName) in navbarSlots" #[slotName]="slotData">
          <!-- @vue-ignore -->
          <slot :name="originalName" v-bind="slotData || {}" />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar v-if="toolbar" :ui="toolbar.ui" class="bg-white">
        <UNavigationMenu :items="toolbar.items" highlight :ui="toolbar.itemsUi" />
        <UNavigationMenu
          :items="toolbar.itemsEnd"
          class="ml-auto"
          highlight
          :ui="toolbar.itemsEndUi"
        />
      </UDashboardToolbar>
    </template>
    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>
