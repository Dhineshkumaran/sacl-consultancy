import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface BackButtonProps {
  label?: string;
  navigateTo?: string;
  onClick?: () => void;
  variant?: 'inline' | 'fixed' | 'button';
  sx?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  navigateTo = '/dashboard',
  onClick,
  variant = 'button',
  sx = {}
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(navigateTo);
    }
  };

  if (variant === 'fixed') {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        padding: '12px 20px',
        width: '100%',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        top: 80,
        left: 0,
        right: 0,
        paddingLeft: '20px',
        zIndex: 1000,
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)'
      }}>
        <button
          onClick={handleClick}
          title={label}
          style={{
            backgroundColor: '#f0f4f8',
            color: '#2c3e50',
            border: '1px solid #ddd',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            width: '40px',
            height: '40px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e8eef7';
            e.currentTarget.style.borderColor = '#bbb';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f4f8';
            e.currentTarget.style.borderColor = '#ddd';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 20, color: '#2c3e50', fontWeight: 'bold' }} />
        </button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        title={label}
        style={{
          backgroundColor: '#f0f4f8',
          color: '#2c3e50',
          border: '1px solid #ddd',
          padding: '8px',
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          width: '40px',
          height: '40px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e8eef7';
          e.currentTarget.style.borderColor = '#bbb';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f4f8';
          e.currentTarget.style.borderColor = '#ddd';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
        }}
      >
        <ArrowBackIcon sx={{ fontSize: 20, color: '#2c3e50', fontWeight: 'bold' }} />
      </button>
    );
  }

  // Button variant (Material-UI Button)
  return (
    <Button
      variant="contained"
      onClick={handleClick}
      title={label}
      sx={{
        textTransform: 'none',
        bgcolor: '#5a6c7d',
        color: 'white',
        '&:hover': { bgcolor: '#4a5c6d' },
        minWidth: 'auto',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx
      }}
    >
      <ArrowBackIcon sx={{ fontSize: 20, fontWeight: 'bold' }} />
    </Button>
  );
};

export default BackButton;
