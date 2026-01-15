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
import VisualInspection from './components/VisualInspection';
import DimensionalInspection from './components/DimensionalInspection';
import McShopInspection from './components/MCShop';
import MouldingTable from './components/Moulding';
import FoundrySampleCard from './components/FoundrySampleCard';
import PouringDetailsTable from './components/PouringDetailsTable';
import SandTable from './components/Sand';
import NotificationPage from './pages/NotificationPage';
import Common from './components/dashboard/BasicInfo';
import MaterialCorrection from './components/MaterialCorrection';
import AllTrialsPage from './pages/AllTrialsPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingSpinner />;

  const getDashboardByRole = () => {
    switch (user?.role) {
      case 'HOD': return <HODDashboard />;
      case 'Methods': return <MethodsDashboard />;
      case 'User':
        if (user?.department_id === 2) return <MethodsDashboard />;
        return <UserDashboard />;
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

      <Route path="/metallurgical-inspection" element={
        <ProtectedRoute requiredDepartment={[1, 9]}><MetallurgicalInspection /></ProtectedRoute>
      } />

      <Route path="/material-correction" element={
        <ProtectedRoute requiredDepartment={[1, 3]}><MaterialCorrection /></ProtectedRoute>
      } />

      <Route path="/visual-inspection" element={
        <ProtectedRoute requiredDepartment={[1, 5]}><VisualInspection /></ProtectedRoute>
      } />

      <Route path="/trials" element={
        <ProtectedRoute><AllTrialsPage /></ProtectedRoute>
      } />

      <Route path="/dimensional-inspection" element={
        <ProtectedRoute requiredDepartment={[1, 10]}><DimensionalInspection /></ProtectedRoute>
      } />

      <Route path="/mc-shop" element={
        <ProtectedRoute requiredDepartment={[1, 8, 3]}><McShopInspection /></ProtectedRoute>
      } />

      <Route path="/foundry-sample-card" element={
        <ProtectedRoute requiredDepartment={[1, 2]}><FoundrySampleCard /></ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute><NotificationPage /></ProtectedRoute>
      } />

      <Route path="/moulding" element={
        <ProtectedRoute requiredDepartment={[1, 6]}><MouldingTable /></ProtectedRoute>
      } />

      <Route path="/pouring" element={
        <ProtectedRoute requiredDepartment={[1, 7]}><PouringDetailsTable /></ProtectedRoute>
      } />

      <Route path="/sand" element={
        <ProtectedRoute requiredDepartment={[1, 4]}><SandTable /></ProtectedRoute>
      } />

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
