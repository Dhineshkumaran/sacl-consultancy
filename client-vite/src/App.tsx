import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HODDashboard from './pages/HODDashboard';
import MethodsDashboard from './pages/MethodsDashboard';
import UserDashboard from './pages/UserDashboard';
import UsersPage from './pages/UsersPage';
import UpdateEmailPage from './pages/UpdateEmailPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

import LoadingSpinner from './components/common/LoadingSpinner';
import MetallurgicalInspection from './components/MetallurgicalInspection';
import MouldingTable from './components/moulding';                             // ⭐ For testing

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingSpinner />;

  const getDashboardByRole = () => {
    switch (user?.role) {
      case 'HOD': return <HODDashboard />;
      case 'Methods': return <MethodsDashboard />;
      case 'User': return <UserDashboard />;
      default: return <DashboardPage />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute>{getDashboardByRole()}</ProtectedRoute>} />

      <Route path="/update-email" element={<ProtectedRoute><UpdateEmailPage /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route path="/users" element={
        <ProtectedRoute requiredRole="Admin"><UsersPage /></ProtectedRoute>
      } />

      {/* ⭐ NEW ROUTE */}
      <Route path="/metallurgical-inspection" element={
        <ProtectedRoute><MetallurgicalInspection /></ProtectedRoute>
      } />

      {/* OPTIONAL: to test moulding */}
      <Route path="/moulding" element={<ProtectedRoute><MouldingTable /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}