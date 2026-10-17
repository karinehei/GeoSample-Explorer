import { cellAt, describeCount, type Domain, type RegionRecord, type YearSelection } from './model'

interface AnnualChartProps {
  region: RegionRecord | null
  years: readonly number[]
  domain: Domain | null
  selectedYear: YearSelection
}

export function AnnualChart({ region, years, domain, selectedYear }: AnnualChartProps) {
  if (!region) {
    return <p className="worklife-note">Valitse maakunta, niin näet sen vuotuiset lukumäärät.</p>
  }

  const width = 360
  const height = 220
  const padLeft = 28
  const plotHeight = 120
  const slot = (width - padLeft - 12) / years.length
  const max = domain && domain.max > 0 ? domain.max : 1

  return (
    <figure className="worklife-chart">
      <figcaption>
        {region.name}, vuotuiset lukumäärät
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${region.name}, vuodet ${years.join(', ')}`}>
        {years.map((year, index) => {
          const cell = cellAt(region, year)
          const x = padLeft + index * slot
          const highlighted = selectedYear === year
          const barHeight =
            cell.status === 'published' && cell.count != null ? (cell.count / max) * plotHeight : cell.status === 'confirmed_zero' ? 0 : null
          const label = describeCount(cell.status, cell.count)
          return (
            <g key={year}>
              {barHeight != null && (
                <rect
                  x={x + 10}
                  y={24 + plotHeight - barHeight}
                  width={slot - 22}
                  height={Math.max(barHeight, cell.status === 'confirmed_zero' ? 2 : 0)}
                  fill={highlighted ? '#08306b' : '#2171b5'}
                >
                  <title>{`${year}: ${label}`}</title>
                </rect>
              )}
              {cell.status === 'published' && cell.count != null && (
                <text x={x + slot / 2} y={18 + plotHeight - barHeight!} textAnchor="middle" fontSize="11">
                  {cell.count}
                </text>
              )}
              <text x={x + slot / 2} y={plotHeight + 42} textAnchor="middle" fontSize="12" fontWeight={highlighted ? 700 : 400}>
                {year}
              </text>
              {cell.status !== 'published' && (
                <text x={x + slot / 2} y={plotHeight + 62} textAnchor="middle" fontSize="9">
                  <title>{label}</title>
                  {cell.status === 'confirmed_zero' ? '0' : '–'}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {years.some((year) => cellAt(region, year).status !== 'published') && (
        <ul className="worklife-chart-notes">
          {years.map((year) => {
            const cell = cellAt(region, year)
            if (cell.status === 'published') return null
            return (
              <li key={year}>
                {year}: {describeCount(cell.status, cell.count)}
              </li>
            )
          })}
        </ul>
      )}
    </figure>
  )
}
