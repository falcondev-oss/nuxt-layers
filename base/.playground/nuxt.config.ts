export default defineNuxtConfig({
  extends: ['..'],
  ssr: false,
  runtimeConfig: {
    public: {
      projectId: 'my-project',
    },
  },
  typescript: {
    tsConfig: {
      vueCompilerOptions: {
        strictTemplates: true,
        strictVModel: false,
        htmlAttributes: ['aria-*'],
        dataAttributes: ['data-*'],
      },
    },
  },
  css: ['~/assets/test.css'],
})
