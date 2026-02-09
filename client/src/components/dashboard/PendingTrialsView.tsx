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
import { COLORS } from '../../theme/appTheme';
import departmentProgressService from '../../services/departmentProgressService';
import LoadingState from '../common/LoadingState';
import { formatDate } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { getPendingRoute } from '../../utils/dashboardUtils';

interface PendingTrials {
    trial_id: string;
    part_name?: string;
    pattern_code?: string;
    disa?: string;
    date_of_sampling?: string;
    approval_status?: string | null;
    department_name?: string;
    department_id: number;
}

interface PendingTrialsViewProps {
    username: string;
    department_id: number;
}

const PendingTrialsView: React.FC<PendingTrialsViewProps> = ({ username, department_id }) => {
    const [pendingTrials, setPendingTrials] = useState<PendingTrials[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();

    useEffect(() => {
        if (username) {
            fetchPendingTrials();
        }
    }, [username]);

    const fetchPendingTrials = async () => {
        try {
            setLoading(true);
            const pendingTrials = await departmentProgressService.getProgress(username, department_id);
            setPendingTrials(pendingTrials);
            setError(null);
        } catch (err) {
            console.error('Error fetching pending cards:', err);
            setPendingTrials([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (card: PendingTrials) => {
        const route = getPendingRoute(card.department_id);
        navigate(`${route}?trial_id=${card.trial_id}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#ffc107';
            case 'completed':
                return '#10b981';
            default:
                return '#6c757d';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'completed':
                return 'Completed';
            default:
                return 'Unknown';
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2.5, md: 3 } }}>
            {/* Error State */}
            {error && (
                <Alert severity="warning" sx={{ mb: 3, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                    {error}
                </Alert>
            )}

            {/* Pending Cards Table */}
            <TableContainer className="premium-table-container" sx={{ maxHeight: 'calc(100vh - 350px)', overflow: 'auto', position: 'relative', minHeight: loading ? '200px' : 'auto' }}>
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
                        <LoadingState message="Fetching pending cards..." />
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
                            <TableCell className="premium-table-header-cell">Status</TableCell>
                            {!isMobile && <TableCell className="premium-table-header-cell">Department</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pendingTrials.length > 0 ? (
                            pendingTrials.map((card) => (
                                <TableRow
                                    key={card.trial_id}
                                    onClick={() => handleCardClick(card)}
                                    className="premium-table-row"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <TableCell className="premium-table-cell-bold">{card.trial_id}</TableCell>
                                    {!isMobile && <TableCell className="premium-table-cell">{card.pattern_code}</TableCell>}
                                    <TableCell className="premium-table-cell">{card.part_name}</TableCell>
                                    {!isTablet && <TableCell className="premium-table-cell">{card.disa}</TableCell>}
                                    {!isTablet && <TableCell className="premium-table-cell">{card.date_of_sampling ? formatDate(card.date_of_sampling) : ''}</TableCell>}
                                    <TableCell className="premium-table-cell">
                                        <span className={`status-pill ${card.approval_status === 'completed' ? 'status-pill-success' : 'status-pill-warning'}`}>
                                            {card.approval_status === 'completed' ? 'Completed' : 'Pending'}
                                        </span>
                                    </TableCell>
                                    {!isMobile && <TableCell className="premium-table-cell">
                                        {card.department_name}
                                    </TableCell>}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={isMobile ? 3 : isTablet ? 5 : 7} align="center" className="premium-table-cell" sx={{ py: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No pending sample cards at the moment
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {pendingTrials.length > 0 && (
                <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                    Swipe to view more
                </Typography>
            )}
        </Box>
    );
};

export default PendingTrialsView;
