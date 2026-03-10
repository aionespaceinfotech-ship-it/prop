import { PROPERTY_TYPES } from '../constants/realEstate.ts';

const LEGACY_PROPERTY_TYPE_MAP: Record<string, (typeof PROPERTY_TYPES)[number]> = {
  Apartment: 'Flat',
  'Apartment / Flat': 'Flat',
  Commercial: 'Shop',
  'Commercial Space': 'Shop',
  'Commercial Shop': 'Shop',
  'Office Space': 'Office',
};

export function normalizeLegacyPropertyType(value?: string) {
  if (!value) return undefined;
  return LEGACY_PROPERTY_TYPE_MAP[value] || value;
}

export function normalizePreferredLocations(
  preferred_locations?: string[],
  preferred_location?: string
) {
  if (preferred_locations && preferred_locations.length > 0) {
    return JSON.stringify(preferred_locations.map((item) => item.trim()).filter(Boolean));
  }
  if (preferred_location && preferred_location.trim()) {
    return JSON.stringify(
      preferred_location
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }
  return JSON.stringify([]);
}
