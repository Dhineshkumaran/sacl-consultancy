import React, { useState } from 'react';
import { Paper, Chip, Typography, Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/appTheme';

interface HeaderProps {
    setShowNotifications?: (show: boolean) => void;
    departmentInfo: {
        displayText: string;
        showDepartment: boolean;
        name?: string;
    };
    customStyle?: React.CSSProperties;
    textColor?: string;
    logoTextColors?: {
        title: string;
        subtitle: string;
    };
    setShowProfile?: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
    setShowNotifications,
    departmentInfo,
    customStyle,
    textColor,
    logoTextColors,
    setShowProfile
}) => {
    const { user, logout } = useAuth();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Default colors
    const defaultTextColor = '#333';

    const currentTextColor = textColor || defaultTextColor;

    return (
        <>
            <style>
                {`
                    .dashboard-header {
                        background-color: white;
                        padding: 15px 30px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #e0e0e0;
                        flex-wrap: wrap;
                        gap: 15px;
                        position: relative;
                        z-index: 1200;
                    }
                    .header-left {
                        display: flex;
                        align-items: center;
                        gap: 24px;
                        flex-wrap: wrap;
                    }
                    .header-right {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                    }
                    .company-name-text {
                        font-weight: 700;
                        letter-spacing: 1px;
                    }
                    @media (max-width: 900px) {
                        .dashboard-header {
                            padding: 12px 20px;
                        }
                        .company-name-text {
                            font-size: 14px !important;
                        }
                        .header-dept-info {
                            display: none !important;
                        }
                    }
                    @media (max-width: 600px) {
                        .dashboard-header {
                            padding: 10px 15px;
                        }
                        .company-name-text {
                            display: none !important;
                        }
                        .header-logo {
                            height: 32px !important;
                        }
                        .profile-username {
                            display: none !important;
                        }
                    }
                `}
            </style>
            <header className="dashboard-header" style={customStyle}>
                {/* Left side - Logo/Brand and Department Info */}
                <Box className="header-left">
                    {/* SACL Logo Section */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <Box
                            component="img"
                            src="/assets/SACL-LOGO-01.jpg"
                            alt="SACL Logo"
                            className="header-logo"
                            sx={{
                                height: 40,
                                width: "auto",
                                borderRadius: 1,
                            }}
                        />
                        <Typography
                            variant="h6"
                            className="company-name-text"
                            sx={{
                                fontWeight: 700,
                                color: COLORS.primary,
                                letterSpacing: 1,
                            }}
                        >
                            SAKTHI AUTO COMPONENT LIMITED
                        </Typography>
                    </Box>

                    {/* Department and Role Info */}
                    <Paper
                        elevation={1}
                        className="header-dept-info"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e0e0e0'
                        }}
                    >
                        <Chip
                            label={user?.role?.toUpperCase() || 'USER'}
                            size="small"
                            sx={{
                                backgroundColor: COLORS.primary,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                            }}
                        />
                        {/* Only show department separator and name for non-Admin/Methods users */}
                        {departmentInfo.showDepartment && departmentInfo.displayText && (
                            <>
                                <Typography sx={{ color: '#666', fontSize: '0.875rem' }}>|</Typography>
                                <Typography sx={{ color: '#555', fontSize: '0.875rem', fontWeight: 500 }}>
                                    {departmentInfo.displayText}
                                </Typography>
                            </>
                        )}
                        {/* Fallback if showDepartment is false but we still want to show displayText */}
                        {!departmentInfo.showDepartment && departmentInfo.displayText && (
                            <Typography sx={{ color: '#555', fontSize: '0.875rem', fontWeight: 500 }}>
                                {departmentInfo.displayText}
                            </Typography>
                        )}
                    </Paper>
                </Box>

                {/* Right side - Icons and Profile */}
                <div className="header-right">
                    {/* Profile Section */}
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                transition: 'background-color 0.2s'
                            }}
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#007bff',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}>
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="profile-username" style={{ textAlign: 'left' }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: currentTextColor
                                }}>
                                    {user?.username || 'User'}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: currentTextColor,
                                    opacity: 0.8
                                }}>
                                    {user?.role || 'User Role'}
                                    {departmentInfo.showDepartment && departmentInfo.displayText && (
                                        <span> • {departmentInfo.displayText}</span>
                                    )}
                                </div>
                            </div>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                    color: currentTextColor
                                }}
                            >
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </div>

                        {/* Profile Dropdown */}
                        {showProfileDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: '0',
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                minWidth: '200px',
                                zIndex: 1000,
                                marginTop: '5px'
                            }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f0f0f0'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                        {user?.username}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                        {user?.role}
                                        {departmentInfo.showDepartment && departmentInfo.displayText && (
                                            <span> • {departmentInfo.displayText}</span>
                                        )}
                                    </div>
                                </div>
                                {setShowProfile && (
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#333',
                                            transition: 'background-color 0.2s',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                        onClick={() => {
                                            setShowProfile(true);
                                            setShowProfileDropdown(false);
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        👤 View Profile
                                    </div>
                                )}
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: '#333',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onClick={logout}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    🚪 Logout
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;
