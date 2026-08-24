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
  vesselStatusesEdit: string[];
  gateOperationsEdit: string[];
  canGateOp: (status: string) => boolean;
  canVesselStatus: (status: string) => boolean;
  canModule: (module: string) => boolean;
  canGateOpEdit: (status: string) => boolean;
  canVesselStatusEdit: (status: string) => boolean;
}

export function useAccessRights(): UserAccessRights {
  let role = '';
  let modules: string[] = [];
  let vesselStatuses: string[] = [];
  let gateOperations: string[] = [];
  let vesselStatusesEdit: string[] = [];
  let gateOperationsEdit: string[] = [];

  try {
    const raw = localStorage.getItem('user_data');
    if (raw) {
      const user = JSON.parse(raw);
      role = user.role || '';
      const rights = user.access_rights || {};
      modules = rights.modules || [];
      vesselStatuses = rights.vessel_statuses || [];
      gateOperations = rights.gate_operations || [];
      vesselStatusesEdit = rights.vessel_statuses_edit || [];
      gateOperationsEdit = rights.gate_operations_edit || [];
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
    vesselStatusesEdit,
    gateOperationsEdit,
    canGateOp: (status: string) => gateOperations.includes(status),
    canVesselStatus: (status: string) => vesselStatuses.includes(status),
    canModule: (module: string) => modules.includes(module),
    canGateOpEdit: (status: string) => gateOperationsEdit.includes(status),
    canVesselStatusEdit: (status: string) => vesselStatusesEdit.includes(status),
  };
}
