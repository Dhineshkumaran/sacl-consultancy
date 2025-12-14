import React from 'react';

interface StatItem {
    label: string;
    value: string;
    color: string;
    description?: string;
}

interface StatsGridProps {
    stats: StatItem[];
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    return (
        <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
        }}>
            {stats.map((stat, index) => (
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
                    {stat.description && (
                        <div style={{
                            fontSize: '12px',
                            color: '#999'
                        }}>
                            {stat.description}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;
