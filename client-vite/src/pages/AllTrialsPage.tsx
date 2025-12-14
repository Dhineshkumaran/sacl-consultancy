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
    CircularProgress,
    TextField,
    InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import SaclHeader from '../components/common/SaclHeader';
import { appTheme, COLORS } from '../theme/appTheme';
import { trialService } from '../services/trialService';
import { useAuth } from '../context/AuthContext';

export default function AllTrialsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trials, setTrials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredTrials = trials.filter(trial =>
        trial.trial_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trial.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trial.pattern_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{ minHeight: '100vh', bgcolor: COLORS.background, py: 4 }}>
                <Container maxWidth="xl">
                    <SaclHeader />

                    <Box sx={{ mt: 4, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            All Trials Repository
                        </Typography>
                        <TextField
                            placeholder="Search Trial ID, Part Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            sx={{ bgcolor: 'white', minWidth: 300 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Trial ID</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Part Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Pattern Code</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Grade</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', textAlign: 'center' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredTrials.length > 0 ? (
                                            filteredTrials.map((trial) => (
                                                <TableRow key={trial.trial_id} hover>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>{trial.trial_id}</TableCell>
                                                    <TableCell>{trial.part_name}</TableCell>
                                                    <TableCell>{trial.pattern_code}</TableCell>
                                                    <TableCell>{trial.material_grade}</TableCell>
                                                    <TableCell>{new Date(trial.date_of_sampling).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{
                                                            display: 'inline-block',
                                                            px: 1.5, py: 0.5,
                                                            borderRadius: 5,
                                                            fontSize: '0.75rem',
                                                            bgcolor: trial.status === 'Completed' ? '#dcfce7' : '#fff7ed',
                                                            color: trial.status === 'Completed' ? '#166534' : '#9a3412'
                                                        }}>
                                                            {trial.status || 'In Progress'}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={<DescriptionIcon />}
                                                            onClick={() => navigate(`/full-report?trial_id=${trial.trial_id}`)}
                                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                                        >
                                                            View Report
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
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
                        <Button
                            variant="text"
                            color="secondary"
                            onClick={() => navigate('/dashboard')}
                        >
                            Back to Dashboard
                        </Button>
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
