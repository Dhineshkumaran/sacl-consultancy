import React, { useEffect, useState } from 'react';
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
    Container,
    ThemeProvider,
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    Select,
    MenuItem,
    InputLabel
} from '@mui/material';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DocumentViewer from '../components/common/DocumentViewer';
import BackButton from '../components/common/BackButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import SaclHeader from '../components/common/SaclHeader';
import { appTheme, COLORS } from '../theme/appTheme';
import { trialService } from '../services/trialService';
import { useAuth } from '../context/AuthContext';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Collapse, Grid, Card, CardContent, Chip } from '@mui/material';
import departmentProgressService, { type ProgressItem } from '../services/departmentProgressService';
import { getPendingRoute } from '../utils/dashboardUtils';


interface AllTrialsPageProps {
    embedded?: boolean;
}

export default function AllTrialsPage({ embedded = false }: AllTrialsPageProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [trials, setTrials] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');


    const [expandedTrialId, setExpandedTrialId] = useState<string | null>(null);
    const [trialProgressData, setTrialProgressData] = useState<Record<string, ProgressItem[]>>({});
    const [loadingProgress, setLoadingProgress] = useState<Record<string, boolean>>({});


    useEffect(() => {
        const fetchTrialReports = async () => {
            try {
                const data = await trialService.getAllTrialReports();
                setTrials(data);
            } catch (error) {
                console.error("Error fetching trial reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrialReports();
    }, []);

    const filteredTrials = trials
        .filter(trial =>
            trial.trial_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trial.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trial.pattern_code?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(trial => {
            if (statusFilter === 'ALL') return true;
            return trial.status === statusFilter;
        })
        .sort((a, b) => new Date(b.date_of_sampling).getTime() - new Date(a.date_of_sampling).getTime());

    const handleDelete = async (trialId: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete trial ${trialId} report. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await trialService.deleteTrialReport(trialId);
                if (response.success) {
                    Swal.fire(
                        'Deleted!',
                        'Trial report has been deleted.',
                        'success'
                    );
                    // Refresh trials
                    const data = await trialService.getAllTrialReports();
                    setTrials(data);
                } else {
                    Swal.fire(
                        'Failed!',
                        response.message || 'Failed to delete trial.',
                        'error'
                    );
                }
            } catch (error) {
                console.error("Error deleting trial:", error);
                Swal.fire(
                    'Error!',
                    'An error occurred while deleting trial.',
                    'error'
                );
            } finally {
                setLoading(false);
            }
        }
    };

    const [viewReport, setViewReport] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

    const handleViewReport = (trial: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const document = {
            document_id: Date.now(),
            file_name: trial.file_name || `Report_${trial.trial_id}.pdf`,
            document_type: trial.document_type || 'TRIAL_REPORT',
            file_base64: trial.file_base64,
            uploaded_by: 'System',
            uploaded_at: new Date().toISOString(),
            remarks: 'Auto-generated Report'
        };
        setViewReport({
            trialId: trial.trial_id,
            documents: [document]
        });
    };

    const handleExpandRow = async (trialId: string) => {
        if (expandedTrialId === trialId) {
            setExpandedTrialId(null);
            return;
        }

        setExpandedTrialId(trialId);

        if (!trialProgressData[trialId]) {
            setLoadingProgress(prev => ({ ...prev, [trialId]: true }));
            try {
                const data = await departmentProgressService.getProgressByTrialId(trialId);
                setTrialProgressData(prev => ({ ...prev, [trialId]: data }));
            } catch (error) {
                console.error("Error fetching trial progress:", error);
            } finally {
                setLoadingProgress(prev => ({ ...prev, [trialId]: false }));
            }
        }
    };



    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{ minHeight: embedded ? 'auto' : '100vh', bgcolor: embedded ? 'transparent' : COLORS.background, py: embedded ? 0 : 4 }}>
                <Container maxWidth={embedded ? false : "xl"} sx={{ px: embedded ? 0 : undefined }}>
                    {!embedded && <SaclHeader />}

                    <Box sx={{
                        mt: 4,
                        mb: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'column', md: 'row' },
                        gap: { xs: 2, md: 0 }
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            flexDirection: { xs: 'column', sm: 'row' },
                            width: { xs: '100%', md: 'auto' }
                        }}>
                            {!embedded && <BackButton label="Back to Dashboard" variant="button" />}
                            {!embedded && (
                                <Typography
                                    variant="h4"
                                    fontWeight="bold"
                                    color="primary"
                                    sx={{
                                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                                        textAlign: { xs: 'center', sm: 'left' },
                                        width: { xs: '100%', sm: 'auto' }
                                    }}
                                >
                                    All Trials Repository
                                </Typography>
                            )}

                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, width: { xs: '100%', md: 'auto' } }}>
                            <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">All</MenuItem>
                                    <MenuItem value="CREATED">Created</MenuItem>
                                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                    <MenuItem value="CLOSED">Closed</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                placeholder="Search Trial ID, Part Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{
                                    bgcolor: 'white',
                                    minWidth: 300,
                                    width: { xs: '100%', md: 300 }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </Box>

                    <Paper sx={{
                        width: '100%',
                        overflow: 'hidden',
                        boxShadow: 3,
                        borderRadius: 2,
                        overflowX: { xs: 'auto', md: 'hidden' }
                    }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                <LoadingSpinner />
                            </Box>
                        ) : (
                            <Box sx={{
                                maxHeight: { xs: '60vh', md: '70vh' },
                                overflow: 'auto'
                            }}>
                                <Table
                                    stickyHeader
                                    sx={{
                                        minWidth: { xs: 500, md: '100%' }
                                    }}
                                >
                                    <TableHead>
                                        <TableRow>
                                            {user?.role === 'Admin' && <TableCell />}

                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                bgcolor: '#f8fafc',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}>Trial ID</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                bgcolor: '#f8fafc',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}>Part Name</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                bgcolor: '#f8fafc',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}>Pattern Code</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                bgcolor: '#f8fafc',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}>Grade</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                bgcolor: '#f8fafc',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}>Date</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                bgcolor: '#f8fafc',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}>Dept</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                bgcolor: '#f8fafc',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}>Status</TableCell>
                                            <TableCell sx={{
                                                fontWeight: 'bold',
                                                bgcolor: '#f8fafc',
                                                textAlign: 'center',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}>Report</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredTrials.length > 0 ? (
                                            filteredTrials.map((trial) => (
                                                <React.Fragment key={trial.trial_id}>
                                                    <TableRow
                                                        hover
                                                    >
                                                        {user?.role === 'Admin' && (
                                                            <TableCell>
                                                                <IconButton
                                                                    aria-label="expand row"
                                                                    size="small"
                                                                    onClick={() => handleExpandRow(trial.trial_id)}
                                                                >
                                                                    {expandedTrialId === trial.trial_id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                                </IconButton>
                                                            </TableCell>
                                                        )}

                                                        <TableCell sx={{
                                                            fontWeight: 'bold',
                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                        }}>{trial.trial_id}</TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                            <Box sx={{ maxWidth: { xs: '60px', sm: '100%' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {trial.part_name}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{trial.pattern_code}</TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{trial.material_grade}</TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{new Date(trial.date_of_sampling).toLocaleDateString('en-GB')}</TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                            <Box sx={{
                                                                display: 'inline-block',
                                                                px: 1, py: 0.3,
                                                                borderRadius: 5,
                                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                                bgcolor: '#e0f2fe',
                                                                color: '#0369a1',
                                                                fontWeight: 500,
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {trial.department || 'N/A'}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                            <Box sx={{
                                                                display: 'inline-block',
                                                                px: 1, py: 0.3,
                                                                borderRadius: 5,
                                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                                bgcolor: trial.status === 'CLOSED' ? '#dcfce7' : '#fff7ed',
                                                                color: trial.status === 'CLOSED' ? '#166534' : '#9a3412',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {trial.status || 'In Progress'}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                            {trial.status === 'CLOSED' && trial.file_base64 ? (
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<DescriptionIcon />}
                                                                    onClick={() => handleViewReport(trial)}
                                                                    sx={{
                                                                        borderRadius: 2,
                                                                        textTransform: 'none',
                                                                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                                                        padding: { xs: '4px 8px', sm: '6px 12px' }
                                                                    }}
                                                                >
                                                                    Report
                                                                </Button>
                                                            ) : "Report not available"}
                                                            {user.role === 'Admin' && trial.file_base64 && (
                                                                <Tooltip title="Delete Trial Report">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDelete(trial.trial_id)}
                                                                        sx={{ ml: 1 }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>

                                                    <TableRow>
                                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={user?.role === 'Admin' ? 9 : 8}>
                                                            <Collapse in={expandedTrialId === trial.trial_id} timeout="auto" unmountOnExit>
                                                                <Box sx={{ margin: 2, bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                                                                    <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 2 }}>
                                                                        Detailed Progress History
                                                                    </Typography>
                                                                    {loadingProgress[trial.trial_id] ? (
                                                                        <LoadingSpinner />
                                                                    ) : (trialProgressData[trial.trial_id] && trialProgressData[trial.trial_id].length > 0) ? (
                                                                        <Grid container spacing={2}>
                                                                            {trialProgressData[trial.trial_id].map((progress: ProgressItem, index: number) => (
                                                                                <Grid key={index} size={{ xs: 12 }}>
                                                                                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                                                                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                                                            <Grid container alignItems="center" spacing={2}>
                                                                                                <Grid size={{ xs: 12, sm: 3 }}>
                                                                                                    <Typography variant="subtitle2" color="textSecondary">Department</Typography>
                                                                                                    <Typography variant="body2" fontWeight="medium">{progress.department_name || `Dept ID: ${progress.department_id}`}</Typography>
                                                                                                </Grid>
                                                                                                <Grid size={{ xs: 12, sm: 2 }}>
                                                                                                    <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                                                                                                    <Chip
                                                                                                        label={progress.approval_status}
                                                                                                        size="small"
                                                                                                        color={progress.approval_status === 'approved' ? 'success' : 'warning'}
                                                                                                        variant="outlined"
                                                                                                        sx={{ textTransform: 'capitalize' }}
                                                                                                    />
                                                                                                </Grid>
                                                                                                <Grid size={{ xs: 12, sm: 3 }}>
                                                                                                    <Typography variant="subtitle2" color="textSecondary">Completed At</Typography>
                                                                                                    <Typography variant="body2">
                                                                                                        {progress.completed_at ? new Date(progress.completed_at).toLocaleString() : '-'}
                                                                                                    </Typography>
                                                                                                </Grid>
                                                                                                <Grid size={{ xs: 12, sm: 2 }}>
                                                                                                    <Typography variant="subtitle2" color="textSecondary">Remarks</Typography>
                                                                                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                                                                        {progress.remarks || 'No remarks'}
                                                                                                    </Typography>
                                                                                                </Grid>
                                                                                                <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                                                    <Button
                                                                                                        variant="contained"
                                                                                                        size="small"
                                                                                                        color="primary"
                                                                                                        onClick={() => navigate(`${getPendingRoute(progress.department_id)}?trial_id=${trial.trial_id}`)}
                                                                                                        sx={{ textTransform: 'none' }}
                                                                                                    >
                                                                                                        View Details
                                                                                                    </Button>
                                                                                                </Grid>
                                                                                            </Grid>
                                                                                        </CardContent>
                                                                                    </Card>
                                                                                </Grid>
                                                                            ))}
                                                                        </Grid>
                                                                    ) : (
                                                                        <Typography variant="body2" color="textSecondary" align="center">
                                                                            No progress data available.
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                                    No trials found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </Paper>

                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                    </Box>
                </Container>
            </Box>

            <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Trial Report - {viewReport?.trialId}
                </DialogTitle>
                <DialogContent>
                    {viewReport && (
                        <DocumentViewer
                            documents={viewReport.documents}
                            label="Generated Report"
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewReport(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider >
    );
}
