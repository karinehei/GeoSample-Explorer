import { useEffect } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  SCALE_COLORS,
  colorForValue,
  describeCount,
  isNumericStatus,
  type Domain,
  type RegionRecord,
  type ViewValue,
} from './model'

interface RegionFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: { ID: number; REGIONNAME: string }
    geometry: { type: string; coordinates: unknown }
  }>
}

interface WorklifeMapProps {
  geo: RegionFeatureCollection
  regions: RegionRecord[]
  viewFor: (code: number) => ViewValue | null
  domain: Domain | null
  selectedCode: number | null
  renderKey: string
  onSelect: (code: number) => void
}

function FitCountry({ geo }: { geo: RegionFeatureCollection }) {
  const map = useMap()
  useEffect(() => {
    const layer = L.geoJSON(geo as unknown as GeoJSON.GeoJsonObject)
    const bounds = layer.getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] })
  }, [geo, map])
  return null
}

function styleFor(view: ViewValue | null, domain: Domain | null, selected: boolean): L.PathOptions {
  const selectedStroke = selected ? { color: '#111111', weight: 3 } : { color: '#4b5563', weight: 1 }
  if (!view || view.status === 'outside_scope') {
    return { ...selectedStroke, fillColor: '#cfcfcf', fillOpacity: 0.9, dashArray: '5 4' }
  }
  if (view.status === 'absent') {
    return { ...selectedStroke, fillColor: '#f8f8f8', fillOpacity: 0.95, dashArray: '1 3' }
  }
  if (view.status === 'confirmed_zero') {
    return { ...selectedStroke, fillColor: '#ffffff', fillOpacity: 0.95 }
  }
  if (isNumericStatus(view.status) && view.count != null && domain) {
    return {
      ...selectedStroke,
      fillColor: colorForValue(view.count, domain),
      fillOpacity: 0.85,
      dashArray: view.status === 'partial' ? '2 2' : undefined,
    }
  }
  return { ...selectedStroke, fillColor: SCALE_COLORS[0], fillOpacity: 0.5 }
}

export function WorklifeMap({ geo, regions, viewFor, domain, selectedCode, renderKey, onSelect }: WorklifeMapProps) {
  const byCode = new Map(regions.map((region) => [region.code, region]))
  return (
    <MapContainer center={[65.2, 26.5]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitCountry geo={geo} />
      <GeoJSON
        key={renderKey}
        data={geo as unknown as GeoJSON.GeoJsonObject}
        style={(feature) => {
          const code = Number(feature?.properties?.ID)
          return styleFor(viewFor(code), domain, code === selectedCode)
        }}
        onEachFeature={(feature, layer) => {
          const code = Number(feature?.properties?.ID)
          const region = byCode.get(code)
          const view = viewFor(code)
          const text = view ? describeCount(view.status, view.count) : ''
          layer.bindTooltip(`${region?.name ?? feature?.properties?.REGIONNAME ?? ''}: ${text}`)
          layer.on({ click: () => onSelect(code) })
        }}
      />
    </MapContainer>
  )
}
