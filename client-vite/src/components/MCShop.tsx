import React, { useEffect, useState, useRef } from "react";
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
  Autocomplete,
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
type Row = { id: string; label: string; values: string[]; freeText?: string; total?: number | null };
type GroupMeta = { remarks: string; attachment: File | null };

const fileToMeta = (f: File | null) => (f ? { name: f.name, size: f.size, type: f.type } : null);

function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------- Component ---------- */
export default function McShopInspection({
  initialCavities = ["", "", ""],
  onSave = async (payload: any) => {
    console.log("McShopInspection default onSave", payload);
    return { ok: true };
  },
}: {
  initialCavities?: string[];
  onSave?: (payload: any) => Promise<any> | any;
}) {
  const { user } = useAuth();

  // Check if user has access to this page
  // if (user?.department_id !== 8) {
  //   return <NoAccess />;
  // }

  // header fields
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [userName, setUserName] = useState<string>("");
  const [userTime, setUserTime] = useState<string>("");
  const [userIP, setUserIP] = useState<string>("Loading...");
  const [trialId, setTrialId] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  // dynamic columns
  const [cavities, setCavities] = useState<string[]>([...initialCavities]);

  // table rows (each row has a values array matching cavities length)
  const makeInitialRows = (cavLabels: string[]): Row[] => [
    { id: `cavity-${uid()}`, label: "Cavity details", values: cavLabels.map(() => "") },
    { id: `received-${uid()}`, label: "Received Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `insp-${uid()}`, label: "Inspected Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `accp-${uid()}`, label: "Accepted Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `rej-${uid()}`, label: "Rejected Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `reason-${uid()}`, label: "Reason for rejection: cavity wise", values: cavLabels.map(() => ""), freeText: "" },
  ];

  const [rows, setRows] = useState<Row[]>(() => makeInitialRows(initialCavities));
  const [groupMeta, setGroupMeta] = useState<GroupMeta>({ remarks: "", attachment: null });
  const [dimensionalRemarks, setDimensionalRemarks] = useState<string>("");

  // Additional files & remarks (new)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [additionalRemarks, setAdditionalRemarks] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ severity: "success" | "error" | "info"; message: string } | null>(null);

  // Preview State
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  // Cavities management
  const addColumn = () => {
    setCavities((c) => [...c, ""]);
    setRows((r) => r.map((row) => ({ ...row, values: [...row.values, ""] })));
  };


  // File handlers for additional PDF/image uploads
  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeColumn = (index: number) => {
    if (cavities.length <= 1) return;
    setCavities((c) => c.filter((_, i) => i !== index));
    setRows((r) => r.map((row) => ({ ...row, values: row.values.filter((_, i) => i !== index) })));
  };

  const updateCavityLabel = (index: number, label: string) => {
    setCavities((prev) => prev.map((c, i) => (i === index ? label : c)));
  };

  // cell updates
  const updateCell = (rowId: string, colIndex: number, value: string) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;

      const newValues = r.values.map((v, i) => (i === colIndex ? value : v));

      // Compute total only for non-cavity-details and non-reason rows
      const isCavityOrReason = r.label.toLowerCase().includes("cavity details") || r.label.toLowerCase().includes("reason");

      if (isCavityOrReason) {
        return { ...r, values: newValues };
      }

      const total = newValues.reduce((sum, val) => {
        const n = parseFloat(String(val).trim());
        return sum + (isNaN(n) ? 0 : n);
      }, 0);

      return { ...r, values: newValues, total };
    }));
  };

  const updateReasonFreeText = (id: string, text: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, freeText: text } : r)));
  };

  const resetAll = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setUserName("");
    setUserTime("");
    setCavities([...initialCavities]);
    setRows(makeInitialRows(initialCavities));
    setGroupMeta({ remarks: "", attachment: null });
    setDimensionalRemarks("");
    setAttachedFiles([]);
    setAdditionalRemarks("");
    setAlert(null);
    setPreviewSubmitted(false);
  };

  const buildPayload = () => {
    return {
      inspection_type: "mc_shop",
      inspection_date: date || null,
      user_name: userName || null,
      user_time: userTime || null,
      user_ip: userIP || null,
      cavities: cavities.slice(),
      rows: rows.map((r) => ({
        label: r.label,
        values: r.values.map((v) => (v === "" ? null : v)),
        freeText: r.freeText || null,
        total: r.total ?? null,
      })),
      right_remarks: groupMeta.remarks || null,
      right_attachment: fileToMeta(groupMeta.attachment),
      dimensional_report_remarks: dimensionalRemarks || null,
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
      // build server payload according to API spec
      const payload = buildPayload();
      const rowsByLabel = (labelSnippet: string) => rows.find(r => (r.label || '').toLowerCase().includes(labelSnippet));
      const receivedRow = rowsByLabel('received');
      const inspectedRow = rowsByLabel('inspected');
      const acceptedRow = rowsByLabel('accepted');
      const rejectedRow = rowsByLabel('rejected');
      const reasonRow = rowsByLabel('reason');

      const inspections: any[] = cavities.map((cav, idx) => {
        return {
          'Cavity Details': cav || (rows[0]?.values?.[idx] ?? ''),
          'Received Quantity': receivedRow?.values?.[idx] ?? null,
          'Inspected Quantity': inspectedRow?.values?.[idx] ?? null,
          'Accepted Quantity': acceptedRow?.values?.[idx] ?? null,
          'Rejected Quantity': rejectedRow?.values?.[idx] ?? null,
          'Reason for rejection': reasonRow?.values?.[idx] ?? null,
        };
      });

      const serverPayload = {
        trial_id: trialId || null,
        inspection_date: payload.inspection_date,
        inspections,
        remarks: remarks || groupMeta.remarks || null,
      };

      await inspectionService.submitMachineShopInspection(serverPayload);
      setPreviewSubmitted(true);
      setAlert({ severity: 'success', message: 'Machine shop created successfully.' });
    } catch (err: any) {
      setAlert({ severity: 'error', message: err?.message || 'Submission failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    const fetchUserIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchUserIP();
  }, []);

  // When user enters/selects a name → capture current time
  const handleUserNameChange = async (value: string | null) => {
    const v = value ?? "";
    setUserName(v);

    if (v) {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setUserTime(formattedTime);
    } else {
      setUserTime("");
    }
  };

  /* ---------- Render ---------- */
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
          {/* HEADER */}
          <Paper sx={{
            p: 1.5, mb: 3,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderLeft: `6px solid ${COLORS.secondary}`
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FactoryIcon sx={{ fontSize: 32, color: COLORS.primary }} />
              <Typography variant="h6">M/C SHOP INSPECTION</Typography>
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
                icon={<PersonIcon style={{ color: "white" }} />}
              />
            </Box>
          </Paper>

          {/* MAIN CONTENT */}
          <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>INSPECTION DETAILS</Typography>
            </Box>
            <Divider sx={{ mb: 3, borderColor: COLORS.border }} />

            {alert && <Alert severity={alert.severity} sx={{ mb: 3 }}>{alert.message}</Alert>}

            {/* Top Inputs */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Inspection Date</Typography>
                <TextField
                  size="small"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  fullWidth
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Trial ID</Typography>
                <TextField size="small" value={trialId} onChange={(e) => setTrialId(e.target.value)} fullWidth sx={{ bgcolor: 'white' }} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Remarks</Typography>
                <TextField size="small" value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth multiline rows={2} sx={{ bgcolor: 'white' }} />
              </Grid>

            </Grid>


            {/* Table with dynamic cavities and right-hand Remarks column */}
            <Box sx={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', color: COLORS.blueHeaderText, backgroundColor: COLORS.blueHeaderBg }}>Parameter</TableCell>
                    {cavities.map((cav, i) => (
                      <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', color: COLORS.blueHeaderText, backgroundColor: COLORS.blueHeaderBg }}>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          <TextField
                            variant="standard"
                            value={cav}
                            onChange={(e) => updateCavityLabel(i, e.target.value)}
                            InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                            size="small"
                            sx={{ input: { textAlign: 'center' } }}
                          />
                          <IconButton size="small" onClick={() => removeColumn(i)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    ))}
                    <TableCell sx={{ width: 120, bgcolor: '#f1f5f9', fontWeight: 700, textAlign: 'center' }}>Total</TableCell>
                    <TableCell sx={{ width: 240, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks</TableCell>
                  </TableRow>

                </TableHead>

                <TableBody>
                  {rows.map((r, ri) => {
                    const isReasonRow = r.label.toLowerCase().includes("reason");
                    return (
                      <TableRow key={r.id}>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>{r.label}</TableCell>

                        {isReasonRow ? (
                          // For "Reason for rejection" row we render single wide cell spanning cavities
                          <TableCell colSpan={cavities.length + 1}>
                            <TextField
                              size="small"
                              fullWidth
                              multiline
                              rows={2}
                              placeholder="Cavity wise rejection reason..."
                              value={r.freeText ?? ""}
                              onChange={(e) => updateReasonFreeText(r.id, e.target.value)}
                              variant="outlined"
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: 'white' } }}
                            />
                          </TableCell>
                        ) : (
                          // Normal row: one input per cavity
                          <>
                            {r.values.map((val, ci) => (
                              <TableCell key={ci}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={val ?? ""}
                                  onChange={(e) => updateCell(r.id, ci, e.target.value)}
                                  variant="outlined"
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: 'white' } }}
                                />
                              </TableCell>
                            ))}
                            {/* Total cell */}
                            <TableCell sx={{ textAlign: 'center', fontWeight: 700, bgcolor: '#f1f5f9' }}>
                              {r.label.toLowerCase().includes("cavity details") ? "-" : (r.total !== null && r.total !== undefined ? r.total : "-")}
                            </TableCell>
                          </>
                        )}

                        {/* Right grouped cell - spans all rows */}
                        {ri === 0 && (
                          <TableCell rowSpan={rows.length} sx={{ verticalAlign: "top", bgcolor: '#fff7ed', padding: 2, minWidth: 240 }}>
                            <Box display="flex" flexDirection="column" height="100%" gap={2}>
                              <TextField
                                size="small"
                                fullWidth
                                multiline
                                rows={8}
                                placeholder="General remarks..."
                                value={groupMeta.remarks}
                                onChange={(e) => setGroupMeta((g) => ({ ...g, remarks: e.target.value }))}
                                variant="outlined"
                                sx={{ bgcolor: 'white' }}
                              />

                              <Box display="flex" alignItems="center" gap={1} mt="auto">
                                <input
                                  accept="image/*,application/pdf"
                                  id="mcshop-attach-file"
                                  style={{ display: "none" }}
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setGroupMeta((g) => ({ ...g, attachment: file }));
                                  }}
                                />
                                <label htmlFor="mcshop-attach-file">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    component="span"
                                    startIcon={<UploadFileIcon />}
                                    sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                                  >
                                    Attach
                                  </Button>
                                </label>

                                {groupMeta.attachment ? (
                                  <Chip
                                    icon={<InsertDriveFileIcon />}
                                    label={groupMeta.attachment.name}
                                    onDelete={() => setGroupMeta((g) => ({ ...g, attachment: null }))}
                                    size="small"
                                    variant="outlined"
                                    sx={{ maxWidth: 140 }}
                                  />
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    No file attached
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            <Button
              size="small"
              onClick={addColumn}
              startIcon={<AddCircleIcon />}
              sx={{ mt: 1, color: COLORS.secondary }}
            >
              Add Column
            </Button>

            {/* Attach PDF / Image Section */}


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
                  <IconButton size="small" onClick={() => setPreviewMode(false)} sx={{ color: '#ef4444' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 4, overflowY: "auto", bgcolor: COLORS.background }}>
                  <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>M/C Shop Inspection Report</Typography>
                      <Typography variant="body2" color="textSecondary">Date: {previewPayload.inspection_date}</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="textSecondary">INSPECTOR</Typography>
                        <Typography variant="body1" fontWeight="bold">{previewPayload.user_name || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="textSecondary">LOG TIME</Typography>
                        <Typography variant="body1" fontWeight="bold">{previewPayload.user_time || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" color="textSecondary">GENERAL NOTES</Typography>
                        <Typography variant="body2">{previewPayload.dimensional_report_remarks || "-"}</Typography>
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
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewPayload.rows.map((r: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{r.label}</TableCell>
                              {r.freeText !== undefined && r.freeText !== null ? (
                                <TableCell colSpan={previewPayload.cavities.length + 1} sx={{ textAlign: 'left', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                  {r.freeText}
                                </TableCell>
                              ) : (
                                <>
                                  {r.values.map((v: any, j: number) => (
                                    <TableCell key={j} sx={{ textAlign: 'center', fontSize: '0.8rem', fontFamily: 'Roboto Mono' }}>
                                      {v === null ? "-" : String(v)}
                                    </TableCell>
                                  ))}
                                  <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                                    {r.label.toLowerCase().includes("cavity details") ? "-" : (r.total !== null && r.total !== undefined ? r.total : "-")}
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>M/C SHOP INSPECTION REPORT</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">IP: {userIP}</Typography>
                {previewPayload && <Typography variant="body2">Date: {previewPayload.inspection_date}</Typography>}
              </Box>
            </Box>

            {previewPayload && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography><strong>Inspector:</strong> {previewPayload.user_name}</Typography>
                  <Typography><strong>Notes:</strong> {previewPayload.dimensional_report_remarks}</Typography>
                </Box>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Parameter</th>
                      {previewPayload.cavities.map((c: string, i: number) => (
                        <th key={i} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{c}</th>
                      ))}
                      <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPayload.rows.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{r.label}</td>
                        {r.freeText !== undefined && r.freeText !== null ? (
                          <td colSpan={previewPayload.cavities.length + 1} style={{ border: '1px solid black', padding: '8px' }}>
                            {r.freeText}
                          </td>
                        ) : (
                          <>
                            {r.values.map((v: any, j: number) => (
                              <td key={j} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                                {v === null ? "" : String(v)}
                              </td>
                            ))}
                            <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                              {r.label.toLowerCase().includes("cavity details") ? "" : (r.total !== null && r.total !== undefined ? r.total : "")}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid black' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Side Remarks</div>
                  <div>{previewPayload.right_remarks || '-'}</div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Attached Files</div>
                  {(previewPayload.attachedFiles || []).length ? (
                    <ul>
                      {previewPayload.attachedFiles.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <div>-</div>
                  )}
                </div>

                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Additional Remarks</div>
                  <div>{previewPayload.additionalRemarks || '-'}</div>
                </div>
              </>
            )}
          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}