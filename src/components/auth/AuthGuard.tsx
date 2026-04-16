import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

const AuthGuard: React.FC = () => {
  const token = localStorage.getItem('access_token');
  const userDataString = localStorage.getItem('user_data');
  const location = useLocation();

  if (!token) {
    // Not authenticated, redirect to root AuthPage
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  let userRole = '';
  try {
    if (userDataString) {
      const user = JSON.parse(userDataString);
      userRole = user.role || '';
    }
  } catch (e) {
    console.error("Failed to parse user data in AuthGuard", e);
  }

  // RBAC checks
  // If the user role is purely 'user', limit them strictly to the dashboard.
  if (userRole === 'user' && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
