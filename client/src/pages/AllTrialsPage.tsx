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
    Select,
    MenuItem,
    InputLabel,
    Checkbox,
    FormControl,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TableContainer,
} from '@mui/material';
import LoadingState from '../components/common/LoadingState';
import DocumentViewer from '../components/common/DocumentViewer';
import BackButton from '../components/common/BackButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import Swal from 'sweetalert2';
import { appTheme, COLORS } from '../theme/appTheme';
import { trialService } from '../services/trialService';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import ProfileModal from '../components/dashboard/ProfileModal';
import { getDepartmentInfo } from '../utils/dashboardUtils';

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
    const [showProfile, setShowProfile] = useState(false);
    const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const departmentInfo = getDepartmentInfo(user);


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


    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: 'Delete Selected Trials?',
            text: `You are about to delete ${selectedIds.length} trial(s). This action will move them to the recycle bin.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete all!'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const selectedTrials = trials.filter(t => selectedIds.includes(t.trial_id));
                const uniquePatternCodes = Array.from(new Set(selectedTrials.map(t => t.pattern_code).filter(pc => !!pc)));
                const response = await trialService.bulkDeleteTrialCards(selectedIds, uniquePatternCodes);

                if (response.success) {
                    Swal.fire('Deleted!', `${selectedIds.length} trial(s) have been deleted.`, 'success');
                    const data = await trialService.getAllTrialReports();
                    setTrials(data);
                    setSelectedIds([]);
                } else {
                    Swal.fire('Failed!', response.message || 'Failed to delete trials.', 'error');
                }
            } catch (error) {
                console.error("Error during bulk delete:", error);
                Swal.fire('Error!', 'An error occurred during bulk deletion.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.length === filteredTrials.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTrials.map(t => t.trial_id));
        }
    };

    const handleToggleSelect = (trialId: string) => {
        setSelectedIds(prev =>
            prev.includes(trialId)
                ? prev.filter(id => id !== trialId)
                : [...prev, trialId]
        );
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
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {!embedded && (
                    <Header
                        setShowProfile={setShowProfile}
                        departmentInfo={departmentInfo}
                        photoRefreshKey={headerRefreshKey}
                        showBackButton={true}
                    />
                )}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: embedded ? 0 : 3 }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                        mb: 2.5
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {!embedded && <BackButton label="Back" variant="button" />}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'white' }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    sx={{ bgcolor: 'white' }}
                                >
                                    <MenuItem value="ALL">All Status</MenuItem>
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
                                    width: { xs: '100%', sm: 280 }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.1rem' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {user?.role === 'Admin' && selectedIds.length > 0 && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    size="small"
                                    startIcon={<DeleteIcon fontSize="small" />}
                                    onClick={handleBulkDelete}
                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1 }}
                                >
                                    Delete ({selectedIds.length})
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ position: 'relative', minHeight: loading ? '200px' : 'auto' }}>
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
                                <LoadingState message="Fetching trials..." />
                            </Box>
                        ) : null}
                        <Table stickyHeader size="medium">
                            <TableHead className="premium-table-head">
                                <TableRow>
                                    {user?.role === 'Admin' && (
                                        <TableCell padding="checkbox" className="premium-table-header-cell">
                                            <Checkbox
                                                indeterminate={selectedIds.length > 0 && selectedIds.length < filteredTrials.length}
                                                checked={filteredTrials.length > 0 && selectedIds.length === filteredTrials.length}
                                                onChange={handleToggleSelectAll}
                                                size="small"
                                            />
                                        </TableCell>
                                    )}
                                    {user?.role === 'Admin' && <TableCell className="premium-table-header-cell" />}

                                    <TableCell className="premium-table-header-cell">Trial ID</TableCell>
                                    <TableCell className="premium-table-header-cell">Part Name</TableCell>
                                    <TableCell className="premium-table-header-cell">Pattern Code</TableCell>
                                    <TableCell className="premium-table-header-cell">Grade</TableCell>
                                    <TableCell className="premium-table-header-cell">Date</TableCell>
                                    <TableCell className="premium-table-header-cell">Dept</TableCell>
                                    <TableCell className="premium-table-header-cell">Status</TableCell>
                                    <TableCell className="premium-table-header-cell" style={{ textAlign: 'center' }}>Report</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTrials.length > 0 ? (
                                    filteredTrials.map((trial) => (
                                        <React.Fragment key={trial.trial_id}>
                                            <TableRow
                                                hover
                                                selected={selectedIds.includes(trial.trial_id)}
                                                className="premium-table-row"
                                            >
                                                {user?.role === 'Admin' && (
                                                    <TableCell padding="checkbox" className="premium-table-cell">
                                                        <Checkbox
                                                            checked={selectedIds.includes(trial.trial_id)}
                                                            onChange={() => handleToggleSelect(trial.trial_id)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                )}
                                                {user?.role === 'Admin' && (
                                                    <TableCell className="premium-table-cell">
                                                        <IconButton
                                                            aria-label="expand row"
                                                            size="small"
                                                            onClick={() => handleExpandRow(trial.trial_id)}
                                                        >
                                                            {expandedTrialId === trial.trial_id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                        </IconButton>
                                                    </TableCell>
                                                )}

                                                <TableCell className="premium-table-cell-bold">{trial.trial_id}</TableCell>
                                                <TableCell className="premium-table-cell">
                                                    <Box sx={{ maxWidth: { xs: '60px', sm: '100%' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {trial.part_name}
                                                    </Box>
                                                </TableCell>
                                                <TableCell className="premium-table-cell">{trial.pattern_code}</TableCell>
                                                <TableCell className="premium-table-cell">{trial.material_grade}</TableCell>
                                                <TableCell className="premium-table-cell">{new Date(trial.date_of_sampling).toLocaleDateString('en-GB')}</TableCell>
                                                <TableCell className="premium-table-cell">
                                                    <span className="status-pill status-pill-info">
                                                        {trial.department || 'N/A'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="premium-table-cell">
                                                    <span className={`status-pill ${trial.status === 'CLOSED' ? 'status-pill-success' :
                                                        trial.status === 'CREATED' ? 'status-pill-info' :
                                                            'status-pill-warning'
                                                        }`}>
                                                        {trial.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell align="center" className="premium-table-cell">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                        {trial.status === 'CLOSED' && trial.file_base64 ? (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<DescriptionIcon />}
                                                                onClick={() => handleViewReport(trial)}
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    textTransform: 'none',
                                                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                                                    padding: { xs: '2px 8px', sm: '4px 12px' }
                                                                }}
                                                            >
                                                                Report
                                                            </Button>
                                                        ) : "N/A"}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={user?.role === 'Admin' ? 10 : 8} className="premium-table-cell">
                                                    <Collapse in={expandedTrialId === trial.trial_id} timeout="auto" unmountOnExit>
                                                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                                                            <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 2 }}>
                                                                Detailed Progress History
                                                            </Typography>
                                                            {loadingProgress[trial.trial_id] ? (
                                                                <LoadingState size={24} message="Loading details..." />
                                                            ) : (trialProgressData[trial.trial_id] && trialProgressData[trial.trial_id].length > 0) ? (
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    overflowX: 'auto',
                                                                    gap: 2,
                                                                    pb: 1,
                                                                    '&::-webkit-scrollbar': { height: '8px' },
                                                                    '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
                                                                    '&::-webkit-scrollbar-thumb': { background: '#555' },
                                                                }}>
                                                                    {trialProgressData[trial.trial_id].map((progress: ProgressItem, index: number) => (
                                                                        <Box key={index} sx={{ minWidth: '100%', flex: 1 }}>
                                                                            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                                                                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                                                    <Grid container alignItems="center" spacing={2}>
                                                                                        <Grid size={{ xs: 3 }}>
                                                                                            <Typography variant="subtitle2" color="textSecondary">Department</Typography>
                                                                                            <Typography variant="body2" fontWeight="medium">{progress.department_name || `Dept ID: ${progress.department_id}`}</Typography>
                                                                                        </Grid>
                                                                                        <Grid size={{ xs: 2 }}>
                                                                                            <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                                                                                            <Chip
                                                                                                label={progress.approval_status}
                                                                                                size="small"
                                                                                                color={progress.approval_status === 'approved' ? 'success' : 'warning'}
                                                                                                variant="outlined"
                                                                                                sx={{ textTransform: 'capitalize' }}
                                                                                            />
                                                                                            {user?.role === 'Admin' && (
                                                                                                <Tooltip title="Toggle Status">
                                                                                                    <IconButton
                                                                                                        size="small"
                                                                                                        onClick={async () => {
                                                                                                            try {
                                                                                                                const result = await Swal.fire({
                                                                                                                    title: 'Toggle Status?',
                                                                                                                    text: `Change status from ${progress.approval_status}?`,
                                                                                                                    icon: 'question',
                                                                                                                    showCancelButton: true,
                                                                                                                    confirmButtonText: 'Yes, change it'
                                                                                                                });

                                                                                                                if (result.isConfirmed) {
                                                                                                                    setLoadingProgress(prev => ({ ...prev, [trial.trial_id]: true }));
                                                                                                                    const response = await departmentProgressService.toggleApprovalStatus(trial.trial_id, progress.department_id);
                                                                                                                    if (response.success) {
                                                                                                                        const data = await departmentProgressService.getProgressByTrialId(trial.trial_id);
                                                                                                                        setTrialProgressData(prev => ({ ...prev, [trial.trial_id]: data }));
                                                                                                                        Swal.fire('Updated!', 'Status has been updated.', 'success');
                                                                                                                    } else {
                                                                                                                        Swal.fire('Error!', response.message || 'Failed to update.', 'error');
                                                                                                                    }
                                                                                                                }
                                                                                                            } catch (error) {
                                                                                                                console.error("Toggle error:", error);
                                                                                                                Swal.fire('Error!', 'Failed to toggle status.', 'error');
                                                                                                            } finally {
                                                                                                                setLoadingProgress(prev => ({ ...prev, [trial.trial_id]: false }));
                                                                                                            }
                                                                                                        }}
                                                                                                    >
                                                                                                        <PublishedWithChangesIcon fontSize="small" color="primary" />
                                                                                                    </IconButton>
                                                                                                </Tooltip>
                                                                                            )}
                                                                                        </Grid>
                                                                                        <Grid size={{ xs: 3 }}>
                                                                                            <Typography variant="subtitle2" color="textSecondary">Completed At</Typography>
                                                                                            <Typography variant="body2">
                                                                                                {progress.completed_at ? new Date(progress.completed_at).toLocaleString() : '-'}
                                                                                            </Typography>
                                                                                        </Grid>
                                                                                        <Grid size={{ xs: 2 }}>
                                                                                            <Typography variant="subtitle2" color="textSecondary">Remarks</Typography>
                                                                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                                                                {progress.remarks || 'No remarks'}
                                                                                            </Typography>
                                                                                        </Grid>
                                                                                        <Grid size={{ xs: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                                                                        </Box>
                                                                    ))}
                                                                </Box>
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
                                        <TableCell colSpan={user?.role === 'Admin' ? 10 : 8} align="center" className="premium-table-cell" sx={{ py: 5, color: 'text.secondary' }}>
                                            No trials found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                    <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                        Swipe to view more
                    </Typography>

                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                    </Box>
                </Box>
            </Box>

            <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="md" fullWidth>
                <DialogTitle>Trial Report - {viewReport?.trial_id}</DialogTitle>
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

            {!embedded && showProfile && (
                <ProfileModal
                    onClose={() => setShowProfile(false)}
                    onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
                />
            )}
        </ThemeProvider>
    );
}
