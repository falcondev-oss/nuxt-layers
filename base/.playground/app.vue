<script setup lang="ts">
import { de } from '@nuxt/ui/locale'
import { Settings } from 'luxon'

Settings.throwOnInvalid = true
Settings.defaultLocale = 'de'
</script>

<template>
  <UCustomApp
    :app="{
      locale: de,
    }"
  />
</template>
