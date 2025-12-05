// src/components/PouringDetailsTable.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  ThemeProvider,
  createTheme,
  Box,
  Button,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// Import inspection component used by moulding preview
import MetallurgicalInspection from './MetallurgicalInspection';

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
  },
});

// Exported interfaces
export interface PouringDetails {
  date: string;
  heatCode: string;
  cComposition: string;
  siComposition: string;
  mnComposition: string;
  pComposition: string;
  sComposition: string;
  mgComposition: string;
  crComposition: string;
  cuComposition: string;
  pouringTempDegC: string;
  pouringTimeSec: string;
  ficHeatNo: string;
  ppCode: string;
  followedBy: string;
  userName: string;
}

export interface SubmittedData {
  selectedPart: any | null;
  selectedPattern: any | null;
  machine: string;
  reason: string;
  trialNo: string;
  samplingDate: string;
  mouldCount: string;
  sampleTraceability: string;
}

interface PouringDetailsProps {
  pouringDetails: PouringDetails;
  onPouringDetailsChange: (details: PouringDetails) => void;
  submittedData: SubmittedData;
}

const PouringDetailsTable: React.FC<PouringDetailsProps> = ({
  pouringDetails,
  onPouringDetailsChange,
  submittedData,
}) => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement | null>(null);

  // preview / save flow like the moulding table
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);
  // When true we display MetallurgicalInspection in the same route
  const [showInspection, setShowInspection] = useState(false);

  const handleChange = (field: string, value: string) => {
    onPouringDetailsChange({
      ...pouringDetails,
      [field]: value,
    });
  };

  /* -------------------------
    Parsers copied from moulding for SubmittedSampleCard
     ------------------------- */
  const parseTensileData = (tensile: string) => {
    const lines = tensile ? tensile.split('\n') : [];
    let tensileStrength = '';
    let yieldStrength = '';
    let elongation = '';
    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (
        !tensileStrength &&
        (cleanLine.match(/\d+\s*(MPa|N\/mm²|Mpa|Kgf\/mm²)/) || cleanLine.includes('Tensile Strength'))
      ) {
        const m = cleanLine.match(/(\d+)/);
        if (m) tensileStrength = m[1];
      }
      if (!yieldStrength && cleanLine.includes('Yield')) {
        const m = cleanLine.match(/(\d+)/);
        if (m) yieldStrength = m[1];
      }
      if (!elongation && (cleanLine.includes('Elongation') || cleanLine.includes('%'))) {
        const m = cleanLine.match(/(\d+)/);
        if (m) elongation = m[1];
      }
    });
    return { tensileStrength, yieldStrength, elongation, impactCold: '', impactRoom: '' };
  };

  const parseMicrostructureData = (microstructure: string) => {
    const lines = microstructure ? microstructure.split('\n') : [];
    let nodularity = '';
    let pearlite = '';
    let carbide = '';
    lines.forEach((line) => {
      const cleanLine = line.toLowerCase();
      if (!nodularity && cleanLine.includes('nodularity')) {
        const m = cleanLine.match(/(\d+)/);
        if (m) nodularity = m[1];
      }
      if (!pearlite && cleanLine.includes('pearlite')) {
        const m = cleanLine.match(/(\d+)/);
        if (m) pearlite = m[1];
      }
      if (!carbide && (cleanLine.includes('carbide') || cleanLine.includes('cementite'))) {
        const m = cleanLine.match(/(\d+)/);
        if (m) carbide = m[1];
      }
    });
    return { nodularity: nodularity || '--', pearlite: pearlite || '--', carbide: carbide || '--' };
  };

  const parseHardnessData = (hardness: string) => {
    const lines = hardness ? hardness.split('\n') : [];
    let surface = '';
    let core = '';
    lines.forEach((line) => {
      const cleanLine = line.toLowerCase();
      if (cleanLine.includes('surface') && !surface) {
        const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
        if (m) surface = m[1];
      } else if (cleanLine.includes('core') && !core) {
        const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
        if (m) core = m[1];
      } else if (!surface) {
        const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
        if (m) surface = m[1];
      }
    });
    return { surface: surface || '--', core: core || '--' };
  };

  /* -------------------------
    SubmittedSampleCard (read-only) adapted from moulding
   ------------------------- */
  const SubmittedSampleCard: React.FC<{ submittedData: any }> = ({ submittedData }) => {
    const chemicalData = submittedData?.selectedPart
      ? submittedData.selectedPart.chemical_composition || { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' }
      : { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' };

    const tensileData = submittedData?.selectedPart
      ? parseTensileData(submittedData.selectedPart.tensile || '')
      : { tensileStrength: '', yieldStrength: '', elongation: '', impactCold: '', impactRoom: '' };

    const microData = submittedData?.selectedPart
      ? parseMicrostructureData(submittedData.selectedPart.micro_structure || '')
      : { nodularity: '', pearlite: '', carbide: '' };

    const hardnessData = submittedData?.selectedPart
      ? parseHardnessData(submittedData.selectedPart.hardness || '')
      : { surface: '', core: '' };

    return (
      <Paper
        variant="outlined"
        sx={{
          overflow: 'hidden',
          mb: 3,
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.45)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(148,163,184,0.18))',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 80px rgba(15,23,42,0.65)',
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(148,163,184,0.55)', background: 'linear-gradient(135deg, rgba(15,23,42,0.75), rgba(30,64,175,0.90))', color: SAKTHI_COLORS.white }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            <Box>
              <Box sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Pattern Code</Box>
              <TextField fullWidth value={submittedData?.selectedPattern?.pattern_code || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: 'rgba(248,250,252,0.98)', borderRadius: 2, color: SAKTHI_COLORS.darkGray, fontWeight: 600 } }} />
            </Box>
            <Box>
              <Box sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Part Name</Box>
              <TextField fullWidth value={submittedData?.selectedPart?.part_name || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: 'rgba(248,250,252,0.98)', borderRadius: 2, color: SAKTHI_COLORS.darkGray, fontWeight: 600 } }} />
            </Box>
            <Box>
              <Box sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>TRIAL No</Box>
              <TextField fullWidth value={submittedData?.trialNo || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: 'rgba(248,250,252,0.98)', borderRadius: 2, color: SAKTHI_COLORS.darkGray, fontWeight: 600 } }} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Box sx={{ bgcolor: SAKTHI_COLORS.accent, p: 1.5, textAlign: 'center', color: SAKTHI_COLORS.white }}>
            <Box sx={{ fontWeight: 800 }}>METALLURGICAL SPECIFICATION</Box>
          </Box>
        </Box>
      </Paper>
    );
  };

  // Auto-fetch current date
  useEffect(() => {
    if (!pouringDetails.date) {
      const currentDate = new Date().toISOString().split('T')[0];
      handleChange('date', currentDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentView, setCurrentView] = useState<'pouring' | 'success'>('pouring');

  // send payload to backend (used by preview final save)
  const sendToServer = useCallback(async (payload: any) => {
    const BACKEND = 'http://localhost:3000';
    const url = `${BACKEND}/api/pouring`;
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await axios.post(url, payload, { headers, timeout: 10000 });
      if (!res || res.status < 200 || res.status >= 300) throw new Error(res?.data?.message || `Server ${res?.status}`);
      return res.data;
    } catch (err) {
      console.error('Pouring submit failed', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  // Save & Continue -> open preview (apple-glass)
  // NOTE: removed required-field validation so preview can open even with empty fields
  const handleSaveAndContinue = () => {
    const payload = { pouringDetails: { ...pouringDetails }, submittedData: submittedData ?? undefined };
    setPreviewPayload(payload);
    setPreviewMode(true);
    setPreviewSubmitted(false);
    setMessage(null);
  };

  // Final save from preview
  const handleFinalSave = async () => {
    if (!previewPayload) return;
    try {
      setMessage(null);
      const result = await sendToServer(previewPayload);
      setPreviewSubmitted(true);
      setMessage('Pouring data submitted successfully.');
    } catch (err: any) {
      console.error('Pouring final save error', err);
      setMessage(err?.message || 'Failed to submit pouring data');
    }
  };

  // Export preview to PDF (grayscale + pagination like moulding)
  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) {
      setMessage('Nothing to export');
      return;
    }

    try {
      setExporting(true);

      const originalScrollY = window.scrollY;
      el.scrollIntoView({ behavior: 'auto', block: 'center' });

      const sourceCanvas = await html2canvas(el as HTMLElement, { scale: 2, useCORS: true, logging: false });

      window.scrollTo(0, originalScrollY);

      // Convert to black & white (grayscale)
      const bwCanvas = document.createElement('canvas');
      bwCanvas.width = sourceCanvas.width;
      bwCanvas.height = sourceCanvas.height;
      const bwCtx = bwCanvas.getContext('2d');
      if (!bwCtx) throw new Error('Could not get BW canvas context');

      bwCtx.drawImage(sourceCanvas, 0, 0);
      const imgDataObj = bwCtx.getImageData(0, 0, bwCanvas.width, bwCanvas.height);
      const dataArr = imgDataObj.data;
      for (let i = 0; i < dataArr.length; i += 4) {
        const r = dataArr[i];
        const g = dataArr[i + 1];
        const b = dataArr[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        dataArr[i] = gray;
        dataArr[i + 1] = gray;
        dataArr[i + 2] = gray;
      }
      bwCtx.putImageData(imgDataObj, 0, 0);

      const canvas = bwCanvas;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      const scale = (pageWidth - margin * 2) / canvas.width;
      const imgHeight = canvas.height * scale;
      const imgWidth = canvas.width * scale;

      if (imgHeight <= pageHeight - margin * 2) {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        const totalPages = Math.ceil(imgHeight / (pageHeight - margin * 2));
        const sliceHeightPx = Math.floor((pageHeight - margin * 2) / scale);

        for (let page = 0; page < totalPages; page++) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          const remainingPx = canvas.height - page * sliceHeightPx;
          pageCanvas.height = remainingPx < sliceHeightPx ? remainingPx : sliceHeightPx;

          const ctx = pageCanvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');

          ctx.drawImage(
            canvas,
            0,
            page * sliceHeightPx,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );

          const pageData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = pageCanvas.height * scale;

          if (page > 0) pdf.addPage();
          pdf.addImage(pageData, 'PNG', margin, margin, imgWidth, pageImgHeight);
        }
      }

      const pdfBlobUrl = pdf.output('bloburl');
      window.open(pdfBlobUrl, '_blank');
    } catch (err) {
      console.error('Export PDF failed:', err);
      setMessage('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleBackToPouring = () => setCurrentView('pouring');
  const handleCloseToDashboard = () => navigate('/dashboard');

  // Render success message
  if (currentView === 'success') {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            p: 3,
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 600, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 600 }}>
              ✅ Pouring Details Saved Successfully!
            </Alert>
            <Button variant="contained" onClick={handleBackToPouring} sx={{ minWidth: 160 }}>
              Back to Pouring
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // If showInspection is true, render MetallurgicalInspection in-place
  if (showInspection) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ p: 3, position: 'relative' }}>
          <MetallurgicalInspection />
        </Box>
      </ThemeProvider>
    );
  }

  // Render pouring details form
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ position: 'relative', p: 3 }}>
        {/* Preview overlay (Apple-glass) */}
        {previewMode && previewPayload && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(15,23,42,0.5)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <Box
              sx={{
                width: '90%',
                maxWidth: 980,
                maxHeight: '80vh',
                overflow: 'auto',
                borderRadius: 4,
                p: 3,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.82), rgba(248,250,252,0.9))',
                boxShadow: '0 25px 80px rgba(15,23,42,0.45)',
                border: '1px solid rgba(255,255,255,0.8)',
                position: 'relative',
              }}
            >
              {/* Close button in preview - routes to /sand */}
              <IconButton
                onClick={() => {
                  navigate('/sand');
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: '#DC2626',
                  '&:hover': { backgroundColor: 'rgba(220,38,38,0.08)' },
                }}
              >
                <CloseIcon />
              </IconButton>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} pr={5}>
                <Box>
                  <Box component="div" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    Pouring – Preview
                  </Box>
                  <Box component="div" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    Review your data before final submission
                  </Box>
                </Box>
              </Box>

              {/* attach ref here so export can capture the preview content */}
              <Box ref={printRef}>
                {previewPayload.submittedData && (
                <Box mb={3}>
                  {/* Minimal submitted sample info */}
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Box sx={{ fontWeight: 600, mb: 0.5 }}>Pattern Code</Box>
                        <TextField fullWidth size="small" value={previewPayload.submittedData.selectedPattern?.pattern_code || ''} InputProps={{ readOnly: true }} />
                      </Box>
                      <Box>
                        <Box sx={{ fontWeight: 600, mb: 0.5 }}>Part Name</Box>
                        <TextField fullWidth size="small" value={previewPayload.submittedData.selectedPart?.part_name || ''} InputProps={{ readOnly: true }} />
                      </Box>
                      <Box>
                        <Box sx={{ fontWeight: 600, mb: 0.5 }}>TRIAL No</Box>
                        <TextField fullWidth size="small" value={previewPayload.submittedData.trialNo || ''} InputProps={{ readOnly: true }} />
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                )}

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
                <Box sx={{ fontWeight: 700, mb: 1 }}>Pouring Data</Box>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>{previewPayload.pouringDetails.date || '--'}</TableCell>
                      <TableCell>Heat Code</TableCell>
                      <TableCell>{previewPayload.pouringDetails.heatCode || '--'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Composition (C/Si/Mn)</TableCell>
                      <TableCell>{(previewPayload.pouringDetails.cComposition || '--') + ' / ' + (previewPayload.pouringDetails.siComposition || '--') + ' / ' + (previewPayload.pouringDetails.mnComposition || '--')}</TableCell>
                      <TableCell>Pouring Temp / Time</TableCell>
                      <TableCell>{(previewPayload.pouringDetails.pouringTempDegC || '--') + ' / ' + (previewPayload.pouringDetails.pouringTimeSec || '--')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
              </Box>

              {message && (
                <Box mt={1}>
                  <Box sx={{ p: 1, bgcolor: previewSubmitted ? 'rgba(16,185,129,0.12)' : 'rgba(14,165,233,0.06)', borderRadius: 2 }}>{message}</Box>
                </Box>
              )}

              <Box mt={3} display="flex" alignItems="center" gap={2}>
                <Button variant="outlined" onClick={() => setPreviewMode(false)} disabled={sending || previewSubmitted}>
                  Edit
                </Button>

                <Button variant="contained" onClick={() => handleExportPDF()} disabled={exporting} sx={{ backgroundColor: SAKTHI_COLORS.primary }}>
                  {exporting ? 'Generating PDF...' : 'Export PDF'}
                </Button>

                <Button variant="contained" onClick={handleFinalSave} disabled={sending || previewSubmitted} sx={{ backgroundColor: SAKTHI_COLORS.accent }}>
                  {sending ? 'Saving...' : previewSubmitted ? 'Saved' : 'Save'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Pouring Details Table */}
        <Paper
          variant="outlined"
          sx={{
            border: `2px solid ${SAKTHI_COLORS.secondary}`,
            overflow: 'auto',
            mb: 3,
            bgcolor: '#FFFACD',
          }}
        >
          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              {/* Main Header */}
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    color: SAKTHI_COLORS.white,
                    py: 2,
                    bgcolor: SAKTHI_COLORS.secondary,
                    border: '2px solid black',
                  }}
                >
                  POURING DETAILS
                </TableCell>
              </TableRow>

              {/* Column Headers */}
              <TableRow>
                <TableCell
                  rowSpan={2}
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FFFF00',
                    border: '2px solid black',
                    width: '150px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fontSize: '0.9rem',
                  }}
                >
                  Date & Heat code
                </TableCell>
                <TableCell
                  colSpan={3}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FFFF00',
                    border: '2px solid black',
                    fontSize: '0.9rem',
                  }}
                >
                  Composition
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FFFF00',
                    border: '2px solid black',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  Pouring Temperature Deg.C
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FFFF00',
                    border: '2px solid black',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  Pouring Time (Sec.)
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FFFF00',
                    border: '2px solid black',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  Other Remarks
                </TableCell>
              </TableRow>

              {/* Composition Sub-headers */}
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FFFF00',
                    border: '2px solid black',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                  }}
                >
                  C
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FFFF00',
                    border: '2px solid black',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                  }}
                >
                  Si
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FFFF00',
                    border: '2px solid black',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                  }}
                >
                  Mn
                </TableCell>
                <TableCell sx={{ border: '2px solid black', bgcolor: '#FFFF00' }}></TableCell>
                <TableCell sx={{ border: '2px solid black', bgcolor: '#FFFF00' }}></TableCell>
                <TableCell sx={{ border: '2px solid black', bgcolor: '#FFFF00' }}></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* First Data Row - Date and C, Si, Mn */}
              <TableRow sx={{ bgcolor: '#FFFACD' }}>
                {/* Date */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={pouringDetails.date}
                    onChange={e => handleChange('date', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                {/* Composition - C, Si, Mn */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.cComposition}
                    onChange={e => handleChange('cComposition', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.siComposition}
                    onChange={e => handleChange('siComposition', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.mnComposition}
                    onChange={e => handleChange('mnComposition', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                {/* Pouring Temperature */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.pouringTempDegC}
                    onChange={e => handleChange('pouringTempDegC', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                {/* Pouring Time */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.pouringTimeSec}
                    onChange={e => handleChange('pouringTimeSec', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                {/* Other Remarks - F/C & Heat No. */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="F/C & Heat No."
                    value={pouringDetails.ficHeatNo}
                    onChange={e => handleChange('ficHeatNo', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>
              </TableRow>

              {/* Second Data Row - Heat Code and P, S, Mg */}
              <TableRow sx={{ bgcolor: '#FFFACD' }}>
                {/* Heat Code */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Heat Code"
                    value={pouringDetails.heatCode}
                    onChange={e => handleChange('heatCode', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                {/* Composition - P, S, Mg */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.pComposition}
                    onChange={e => handleChange('pComposition', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.sComposition}
                    onChange={e => handleChange('sComposition', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.mgComposition}
                    onChange={e => handleChange('mgComposition', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                {/* Empty cells for Pouring Temperature and Time */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>

                {/* Other Remarks - PP Code */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="PP Code"
                    value={pouringDetails.ppCode}
                    onChange={e => handleChange('ppCode', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>
              </TableRow>

              {/* Third Data Row - Cu, Cr */}
              <TableRow sx={{ bgcolor: '#FFFACD' }}>
                {/* Empty Date & Heat Code */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>

                {/* Composition - Cu, Cr */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.cuComposition}
                    onChange={e => handleChange('cuComposition', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={pouringDetails.crComposition}
                    onChange={e => handleChange('crComposition', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>

                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>

                {/* Other Remarks - Followed by */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Followed by"
                    value={pouringDetails.followedBy}
                    onChange={e => handleChange('followedBy', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>
              </TableRow>

              {/* Fourth Data Row - Username */}
              <TableRow sx={{ bgcolor: '#FFFACD' }}>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>

                {/* Other Remarks - Username */}
                <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Username"
                    value={pouringDetails.userName}
                    onChange={e => handleChange('userName', e.target.value)}
                    InputProps={{
                      sx: {
                        bgcolor: SAKTHI_COLORS.white,
                        borderRadius: 0,
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', mt: 2 }}>
          <Box>
            <Button
              variant="contained"
              onClick={handleSaveAndContinue}
              sx={{
                minWidth: 220,
                background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`,
                fontWeight: 700,
              }}
            >
              Save & Continue
            </Button>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PouringDetailsTable;