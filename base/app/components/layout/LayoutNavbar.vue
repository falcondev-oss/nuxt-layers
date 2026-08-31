<script setup lang="ts">
import type {
  BreadcrumbItem,
  BreadcrumbProps,
  DashboardNavbarProps,
  DashboardNavbarSlots,
  DashboardPanelProps,
  DashboardToolbarProps,
  NavigationMenuItem,
  NavigationMenuProps,
} from '@nuxt/ui'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ToolbarTool } from '../../composables/useToolbar'
import type { AddPropertyPrefix } from '../../types/helpers'
import * as R from 'remeda'
import { toolbarToolsKey } from '../../composables/useToolbar'
import { mergeSlotClass } from '../../utils/ui'

const props = defineProps<{
  panel?: DashboardPanelProps
  navbar?: {
    sidebarToggle?: boolean
    title?: string
    breadcrumb?: BreadcrumbItem[]
    breadcrumbUi?: BreadcrumbProps<BreadcrumbItem>['ui']
    ui?: DashboardNavbarProps['ui']
  }
  tabs?: {
    items?: NavigationMenuItem[]
    ui?: NavigationMenuProps['ui']
  }
  tools?: {
    items?: NavigationMenuItem[]
    ui?: NavigationMenuProps['ui']
  }
  toolbarUi?: DashboardToolbarProps['ui']
}>()

const slots = defineSlots<
  {
    'default': any
    'navbar-title'?: any
    'navbar-trailing'?: any
    'navbar-actions'?: any
  } & AddPropertyPrefix<DashboardNavbarSlots, 'navbar'>
>()

// rendered manually in the `left` slot below
const omitNavbarSlots = [
  'navbar-left',
  'navbar-leading',
  'navbar-title',
  'navbar-trailing',
  'navbar-right',
  'navbar-actions',
] satisfies (keyof typeof slots)[]
const navbarSlots = computed(() =>
  R.pipe(
    slots,
    R.pickBy((_, key) => key.startsWith('navbar-')),
    R.omit(omitNavbarSlots),
    R.mapKeys((key) => key.replace('navbar-', '')),
  ),
)

// added by the content rendered inside this navbar through `useToolbar()`
// `ref()`'s deep unwrapping blows up on the recursive `NavigationMenuItem` type
const providedTools = ref([]) as Ref<MaybeRefOrGetter<ToolbarTool>[]>
provide(toolbarToolsKey, providedTools)

const toolItems = computed(() => [
  ...(props.tools?.items ?? []),
  ...providedTools.value.map((tool) => toValue(tool)),
])

const navbarUi = computed<DashboardNavbarProps['ui']>(() => ({
  ...props.navbar?.ui,
  toggle: mergeSlotClass(props.navbar?.ui?.toggle, '-ml-1'),
  ...(props.navbar?.breadcrumb && {
    root: mergeSlotClass(props.navbar.ui?.root, 'h-auto min-h-(--ui-header-height) py-2'),
  }),
}))
</script>

<template>
  <UDashboardPanel v-bind="panel">
    <template #header>
      <ForwardSlots v-if="navbar" :slots="navbarSlots">
        <UDashboardNavbar :ui="navbarUi" class="bg-white" :title="navbar.title">
          <template #left>
            <UDashboardSidebarCollapse v-if="navbar.sidebarToggle" class="-ml-1" />

            <div class="flex min-w-0 flex-col items-start gap-0.5">
              <div class="flex min-w-0 items-center gap-1.5">
                <h1 class="text-highlighted truncate font-semibold">
                  <slot name="navbar-title">{{ navbar.title }}</slot>
                </h1>
                <slot name="navbar-trailing" />
              </div>

              <UBreadcrumb
                v-if="navbar.breadcrumb"
                :items="navbar.breadcrumb"
                :ui="{
                  ...navbar.breadcrumbUi,
                  link: mergeSlotClass(navbar.breadcrumbUi?.link, 'text-xs'),
                  separatorIcon: mergeSlotClass(navbar.breadcrumbUi?.separatorIcon, 'size-3.5'),
                }"
              />
            </div>
          </template>

          <template #right>
            <!-- eslint-disable-next-line vue/require-explicit-slots -->
            <slot name="navbar-right" />
            <div id="navbar-actions" class="flex items-center gap-2">
              <slot name="navbar-actions" />
            </div>
          </template>
        </UDashboardNavbar>
      </ForwardSlots>
      <UDashboardToolbar
        v-if="tabs || toolItems.length"
        :ui="toolbarUi"
        class="bg-white *:first:-ml-2"
      >
        <template #left>
          <UNavigationMenu v-if="tabs" :items="tabs.items" highlight variant="link" :ui="tabs.ui" />
          <UNavigationMenu v-else :items="toolItems" highlight :ui="tools?.ui" />
        </template>
        <template v-if="tabs" #right>
          <UNavigationMenu :items="toolItems" highlight :ui="tools?.ui" />
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>
