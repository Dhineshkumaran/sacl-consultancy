import React, { useState, useEffect } from 'react';
import AddUserModal from '../components/admin/AddUserModal';
import AddMasterModal from '../components/admin/AddMasterModal';
import UserManagement from '../components/admin/UserManagement';
import MasterListTable from '../components/admin/MasterListTable';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import NotificationModal from '../components/dashboard/NotificationModal';
import ProfileModal from '../components/dashboard/ProfileModal';
import StatsGrid from '../components/dashboard/StatsGrid';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { type StatItem } from '../data/dashboardData';
import { getDashboardStats } from '../services/statsService';
import { CircularProgress } from '@mui/material';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showMasterList, setShowMasterList] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAddMasterModalOpen, setIsAddMasterModalOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const departmentInfo = getDepartmentInfo(user);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.username && user?.role) {
        try {
          setLoadingStats(true);
          const statsData = await getDashboardStats({
            role: user.role,
            username: user.username,
            department_id: user.department_id,
            statsType: 'admin_trials'
          });
          setStats(statsData);
        } catch (error) {
          console.error('Error fetching stats:', error);
        } finally {
          setLoadingStats(false);
        }
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      {/* Load Poppins Font Global */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          .dashboard-content {
            padding: 20px;
          }
          @media (max-width: 768px) {
            .dashboard-content {
              padding: 15px;
            }
          }
          @media (max-width: 480px) {
            .dashboard-content {
              padding: 10px;
            }
          }
        `}
      </style>

      <Header
        setShowNotifications={setShowNotifications}
        setShowProfile={setShowProfile}
        departmentInfo={departmentInfo}
        customStyle={{ backgroundColor: '#ffffff', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        textColor="#333"
        logoTextColors={{ title: '#000000', subtitle: '#666' }}
      />

      <main className="dashboard-content">
        {(showUserDetails || showMasterList) && (
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            backgroundColor: '#f8f9fa',
            padding: '10px 0',
            width: '100%',
            marginBottom: '10px'
          }}>
            <button
              className="btn-back"
              onClick={() => {
                setShowUserDetails(false);
                setShowMasterList(false);
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#545b62')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        {showUserDetails ? (
          <UserManagement />
        ) : showMasterList ? (
          <MasterListTable
            key={refreshKey}
            onEdit={(item) => {
              setEditingMasterItem(item);
              setIsAddMasterModalOpen(true);
            }}
          />
        ) : (
          <>
            <WelcomeSection
              title="Admin Ideas Dashboard"
              description={`Welcome back, ${user?.username}!`}
              titleColor="#333"
              descriptionColor="#666"
            >
              {user?.role === 'Admin' && (
                <>
                  <button
                    className="btn-add-master"
                    onClick={() => {
                      setEditingMasterItem(null);
                      setIsAddMasterModalOpen(true);
                    }}
                    style={{
                      backgroundImage: 'none',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '14px',
                      transition: 'background-color 0.2s',
                      boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                  >
                    Add to Master List
                  </button>
                  <button
                    className="btn-view-master"
                    onClick={() => setShowMasterList(true)}
                    style={{
                      backgroundImage: 'none',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '14px',
                      marginLeft: '10px',
                      transition: 'background-color 0.2s',
                      boxShadow: '0 2px 4px rgba(23, 162, 184, 0.2)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#138496')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#17a2b8')}
                  >
                    View details in Master List
                  </button>
                  <button
                    className="btn-add-user"
                    onClick={() => setIsAddUserModalOpen(true)}
                    style={{
                      backgroundImage: 'none',
                      backgroundColor: '#2c2822ff',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '14px',
                      marginLeft: '10px',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    Add User Profiles
                  </button>
                </>
              )}
              <button
                className="btn-view-users"
                onClick={() => setShowUserDetails(true)}
                style={{
                  backgroundImage: 'none',
                  backgroundColor: '#FF9C00',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(255, 156, 0, 0.2)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e57f00')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF9C00')}
              >
                View User Details
              </button>

              <button
                className="btn-view-trials"
                onClick={() => window.location.href = '/trials'}
                style={{
                  backgroundImage: 'none',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  marginLeft: '10px',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(111, 66, 193, 0.2)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#59359a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6f42c1')}
              >
                View All Trials
              </button>
            </WelcomeSection>

            {/* Overview Section */}
            {loadingStats ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <CircularProgress />
              </div>
            ) : (
              <StatsGrid stats={stats} />
            )}
          </>
        )}

      </main>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserCreated={() => {
          setShowUserDetails(true);
        }}
      />

      {/* Add Master List Modal */}
      <AddMasterModal
        isOpen={isAddMasterModalOpen}
        onClose={() => {
          setIsAddMasterModalOpen(false);
          setEditingMasterItem(null);
        }}
        initialData={editingMasterItem}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />

      {/* Notification Modal */}
      {showNotifications && <NotificationModal onClose={() => setShowNotifications(false)} />}

      {/* Profile Modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default DashboardPage;
