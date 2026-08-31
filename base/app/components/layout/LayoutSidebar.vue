<script setup lang="ts">
import type {
  ArrayOrNested,
  AvatarProps,
  DashboardSearchProps,
  DashboardSidebarProps,
  DropdownMenuItem,
  NavigationMenuItem,
  NavigationMenuProps,
} from '@nuxt/ui'
import { mergeSlotClass } from '../../utils/ui'

defineProps<{
  sidebar?: DashboardSidebarProps
  logo?: {
    src?: string
    iconSrc?: string
  }
  search?: DashboardSearchProps
  items?: NavigationMenuItem[]
  bottomItems?: NavigationMenuItem[]
  userMenu?: {
    name: string
    avatar?: AvatarProps
    items: ArrayOrNested<DropdownMenuItem>
  }
  itemsUi?: NavigationMenuProps['ui']
  bottomItemsUi?: NavigationMenuProps['ui']
}>()

const slots = defineSlots<{
  default: any
  logo?: any
  icon?: any
}>()

const config = useRuntimeConfig()
</script>

<template>
  <UDashboardGroup storage="local" :storage-key="`${config.public.projectId}-dashboard`" unit="rem">
    <UDashboardSidebar
      v-bind="sidebar"
      class="bg-white"
      mode="drawer"
      collapsible
      :ui="{
        ...sidebar?.ui,
        header: mergeSlotClass(sidebar?.ui?.header, 'border-b border-default'),
        footer: mergeSlotClass(sidebar?.ui?.footer, 'border-t border-default'),
      }"
    >
      <template
        v-if="logo?.src || logo?.iconSrc || slots.logo || slots.icon"
        #header="{ collapsed }"
      >
        <slot v-if="!collapsed" name="logo">
          <img v-if="logo?.src" class="h-5 w-auto shrink-0" :src="logo.src" />
        </slot>
        <div v-if="collapsed || (!logo?.src && !slots.logo)" :class="{ 'mx-auto': collapsed }">
          <slot name="icon">
            <img v-if="logo?.iconSrc" class="size-5" :src="logo.iconSrc" />
          </slot>
        </div>
      </template>
      <template #default="{ collapsed }">
        <!-- height and negative margins line the border up with the `LayoutNavbar` toolbar's, cancelling the sidebar body's padding -->
        <div
          v-if="search"
          class="border-default -mx-4 -mt-2 -mb-2 flex h-[calc(--spacing(12)+1px)] shrink-0 items-center border-b px-4 sm:max-lg:-mx-6 sm:max-lg:px-6"
        >
          <UDashboardSearchButton :collapsed="collapsed" variant="outline" tooltip block />
        </div>

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
        <UDropdownMenu :items="userMenu.items">
          <UButton
            :label="collapsed ? undefined : userMenu.name"
            :trailing-icon="collapsed ? undefined : 'ph:caret-up-down'"
            :icon="userMenu.avatar ? undefined : 'lucide:user-round'"
            :avatar="userMenu.avatar"
            color="neutral"
            variant="ghost"
            block
            :square="collapsed"
            class="data-[state=open]:bg-elevated"
            :ui="{
              leadingIcon: 'text-accented',
              trailingIcon: 'text-dimmed',
            }"
          />
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch v-if="search" :color-mode="false" v-bind="search" />

    <slot />
  </UDashboardGroup>
</template>
