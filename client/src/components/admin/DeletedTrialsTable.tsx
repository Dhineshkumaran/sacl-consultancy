import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Typography,
    Box,
    CircularProgress,
    Chip
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Swal from 'sweetalert2';
import { trialService } from '../../services/trialService';

const DeletedTrialsTable: React.FC = () => {
    const [deletedTrials, setDeletedTrials] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);

    const fetchDeletedTrials = async () => {
        try {
            setLoading(true);
            const data = await trialService.getDeletedTrialCards();
            setDeletedTrials(data);
        } catch (error) {
            console.error('Failed to fetch deleted trials:', error);
            Swal.fire('Error', 'Failed to load deleted trial cards', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedTrials();
    }, []);

    const handleRestore = async (trialId: string) => {
        const result = await Swal.fire({
            title: 'Restore Trial Card?',
            text: `Are you sure you want to restore trial ${trialId}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#E67E22',
            confirmButtonText: 'Yes, Restore it!'
        });

        if (result.isConfirmed) {
            try {
                await trialService.restoreTrialCard(trialId);
                Swal.fire('Restored!', 'The trial card has been restored.', 'success');
                fetchDeletedTrials();
            } catch (error) {
                Swal.fire('Error', 'Failed to restore the trial card.', 'error');
            }
        }
    };

    const handlePermanentDelete = async (trialId: string) => {
        const result = await Swal.fire({
            title: 'Delete Permanently?',
            text: `Warning: This will permanently delete trial ${trialId}, all its progress history, and all generated reports! This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it forever!'
        });

        if (result.isConfirmed) {
            try {
                await trialService.permanentlyDeleteTrialCard(trialId);
                Swal.fire('Deleted!', 'The trial card and all related data have been permanently removed.', 'success');
                fetchDeletedTrials();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete the trial card.', 'error');
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (deletedTrials.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                    No deleted trial cards found.
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Trial ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Part Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Deleted By</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Deleted At</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {deletedTrials.map((trial) => (
                        <TableRow key={trial.trial_id} hover>
                            <TableCell sx={{ fontWeight: 'bold' }}>{trial.trial_id}</TableCell>
                            <TableCell>{trial.part_name}</TableCell>
                            <TableCell>
                                <Chip
                                    label={trial.status}
                                    size="small"
                                    variant="outlined"
                                    color={trial.status === 'CLOSED' ? 'success' : 'default'}
                                />
                            </TableCell>
                            <TableCell>{trial.deleted_by || 'Unknown'}</TableCell>
                            <TableCell>
                                {trial.deleted_at ? new Date(trial.deleted_at).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell align="right">
                                <Tooltip title="Restore Trial Card">
                                    <IconButton
                                        onClick={() => handleRestore(trial.trial_id)}
                                        color="primary"
                                        size="small"
                                    >
                                        <RestoreIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Permanently">
                                    <IconButton
                                        onClick={() => handlePermanentDelete(trial.trial_id)}
                                        color="error"
                                        size="small"
                                    >
                                        <DeleteForeverIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default DeletedTrialsTable;
