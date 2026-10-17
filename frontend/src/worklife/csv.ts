import type { CellStatus, CsvRow } from './model'

export function formatCsvCount(status: CellStatus, count: number | null): string {
  if (status === 'absent' || status === 'outside_scope' || count == null) return ''
  return String(count)
}

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function toCsv(rows: readonly CsvRow[]): string {
  const lines = ['region_code,region_name,year,count,status']
  for (const row of rows) {
    lines.push(
      [
        String(row.region_code),
        escapeField(row.region_name),
        String(row.year),
        formatCsvCount(row.status, row.count),
        row.status,
      ].join(','),
    )
  }
  return `${lines.join('\n')}\n`
}

export function selectionFilename(year: number | 'all', region: number | null): string {
  const yearPart = year === 'all' ? 'kaikki-vuodet' : String(year)
  const regionPart = region == null ? 'kaikki-maakunnat' : String(region)
  return `ammattitaudit-maakunnat-${yearPart}-${regionPart}.csv`
}

export const FULL_EXPORT_FILENAME = 'ammattitaudit-maakunnat-koko-aineisto.csv'
