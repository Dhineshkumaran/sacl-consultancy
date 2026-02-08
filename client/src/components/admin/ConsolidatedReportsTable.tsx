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
        return <LoadingState message="Fetching reports..." />;
    }

    return (
        <>
            <TableContainer
                className="premium-table-container"
                sx={{
                    maxHeight: 'calc(100vh - 400px)',
                    overflow: 'auto',
                    p: 2,
                    pt: 1,
                    backgroundColor: '#fff',
                    '& .MuiTable-root': {
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                    }
                }}
            >
                <Table stickyHeader size="medium">
                    <TableHead className="premium-table-head">
                        <TableRow>
                            <TableCell className="premium-table-header-cell">Pattern Code</TableCell>
                            <TableCell className="premium-table-header-cell">Part Name</TableCell>
                            <TableCell className="premium-table-header-cell" style={{ textAlign: 'center' }}>Report</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reports.length > 0 ? (
                            reports.map((report) => (
                                <TableRow key={report.document_id} className="premium-table-row">
                                    <TableCell className="premium-table-cell-bold">{report.pattern_code}</TableCell>
                                    <TableCell className="premium-table-cell">{report.part_name}</TableCell>
                                    <TableCell className="premium-table-cell" align="center">
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleViewReport(report)}
                                            sx={{
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontSize: '0.75rem',
                                                px: 2,
                                                bgcolor: '#E67E22',
                                                '&:hover': {
                                                    bgcolor: '#D35400'
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
                                <TableCell colSpan={3} align="center" className="premium-table-cell" sx={{ py: 6 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No consolidated reports found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                Swipe to view more
            </Typography>

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
