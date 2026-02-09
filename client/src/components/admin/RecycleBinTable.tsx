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
import LoadingState from '../common/LoadingState';
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

    return (
        <TableContainer className="premium-table-container" sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto', position: 'relative' }}>
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
                    <LoadingState message="Fetching deleted reports..." />
                </Box>
            ) : null}
            {!loading && deletedTrials.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                        Recycle bin is empty.
                    </Typography>
                </Box>
            ) : (
                <Table sx={{ minWidth: 650 }} stickyHeader>
                    <TableHead className="premium-table-head">
                        <TableRow>
                            <TableCell className="premium-table-header-cell">Trial ID</TableCell>
                            <TableCell className="premium-table-header-cell">Part Name</TableCell>
                            <TableCell className="premium-table-header-cell">Deleted By</TableCell>
                            <TableCell className="premium-table-header-cell">Deleted At</TableCell>
                            <TableCell className="premium-table-header-cell" align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {deletedTrials.map((trial) => (
                            <TableRow key={trial.document_id} className="premium-table-row">
                                <TableCell className="premium-table-cell-bold">{trial.trial_id}</TableCell>
                                <TableCell className="premium-table-cell">{trial.part_name}</TableCell>
                                <TableCell className="premium-table-cell">{trial.deleted_by || 'Unknown'}</TableCell>
                                <TableCell className="premium-table-cell">
                                    {trial.deleted_at ? new Date(trial.deleted_at).toLocaleString() : '-'}
                                </TableCell>
                                <TableCell className="premium-table-cell" align="right">
                                    <Tooltip title="Restore Report">
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
                        ))}
                    </TableBody>
                </Table>
            )}
        </TableContainer>
    );
};

export default RecycleBinTable;
