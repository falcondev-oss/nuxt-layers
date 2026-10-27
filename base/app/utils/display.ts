export function formatEuros(amount: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

/** A text with highlighted values, from `templateParts`. `TemplateText` renders it. */
export type TemplateParts = { strings: string[]; values: string[] }

export function templateParts(strings: TemplateStringsArray, ...values: unknown[]): TemplateParts {
  return {
    strings: [...strings],
    values: values.map(String),
  }
}
