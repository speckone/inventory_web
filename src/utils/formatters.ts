export function formatCurrency(value: number | string): string {
  return '$' + parseFloat(String(value)).toFixed(2)
}

export function formatDate(value: string): string {
  if (!value) return ''
  const [year, month, day] = value.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}
