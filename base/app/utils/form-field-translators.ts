import type { FormFieldTranslator } from '@falcondev-oss/form-core'
import type { DateValue } from 'reka-ui'
import { parseDate } from '@internationalized/date'

export function nullUndefinedTranslator<T>() {
  return {
    get(v: T | null) {
      return v ?? undefined
    },
    set(v: T | undefined) {
      return v ?? null
    },
  }
}
export function nullIndeterminateTranslator(): FormFieldTranslator<
  boolean | null,
  boolean | 'indeterminate'
> {
  return {
    get: (v) => v ?? ('indeterminate' as const),
    set: (v) => (v === 'indeterminate' ? null : v),
  }
}
export function indeterminateFalseTranslator(): FormFieldTranslator<
  boolean,
  boolean | 'indeterminate'
> {
  return {
    get: (v) => (v === false ? 'indeterminate' : v),
    set: (v) => (v === 'indeterminate' ? false : v),
  }
}
export function dateValueIsoTranslator(): FormFieldTranslator<string | null, DateValue | null> {
  return {
    get: (v) => (v ? parseDate(v) : null),
    set: (v) => {
      if (!v) return null
      return v.toString()
    },
  }
}
