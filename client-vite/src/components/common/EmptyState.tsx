import React from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';

interface EmptyStateProps {
    title: string;
    description?: string;
    severity?: 'warning' | 'info' | 'error';
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    severity = 'warning',
    action
}) => {

    return (
        <Alert severity={severity} sx={{ my: 3 }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Box flexGrow={1}>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                        {title}
                    </Typography>
                    {description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {description}
                        </Typography>
                    )}
                    {action && (
                        <Button
                            size="small"
                            onClick={action.onClick}
                            sx={{ mt: 1 }}
                        >
                            {action.label}
                        </Button>
                    )}
                </Box>
            </Box>
        </Alert>
    );
};

export default EmptyState;
