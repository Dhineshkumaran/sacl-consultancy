import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  IconButton,
  Button,
  Alert,
  ThemeProvider,
  createTheme,
  Container,
  Grid,
  Chip,
  Divider,
  GlobalStyles,
} from "@mui/material";

// Icons
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import FactoryIcon from '@mui/icons-material/Factory';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ScienceIcon from '@mui/icons-material/Science';
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from '@mui/icons-material/Print';
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
  blueHeaderBg: "#eff6ff",
  blueHeaderText: "#3b82f6",
  orangeHeaderBg: "#fff7ed",
  orangeHeaderText: "#c2410c",
  successBg: "#ecfdf5",
  successText: "#059669",
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
    subtitle1: { fontWeight: 600, color: COLORS.primary },
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
          padding: "8px 12px",
        },
        head: {
          fontWeight: 700,
          fontSize: "0.8rem",
          textAlign: "center",
          color: COLORS.blueHeaderText,
          backgroundColor: COLORS.blueHeaderBg,
        },
        body: {
          color: COLORS.textPrimary,
        }
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
          padding: "8px 24px",
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }
        },
      },
    },
  },
});

/* ---------- Types ---------- */
type CavRow = { id: string; label: string; values: string[] };
type GroupMeta = { remarks: string; attachment: File | null };

const fileToMeta = (f: File | null) => (f ? { name: f.name, size: f.size, type: f.type } : null);

function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------- Component ---------- */
export default function DimensionalInspection({
  initialCavities = ["Value 1"],
  onSave = async (payload: any) => {
    console.log("DimensionalInspection default onSave", payload);
    return { ok: true };
  },
}: {
  initialCavities?: string[];
  onSave?: (payload: any) => Promise<any> | any;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  // top-level fields
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [weightTarget, setWeightTarget] = useState<string>("");
  const makeCavRows = (cavLabels: string[]) => [
    { id: `cavity-${uid()}`, label: "Cavity number", values: cavLabels.map(() => "") } as CavRow,
    { id: `avg-${uid()}`, label: "Casting weight", values: cavLabels.map(() => "") } as CavRow,
  ];

  const [cavities, setCavities] = useState<string[]>([...initialCavities]);
  const [cavRows, setCavRows] = useState<CavRow[]>(() => makeCavRows(initialCavities));
  const [bunchWeight, setBunchWeight] = useState<string>("");
  const [numberOfCavity, setNumberOfCavity] = useState<string>("");
  const [groupMeta, setGroupMeta] = useState<GroupMeta>({ remarks: "", attachment: null });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ severity: "success" | "error" | "info"; message: string } | null>(null);
  const [userIP, setUserIP] = useState<string>("Loading...");

  // Additional PDF files and remarks (new)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [additionalRemarks, setAdditionalRemarks] = useState<string>("");

  // Preview State
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  // Calculate Yield automatically
  const calculateYield = () => {
    const castingWeight = parseFloat(weightTarget);
    const numCavity = parseFloat(numberOfCavity);
    const bunch = parseFloat(bunchWeight);

    if (isNaN(castingWeight) || isNaN(numCavity) || isNaN(bunch) || bunch === 0) {
      return "";
    }

    const yieldValue = ((castingWeight * numCavity) / bunch) * 100;
    return yieldValue.toFixed(2);
  };

  // Auto-hide messages
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  useEffect(() => {
    const fetchUserIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchUserIP();
  }, []);

  // Cavities management (dynamic columns)
  const addCavity = () => {
    const next = `Value ${cavities.length + 1}`;
    setCavities((c) => [...c, next]);
    setCavRows((rows) => rows.map((r) => ({ ...r, values: [...r.values, ""] })));
  };

  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeCavity = (index: number) => {
    if (cavities.length <= 1) return;
    setCavities((c) => c.filter((_, i) => i !== index));
    setCavRows((rows) => rows.map((r) => ({ ...r, values: r.values.filter((_, i) => i !== index) })));
  };

  const updateCavityLabel = (index: number, label: string) => {
    setCavities((prev) => prev.map((c, i) => (i === index ? label : c)));
  };

  const updateCavCell = (rowId: string, colIndex: number, value: string) => {
    setCavRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, values: r.values.map((v, i) => (i === colIndex ? value : v)) } : r)));
  };

  // reset
  const resetAll = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setWeightTarget("");
    setCavities([...initialCavities]);
    setCavRows(makeCavRows(initialCavities));
    setBunchWeight("");
    setNumberOfCavity("");
    setGroupMeta({ remarks: "", attachment: null });
    setAttachedFiles([]);
    setAdditionalRemarks("");
    setAlert(null);
    setPreviewSubmitted(false);
  };

  // payload builder
  const buildPayload = () => {
    return {
      inspection_date: date || null,
      weight_target: weightTarget || null,
      cavities: cavities.slice(),
      cavity_rows: cavRows.map((r) => ({ label: r.label, values: r.values.map((v) => (v === "" ? null : v)) })),
      bunch_weight: bunchWeight || null,
      number_of_cavity: numberOfCavity || null,
      yield: calculateYield() || null,
      dimensional_remarks: groupMeta.remarks || null,
      attachment: fileToMeta(groupMeta.attachment),
      attachedFiles: attachedFiles.map(f => f.name),
      additionalRemarks: additionalRemarks,
      created_at: new Date().toISOString(),
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    setPreviewPayload(payload);
    setPreviewMode(true);
    setPreviewSubmitted(false);
    setMessage(null);
  };

  const handleFinalSave = async () => {
    if (!previewPayload) return;
    setSaving(true);
    try {
      // Build API payload according to provided spec
      const trialId = new URLSearchParams(window.location.search).get('trial_id') || (localStorage.getItem('trial_id') ?? 'trial_id');

      // find rows
      const cavityRow = previewPayload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('cavity'));
      const castingRow = previewPayload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('casting'));

      const inspections = (previewPayload.cavities || []).map((_: any, i: number) => ({
        "Cavity Number": (cavityRow?.values?.[i] ?? previewPayload.cavities[i] ?? null),
        "Casting Weight": (castingRow?.values?.[i] ?? null)
      }));

      const apiPayload = {
        trial_id: trialId,
        inspection_date: previewPayload.inspection_date || previewPayload.created_at || null,
        casting_weight: parseFloat(previewPayload.weight_target) || 0,
        bunch_weight: parseFloat(previewPayload.bunch_weight) || 0,
        no_of_cavities: parseInt(previewPayload.number_of_cavity) || (previewPayload.cavities ? previewPayload.cavities.length : 0),
        yields: previewPayload.yield ? parseFloat(previewPayload.yield) : null,
        inspections: JSON.stringify(inspections),
        remarks: previewPayload.dimensional_remarks || previewPayload.additionalRemarks || null
      };

      await inspectionService.submitDimensionalInspection(apiPayload);
      setPreviewSubmitted(true);
      setAlert({ severity: "success", message: "Dimensional inspection created successfully." });
    } catch (err: any) {
      console.error("Error saving dimensional inspection:", err);
      setAlert({ severity: "error", message: "Failed to save dimensional inspection. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Font style for data values to match inputs
  const dataFontStyle = { fontFamily: '"Roboto Mono", monospace', fontWeight: 500 };

  // Check if user has access to this page
  // if (user?.department_id !== 10) {
  //   return <NoAccess />;
  // }

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

          {/* SACL HEADER */}
          <SaclHeader />

          {/* HEADER */}
          <Paper sx={{
            p: 1.5, mb: 3,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderLeft: `6px solid ${COLORS.secondary}`
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FactoryIcon sx={{ fontSize: 32, color: COLORS.primary }} />
              <Typography variant="h6">DIMENSIONAL INSPECTION</Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
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

          {/* MAIN CONTENT */}
          <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>DIMENSIONAL DETAILS</Typography>
            </Box>
            <Divider sx={{ mb: 3, borderColor: COLORS.border }} />

            {alert && <Alert severity={alert.severity} sx={{ mb: 3 }}>{alert.message}</Alert>}

            {/* Top Inputs */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Inspection Date</Typography>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Casting Weight (Kg)</Typography>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="e.g. 12.5"
                  value={weightTarget}
                  onChange={(e) => setWeightTarget(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Bunch Weight (Kg)</Typography>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Total Bunch Wt"
                  value={bunchWeight}
                  onChange={(e) => setBunchWeight(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Number of Cavity</Typography>
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  placeholder="e.g. 4"
                  value={numberOfCavity}
                  onChange={(e) => setNumberOfCavity(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Yield (%)</Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={calculateYield()}
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: 'white', '& .MuiInputBase-input': { fontWeight: 700 } }}
                />
              </Grid>
            </Grid>

            {/* Cavity Table */}
            <Box sx={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: COLORS.blueHeaderBg }}>
                    <TableCell sx={{ minWidth: 200, color: COLORS.blueHeaderText }}>Parameter</TableCell>
                    {cavities.map((c, ci) => (
                      <TableCell key={ci} sx={{ minWidth: 140 }}>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          <TextField
                            size="small"
                            variant="standard"
                            value={c}
                            onChange={(e) => updateCavityLabel(ci, e.target.value)}
                            InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                            sx={{ input: { textAlign: 'center' } }}
                          />
                          <IconButton size="small" onClick={() => removeCavity(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {cavRows.map((r, ri) => (
                    <TableRow key={r.id}>
                      <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>
                        {r.label}
                      </TableCell>
                      {r.values.map((val, ci) => (
                        <TableCell key={ci}>
                          <TextField
                            size="small"
                            fullWidth
                            value={val}
                            onChange={(e) => updateCavCell(r.id, ci, e.target.value)}
                            variant="outlined"
                            sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Button
              size="small"
              onClick={addCavity}
              startIcon={<AddCircleIcon />}
              sx={{ mt: 1, color: COLORS.secondary }}
            >
              Add Column
            </Button>

            {/* Attach PDF / Image Section */}
            <Paper sx={{ p: 3, my: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${COLORS.primary}`, width: '100%' }}>
                <UploadFileIcon sx={{ color: COLORS.primary }} />
                <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
                  Attach PDF / Image Files
                </Typography>
              </Box>

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
                Upload Files
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
            </Paper>

            {/* Additional Remarks Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${COLORS.primary}`, width: '100%' }}>
                <EditIcon sx={{ color: COLORS.primary }} />
                <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
                  Additional Remarks
                </Typography>
              </Box>
              <TextField
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                placeholder="Enter additional remarks..."
                value={additionalRemarks}
                onChange={(e) => setAdditionalRemarks(e.target.value)}
                sx={{ bgcolor: '#fff' }}
              />
            </Paper>

            {/* Actions */}
            <Box display="flex" justifyContent="flex-end" gap={2} mt={4} pt={2} borderTop={`1px solid ${COLORS.border}`}>
              <Button
                variant="outlined"
                onClick={resetAll}
                disabled={saving}
                sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
              >
                Reset Form
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={<SaveIcon />}
                sx={{ bgcolor: COLORS.secondary, '&:hover': { bgcolor: COLORS.orangeHeaderText } }}
              >
                {saving ? "Processing..." : "Save Details"}
              </Button>
            </Box>

          </Paper>

          {/* PREVIEW MODAL */}
          {previewMode && previewPayload && (
            <Box
              sx={{
                position: "fixed", inset: 0, zIndex: 1300,
                display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: "rgba(15,23,42,0.85)", backdropFilter: "blur(4px)",
                p: 2
              }}
            >
              <Paper
                sx={{
                  width: "100%", maxWidth: 1000, maxHeight: "90vh", overflow: "hidden",
                  display: "flex", flexDirection: "column", borderRadius: 3
                }}
              >
                <Box sx={{ p: 2, px: 3, borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: 'white' }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>Verify Inspection Data</Typography>
                  <IconButton size="small" onClick={() => navigate('/mc-shop')} sx={{ color: '#ef4444' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 4, overflowY: "auto", bgcolor: COLORS.background }}>
                  <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Dimensional Inspection Report</Typography>
                      <Typography variant="body2" color="textSecondary">Date: {previewPayload.inspection_date}</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="textSecondary">TARGET WEIGHT</Typography>
                        <Typography variant="body1" fontWeight="bold">{previewPayload.weight_target || "-"} Kg</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" color="textSecondary">BUNCH WEIGHT</Typography>
                        <Typography variant="body1" fontWeight="bold">{previewPayload.bunch_weight || "-"} Kg</Typography>
                      </Grid>
                    </Grid>

                    {/* Preview Table */}
                    <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                            {previewPayload.cavities.map((c: string, i: number) => (
                              <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>{c}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewPayload.cavity_rows.map((r: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{r.label}</TableCell>
                              {r.values.map((v: any, j: number) => (
                                <TableCell key={j} sx={{ textAlign: 'center', fontSize: '0.8rem', fontFamily: 'Roboto Mono' }}>
                                  {v === null ? "-" : String(v)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>

                    <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>

                      {previewPayload.attachment && (
                        <Typography variant="caption" display="block" mt={1} color="primary">
                          Attachment: {previewPayload.attachment.name}
                        </Typography>
                      )}
                    </Box>

                    {/* Attached PDF Files Preview */}
                    {previewPayload.attachedFiles && previewPayload.attachedFiles.length > 0 && (
                      <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="subtitle2" mb={1} color="textSecondary">ATTACHED FILES</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {previewPayload.attachedFiles.map((fileName: string, idx: number) => (
                            <Chip
                              key={idx}
                              icon={<InsertDriveFileIcon />}
                              label={fileName}
                              variant="outlined"
                              sx={{ bgcolor: 'white' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Additional Remarks Preview */}
                    {previewPayload.additionalRemarks && (
                      <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="subtitle2" mb={1} color="textSecondary">ADDITIONAL REMARKS</Typography>
                        <Typography variant="body2">{previewPayload.additionalRemarks}</Typography>
                      </Box>
                    )}
                  </Box>

                  {previewSubmitted && (
                    <Alert severity="success" sx={{ mt: 2 }}>Inspection data submitted successfully.</Alert>
                  )}
                </Box>

                <Box sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end", gap: 2, bgcolor: 'white' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setPreviewMode(false)}
                    disabled={saving || previewSubmitted}
                    sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                  >
                    Back to Edit
                  </Button>

                  {previewSubmitted ? (
                    <Button
                      variant="contained"
                      onClick={handleExportPDF}
                      startIcon={<PrintIcon />}
                      sx={{ bgcolor: COLORS.primary }}
                    >
                      Print / Save as PDF
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleFinalSave}
                      disabled={saving}
                      sx={{ bgcolor: COLORS.secondary }}
                    >
                      {saving ? "Saving..." : "Confirm & Submit"}
                    </Button>
                  )}
                </Box>
              </Paper>
            </Box>
          )}

          {/* PRINT SECTION */}
          <Box className="print-section" sx={{ display: 'none' }}>
            <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>DIMENSIONAL INSPECTION REPORT</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">IP: {userIP}</Typography>
                {previewPayload && <Typography variant="body2">Date: {previewPayload.inspection_date}</Typography>}
              </Box>
            </Box>

            {previewPayload && (
              <>
                <Box sx={{ mb: 3, display: 'flex', gap: 4 }}>
                  <Typography><strong>Target Weight:</strong> {previewPayload.weight_target} Kg</Typography>
                  <Typography><strong>Bunch Weight:</strong> {previewPayload.bunch_weight} Kg</Typography>
                </Box>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Parameter</th>
                      {previewPayload.cavities.map((c: string, i: number) => (
                        <th key={i} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewPayload.cavity_rows.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{r.label}</td>
                        {r.values.map((v: any, j: number) => (
                          <td key={j} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                            {v === null ? "" : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: "20px", padding: "10px", border: "1px solid black" }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>General Remarks</div>
                  <div>{previewPayload.dimensional_remarks || '-'}</div>
                </div>
              </>
            )}
          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}