import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { trialService } from '../../services/trialService';
import { getDepartmentName } from '../../utils/dashboardUtils';
import DocumentViewer from '../common/DocumentViewer';

interface Trial {
  trial_id: string;
  part_name: string;
  pattern_code: string;
  material_grade: string;
  date_of_sampling: string;
  current_department_id: number;
  status: string;
  file_base64?: string;
  file_name?: string;
  document_type?: string;
}

const TrialsTable: React.FC = () => {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<any>(null);

  useEffect(() => {
    const fetchTrials = async () => {
      try {
        setLoading(true);
        const data = await trialService.getAllTrialReports();
        setTrials(data.slice(0, 50)); // Display first 50 trials
      } catch (error) {
        console.error('Error fetching trials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrials();
  }, []);

  const handleViewReport = (trial: Trial) => {
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <TableContainer
        sx={{
          maxHeight: 'calc(100vh - 400px)',
          overflow: 'auto',
          marginTop: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        component={Paper}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>Trial ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Part Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Pattern Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trials.length > 0 ? (
              trials.map((trial) => (
                <TableRow key={trial.trial_id}>
                  <TableCell sx={{ fontWeight: 600 }}>{trial.trial_id}</TableCell>
                  <TableCell>
                    <Box sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {trial.part_name}
                    </Box>
                  </TableCell>
                  <TableCell>{trial.pattern_code}</TableCell>
                  <TableCell>{trial.material_grade}</TableCell>
                  <TableCell>{new Date(trial.date_of_sampling).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.3,
                        borderRadius: 5,
                        fontSize: '0.75rem',
                        bgcolor: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getDepartmentName(trial.current_department_id) || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.3,
                        borderRadius: 5,
                        fontSize: '0.75rem',
                        bgcolor: trial.status === 'Completed' ? '#dcfce7' : '#fff7ed',
                        color: trial.status === 'Completed' ? '#166534' : '#9a3412',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {trial.status || 'In Progress'}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DescriptionIcon />}
                      onClick={() => handleViewReport(trial)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        padding: '6px 12px'
                      }}
                    >
                      Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                  No trials found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="md" fullWidth>
        <DialogTitle>Trial Report - {viewReport?.trialId}</DialogTitle>
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
    </>
  );
};

export default TrialsTable;
