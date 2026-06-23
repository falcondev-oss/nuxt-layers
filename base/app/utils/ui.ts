import type { SlotClass, SlotClassReplacer } from '@nuxt/ui'
import type { ClassValue } from 'tailwind-variants'
import { cnMerge } from 'tailwind-variants'

export function mergeSlotClass(ui: SlotClass, extend: ClassValue): SlotClassReplacer {
  return (defaults) => {
    const withBase = cnMerge(defaults, extend)() ?? ''
    if (typeof ui === 'function') {
      return ui(withBase)
    }
    return cnMerge(withBase, ui)() ?? ''
  }
}
