import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  ThemeProvider,
  createTheme,
  Button,
  Grid,
  Container,
  IconButton,
  useMediaQuery,
  GlobalStyles,
  Divider
} from "@mui/material";

// Icons
import FactoryIcon from '@mui/icons-material/Factory';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from "@mui/icons-material/Close";
import ScienceIcon from '@mui/icons-material/Science'; // Kept as generic icon or swap to Engineering
import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";
/* ---------------- 1. Theme Configuration ---------------- */

const COLORS = {
  primary: "#1e293b",    // Slate 800
  secondary: "#ea580c",  // Orange 600 (Buttons)
  background: "#f1f5f9", // Light Slate Background
  surface: "#ffffff",
  border: "#e2e8f0",     // Slate 200
  textPrimary: "#0f172a",
  textSecondary: "#64748b",

  // Header Colors (Material Correction Style)
  blueHeaderBg: "#eff6ff", // Light Blue
  blueHeaderText: "#3b82f6", // Blue
  orangeHeaderBg: "#fff7ed", // Light Orange
  orangeHeaderText: "#c2410c", // Dark Orange
};

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  palette: {
    primary: { main: COLORS.primary },
    secondary: { main: COLORS.secondary },
    background: { default: COLORS.background, paper: COLORS.surface },
    text: { primary: COLORS.textPrimary, secondary: COLORS.textSecondary },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700, color: COLORS.primary },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: "0.75rem", letterSpacing: 0.5, textTransform: 'uppercase' },
    body2: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.875rem' },
    caption: { fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
          border: `1px solid ${COLORS.border}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLORS.border}`,
          borderRight: `1px solid ${COLORS.border}`,
          padding: "12px 8px",
        },
        head: {
          fontWeight: 700,
          fontSize: "0.8rem",
          textAlign: "center",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            backgroundColor: "#fff",
            "& fieldset": { borderColor: "#cbd5e1" },
            "&:hover fieldset": { borderColor: COLORS.primary },
            "&.Mui-focused fieldset": { borderColor: COLORS.secondary, borderWidth: 1 },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: "none",
          padding: "10px 24px",
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }
        },
      },
    },
  },
});

/* ---------------- UI Sub-components ---------------- */

const SpecInput = ({ inputStyle, ...props }: any) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    fullWidth
    inputProps={{
      ...props.inputProps,
      style: { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.9rem', ...inputStyle }
    }}
    sx={{
      "& .MuiOutlinedInput-root": { backgroundColor: props.readOnly ? "#f8fafc" : "#fff" },
      ...props.sx
    }}
  />
);

/* ---------------- Main Component ---------------- */

function FoundrySampleCard() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State - Swapped to Moulding Fields
  const [mouldState, setMouldState] = useState({
    thickness: "",
    compressability: "",
    pressure: "",
    hardness: "",
    remarks: ""
  });
  // Attach PDF / Images
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Add these states near other useState declarations
  const [mouldCorrectionLoading, setMouldCorrectionLoading] = useState(false);
  const [mouldCorrectionSubmitted, setMouldCorrectionSubmitted] = useState(false);
  const [mouldDate, setMouldDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [previewMode, setPreviewMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userIP, setUserIP] = useState<string>("");
  useEffect(() => {
    const fetchIP = async () => { try { const r = await fetch("https://api.ipify.org?format=json"); const d = await r.json(); setUserIP(d.ip); } catch { setUserIP("Offline"); } };
    fetchIP();
  }, []);

  const handleChange = (field: string, value: string) => {
    setMouldState(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setMouldState({
      thickness: "", compressability: "", pressure: "", hardness: "",
      remarks: ""
    });
    setSubmitted(false);
  };
  // Handle file uploads
  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const files = Array.from(fileList) as File[];
    setAttachedFiles(prev => [...prev, ...files]);
  };

  // Remove uploaded file chip
  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleSaveAndContinue = () => {
    setPreviewMode(true);
  };

  const handleExportPDF = () => { window.print(); };

  // Helper grid box for preview
  const GridValueBox = ({ label, value }: { label: string, value: string }) => (
    <Box sx={{
      p: 2,
      borderRadius: 2,
      border: `1px solid ${COLORS.border}`,
      textAlign: 'center',
      bgcolor: 'white',
      flex: 1
    }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
      <Typography variant="h6" sx={{ fontSize: '1rem' }}>{value || "-"}</Typography>
    </Box>
  );

  /**
   * Post mould correction to server
   * payload must include: mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks
   * trial_id will be taken from URL query or localStorage fallback.
   */
  const postMouldCorrection = async (payload: {
    mould_thickness: string;
    compressability: string;
    squeeze_pressure: string;
    mould_hardness: string;
    remarks: string;
    trial_id?: string;
  }) => {
    setMouldCorrectionLoading(true);
    try {
      const trialId = new URLSearchParams(window.location.search).get('trial_id') || (localStorage.getItem('trial_id') ?? 'trial_id');
      const body = { ...payload, trial_id: 'Sample1', date: mouldDate };

      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:3000/api/moulding-correction', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setMouldCorrectionSubmitted(true);
        return { ok: true, data };
      } else {
        return { ok: false, message: data?.message || 'Failed to save mould correction', data };
      }
    } catch (err) {
      return { ok: false, message: 'Network error' };
    } finally {
      setMouldCorrectionLoading(false);
    }
  };

  // Example: call postMouldCorrection when user clicks Confirm (adjust to your component fields)
  const handleFinalSubmit = async () => {
    // replace these with your component state variables
    const payload = {
      mould_thickness: mouldState.thickness,        // string state in your component
      compressability: mouldState.compressability, // string state in your component
      squeeze_pressure: mouldState.pressure,
      mould_hardness: mouldState.hardness,
      remarks: mouldState.remarks
    };

    const result = await postMouldCorrection(payload);
    if (!result.ok) {
      // minimal feedback - replace with your toast/snackbar
      alert(result.message || 'Failed to submit mould correction');
    } else {
      // success handling
      alert('Mould correction created successfully.');
      setSubmitted(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={{
        "@media print": {
          "html, body": { height: "initial !important", overflow: "initial !important", backgroundColor: "white !important" },
          "body *": { visibility: "hidden" },
          ".print-section, .print-section *": { visibility: "visible" },
          ".print-section": { display: "block !important", position: "absolute", left: 0, top: 0, width: "100%", color: "black", backgroundColor: "white", padding: "20px" },
          ".MuiModal-root": { display: "none !important" }
        }
      }} />

      <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
        <Container maxWidth="xl" disableGutters>

          <SaclHeader />
          {/* Header Bar */}
          <Paper sx={{
            p: 1.5, mb: 3,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderLeft: `6px solid ${COLORS.secondary}`
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FactoryIcon sx={{ fontSize: 32, color: COLORS.primary }} />
              <Typography variant="h6">MOULDING DETAILS</Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                type="date"
                size="small"
                value={mouldDate}
                onChange={(e) => setMouldDate(e.target.value)}
                sx={{ bgcolor: 'white', borderRadius: 1, width: 150 }}
              />
              <Chip label={userIP} size="small" variant="outlined" sx={{ bgcolor: 'white' }} />
              <Chip
                label="USER NAME"
                sx={{
                  bgcolor: COLORS.secondary,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
                size="small"
                icon={<PersonIcon style={{ color: 'white' }} />}
              />
            </Box>
          </Paper>

          {/* Main Content Card */}
          <Paper sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }}>

            {/* Inner Header */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <EngineeringIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>MOULD CORRECTION DETAILS</Typography>
            </Box>
            <Divider sx={{ mb: 2, borderColor: COLORS.blueHeaderText, opacity: 0.3 }} />

            {/* <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Chip label="Input Required" size="small" variant="outlined" sx={{ color: COLORS.textSecondary }} />
            </Box> */}

            <Box sx={{ overflowX: "auto", mb: 4 }}>
              <Table size="small" sx={{ minWidth: 1000 }}>
                <TableHead>
                  {/* Split Group Headers (Material UI Style) */}
                  <TableRow>
                    <TableCell colSpan={4} sx={{ bgcolor: COLORS.blueHeaderBg, color: COLORS.blueHeaderText, borderBottom: 'none' }}>
                      <Typography variant="subtitle2" sx={{ color: 'inherit', letterSpacing: 1 }}>Moulding Parameters</Typography>
                    </TableCell>
                    <TableCell colSpan={1} sx={{ bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText, borderBottom: 'none' }}>
                    </TableCell>
                  </TableRow>

                  {/* Column Headers */}
                  <TableRow>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Mould Thickness</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Compressability</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Squeeze Pressure</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary, borderRight: `2px solid ${COLORS.border}` }}>Mould Hardness</TableCell>

                    <TableCell width="40%" sx={{ bgcolor: '#fff7ed', color: COLORS.textSecondary }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {/* Blue Section Inputs */}
                    <TableCell><SpecInput value={mouldState.thickness} onChange={(e: any) => handleChange('thickness', e.target.value)} /></TableCell>
                    <TableCell><SpecInput value={mouldState.compressability} onChange={(e: any) => handleChange('compressability', e.target.value)} /></TableCell>
                    <TableCell><SpecInput value={mouldState.pressure} onChange={(e: any) => handleChange('pressure', e.target.value)} /></TableCell>
                    <TableCell sx={{ borderRight: `2px solid ${COLORS.border}` }}>
                      <SpecInput value={mouldState.hardness} onChange={(e: any) => handleChange('hardness', e.target.value)} />
                    </TableCell>

                    {/* Orange Section Inputs */}
                    <TableCell>
                      <SpecInput
                        value={mouldState.remarks}
                        onChange={(e: any) => handleChange('remarks', e.target.value)}
                        placeholder="--"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            {/* Attach PDF / Image Section */}
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", color: COLORS.primary }}
              >
                Attach PDF / Image Files
              </Typography>

              <Button
                variant="outlined"
                component="label"
                sx={{
                  bgcolor: "white",
                  borderStyle: "dashed",
                  py: 1.5,
                  px: 3,
                  fontWeight: 600,
                }}
              >
                Attach PDF
                <input
                  type="file"
                  hidden
                  multiple
                  accept="application/pdf,image/*"
                  onChange={handleAttachFiles}
                />
              </Button>

              {/* Show file chips */}
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {attachedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => removeAttachedFile(index)}
                    sx={{
                      bgcolor: "white",
                      border: `1px solid ${COLORS.border}`,
                      fontSize: "0.8rem"
                    }}
                  />
                ))}
              </Box>
            </Box>




            {/* Actions */}
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{
                  color: 'black',
                  borderColor: 'black',
                  borderWidth: '1.5px',
                  '&:hover': { borderColor: 'black', borderWidth: '1.5px', bgcolor: '#f3f4f6' }
                }}
              >
                Reset Form
              </Button>
              <Button
                variant="contained"
                sx={{ bgcolor: COLORS.secondary, '&:hover': { bgcolor: '#c2410c' } }}
                startIcon={<SaveIcon />}
                onClick={handleSaveAndContinue}
              >
                Save & Continue
              </Button>
            </Box>

          </Paper>

          {/* ---------------- MODAL / PREVIEW ---------------- */}
          {previewMode && (
            <Box sx={{
              position: "fixed", inset: 0, zIndex: 1300,
              bgcolor: "rgba(15, 23, 42, 0.8)",
              display: "flex", alignItems: "center", justifyContent: "center", p: 2
            }}>
              <Paper sx={{ width: "100%", maxWidth: 850, borderRadius: 3, overflow: "hidden" }}>

                {/* Modal Header */}
                <Box sx={{ p: 2, px: 3, borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>Verify Moulding Details</Typography>
                  <IconButton size="small" onClick={() => navigate('/metallurgical-inspection')} sx={{ color: '#ef4444' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                {/* Modal Content */}
                <Box sx={{ p: 4 }}>

                  {/* Section 1: Parameters */}
                  <Typography variant="caption" sx={{ color: COLORS.blueHeaderText, mb: 2, display: 'block' }}>MOULDING PARAMETERS</Typography>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 6, sm: 3 }}><GridValueBox label="Thickness" value={mouldState.thickness} /></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><GridValueBox label="Compressability" value={mouldState.compressability} /></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><GridValueBox label="Pressure" value={mouldState.pressure} /></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><GridValueBox label="Hardness" value={mouldState.hardness} /></Grid>
                  </Grid>

                  {/* Section 2: Remarks/Type */}
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>REMARKS & LOG</Typography>
                  <Box sx={{
                    p: 3,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    border: `1px solid ${COLORS.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 3
                  }}>
                    <Box flex={2}>
                      <Typography variant="caption" color="textSecondary" display="block">REMARKS</Typography>
                      <Typography variant="body2">{mouldState.remarks || "No remarks entered."}</Typography>
                    </Box>
                  </Box>
                  {/* Attached Files in Preview */}
                  {attachedFiles.length > 0 && (
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: "white",
                        borderRadius: 2,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                        ATTACHED FILES
                      </Typography>

                      {attachedFiles.map((file, i) => (
                        <Typography key={i} variant="body2">• {file.name}</Typography>
                      ))}
                    </Box>
                  )}


                  {/* Success Message */}
                  {submitted && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#ecfdf5', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: '#059669' }}>
                      <CheckCircleIcon fontSize="small" />
                      <Typography variant="body2" sx={{ fontFamily: 'Inter', fontWeight: 500 }}>Moulding Specification Registered Successfully</Typography>
                    </Box>
                  )}

                </Box>

                {/* Modal Footer */}
                <Box sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setPreviewMode(false)}
                    sx={{
                      borderColor: "#e2e8f0",
                      color: COLORS.textSecondary,
                      '&:hover': { borderColor: COLORS.textSecondary }
                    }}
                  >
                    Back to Edit
                  </Button>
                  {submitted ? (
                    <Button
                      variant="contained"
                      sx={{ bgcolor: COLORS.primary, color: 'white' }}
                      startIcon={<PrintIcon />}
                      onClick={handleExportPDF}
                    >
                      Download PDF
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      sx={{ bgcolor: COLORS.secondary }}
                      onClick={handleFinalSubmit}
                    >
                      Confirm & Submit
                    </Button>
                  )}
                </Box>

              </Paper>
            </Box>
          )}

          {/* PRINT LAYOUT */}
          <Box className="print-section" sx={{ display: 'none', fontFamily: theme.typography.fontFamily }}>
            <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>FOUNDRY SAMPLE CARD</Typography>
                <Typography variant="body1">Moulding Correction Report</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">Date: {new Date().toLocaleDateString()}</Typography>
                <Typography variant="body2">IP: {userIP}</Typography>
              </Box>
            </Box>

            <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Moulding Details</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th colSpan={4} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Moulding Parameters</th>
                  <th colSpan={1} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Log Data</th>
                </tr>
                <tr style={{ backgroundColor: '#f9f9f9' }}>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Thickness</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Compressability</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Pressure</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Hardness</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.thickness}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.compressability}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.pressure}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.hardness}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.remarks || "-"}</td>
                </tr>
              </tbody>
            </table>
            {/* Attached Files - Print Version */}
            {attachedFiles.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{
                  margin: 0,
                  paddingBottom: "5px",
                  borderBottom: "1px solid #999"
                }}>
                  Attached Files
                </h3>

                <ul style={{ marginTop: "5px" }}>
                  {attachedFiles.map((file, index) => (
                    <li key={index} style={{ fontSize: "14px" }}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default FoundrySampleCard;