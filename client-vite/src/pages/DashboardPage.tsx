import React, { useState } from 'react';
import Header from '../components/common/Header';
import AddUserModal from '../components/admin/AddUserModal';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
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
              <h2>Dashboard</h2>
              <div className="button-group">
                {user?.role === 'Admin' && (
                  <button 
                    className="btn-add-user"
                    onClick={() => setIsAddUserModalOpen(true)}
                  >
                    + Add User Profiles
                  </button>
                )}
                <button 
                  className="btn-view-users"
                  onClick={() => setShowUserDetails(true)}
                >
                  👥 View User Details
                </button>
              </div>
            </div>
            <p>Welcome back, {user?.username}!</p>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Quick Actions</h3>
                <p>Manage users and view reports</p>
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

      <AddUserModal 
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserCreated={() => {
          setShowUserDetails(true); // Show users after creating
          console.log('User created successfully');
        }}
      />
    </div>
  );
};

export default DashboardPage;