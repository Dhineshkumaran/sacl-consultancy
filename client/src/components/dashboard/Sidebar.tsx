import React, { useState } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TaskIcon from '@mui/icons-material/Task';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
    const { user, logout } = useAuth();

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            subLabel: 'Overview & Statistics',
            icon: <DashboardIcon />,
            view: 'dashboard' as const,
            show: true
        },
        {
            id: 'pending-cards',
            label: 'Pending Cards',
            subLabel: 'Actions waiting for you',
            icon: <PendingActionsIcon />,
            view: 'pending-cards' as const,
            show: (user?.role === 'User' || user?.role === 'HOD') && !(user?.department_id == 2 && user?.role == 'User')
        },
        {
            id: 'completed-trials',
            label: 'Completed Trials',
            subLabel: 'History of trials',
            icon: <TaskIcon />,
            view: 'completed-trials' as const,
            show: (user?.role === 'User' || user?.role === 'HOD') && !(user?.department_id == 2 && user?.role == 'User')
        },
        {
            id: 'manage-trials',
            label: 'Manage Trials',
            subLabel: 'View & Edit all trials',
            icon: <LibraryBooksIcon />,
            view: 'manage-trials' as const,
            show: user?.role === 'Admin' || user?.department_id == 2 || user?.department_id == 3
        },
        {
            id: 'consolidated-reports',
            label: 'Consolidated Reports',
            subLabel: 'View full trial history',
            icon: <LibraryBooksIcon />,
            view: 'consolidated-reports' as const,
            show: user?.role === 'Admin' || user?.department_id == 2 || user?.department_id == 3
        },
        {
            id: 'master-list',
            label: 'Master List',
            subLabel: 'Manage pattern codes',
            icon: <ListAltIcon />,
            view: 'master-list' as const,
            show: user?.role === 'Admin'
        },
        {
            id: 'employees',
            label: 'User Management',
            subLabel: 'Manage users & roles',
            icon: <PeopleIcon />,
            view: 'employees' as const,
            show: user?.role === 'Admin'
        }
    ];

    const visibleMenuItems = menuItems.filter(item => item.show);

    return (
        <Box
            sx={{
                width: 280,
                flexShrink: 0,
                bgcolor: '#f5f5f5', // Light grey background
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                pt: 2
            }}
        >
            <List sx={{ px: 2 }}>
                {visibleMenuItems.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 2 }}>
                            <ListItemButton
                                onClick={() => onViewChange(item.view)}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: isActive ? '#E67E22' : 'transparent', // Orange active
                                    color: isActive ? 'white' : 'text.secondary',
                                    '&:hover': {
                                        bgcolor: isActive ? '#d35400' : 'rgba(0, 0, 0, 0.05)',
                                    },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    py: 2,
                                    px: 3
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, width: '100%' }}>
                                    <ListItemIcon sx={{
                                        minWidth: 32,
                                        color: isActive ? 'white' : 'inherit',
                                        mr: 1
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: isActive ? 700 : 500,
                                            lineHeight: 1.2
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        ml: '40px', // Align with text start (32px icon + 8px mr)
                                        opacity: 0.9,
                                        display: 'block',
                                        lineHeight: 1.2,
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {item.subLabel}
                                </Typography>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid #e0e0e0' }}>
                <ListItemButton
                    onClick={logout}
                    sx={{
                        borderRadius: 2,
                        color: 'text.secondary',
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.05)',
                        }
                    }}
                >
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItemButton>
            </Box>
        </Box>
    );
};

export default Sidebar;
