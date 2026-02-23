import { commonStyles } from '../styles/common';

interface FiltersPanelProps {
  search: string;
  type: string;
  region: string;
  typeOptions: string[];
  regionOptions: string[];
  onSearchChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onRegionChange: (v: string) => void;
  onReset: () => void;
  onAddClick: () => void;
}

const selectStyle = { ...commonStyles.input, minWidth: 100, cursor: 'pointer' as const };

export function FiltersPanel({
  search,
  type,
  region,
  typeOptions,
  regionOptions,
  onSearchChange,
  onTypeChange,
  onRegionChange,
  onReset,
  onAddClick,
}: FiltersPanelProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ ...commonStyles.input, width: 140 }}
          aria-label="Search observations by name"
        />
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          style={selectStyle}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {typeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          style={selectStyle}
          aria-label="Filter by region"
        >
          <option value="">All regions</option>
          {regionOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <button type="button" onClick={onReset} style={commonStyles.button}>
          Reset filters
        </button>
        <button type="button" onClick={onAddClick} style={{ ...commonStyles.button, ...commonStyles.buttonPrimary }}>
          + Add Observation
        </button>
      </div>
    </div>
  );
}
