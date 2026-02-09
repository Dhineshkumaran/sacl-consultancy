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
    Chip
} from '@mui/material';
import LoadingState from '../common/LoadingState';
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

    return (
        <TableContainer className="premium-table-container" sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto', position: 'relative', minHeight: loading || deletedTrials.length === 0 ? '300px' : 'auto' }}>
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
                    <LoadingState message="Fetching deleted trials..." />
                </Box>
            ) : null}
            <Table sx={{ minWidth: 650 }} stickyHeader>
                <TableHead className="premium-table-head">
                    <TableRow>
                        <TableCell className="premium-table-header-cell">Trial ID</TableCell>
                        <TableCell className="premium-table-header-cell">Part Name</TableCell>
                        <TableCell className="premium-table-header-cell">Status</TableCell>
                        <TableCell className="premium-table-header-cell">Deleted By</TableCell>
                        <TableCell className="premium-table-header-cell">Deleted At</TableCell>
                        <TableCell className="premium-table-header-cell" align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {!loading && deletedTrials.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center" className="premium-table-cell" sx={{ py: 12 }}>
                                <Typography variant="body1" color="textSecondary">
                                    No deleted trial cards found.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        deletedTrials.map((trial) => (
                            <TableRow key={trial.trial_id} className="premium-table-row">
                                <TableCell className="premium-table-cell-bold">{trial.trial_id}</TableCell>
                                <TableCell className="premium-table-cell">{trial.part_name}</TableCell>
                                <TableCell className="premium-table-cell">
                                    <span className={`status-pill ${trial.status === 'CLOSED' ? 'status-pill-success' : 'status-pill-info'}`}>
                                        {trial.status}
                                    </span>
                                </TableCell>
                                <TableCell className="premium-table-cell">{trial.deleted_by || 'Unknown'}</TableCell>
                                <TableCell className="premium-table-cell">
                                    {trial.deleted_at ? new Date(trial.deleted_at).toLocaleString() : '-'}
                                </TableCell>
                                <TableCell className="premium-table-cell" align="right">
                                    <Tooltip title="Restore Trial Card">
                                        <IconButton
                                            onClick={() => handleRestore(trial.trial_id)}
                                            color="primary"
                                            size="small"
                                            sx={{ mr: 1 }}
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
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default DeletedTrialsTable;
