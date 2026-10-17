import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from './components/AppLayout';
import { FiltersPanel } from './components/FiltersPanel';
import { ObservationList } from './components/ObservationList';
import { MapView } from './components/MapView';
import { ObservationDetailCard } from './components/ObservationDetailCard';
import { ObservationForm } from './components/ObservationForm';
import {
  fetchObservations,
  createObservation,
  updateObservation,
  deleteObservation,
  ApiError,
} from './services/observationsApi';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { readFiltersFromUrl, writeFiltersToUrl } from './utils/urlFilters';
import { typeAndRegionOptions } from './utils/catalogOptions';
import type { Observation, ObservationFormData } from './types/observation';

const DEBOUNCE_MS = 400;

import { commonStyles } from './styles/common';

type FormMode = null | 'create' | 'edit';

export default function App() {
  const [filters, setFilters] = useState(() => readFiltersFromUrl());
  const debouncedSearch = useDebouncedValue(filters.search, DEBOUNCE_MS);

  const [observations, setObservations] = useState<Observation[]>([]);
  const [catalog, setCatalog] = useState<Observation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [backendFieldErrors, setBackendFieldErrors] = useState<Record<string, string[]>>({});

  const loadCatalog = useCallback(async () => {
    try {
      const data = await fetchObservations();
      setCatalog(data);
      setApiUnavailable(false);
    } catch (e) {
      setApiUnavailable(true);
      setError(e instanceof Error ? e.message : 'Failed to load filter options');
    }
  }, []);

  const loadObservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchObservations({
        search: debouncedSearch || undefined,
        type: filters.type || undefined,
        region: filters.region || undefined,
      });
      setObservations(data);
      setApiUnavailable(false);
    } catch (e) {
      setApiUnavailable(true);
      setError(e instanceof Error ? e.message : 'Failed to load observations');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.type, filters.region]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  useEffect(() => {
    writeFiltersToUrl(filters);
  }, [filters]);

  useEffect(() => {
    if (selectedId !== null && !observations.some((o) => o.id === selectedId)) {
      setSelectedId(null);
    }
  }, [observations, selectedId]);

  const { types: typeOptions, regions: regionOptions } = typeAndRegionOptions(catalog);

  const handleFilterChange = useCallback(
    (updates: Partial<typeof filters>) => {
      setFilters((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setFilters({ search: '', type: '', region: '' });
  }, []);

  const handleSelect = useCallback((id: number) => setSelectedId(id), []);
  const handleDeselect = useCallback(() => setSelectedId(null), []);

  const handleAddClick = useCallback(() => {
    setFormMode('create');
    setEditingObservation(null);
    setFormError(null);
    setBackendFieldErrors({});
  }, []);

  const handleEditClick = useCallback((obs: Observation) => {
    setFormMode('edit');
    setEditingObservation(obs);
    setFormError(null);
    setBackendFieldErrors({});
  }, []);

  const handleFormCancel = useCallback(() => {
    setFormMode(null);
    setEditingObservation(null);
    setFormError(null);
    setBackendFieldErrors({});
  }, []);

  const handleFormSubmit = useCallback(
    async (data: ObservationFormData) => {
      setFormError(null);
      setBackendFieldErrors({});

      try {
        if (formMode === 'edit' && editingObservation) {
          const updated = await updateObservation(editingObservation.id, data);
          setFormMode(null);
          setEditingObservation(null);
          setSelectedId(updated.id);
          await loadCatalog();
          await loadObservations();
        } else {
          const created = await createObservation(data);
          setFormMode(null);
          setEditingObservation(null);
          setSelectedId(created.id);
          await loadCatalog();
          await loadObservations();
        }
      } catch (e) {
        if (e instanceof ApiError) {
          setFormError(e.message);
          if (e.fieldErrors) setBackendFieldErrors(e.fieldErrors);
        } else {
          setFormError(e instanceof Error ? e.message : 'An error occurred');
        }
        throw e;
      }
    },
    [formMode, editingObservation, loadCatalog, loadObservations]
  );

  const handleDelete = useCallback(
    async (obs: Observation) => {
      try {
        await deleteObservation(obs.id);
        if (selectedId === obs.id) setSelectedId(null);
        await loadCatalog();
        await loadObservations();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete observation');
      }
    },
    [selectedId, loadCatalog, loadObservations]
  );

  const selectedObservation = observations.find((o) => o.id === selectedId) ?? null;

  const mapView = (
    <div style={{ flex: 1, minHeight: 400, minWidth: 0 }}>
      <MapView
        observations={observations}
        selectedObservation={selectedObservation}
        onSelect={handleSelect}
      />
    </div>
  );

  const rightPanelContent =
    formMode !== null ? (
      <>
        {mapView}
        {formError && (
          <div style={{ ...commonStyles.errorBanner, margin: '0 20px' }} role="alert">
            {formError}
          </div>
        )}
        <ObservationForm
          observation={formMode === 'edit' ? editingObservation : null}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          backendErrors={backendFieldErrors}
        />
      </>
    ) : (
      <>
        {mapView}
        <ObservationDetailCard
          observation={selectedObservation}
          onClose={handleDeselect}
          onEdit={handleEditClick}
          onDelete={handleDelete}
        />
      </>
    );

  return (
    <AppLayout
      header={
        <>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>GeoSample Explorer</h1>
          <p style={{ margin: '8px 0 0' }}>
            <a href={`${import.meta.env.BASE_URL}worklife-regions.html`}>Ammattitaudit maakunnittain 2019–2023</a>
          </p>
          {error && (
            <div style={{ ...commonStyles.errorBanner, marginTop: 8, padding: 8 }} role="alert">
              {error}
              {apiUnavailable && (
                <p style={{ margin: '8px 0 0' }}>
                  This observation example needs the local API described in the{' '}
                  <a href="https://github.com/karinehei/GeoSample-Explorer#installation--run">README</a>.
                  The hosted regional counts page does not use it.
                </p>
              )}
            </div>
          )}
        </>
      }
      leftPanel={
        <>
          <FiltersPanel
            search={filters.search}
            type={filters.type}
            region={filters.region}
            typeOptions={typeOptions}
            regionOptions={regionOptions}
            onSearchChange={(v) => handleFilterChange({ search: v })}
            onTypeChange={(v) => handleFilterChange({ type: v })}
            onRegionChange={(v) => handleFilterChange({ region: v })}
            onReset={handleReset}
            onAddClick={handleAddClick}
          />
          <div style={{ padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid #eee' }}>
            Observations
          </div>
          {loading ? (
            <div style={{ padding: 24, color: '#666', textAlign: 'center' }}>Loading...</div>
          ) : (
            <ObservationList
              observations={observations}
              selectedId={selectedId ?? undefined}
              onSelect={handleSelect}
            />
          )}
        </>
      }
      mapPanel={rightPanelContent}
    />
  );
}
