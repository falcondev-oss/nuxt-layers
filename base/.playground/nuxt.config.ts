export default defineNuxtConfig({
  extends: ['..'],
  ssr: false,
  runtimeConfig: {
    public: {
      projectId: 'my-project',
    },
  },
  css: ['~/assets/test.css'],
})
