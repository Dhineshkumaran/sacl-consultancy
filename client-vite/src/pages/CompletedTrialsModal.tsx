import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { COLORS } from '../theme/appTheme';
import departmentProgressService, { type ProgressItem } from '../services/departmentProgressService';

interface CompletedTrialsModalProps {
    open: boolean;
    onClose: () => void;
    username: string;
}

const CompletedTrialsModal: React.FC<CompletedTrialsModalProps> = ({ open, onClose, username }) => {
    const [completedTrials, setCompletedTrials] = useState<ProgressItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && username) {
            fetchCompletedTrials();
        }
    }, [open, username]);

    const fetchCompletedTrials = async () => {
        try {
            setLoading(true);
            const trials = await departmentProgressService.getCompletedTrials(username);
            setCompletedTrials(trials);
            setError(null);
        } catch (err) {
            console.error('Error fetching completed trials:', err);
            setError('Failed to fetch completed trials. Please try again.');
            setCompletedTrials([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '70vh',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{ bgcolor: COLORS.blueHeaderBg, color: COLORS.blueHeaderText, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                ✅ Completed Trials
                <IconButton onClick={onClose} size="small" sx={{ color: COLORS.blueHeaderText }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Box>
                    {/* Loading State */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                            <CircularProgress size={60} />
                        </Box>
                    )}

                    {/* Error State */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Completed Trials Table */}
                    {!loading && (
                        <Paper variant="outlined" sx={{ border: `2px solid ${COLORS.primary}`, overflow: 'hidden' }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: COLORS.blueHeaderBg }}>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Trial ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Pattern Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Part Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Machine</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Sampling Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Department</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Completed At</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {completedTrials.length > 0 ? (
                                        completedTrials.map((trial) => (
                                            <TableRow
                                                key={`${trial.trial_id}-${trial.department_id}`}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: COLORS.background,
                                                    }
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 600 }}>{trial.trial_id}</TableCell>
                                                <TableCell>{trial.pattern_code || 'N/A'}</TableCell>
                                                <TableCell>{trial.part_name || 'N/A'}</TableCell>
                                                <TableCell>{trial.disa || 'N/A'}</TableCell>
                                                <TableCell>{formatDate(trial.date_of_sampling || '')}</TableCell>
                                                <TableCell>{trial.department_name || 'N/A'}</TableCell>
                                                <TableCell>{formatDateTime(trial.completed_at || '')}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label="Completed"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#10b981',
                                                            color: '#FFFFFF',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No completed trials found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Paper>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default CompletedTrialsModal;
