import React from 'react';

interface ActionItem {
    icon: string;
    title: string;
    description: string;
    onClick?: () => void;
}

interface QuickActionsProps {
    actions: ActionItem[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
    return (
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
                {actions.map((action, index) => (
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
                        onClick={action.onClick}
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
    );
};

export default QuickActions;
