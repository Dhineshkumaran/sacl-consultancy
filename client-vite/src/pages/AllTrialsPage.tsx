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
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import SaclHeader from '../components/common/SaclHeader';
import { appTheme, COLORS } from '../theme/appTheme';
import { trialService } from '../services/trialService';
import { useAuth } from '../context/AuthContext';
import { getDepartmentName } from '../utils/dashboardUtils';

export default function AllTrialsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [trials, setTrials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const isMyTrials = searchParams.get('myTrials') === 'true';

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

    const filteredTrials = trials
        .filter(trial =>
            trial.trial_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trial.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trial.pattern_code?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date_of_sampling).getTime() - new Date(a.date_of_sampling).getTime());

    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{ minHeight: '100vh', bgcolor: COLORS.background, py: 4 }}>
                <Container maxWidth="xl">
                    <SaclHeader />

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
                            <Button
                                variant="contained"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => navigate('/dashboard')}
                                sx={{ 
                                    textTransform: 'none', 
                                    bgcolor: '#5a6c7d', 
                                    color: 'white', 
                                    '&:hover': { bgcolor: '#4a5c6d' },
                                    width: { xs: '100%', sm: 'auto' }
                                }}
                            >
                                Back to Dashboard
                            </Button>
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
                                {isMyTrials ? 'Initiated Trials' : 'All Trials Repository'}
                            </Typography>
                        </Box>
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

                    <Paper sx={{ 
                        width: '100%', 
                        overflow: 'hidden', 
                        boxShadow: 3, 
                        borderRadius: 2,
                        overflowX: { xs: 'auto', md: 'hidden' }
                    }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                <CircularProgress />
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
                                            {!isMyTrials && (
                                                <>
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
                                                    }}>Actions</TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredTrials.length > 0 ? (
                                            filteredTrials.map((trial) => (
                                                <TableRow key={trial.trial_id} hover>
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
                                                    {!isMyTrials && (
                                                        <>
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
                                                                    {getDepartmentName(trial.current_department_id) || 'N/A'}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                                <Box sx={{
                                                                    display: 'inline-block',
                                                                    px: 1, py: 0.3,
                                                                    borderRadius: 5,
                                                                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                                    bgcolor: trial.status === 'Completed' ? '#dcfce7' : '#fff7ed',
                                                                    color: trial.status === 'Completed' ? '#166534' : '#9a3412',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {trial.status || 'In Progress'}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<DescriptionIcon />}
                                                                    onClick={() => navigate(`/full-report?trial_id=${trial.trial_id}`)}
                                                                    sx={{ 
                                                                        borderRadius: 2, 
                                                                        textTransform: 'none',
                                                                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                                                        padding: { xs: '4px 8px', sm: '6px 12px' }
                                                                    }}
                                                                >
                                                                    Report
                                                                </Button>
                                                            </TableCell>
                                                        </>
                                                    )}
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

                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
