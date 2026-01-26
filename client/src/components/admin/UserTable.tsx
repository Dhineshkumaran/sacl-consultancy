import React, { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import './UserTable.css';
import { IconButton, Checkbox, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface UserTableProps {
  users: User[];
  onToggleStatus: (userId: number, currentStatus: boolean) => void;
  onEdit: (user: User) => void;
  selectedUsers?: Set<number>;
  onSelectUser?: (userId: number) => void;
  onSelectAllUsers?: () => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onToggleStatus,
  onEdit,
  selectedUsers = new Set(),
  onSelectUser = () => { },
  onSelectAllUsers = () => { }
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  // Get unique roles from users
  const roleOptions = useMemo(() => {
    const roles = [...new Set(users.map(user => user.role))];
    return roles.sort();
  }, [users]);

  // Get unique departments from users
  const departmentOptions = useMemo(() => {
    const uniqueDepts = new Map();
    users.forEach(user => {
      if (user.department_id && user.department_name) {
        uniqueDepts.set(user.department_id, user.department_name);
      }
    });

    return Array.from(uniqueDepts.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
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

        <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>

      <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto', marginTop: '20px' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ width: '50px' }}>
                <Checkbox
                  checked={users.length > 0 && selectedUsers.size === users.length}
                  indeterminate={selectedUsers.size > 0 && selectedUsers.size < users.length}
                  onChange={onSelectAllUsers}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow
                key={user.user_id}
                sx={{ backgroundColor: selectedUsers.has(user.user_id) ? '#f0f0f0' : 'transparent' }}
              >
                <TableCell sx={{ width: '50px' }}>
                  <Checkbox
                    checked={selectedUsers.has(user.user_id)}
                    onChange={() => onSelectUser(user.user_id)}
                  />
                </TableCell>
                <TableCell>{user.user_id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>{user.department_name || 'N/A'}</TableCell>
                <TableCell>
                  <button
                    onClick={() => onToggleStatus(user.user_id, !!user.is_active)}
                    className={`status-toggle ${user.is_active ? 'active' : 'inactive'}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: user.is_active ? '#e6f4ea' : '#fce8e6',
                      color: user.is_active ? '#1e7e34' : '#c62828',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      margin: '0 auto'
                    }}
                  >
                    {user.is_active ? (
                      <><CheckCircleIcon sx={{ fontSize: '14px' }} /> Active</>
                    ) : (
                      <><CancelIcon sx={{ fontSize: '14px' }} /> Inactive</>
                    )}
                  </button>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <IconButton onClick={() => onEdit(user)} size="small" style={{ color: '#1976d2' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default UserTable;
