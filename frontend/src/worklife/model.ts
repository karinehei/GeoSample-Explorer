export const YEARS = [2019, 2020, 2021, 2022, 2023] as const

export type CellStatus = 'published' | 'absent' | 'outside_scope' | 'confirmed_zero'
export type TotalStatus = CellStatus | 'partial'

export interface Cell {
  status: CellStatus
  count: number | null
}

export interface RegionRecord {
  code: number
  name: string
  nameSource: 'codebook' | 'geometry'
  geometryName: string
  cells: Record<string, Cell>
}

export interface CountsFile {
  provenance: {
    sourceUrl: string
    bytes: number
    sha256: string
    sourceFile: string
    dataRows: number
    verifiedOn: string
    dataLicense: string
    geometryLicense: string
    geometryCopyright: string[]
    geometryFile: string
  }
  years: number[]
  regions: RegionRecord[]
}

export type YearSelection = number | 'all'

export interface Selection {
  year: YearSelection
  region: number | null
}

export interface Total {
  status: TotalStatus
  count: number | null
  gapYears: { year: number; status: CellStatus }[]
}

export interface ViewValue {
  status: TotalStatus
  count: number | null
}

export interface CsvRow {
  region_code: number
  region_name: string
  year: number
  count: number | null
  status: CellStatus
}

export interface Domain {
  min: number
  max: number
}

export const STATUS_LABEL: Record<CellStatus, string> = {
  published: '',
  absent: 'Ei julkaistussa otteessa',
  outside_scope: 'Aineiston ulkopuolella – Ahvenanmaa poistettu',
  confirmed_zero: 'Vahvistettu nolla',
}

export const ANNUAL_SCALE_TITLE = 'Vuoden julkaistut tapaukset'
export const FIVE_YEAR_SCALE_TITLE = 'Julkaistujen tapausten summa 2019–2023'
export const BOUNDARY_NOTE =
  'Aluejako on lähdepaketin mukana toimitettu; sitä ei ole varmennettu vuosien 2019–2023 viralliseksi maakuntajaoksi.'

export const SCALE_COLORS = ['#f7fbff', '#c6dbef', '#6baed6', '#2171b5', '#08306b'] as const

const NUMERIC_STATUSES = new Set<CellStatus>(['published', 'confirmed_zero'])

export function cellAt(region: RegionRecord, year: number): Cell {
  return region.cells[String(year)] ?? { status: 'absent', count: null }
}

export function totalFor(region: RegionRecord, years: readonly number[]): Total {
  const cells = years.map((year) => ({ year, ...cellAt(region, year) }))
  const statuses = cells.map((cell) => cell.status)

  if (statuses.every((status) => status === 'outside_scope')) {
    return { status: 'outside_scope', count: null, gapYears: [] }
  }
  if (statuses.every((status) => status === 'absent')) {
    return { status: 'absent', count: null, gapYears: [] }
  }
  if (statuses.every((status) => status === 'confirmed_zero')) {
    return { status: 'confirmed_zero', count: 0, gapYears: [] }
  }

  let sum = 0
  let sawPublished = false
  for (const cell of cells) {
    if (cell.status === 'published' && cell.count != null) {
      sum += cell.count
      sawPublished = true
    } else if (cell.status === 'confirmed_zero') {
      sum += cell.count ?? 0
    }
  }

  const gapYears = cells
    .filter((cell) => !NUMERIC_STATUSES.has(cell.status))
    .map((cell) => ({ year: cell.year, status: cell.status }))

  if (gapYears.length === 0) {
    return {
      status: sawPublished ? 'published' : 'confirmed_zero',
      count: sum,
      gapYears: [],
    }
  }

  return { status: 'partial', count: sum, gapYears }
}

export function viewValue(region: RegionRecord, year: YearSelection, years: readonly number[]): ViewValue {
  if (year === 'all') {
    const total = totalFor(region, years)
    return { status: total.status, count: total.count }
  }
  const cell = cellAt(region, year)
  return { status: cell.status, count: cell.count }
}

export function describeCount(status: TotalStatus, count: number | null): string {
  if (status === 'published') return count == null ? '' : String(count)
  if (status === 'confirmed_zero') return STATUS_LABEL.confirmed_zero
  if (status === 'absent') return STATUS_LABEL.absent
  if (status === 'outside_scope') return STATUS_LABEL.outside_scope
  if (status === 'partial') return count == null ? '' : String(count)
  return ''
}

export function isNumericStatus(status: TotalStatus): boolean {
  return status === 'published' || status === 'confirmed_zero' || status === 'partial'
}

export function domainOf(values: readonly (number | null | undefined)[]): Domain | null {
  const numbers = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (numbers.length === 0) return null
  return { min: Math.min(...numbers), max: Math.max(...numbers) }
}

export function annualValues(regions: readonly RegionRecord[], years: readonly number[]): number[] {
  const values: number[] = []
  for (const region of regions) {
    for (const year of years) {
      const cell = cellAt(region, year)
      if (cell.status === 'published' && cell.count != null) values.push(cell.count)
    }
  }
  return values
}

export function fiveYearValues(regions: readonly RegionRecord[], years: readonly number[]): number[] {
  const values: number[] = []
  for (const region of regions) {
    const total = totalFor(region, years)
    if (total.status === 'published' && total.count != null) values.push(total.count)
  }
  return values
}

export function classIndex(value: number, domain: Domain, classes = SCALE_COLORS.length): number {
  if (domain.max === domain.min) return 0
  const ratio = (value - domain.min) / (domain.max - domain.min)
  const index = Math.floor(ratio * classes)
  return Math.min(classes - 1, Math.max(0, index))
}

export function colorForValue(value: number, domain: Domain): string {
  return SCALE_COLORS[classIndex(value, domain)]
}

export interface ClassBreak {
  index: number
  from: number
  to: number
}

export function classBreaks(domain: Domain, classes = SCALE_COLORS.length): ClassBreak[] {
  if (domain.max === domain.min) {
    return [{ index: 0, from: domain.min, to: domain.max }]
  }
  const step = (domain.max - domain.min) / classes
  return Array.from({ length: classes }, (_, index) => ({
    index,
    from: domain.min + step * index,
    to: index === classes - 1 ? domain.max : domain.min + step * (index + 1),
  }))
}

export function rowsForSelection(data: CountsFile, selection: Selection): CsvRow[] {
  const regions =
    selection.region == null ? data.regions : data.regions.filter((region) => region.code === selection.region)
  const years = selection.year === 'all' ? data.years : [selection.year]
  const rows: CsvRow[] = []
  for (const region of regions) {
    for (const year of years) {
      const cell = cellAt(region, year)
      const count = cell.status === 'absent' || cell.status === 'outside_scope' ? null : cell.count
      rows.push({
        region_code: region.code,
        region_name: region.name,
        year,
        count,
        status: cell.status,
      })
    }
  }
  return rows
}

export function compareViewRows(
  left: { code: number; count: number | null },
  right: { code: number; count: number | null },
): number {
  const leftMissing = left.count == null
  const rightMissing = right.count == null
  if (leftMissing !== rightMissing) return leftMissing ? 1 : -1
  if (!leftMissing && !rightMissing && left.count !== right.count) return (right.count ?? 0) - (left.count ?? 0)
  return left.code - right.code
}

export function publishedTotal(data: CountsFile): number {
  return annualValues(data.regions, data.years).reduce((sum, value) => sum + value, 0)
}
