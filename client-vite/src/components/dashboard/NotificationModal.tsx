import React from 'react';

interface NotificationModalProps {
    onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ onClose }) => {
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
                    onClick={onClose}
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
};

export default NotificationModal;
