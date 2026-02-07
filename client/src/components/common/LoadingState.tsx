import React from 'react';
import { Box, Typography } from '@mui/material';
import GearSpinner from './GearSpinner';

interface LoadingStateProps {
    message?: string;
    size?: number;
    color?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
    message = "Loading...",
    size = 40,
    color = "#3498db" // Default premium blue color
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 6,
                minHeight: '200px',
                width: '100%'
            }}
        >
            <GearSpinner size={size} color={color} />
            {message && (
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 500,
                        letterSpacing: '0.02em'
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default LoadingState;
