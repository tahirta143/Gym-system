import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token || !userString) {
    // Not logged in -> redirect to login
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);
  const userRole = user.role; // 'super_admin', 'manager', 'trainer', 'accountant'

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Logged in but unauthorized role -> redirect to default dashboard landing
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
