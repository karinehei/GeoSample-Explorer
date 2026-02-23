export interface Observation {
  id: number;
  name: string;
  type: string;
  region: string;
  latitude: number;
  longitude: number;
  description?: string;
  observedAt: string;
}

export interface ObservationFormData {
  name: string;
  type: string;
  region: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  description: string;
}
