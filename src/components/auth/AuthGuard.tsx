import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

/**
 * Maps module permission keys from the API to their corresponding route paths.
 */
const MODULE_ROUTE_MAP: Record<string, string> = {
  DASHBOARD: '/dashboard',
  PARTY_MASTER: '/party-master',
  VEHICLE_MASTER: '/vehicle-master',
  VESSEL_OPS: '/vessels',
  VEHICLE_LOGISTICS: '/vehicles',
  WEIGHBRIDGE_TERMINAL: '/weighbridge',
  FINANCE_GENERATE_BILL: '/finance/generate-bill',
  FINANCE_ALL_BILLS: '/finance/all-bills',
  FINANCE_VESSEL_REPORT: '/finance/vessel-report',
  SETTINGS: '/settings',
};

const AuthGuard: React.FC = () => {
  const token = localStorage.getItem('access_token');
  const userDataString = localStorage.getItem('user_data');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  let userRole = '';
  let allowedModules: string[] = [];

  try {
    if (userDataString) {
      const user = JSON.parse(userDataString);
      userRole = user.role || '';
      allowedModules = user.access_rights?.modules || [];
    }
  } catch (e) {
    console.error("Failed to parse user data in AuthGuard", e);
  }

  // Build set of allowed paths from the user's module permissions
  const allowedPaths = allowedModules.map(m => MODULE_ROUTE_MAP[m]).filter(Boolean);

  // Admin role always gets Settings access even if not explicitly in modules
  if (userRole === 'admin' && !allowedPaths.includes('/settings')) {
    allowedPaths.push('/settings');
  }

  // Users (non-admin) must NEVER access settings regardless
  if (userRole !== 'admin') {
    const idx = allowedPaths.indexOf('/settings');
    if (idx !== -1) allowedPaths.splice(idx, 1);
  }

  // Check if current path is allowed
  const currentPath = location.pathname;
  if (allowedPaths.length > 0 && !allowedPaths.includes(currentPath)) {
    // Redirect to first allowed path, or dashboard as fallback
    const fallback = allowedPaths[0] || '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
