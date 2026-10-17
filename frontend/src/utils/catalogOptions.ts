export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort()
}

export function typeAndRegionOptions(source: { type: string; region: string }[]): {
  types: string[]
  regions: string[]
} {
  return {
    types: uniqueSorted(source.map((item) => item.type)),
    regions: uniqueSorted(source.map((item) => item.region)),
  }
}
