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
    TableContainer,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
    }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <Box sx={{ p: { xs: 1, sm: 2.5, md: 3 } }}>
            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                    {error}
                </Alert>
            )}

            {/* Completed Trials Table */}
            <TableContainer className="premium-table-container" sx={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto', position: 'relative', minHeight: loading || completedTrials.length === 0 ? '300px' : 'auto' }}>
                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.7)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10,
                        borderRadius: '12px',
                        backdropFilter: 'blur(2px)'
                    }}>
                        <LoadingState message="Fetching completed trials..." />
                    </Box>
                ) : null}
                <Table size={isMobile ? "small" : "medium"} stickyHeader>
                    <TableHead className="premium-table-head">
                        <TableRow>
                            <TableCell className="premium-table-header-cell">Trial ID</TableCell>
                            {!isMobile && <TableCell className="premium-table-header-cell">Pattern Code</TableCell>}
                            <TableCell className="premium-table-header-cell">Part Name</TableCell>
                            {!isTablet && <TableCell className="premium-table-header-cell">Machine</TableCell>}
                            {!isTablet && <TableCell className="premium-table-header-cell">Sampling Date</TableCell>}
                            {!isMobile && <TableCell className="premium-table-header-cell">Department</TableCell>}
                            {!isTablet && <TableCell className="premium-table-header-cell">Completed At</TableCell>}
                            <TableCell className="premium-table-header-cell">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {completedTrials.length > 0 ? (
                            completedTrials.map((trial) => (
                                <TableRow
                                    key={`${trial.trial_id}-${trial.department_id}`}
                                    className="premium-table-row"
                                >
                                    <TableCell className="premium-table-cell-bold">{trial.trial_id}</TableCell>
                                    {!isMobile && <TableCell className="premium-table-cell">{trial.pattern_code || 'N/A'}</TableCell>}
                                    <TableCell className="premium-table-cell">{trial.part_name || 'N/A'}</TableCell>
                                    {!isTablet && <TableCell className="premium-table-cell">{trial.disa || 'N/A'}</TableCell>}
                                    {!isTablet && <TableCell className="premium-table-cell">{formatDate(trial.date_of_sampling || '')}</TableCell>}
                                    {!isMobile && <TableCell className="premium-table-cell">{trial.department_name || 'N/A'}</TableCell>}
                                    {!isTablet && <TableCell className="premium-table-cell">{formatDateTime(trial.completed_at || '')}</TableCell>}
                                    <TableCell className="premium-table-cell">
                                        <span className="status-pill status-pill-success">
                                            <CheckCircleIcon sx={{ fontSize: '14px' }} /> Completed
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={isMobile ? 3 : isTablet ? 5 : 8} align="center" className="premium-table-cell" sx={{ py: 12 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No completed trials found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {completedTrials.length > 0 && (
                <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                    Swipe to view more
                </Typography>
            )}
        </Box>
    );
};

export default CompletedTrialsView;
