import React, { useState } from 'react';
import AddUserModal from '../components/admin/AddUserModal';
import AddMasterModal from '../components/admin/AddMasterModal';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import NotificationModal from '../components/dashboard/NotificationModal';
import StatsGrid from '../components/dashboard/StatsGrid';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { ADMIN_IDEAS_STATS } from '../data/dashboardData';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAddMasterModalOpen, setIsAddMasterModalOpen] = useState(false);

  const departmentInfo = getDepartmentInfo(user);

  return (
    <div className="dashboard" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      {/* Load Poppins Font Global */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <Header
        setShowNotifications={setShowNotifications}
        departmentInfo={departmentInfo}
        customStyle={{ backgroundColor: '#ffffff', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        textColor="#333"
        logoTextColors={{ title: '#000000', subtitle: '#666' }}
      />

      <main className="dashboard-content" style={{ padding: '20px' }}>
        {showUserDetails ? (
          <UserManagement />
        ) : (
          <div className="welcome-section" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>

            <WelcomeSection
              title="Admin Ideas Dashboard"
              description={`Welcome back, ${user?.username}!`}
              titleColor="#333"
              descriptionColor="#666"
            >
              {user?.role === 'Admin' && (
                <>
                  <button
                    className="btn-add-master"
                    onClick={() => setIsAddMasterModalOpen(true)}
                    style={{
                      backgroundImage: 'none',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '14px',
                      transition: 'background-color 0.2s',
                      boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                  >
                    Add to Master List
                  </button>
                  <button
                    className="btn-add-user"
                    onClick={() => setIsAddUserModalOpen(true)}
                    style={{
                      backgroundImage: 'none',
                      backgroundColor: '#FF9C00',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '14px',
                      transition: 'background-color 0.2s',
                      boxShadow: '0 2px 4px rgba(255, 156, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e57f00')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF9C00')}
                  >
                    Add User Profiles
                  </button>
                </>
              )}
              <button
                className="btn-view-users"
                onClick={() => setShowUserDetails(true)}
                style={{
                  backgroundImage: 'none',
                  backgroundColor: '#FF9C00',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(255, 156, 0, 0.2)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e57f00')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF9C00')}
              >
                View User Details
              </button>

              <button
                className="btn-view-trials"
                onClick={() => window.location.href = '/trials'} // Using href for simpler nav outside current context if needed, or better use navigate() if possible but this is a quick edit
                style={{
                  backgroundImage: 'none',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  marginLeft: '10px',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(111, 66, 193, 0.2)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#59359a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6f42c1')}
              >
                View All Trials
              </button>
            </WelcomeSection>

            {/* Overview Section */}
            <div style={{ marginBottom: '30px' }}>
              <StatsGrid stats={ADMIN_IDEAS_STATS} />

              <hr style={{
                border: 'none',
                borderTop: '1px solid #eee',
                margin: '30px 0'
              }} />
            </div>

            {/* Employee Management Section */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#333',
                marginBottom: '15px'
              }}>
                Employee Management
              </h3>
              <p style={{
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px',
                fontWeight: 500
              }}>
                Manage employee data
              </p>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #eee'
              }}>
                <input
                  type="text"
                  placeholder="Search ideas by title or ideology..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontWeight: 400,
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#007bff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
                />

                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#333', fontWeight: 500 }}>All Departments</strong>
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {['Al Priorities', 'Expert Excel', 'Refresh'].map((dept, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: 'white',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        color: '#333',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: 500,
                        border: '1px solid #ddd'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e9ecef';
                        e.currentTarget.style.borderColor = '#ccc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#ddd';
                      }}
                    >
                      {dept}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Idea Directory Section */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#333',
                marginBottom: '15px'
              }}>
                Idea Directory
              </h3>
              <p style={{
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px',
                fontWeight: 500
              }}>
                Showing ideas from all departments (302 levels)
              </p>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #eee',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '800px'
                  }}>
                    <thead>
                      <tr style={{
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #eee'
                      }}>
                        {['IDEA', 'DEPARTMENT', 'DATE UPLOADED', 'EMPLOYEE', 'STATUS', 'ASSIGNED TO', 'ACTIONS'].map((header, index) => (
                          <th key={index} style={{
                            padding: '12px 15px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#666',
                            textTransform: 'uppercase'
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { idea: 'TEST-05 Read Only', department: '[legal]', date: '2025-10-30', employee: 'Pestablishment', status: 'Implemented', assigned: 'Martin Gusepong 2', actions: '✅ 2025-10-30' },
                        { idea: 'TEST-04 Read Only', department: '[legal]', date: '2025-10-30', employee: 'Pestablishment', status: 'Rejected', assigned: 'Martin Gusepong 2', actions: '✅ 2025-10-30' },
                        { idea: 'test-3 Read Only', department: '[legal]', date: '2025-10-30', employee: 'Pestablishment', status: 'Rejected', assigned: 'Martin Gusepong 2', actions: '✅ 2025-10-30' },
                        { idea: 'test-002 Read Only', department: '[legal]', date: '2025-10-30', employee: 'Pestablishment', status: 'Rejected', assigned: 'Martin Gusepong 2', actions: '✅ 2025-10-30' }
                      ].map((row, index) => (
                        <tr key={index} style={{
                          borderBottom: '1px solid #eee',
                          backgroundColor: index % 2 === 0 ? 'white' : '#fcfcfc',
                          transition: 'background-color 0.2s'
                        }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fcfcfc')}
                        >
                          <td style={{ padding: '12px 15px', fontSize: '14px' }}>
                            <div style={{ fontWeight: 500, color: '#333' }}>{row.idea}</div>
                            <div style={{ fontSize: '12px', color: '#666', fontWeight: 400 }}>Mastery: &lt;sudity&gt;e{1000 + index}</div>
                          </td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333', fontWeight: 400 }}>{row.department}</td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333', fontWeight: 400 }}>{row.date}</td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333', fontWeight: 400 }}>
                            <div style={{ fontWeight: 400 }}>{row.employee}</div>
                            <div style={{ fontSize: '12px', color: '#666', fontWeight: 400 }}>ID: 102</div>
                          </td>
                          <td style={{ padding: '12px 15px', fontSize: '14px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 400,
                              backgroundColor: row.status === 'Implemented' ? '#d4edda' : '#f8d7da',
                              color: row.status === 'Implemented' ? '#155724' : '#721c24'
                            }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333', fontWeight: 400 }}>{row.assigned}</td>
                          <td style={{ padding: '12px 15px', fontSize: '14px', color: '#333', fontWeight: 400 }}>{row.actions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              transition: 'background-color 0.2s',
              fontWeight: 500
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#545b62')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
          >
            ← Back to Dashboard
          </button>
        )}
      </main>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserCreated={() => {
          setShowUserDetails(true);
          console.log('User created successfully');
        }}
      />

      {/* Add Master List Modal */}
      <AddMasterModal
        isOpen={isAddMasterModalOpen}
        onClose={() => setIsAddMasterModalOpen(false)}
      />

      {/* Notification Modal */}
      {showNotifications && <NotificationModal onClose={() => setShowNotifications(false)} />}
    </div>
  );
};

export default DashboardPage;