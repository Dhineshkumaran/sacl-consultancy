import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import NotificationModal from '../components/dashboard/NotificationModal';
import StatsGrid from '../components/dashboard/StatsGrid';
import QuickActions from '../components/dashboard/QuickActions';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { METHODS_DASHBOARD_STATS, METHODS_DASHBOARD_ACTIONS } from '../data/dashboardData';

const MethodsDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const departmentInfo = getDepartmentInfo(user);

  return (
    <div className="dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Header
        setShowNotifications={setShowNotifications}
        departmentInfo={departmentInfo}
      />
      <main className="dashboard-content" style={{ padding: '20px' }}>
        <div className="welcome-section">
          <WelcomeSection
            title="Methods Dashboard"
            description={`Welcome back, ${user?.username}! Manage methodologies and processes.`}
          >
            <button
              className="btn-view-users"
              onClick={() => navigate('/foundry-sample-card')}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
            >
              📋 Initiate Card
            </button>
          </WelcomeSection>

          {/* Methods Specific Stats Grid */}
          <div style={{ marginBottom: '30px' }}>
            <p style={{
              color: '#666',
              fontSize: '14px',
              marginBottom: '15px'
            }}>
              Methods and process overview
            </p>

            <StatsGrid stats={METHODS_DASHBOARD_STATS} />

            <hr style={{
              border: 'none',
              borderTop: '1px solid #dee2e6',
              margin: '30px 0'
            }} />
          </div>

          {/* Quick Actions Section */}
          <QuickActions actions={METHODS_DASHBOARD_ACTIONS} />
        </div>
      </main>

      {/* Notification Modal */}
      {showNotifications && <NotificationModal onClose={() => setShowNotifications(false)} />}
    </div>
  );
};

export default MethodsDashboard;