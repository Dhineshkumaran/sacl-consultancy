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
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  const getDashboardByRole = () => {
    switch (user?.role) {
      case 'HOD':
        return <HODDashboard />;
      case 'Methods':
        return <MethodsDashboard />;
      case 'User':
        return <UserDashboard />;
      default:
        return <DashboardPage />; // Admin dashboard
    }
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            {getDashboardByRole()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requiredRole="Admin">
            <UsersPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;