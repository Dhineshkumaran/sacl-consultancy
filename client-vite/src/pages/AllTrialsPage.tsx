import React, { useEffect, useState, useMemo } from 'react';
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
    CircularProgress,
    TextField,
    InputAdornment,
    useMediaQuery,
    useTheme,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import SaclHeader from '../components/common/SaclHeader';
import { appTheme, COLORS } from '../theme/appTheme';
import { trialService } from '../services/trialService';
import { useAuth } from '../context/AuthContext';
import { getDepartmentName } from '../utils/dashboardUtils';

export default function AllTrialsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trials, setTrials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatternCode, setSelectedPatternCode] = useState<string>('all');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        const fetchTrials = async () => {
            try {
                const data = await trialService.getAllTrials();
                setTrials(data);
            } catch (error) {
                console.error("Error fetching trials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrials();
    }, []);

    const uniquePatternCodes = useMemo(() => {
        const patternCodes = trials
            .map(trial => trial.pattern_code)
            .filter(Boolean);
        return [...new Set(patternCodes)].sort();
    }, [trials]);

    const filteredTrials = trials.filter(trial => {
        const matchesSearch = trial.trial_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trial.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trial.pattern_code?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPatternCode = selectedPatternCode === 'all' || trial.pattern_code === selectedPatternCode;

        return matchesSearch && matchesPatternCode;
    });

    const getStatusStyle = (status: string) => {
        const normalizedStatus = status ? status.toUpperCase() : 'CREATED';
        switch (normalizedStatus) {
            case 'CREATED':
                return { bgcolor: '#e0f2fe', color: '#0369a1' }; // Light Blue
            case 'IN_PROGRESS':
                return { bgcolor: '#fff7ed', color: '#c2410c' }; // Orange
            case 'CLOSED':
                return { bgcolor: '#dcfce7', color: '#15803d' }; // Green
            default:
                return { bgcolor: '#f1f5f9', color: '#475569' }; // Grey
        }
    };

    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{ minHeight: '100vh', bgcolor: COLORS.background, py: { xs: 2, sm: 3, md: 4 } }}>
                <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
                    <SaclHeader />

                    <Box sx={{
                        mt: { xs: 2, sm: 3, md: 4 },
                        mb: { xs: 2, md: 3 },
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', sm: 'center' },
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        backgroundColor: COLORS.background,
                        pb: 2
                    }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/dashboard')}
                                startIcon={<SearchIcon sx={{ transform: 'rotate(90deg)' }} />} // Using SearchIcon generic, but arrow likely better if available
                                sx={{ mr: 2 }}
                            >
                                Back
                            </Button>
                            <Typography variant="h4" fontWeight="bold" color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                                All Trials Repository
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>

                            <FormControl size="small" sx={{ bgcolor: 'white', minWidth: { xs: '100%', sm: 200 } }}>
                                <InputLabel>Pattern Code</InputLabel>
                                <Select
                                    value={selectedPatternCode}
                                    onChange={(e) => setSelectedPatternCode(e.target.value)}
                                    label="Pattern Code"
                                >
                                    <MenuItem value="all">All Patterns</MenuItem>
                                    {uniquePatternCodes.map((patternCode) => (
                                        <MenuItem key={patternCode} value={patternCode}>
                                            {patternCode}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                placeholder="Search Trial ID, Part Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ bgcolor: 'white', minWidth: { xs: '100%', sm: 250, md: 300 } }}
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

                    <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                <Table stickyHeader size={isMobile ? "small" : "medium"} sx={{ minWidth: 900 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Trial ID</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Part Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Pattern Code</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Grade</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Current Department</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', textAlign: 'center', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredTrials.length > 0 ? (
                                            filteredTrials.map((trial) => (
                                                <TableRow key={trial.trial_id} hover>
                                                    <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>{trial.trial_id}</TableCell>
                                                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>{trial.part_name}</TableCell>
                                                    <TableCell>{trial.pattern_code}</TableCell>
                                                    <TableCell>{trial.material_grade}</TableCell>
                                                    <TableCell>{new Date(trial.date_of_sampling).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{
                                                            display: 'inline-block',
                                                            px: 1.5, py: 0.5,
                                                            borderRadius: 5,
                                                            fontSize: '0.75rem',
                                                            bgcolor: '#e0f2fe',
                                                            color: '#0369a1',
                                                            fontWeight: 500
                                                        }}>
                                                            {getDepartmentName(trial.current_department_id) || 'N/A'}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{
                                                            display: 'inline-block',
                                                            px: { xs: 1, sm: 1.5 },
                                                            py: 0.5,
                                                            borderRadius: 5,
                                                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                            ...getStatusStyle(trial.status),
                                                            fontWeight: 600
                                                        }}>
                                                            {trial.status || 'CREATED'}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={!isMobile && <DescriptionIcon />}
                                                            onClick={() => navigate(`/full-report?trial_id=${trial.trial_id}`)}
                                                            sx={{ borderRadius: 2, textTransform: 'none', fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }, px: { xs: 1, sm: 2 } }}
                                                        >
                                                            {isMobile ? 'View' : 'View Report'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
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
                </Container>
            </Box>
        </ThemeProvider>
    );
}
