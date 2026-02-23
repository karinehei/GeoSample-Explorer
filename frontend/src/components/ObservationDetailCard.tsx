import type { Observation } from '../types/observation';
import { formatDateTime } from '../utils/format';
import { commonStyles } from '../styles/common';

interface ObservationDetailCardProps {
  observation: Observation | null;
  onClose: () => void;
  onEdit: (obs: Observation) => void;
  onDelete: (obs: Observation) => void;
}

export function ObservationDetailCard({
  observation,
  onClose,
  onEdit,
  onDelete,
}: ObservationDetailCardProps) {
  if (!observation) {
    return (
      <div
        style={{
          padding: 20,
          background: '#f9f9f9',
          borderTop: '1px solid #eee',
          color: '#666',
          fontSize: 14,
        }}
      >
        Select an observation from the list or map to view details.
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${observation.name}"? This cannot be undone.`)) {
      onDelete(observation);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: '#fff',
        borderTop: '1px solid #ddd',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{observation.name}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => onEdit(observation)} style={commonStyles.button}>
            Edit
          </button>
          <button type="button" onClick={handleDelete} style={{ ...commonStyles.button, color: 'var(--color-error)' }}>
            Delete
          </button>
          <button type="button" onClick={onClose} style={commonStyles.button}>
            Close
          </button>
        </div>
      </div>
      <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', fontSize: 14 }}>
        <dt style={{ color: '#666', fontWeight: 500 }}>Type</dt>
        <dd style={{ margin: 0 }}>{observation.type}</dd>
        <dt style={{ color: '#666', fontWeight: 500 }}>Region</dt>
        <dd style={{ margin: 0 }}>{observation.region}</dd>
        <dt style={{ color: '#666', fontWeight: 500 }}>Coordinates</dt>
        <dd style={{ margin: 0 }}>
          {observation.latitude.toFixed(5)}, {observation.longitude.toFixed(5)}
        </dd>
        <dt style={{ color: '#666', fontWeight: 500 }}>Observed</dt>
        <dd style={{ margin: 0 }}>{formatDateTime(observation.observedAt)}</dd>
        {observation.description && (
          <>
            <dt style={{ color: '#666', fontWeight: 500 }}>Description</dt>
            <dd style={{ margin: 0 }}>{observation.description}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

