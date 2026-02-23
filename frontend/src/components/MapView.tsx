import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Observation } from '../types/observation';

const defaultCenter: [number, number] = [51.0, 10.0];
const defaultZoom = 5;

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapCenterControllerProps {
  observation?: Observation | null;
}

function MapCenterController({ observation }: MapCenterControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (observation) {
      map.flyTo([observation.latitude, observation.longitude], 12);
    }
  }, [map, observation?.id]);

  return null;
}

interface MapViewProps {
  observations: Observation[];
  selectedObservation?: Observation | null;
  onSelect?: (id: number) => void;
}

export function MapView({ observations, selectedObservation, onSelect }: MapViewProps) {
  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapCenterController observation={selectedObservation} />
      {observations.map((obs) => (
        <Marker
          key={obs.id}
          position={[obs.latitude, obs.longitude]}
          icon={icon}
          eventHandlers={{
            click: () => onSelect?.(obs.id),
          }}
        >
          <Popup>
            <strong>{obs.name}</strong>
            <br />
            {obs.type} · {obs.region}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
