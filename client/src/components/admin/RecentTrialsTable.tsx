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
          marginTop: '0px', // Removed top margin as it's inside a container now
          borderTop: '1px solid #e0e0e0'
        }}
      >
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Trial ID</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Part Name</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Pattern Code</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Grade</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6', textAlign: 'center' }}>Report</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trials.length > 0 ? (
              trials.map((trial) => (
                <TableRow key={trial.trial_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f39c12' }} /> {/* Orange dot equivalent */}
                      {trial.trial_id}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#555' }}>
                    <Box sx={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trial.part_name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#555' }}>{trial.pattern_code}</TableCell>
                  <TableCell sx={{ color: '#555' }}>{trial.material_grade}</TableCell>
                  <TableCell sx={{ color: '#555' }}>{new Date(trial.date_of_sampling).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>
                    <Box sx={{ fontWeight: 500, color: '#3498db' }}>
                      {trial.department || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {/* Status Pill matching Master List style */}
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor:
                          trial.status?.toUpperCase() === 'CLOSED' ? '#e6f4ea' :
                            '#fff3cd',
                        color:
                          trial.status?.toUpperCase() === 'CLOSED' ? '#1e7e34' :
                            '#856404',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {trial.status || 'PENDING'}
                    </span>
                  </TableCell>
                  <TableCell align="center">
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
                      ) : "Report not available"
                    }
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

export default RecentTrialsTable;
