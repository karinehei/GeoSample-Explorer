import { useState, useEffect } from 'react';
import type { Observation, ObservationFormData } from '../types/observation';
import type { ValidationErrors } from '../utils/validation';
import { validateObservationForm, hasValidationErrors } from '../utils/validation';
import { commonStyles } from '../styles/common';

const emptyForm: ObservationFormData = {
  name: '',
  type: '',
  region: '',
  latitude: 0,
  longitude: 0,
  observedAt: new Date().toISOString().slice(0, 16),
  description: '',
};

interface ObservationFormProps {
  observation?: Observation | null;
  onSubmit: (data: ObservationFormData) => Promise<void>;
  onCancel: () => void;
  backendErrors?: Record<string, string[]>;
}

export function ObservationForm({
  observation,
  onSubmit,
  onCancel,
  backendErrors = {},
}: ObservationFormProps) {
  const [form, setForm] = useState<ObservationFormData>(emptyForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (observation) {
      const d = new Date(observation.observedAt);
      const observedAt =
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` +
        `T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      setForm({
        name: observation.name,
        type: observation.type,
        region: observation.region,
        latitude: observation.latitude,
        longitude: observation.longitude,
        observedAt,
        description: observation.description ?? '',
      });
    } else {
      setForm({
        ...emptyForm,
        observedAt: new Date().toISOString().slice(0, 16),
      });
    }
    setErrors({});
  }, [observation]);

  const getFieldError = (field: keyof ValidationErrors): string | undefined => {
    return errors[field] ?? backendErrors[field]?.[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateObservationForm(form);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = !!observation;

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 20,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          {isEdit ? 'Edit Observation' : 'Add Observation'}
        </h3>
        <button type="button" onClick={onCancel} style={commonStyles.button}>
          Cancel
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="obs-name" style={commonStyles.label}>Name *</label>
          <input
            id="obs-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={{ ...commonStyles.input, ...(getFieldError('name') ? commonStyles.inputError : {}) }}
            placeholder="Observation name"
            disabled={submitting}
            aria-invalid={!!getFieldError('name')}
            aria-describedby={getFieldError('name') ? 'obs-name-error' : undefined}
          />
          {getFieldError('name') && <div id="obs-name-error" style={commonStyles.errorText} role="alert">{getFieldError('name')}</div>}
        </div>

        <div>
          <label htmlFor="obs-type" style={commonStyles.label}>Type *</label>
          <input
            id="obs-type"
            type="text"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            style={{ ...commonStyles.input, ...(getFieldError('type') ? commonStyles.inputError : {}) }}
            placeholder="e.g. Soil, Water, Rock"
            disabled={submitting}
            aria-invalid={!!getFieldError('type')}
            aria-describedby={getFieldError('type') ? 'obs-type-error' : undefined}
          />
          {getFieldError('type') && <div id="obs-type-error" style={commonStyles.errorText} role="alert">{getFieldError('type')}</div>}
        </div>

        <div>
          <label htmlFor="obs-region" style={commonStyles.label}>Region</label>
          <input
            id="obs-region"
            type="text"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            style={{ ...commonStyles.input, ...(getFieldError('region') ? commonStyles.inputError : {}) }}
            placeholder="Region name"
            disabled={submitting}
            aria-invalid={!!getFieldError('region')}
            aria-describedby={getFieldError('region') ? 'obs-region-error' : undefined}
          />
          {getFieldError('region') && <div id="obs-region-error" style={commonStyles.errorText} role="alert">{getFieldError('region')}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label htmlFor="obs-lat" style={commonStyles.label}>Latitude *</label>
            <input
              id="obs-lat"
              type="number"
              step="any"
              value={form.latitude || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))
              }
              style={{ ...commonStyles.input, ...(getFieldError('latitude') ? commonStyles.inputError : {}) }}
              placeholder="-90 to 90"
              disabled={submitting}
              aria-invalid={!!getFieldError('latitude')}
              aria-describedby={getFieldError('latitude') ? 'obs-lat-error' : undefined}
            />
            {getFieldError('latitude') && (
              <div id="obs-lat-error" style={commonStyles.errorText} role="alert">{getFieldError('latitude')}</div>
            )}
          </div>
          <div>
            <label htmlFor="obs-lon" style={commonStyles.label}>Longitude *</label>
            <input
              id="obs-lon"
              type="number"
              step="any"
              value={form.longitude || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))
              }
              style={{ ...commonStyles.input, ...(getFieldError('longitude') ? commonStyles.inputError : {}) }}
              placeholder="-180 to 180"
              disabled={submitting}
              aria-invalid={!!getFieldError('longitude')}
              aria-describedby={getFieldError('longitude') ? 'obs-lon-error' : undefined}
            />
            {getFieldError('longitude') && (
              <div id="obs-lon-error" style={commonStyles.errorText} role="alert">{getFieldError('longitude')}</div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="obs-observed" style={commonStyles.label}>Observed at *</label>
          <input
            id="obs-observed"
            type="datetime-local"
            value={form.observedAt}
            onChange={(e) => setForm((f) => ({ ...f, observedAt: e.target.value }))}
            style={{ ...commonStyles.input, ...(getFieldError('observedAt') ? commonStyles.inputError : {}) }}
            disabled={submitting}
            aria-invalid={!!getFieldError('observedAt')}
            aria-describedby={getFieldError('observedAt') ? 'obs-observed-error' : undefined}
          />
          {getFieldError('observedAt') && (
            <div id="obs-observed-error" style={commonStyles.errorText} role="alert">{getFieldError('observedAt')}</div>
          )}
        </div>

        <div>
          <label htmlFor="obs-desc" style={commonStyles.label}>Description</label>
          <textarea
            id="obs-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{
              ...commonStyles.input,
              minHeight: 80,
              resize: 'vertical',
              ...(getFieldError('description') ? commonStyles.inputError : {}),
            }}
            placeholder="Optional description"
            rows={3}
            disabled={submitting}
            aria-invalid={!!getFieldError('description')}
            aria-describedby={getFieldError('description') ? 'obs-desc-error' : undefined}
          />
          {getFieldError('description') && (
            <div id="obs-desc-error" style={commonStyles.errorText} role="alert">{getFieldError('description')}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" disabled={submitting} style={{ ...commonStyles.button, ...commonStyles.buttonPrimary }}>
            {submitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={onCancel} style={commonStyles.button} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

