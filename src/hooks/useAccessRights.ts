/**
 * useAccessRights
 * Reads access_rights from the user_data stored in localStorage (set at login).
 * Returns typed arrays so components can gate actions / rows by permission.
 */

export interface UserAccessRights {
  role: string;
  isAdmin: boolean;
  modules: string[];
  vesselStatuses: string[];
  gateOperations: string[];
  canGateOp: (status: string) => boolean;
  canVesselStatus: (status: string) => boolean;
  canModule: (module: string) => boolean;
}

export function useAccessRights(): UserAccessRights {
  let role = '';
  let modules: string[] = [];
  let vesselStatuses: string[] = [];
  let gateOperations: string[] = [];

  try {
    const raw = localStorage.getItem('user_data');
    if (raw) {
      const user = JSON.parse(raw);
      role = user.role || '';
      const rights = user.access_rights || {};
      modules = rights.modules || [];
      vesselStatuses = rights.vessel_statuses || [];
      gateOperations = rights.gate_operations || [];
    }
  } catch (e) {
    console.error('useAccessRights: failed to parse user_data', e);
  }

  const isAdmin = role === 'admin';

  return {
    role,
    isAdmin,
    modules,
    vesselStatuses,
    gateOperations,
    canGateOp: (status: string) => gateOperations.includes(status),
    canVesselStatus: (status: string) => vesselStatuses.includes(status),
    canModule: (module: string) => modules.includes(module),
  };
}
