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
    Button,
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
import departmentProgressService from '../services/departmentProgressService';

interface PendingCard {
    id: string;
    trial_id: string;
    trialNo: string;
    partName: string;
    patternCode: string;
    machine: string;
    samplingDate: string;
    submittedAt: string;
    status: 'pending' | 'in_progress' | 'completed';
    department_id: number;
    selectedPart?: any;
    selectedPattern?: any;
    reason?: string;
    mouldCount?: string;
    sampleTraceability?: string;
    patternFiles?: File[];
    stdFiles?: File[];
}

interface PendingSampleCardsProps {
    open: boolean;
    onClose: () => void;
    username: string;
    onCardSelect?: (trialId: string, departmentId: number) => void;
}

const PendingSampleCards: React.FC<PendingSampleCardsProps> = ({ open, onClose, username, onCardSelect }) => {
    const [pendingCards, setPendingCards] = useState<PendingCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && username) {
            fetchPendingCards();
        }
    }, [open, username]);

    const fetchPendingCards = async () => {
        try {
            setLoading(true);
            const pendingCards = await departmentProgressService.getProgress(username);
            setPendingCards(pendingCards);
            setError(null);
        } catch (err) {
            console.error('Error fetching pending cards:', err);
            setPendingCards([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (card: PendingCard) => {
        if (onCardSelect) {
            onCardSelect(card.trial_id, card.department_id);
        }
        onClose();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#ffc107';
            case 'in_progress':
                return '#3b82f6';
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
            case 'in_progress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            default:
                return 'Unknown';
        }
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
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    📋 Pending Sample Cards
                </Typography>
                <IconButton onClick={onClose} size="small">
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
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Pending Cards Table */}
                    {!loading && (
                        <Paper variant="outlined" sx={{ border: `2px solid ${COLORS.primary}`, overflow: 'hidden' }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: COLORS.blueHeaderBg }}>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Trial No</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Pattern Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Part Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Machine</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Sampling Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Submitted At</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendingCards.length > 0 ? (
                                        pendingCards.map((card) => (
                                            <TableRow key={card.id} sx={{ '&:hover': { backgroundColor: COLORS.background } }}>
                                                <TableCell sx={{ fontWeight: 600 }}>{card.trialNo}</TableCell>
                                                <TableCell>{card.patternCode}</TableCell>
                                                <TableCell>{card.partName}</TableCell>
                                                <TableCell>{card.machine}</TableCell>
                                                <TableCell>{card.samplingDate}</TableCell>
                                                <TableCell sx={{ fontSize: '0.9rem' }}>{card.submittedAt}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusLabel(card.status)}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getStatusColor(card.status),
                                                            color: card.status === 'in_progress' || card.status === 'completed' ? '#FFFFFF' : COLORS.textPrimary,
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {card.status === 'pending' && (
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => handleCardClick(card)}
                                                            sx={{
                                                                backgroundColor: COLORS.primary,
                                                                '&:hover': { backgroundColor: COLORS.accentBlue },
                                                            }}
                                                        >
                                                            Start Analysis
                                                        </Button>
                                                    )}
                                                    {card.status === 'in_progress' && (
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => handleCardClick(card)}
                                                            sx={{
                                                                backgroundColor: COLORS.secondary,
                                                                '&:hover': { backgroundColor: '#daa706' },
                                                            }}
                                                        >
                                                            Continue
                                                        </Button>
                                                    )}
                                                    {card.status === 'completed' && (
                                                        <Chip
                                                            label="✓ Completed"
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: COLORS.accentGreen,
                                                                color: '#FFFFFF',
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
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
            </DialogContent>
        </Dialog>
    );
};

export default PendingSampleCards;