/**
 * Central API Endpoints Dictionary
 * Prevents magic strings inside service files.
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USER: {
    BASE: '/users',
    PROFILE: (id: string | number) => `/users/${id}`, // Dynamic route generator
    PREFERENCES: '/users/preferences',
  },
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
