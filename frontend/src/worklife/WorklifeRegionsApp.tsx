import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnnualChart } from './AnnualChart'
import { FULL_EXPORT_FILENAME, selectionFilename, toCsv } from './csv'
import {
  ANNUAL_SCALE_TITLE,
  BOUNDARY_NOTE,
  FIVE_YEAR_SCALE_TITLE,
  STATUS_LABEL,
  annualValues,
  classBreaks,
  colorForValue,
  compareViewRows,
  describeCount,
  domainOf,
  fiveYearValues,
  rowsForSelection,
  totalFor,
  viewValue,
  type CountsFile,
  type Selection,
  type ViewValue,
} from './model'
import { publicAssetUrl, normalizeSelection, parseWorklifeSearch, serializeSelection, worklifePageUrl } from './urlState'
import { WorklifeMap } from './WorklifeMap'
import './worklife.css'

interface RegionFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: { ID: number; REGIONNAME: string }
    geometry: { type: string; coordinates: unknown }
  }>
}

function download(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function canonicalUrl(selection: Selection): string {
  return worklifePageUrl(import.meta.env.BASE_URL, selection)
}

export function WorklifeRegionsApp() {
  const [counts, setCounts] = useState<CountsFile | null>(null)
  const [geo, setGeo] = useState<RegionFeatureCollection | null>(null)
  const [selection, setSelection] = useState<Selection>({ year: 'all', region: null })
  const [error, setError] = useState<string | null>(null)

  const codes = useMemo(() => counts?.regions.map((region) => region.code) ?? [], [counts])

  const readSelection = useCallback(
    (validCodes: readonly number[]) => normalizeSelection(parseWorklifeSearch(window.location.search), validCodes),
    [],
  )

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    let cancelled = false
    async function load() {
      try {
        const [countsResponse, geoResponse] = await Promise.all([
          fetch(publicAssetUrl(base, 'worklife/counts.json')),
          fetch(publicAssetUrl(base, 'worklife/regions.geojson')),
        ])
        if (!countsResponse.ok || !geoResponse.ok) {
          throw new Error('Aluelukumäärien lataus epäonnistui.')
        }
        const nextCounts = (await countsResponse.json()) as CountsFile
        const nextGeo = (await geoResponse.json()) as RegionFeatureCollection
        if (cancelled) return
        const ids = new Set(nextGeo.features.map((feature) => feature.properties.ID))
        const missing = nextCounts.regions.filter((region) => !ids.has(region.code)).map((region) => region.code)
        if (missing.length > 0) {
          throw new Error(`Aluerajoista puuttuu koodi ${missing.join(', ')}.`)
        }
        const nextSelection = normalizeSelection(
          parseWorklifeSearch(window.location.search),
          nextCounts.regions.map((region) => region.code),
        )
        setCounts(nextCounts)
        setGeo(nextGeo)
        setSelection(nextSelection)
        const current = window.location.search.replace(/^\?/, '')
        if (current !== serializeSelection(nextSelection)) {
          window.history.replaceState(nextSelection, '', canonicalUrl(nextSelection))
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Aluelukumäärien lataus epäonnistui.')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onPop = () => {
      const next = readSelection(codes)
      setSelection(next)
      const current = window.location.search.replace(/^\?/, '')
      if (codes.length > 0 && current !== serializeSelection(next)) {
        window.history.replaceState(next, '', canonicalUrl(next))
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [codes, readSelection])

  const commit = useCallback((next: Selection) => {
    setSelection(next)
    const url = canonicalUrl(next)
    const current = `${window.location.pathname}${window.location.search}`
    if (current !== url) window.history.pushState(next, '', url)
  }, [])

  const annualDomain = useMemo(
    () => (counts ? domainOf(annualValues(counts.regions, counts.years)) : null),
    [counts],
  )
  const fiveYearDomain = useMemo(
    () => (counts ? domainOf(fiveYearValues(counts.regions, counts.years)) : null),
    [counts],
  )
  const activeDomain = selection.year === 'all' ? fiveYearDomain : annualDomain
  const scaleTitle = selection.year === 'all' ? FIVE_YEAR_SCALE_TITLE : ANNUAL_SCALE_TITLE

  const selectedRegion = counts?.regions.find((region) => region.code === selection.region) ?? null

  const tableRows = useMemo(() => {
    if (!counts) return []
    return counts.regions
      .map((region) => {
        const value = viewValue(region, selection.year, counts.years)
        return { region, ...value }
      })
      .sort((left, right) => compareViewRows(
        { code: left.region.code, count: left.count },
        { code: right.region.code, count: right.count },
      ))
  }, [counts, selection.year])

  function viewFor(code: number): ViewValue | null {
    const region = counts?.regions.find((item) => item.code === code)
    if (!region || !counts) return null
    return viewValue(region, selection.year, counts.years)
  }

  if (error) {
    return (
      <main className="worklife-page">
        <p role="alert">{error}</p>
      </main>
    )
  }

  if (!counts || !geo) {
    return (
      <main className="worklife-page">
        <p>Ladataan aluelukumääriä…</p>
      </main>
    )
  }

  const breaks = activeDomain ? classBreaks(activeDomain) : []

  return (
    <div className="worklife-page">
      <header className="worklife-header">
        <h1>Säilytetyt vahvistetut ammattitautitapaukset maakunnittain, 2019–2023</h1>
        <p>
          Luvut ovat julkaistun otteen säilytettyjä tapauksia. Yksikkö on tapaus, ei väestöön suhteutettu luku.
        </p>
        <nav>
          <a href="https://github.com/karinehei/GeoSample-Explorer#installation--run">
            Havaintoesimerkki paikallisesti (README)
          </a>
        </nav>
      </header>
      <div className="worklife-body">
        <aside className="worklife-side">
          <div className="worklife-controls">
            <label>
              Vuosi
              <select
                aria-label="Vuosi"
                value={String(selection.year)}
                onChange={(event) => {
                  const value = event.target.value
                  commit({ ...selection, year: value === 'all' ? 'all' : Number(value) })
                }}
              >
                <option value="all">Kaikki vuodet 2019–2023</option>
                {counts.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Maakunta
              <select
                aria-label="Maakunta"
                value={selection.region == null ? '' : String(selection.region)}
                onChange={(event) => {
                  const value = event.target.value
                  commit({ ...selection, region: value === '' ? null : Number(value) })
                }}
              >
                <option value="">Kaikki maakunnat</option>
                {counts.regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.code} {region.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="worklife-legend">
            <p className="worklife-legend-title">{scaleTitle}</p>
            {breaks.map((item) => (
              <span key={item.index} className="worklife-swatch">
                <i style={{ background: colorForValue(item.from === item.to ? item.from : (item.from + item.to) / 2, activeDomain!) }} />
                <span>
                  {Math.round(item.from)}–{Math.round(item.to)}
                </span>
              </span>
            ))}
            <span className="worklife-swatch">
              <i style={{ background: '#cfcfcf' }} />
              <span>{STATUS_LABEL.outside_scope}</span>
            </span>
            <span className="worklife-swatch">
              <i style={{ background: '#f8f8f8' }} />
              <span>{STATUS_LABEL.absent}</span>
            </span>
          </div>

          <table className="worklife-table">
            <caption>
              {selection.year === 'all' ? FIVE_YEAR_SCALE_TITLE : `${ANNUAL_SCALE_TITLE}, ${selection.year}`}
            </caption>
            <thead>
              <tr>
                <th>Koodi</th>
                <th>Maakunta</th>
                <th>Lukumäärä</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.region.code} aria-selected={row.region.code === selection.region}>
                  <td>{row.region.code}</td>
                  <td>
                    <button type="button" onClick={() => commit({ ...selection, region: row.region.code })}>
                      {row.region.name}
                    </button>
                  </td>
                  <td>
                    {describeCount(row.status, row.count)}
                    {row.status === 'partial' && counts ? (
                      <div>
                        {totalFor(row.region, counts.years).gapYears.map((gap) => (
                          <div key={gap.year}>
                            {gap.year}: {STATUS_LABEL[gap.status]}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <AnnualChart
            region={selectedRegion}
            years={counts.years}
            domain={annualDomain}
            selectedYear={selection.year}
          />

          <div className="worklife-actions">
            <button
              type="button"
              onClick={() => download(selectionFilename(selection.year, selection.region), toCsv(rowsForSelection(counts, selection)))}
            >
              Lataa valitut tiedot
            </button>
            <button
              type="button"
              onClick={() => download(FULL_EXPORT_FILENAME, toCsv(rowsForSelection(counts, { year: 'all', region: null })))}
            >
              Lataa koko aineisto
            </button>
          </div>

          <section className="worklife-source">
            <h2>Lähde ja rajaukset</h2>
            <p>
              Työterveyslaitos, Työelämätieto: Työikäisten vahvistetut ammattitaudit, aineisto luovutettu 20.5.2026.
              Tiedosto occupational-diseases-data-20052026.zip, tiedosto data_C_2019_2023.tsv. Lisenssi CC BY 4.0.
              Säilytettyjä tapauksia tässä tiedostossa on 6 669. Luku ei ole Työperäisten sairauksien rekisterin
              vuosijulkaisun koko maan kokonaismäärä.
            </p>
            <p>
              Jokainen tiedoston rivi on yksi säilytetty vahvistettu tapaus, jolla on maakunta ja taudin
              vahvistumisvuosi. Alle viiden tapauksen otokset on poistettu. Puuttuva maakunta–vuosi ei ole
              vahvistettu nolla. Tiedostossa ei ole ammattia, diagnoosia, sukupuolta eikä ikää, eikä sitä ole
              yhdistetty tiedostoihin A tai B.
            </p>
            <p>
              Kartta ja taulukko näyttävät säilytettyjen tapausten lukumäärän. Ne eivät mittaa sairastumisriskiä
              eivätkä ilmaantuvuutta, eikä lukumääriä ole jaettu väestöllä tai työllisillä.
            </p>
            <p>
              Ahvenanmaa on aineiston ulkopuolella: julkaisija on poistanut Ahvenanmaan tiedot. Sen lukumäärä ei ole 0.
            </p>
            <p>
              Koodin 18 nimi lähdeaineiston luokituksessa on “Kainuu (ml. Vaala)”. Mukana toimitetun aluejaon nimi on
              “Kainuu”. Tilastokeskuksen maakuntaluokitus siirsi Vaalan Kainuusta (18) Pohjois-Pohjanmaalle (17)
              1.1.2016. Tiedostossa C ei ole kuntakoodia, joten tapauksia ei voi siirtää maakunnasta toiseen.
              Aluejakoon ei ole tehty muutoksia pistetarkistusten perusteella.
            </p>
            <p>
              Aluejako on paketin tiedosto finRegionsGeo.geojson, lisenssi MIT. Copyright (c) 2017 Lucify.
              Copyright (c) 2018 FIOH. Lähteet: Lucified Finland municipalities topojson (Ahvenanmaa) ja
              deldersveld/topojson finland-regions.json (muut maakunnat).
            </p>
            <p>
              <a href="https://karinehei.github.io/phds-data-pipeline-as-code/worklife/report.html">
                Ammattiluokittainen tarkastelu samalta ajanjaksolta
              </a>
            </p>
          </section>
        </aside>
        <section className="worklife-map-wrap" aria-label="Kartta">
          <div className="worklife-map">
            <WorklifeMap
              geo={geo}
              regions={counts.regions}
              viewFor={viewFor}
              domain={activeDomain}
              selectedCode={selection.region}
              renderKey={`${selection.year}-${selection.region ?? 'none'}-${scaleTitle}`}
              onSelect={(code) => commit({ ...selection, region: code })}
            />
          </div>
          <p className="worklife-boundary">{BOUNDARY_NOTE}</p>
        </section>
      </div>
    </div>
  )
}
