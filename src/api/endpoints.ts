/**
 * Central API Endpoints Dictionary
 * Prevents magic strings inside service files.
 */
export const ENDPOINTS = {

  // Examples for the existing domains:
  VESSEL: {
    BASE: '/vessels',
    NAMES: '/vessels/names',
    DETAIL: (id: string | number) => `/vessels/${id}`,
    BERTH: (id: string | number) => `/vessels/${id}/berth`,
    MOOR: (id: string | number) => `/vessels/${id}/moor`,
    SURVEY: (id: string | number) => `/vessels/${id}/survey`,
    UNBERTH: (id: string | number) => `/vessels/${id}/unberth`,
  },
  VEHICLE: {
    BASE: '/vehicles',
    GATE_ENTRIES: '/gate-entries',
    GATE_ENTRY_NOS: '/gate-entries/nos',
    CARGO_OPS: '/cargo-operations',
    CARGO_OP_DETAIL: (id: string | number) => `/cargo-operations/${id}`,
  },
  WEIGHBRIDGE: {
    WBIN: '/wbin',
    WBOUT: '/wbout',
  },
  PARTY_MASTER: {
    BASE: '/partymasters',
  },
  AUTH: {
    REGISTER: '/register',
    LOGIN: '/login',
    USERS: '/users',
    ACCESS_RIGHTS: (id: string | number) => `/access-rights/${id}`,
  },
  BILLING: {
    VESSELS: '/billing/vessels',
    GENERATE: '/billing/generate',
    PDF_BILL: 'v1/pdf-bill',
  },
  VEHICLE_MASTER: {
    BASE: '/vehiclemasters',
  },
} as const;
