import React, { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { apiService } from '../../services/commonService';
import UserTable from './UserTable';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import './UserManagement.css';
import Swal from 'sweetalert2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Box, Typography, useMediaQuery, Button } from '@mui/material';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await apiService.getUsers();
      setUsers(userList);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to load users',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);


  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await apiService.updateUserStatus(userId, !currentStatus);
      await loadUsers();
      Swal.fire({
        title: 'Success',
        text: `Successfully ${currentStatus ? 'activated' : 'deactivated'} user.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      Swal.fire({
        title: 'Error',
        text: err.message || 'Failed to update user status',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.user_id)));
    }
  };

  const handleBulkStatusChange = async (status: boolean) => {
    try {
      const selectedIds = Array.from(selectedUsers);
      for (const userId of selectedIds) {
        await apiService.updateUserStatus(userId, status);
      }
      await loadUsers();
      setSelectedUsers(new Set());
      Swal.fire({
        title: 'Success',
        text: `Successfully ${status ? 'activated' : 'deactivated'} ${selectedIds.length} users.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      Swal.fire({
        title: 'Error',
        text: err.message || `Failed to update user status`,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${selectedUsers.size} user(s). This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete them!'
    });

    if (result.isConfirmed) {
      try {
        const selectedIds = Array.from(selectedUsers);
        for (const userId of selectedIds) {
          await apiService.deleteUser(userId);
        }
        await loadUsers();
        setSelectedUsers(new Set());
        Swal.fire(
          'Deleted!',
          'Users have been deleted.',
          'success'
        );
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        Swal.fire({
          title: 'Error',
          text: err.message || 'Failed to delete users',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  return (
    <Box sx={{ p: { xs: 2.25, sm: 3 } }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Button
          variant="contained"
          onClick={() => setShowCreateModal(true)}
          sx={{
            bgcolor: '#E67E22',
            '&:hover': {
              bgcolor: '#D35400',
              boxShadow: '0 6px 16px rgba(230, 126, 34, 0.25)',
            },
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 1.5,
            px: 4,
            py: 1,
            boxShadow: '0 4px 12px rgba(230, 126, 34, 0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          Create New User
        </Button>
      </Box>

      {selectedUsers.size > 0 && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
          p: 2,
          bgcolor: 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <Typography variant="body2" fontWeight={600} color="primary">
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => handleBulkStatusChange(true)}
              startIcon={<CheckCircleIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              Activate
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => handleBulkStatusChange(false)}
              startIcon={<CancelIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              Deactivate
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleBulkDelete}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{
        px: 0,
        pb: 5,
        mt: 1,
        width: '100%'
      }}>
        <UserTable
          users={users}
          loading={loading}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          selectedUsers={selectedUsers}
          onSelectUser={handleSelectUser}
          onSelectAllUsers={handleSelectAllUsers}
        />
      </Box>

      {showCreateModal && (
        <AddUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={loadUsers}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUserUpdated={loadUsers}
          user={selectedUser}
        />
      )}
    </Box>
  );
};

export default UserManagement;
