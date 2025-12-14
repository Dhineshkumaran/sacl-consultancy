import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    setShowNotifications: (show: boolean) => void;
    departmentInfo: {
        displayText: string;
        showDepartment: boolean;
    };
    customStyle?: React.CSSProperties;
    textColor?: string;
    logoTextColors?: {
        title: string;
        subtitle: string;
    };
}

const Header: React.FC<HeaderProps> = ({
    setShowNotifications,
    departmentInfo,
    customStyle,
    textColor,
    logoTextColors
}) => {
    const { user, logout } = useAuth();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Default colors
    const defaultTextColor = '#333';
    const defaultTitleColor = '#333';
    const defaultSubtitleColor = '#666';

    const currentTextColor = textColor || defaultTextColor;
    const titleColor = logoTextColors?.title || defaultTitleColor;
    const subtitleColor = logoTextColors?.subtitle || defaultSubtitleColor;

    return (
        <header style={{
            backgroundColor: 'white',
            padding: '15px 30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0',
            ...customStyle // Apply custom styles
        }}>
            {/* Left side - Logo/Brand and Department Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: titleColor,
                    letterSpacing: '1px'
                }}>
                    SAKTHI AUTO COMPONENTS LTD
                </div>

                {/* Department and Role Info */}
                <div style={{
                    padding: '8px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#333', // Keep this badge dark for readability usually, or parameterize if needed. 
                        // But wait, if the header is dark, this badge might need to be visible. 
                        // The badge background is light (#f8f9fa). So text should be dark (#333).
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}>
                            {user?.role?.toUpperCase() || 'USER'}
                        </span>
                        {/* Only show department separator and name for non-Admin/Methods users */}
                        {departmentInfo.showDepartment && departmentInfo.displayText && (
                            <>
                                <span style={{ color: '#666' }}>|</span>
                                <span style={{ color: '#555' }}>{departmentInfo.displayText}</span>
                            </>
                        )}
                        {/* Fallback if showDepartment is false but we still want to show displayText (like 'Operations' in HODDashboard logic) */}
                        {!departmentInfo.showDepartment && departmentInfo.displayText && (
                            <span style={{ color: '#555' }}>{departmentInfo.displayText}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right side - Icons and Profile */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}>
                {/* Notification Icon */}
                <div
                    style={{
                        position: 'relative',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s',
                        color: currentTextColor
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')} // adjust hover for dark mode compatibility
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    onClick={() => setShowNotifications(true)}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <div style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ff4444',
                        borderRadius: '50%'
                    }}></div>
                </div>

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
                        <div style={{ textAlign: 'left' }}>
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
    );
};

export default Header;
