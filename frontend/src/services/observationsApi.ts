import type { Observation, ObservationFormData } from '../types/observation';

const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const API_BASE = `${base}/api/observations`;

export interface FetchObservationsParams {
  search?: string;
  type?: string;
  region?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return new ApiError(res.statusText || 'Request failed', res.status);
    }

    const obj = body as Record<string, unknown>;
    let message = (obj.title as string) || (obj.message as string) || res.statusText || 'Request failed';
    let fieldErrors: Record<string, string[]> | undefined;

    if (obj.errors && typeof obj.errors === 'object') {
      const raw = obj.errors as Record<string, string[]>;
      fieldErrors = {};
      for (const [k, v] of Object.entries(raw)) {
        const key = k.charAt(0).toLowerCase() + k.slice(1);
        fieldErrors[key] = v;
      }
      const first = Object.values(fieldErrors).flat()[0];
      if (first) message = first;
    }

    return new ApiError(message, res.status, fieldErrors);
  }
}

export async function fetchObservations(params?: FetchObservationsParams): Promise<Observation[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.region) searchParams.set('region', params.region);
  const qs = searchParams.toString();
  const url = qs ? `${API_BASE}?${qs}` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

function toRequestBody(data: ObservationFormData): Record<string, unknown> {
  return {
    name: data.name.trim(),
    type: data.type.trim(),
    region: data.region.trim(),
    latitude: data.latitude,
    longitude: data.longitude,
    observedAt: new Date(data.observedAt).toISOString(),
    description: data.description.trim() || undefined,
  };
}

export async function createObservation(data: ObservationFormData): Promise<Observation> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toRequestBody(data)),
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export async function updateObservation(id: number, data: ObservationFormData): Promise<Observation> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toRequestBody(data)),
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return res.json();
}

export async function deleteObservation(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw await ApiError.fromResponse(res);
}
