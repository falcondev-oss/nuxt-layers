import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  hooks: {
    // consumers only pick up `app/**/*` through an `include` glob that their own
    // tsconfig may exclude, so reference the layer's global augmentations explicitly
    'prepare:types': ({ references }) => {
      references.push({ path: path.join(currentDir, './app/index.d.ts') })
    },
  },

  // dev
  vite: {
    // `@vitejs/plugin-vue-jsx` only wires up HMR for exports whose initializer calls one of
    // these names. Every component here is `export default defineSetupComponent(...)`, so
    // without this no module is an HMR boundary and every edit escalates to a full reload.
    vueJsx: {
      defineComponentName: ['defineComponent', 'defineSetupComponent'],
    },
  },
  typescript: {
    strict: true,
    tsConfig: {
      vueCompilerOptions: {
        strictTemplates: true,
        strictVModel: false,
        htmlAttributes: ['aria-*'],
        dataAttributes: ['data-*'],
      },
      compilerOptions: {
        allowArbitraryExtensions: true,
      },
    },
  },
  nitro: {
    experimental: {
      tasks: true,
    },
    esbuild: {
      // enable top-level await in nitro
      options: {
        target: 'esnext',
      },
    },
    typescript: {
      tsConfig: {
        compilerOptions: {
          noImplicitOverride: true,
          noUncheckedIndexedAccess: true,
        },
        exclude: ['.playground/'],
      },
      strict: true,
    },
  },
  components: [
    {
      // layer configs resolve `~` against the consuming project, so use absolute paths
      path: path.join(currentDir, './app/components'),
      pathPrefix: false,
    },
  ],
  imports: {
    dirs: [
      // layer configs resolve `~` against the consuming project, so use absolute paths
      path.join(currentDir, './app/types'),
      path.join(currentDir, './app/utils/*/index.ts'),
    ],
    imports: [
      {
        from: '@falcondev-oss/form-vue',
        name: 'useForm',
      },
      {
        from: '@falcondev-oss/trpc-typed-form-data/client',
        name: 'createTypedFormData',
      },
      {
        name: 'useToast',
        from: path.join(currentDir, './app/composables/useToast'),
        priority: 10,
      },
    ],
  },
  sourcemap: {
    client: 'hidden',
    server: true,
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
  build: {
    transpile: ['trpc-nuxt'],
  },
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
