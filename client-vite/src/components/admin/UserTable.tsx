import React, { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import { getDepartmentName } from '../../utils/dashboardUtils';
import DeleteIcon from '@mui/icons-material/Delete';
import './UserTable.css';

interface UserTableProps {
  users: User[];
  onDelete: (userIds: number[]) => void;
}

// Department mapping for filter options (unchanged)
const departmentOptions = [
  { id: 1, name: 'ADMIN' },
  { id: 2, name: 'METHODS' },
  { id: 3, name: 'NPD QC' },
  { id: 4, name: 'SANDPLANT' },
  { id: 5, name: 'FETTLING & VISUAL INSPECTION' },
  { id: 6, name: 'MOULDING' },
  { id: 7, name: 'QUALITY' },
  { id: 8, name: 'MACHINESHOP' },
  { id: 9, name: 'NDT QC' },
  { id: 10, name: 'QA' }
];

const UserTable: React.FC<UserTableProps> = ({ users, onDelete }) => {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  // Get unique roles from users
  const roleOptions = useMemo(() => {
    const roles = [...new Set(users.map(user => user.role))];
    return roles.sort();
  }, [users]);

  // Filter users based on selected filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesDepartment = !departmentFilter ||
        user.department_id?.toString() === departmentFilter;
      return matchesRole && matchesDepartment;
    });
  }, [users, roleFilter, departmentFilter]);

  const clearFilters = () => {
    setRoleFilter('');
    setDepartmentFilter('');
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredUsers.map(u => u.user_id));
      setSelectedUsers(allIds);
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (id: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  return (
    <div className="user-table-container">
      {/* Filter Section */}
      <div className="filter-section" style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 500, fontSize: '14px' }}>Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '150px',
              cursor: 'pointer'
            }}
          >
            <option value="">All Roles</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 500, fontSize: '14px' }}>Department:</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            <option value="">All Departments</option>
            {departmentOptions.map(dept => (
              <option key={dept.id} value={dept.id.toString()}>{dept.name}</option>
            ))}
          </select>
        </div>

        {(roleFilter || departmentFilter) && (
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Clear Filters
          </button>
        )}

        {selectedUsers.size > 0 && (
          <button
            onClick={() => onDelete(Array.from(selectedUsers))}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              marginLeft: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <DeleteIcon fontSize="small" />
            Delete Selected ({selectedUsers.size})
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
              />
            </th>
            <th>ID</th>
            <th>Username</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.user_id} className={selectedUsers.has(user.user_id) ? 'selected-row' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.user_id)}
                  onChange={() => handleSelectUser(user.user_id)}
                />
              </td>
              <td>{user.user_id}</td>
              <td>{user.username}</td>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </td>
              <td>{getDepartmentName(user.department_id) || 'N/A'}</td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan={8} className="no-data">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;