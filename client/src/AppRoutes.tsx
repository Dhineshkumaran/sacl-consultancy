import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import UpdateEmailPage from './pages/UpdateEmailPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

import LoadingState from './components/common/LoadingState';
import MetallurgicalInspection from './components/inspection/MetallurgicalInspection';
import VisualInspection from './components/inspection/VisualInspection';
import DimensionalInspection from './components/inspection/DimensionalInspection';
import McShopInspection from './components/inspection/MachineShopInspection';
import MouldingTable from './components/inspection/MouldingInspection';
import FoundrySampleCard from './components/inspection/FoundrySampleCard';
import PouringDetailsTable from './components/inspection/PouringInspection';
import SandTable from './components/inspection/SandPlantInspection';
import MaterialCorrection from './components/inspection/MaterialCorrectionInspection';

const AppRoutes: React.FC = () => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return <LoadingState message="Restoring session..." />;

    return (
        <Routes>
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

            <Route path="/update-email" element={
                <ProtectedRoute>
                    {user?.needsEmailVerification ? <UpdateEmailPage /> : <Navigate to="/dashboard" replace />}
                </ProtectedRoute>
            } />
            <Route path="/change-password" element={
                <ProtectedRoute>
                    {user?.needsPasswordChange ? <ChangePasswordPage /> : <Navigate to="/dashboard" replace />}
                </ProtectedRoute>
            } />

            <Route path="/users" element={
                <ProtectedRoute requiredRole="Admin"><UsersPage /></ProtectedRoute>
            } />

            <Route path="/metallurgical-inspection" element={
                <ProtectedRoute requiredDepartment={[1, 9, 8]}><MetallurgicalInspection /></ProtectedRoute>
            } />

            <Route path="/material-correction" element={
                <ProtectedRoute requiredDepartment={[1, 3, 6, 7, 8]}><MaterialCorrection /></ProtectedRoute>
            } />

            <Route path="/visual-inspection" element={
                <ProtectedRoute requiredDepartment={[1, 5, 8]}><VisualInspection /></ProtectedRoute>
            } />

            <Route path="/dimensional-inspection" element={
                <ProtectedRoute requiredDepartment={[1, 8, 10]}><DimensionalInspection /></ProtectedRoute>
            } />

            <Route path="/mc-shop" element={
                <ProtectedRoute requiredDepartment={[1, 8, 9]}><McShopInspection /></ProtectedRoute>
            } />

            <Route path="/foundry-sample-card" element={
                <ProtectedRoute requiredDepartment={[1, 2, 8]}><FoundrySampleCard /></ProtectedRoute>
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

export default AppRoutes;
