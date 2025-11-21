import React, { useState } from 'react';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPending, setShowPending] = useState(false);

  // Function to get department name based on user role
  const getDepartmentInfo = () => {
    if (user?.role === 'Admin' || user?.role === 'Methods') {
      return { displayText: '', showDepartment: false };
    } else {
      // Use the actual department name from your table
      const department = user?.department_name || 
                        user?.department || 
                        getDepartmentNameById(user?.department_id);
      
      return { 
        displayText: department || 'Operations',
        showDepartment: true 
      };
    }
  };

  // Helper function to map department_id to department_name
  const getDepartmentNameById = (departmentId: number) => {
    const departmentMap: { [key: number]: string } = {
      1: 'ADMIN',
      2: 'NPD METHODS', 
      3: 'NPD QC',
      4: 'SANDPLANT',
      5: 'FETTLING & VISUAL INSPECTION',
      6: 'MOULDING',
      7: 'QUALITY',
      8: 'MACHINESHOP',
      9: 'NDT QC',
      10: 'QA',
      11: 'CUSTOMER'
    };
    
    return departmentMap[departmentId] || null;
  };

  const departmentInfo = getDepartmentInfo();

  const CustomHeader = () => (
    <header style={{
      backgroundColor: 'white',
      padding: '15px 30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #e0e0e0'
    }}>
      {/* Left side - Logo/Brand and Department Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
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
            color: '#333',
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
            transition: 'background-color 0.2s'
          }} 
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
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
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
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
                color: '#333'
              }}>
                {user?.username || 'User'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>
                {user?.role || 'User Role'}
                {user?.department_name && user.role !== 'Admin' && user.role !== 'Methods' && (
                  <span> • {user.department_name}</span>
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
                transition: 'transform 0.2s'
              }}
            >
              <path d="m6 9 6 6 6-6"/>
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
                  {user?.department_name && user.role !== 'Admin' && user.role !== 'Methods' && (
                    <span> • {user.department_name}</span>
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

  // Notification Modal Component
  const NotificationModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }} onClick={() => setShowNotifications(false)}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '15px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>Notifications</h3>
          <button 
            onClick={() => setShowNotifications(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Notification Content */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fbff',
            borderRadius: '6px',
            borderLeft: '3px solid #007bff',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Task Assigned</div>
            <div style={{ fontSize: '14px', color: '#666' }}>A new task has been assigned to you</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>1 hour ago</div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#f0f9f0',
            borderRadius: '6px',
            borderLeft: '3px solid #28a745',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Task Completed</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Your task "Quality Check" has been marked as completed</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>3 hours ago</div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#fffbf0',
            borderRadius: '6px',
            borderLeft: '3px solid #ffc107',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: '600', color: '#333' }}>Update Required</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Please update your task progress</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>1 day ago</div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowNotifications(false)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#545b62')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
        >
          Close
        </button>
      </div>
    </div>
  );

  // Pending Modal Component (opened by the new "Pending Cards" button)
  const PendingModal = () => {
    // Example pending items — replace with real data or props as needed
    const pendingItems = [
      { id: 1, title: 'Pending Approval - Report #234', info: 'Awaiting manager approval' },
      { id: 2, title: 'Pending Review - QC Task', info: 'Assigned to QC team' },
      { id: 3, title: 'Pending Update - NPD Document', info: 'Requested additional info' }
    ];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }} onClick={() => setShowPending(false)}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #e0e0e0',
            paddingBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>Pending Cards</h3>
            <button 
              onClick={() => setShowPending(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {pendingItems.map(item => (
              <div key={item.id} style={{
                padding: '12px',
                backgroundColor: '#fff8e6',
                borderRadius: '6px',
                borderLeft: '4px solid #ffc107'
              }}>
                <div style={{ fontWeight: 600, color: '#333' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{item.info}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowPending(false)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#545b62')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
            >
              Close
            </button>
            <button
              onClick={() => {
                // Placeholder: navigate to pending items page or open a detailed view.
                // Replace with real navigation or action as needed.
                alert('Navigate to Pending Items view (implement navigation)');
              }}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#ffc107',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Open Pending View
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <CustomHeader />
      <main className="dashboard-content" style={{ padding: '20px' }}>
        {showUserDetails ? (
          <UserManagement />
        ) : (
          <div className="welcome-section">
            {/* Header Section */}
            <div className="welcome-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold',
                  color: '#333',
                  margin: 0,
                  marginBottom: '5px'
                }}>
                  User Dashboard
                </h2>
                <p style={{ 
                  color: '#666',
                  fontSize: '14px',
                  margin: 0
                }}>
                  Welcome back, {user?.username}! Manage your tasks and activities.
                </p>
              </div>
              <div className="button-group" style={{ display: 'flex', gap: '15px' }}>
                <button 
                  className="btn-pending-cards"
                  onClick={() => setShowPending(true)}
                  style={{
                    backgroundColor: '#ffc107',
                    color: '#333',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0ac06')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffc107')}
                >
                  ⏳ Pending Cards
                </button>

                <button 
                  className="btn-view-users"
                  onClick={() => setShowUserDetails(true)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#545b62')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
                >
                  👥 View User Details
                </button>
              </div>
            </div>

            {/* User Specific Stats Grid */}
            <div style={{ marginBottom: '30px' }}>
              <p style={{ 
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                Your personal dashboard overview
              </p>
              
              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {[
                  { label: 'My Tasks', value: '8', color: '#007bff', description: 'Assigned tasks' },
                  { label: 'Completed', value: '12', color: '#28a745', description: 'Finished tasks' },
                  { label: 'Pending', value: '3', color: '#ffc107', description: 'Awaiting review' },
                  { label: 'Ideas Submitted', value: '5', color: '#6f42c1', description: 'Your contributions' }
                ].map((stat, index) => (
                  <div 
                    key={index}
                    className="stat-card"
                    style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      textAlign: 'center',
                      borderLeft: `4px solid ${stat.color}`,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: 'bold',
                      color: '#333',
                      marginBottom: '5px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      color: '#666',
                      fontWeight: '600',
                      marginBottom: '5px'
                    }}>
                      {stat.label}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {stat.description}
                    </div>
                  </div>
                ))}
              </div>

              <hr style={{ 
                border: 'none',
                borderTop: '1px solid #dee2e6',
                margin: '30px 0'
              }} />
            </div>

            {/* Quick Actions Section */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px'
              }}>
                Quick Actions
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                {[
                  { icon: '📋', title: 'My Tasks', description: 'View and manage your assigned tasks' },
                  { icon: '👤', title: 'My Profile', description: 'Update your personal information' },
                  { icon: '💡', title: 'Submit Idea', description: 'Share your ideas and suggestions' },
                  { icon: '📊', title: 'My Reports', description: 'View your performance reports' }
                ].map((action, index) => (
                  <div 
                    key={index}
                    style={{
                      backgroundColor: 'white',
                      padding: '25px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #e0e0e0',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>{action.icon}</div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{action.title}</h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {showUserDetails && (
          <button 
            className="btn-back"
            onClick={() => setShowUserDetails(false)}
            style={{ 
              marginTop: '20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#545b62')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
          >
            ← Back to Dashboard
          </button>
        )}
      </main>

      {/* Notification Modal */}
      {showNotifications && <NotificationModal />}

      {/* Pending Modal */}
      {showPending && <PendingModal />}
    </div>
  );
};

export default UserDashboard;