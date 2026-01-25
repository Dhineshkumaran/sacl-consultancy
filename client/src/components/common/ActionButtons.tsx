import React from 'react';
import { Box, Button } from '@mui/material';
import GearSpinner from './GearSpinner';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ActionButtonsProps {
    onReset?: () => void;
    onSave?: () => void;
    onSubmit?: () => void;
    loading?: boolean;
    disabled?: boolean;
    saveLabel?: string;
    submitLabel?: string;
    resetLabel?: string;
    showReset?: boolean;
    showSave?: boolean;
    showSubmit?: boolean;
    saveIcon?: React.ReactNode;
    children?: React.ReactNode;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onReset,
    onSave,
    onSubmit,
    loading = false,
    disabled = false,
    saveLabel = "Save & Continue",
    submitLabel = "Submit",
    resetLabel = "Reset Form",
    showReset = true,
    showSave = true,
    showSubmit = true,
    saveIcon = <SaveIcon />,
    children
}) => {
    return (
        <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
            {children}
            {showReset && onReset && (
                <Button
                    onClick={onReset}
                    startIcon={<RefreshIcon />}
                    variant="outlined"
                    disabled={loading}
                >
                    {resetLabel}
                </Button>
            )}

            {showSave && onSave && (
                <Button
                    onClick={onSave}
                    startIcon={saveIcon}
                    variant="contained"
                    disabled={disabled || loading}
                    sx={{
                        bgcolor: '#E67E22',
                        '&:hover': { bgcolor: '#d35400' },
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {loading ? (
                        <>
                            <div style={{ transform: 'scale(0.7)', display: 'inline-block', marginRight: '4px' }}>
                                <GearSpinner />
                            </div>
                            Processing...
                        </>
                    ) : (
                        saveLabel
                    )}
                </Button>
            )}

            {showSubmit && onSubmit && (
                <Button
                    onClick={onSubmit}
                    startIcon={loading ? undefined : <SendIcon />}
                    variant="contained"
                    disabled={disabled || loading}
                    sx={{
                        bgcolor: '#E67E22',
                        '&:hover': { bgcolor: '#d35400' },
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {loading ? (
                        <>
                            <div style={{ transform: 'scale(0.7)', display: 'inline-block', marginRight: '4px' }}>
                                <GearSpinner />
                            </div>
                            Submitting...
                        </>
                    ) : (
                        submitLabel
                    )}
                </Button>
            )}
        </Box>
    );
};

export default ActionButtons;
