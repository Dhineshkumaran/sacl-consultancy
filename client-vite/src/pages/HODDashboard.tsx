import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import NotificationModal from '../components/dashboard/NotificationModal';
import ProfileModal from '../components/dashboard/ProfileModal';
import StatsGrid from '../components/dashboard/StatsGrid';
import QuickActions from '../components/dashboard/QuickActions';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import { getDepartmentInfo, getPendingRoute } from '../utils/dashboardUtils';
import {
  ADMIN_STATS,
  METHODS_STATS,
  DEPARTMENT_STATS,
  ADMIN_ACTIONS,
  METHODS_ACTIONS,
  DEPARTMENT_ACTIONS,
  type StatItem,
  type ActionItem
} from '../data/dashboardData';
import PendingSampleCards from './PendingSampleCards';

const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [showPendingCards, setShowPendingCards] = useState(false);

  const handlePendingClick = () => {
    setShowPendingCards(true);
  };

  const handlePendingCardSelect = (card: any) => {
    setShowPendingCards(false);
    const route = getPendingRoute(card.department_id);
    navigate(`${route}?trial_id=${card.trial_id}`);
  };

  const departmentInfo = getDepartmentInfo(user);

  // Get role-specific stats
  const getStats = (): StatItem[] => {
    if (user?.role === 'Admin') return ADMIN_STATS;
    if (user?.role === 'Methods') return METHODS_STATS;
    return DEPARTMENT_STATS;
  };

  // Get role-specific actions
  const getActions = (): ActionItem[] => {
    if (user?.role === 'Admin') return ADMIN_ACTIONS;
    if (user?.role === 'Methods') return METHODS_ACTIONS;
    return DEPARTMENT_ACTIONS;
  };

  const stats = getStats();
  const actions = getActions();

  // Determine dashboard title
  const getDashboardTitle = () => {
    if (user?.role === 'Admin') return 'Admin Dashboard';
    if (user?.role === 'Methods') return 'Methods Dashboard';
    return 'HOD Dashboard';
  };

  const getDashboardDescription = () => {
    if (user?.role === 'Admin') return `Welcome back, ${user?.username}! Manage system-wide operations.`;
    if (user?.role === 'Methods') return `Welcome back, ${user?.username}! Oversee methods and processes.`;
    return `Welcome back, ${user?.username}! Manage your department efficiently.`;
  };

  return (
    <div className="dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Header
        setShowNotifications={setShowNotifications}
        setShowProfile={setShowProfile}
        departmentInfo={departmentInfo}
      />
      <main className="dashboard-content" style={{ padding: '20px' }}>
        <div className="welcome-section">
          <WelcomeSection
            title={getDashboardTitle()}
            description={getDashboardDescription()}
          >
            <button
              className="btn-pending-cards"
              onClick={() => handlePendingClick()}
              style={{
                backgroundColor: '#ffc107',
                color: '#333',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0ac06'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffc107'}
            >
              ⏳ Pending Cards
            </button>
          </WelcomeSection>

          {/* Role Specific Stats Grid */}
          <div style={{ marginBottom: '30px' }}>

            <StatsGrid stats={stats} />

            <hr style={{
              border: 'none',
              borderTop: '1px solid #dee2e6',
              margin: '30px 0'
            }} />
          </div>

          {/* Quick Actions Section */}
          <QuickActions actions={actions} />
        </div>
      </main>

      {/* Notification Modal */}
      {showNotifications && <NotificationModal onClose={() => setShowNotifications(false)} />}

      {/* Profile Modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {/* Pending Cards Overlay */}
      <PendingSampleCards
        open={showPendingCards}
        onClose={() => setShowPendingCards(false)}
        username={user?.username || ''}
        onCardSelect={handlePendingCardSelect}
      />
    </div>
  );
};

export default HODDashboard;