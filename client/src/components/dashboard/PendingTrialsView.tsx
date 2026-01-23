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
}

const PendingTrialsView: React.FC<PendingTrialsViewProps> = ({ username }) => {
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
            const pendingTrials = await departmentProgressService.getProgress(username);
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


            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <LoadingState size={60} />
                </Box>
            )}

            {/* Error State */}
            {error && (
                <Alert severity="warning" sx={{ mb: 3, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                    {error}
                </Alert>
            )}

            {/* Pending Cards Table */}
            {!loading && (
                <Paper variant="outlined" sx={{ border: `1px solid #e0e0e0`, overflow: 'auto', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <Table size={isMobile ? "small" : "medium"}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, whiteSpace: 'nowrap', p: { xs: 0.75, sm: 1 } }}>Trial ID</TableCell>
                                {!isMobile && <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>Pattern Code</TableCell>}
                                <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>Part Name</TableCell>
                                {!isTablet && <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>Machine</TableCell>}
                                {!isTablet && <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 }, whiteSpace: 'nowrap' }}>Sampling Date</TableCell>}
                                <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>Status</TableCell>
                                {!isMobile && <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>Department</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pendingTrials.length > 0 ? (
                                pendingTrials.map((card) => (
                                    <TableRow
                                        key={card.trial_id}
                                        onClick={() => handleCardClick(card)}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5',
                                                cursor: 'pointer'
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>{card.trial_id}</TableCell>
                                        {!isMobile && <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>{card.pattern_code}</TableCell>}
                                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>{card.part_name}</TableCell>
                                        {!isTablet && <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>{card.disa}</TableCell>}
                                        {!isTablet && <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 }, whiteSpace: 'nowrap' }}>{card.date_of_sampling ? formatDate(card.date_of_sampling) : ''}</TableCell>}
                                        <TableCell sx={{ p: { xs: 0.75, sm: 1 } }}>
                                            <Chip
                                                label={getStatusLabel(card.approval_status || 'pending')}
                                                size="small"
                                                sx={{
                                                    backgroundColor: getStatusColor(card.approval_status || 'pending'),
                                                    color: card.approval_status == 'pending' || card.approval_status == 'completed' ? '#FFFFFF' : COLORS.textPrimary,
                                                    fontWeight: 600,
                                                    fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }
                                                }}
                                            />
                                        </TableCell>
                                        {!isMobile && <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, p: { xs: 0.75, sm: 1 } }}>
                                            {card.department_name}
                                        </TableCell>}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={isMobile ? 3 : isTablet ? 5 : 7} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                            No pending sample cards at the moment
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

export default PendingTrialsView;
