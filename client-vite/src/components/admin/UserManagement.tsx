import React, { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { apiService } from '../../services/commonService.ts';
import UserTable from './UserTable.tsx';
import AddUserModal from './AddUserModal.tsx';
import DeleteUserModal from './DeleteUserModal.tsx';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState<{ ids: number[], names: string[] } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await apiService.getUsers();
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);


  const handleDeleteUsers = (userIds: number[]) => {
    const selectedUsers = users.filter(u => userIds.includes(u.user_id));
    if (selectedUsers.length > 0) {
      setUsersToDelete({
        ids: userIds,
        names: selectedUsers.map(u => u.username)
      });
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!usersToDelete) return;

    try {
      setDeleteLoading(true);
      if (usersToDelete.ids.length === 1) {
        await apiService.deleteUser(usersToDelete.ids[0]);
      } else {
        await apiService.deleteUsersBulk(usersToDelete.ids);
      }

      await loadUsers(); // Refresh the list
      setShowDeleteModal(false);
      setUsersToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete users');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <button
          className="create-user-button"
          onClick={() => setShowCreateModal(true)}
        >
          Create New User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <UserTable users={users} onDelete={handleDeleteUsers} />

      {showCreateModal && (
        <AddUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={loadUsers}
        />
      )}

      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        username={usersToDelete?.names[0]}
        count={usersToDelete?.ids.length}
      />
    </div>
  );
};

export default UserManagement;