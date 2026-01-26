import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredDepartment?: Array<number>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, requiredDepartment }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredDepartment && !requiredDepartment.includes(user?.department_id)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (user?.needsPasswordChange && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;