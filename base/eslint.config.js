// @ts-check
import eslintConfig from '@falcondev-oss/configs/eslint'

export default eslintConfig({
  tsconfigPath: new URL('tsconfig.json', import.meta.url).pathname,
  nuxt: true,
}).append({
  ignores: [
    'node_modules/',
    'dist/',
    '.nuxt/',
    '.nitro/',
    '.output/',
    '.temp/',
    '.data/',
    'pnpm-lock.yaml',
  ],
})
