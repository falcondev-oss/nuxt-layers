<script setup lang="ts">
import type { AppProps } from '@nuxt/ui'
import { useForwardProps } from 'reka-ui'

const props = defineProps<{
  app?: AppProps
}>()

const forwarded = useForwardProps(props)

const config = useRuntimeConfig()
</script>

<template>
  <UApp v-bind="forwarded.app" :nonce="config.public.projectId">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
