import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddUserModal from '../components/admin/AddUserModal';
import AddMasterModal from '../components/admin/AddMasterModal';
import UserManagement from '../components/admin/UserManagement';
import MasterListTable from '../components/admin/MasterListTable';
import RecentTrialsTable from '../components/admin/RecentTrialsTable';
import ConsolidatedReportsTable from '../components/admin/ConsolidatedReportsTable';
import RecycleBinTable from '../components/admin/RecycleBinTable';
import DeletedTrialsTable from '../components/admin/DeletedTrialsTable';
import AllTrialsPage from './AllTrialsPage';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import Sidebar from '../components/dashboard/Sidebar';
import ProfileModal from '../components/dashboard/ProfileModal';
import StatsGrid from '../components/dashboard/StatsGrid';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { type StatItem } from '../data/dashboardData';
import { getDashboardStats } from '../services/statsService';
import { CircularProgress, Box, Typography, Button, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PendingTrialsView from '../components/dashboard/PendingTrialsView';
import CompletedTrialsView from '../components/dashboard/CompletedTrialsView';
import ProgressingTrialsGrid from '../components/dashboard/ProgressingTrialsGrid';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddMasterModalOpen, setIsAddMasterModalOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [refreshKey, setRefreshKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Stats
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);

  const departmentInfo = getDepartmentInfo(user);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.username && user?.role) {
        try {
          setLoadingStats(true);
          let statsType: 'admin_trials' | 'methods_dashboard' | undefined = undefined;
          if (user.role === 'Admin') statsType = 'admin_trials';
          else if (user.role === 'User' && user.department_id === 2) statsType = 'methods_dashboard';

          const statsData = await getDashboardStats({
            role: user.role,
            username: user.username,
            department_id: user.department_id,
            statsType
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

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        if (user?.role === 'Admin') return 'Admin Dashboard';
        if (user?.role === 'User' && user?.department_id === 2) return 'Methods Dashboard';
        if (user?.role === 'HOD') return 'HOD Dashboard';
        return 'User Dashboard';
      case 'employees': return 'Employee Management';
      case 'master-list': return 'Master List Management';
      case 'manage-trials': return 'All Trials Repository';
      case 'pending-cards': return 'Pending Actions';
      case 'completed-trials': return 'Completed History';
      case 'all-trials': return 'Trial History';
      case 'consolidated-reports': return 'Consolidated Reports';
      case 'recycle-bin': return 'Recycle Bin';
      default: return 'Dashboard';
    }
  }

  const getPageSubtitle = () => {
    switch (currentView) {
      case 'dashboard': return `Welcome back, ${user?.username}!`;
      case 'employees': return 'Manage employee data and access';
      case 'master-list': return 'Manage system master data and pattern codes';
      case 'manage-trials': return 'View, search and manage all trial reports';
      case 'pending-cards': return 'Sample cards waiting for your action';
      case 'completed-trials': return 'View history of processed trials';
      case 'all-trials': return 'Browse all trial records';
      case 'consolidated-reports': return 'View consolidated history of trials by pattern code';
      case 'recycle-bin': return 'Manage soft-deleted reports';
      default: return '';
    }
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f8f9fa' }}>
      {/* Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* Header */}
        <Header
          setShowProfile={setShowProfile}
          departmentInfo={departmentInfo}
          photoRefreshKey={headerRefreshKey}
        />

        {/* Scrollable Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

          {/* Page Title Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.5 }}>
              {currentView === 'dashboard' ? 'Dashboard' : getPageTitle()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
              {getPageSubtitle()}
            </Typography>
          </Box>

          {currentView === 'dashboard' && (
            <>
              {/* Stats Grid */}
              {loadingStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <StatsGrid stats={stats} />
              )}

              {/* Progressing Trials Grid for Moulding, PCQC, Sand Plant */}
              {(user?.department_id === 4 || user?.department_id === 6 || user?.department_id === 7) && (
                <ProgressingTrialsGrid departmentId={user?.department_id || 0} />
              )}

              {/* Initiate Card Button for Dept 2 (Methods) */}
              {(user?.department_id === 2 && user?.role === 'User') && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<PostAddIcon />}
                    onClick={() => navigate('/foundry-sample-card')}
                  >
                    Initiate New Trial
                  </Button>
                </Box>
              )}

              {(user?.role === 'Admin' || user?.department_id === 2 || user?.department_id === 3) && (
                <>
                  {/* Filters & Actions Bar */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    {/* Search */}
                    <TextField
                      placeholder="Search trials by title or ID..."
                      size="small"
                      sx={{ width: 300, bgcolor: 'white' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#95a5a6' }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Right Actions */}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => setRefreshKey(p => p + 1)}
                        sx={{ textTransform: 'none', color: '#666', borderColor: '#ccc' }}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Box>

                  {/* Table Section */}
                  <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                        Trials Directory
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        Recent trials and reports
                      </Typography>
                    </Box>
                    <RecentTrialsTable key={refreshKey} />
                  </Box>
                </>
              )}
            </>
          )}

          {(user.role === 'User' || user.role === 'HOD') && currentView === 'pending-cards' && (
            <PendingTrialsView username={user?.username || ''} department_id={user?.department_id || 0} />
          )}

          {(user.role === 'User' || user.role === 'HOD') && currentView === 'completed-trials' && (
            <CompletedTrialsView username={user?.username || ''} />
          )}

          {(user.role === 'Admin' && currentView === 'all-trials') && (
            <AllTrialsPage embedded={true} />
          )}

          {user?.role === 'Admin' && currentView === 'master-list' && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setEditingMasterItem(null);
                    setIsAddMasterModalOpen(true);
                  }}
                  sx={{ textTransform: 'none', bgcolor: '#E67E22', '&:hover': { bgcolor: '#d35400' } }}
                >
                  Add to Master List
                </Button>
              </Box>
              <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <MasterListTable
                  key={refreshKey}
                  onEdit={(item) => {
                    setEditingMasterItem(item);
                    setIsAddMasterModalOpen(true);
                  }}
                />
              </Box>
            </>
          )}

          {(user?.role === 'Admin' || user?.department_id == 2 || user?.department_id == 3) && currentView === 'manage-trials' && (
            <AllTrialsPage embedded={true} />
          )}

          {(user?.role === 'Admin' || user?.department_id == 2 || user?.department_id == 3) && currentView === 'consolidated-reports' && (
            <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <ConsolidatedReportsTable />
            </Box>
          )}

          {user?.role === 'Admin' && currentView === 'employees' && (
            <UserManagement />
          )}

          {user?.role === 'Admin' && currentView === 'recycle-bin' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                    Deleted Trial Cards
                  </Typography>
                </Box>
                <DeletedTrialsTable />
              </Box>

              <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                    Deleted Trial Reports
                  </Typography>
                </Box>
                <RecycleBinTable />
              </Box>
            </Box>
          )}

        </Box>
      </Box>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserCreated={() => {
          // Refresh logic if needed
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
    </Box>
  );
};

export default Dashboard;
