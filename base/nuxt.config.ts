import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // dev
  typescript: {
    tsConfig: {
      vueCompilerOptions: {
        strictTemplates: true,
        htmlAttributes: ['aria-*'],
        dataAttributes: ['data-*'],
        strictVModel: true,
      },
    },
    strict: true,
  },
  nitro: {
    typescript: {
      strict: true,
    },
  },
  imports: {
    imports: [
      {
        from: '@falcondev-oss/form-vue',
        name: 'useForm',
      },
    ],
  },

  // runtime
  experimental: {
    defaults: {
      nuxtLink: {
        prefetch: true,
      },
    },
  },
  css: [path.join(currentDir, './app/assets/css/base.css')],
  runtimeConfig: {
    public: {
      /**
       * used as a unique identifier in all sorts of places
       */
      projectId: 'base',
    },
  },

  // modules
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error'],
    },
  },
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
  icon: {
    cssLayer: 'base',
    provider: 'server',
    localApiEndpoint: '/_icons',
  },
  app: {
    head: {
      meta: [
        {
          name: 'robots',
          content: 'noindex',
        },
      ],
    },
  },
})
