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
    Button
} from '@mui/material';
import GearSpinner from '../common/GearSpinner';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Swal from 'sweetalert2';
import { trialService } from '../../services/trialService';

const RecycleBinTable: React.FC = () => {
    const [deletedTrials, setDeletedTrials] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);

    const fetchDeletedTrials = async () => {
        try {
            setLoading(true);
            const data = await trialService.getDeletedTrialReports();
            setDeletedTrials(data);
        } catch (error) {
            console.error('Failed to fetch deleted trials:', error);
            Swal.fire('Error', 'Failed to load recycle bin items', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedTrials();
    }, []);

    const handleRestore = async (trialId: string) => {
        const result = await Swal.fire({
            title: 'Restore Report?',
            text: `Are you sure you want to restore trial report ${trialId}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#E67E22',
            confirmButtonText: 'Yes, Restore it!'
        });

        if (result.isConfirmed) {
            try {
                await trialService.restoreTrialReport(trialId);
                Swal.fire('Restored!', 'The trial report has been restored.', 'success');
                fetchDeletedTrials();
            } catch (error) {
                Swal.fire('Error', 'Failed to restore the report.', 'error');
            }
        }
    };

    const handlePermanentDelete = async (trialId: string) => {
        const result = await Swal.fire({
            title: 'Delete Permanently?',
            text: `You will not be able to recover trial report ${trialId}!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it forever!'
        });

        if (result.isConfirmed) {
            try {
                await trialService.permanentlyDeleteTrialReport(trialId);
                Swal.fire('Deleted!', 'The report has been permanently removed.', 'success');
                fetchDeletedTrials();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete the report.', 'error');
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <GearSpinner />
            </Box>
        );
    }

    if (deletedTrials.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                    Recycle bin is empty.
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
                        <TableCell sx={{ fontWeight: 600 }}>Deleted By</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Deleted At</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {deletedTrials.map((trial) => (
                        <TableRow key={trial.document_id} hover>
                            <TableCell>{trial.trial_id}</TableCell>
                            <TableCell>{trial.part_name}</TableCell>
                            <TableCell>{trial.deleted_by || 'Unknown'}</TableCell>
                            <TableCell>
                                {trial.deleted_at ? new Date(trial.deleted_at).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell align="right">
                                <Tooltip title="Restore Report">
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

export default RecycleBinTable;
