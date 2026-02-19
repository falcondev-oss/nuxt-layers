<script setup lang="ts">
import { de } from '@nuxt/ui/locale'
import { Settings } from 'luxon'
import { authRedirect } from './middleware/auth.global'
import { channel } from './utils/channel'

Settings.throwOnInvalid = true
Settings.defaultLocale = 'de'

// redirect when auth status changes through broadcast channel
const route = useRoute()
useEventListener<MessageEvent>(channel, 'message', (event) => {
  if (event.data.type === 'auth') {
    authRedirect(route)
  }
})
</script>

<template>
  <UCustomApp
    :app="{
      locale: de,
    }"
  />
</template>
