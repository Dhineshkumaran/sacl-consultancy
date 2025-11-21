import React from 'react';
import Notification from '../components/common/Notification';
import { useAuth } from '../context/AuthContext';

const NotificationPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold',
          color: '#333',
          margin: 0
        }}>
          Notifications
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          Welcome back, {user?.username}!
        </p>
      </div>
      
      <Notification />
    </div>
  );
};

export default NotificationPage;