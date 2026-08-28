export function formatEuros(amount: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

export function templateParts(
  strings: TemplateStringsArray,
  ...values: unknown[]
): { strings: string[]; values: string[] } {
  return {
    strings: [...strings],
    values: values.map(String),
  }
}
