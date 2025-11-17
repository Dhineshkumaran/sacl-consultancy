import React, { useState } from 'react';
import Header from '../components/common/Header';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';

const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showUserDetails, setShowUserDetails] = useState(false);

  return (
    <div className="dashboard">
      <Header />
      <main className="dashboard-content">
        {showUserDetails ? (
          <UserManagement />
        ) : (
          <div className="welcome-section">
            <div className="welcome-header">
              <h2>HOD Dashboard</h2>
              <button 
                className="btn-view-users"
                onClick={() => setShowUserDetails(true)}
              >
                👥 View User Details
              </button>
            </div>
            <p>Welcome back, {user?.username}!</p>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Department Overview</h3>
                <p>Manage your department users and teams</p>
              </div>
              <div className="stat-card">
                <h3>Reports</h3>
                <p>View department reports and analytics</p>
              </div>
            </div>
          </div>
        )}
        {showUserDetails && (
          <button 
            className="btn-back"
            onClick={() => setShowUserDetails(false)}
            style={{ marginTop: '20px' }}
          >
            ← Back to Dashboard
          </button>
        )}
      </main>
    </div>
  );
};

export default HODDashboard;
