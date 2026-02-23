import type { ObservationFormData } from '../types/observation';

export interface ValidationErrors {
  name?: string;
  type?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  observedAt?: string;
  description?: string;
}

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

export function validateObservationForm(data: ObservationFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length > 120) {
    errors.name = 'Name must be 120 characters or less';
  }

  if (!data.type.trim()) {
    errors.type = 'Type is required';
  } else if (data.type.length > 80) {
    errors.type = 'Type must be 80 characters or less';
  }

  if (data.region.length > 120) {
    errors.region = 'Region must be 120 characters or less';
  }

  if (Number.isNaN(data.latitude) || data.latitude < LAT_MIN || data.latitude > LAT_MAX) {
    errors.latitude = `Latitude must be between ${LAT_MIN} and ${LAT_MAX}`;
  }

  if (Number.isNaN(data.longitude) || data.longitude < LON_MIN || data.longitude > LON_MAX) {
    errors.longitude = `Longitude must be between ${LON_MIN} and ${LON_MAX}`;
  }

  if (!data.observedAt) {
    errors.observedAt = 'Observed date is required';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or less';
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
