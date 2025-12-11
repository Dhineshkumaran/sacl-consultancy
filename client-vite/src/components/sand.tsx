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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";
import NoAccess from "./common/NoAccess";
import { useAuth } from '../context/AuthContext';
import { ipService } from '../services/ipService';
import { inspectionService } from '../services/inspectionService';

/* ---------------- 1. Theme Configuration ---------------- */

const COLORS = {
  primary: "#1e293b",
  secondary: "#ea580c",
  background: "#f1f5f9",
  surface: "#ffffff",
  border: "#e2e8f0",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",

  // Sand Properties Colors (Grey Theme)
  headerBg: "#d1d5db",
  headerText: "#000000",
};

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 1100, lg: 1280, xl: 1920 },
  },
  palette: {
    primary: { main: COLORS.primary },
    secondary: { main: COLORS.secondary },
    background: { default: COLORS.background, paper: COLORS.surface },
    text: { primary: COLORS.textPrimary, secondary: COLORS.textSecondary },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
          borderRadius: 8,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          border: `1px solid ${COLORS.border}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          border: `1px solid ${COLORS.border}`,
          padding: "8px",
        },
        head: {
          fontWeight: 800,
          backgroundColor: COLORS.headerBg,
          color: COLORS.headerText,
          textAlign: "center",
          fontSize: "0.85rem",
          verticalAlign: "middle",
        },
        body: {
          backgroundColor: "#ffffff",
          verticalAlign: "top",
        }
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8, // More rounded inputs
            backgroundColor: "#fff",
            fontSize: "0.9rem",
            "& fieldset": { borderColor: "#9ca3af" },
            "&:hover fieldset": { borderColor: COLORS.primary },
            "&.Mui-focused fieldset": { borderColor: COLORS.secondary, borderWidth: 1 },
          },
          "& .MuiInputBase-input": {
            padding: "8px",
          }
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
          textTransform: "none", // Capitalize like in image
          fontSize: "1rem",
          padding: "10px 32px",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
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

interface FoundrySampleCardProps {
  submittedData?: {
    selectedPart?: any;
    selectedPattern?: any;
    machine?: string;
    reason?: string;
    trialNo?: string;
    samplingDate?: string;
    mouldCount?: string;
    sampleTraceability?: string;
  };
  onSave?: (data: any) => void;
  onComplete?: () => void;
  fromPendingCards?: boolean;
}

function FoundrySampleCard({ submittedData, onSave, onComplete, fromPendingCards }: FoundrySampleCardProps = {}) {
  const { user } = useAuth();

  // Check if user has access to this page
  // if (user?.department_id !== 4) {
  //   return <NoAccess />;
  // }

  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [sandDate, setSandDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sandProps, setSandProps] = useState({
    tClay: "",
    aClay: "",
    vcm: "",
    loi: "",
    afs: "",
    gcs: "",
    moi: "",
    compactability: "",
    perm: "",
    remarks: ""
  });
  const [additionalRemarks, setAdditionalRemarks] = useState<string>("");
  // File Upload (PDF / Images)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userIP, setUserIP] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchIP();
  }, []);

  const handleChange = (field: string, value: string) => {
    setSandProps(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setSandProps({
      tClay: "", aClay: "", vcm: "", loi: "", afs: "",
      gcs: "", moi: "", compactability: "", perm: "", remarks: ""
    });
    setSandDate(new Date().toISOString().split('T')[0]);
    setAdditionalRemarks("");
    setSubmitted(false);
  };
  // Handle file uploads
  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    setAttachedFiles(prev => [...prev, ...files]);
  };

  // Remove a selected file
  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = () => {
    setPreviewMode(true);
  };

  const handleConfirm = async () => {
    console.log(localStorage.getItem("authToken"));
    setLoading(true);
    try {
      const trialId = new URLSearchParams(window.location.search).get('trial_id') || (localStorage.getItem('trial_id') ?? 'trial_id');

      const payload = {
        trial_id: trialId,
        date: sandDate,
        t_clay: Number((sandProps as any).tClay) || 0,
        a_clay: Number((sandProps as any).aClay) || 0,
        vcm: Number((sandProps as any).vcm) || 0,
        loi: Number((sandProps as any).loi) || 0,
        afs: Number((sandProps as any).afs) || 0,
        gcs: Number((sandProps as any).gcs) || 0,
        moi: Number((sandProps as any).moi) || 0,
        compactability: Number((sandProps as any).compactability) || 0,
        permeability: Number((sandProps as any).perm) || 0,
        remarks: (sandProps as any).remarks || ""
      };

      await inspectionService.submitSandProperties(payload);
      setSubmitted(true);
    } catch (err) {
      alert("Failed to submit sand properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => { window.print(); };

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
            borderLeft: `6px solid ${COLORS.secondary}`,
            border: `1px solid #e2e8f0`
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FactoryIcon sx={{ fontSize: 32, color: COLORS.primary }} />
              <Typography variant="h6">SAND PROPERTIES</Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <Chip label={userIP} size="small" variant="outlined" sx={{ bgcolor: 'white' }} />
              {/* Updated Chip Style */}
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
          <Paper sx={{ overflow: 'hidden', border: `2px solid ${COLORS.border}` }}>

            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 1000, borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={10} sx={{ backgroundColor: COLORS.headerBg, textAlign: 'left', py: 1.5, borderBottom: `1px solid ${COLORS.border}` }}>
                      <Typography variant="h6" sx={{ color: 'black', textTransform: 'uppercase', fontSize: '1rem' }}>SAND PROPERTIES</Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={9} sx={{ borderRight: 'none', backgroundColor: '#fff' }}></TableCell>
                    <TableCell colSpan={1} sx={{ backgroundColor: COLORS.headerBg, borderLeft: `1px solid ${COLORS.border}`, minWidth: 250, p: 1 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">Date </Typography>
                        <TextField
                          type="date"
                          size="small"
                          fullWidth
                          value={sandDate}
                          onChange={(e) => setSandDate(e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    {["T.Clay", "A.Clay", "VCM", "LOI", "AFS", "G.C.S", "MOI", "Compactability", "Perm"].map((header) => (
                      <TableCell key={header} width="9%">{header}</TableCell>
                    ))}
                    <TableCell width="19%">Remarks</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow>
                    {["tClay", "aClay", "vcm", "loi", "afs", "gcs", "moi", "compactability", "perm"].map((key) => (
                      <TableCell key={key} sx={{ p: 2, verticalAlign: 'middle' }}>
                        <SpecInput
                          value={(sandProps as any)[key]}
                          onChange={(e: any) => handleChange(key, e.target.value)}
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={{ p: 1 }}>
                      <TextField
                        multiline
                        rows={3}
                        fullWidth
                        variant="outlined"
                        placeholder="Enter remarks..."
                        value={sandProps.remarks}
                        onChange={(e) => handleChange("remarks", e.target.value)}
                        sx={{ bgcolor: '#fff' }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>



            {/* Attach PDF / Image Section */}
            <Box sx={{ p: 3, bgColor: "#fff", borderTop: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: "uppercase" }}>
                Attach PDF / Image Files
              </Typography>

              <Button
                variant="outlined"
                component="label"
                sx={{
                  bgcolor: "white",
                  border: `2px dashed ${COLORS.border}`,
                  py: 1.5,
                  px: 3,
                  fontWeight: 600,
                  color: COLORS.primary,
                  '&:hover': {
                    bgcolor: '#f3f4f6',
                    borderColor: COLORS.primary
                  }
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

              {/* Attached file chips */}
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {attachedFiles.map((file, i) => (
                  <Chip
                    key={i}
                    label={file.name}
                    onDelete={() => removeAttachedFile(i)}
                    sx={{
                      bgcolor: "white",
                      border: `1px solid ${COLORS.border}`,
                      fontSize: "0.8rem"
                    }}
                  />
                ))}
              </Box>
            </Box>




            {/* Form Actions - Updated Styles */}
            <Box sx={{ p: 3, display: "flex", justifyContent: "flex-end", gap: 2, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}`, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                fullWidth={isMobile}
                sx={{
                  color: COLORS.primary,
                  borderColor: COLORS.primary,
                  borderWidth: '1.5px',
                  '&:hover': {
                    borderColor: COLORS.primary,
                    borderWidth: '1.5px',
                    bgcolor: '#f3f4f6'
                  }
                }}
              >
                Reset Form
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                fullWidth={isMobile}
                startIcon={<SaveIcon />}
                sx={{
                  bgcolor: COLORS.secondary,
                  color: 'white',
                  '&:hover': { bgcolor: '#c2410c' }
                }}
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
              <Paper sx={{ width: "100%", maxWidth: 1000, borderRadius: 3, overflow: "hidden" }}>

                <Box sx={{ p: 2, px: 3, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>Verify Sand Properties</Typography>
                  <IconButton size="small" onClick={() => navigate('/moulding')} sx={{ color: '#ef4444' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 4, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', fontFamily: theme.typography.fontFamily, fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: COLORS.headerBg }}>
                        <th colSpan={10} style={{ textAlign: 'left', padding: '10px', border: '1px solid black' }}>SAND PROPERTIES:</th>
                      </tr>
                      <tr>
                        <td colSpan={9} style={{ border: '1px solid black', borderRight: 'none', backgroundColor: '#fff' }}></td>
                        <td style={{ border: '1px solid black', padding: '10px', backgroundColor: COLORS.headerBg }}>
                          <strong>Date:</strong> {sandDate}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: COLORS.headerBg, textAlign: 'center' }}>
                        {["T.Clay", "A.Clay", "VCM", "LOI", "AFS", "G.C.S", "MOI", "Comp.", "Perm", "Remarks"].map((h, i) => (
                          <th key={i} style={{ border: '1px solid black', padding: '8px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ textAlign: 'center' }}>
                        {["tClay", "aClay", "vcm", "loi", "afs", "gcs", "moi", "compactability", "perm"].map((k) => (
                          <td key={k} style={{ border: '1px solid black', padding: '12px' }}>
                            {(sandProps as any)[k] || "-"}
                          </td>
                        ))}
                        <td style={{ border: '1px solid black', padding: '12px', textAlign: 'left' }}>
                          {sandProps.remarks || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Attached Files in Preview */}
                  {attachedFiles.length > 0 && (
                    <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1, bgcolor: "white" }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                        ATTACHED FILES
                      </Typography>

                      {attachedFiles.map((file, i) => (
                        <Typography key={i} variant="body2">• {file.name}</Typography>
                      ))}
                    </Box>
                  )}


                  {submitted && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#ecfdf5', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: '#059669' }}>
                      <CheckCircleIcon fontSize="small" />
                      <Typography variant="body2" sx={{ fontFamily: 'Inter', fontWeight: 500 }}>Sand Properties Registered Successfully</Typography>
                    </Box>
                  )}

                </Box>

                {/* Modal Footer - Updated Styles */}
                <Box sx={{ p: 2, px: 3, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setPreviewMode(false)}
                    sx={{
                      color: 'black',
                      borderColor: 'black',
                      borderWidth: '1.5px',
                      '&:hover': { borderColor: 'black', borderWidth: '1.5px', bgcolor: '#f3f4f6' }
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
                      onClick={handleConfirm}
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Confirm & Submit"}
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
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>FOUNDRY LAB REPORT</Typography>
                <Typography variant="body1">Sand Properties Specification Sheet</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">Report Date: {new Date().toLocaleDateString()}</Typography>
                <Typography variant="body2">IP: {userIP}</Typography>
              </Box>
            </Box>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: COLORS.headerBg }}>
                  <th colSpan={10} style={{ textAlign: 'left', padding: '10px', border: '1px solid black', fontWeight: 'bold' }}>SAND PROPERTIES:</th>
                </tr>
                <tr>
                  <td colSpan={9} style={{ border: '1px solid black', borderRight: 'none', backgroundColor: '#fff' }}></td>
                  <td style={{ border: '1px solid black', padding: '10px', backgroundColor: COLORS.headerBg }}>
                    <strong>Date:</strong> {sandDate}
                  </td>
                </tr>
                <tr style={{ backgroundColor: COLORS.headerBg, textAlign: 'center' }}>
                  {["T.Clay", "A.Clay", "VCM", "LOI", "AFS", "G.C.S", "MOI", "Compactability", "Perm", "Other Remarks"].map((h, i) => (
                    <th key={i} style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ textAlign: 'center', height: '60px', verticalAlign: 'middle' }}>
                  {["tClay", "aClay", "vcm", "loi", "afs", "gcs", "moi", "compactability", "perm"].map((k) => (
                    <td key={k} style={{ border: '1px solid black', padding: '8px' }}>
                      {(sandProps as any)[k]}
                    </td>
                  ))}
                  <td style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>
                    {sandProps.remarks}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* Attached Files in Print */}
            {attachedFiles.length > 0 && (
              <div style={{ marginTop: "25px" }}>
                <h3 style={{ margin: 0, paddingBottom: "5px", borderBottom: "1px solid #ccc" }}>
                  Attached Files
                </h3>
                <ul style={{ marginTop: "5px" }}>
                  {attachedFiles.map((file, i) => (
                    <li key={i} style={{ fontSize: "14px" }}>{file.name}</li>
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