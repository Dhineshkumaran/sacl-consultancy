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
    Chip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { COLORS } from '../../theme/appTheme';
import departmentProgressService, { type ProgressItem } from '../../services/departmentProgressService';
import LoadingState from '../common/LoadingState';
import { formatDate, formatDateTime } from '../../utils';

interface CompletedTrialsViewProps {
    username: string;
}

const CompletedTrialsView: React.FC<CompletedTrialsViewProps> = ({ username }) => {
    const [completedTrials, setCompletedTrials] = useState<ProgressItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (username) {
            fetchCompletedTrials();
        }
    }, [username]);

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

    return (
        <Box sx={{ p: 3 }}>


            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <LoadingState size={60} />
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
                <Paper variant="outlined" sx={{ border: `1px solid #e0e0e0`, overflow: 'hidden', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Table size={isMobile ? "small" : "medium"}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Trial ID</TableCell>
                                {!isMobile && <TableCell sx={{ fontWeight: 600, color: '#333' }}>Pattern Code</TableCell>}
                                <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Part Name</TableCell>
                                {!isTablet && <TableCell sx={{ fontWeight: 600, color: '#333' }}>Machine</TableCell>}
                                {!isTablet && <TableCell sx={{ fontWeight: 600, color: '#333' }}>Sampling Date</TableCell>}
                                {!isMobile && <TableCell sx={{ fontWeight: 600, color: '#333' }}>Department</TableCell>}
                                {!isTablet && <TableCell sx={{ fontWeight: 600, color: '#333' }}>Completed At</TableCell>}
                                <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {completedTrials.length > 0 ? (
                                completedTrials.map((trial) => (
                                    <TableRow
                                        key={`${trial.trial_id}-${trial.department_id}`}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5',
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
    );
};

export default CompletedTrialsView;
