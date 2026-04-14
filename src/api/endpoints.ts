/**
 * Central API Endpoints Dictionary
 * Prevents magic strings inside service files.
 */
export const ENDPOINTS = {

  // Examples for the existing domains:
  VESSEL: {
    BASE: '/vessels',
    DETAIL: (id: string | number) => `/vessels/${id}`,
    BERTH: (id: string | number) => `/vessels/${id}/berth`,
    MOOR: (id: string | number) => `/vessels/${id}/moor`,
    SURVEY: (id: string | number) => `/vessels/${id}/survey`,
    UNBERTH: (id: string | number) => `/vessels/${id}/unberth`,
  },
  VEHICLE: {
    BASE: '/vehicles',
    GATE_ENTRY: '/vehicles/gate-entry',
  },
} as const;
