export interface FilterParams {
  search: string;
  type: string;
  region: string;
}

function getSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function readFiltersFromUrl(): FilterParams {
  const params = getSearchParams();
  return {
    search: params.get('search') ?? '',
    type: params.get('type') ?? '',
    region: params.get('region') ?? '',
  };
}

export function writeFiltersToUrl(filters: FilterParams): void {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type) params.set('type', filters.type);
  if (filters.region) params.set('region', filters.region);
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, '', url);
}
