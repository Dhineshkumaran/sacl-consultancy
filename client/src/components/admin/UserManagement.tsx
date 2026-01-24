import React, { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { apiService } from '../../services/commonService';
import UserTable from './UserTable';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import LoadingSpinner from '../common/LoadingSpinner';
import './UserManagement.css';
import Swal from 'sweetalert2';

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <button
          className="create-user-button"
          onClick={() => setShowCreateModal(true)}
        >
          Create New User
        </button>
      </div>

      {selectedUsers.size > 0 && (
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '15px',
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '6px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: 500, fontSize: '14px' }}>
            {selectedUsers.size} user(s) selected
          </span>
          <button
            onClick={() => handleBulkStatusChange(true)}
            style={{
              padding: '6px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
          >
            âœ“ Activate
          </button>
          <button
            onClick={() => handleBulkStatusChange(false)}
            style={{
              padding: '6px 16px',
              backgroundColor: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0a800')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffc107')}
          >
            âœ• Deactivate
          </button>
          <button
            onClick={handleBulkDelete}
            style={{
              padding: '6px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
          >
            Delete
          </button>
        </div>
      )}

      <UserTable
        users={users}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEdit}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        onSelectAllUsers={handleSelectAllUsers}
      />

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
    </div>
  );
};

export default UserManagement;
