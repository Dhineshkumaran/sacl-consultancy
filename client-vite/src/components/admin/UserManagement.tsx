import React, { useState, useEffect } from 'react';
import type { User, CreateUserRequest } from '../../types/user';
import { apiService } from '../../services/api';
import UserTable from './UserTable.tsx';
import CreateUserModal from './CreateUserModal.tsx';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      await apiService.createUser(userData);
      setShowCreateModal(false);
      await loadUsers(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create user');
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

      <UserTable users={users} />

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}
    </div>
  );
};

export default UserManagement;