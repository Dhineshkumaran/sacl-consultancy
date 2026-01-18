import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddUserModal from '../components/admin/AddUserModal';
import AddMasterModal from '../components/admin/AddMasterModal';
import UserManagement from '../components/admin/UserManagement';
import MasterListTable from '../components/admin/MasterListTable';
import TrialsTable from '../components/admin/TrialsTable';
import DropdownButton from '../components/dashboard/DropdownButton';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import ProfileModal from '../components/dashboard/ProfileModal';
import StatsGrid from '../components/dashboard/StatsGrid';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { type StatItem } from '../data/dashboardData';
import { getDashboardStats } from '../services/statsService';
import { CircularProgress, Menu, MenuItem } from '@mui/material';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showMasterList, setShowMasterList] = useState(false);
  const [showAllTrials, setShowAllTrials] = useState(false);
  const [isAddMasterModalOpen, setIsAddMasterModalOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const [masterListMenuAnchor, setMasterListMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

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

  const handleViewTrials = () => {
    navigate('/trials');
  };

  const handleViewMasterList = () => {
    setShowMasterList(true);
    setShowUserDetails(false);
    setShowAllTrials(false);
  };

  const handleViewUserDetails = () => {
    setShowUserDetails(true);
    setShowMasterList(false);
    setShowAllTrials(false);
  };

  return (
    <div className="dashboard" style={{ background: 'linear-gradient(135deg, #FF9C00 0%, #FFE2B8 40%, #FFFFFF 50%, #D1D5D8 60%, #6C757D 100%)', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
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
        setShowProfile={setShowProfile}
        departmentInfo={departmentInfo}
        customStyle={{ backgroundColor: '#ffffff', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '2px solid #e0e0e0' }}
        textColor="#333"
        logoTextColors={{ title: '#000000', subtitle: '#666' }}
        photoRefreshKey={headerRefreshKey}
      />

      <main className="dashboard-content">
        {showUserDetails ? (
          <>
            <WelcomeSection
              title="Admin Dashboard"
              description={`Welcome back, ${user?.username}!`}
              titleColor="#333"
              descriptionColor="#666"
            >
              {user?.role === 'Admin' && (
                <>
                  <DropdownButton
                    label="Manage Master List"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setMasterListMenuAnchor(e.currentTarget)}
                    isOpen={Boolean(masterListMenuAnchor)}
                    color="purple"
                  />
                  <Menu
                    anchorEl={masterListMenuAnchor}
                    open={Boolean(masterListMenuAnchor)}
                    onClose={() => setMasterListMenuAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setEditingMasterItem(null);
                        setIsAddMasterModalOpen(true);
                        setMasterListMenuAnchor(null);
                      }}
                    >
                      Add to Master List
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleViewMasterList();
                        setMasterListMenuAnchor(null);
                      }}
                    >
                      View details in Master List
                    </MenuItem>
                  </Menu>
                  <DropdownButton
                    label="Manage Users"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setUserMenuAnchor(e.currentTarget)}
                    isOpen={Boolean(userMenuAnchor)}
                    color="orange"
                    marginLeft="10px"
                  />
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setIsAddUserModalOpen(true);
                        setUserMenuAnchor(null);
                      }}
                    >
                      Add User Profiles
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleViewUserDetails();
                        setUserMenuAnchor(null);
                      }}
                    >
                      View User Details
                    </MenuItem>
                  </Menu>
                </>
              )}
              <button
                className="btn-view-trials"
                onClick={handleViewTrials}
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
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#59359a')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#6f42c1')}
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

            {/* User Management Section */}
            <UserManagement />
          </>
        ) : showMasterList ? (
          <>
            <WelcomeSection
              title="Admin Dashboard"
              description={`Welcome back, ${user?.username}!`}
              titleColor="#333"
              descriptionColor="#666"
            >
              {user?.role === 'Admin' && (
                <>
                  <DropdownButton
                    label="Manage Master List"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setMasterListMenuAnchor(e.currentTarget)}
                    isOpen={Boolean(masterListMenuAnchor)}
                    color="purple"
                  />
                  <Menu
                    anchorEl={masterListMenuAnchor}
                    open={Boolean(masterListMenuAnchor)}
                    onClose={() => setMasterListMenuAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setEditingMasterItem(null);
                        setIsAddMasterModalOpen(true);
                        setMasterListMenuAnchor(null);
                      }}
                    >
                      Add to Master List
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleViewMasterList();
                        setMasterListMenuAnchor(null);
                      }}
                    >
                      View details in Master List
                    </MenuItem>
                  </Menu>
                  <DropdownButton
                    label="Manage Users"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setUserMenuAnchor(e.currentTarget)}
                    isOpen={Boolean(userMenuAnchor)}
                    color="orange"
                    marginLeft="10px"
                  />
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setIsAddUserModalOpen(true);
                        setUserMenuAnchor(null);
                      }}
                    >
                      Add User Profiles
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleViewUserDetails();
                        setUserMenuAnchor(null);
                      }}
                    >
                      View User Details
                    </MenuItem>
                  </Menu>
                </>
              )}
              <button
                className="btn-view-trials"
                onClick={handleViewTrials}
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
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#59359a')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#6f42c1')}
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

            {/* Master List Section */}
            <MasterListTable
              key={refreshKey}
              onEdit={(item) => {
                setEditingMasterItem(item);
                setIsAddMasterModalOpen(true);
              }}
            />
          </>
        ) : showAllTrials ? (
          <>
            <WelcomeSection
              title="Admin Dashboard"
              description={`Welcome back, ${user?.username}!`}
              titleColor="#333"
              descriptionColor="#666"
            >
              {user?.role === 'Admin' && (
                <>
                  <DropdownButton
                    label="Manage Master List"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setMasterListMenuAnchor(e.currentTarget)}
                    isOpen={Boolean(masterListMenuAnchor)}
                    color="purple"
                  />
                  <Menu
                    anchorEl={masterListMenuAnchor}
                    open={Boolean(masterListMenuAnchor)}
                    onClose={() => setMasterListMenuAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setEditingMasterItem(null);
                        setIsAddMasterModalOpen(true);
                        setMasterListMenuAnchor(null);
                      }}
                    >
                      Add to Master List
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleViewMasterList();
                        setMasterListMenuAnchor(null);
                      }}
                    >
                      View details in Master List
                    </MenuItem>
                  </Menu>
                  <DropdownButton
                    label="Manage Users"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setUserMenuAnchor(e.currentTarget)}
                    isOpen={Boolean(userMenuAnchor)}
                    color="orange"
                    marginLeft="10px"
                  />
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setIsAddUserModalOpen(true);
                        setUserMenuAnchor(null);
                      }}
                    >
                      Add User Profiles
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleViewUserDetails();
                        setUserMenuAnchor(null);
                      }}
                    >
                      View User Details
                    </MenuItem>
                  </Menu>
                </>
              )}
              <button
                className="btn-view-trials"
                onClick={handleViewTrials}
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
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#59359a')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#6f42c1')}
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

            {/* All Trials Section */}
            <h4 style={{
              marginTop: '30px',
              marginBottom: '20px',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#1976d2'
            }}>
              View All Trials
            </h4>
            <TrialsTable />
          </>
        ) : (
          <>
            <WelcomeSection
              title="Admin Dashboard"
              description={`Welcome back, ${user?.username}!`}
              titleColor="#333"
              descriptionColor="#666"
            >
              {user?.role === 'Admin' && (
                <>
                  <DropdownButton
                    label="Manage Master List"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setMasterListMenuAnchor(e.currentTarget)}
                    isOpen={Boolean(masterListMenuAnchor)}
                    color="purple"
                  />
                  <Menu
                    anchorEl={masterListMenuAnchor}
                    open={Boolean(masterListMenuAnchor)}
                    onClose={() => setMasterListMenuAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setEditingMasterItem(null);
                        setIsAddMasterModalOpen(true);
                        setMasterListMenuAnchor(null);
                      }}
                    >
                      Add to Master List
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleViewMasterList();
                        setMasterListMenuAnchor(null);
                      }}
                    >
                      View details in Master List
                    </MenuItem>
                  </Menu>
                  <DropdownButton
                    label="Manage Users"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => setUserMenuAnchor(e.currentTarget)}
                    isOpen={Boolean(userMenuAnchor)}
                    color="orange"
                    marginLeft="10px"
                  />
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                  >
                    <MenuItem
                      onClick={() => {
                        setIsAddUserModalOpen(true);
                        setUserMenuAnchor(null);
                      }}
                    >
                      Add User Profiles
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleViewUserDetails();
                        setUserMenuAnchor(null);
                      }}
                    >
                      View User Details
                    </MenuItem>
                  </Menu>
                </>
              )}
              <button
                className="btn-view-trials"
                onClick={handleViewTrials}
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
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#59359a')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = '#6f42c1')}
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

            {/* All Trials Section */}
            <h4 style={{
              marginTop: '30px',
              marginBottom: '20px',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#1976d2'
            }}>
              View All Trials
            </h4>
            <TrialsTable />
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

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
};

export default Dashboard;
