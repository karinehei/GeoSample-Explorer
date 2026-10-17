import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { FULL_EXPORT_FILENAME, formatCsvCount, toCsv } from './csv'
import {
  ANNUAL_SCALE_TITLE,
  BOUNDARY_NOTE,
  FIVE_YEAR_SCALE_TITLE,
  STATUS_LABEL,
  annualValues,
  cellAt,
  classIndex,
  compareViewRows,
  domainOf,
  fiveYearValues,
  publishedTotal,
  rowsForSelection,
  totalFor,
  type Cell,
  type CountsFile,
  type RegionRecord,
} from './model'
import { normalizeSelection, publicAssetUrl, serializeSelection, worklifePageUrl } from './urlState'

const counts = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../public/worklife/counts.json'), 'utf8'),
) as CountsFile

function region(code: number, cells: Record<string, Cell>, name = `Region ${code}`): RegionRecord {
  return { code, name, nameSource: 'codebook', geometryName: name, cells }
}

function published(count: number): Cell {
  return { status: 'published', count }
}

describe('committed counts', () => {
  it('pins the archive and contains only case counts', () => {
    expect(counts.provenance.bytes).toBe(292234)
    expect(counts.provenance.sha256).toBe('ad2261e1bcc95b68d852e96e7718b740ee5bbcb3a15c70d6e6d5fd80ece5713f')
    expect(counts.provenance.sourceFile).toBe('data_2019_2023/data_C_2019_2023.tsv')
    expect(publishedTotal(counts)).toBe(6669)
    expect(JSON.stringify(counts)).not.toMatch(/rate|employment|tyolliset|per_1000/i)
  })

  it('matches the checked region-year fixtures', () => {
    const uusimaa = counts.regions.find((item) => item.code === 1)
    const kainuu = counts.regions.find((item) => item.code === 18)
    const aland = counts.regions.find((item) => item.code === 21)
    expect(uusimaa && totalFor(uusimaa, counts.years)).toMatchObject({ status: 'published', count: 1691 })
    expect(kainuu?.name).toBe('Kainuu (ml. Vaala)')
    expect(kainuu?.geometryName).toBe('Kainuu')
    expect(kainuu && cellAt(kainuu, 2019)).toEqual({ status: 'published', count: 18 })
    expect(aland?.name).toBe('Ahvenanmaa')
    expect(aland?.nameSource).toBe('geometry')
    expect(counts.years.map((year) => aland && cellAt(aland, year).status)).toEqual([
      'outside_scope',
      'outside_scope',
      'outside_scope',
      'outside_scope',
      'outside_scope',
    ])
    expect(counts.regions.flatMap((item) => counts.years.map((year) => cellAt(item, year).status))).not.toContain(
      'confirmed_zero',
    )
    expect(counts.regions.flatMap((item) => counts.years.map((year) => cellAt(item, year).status))).not.toContain(
      'absent',
    )
    expect(counts.regions.map((item) => item.code)).not.toContain(3)
    expect(counts.regions.map((item) => item.code)).not.toContain(20)
    const annual = annualValues(counts.regions, counts.years)
    expect(Math.min(...annual)).toBe(8)
    expect(Math.max(...annual)).toBe(583)
    expect(annual).toHaveLength(90)
  })
})

describe('totals on labelled fixtures', () => {
  const years = [2019, 2020]

  it('adds published years and keeps an explicit zero distinct from a gap', () => {
    const complete = region(1, { 2019: published(4), 2020: published(6) })
    const zero = region(2, {
      2019: { status: 'confirmed_zero', count: 0 },
      2020: { status: 'confirmed_zero', count: 0 },
    })
    const gap = region(3, { 2019: published(4), 2020: { status: 'absent', count: null } })
    const excluded = region(21, {
      2019: { status: 'outside_scope', count: null },
      2020: { status: 'outside_scope', count: null },
    }, 'Ahvenanmaa')
    const missing = region(4, {
      2019: { status: 'absent', count: null },
      2020: { status: 'absent', count: null },
    })

    expect(totalFor(complete, years)).toMatchObject({ status: 'published', count: 10, gapYears: [] })
    expect(totalFor(zero, years)).toMatchObject({ status: 'confirmed_zero', count: 0 })
    expect(totalFor(gap, years)).toMatchObject({
      status: 'partial',
      count: 4,
      gapYears: [{ year: 2020, status: 'absent' }],
    })
    expect(totalFor(excluded, years)).toMatchObject({ status: 'outside_scope', count: null })
    expect(totalFor(missing, years)).toMatchObject({ status: 'absent', count: null })
  })
})

describe('colour scales', () => {
  it('uses one annual domain and ignores nulls', () => {
    const rows = [
      region(1, { 2019: published(10), 2020: published(10) }),
      region(2, { 2019: published(10), 2020: published(100) }),
      region(21, {
        2019: { status: 'outside_scope', count: null },
        2020: { status: 'outside_scope', count: null },
      }),
    ]
    const domain = domainOf(annualValues(rows, [2019, 2020]))
    expect(domain).toEqual({ min: 10, max: 100 })
    expect(classIndex(10, domain!)).toBe(0)
    expect(classIndex(100, domain!)).toBe(4)
    const only2019 = domainOf(annualValues(rows, [2019]))
    expect(only2019).toEqual({ min: 10, max: 10 })
    expect(classIndex(10, domain!)).not.toBe(classIndex(100, domain!))
    expect(classIndex(10, only2019!)).toBe(classIndex(100, only2019!))
  })

  it('builds the five-year scale from complete sums', () => {
    const rows = [
      region(1, { 2019: published(10), 2020: published(10) }),
      region(2, { 2019: published(10), 2020: published(100) }),
      region(21, {
        2019: { status: 'outside_scope', count: null },
        2020: { status: 'outside_scope', count: null },
      }),
    ]
    expect(fiveYearValues(rows, [2019, 2020])).toEqual([20, 110])
    expect(domainOf(fiveYearValues(rows, [2019, 2020]))).toEqual({ min: 20, max: 110 })
    expect(domainOf([10, null, 30])).toEqual({ min: 10, max: 30 })
  })

  it('names the two scales', () => {
    expect(ANNUAL_SCALE_TITLE).toBe('Vuoden julkaistut tapaukset')
    expect(FIVE_YEAR_SCALE_TITLE).toBe('Julkaistujen tapausten summa 2019–2023')
    expect(BOUNDARY_NOTE).toContain('ei ole varmennettu')
  })
})

describe('csv', () => {
  it('exports the active selection and writes null counts as empty fields', () => {
    const selected = rowsForSelection(counts, { year: 2021, region: null })
    expect(selected).toHaveLength(19)
    const aland = selected.find((row) => row.region_code === 21)
    expect(aland).toMatchObject({ year: 2021, count: null, status: 'outside_scope' })
    expect(formatCsvCount('outside_scope', null)).toBe('')
    expect(formatCsvCount('absent', null)).toBe('')
    expect(formatCsvCount('confirmed_zero', 0)).toBe('0')
    const csv = toCsv(selected)
    expect(csv.split('\n')[0]).toBe('region_code,region_name,year,count,status')
    expect(csv).toContain(',,outside_scope')
    expect(csv).not.toContain('rate')
    expect(csv).not.toMatch(/,0,outside_scope/)

    const oneRegion = rowsForSelection(counts, { year: 'all', region: 15 })
    expect(oneRegion.map((row) => row.year)).toEqual([2019, 2020, 2021, 2022, 2023])
    expect(oneRegion.every((row) => row.region_name === 'Pohjanmaa')).toBe(true)

    const full = rowsForSelection(counts, { year: 'all', region: null })
    expect(full).toHaveLength(95)
    expect(FULL_EXPORT_FILENAME).toContain('koko-aineisto')
  })

  it('sorts numeric rows before unpublished and excluded rows', () => {
    const rows = [
      { code: 21, count: null },
      { code: 8, count: 8 },
      { code: 1, count: 141 },
    ]
    expect([...rows].sort(compareViewRows).map((row) => row.code)).toEqual([1, 8, 21])
  })
})

describe('url and asset base', () => {
  const codes = counts.regions.map((item) => item.code)

  it('normalises the query without creating unknown regions', () => {
    expect(normalizeSelection({ year: '2021', region: '15' }, codes)).toEqual({ year: 2021, region: 15 })
    expect(normalizeSelection({ year: '2018', region: '3' }, codes)).toEqual({ year: 'all', region: null })
    expect(normalizeSelection({ year: '', region: '' }, codes)).toEqual({ year: 'all', region: null })
    expect(serializeSelection({ year: 2021, region: 15 })).toBe('year=2021&region=15')
    expect(worklifePageUrl('/GeoSample-Explorer/', { year: 2021, region: 15 })).toBe(
      '/GeoSample-Explorer/worklife-regions.html?year=2021&region=15',
    )
  })

  it('prefixes public files with the configured base', () => {
    expect(publicAssetUrl('/GeoSample-Explorer/', 'worklife/counts.json')).toBe(
      '/GeoSample-Explorer/worklife/counts.json',
    )
    expect(publicAssetUrl('/GeoSample-Explorer/', '/worklife/regions.geojson')).toBe(
      '/GeoSample-Explorer/worklife/regions.geojson',
    )
    expect(STATUS_LABEL.absent).toBe('Ei julkaistussa otteessa')
    expect(STATUS_LABEL.outside_scope).toBe('Aineiston ulkopuolella – Ahvenanmaa poistettu')
  })
})
