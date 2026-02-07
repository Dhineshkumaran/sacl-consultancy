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

      <TableContainer className="premium-table-container" sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead className="premium-table-head">
            <TableRow>
              <TableCell className="premium-table-header-cell" sx={{ width: '50px' }}>
                <Checkbox
                  checked={users.length > 0 && selectedUsers.size === users.length}
                  indeterminate={selectedUsers.size > 0 && selectedUsers.size < users.length}
                  onChange={onSelectAllUsers}
                  size="small"
                />
              </TableCell>
              <TableCell className="premium-table-header-cell">ID</TableCell>
              <TableCell className="premium-table-header-cell">Username</TableCell>
              <TableCell className="premium-table-header-cell">Full Name</TableCell>
              <TableCell className="premium-table-header-cell">Email</TableCell>
              <TableCell className="premium-table-header-cell">Role</TableCell>
              <TableCell className="premium-table-header-cell">Department</TableCell>
              <TableCell className="premium-table-header-cell">Status</TableCell>
              <TableCell className="premium-table-header-cell" style={{ textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow
                key={user.user_id}
                className="premium-table-row"
                sx={{ backgroundColor: selectedUsers.has(user.user_id) ? '#f8fafc' : 'transparent' }}
              >
                <TableCell className="premium-table-cell" sx={{ width: '50px' }}>
                  <Checkbox
                    checked={selectedUsers.has(user.user_id)}
                    onChange={() => onSelectUser(user.user_id)}
                    size="small"
                  />
                </TableCell>
                <TableCell className="premium-table-cell">{user.user_id}</TableCell>
                <TableCell className="premium-table-cell-bold">{user.username}</TableCell>
                <TableCell className="premium-table-cell">{user.full_name}</TableCell>
                <TableCell className="premium-table-cell">{user.email}</TableCell>
                <TableCell className="premium-table-cell">
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="premium-table-cell">{user.department_name || 'N/A'}</TableCell>
                <TableCell className="premium-table-cell">
                  <button
                    onClick={() => onToggleStatus(user.user_id, !!user.is_active)}
                    className={`status-pill ${user.is_active ? 'status-pill-active' : 'status-pill-inactive'}`}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
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
                <TableCell className="premium-table-cell" sx={{ textAlign: 'center' }}>
                  <IconButton onClick={() => onEdit(user)} size="small" style={{ color: '#3498db' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No users found matching the criteria
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
