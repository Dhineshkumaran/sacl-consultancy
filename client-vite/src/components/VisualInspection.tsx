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
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    Alert,
    ThemeProvider,
    createTheme,
    Container,
    Grid,
    Chip,
    Divider,
    GlobalStyles,
    CircularProgress
} from "@mui/material";

// Icons
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FactoryIcon from '@mui/icons-material/Factory';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ScienceIcon from '@mui/icons-material/Science';
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

/* ---------- Types & Helpers ---------- */
type Row = { id: string; label: string; values: string[] };
type GroupMeta = { ok: boolean | null; remarks: string; attachment: File | null };

const fileToMeta = (f: File | null) => {
    if (!f) return null;
    return { name: f.name, size: f.size, type: f.type };
};

function uid(prefix = "") {
    return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------- Main Component ---------- */
export default function VisualInspection({
    initialRows = ["Cavity number", "Inspected Quantity", "Accepted Quantity", "Rejected Quantity", "Rejection Percentage (%)", "Reason for rejection: cavity wise"],
    initialCols = [""],
    onSave = async (payload: any) => {
        // Mock save
        return new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000));
    },
}: {
    initialRows?: string[];
    initialCols?: string[];
    onSave?: (payload: any) => Promise<any> | any;
}) {
    const { user } = useAuth();

    // Check if user has access to this page
    // if (user?.department_id !== 5) {
    //     return <NoAccess />;
    // }

    const navigate = useNavigate();

    const makeRows = (labels: string[]): Row[] =>
        labels.map((lab, i) => ({
            id: `${lab}-${i}-${uid()}`,
            label: lab,
            values: initialCols.map(() => ""),
        }));

    const [cols, setCols] = useState<string[]>([...initialCols]);
    const [rows, setRows] = useState<Row[]>(() => makeRows(initialRows));
    const [trialId, setTrialId] = useState<string>("");

    // Calculate rejection percentage for a specific column
    const calculateRejectionPercentage = (colIndex: number): string => {
        const inspectedRow = rows.find(r => r.label === "Inspected Quantity");
        const rejectedRow = rows.find(r => r.label === "Rejected Quantity");

        if (!inspectedRow || !rejectedRow) return "";

        const inspected = parseFloat(inspectedRow.values[colIndex] || "0");
        const rejected = parseFloat(rejectedRow.values[colIndex] || "0");

        if (isNaN(inspected) || isNaN(rejected) || inspected === 0) {
            return "";
        }

        const percentage = (rejected / inspected) * 100;
        return percentage.toFixed(2);
    };

    const [groupMeta, setGroupMeta] = useState<GroupMeta>({
        ok: null,
        remarks: "",
        attachment: null,
    });

    // Status states
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [alert, setAlert] = useState<{ severity: "success" | "error" | "info"; message: string } | null>(null);

    // Additional PDF files and remarks (new)
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [additionalRemarks, setAdditionalRemarks] = useState<string>("");

    // Preview state
    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // IP state
    const [userIP, setUserIP] = useState<string>("Loading...");

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

    const addColumn = () => {
        setCols((c) => [...c, ""]);

        setRows((r) =>
            r.map((row) => ({
                ...row,
                values: [...row.values, ""],
            }))
        );
    };


    const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []) as File[];
        setAttachedFiles(prev => [...prev, ...files]);
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeColumn = (index: number) => {
        if (cols.length <= 1) return;
        setCols((c) => c.filter((_, i) => i !== index));
        setRows((r) =>
            r.map((row) => ({
                ...row,
                values: row.values.filter((_, i) => i !== index),
            }))
        );
    };

    const updateCell = (rowId: string, colIndex: number, value: string) => {
        setRows(prev =>
            prev.map(r => {
                if (r.id !== rowId) return r;

                const newValues = r.values.map((v, i) => (i === colIndex ? value : v));


                let total: number | undefined = undefined;
                if (r.label !== "Cavity number") {
                    total = newValues.reduce((sum, val) => {
                        const n = parseFloat(String(val).trim());
                        return sum + (isNaN(n) ? 0 : n);
                    }, 0);
                }

                return total !== undefined ? { ...r, values: newValues, total } : { ...r, values: newValues };
            })
        );
    };


    const updateColLabel = (index: number, label: string) => {
        setCols((prev) => prev.map((c, i) => (i === index ? label : c)));
    };

    const reset = () => {
        setCols([...initialCols]);
        setRows(makeRows(initialRows));
        setGroupMeta({ ok: null, remarks: "", attachment: null });
        setAttachedFiles([]);
        setAdditionalRemarks("");
        setMessage(null);
        setAlert(null);
        setPreviewMode(false);
        setPreviewPayload(null);
        setSubmitted(false);
    };

    const buildPayload = () => {
        return {
            created_at: new Date().toLocaleString(),
            cols: cols.slice(),
            rows: rows.map(r => ({
                label: r.label,
                values: r.values,

                total: r.label === "Cavity number" ? null : r.values.reduce((acc, v) => {
                    const n = parseFloat(String(v).trim());
                    return acc + (isNaN(n) ? 0 : n);
                }, 0)
            })),

            group: {
                ok: groupMeta.ok,
                remarks: groupMeta.remarks || null,
                attachment: fileToMeta(groupMeta.attachment),
            },
            attachedFiles: attachedFiles.map(f => f.name),
            additionalRemarks: additionalRemarks,
        };
    };

    // Save & Continue -> Open Preview
    const handleSaveAndContinue = () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = buildPayload();
            setPreviewPayload(payload);
            setPreviewMode(true);
            setSubmitted(false);
        } catch (err: any) {
            setAlert({ severity: "error", message: "Failed to prepare preview" });
        } finally {
            setSaving(false);
        }
    };

    // Final save from preview
    const handleFinalSave = async () => {
        if (!previewPayload) return;
        setSaving(true);
        setMessage(null);
        try {
            // Map rows to fields per column
            const findRow = (labelPart: string) => rows.find(r => r.label.toLowerCase().includes(labelPart));
            const cavityRow = findRow('cavity number');
            const inspectedRow = findRow('inspected quantity');
            const acceptedRow = findRow('accepted quantity');
            const rejectedRow = findRow('rejected quantity');
            const reasonRow = findRow('reason for rejection');

            const inspections = cols.map((col, idx) => {
                const inspected = inspectedRow?.values?.[idx] ?? null;
                const accepted = acceptedRow?.values?.[idx] ?? null;
                const rejected = rejectedRow?.values?.[idx] ?? null;
                const rejectionPercentage = (() => {
                    const ins = parseFloat(String(inspected ?? '0'));
                    const rej = parseFloat(String(rejected ?? '0'));
                    if (isNaN(ins) || isNaN(rej) || ins === 0) return null;
                    return ((rej / ins) * 100).toFixed(2);
                })();

                return {
                    'Cavity number': cavityRow?.values?.[idx] ?? col ?? null,
                    'Inspected Quantity': inspected ?? null,
                    'Accepted Quantity': accepted ?? null,
                    'Rejected Quantity': rejected ?? null,
                    'Rejection Percentage': rejectionPercentage ?? null,
                    'Reason for rejection': reasonRow?.values?.[idx] ?? null,
                };
            });

            const serverPayload = {
                trial_id: trialId || null,
                inspections,
                visual_ok: previewPayload.group?.ok ?? null,
                remarks: previewPayload.additionalRemarks || previewPayload.group?.remarks || null,
            };

            await inspectionService.submitVisualInspection(serverPayload);
            setSubmitted(true);
            setAlert({ severity: 'success', message: 'Visual inspection created successfully.' });
        } catch (err: any) {
            setAlert({ severity: 'error', message: err?.message || 'Submission failed' });
        } finally {
            setSaving(false);
        }
    };

    const handleExportPdf = () => {
        window.print();
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
                            <Typography variant="h6">VISUAL INSPECTION</Typography>
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
                            <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>INSPECTION DETAILS</Typography>
                        </Box>
                        <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Trial ID</Typography>
                                <TextField size="small" value={trialId} onChange={(e) => setTrialId(e.target.value)} fullWidth sx={{ bgcolor: 'white' }} />
                            </Grid>
                        </Grid>

                        {alert && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.message}</Alert>}

                        <Box sx={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: 200 }}>Parameter</TableCell>
                                        {cols.map((col, ci) => (
                                            <TableCell key={ci} sx={{ minWidth: 140 }}>
                                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                    <TextField
                                                        variant="standard"
                                                        value={col}
                                                        onChange={(e) => updateColLabel(ci, e.target.value)}
                                                        InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                                                        size="small"
                                                        sx={{ input: { textAlign: 'center' } }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeColumn(ci)}
                                                        sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        ))}
                                        <TableCell
                                            sx={{ width: 120, bgcolor: '#f1f5f9', fontWeight: 700, textAlign: 'center' }}
                                        >
                                            Total
                                        </TableCell>
                                        <TableCell sx={{ width: 140, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>OK / NOT OK</TableCell>
                                        <TableCell sx={{ width: 280, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {rows.map((r, ri) => (
                                        <TableRow key={r.id}>
                                            <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>
                                                {r.label}
                                            </TableCell>

                                            {cols.map((_, ci) => {
                                                const isRejectionPercentage = r.label === "Rejection Percentage (%)";
                                                const displayValue = isRejectionPercentage ? calculateRejectionPercentage(ci) : (r.values[ci] ?? "");

                                                return (
                                                    <TableCell key={ci}>
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            value={displayValue}
                                                            onChange={(e) => updateCell(r.id, ci, e.target.value)}
                                                            variant="outlined"
                                                            InputProps={{
                                                                readOnly: isRejectionPercentage,
                                                            }}
                                                            sx={{
                                                                "& .MuiInputBase-input": {
                                                                    textAlign: 'center',
                                                                    fontFamily: 'Roboto Mono',
                                                                    fontSize: '0.85rem',
                                                                    bgcolor: isRejectionPercentage ? '#fffbeb' : 'transparent',
                                                                    fontWeight: isRejectionPercentage ? 700 : 400,
                                                                },
                                                                "& .MuiInputBase-root": {
                                                                    bgcolor: isRejectionPercentage ? '#fffbeb' : 'white'
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                );
                                            })}
                                            {/* ⭐ NEW TOTAL CELL */}
                                            <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                                                {(() => {
                                                    if (r.label === "Cavity number") return "-";
                                                    const sum = r.values.reduce((acc, v) => {
                                                        const n = parseFloat(String(v).trim());
                                                        return acc + (isNaN(n) ? 0 : n);
                                                    }, 0);
                                                    return sum || "-";
                                                })()}
                                            </TableCell>


                                            {ri === 0 ? (
                                                <>
                                                    <TableCell
                                                        rowSpan={rows.length}
                                                        sx={{
                                                            bgcolor: COLORS.successBg,
                                                            verticalAlign: "middle",
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        <RadioGroup
                                                            row
                                                            sx={{ justifyContent: 'center' }}
                                                            value={groupMeta.ok === null ? "" : String(groupMeta.ok)}
                                                            onChange={(e) => setGroupMeta((g) => ({ ...g, ok: e.target.value === "true" }))}
                                                        >
                                                            <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} />
                                                            <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} />
                                                        </RadioGroup>
                                                    </TableCell>

                                                    <TableCell
                                                        rowSpan={rows.length}
                                                        colSpan={2}
                                                        sx={{ bgcolor: '#fff7ed', verticalAlign: "top" }}
                                                    >
                                                        <Box display="flex" flexDirection="column" height="100%" gap={1}>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                multiline
                                                                rows={5}
                                                                placeholder="Remarks (optional)"
                                                                value={groupMeta.remarks}
                                                                onChange={(e) => setGroupMeta((g) => ({ ...g, remarks: e.target.value }))}
                                                                variant="outlined"
                                                                sx={{ bgcolor: 'white' }}
                                                            />

                                                            <Box display="flex" alignItems="center" gap={1} mt="auto">
                                                                <input
                                                                    accept="image/*,application/pdf"
                                                                    id="visual-group-file"
                                                                    style={{ display: "none" }}
                                                                    type="file"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0] ?? null;
                                                                        setGroupMeta((g) => ({ ...g, attachment: file }));
                                                                    }}
                                                                />
                                                                <label htmlFor="visual-group-file">
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        component="span"
                                                                        startIcon={<UploadFileIcon />}
                                                                        sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                                                                    >
                                                                        Attach PDF
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

                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                </>
                                            ) : null}
                                        </TableRow>
                                    ))}
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


                        {/* Additional Remarks Section */}


                        {/* ACTIONS */}
                        <Box display="flex" justifyContent="flex-end" gap={2} mt={4} pt={2} borderTop={`1px solid ${COLORS.border}`}>
                            <Button
                                variant="outlined"
                                onClick={reset}
                                disabled={saving}
                                sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                            >
                                Reset Form
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSaveAndContinue}
                                disabled={saving}
                                startIcon={<SaveIcon />}
                                sx={{ bgcolor: COLORS.secondary, '&:hover': { bgcolor: COLORS.orangeHeaderText } }}
                            >
                                {saving ? "Processing..." : "Save and Continue"}
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
                                    <IconButton size="small" onClick={() => navigate("/dimensional-inspection")} sx={{ color: '#ef4444' }}>
                                        <CloseIcon />
                                    </IconButton>
                                </Box>

                                <Box sx={{ p: 4, overflowY: "auto", bgcolor: COLORS.background }}>
                                    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Visual Inspection Report</Typography>
                                            <Typography variant="body2" color="textSecondary">Created: {previewPayload.created_at}</Typography>
                                        </Box>
                                        <Divider sx={{ mb: 3 }} />

                                        {/* Preview Table */}
                                        <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                                                        {previewPayload.cols.map((c: string, i: number) => (
                                                            <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>{c}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {previewPayload.rows.map((r: any, idx: number) => (
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

                                        {/* Group Result Preview */}
                                        <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                                            <Typography variant="subtitle2" mb={1} color="textSecondary">FINAL STATUS & REMARKS</Typography>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="body2">Status:</Typography>
                                                        {previewPayload.group.ok === true ?
                                                            <Chip label="OK" color="success" size="small" /> :
                                                            previewPayload.group.ok === false ?
                                                                <Chip label="NOT OK" color="error" size="small" /> :
                                                                <Chip label="-" size="small" />
                                                        }
                                                    </Box>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 8 }}>
                                                    <Typography variant="body2">
                                                        <strong>Remarks:</strong> {previewPayload.group.remarks || "No remarks"}
                                                    </Typography>
                                                    {previewPayload.group.attachment && (
                                                        <Typography variant="caption" display="block" mt={0.5} color="primary">
                                                            Attachment: {previewPayload.group.attachment.name}
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            </Grid>
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

                                    {alert && (
                                        <Alert severity={alert.severity} sx={{ mt: 2 }}>{alert.message}</Alert>
                                    )}
                                </Box>

                                <Box sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end", gap: 2, bgcolor: 'white' }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setPreviewMode(false)}
                                        disabled={saving || submitted}
                                        sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                                    >
                                        Back to Edit
                                    </Button>

                                    {submitted ? (
                                        <Button
                                            variant="contained"
                                            onClick={handleExportPdf}
                                            startIcon={<PrintIcon />}
                                            sx={{ bgcolor: COLORS.primary }}
                                        >
                                            Download PDF
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
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>VISUAL INSPECTION REPORT</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2">IP: {userIP}</Typography>
                                {previewPayload && <Typography variant="body2">Date: {previewPayload.created_at}</Typography>}
                            </Box>
                        </Box>

                        {previewPayload && (
                            <>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                                            <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Parameter</th>
                                            {previewPayload.cols.map((c: string, i: number) => (
                                                <th key={i} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{c}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewPayload.rows.map((r: any, idx: number) => (
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

                                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid black' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Final Result</div>
                                    <div>Status: {previewPayload.group.ok === true ? 'OK' : previewPayload.group.ok === false ? 'NOT OK' : '-'}</div>
                                    <div>Remarks: {previewPayload.group.remarks || '-'}</div>
                                </div>
                            </>
                        )}
                    </Box>

                </Container>
            </Box>
        </ThemeProvider>
    );
}