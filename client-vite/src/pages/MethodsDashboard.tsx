import React, { useState } from 'react';
import Header from '../components/common/Header';
import UserManagement from '../components/admin/UserManagement';
import FoundrySampleCard from '../components/FoundrySampleCard';
import { useAuth } from '../context/AuthContext';

const MethodsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showFoundryCard, setShowFoundryCard] = useState(false);

  return (
    <div className="dashboard">
      <Header />
      <main className="dashboard-content">
        {showFoundryCard ? (
          <div>
            <FoundrySampleCard />
            <button 
              className="btn-back"
              onClick={() => setShowFoundryCard(false)}
              style={{ marginTop: '20px' }}
            >
              ← Back to Dashboard
            </button>
          </div>
        ) : showUserDetails ? (
          <UserManagement />
        ) : (
          <div className="welcome-section">
            <div className="welcome-header">
              <h2>Methods Dashboard</h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  className="btn-view-users"
                  onClick={() => setShowFoundryCard(true)}
                >
                  📋 Initiate Card
                </button>
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
                <h3>Methods Overview</h3>
                <p>View and manage methodologies and procedures</p>
              </div>
              <div className="stat-card">
                <h3>Quick Actions</h3>
                <p>Access reports and documentation</p>
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

export default MethodsDashboard;
