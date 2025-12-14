import React from 'react';

interface WelcomeSectionProps {
    title: string;
    description: string;
    children?: React.ReactNode;
    titleColor?: string;
    descriptionColor?: string;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({
    title,
    description,
    children,
    titleColor,
    descriptionColor
}) => {
    return (
        <div className="welcome-section">
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
                        color: titleColor || '#333',
                        margin: 0,
                        marginBottom: '5px'
                    }}>
                        {title}
                    </h2>
                    <p style={{
                        color: descriptionColor || '#666',
                        fontSize: '14px',
                        margin: 0
                    }}>
                        {description}
                    </p>
                </div>
                <div className="button-group" style={{ display: 'flex', gap: '15px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default WelcomeSection;
