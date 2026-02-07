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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
} from '@mui/material';
import LoadingState from '../common/LoadingState';
import { trialService } from '../../services/trialService';
import DocumentViewer from '../common/DocumentViewer';

interface Trial {
  trial_id: string;
  part_name: string;
  pattern_code: string;
  material_grade: string;
  date_of_sampling: string;
  department: string;
  status: string;
  file_base64?: string;
  file_name?: string;
  document_type?: string;
}

const RecentTrialsTable: React.FC = () => {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    const fetchTrials = async () => {
      try {
        setLoading(true);
        const data = await trialService.getRecentTrialReports();
        setTrials(data);
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
    return <LoadingState message="Fetching trials..." />;
  }

  return (
    <>
      <TableContainer className="premium-table-container" sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
        <Table stickyHeader size="medium">
          <TableHead className="premium-table-head">
            <TableRow>
              <TableCell className="premium-table-header-cell">Trial ID</TableCell>
              <TableCell className="premium-table-header-cell">Part Name</TableCell>
              <TableCell className="premium-table-header-cell">Pattern Code</TableCell>
              <TableCell className="premium-table-header-cell">Grade</TableCell>
              <TableCell className="premium-table-header-cell">Date</TableCell>
              <TableCell className="premium-table-header-cell">Department</TableCell>
              <TableCell className="premium-table-header-cell">Status</TableCell>
              <TableCell className="premium-table-header-cell" style={{ textAlign: 'center' }}>Report</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trials.length > 0 ? (
              trials.map((trial) => (
                <TableRow key={trial.trial_id} className="premium-table-row">
                  <TableCell className="premium-table-cell-bold">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f39c12' }} />
                      {trial.trial_id}
                    </Box>
                  </TableCell>
                  <TableCell className="premium-table-cell">
                    <Box sx={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trial.part_name}
                    </Box>
                  </TableCell>
                  <TableCell className="premium-table-cell">{trial.pattern_code}</TableCell>
                  <TableCell className="premium-table-cell">{trial.material_grade}</TableCell>
                  <TableCell className="premium-table-cell">{new Date(trial.date_of_sampling).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell className="premium-table-cell">
                    <Box sx={{ fontWeight: 600, color: '#3498db' }}>
                      {trial.department || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell className="premium-table-cell">
                    <span
                      className={`status-pill ${trial.status?.toUpperCase() === 'CLOSED' ? 'status-pill-success' :
                        trial.status?.toUpperCase() === 'CREATED' ? 'status-pill-info' :
                          'status-pill-warning'
                        }`}
                    >
                      {trial.status || 'PENDING'}
                    </span>
                  </TableCell>
                  <TableCell className="premium-table-cell" align="center">
                    {
                      trial.status === 'CLOSED' && trial.file_base64 ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewReport(trial)}
                          sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            padding: '2px 10px',
                            minWidth: 'auto',
                            borderColor: '#3498db',
                            color: '#3498db',
                            '&:hover': {
                              borderColor: '#2980b9',
                              bgcolor: '#ebf5fb'
                            }
                          }}
                        >
                          View
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )
                    }
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" className="premium-table-cell" sx={{ py: 6 }}>
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

export default RecentTrialsTable;
