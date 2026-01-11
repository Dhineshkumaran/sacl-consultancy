import React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface DropdownButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isOpen: boolean;
  color?: 'purple' | 'orange';
  marginLeft?: string;
}

const DropdownButton: React.FC<DropdownButtonProps> = ({ 
  label, 
  onClick, 
  isOpen, 
  color = 'purple',
  marginLeft = '0'
}) => {
  const bgColor = color === 'purple' ? '#9c27b0' : '#FF9C00';
  const hoverColor = color === 'purple' ? '#7b1fa2' : '#e57f00';
  const shadowColor = color === 'purple' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(255, 156, 0, 0.2)';

  return (
    <button
      onClick={onClick}
      style={{
        backgroundImage: 'none',
        backgroundColor: bgColor,
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '14px',
        marginLeft: marginLeft,
        transition: 'background-color 0.2s',
        boxShadow: `0 2px 4px ${shadowColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
    >
      {label}
      <ExpandMoreIcon sx={{ 
        transition: 'transform 0.3s ease-in-out', 
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        fontSize: '20px'
      }} />
    </button>
  );
};

export default DropdownButton;
