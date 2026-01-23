import React, { useState } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
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
    const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

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
                width: { xs: '100%', sm: 280 },
                flexShrink: 0,
                bgcolor: '#FFFFFF',
                borderRight: { xs: 'none', sm: '2px solid #E67E22' },
                borderBottom: { xs: '2px solid #E67E22', sm: 'none' },
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'column' },
                height: { xs: 'auto', sm: '100%' },
                overflowX: { xs: 'auto', sm: 'visible' },
                overflowY: { xs: 'visible', sm: 'auto' },
            }}
        >
            <List sx={{
                px: 0,
                pt: { xs: 0, sm: 2 },
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'column' },
                gap: { xs: 0.5, sm: 0 },
                width: { xs: 'auto', sm: '100%' },
                minWidth: { xs: 'min-content', sm: '100%' },
            }}>
                {visibleMenuItems.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                        <ListItem
                            key={item.id}
                            disablePadding
                            sx={{
                                mb: { xs: 0, sm: 0.5 },
                                px: { xs: 0.5, sm: 1 },
                                minWidth: { xs: '140px', sm: 'auto' },
                                flexShrink: 0,
                            }}
                        >
                            <ListItemButton
                                onClick={() => onViewChange(item.view)}
                                sx={{
                                    borderRadius: 1,
                                    borderLeft: { xs: 'none', sm: isActive ? '4px solid #E67E22' : '4px solid transparent' },
                                    borderBottom: { xs: isActive ? '3px solid #E67E22' : '3px solid transparent', sm: 'none' },
                                    bgcolor: isActive ? '#FFF3E0' : 'transparent',
                                    color: isActive ? '#E67E22' : '#555',
                                    '&:hover': {
                                        bgcolor: '#FFF3E0',
                                        borderLeftColor: { xs: 'transparent', sm: '#E67E22' },
                                        borderBottomColor: { xs: '#E67E22', sm: 'transparent' }
                                    },
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'column' },
                                    alignItems: { xs: 'center', sm: 'flex-start' },
                                    justifyContent: { xs: 'center', sm: 'flex-start' },
                                    py: { xs: 1.2, sm: 1.75 },
                                    px: { xs: 1.75, sm: 2.25 },
                                    transition: 'all 0.2s ease',
                                    textAlign: { xs: 'center', sm: 'left' },
                                    whiteSpace: { xs: 'nowrap', sm: 'normal' },
                                    minHeight: { xs: '56px', sm: 'auto' },
                                    minWidth: { xs: '56px', sm: 'auto' }
                                }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: { xs: 0, sm: 0.5 },
                                    width: '100%',
                                    justifyContent: { xs: 'center', sm: 'flex-start' },
                                    flexDirection: { xs: 'column', sm: 'row' }
                                }}>
                                    <ListItemIcon sx={{
                                        minWidth: { xs: 24, sm: 32 },
                                        color: isActive ? '#E67E22' : '#888',
                                        mr: { xs: 0, sm: 1 },
                                        mb: { xs: 0.5, sm: 0 }
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: isActive ? 700 : 600,
                                            lineHeight: 1.2,
                                            fontSize: { xs: '11px', sm: '14px' },
                                            display: { xs: 'block', sm: 'block' }
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        ml: { xs: 0, sm: '40px' },
                                        opacity: 0.7,
                                        display: { xs: 'none', sm: 'block' },
                                        lineHeight: 1.2,
                                        fontSize: '0.7rem',
                                        color: '#888'
                                    }}
                                >
                                    {item.subLabel}
                                </Typography>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{
                mt: { xs: 0, sm: 'auto' },
                ml: { xs: 'auto', sm: 0 },
                p: 1,
                borderTop: { xs: 'none', sm: '2px solid #E67E22' },
                borderLeft: { xs: '2px solid #E67E22', sm: 'none' },
                minWidth: { xs: 'fit-content', sm: '100%' }
            }}>
                <ListItemButton
                    onClick={() => setOpenLogoutDialog(true)}
                    sx={{
                        borderRadius: 1,
                        color: '#d32f2f',
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 1.5, sm: 2 },
                        '&:hover': {
                            bgcolor: '#FFEBEE',
                        },
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'center',
                        justifyContent: { xs: 'center', sm: 'flex-start' },
                        gap: { xs: 0.5, sm: 1 }
                    }}
                >
                    <ListItemIcon sx={{
                        color: '#d32f2f',
                        minWidth: { xs: 24, sm: 40 },
                        mb: { xs: 0.25, sm: 0 }
                    }}>
                        <LogoutIcon sx={{ fontSize: { xs: '20px', sm: '24px' } }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Logout"
                        sx={{
                            '& .MuiTypography-root': {
                                fontWeight: 600,
                                fontSize: { xs: '11px', sm: '14px' }
                            }
                        }}
                    />
                </ListItemButton>
            </Box>

            {/* Logout Confirmation Dialog */}
            <Dialog
                open={openLogoutDialog}
                onClose={() => setOpenLogoutDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        maxWidth: { xs: 'calc(100% - 32px)', sm: '400px' }
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#333', fontSize: { xs: '18px', sm: '20px' }, pb: { xs: 1.5, sm: 2 } }}>
                    Confirm Logout
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#666', mt: 1, fontSize: { xs: '14px', sm: '15px' } }}>
                        Are you sure you want to logout?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                    <Button
                        onClick={() => setOpenLogoutDialog(false)}
                        variant="outlined"
                        sx={{
                            color: '#666',
                            borderColor: '#ddd',
                            py: { xs: 1.2, sm: 1 },
                            px: { xs: 2, sm: 3 },
                            minHeight: { xs: '44px', sm: 'auto' },
                            fontSize: { xs: '14px', sm: '14px' },
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': {
                                borderColor: '#999',
                                bgcolor: '#f5f5f5'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            setOpenLogoutDialog(false);
                            logout();
                        }}
                        variant="contained"
                        sx={{
                            bgcolor: '#d32f2f',
                            py: { xs: 1.2, sm: 1 },
                            px: { xs: 2, sm: 3 },
                            minHeight: { xs: '44px', sm: 'auto' },
                            fontSize: { xs: '14px', sm: '14px' },
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': {
                                bgcolor: '#b71c1c'
                            }
                        }}
                    >
                        Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Sidebar;
