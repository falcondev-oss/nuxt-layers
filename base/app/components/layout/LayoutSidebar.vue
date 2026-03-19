<script setup lang="ts">
import type {
  AvatarProps,
  DashboardSidebarProps,
  DropdownMenuItem,
  NavigationMenuItem,
  NavigationMenuProps,
} from '@nuxt/ui'

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
    avatar?: AvatarProps
    items: DropdownMenuItem[]
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
    <UDashboardSidebar
      v-bind="sidebar"
      class="bg-white"
      mode="drawer"
      collapsible
      :ui="{
        ...sidebar?.ui,
        header: [sidebar?.ui?.header, 'border-b border-default'],
        footer: [sidebar?.ui?.footer, 'border-t border-default'],
      }"
    >
      <template
        v-if="logo?.src || logo?.iconSrc || slots.logo || slots.icon"
        #header="{ collapsed }"
      >
        <slot v-if="!collapsed" name="logo">
          <img v-if="logo?.src" class="h-5 w-auto shrink-0" :src="logo.src" />
        </slot>
        <slot v-if="collapsed || (!logo?.src && !slots.logo)" name="icon">
          <img
            v-if="logo?.iconSrc"
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

    <slot />
  </UDashboardGroup>
</template>
