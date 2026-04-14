/**
 * Central API Endpoints Dictionary
 * Prevents magic strings inside service files.
 */
export const ENDPOINTS = {

  // Examples for the existing domains:
  VESSEL: {
    BASE: '/vessels',
    DETAIL: (id: string | number) => `/vessels/${id}`,
  },
  VEHICLE: {
    BASE: '/vehicles',
    GATE_ENTRY: '/vehicles/gate-entry',
  },
} as const;
