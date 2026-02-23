import type { Observation } from '../types/observation';

interface ObservationListProps {
  observations: Observation[];
  selectedId?: number;
  onSelect: (id: number) => void;
}

export function ObservationList({ observations, selectedId, onSelect }: ObservationListProps) {
  if (observations.length === 0) {
    return (
      <div style={{ padding: 24, color: '#666', textAlign: 'center' }}>
        No observations match the filters.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, overflow: 'auto', flex: 1 }}>
      {observations.map((obs) => (
        <li
          key={obs.id}
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            cursor: 'pointer',
            background: selectedId === obs.id ? '#e8f4fd' : 'transparent',
          }}
          onClick={() => onSelect(obs.id)}
        >
          <strong>{obs.name}</strong>
          <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
            {obs.type} · {obs.region}
          </span>
        </li>
      ))}
    </ul>
  );
}
