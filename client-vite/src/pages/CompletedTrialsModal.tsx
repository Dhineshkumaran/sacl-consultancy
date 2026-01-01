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
    useMediaQuery,
    useTheme,
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year}, ${hours}:${minutes}`;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    minHeight: isMobile ? '100vh' : '70vh',
                    maxHeight: isMobile ? '100vh' : '90vh'
                }
            }}
        >
            <DialogTitle sx={{ bgcolor: COLORS.blueHeaderBg, color: COLORS.blueHeaderText, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                ✅ Completed Trials
                <IconButton onClick={onClose} size="small" sx={{ color: COLORS.blueHeaderText }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
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
                        <Paper variant="outlined" sx={{ border: `2px solid ${COLORS.primary}`, overflow: 'auto' }}>
                            <Table size={isMobile ? "small" : "medium"}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: COLORS.blueHeaderBg }}>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Trial ID</TableCell>
                                        {!isMobile && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Pattern Code</TableCell>}
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Part Name</TableCell>
                                        {!isTablet && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Machine</TableCell>}
                                        {!isTablet && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Sampling Date</TableCell>}
                                        {!isMobile && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Department</TableCell>}
                                        {!isTablet && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Completed At</TableCell>}
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Status</TableCell>
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
                                                <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>{trial.trial_id}</TableCell>
                                                {!isMobile && <TableCell>{trial.pattern_code || 'N/A'}</TableCell>}
                                                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>{trial.part_name || 'N/A'}</TableCell>
                                                {!isTablet && <TableCell>{trial.disa || 'N/A'}</TableCell>}
                                                {!isTablet && <TableCell>{formatDate(trial.date_of_sampling || '')}</TableCell>}
                                                {!isMobile && <TableCell>{trial.department_name || 'N/A'}</TableCell>}
                                                {!isTablet && <TableCell>{formatDateTime(trial.completed_at || '')}</TableCell>}
                                                <TableCell>
                                                    <Chip
                                                        label="Completed"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: '#10b981',
                                                            color: '#FFFFFF',
                                                            fontWeight: 600,
                                                            fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={isMobile ? 3 : isTablet ? 5 : 8} sx={{ textAlign: 'center', py: 4 }}>
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
