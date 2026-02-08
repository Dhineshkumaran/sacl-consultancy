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
    Button,
    Drawer,
    useMediaQuery
} from '@mui/material';
import { appTheme } from '../../theme/appTheme';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TaskIcon from '@mui/icons-material/Task';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen = false, onClose }) => {
    const isMobile = useMediaQuery(appTheme.breakpoints.down('md'));
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
        },
        {
            id: 'recycle-bin',
            label: 'Recycle Bin',
            subLabel: 'Recover deleted cards & reports',
            icon: <DeleteSweepIcon />,
            view: 'recycle-bin' as const,
            show: user?.role === 'Admin'
        }
    ];

    const visibleMenuItems = menuItems.filter(item => item.show);

    const sidebarContent = (
        <Box
            sx={{
                width: 280,
                flexShrink: 0,
                bgcolor: '#FFFFFF',
                borderRight: '2px solid #E67E22',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            <List sx={{ px: 0, pt: 2 }}>
                {visibleMenuItems.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                        <ListItem key={item.id} disablePadding sx={{ mb: 1, px: 1 }}>
                            <ListItemButton
                                onClick={() => onViewChange(item.view)}
                                sx={{
                                    borderRadius: 1,
                                    borderLeft: isActive ? '4px solid #E67E22' : '4px solid transparent',
                                    bgcolor: isActive ? '#FFF3E0' : 'transparent',
                                    color: isActive ? '#E67E22' : '#555',
                                    '&:hover': {
                                        bgcolor: '#FFF3E0',
                                        borderLeftColor: '#E67E22',
                                    },
                                    py: 2.25,
                                    px: 2.25,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#E67E22' : '#888', mr: 1.5 }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: isActive ? 700 : 600, lineHeight: 1.1, mb: 0.5 }}>
                                            {item.label}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: isActive ? '#E67E22' : '#999', lineHeight: 1, opacity: isActive ? 0.9 : 0.8 }}>
                                            {item.subLabel}
                                        </Typography>
                                    </Box>
                                </Box>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ mt: 'auto', p: 1, borderTop: '2px solid #E67E22' }}>
                <ListItemButton
                    onClick={() => setOpenLogoutDialog(true)}
                    sx={{
                        borderRadius: 1,
                        color: '#d32f2f',
                        py: 1.5,
                        px: 2,
                        '&:hover': { bgcolor: '#FFEBEE' },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <ListItemIcon sx={{ color: '#d32f2f', minWidth: 40 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <>
            {isMobile ? (
                <Drawer
                    anchor="left"
                    open={isOpen}
                    onClose={onClose}
                    PaperProps={{ sx: { width: 280 } }}
                >
                    {sidebarContent}
                </Drawer>
            ) : (
                sidebarContent
            )}

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
        </>
    );
};

export default Sidebar;
