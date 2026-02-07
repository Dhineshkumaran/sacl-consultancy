import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../common/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredDepartment?: Array<number>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, requiredDepartment }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Verifying access..." />;
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

  if (user?.needsEmailVerification && window.location.pathname !== '/update-email') {
    return <Navigate to="/update-email" replace />;
  }

  if (user?.needsPasswordChange && window.location.pathname !== '/change-password' && window.location.pathname !== '/update-email') {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;