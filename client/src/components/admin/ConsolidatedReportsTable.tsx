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
    Typography,
} from '@mui/material';
import { trialService } from '../../services/trialService';
import DocumentViewer from '../common/DocumentViewer';

interface ConsolidatedReport {
    document_id: number;
    pattern_code: string;
    part_name: string;
    file_base64: string;
    file_name: string;
}

const ConsolidatedReportsTable: React.FC = () => {
    const [reports, setReports] = useState<ConsolidatedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewReport, setViewReport] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                const data = await trialService.getConsolidatedReports();
                setReports(data);
            } catch (error) {
                console.error('Error fetching consolidated reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleViewReport = (report: ConsolidatedReport) => {
        const document = {
            document_id: report.document_id,
            file_name: report.file_name,
            document_type: 'CONSOLIDATED_REPORT',
            file_base64: report.file_base64,
            uploaded_by: 'System',
            uploaded_at: new Date().toISOString(),
            remarks: 'Consolidated Trial History'
        };
        setViewReport({
            patternCode: report.pattern_code,
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
                    borderTop: '1px solid #e0e0e0'
                }}
            >
                <Table stickyHeader size="medium">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Pattern Code</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6' }}>Part Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#95a5a6', textAlign: 'center' }}>Report</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reports.length > 0 ? (
                            reports.map((report) => (
                                <TableRow key={report.document_id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>{report.pattern_code}</TableCell>
                                    <TableCell sx={{ color: '#555' }}>{report.part_name}</TableCell>
                                    <TableCell align="center">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleViewReport(report)}
                                            sx={{
                                                borderRadius: 1,
                                                textTransform: 'none',
                                                fontSize: '0.75rem',
                                                padding: '2px 10px',
                                                borderColor: '#3498db',
                                                color: '#3498db',
                                                '&:hover': {
                                                    borderColor: '#2980b9',
                                                    bgcolor: '#ebf5fb'
                                                }
                                            }}
                                        >
                                            View History
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} sx={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                    No consolidated reports found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="md" fullWidth>
                <DialogTitle>Consolidated Report - {viewReport?.patternCode}</DialogTitle>
                <DialogContent>
                    {viewReport && (
                        <DocumentViewer
                            documents={viewReport.documents}
                            label="Consolidated History"
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

export default ConsolidatedReportsTable;
