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

    const getBorderColor = (label: string): string => {
        const l = label.toLowerCase();
        if (l.includes('total')) return '#2C3E50';
        if (l.includes('ongoing')) return '#2C3E50';
        if (l.includes('approved')) return '#2C3E50';
        return '#95A5A6';
    };

    return (
        <>
            <style>
                {`
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 12px;
                        margin-bottom: 24px;
                    }
                    @media (max-width: 640px) {
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                            margin-bottom: 16px;
                        }
                    }
                    @media (max-width: 480px) {
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 8px;
                            margin-bottom: 12px;
                        }
                    }
                    .stat-card {
                        background-color: white;
                        padding: 12px;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                        text-align: center;
                        transition: all 0.2s ease;
                        border-left-width: 4px;
                        border-left-style: solid;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: auto;
                        min-height: 80px;
                    }
                    @media (max-width: 640px) {
                        .stat-card {
                            padding: 12px 8px;
                            min-height: 75px;
                        }
                    }
                    @media (max-width: 480px) {
                        .stat-card {
                            padding: 10px 8px;
                            min-height: 70px;
                            border-radius: 6px;
                        }
                    }
                    .stat-card:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.12);
                        background-color: #E67E22;
                    }
                    .stat-label {
                        font-size: clamp(10px, 2.5vw, 13px);
                        color: #555;
                        font-weight: 600;
                        margin-bottom: 6px;
                        text-transform: capitalize;
                        line-height: 1.2;
                    }
                    .stat-value {
                        font-size: clamp(16px, 4.5vw, 24px);
                        font-weight: 700;
                        color: #333;
                        transition: color 0.2s;
                        line-height: 1.2;
                    }
                    .stat-card:hover .stat-value {
                        color: white;
                    }
                    .stat-card:hover .stat-label {
                        color: white;
                    }
                                        
                `}
            </style>
            <div className="stats-grid">
                {stats.map((stat, index) => {
                    const borderColor = getBorderColor(stat.label);

                    return (
                        <div
                            key={index}
                            className="stat-card"
                            style={{ borderLeftColor: borderColor }}
                        >
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}</div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default StatsGrid;
