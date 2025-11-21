import React, { useState, useEffect } from 'react';
import AddUserModal from '../components/admin/AddUserModal';
import UserManagement from '../components/admin/UserManagement';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isAddMasterModalOpen, setIsAddMasterModalOpen] = useState(false);

  // Function to get department name based on user role
  const getDepartmentInfo = () => {
    if (user?.role === 'Admin' || user?.role === 'Methods') {
      return { displayText: '', showDepartment: false };
    } else {
      // Use the actual department name from your table
      const department = user?.department_name || 
                        user?.department || 
                        getDepartmentName(user?.department_id);
      
      return { 
        displayText: department || 'Operations',
        showDepartment: true 
      };
    }
  };

  // Helper function to map department_id to department_name
  const getDepartmentName = (departmentId: number | string | undefined) => {
    if (!departmentId) return null;
    
    const departmentMap: Record<number | string, string> = {
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

  // Add Master List Modal Component
  const AddMasterModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      pattern_code: '',
      part_name: '',
      material_grade: '',
      chemical_composition: JSON.stringify({
        c: '',
        si: '',
        mn: '',
        p: '',
        s: '',
        mg: '',
        cr: '',
        cu: ''
      }, null, 2),
      micro_structure: '',
      tensile: '',
      impact: '--',
      hardness: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleChemicalChange = (element: string, value: string) => {
      try {
        const currentChem = JSON.parse(formData.chemical_composition);
        const updatedChem = { ...currentChem, [element]: value };
        setFormData(prev => ({
          ...prev,
          chemical_composition: JSON.stringify(updatedChem, null, 2)
        }));
      } catch (e) {
        console.error('Error parsing chemical composition:', e);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        // Parse chemical composition to ensure it's valid JSON
        let chemicalComp;
        try {
          chemicalComp = JSON.parse(formData.chemical_composition);
        } catch (parseError) {
          throw new Error('Invalid chemical composition JSON format');
        }

        const payload = {
          ...formData,
          chemical_composition: chemicalComp
        };

        const response = await fetch('http://localhost:3000/api/master-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add to master list');
        }

        const result = await response.json();
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            pattern_code: '',
            part_name: '',
            material_grade: '',
            chemical_composition: JSON.stringify({
              c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: ''
            }, null, 2),
            micro_structure: '',
            tensile: '',
            impact: '--',
            hardness: ''
          });
        }, 2000);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (!isOpen) return null;

    // Parse chemical composition for the table
    let chemicalData;
    try {
      chemicalData = JSON.parse(formData.chemical_composition);
    } catch {
      chemicalData = { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' };
    }

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
      }} onClick={onClose}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          width: '95%',
          maxWidth: '1200px',
          maxHeight: '90vh',
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
            <h3 style={{ margin: 0, color: '#333', fontWeight: 700 }}>Add to Master List</h3>
            <button 
              onClick={onClose}
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

          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              marginBottom: '15px',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              marginBottom: '15px',
              fontWeight: 500
            }}>
              ✅ Successfully added to master list!
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>Basic Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Pattern Code *</label>
                  <input
                    type="text"
                    value={formData.pattern_code}
                    onChange={(e) => handleInputChange('pattern_code', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Part Name *</label>
                  <input
                    type="text"
                    value={formData.part_name}
                    onChange={(e) => handleInputChange('part_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Material Grade *</label>
                  <input
                    type="text"
                    value={formData.material_grade}
                    onChange={(e) => handleInputChange('material_grade', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Chemical Composition Table */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>Chemical Composition</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#f8f9fa' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#2950bbff', color: 'white' }}>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>C%</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Si%</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Mn%</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>P%</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>S%</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Mg%</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Cr%</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Cu%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {['c', 'si', 'mn', 'p', 's', 'mg', 'cr', 'cu'].map((element) => (
                        <td key={element} style={{ padding: '8px', textAlign: 'center' }}>
                          <input
                            type="text"
                            value={chemicalData[element] || ''}
                            onChange={(e) => handleChemicalChange(element, e.target.value)}
                            style={{
                              width: '80%',
                              padding: '5px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}
                            placeholder="--"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Properties */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>Material Properties</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Micro Structure</label>
                  <textarea
                    value={formData.micro_structure}
                    onChange={(e) => handleInputChange('micro_structure', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="e.g., Nodularity ≥85%, Pearlite 10-20%, Carbide ≤2%"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Tensile Properties</label>
                  <textarea
                    value={formData.tensile}
                    onChange={(e) => handleInputChange('tensile', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="e.g., Tensile Strength ≥450 MPa, Yield Strength ≥250 MPa, Elongation ≥18%"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Impact</label>
                  <input
                    type="text"
                    value={formData.impact}
                    onChange={(e) => handleInputChange('impact', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="--"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Hardness</label>
                  <input
                    type="text"
                    value={formData.hardness}
                    onChange={(e) => handleInputChange('hardness', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., Surface 170-230 BHN, Core 160-220 BHN"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: loading ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                {loading ? 'Adding...' : 'Add to Master List'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CustomHeader = () => (
    <header style={{
      backgroundColor: '#494949',
      padding: '15px 30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      {/* Load Poppins */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" /> 

      {/* Left side - Logo/Brand and Department Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px', fontFamily: "'Poppins', sans-serif" }}>
        <img
        src="/assets/SACL-LOGO-01.jpg"
        alt="SAKTHI AUTO COMPONENTS LTD"
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          img.onerror = null;
          img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect fill='%23FF9C00' width='48' height='48'/><text x='24' y='30' font-size='14' font-family='Poppins,Arial' fill='white' text-anchor='middle'>SACL</text></svg>";
        }}
        style={{
          width: 150,
          height: 65,
          objectFit: 'contain',
          borderRadius: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#000000',
            letterSpacing: '1px'
          }}>
            SAKTHI AUTO COMPONENTS LTD
          </div>
          <div style={{ fontSize: '12px', color: '#888787ff', fontWeight: 500 }}>
            Driving Quality & Innovation
          </div>
        </div>
        
        {/* Department and Role Info */}
        <div style={{
          padding: '8px 8px',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              padding: '4px 8px',
              backgroundColor: '#FF9C00',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500
            }}>
              {user?.role?.toUpperCase() || 'USER'}
            </span>
            {departmentInfo.showDepartment && (
              <>
                <span style={{ color: '#666' }}>|</span>
                <span style={{ color: '#555', fontWeight: 400 }}>{departmentInfo.displayText}</span>
              </>
            )}
            {!departmentInfo.showDepartment && (
              <span style={{ color: '#555', fontWeight: 400 }}>{departmentInfo.displayText}</span>
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
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLDivElement;
            target.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLDivElement;
            target.style.backgroundColor = 'transparent';
          }}
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
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              target.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              target.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#FF9C00',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#000000'
              }}>
                {user?.username || 'User'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#000000',
                fontWeight: 500
              }}>
                {user?.role || 'User Role'}
                {user?.department_name && user.role !== 'Admin' && user.role !== 'Methods' && (
                  <span style={{ fontWeight: 400 }}> • {user.department_name}</span>
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
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                  {user?.username}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px', fontWeight: 500 }}>
                  {user?.role}
                  {user?.department_name && user.role !== 'Admin' && user.role !== 'Methods' && (
                    <span style={{ fontWeight: 400 }}> • {user.department_name}</span>
                  )}
                </div>
              </div>
              <div 
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#333',
                  transition: 'background-color 0.2s',
                  fontWeight: 500
                }}
                onClick={logout}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLDivElement;
                  target.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLDivElement;
                  target.style.backgroundColor = 'transparent';
                }}
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
          <h3 style={{ margin: 0, color: '#333', fontWeight: 700 }}>Notifications</h3>
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
            marginBottom: '10px',
            fontWeight: 500
          }}>
            <div style={{ fontWeight: 700, color: '#333' }}>New Idea Submitted</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>A new idea has been submitted to your department</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px', fontWeight: 400 }}>5 min ago</div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#f0f9f0',
            borderRadius: '6px',
            borderLeft: '3px solid #28a745',
            marginBottom: '10px',
            fontWeight: 500
          }}>
            <div style={{ fontWeight: 700, color: '#333' }}>Idea Approved</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>Your idea "TEST-05" has been approved</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px', fontWeight: 400 }}>1 hour ago</div>
          </div>
          
          <div style={{
            padding: '12px',
            backgroundColor: '#fffbf0',
            borderRadius: '6px',
            borderLeft: '3px solid #ffc107',
            marginBottom: '10px',
            fontWeight: 500
          }}>
            <div style={{ fontWeight: 700, color: '#333' }}>Action Required</div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>3 ideas are pending your review</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px', fontWeight: 400 }}>2 hours ago</div>
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
            transition: 'background-color 0.2s',
            fontWeight: 500
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLButtonElement;
            target.style.backgroundColor = '#545b62';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLButtonElement;
            target.style.backgroundColor = '#6c757d';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard" style={{ backgroundColor: '#494949', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      <CustomHeader />
      <main className="dashboard-content" style={{ padding: '20px' }}>
        {showUserDetails ? (
          <UserManagement />
        ) : (
          <div className="welcome-section" style={{ backgroundColor: '#494949', padding: '20px', borderRadius: '8px' }}>
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
                  fontWeight: 700,
                  color: '#FF9C00',
                  margin: 0,
                  marginBottom: '5px'
                }}>
                  Admin Ideas Dashboard
                </h2>
                <p style={{ 
                  color: '#ffffff',
                  fontSize: '14px',
                  margin: 0,
                  fontWeight: 500
                }}>
                  Welcome back, {user?.username}!
                </p>
              </div>
              <div className="button-group" style={{ display: 'flex', gap: '15px' }}>
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
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget as HTMLButtonElement;
                        target.style.backgroundColor = '#218838';
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget as HTMLButtonElement;
                        target.style.backgroundColor = '#28a745';
                      }}
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
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget as HTMLButtonElement;
                        target.style.backgroundColor = '#e57f00';
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget as HTMLButtonElement;
                        target.style.backgroundColor = '#FF9C00';
                      }}
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
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLButtonElement;
                    target.style.backgroundColor = '#e57f00';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLButtonElement;
                    target.style.backgroundColor = '#FF9C00';
                  }}
                >
                  View User Details
                </button>
              </div>
            </div>

            {/* Overview Section */}
            <div style={{ marginBottom: '30px' }}>
              <p style={{ 
                color: '#FFFFFF',
                fontSize: '14px',
                marginBottom: '15px',
                fontWeight: 500
              }}>
                Overview of idea submissions across all departments
              </p>
              
              <div className="stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginBottom: '30px'
              }}>
                {[
                  { label: 'Total Ideas', value: '502', color: '#007bff' },
                  { label: 'Uncle Review', value: '1', color: '#ffc107' },
                  { label: 'Ongoing', value: '150', color: '#17a2b8' },
                  { label: 'Approved', value: '121', color: '#28a745' },
                  { label: 'Implemented', value: '18', color: '#6f42c1' },
                  { label: 'Expected', value: '212', color: '#fd7e14' }
                ].map((stat, index) => (
                  <div 
                    key={index}
                    className="stat-card"
                    style={{
                      backgroundColor: '#f0f0f0',
                      padding: '20px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      textAlign: 'center',
                      borderLeft: `4px solid ${stat.color}`,
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.currentTarget as HTMLDivElement;
                      target.style.transform = 'translateY(-2px)';
                      target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLDivElement;
                      target.style.transform = 'translateY(0)';
                      target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 400,
                      color: '#333',
                      marginBottom: '5px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ 
                      fontSize: '12px',
                      color: '#666',
                      fontWeight: 500
                    }}>
                      {stat.label}
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

            {/* Employee Management Section */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                fontSize: '18px',
                fontWeight: 700,
                color: '#FF9C00',
                marginBottom: '15px'
              }}>
                Employee Management
              </h3>
              <p style={{ 
                color: '#FFFFFF',
                fontSize: '14px',
                marginBottom: '15px',
                fontWeight: 500
              }}>
                Manage employee data
              </p>

              <div style={{
                backgroundColor: '#f0f0f0',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                    fontWeight: 400
                  }}
                  onFocus={(e) => {
                    const target = e.currentTarget as HTMLInputElement;
                    target.style.borderColor = '#007bff';
                  }}
                  onBlur={(e) => {
                    const target = e.currentTarget as HTMLInputElement;
                    target.style.borderColor = '#ddd';
                  }}
                />
                
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#333', fontWeight: 500 }}>All Departments</strong>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {['Al Priorities', 'Expert Excel', 'Refresh'].map((dept, index) => (
                    <div 
                      key={index}
                      style={{
                        backgroundColor: '#e9ecef',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        color: '#333',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        fontWeight: 500
                      }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget as HTMLDivElement;
                        target.style.backgroundColor = '#dde1e6';
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget as HTMLDivElement;
                        target.style.backgroundColor = '#e9ecef';
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
                color: '#FF9C00',
                marginBottom: '15px'
              }}>
                Idea Directory
              </h3>
              <p style={{ 
                color: '#FFFFFF',
                fontSize: '14px',
                marginBottom: '15px',
                fontWeight: 500
              }}>
                Showing ideas from all departments (302 levels)
              </p>

              <div style={{
                backgroundColor: 'grey',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '800px',
                    backgroundColor: 'transparent'
                  }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: '#bfbfbf',
                        borderBottom: '1px solid #999'
                      }}>
                        {['IDEA', 'DEPARTMENT', 'DATE UPLOADED', 'EMPLOYEE', 'STATUS', 'ASSIGNED TO', 'ACTIONS'].map((header, index) => (
                          <th key={index} style={{
                            padding: '12px 15px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#fff',
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
                          borderBottom: '1px solid #999',
                          backgroundColor: index % 2 === 0 ? '#d3d3d3' : '#c0c0c0',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          const target = e.currentTarget as HTMLTableRowElement;
                          target.style.backgroundColor = '#e3f2fd';
                        }}
                        onMouseLeave={(e) => {
                          const target = e.currentTarget as HTMLTableRowElement;
                          target.style.backgroundColor = index % 2 === 0 ? '#d3d3d3' : '#c0c0c0';
                        }}
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
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLButtonElement;
              target.style.backgroundColor = '#545b62';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLButtonElement;
              target.style.backgroundColor = '#6c757d';
            }}
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
      {showNotifications && <NotificationModal />}
    </div>
  );
};

export default DashboardPage;