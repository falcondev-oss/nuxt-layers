// @ts-check
import eslintConfig from '@falcondev-oss/configs/eslint'

export default eslintConfig({}).append({
  ignores: ['node_modules/', 'base/', 'pnpm-lock.yaml'],
})
