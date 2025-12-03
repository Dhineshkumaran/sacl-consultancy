import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ThemeProvider,
  createTheme
} from '@mui/material';
import SandPropertiesTable from '../components/sand';

// Colors
const SAKTHI_COLORS = {
  primary: '#2950bbff',
  secondary: '#DC2626',
  accent: '#F59E0B',
  background: '#F8FAFC',
  lightBlue: '#3B82F6',
  darkGray: '#374151',
  lightGray: '#E5E7EB',
  white: '#FFFFFF',
  success: '#10B981',
};

const theme = createTheme({
  palette: {
    primary: { main: SAKTHI_COLORS.primary },
    secondary: { main: SAKTHI_COLORS.secondary },
    background: { default: SAKTHI_COLORS.background },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
  },
});

interface PendingCard {
  id: string;
  trialNo: string;
  partName: string;
  patternCode: string;
  machine: string;
  samplingDate: string;
  submittedAt: string;
  status: 'pending' | 'in_progress' | 'completed';
  selectedPart?: any;
  selectedPattern?: any;
  reason?: string;
  mouldCount?: string;
  sampleTraceability?: string;
  patternFiles?: File[];
  stdFiles?: File[];
}

const PendingSampleCardsPage: React.FC = () => {
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<PendingCard | null>(null);
  const [openSandDialog, setOpenSandDialog] = useState(false);

  useEffect(() => {
    fetchPendingCards();
  }, []);

  const fetchPendingCards = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch('http://localhost:3000/api/pending-sample-cards');
      if (!response.ok) {
        throw new Error('Failed to fetch pending cards');
      }
      const data = await response.json();
      setPendingCards(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending cards:', err);
      // Mock data for testing
      const mockData: PendingCard[] = [
        {
          id: '1',
          trialNo: 'TRIAL-001',
          partName: 'Cylinder Head',
          patternCode: 'PAT-001',
          machine: 'DISA-1',
          samplingDate: '2024-11-25',
          submittedAt: '2024-11-25 10:30 AM',
          status: 'pending',
        },
        {
          id: '2',
          trialNo: 'TRIAL-002',
          partName: 'Engine Block',
          patternCode: 'PAT-002',
          machine: 'DISA-2',
          samplingDate: '2024-11-26',
          submittedAt: '2024-11-26 02:15 PM',
          status: 'pending',
        },
        {
          id: '3',
          trialNo: 'TRIAL-003',
          partName: 'Transmission Housing',
          patternCode: 'PAT-003',
          machine: 'DISA-3',
          samplingDate: '2024-11-27',
          submittedAt: '2024-11-27 11:45 AM',
          status: 'in_progress',
        },
      ];
      setPendingCards(mockData);
      setError('Using mock data for demonstration');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (card: PendingCard) => {
    setSelectedCard(card);
    setOpenSandDialog(true);
  };

  const handleCloseSandDialog = () => {
    setOpenSandDialog(false);
    setSelectedCard(null);
  };

  const handleSandSave = (data: any) => {
    console.log('Sand properties saved:', data);
  };

  const handleSandComplete = () => {
    // Update the card status
    if (selectedCard) {
      setPendingCards(prev => 
        prev.map(card => 
          card.id === selectedCard.id 
            ? { ...card, status: 'completed' }
            : card
        )
      );
    }
    handleCloseSandDialog();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'in_progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: '100vh', p: 3 }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: SAKTHI_COLORS.primary }}>
              📋 Pending Sample Cards for Sand Analysis
            </Typography>
            <Typography variant="body2" sx={{ color: SAKTHI_COLORS.darkGray }}>
              View and process sample cards awaiting sand property analysis
            </Typography>
          </Box>

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress size={60} />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Pending Cards Table */}
          {!loading && (
            <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: SAKTHI_COLORS.lightBlue }}>
                    <TableCell sx={{ fontWeight: 700, color: SAKTHI_COLORS.white }}>Trial No</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: SAKTHI_COLORS.white }}>Pattern Code</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: SAKTHI_COLORS.white }}>Part Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: SAKTHI_COLORS.white }}>Machine</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: SAKTHI_COLORS.white }}>Sampling Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: SAKTHI_COLORS.white }}>Submitted At</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: SAKTHI_COLORS.white }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: SAKTHI_COLORS.white }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingCards.length > 0 ? (
                    pendingCards.map((card) => (
                      <TableRow key={card.id} sx={{ '&:hover': { backgroundColor: SAKTHI_COLORS.background } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{card.trialNo}</TableCell>
                        <TableCell>{card.patternCode}</TableCell>
                        <TableCell>{card.partName}</TableCell>
                        <TableCell>{card.machine}</TableCell>
                        <TableCell>{card.samplingDate}</TableCell>
                        <TableCell sx={{ fontSize: '0.9rem' }}>{card.submittedAt}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(card.status)}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(card.status),
                              color: card.status === 'in_progress' || card.status === 'completed' ? SAKTHI_COLORS.white : SAKTHI_COLORS.darkGray,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {card.status === 'pending' && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleViewDetails(card)}
                              sx={{
                                backgroundColor: SAKTHI_COLORS.primary,
                                '&:hover': { backgroundColor: SAKTHI_COLORS.lightBlue },
                              }}
                            >
                              Start Analysis
                            </Button>
                          )}
                          {card.status === 'in_progress' && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleViewDetails(card)}
                              sx={{
                                backgroundColor: SAKTHI_COLORS.accent,
                                '&:hover': { backgroundColor: '#daa706' },
                              }}
                            >
                              Continue
                            </Button>
                          )}
                          {card.status === 'completed' && (
                            <Chip
                              label="✓ Completed"
                              size="small"
                              sx={{
                                backgroundColor: SAKTHI_COLORS.success,
                                color: SAKTHI_COLORS.white,
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No pending sample cards at the moment
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Sand Analysis Dialog */}
          <Dialog
            open={openSandDialog}
            onClose={handleCloseSandDialog}
            maxWidth="lg"
            fullWidth
            sx={{
              '& .MuiDialog-paper': {
                maxHeight: '90vh',
              },
            }}
          >
            <DialogTitle sx={{ fontWeight: 700, color: SAKTHI_COLORS.primary }}>
              Sand Properties Analysis - {selectedCard?.trialNo}
            </DialogTitle>
            <DialogContent sx={{ p: 0, overflow: 'auto' }}>
              {selectedCard && (
                <SandPropertiesTable
                  submittedData={{
                    selectedPart: selectedCard.selectedPart,
                    selectedPattern: selectedCard.selectedPattern,
                    machine: selectedCard.machine || '',
                    reason: selectedCard.reason || '',
                    trialNo: selectedCard.trialNo,
                    samplingDate: selectedCard.samplingDate || '',
                    mouldCount: selectedCard.mouldCount || '',
                    sampleTraceability: selectedCard.sampleTraceability || '',
                  }}
                  onSave={handleSandSave}
                  onComplete={handleSandComplete}
                  fromPendingCards={true}
                />
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${SAKTHI_COLORS.lightGray}` }}>
              <Button
                onClick={handleCloseSandDialog}
                sx={{ color: SAKTHI_COLORS.darkGray }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PendingSampleCardsPage;
