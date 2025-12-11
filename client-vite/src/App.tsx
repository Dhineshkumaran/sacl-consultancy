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
import FoundrySampleCard from './components/FoundrySampleCard1';
import FoundrySampleCard3 from './components/FoundrySampleCard3';
import PouringDetailsTable from './components/PouringDetailsTable';
import type { PouringDetails, SubmittedData } from './components/PouringDetailsTable';
import SandTable from './components/Sand';
import NotificationPage from './pages/NotificationPage';
import PendingSampleCardsPage from './pages/PendingSampleCardsPage';
import PartIdentification from './components/common/Common';

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

  // Provide empty defaults for pouring route (used when navigating directly from preview)
  const emptyPouringDetails: PouringDetails = {
    date: '',
    heatCode: '',
    cComposition: '',
    siComposition: '',
    mnComposition: '',
    pComposition: '',
    sComposition: '',
    mgComposition: '',
    crComposition: '',
    cuComposition: '',
    pouringTempDegC: '',
    pouringTimeSec: '',
    ficHeatNo: '',
    ppCode: '',
    followedBy: '',
    userName: '',
  };

  const emptySubmittedData: SubmittedData = {
    selectedPart: null,
    selectedPattern: null,
    machine: '',
    reason: '',
    trialNo: '',
    samplingDate: '',
    mouldCount: '',
    sampleTraceability: '',
  };

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute>{getDashboardByRole()}</ProtectedRoute>} />

      <Route path="/common" element={
        <PartIdentification trialId={'trial_id'}/>
      } />

      <Route path="/update-email" element={<ProtectedRoute><UpdateEmailPage /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route path="/users" element={
        <ProtectedRoute requiredRole="Admin"><UsersPage /></ProtectedRoute>
      } />

      {/* ⭐ NEW ROUTE */}
      <Route path="/metallurgical-inspection" element={
        <ProtectedRoute><MetallurgicalInspection /></ProtectedRoute>
      } />

      {/* Visual inspection route */}
      <Route path="/visual-inspection" element={
        <ProtectedRoute><VisualInspection /></ProtectedRoute>
      } />

      {/* Dimensional inspection route */}
      <Route path="/dimensional-inspection" element={
        <ProtectedRoute><DimensionalInspection /></ProtectedRoute>
      } />

      {/* MC Shop route */}
      <Route path="/mc-shop" element={
        <ProtectedRoute><McShopInspection /></ProtectedRoute>
      } />

      {/* Foundry sample card route (updated path) */}
      <Route path="/foundry-sample-card" element={<ProtectedRoute><FoundrySampleCard /></ProtectedRoute>} />

  

      {/* Tertiary foundry sample card route (preview close or navigation target) */}
      <Route path="/foundry-sample-card-3" element={<ProtectedRoute><FoundrySampleCard3 /></ProtectedRoute>} />

      {/* Tertiary foundry sample card route (preview close target) */}

      {/* Redirect old path to new path for backwards-compatibility */}
      <Route path="/foundry-sample" element={<Navigate to="/foundry-sample-card" replace />} />

      {/* Notifications and pending samples */}
      <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      <Route path="/pending-samples" element={<ProtectedRoute><PendingSampleCardsPage /></ProtectedRoute>} />

      {/* Moulding table route */}
      <Route
        path="/moulding"
        element={
          <ProtectedRoute>
            <MouldingTable />
          </ProtectedRoute>
        }
      />

      {/* Pouring details table route (target after Foundry preview close) */}
      <Route
        path="/pouring"
        element={
          <ProtectedRoute>
            <PouringDetailsTable
              pouringDetails={emptyPouringDetails}
              onPouringDetailsChange={() => { }}
              submittedData={emptySubmittedData}
            />
          </ProtectedRoute>
        }
      />

      {/* Sand table route (target after pouring preview close) */}
      <Route
        path="/sand"
        element={
          <ProtectedRoute>
            <SandTable />
          </ProtectedRoute>
        }
      />

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