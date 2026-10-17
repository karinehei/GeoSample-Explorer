import { YEARS, type Selection } from './model'

export const WORKLIFE_PAGE = 'worklife-regions.html'

export function publicAssetUrl(base: string, file: string): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${file.replace(/^\/+/, '')}`
}

export function parseWorklifeSearch(search: string): { year: string; region: string } {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return {
    year: params.get('year') ?? '',
    region: params.get('region') ?? '',
  }
}

export function normalizeSelection(
  raw: { year: string; region: string },
  validRegionCodes: readonly number[],
): Selection {
  const yearNumber = Number(raw.year)
  const year = (YEARS as readonly number[]).includes(yearNumber) ? yearNumber : 'all'
  const regionNumber = Number(raw.region)
  const region =
    raw.region !== '' && Number.isInteger(regionNumber) && validRegionCodes.includes(regionNumber)
      ? regionNumber
      : null
  return { year, region }
}

export function serializeSelection(selection: Selection): string {
  const params = new URLSearchParams()
  params.set('year', String(selection.year))
  if (selection.region != null) params.set('region', String(selection.region))
  return params.toString()
}

export function worklifePageUrl(base: string, selection: Selection): string {
  return `${publicAssetUrl(base, WORKLIFE_PAGE)}?${serializeSelection(selection)}`
}
