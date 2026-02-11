export function formatCurrency(value: number | string): string {
  return '$' + parseFloat(String(value)).toFixed(2)
}

export function formatDate(value: string): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString()
}
