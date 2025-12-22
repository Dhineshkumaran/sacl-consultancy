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
            <style>
                {`
                    .welcome-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 30px;
                        flex-wrap: wrap;
                        gap: 20px;
                    }
                    .welcome-title {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0;
                        margin-bottom: 5px;
                    }
                    .welcome-description {
                        font-size: 14px;
                        margin: 0;
                    }
                    .button-group {
                        display: flex;
                        gap: 15px;
                        flex-wrap: wrap;
                    }
                    @media (max-width: 768px) {
                        .welcome-header {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        .welcome-title {
                            font-size: 20px;
                        }
                        .button-group {
                            width: 100%;
                            gap: 10px;
                        }
                        .button-group button {
                            flex: 1;
                            min-width: 140px;
                            padding: 8px 12px !important;
                            font-size: 13px !important;
                        }
                    }
                    @media (max-width: 480px) {
                        .welcome-title {
                            font-size: 18px;
                        }
                        .button-group {
                            flex-direction: column;
                        }
                        .button-group button {
                            width: 100%;
                        }
                    }
                `}
            </style>
            <div className="welcome-header">
                <div>
                    <h2 className="welcome-title" style={{ color: titleColor || '#333' }}>
                        {title}
                    </h2>
                    <p className="welcome-description" style={{ color: descriptionColor || '#666' }}>
                        {description}
                    </p>
                </div>
                <div className="button-group">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default WelcomeSection;
