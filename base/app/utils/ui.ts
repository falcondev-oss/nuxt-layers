import type { SlotClass } from '@nuxt/ui'
import type { ClassValue } from 'tailwind-variants'
import { cnMerge } from 'tailwind-variants'

/** Always resolves to a class string, so the result also stands on its own as a `class`. */
export function mergeSlotClass(ui: SlotClass, extend: ClassValue): (defaults: string) => string {
  return (defaults) => {
    const withBase = cnMerge(defaults, extend)() ?? ''
    if (typeof ui === 'function') {
      return cnMerge(ui(withBase))() ?? ''
    }
    return cnMerge(withBase, ui)() ?? ''
  }
}
