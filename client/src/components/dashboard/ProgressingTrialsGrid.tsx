import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Table, TableBody, TableCell, TableRow, TableHead, Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { trialService } from '../../services/trialService';
import departmentProgressService from '../../services/departmentProgressService';
import { useAuth } from '../../context/AuthContext';
import ProgressingTrialModal from './ProgressingTrialModal';
import GearSpinner from '../common/GearSpinner';
import { formatDate } from '../../utils/dateUtils';

interface ProgressingTrialsGridProps {
    departmentId: number;
}

const ProgressingTrialsGrid: React.FC<ProgressingTrialsGridProps> = ({ departmentId }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [progressingTrials, setProgressingTrials] = useState<any[]>([]);
    const [loadingTrials, setLoadingTrials] = useState(false);
    const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchProgressing = async () => {
            if (departmentId === 4 || departmentId === 6 || departmentId === 7 || departmentId === 8) {
                setLoadingTrials(true);
                try {
                    let data;
                    if (departmentId === 8 && user?.username) {
                        data = await departmentProgressService.getProgress(user.username, 8);
                    } else {
                        data = await trialService.getProgressingTrials();
                    }
                    setProgressingTrials(data);
                } catch (error) {
                    console.error('Failed to fetch progressing trials:', error);
                } finally {
                    setLoadingTrials(false);
                }
            }
        };

        fetchProgressing();
        // Refresh every 2 minutes
        const interval = setInterval(fetchProgressing, 120000);
        return () => clearInterval(interval);
    }, [departmentId]);

    if (departmentId !== 4 && departmentId !== 6 && departmentId !== 7 && departmentId !== 8) {
        return null;
    }

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        color: '#E67E22',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    Progressing Trials
                </Typography>

                {loadingTrials ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <div style={{ transform: 'scale(0.7)' }}><GearSpinner /></div>
                    </Box>
                ) : progressingTrials.length > 0 ? (
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table
                            size="small"
                            sx={{
                                minWidth: 1200,
                                '& th': {
                                    fontSize: '0.75rem',
                                    py: 1,
                                    px: 1.5,
                                    bgcolor: '#f1f5f9',
                                    fontWeight: 600,
                                    border: '1px solid #FFE0B2',
                                    whiteSpace: 'nowrap'
                                },
                                '& td': {
                                    fontSize: '0.75rem',
                                    py: 1,
                                    px: 1.5,
                                    border: '1px solid #FFE0B2',
                                    bgcolor: '#FFF3E0'
                                }
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell>Pattern Code</TableCell>
                                    <TableCell>Part Name</TableCell>
                                    {departmentId !== 8 && <TableCell>Date of Sampling</TableCell>}
                                    {departmentId !== 8 && <TableCell>No. of Moulds</TableCell>}
                                    <TableCell>DISA / FOUNDRY-A</TableCell>
                                    {departmentId !== 8 && <TableCell>Reason For Sampling</TableCell>}
                                    {departmentId !== 8 && <TableCell>Sample Traceability</TableCell>}
                                    {departmentId !== 8 && <TableCell>Trial Type</TableCell>}
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {progressingTrials.map((trial) => (
                                    <TableRow
                                        key={trial.trial_id}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: '#FFE0B2 !important',
                                                '& td': {
                                                    bgcolor: '#FFE0B2 !important'
                                                }
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 600 }}>{trial.pattern_code}</TableCell>
                                        <TableCell>{trial.part_name}</TableCell>
                                        {departmentId !== 8 && <TableCell>{formatDate(trial.date_of_sampling) || '-'}</TableCell>}
                                        {departmentId !== 8 && <TableCell>{trial.plan_moulds || '-'}</TableCell>}
                                        <TableCell>{trial.disa || '-'}</TableCell>
                                        {departmentId !== 8 && <TableCell>{trial.reason_for_sampling || '-'}</TableCell>}
                                        {departmentId !== 8 && <TableCell>{trial.sample_traceability || '-'}</TableCell>}
                                        {departmentId !== 8 && <TableCell>{trial.trial_type || '-'}</TableCell>}
                                        <TableCell align="center">
                                            {departmentId === 8 ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => navigate(`/foundry-sample-card?trial_id=${trial.trial_id}`)}
                                                        sx={{
                                                            bgcolor: '#E67E22',
                                                            fontSize: '0.7rem',
                                                            py: 0.5,
                                                            px: 1.5,
                                                            '&:hover': { bgcolor: '#D35400' },
                                                            whiteSpace: 'nowrap',
                                                            width: '100%',
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        View Foundry Sample Card
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => navigate(`/material-correction?trial_id=${trial.trial_id}`)}
                                                        sx={{
                                                            bgcolor: '#E67E22',
                                                            fontSize: '0.7rem',
                                                            py: 0.5,
                                                            px: 1.5,
                                                            '&:hover': { bgcolor: '#D35400' },
                                                            whiteSpace: 'nowrap',
                                                            width: '100%',
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        View Material Correction
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => navigate(`/visual-inspection?trial_id=${trial.trial_id}`)}
                                                        sx={{
                                                            bgcolor: '#E67E22',
                                                            fontSize: '0.7rem',
                                                            py: 0.5,
                                                            px: 1.5,
                                                            '&:hover': { bgcolor: '#D35400' },
                                                            whiteSpace: 'nowrap',
                                                            width: '100%',
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        View Visual Data
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => navigate(`/metallurgical-inspection?trial_id=${trial.trial_id}`)}
                                                        sx={{
                                                            bgcolor: '#E67E22',
                                                            fontSize: '0.7rem',
                                                            py: 0.5,
                                                            px: 1.5,
                                                            '&:hover': { bgcolor: '#D35400' },
                                                            whiteSpace: 'nowrap',
                                                            width: '100%',
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        View Metallurgical Data
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => navigate(`/dimensional-inspection?trial_id=${trial.trial_id}`)}
                                                        sx={{
                                                            bgcolor: '#E67E22',
                                                            fontSize: '0.7rem',
                                                            py: 0.5,
                                                            px: 1.5,
                                                            '&:hover': { bgcolor: '#D35400' },
                                                            whiteSpace: 'nowrap',
                                                            width: '100%',
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        View Dimensional Inspection
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<InfoIcon sx={{ fontSize: '14px !important' }} />}
                                                    onClick={() => {
                                                        setSelectedTrialId(trial.trial_id);
                                                        setIsModalOpen(true);
                                                    }}
                                                    sx={{
                                                        bgcolor: '#E67E22',
                                                        fontSize: '0.7rem',
                                                        py: 0.5,
                                                        px: 1.5,
                                                        '&:hover': { bgcolor: '#D35400' },
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            bgcolor: '#f8f9fa',
                            p: 4,
                            borderRadius: 2,
                            textAlign: 'center',
                            border: '1px dashed #ddd'
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#999',
                                fontStyle: 'italic'
                            }}
                        >
                            No progressing trials at the moment
                        </Typography>
                    </Box>
                )}
            </Box>

            {selectedTrialId && (
                <ProgressingTrialModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTrialId(null);
                    }}
                    trialId={selectedTrialId}
                />
            )}
        </>
    );
};

export default ProgressingTrialsGrid;