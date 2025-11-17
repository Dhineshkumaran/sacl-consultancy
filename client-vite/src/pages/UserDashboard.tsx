import React, { useState } from 'react';
import Header from '../components/common/Header';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';

const UserDashboard: React.FC = () => {
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
              <h2>User Dashboard</h2>
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
                <h3>My Tasks</h3>
                <p>View your assigned tasks and activities</p>
              </div>
              <div className="stat-card">
                <h3>My Profile</h3>
                <p>View and manage your profile information</p>
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

export default UserDashboard;
