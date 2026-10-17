import { describe, expect, it } from 'vitest'
import { typeAndRegionOptions } from './catalogOptions'

describe('typeAndRegionOptions', () => {
  const catalog = [
    { type: 'Soil', region: 'North' },
    { type: 'Water', region: 'South' },
    { type: 'Soil', region: 'North' },
    { type: 'Rock', region: 'West' },
  ]

  it('keeps every type and region from the unfiltered catalog', () => {
    const filtered = catalog.filter((item) => item.type === 'Soil')
    expect(typeAndRegionOptions(filtered)).toEqual({ types: ['Soil'], regions: ['North'] })
    expect(typeAndRegionOptions(catalog)).toEqual({
      types: ['Rock', 'Soil', 'Water'],
      regions: ['North', 'South', 'West'],
    })
  })

  it('still lists the catalog when the filtered result is empty', () => {
    const filtered: { type: string; region: string }[] = []
    expect(typeAndRegionOptions(filtered)).toEqual({ types: [], regions: [] })
    expect(typeAndRegionOptions(catalog).types).toContain('Water')
    expect(typeAndRegionOptions(catalog).regions).toContain('South')
  })
})
