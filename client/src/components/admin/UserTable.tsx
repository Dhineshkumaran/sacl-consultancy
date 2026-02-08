import React, { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import './UserTable.css';
import {
  IconButton, Checkbox, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Typography,
  Box, FormControl, InputLabel, Select, MenuItem, Button, TextField, InputAdornment, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import LoadingState from '../common/LoadingState';

interface UserTableProps {
  users: User[];
  loading?: boolean;
  onToggleStatus: (userId: number, currentStatus: boolean) => void;
  onEdit: (user: User) => void;
  selectedUsers?: Set<number>;
  onSelectUser?: (userId: number) => void;
  onSelectAllUsers?: () => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading = false,
  onToggleStatus,
  onEdit,
  selectedUsers = new Set(),
  onSelectUser = () => { },
  onSelectAllUsers = () => { }
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  // Filter users based on selected filters and search term
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesDepartment = !departmentFilter ||
        user.department_id?.toString() === departmentFilter;
      const matchesSearch = !searchTerm ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesDepartment && matchesSearch;
    });
  }, [users, roleFilter, departmentFilter, searchTerm]);

  const clearFilters = () => {
    setRoleFilter('');
    setDepartmentFilter('');
    setSearchTerm('');
  };

  return (
    <Box className="user-table-container" sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
      {/* Filter Section */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              bgcolor: 'white',
              width: { xs: '100%', sm: 260 }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.1rem' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'white' }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              {roleOptions.map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180, bgcolor: 'white' }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={departmentFilter}
              label="Department"
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departmentOptions.map(dept => (
                <MenuItem key={dept.id} value={dept.id.toString()}>{dept.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(roleFilter || departmentFilter || searchTerm) && (
            <Button
              onClick={clearFilters}
              size="small"
              color="error"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Clear
            </Button>
          )}
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Showing {filteredUsers.length} of {users.length} users
        </Typography>
      </Box>

      <TableContainer
        className="premium-table-container"
        sx={{
          maxHeight: 'calc(100vh - 250px)',
          overflow: 'auto',
          position: 'relative',
          backgroundColor: '#fff',
          '& .MuiTable-root': {
            borderCollapse: 'separate',
            borderSpacing: 0,
          }
        }}
      >
        {loading ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(255,255,255,0.7)',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            borderRadius: '12px',
            backdropFilter: 'blur(2px)'
          }}>
            <LoadingState message="Loading users..." />
          </Box>
        ) : null}
        <Table size="small" stickyHeader sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
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
                sx={{ backgroundColor: selectedUsers.has(user.user_id) ? '#f0f9ff' : 'transparent' }}
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
                  <span className={`status-pill ${user.role === 'Admin' ? 'status-pill-error' : 'status-pill-info'}`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="premium-table-cell">{user.department_name || 'N/A'}</TableCell>
                <TableCell className="premium-table-cell">
                  <span
                    onClick={() => onToggleStatus(user.user_id, !!user.is_active)}
                    className={`status-pill ${user.is_active ? 'status-pill-active' : 'status-pill-inactive'}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {user.is_active ? (
                      <><CheckCircleIcon sx={{ fontSize: '13px' }} /> Active</>
                    ) : (
                      <><CancelIcon sx={{ fontSize: '13px' }} /> Inactive</>
                    )}
                  </span>
                </TableCell>
                <TableCell className="premium-table-cell" sx={{ textAlign: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(user)}
                    sx={{
                      color: '#3498db',
                      '&:hover': { bgcolor: '#ebf5fb' }
                    }}
                  >
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
      <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.secondary', textAlign: 'center', mt: 1 }}>
        Swipe to view more
      </Typography>
    </Box>
  );
};

export default UserTable;
