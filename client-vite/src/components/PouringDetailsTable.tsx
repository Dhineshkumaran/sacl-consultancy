import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
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
    CircularProgress,
    Grid,
    Container,
    InputAdornment,
    useMediaQuery,
    GlobalStyles,
    Divider,
    IconButton
} from "@mui/material";

// Icons
import FactoryIcon from '@mui/icons-material/Factory';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download'; // Added Download Icon
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";
import NoAccess from "./common/NoAccess";
import { useAuth } from '../context/AuthContext';
import { ipService } from '../services/ipService';
import { inspectionService } from '../services/inspectionService';

/* ---------------- 1. Theme Configuration ---------------- */

const COLORS = {
    primary: "#1e293b", // Slate 800
    secondary: "#ea580c", // Orange 600
    background: "#f8fafc", // Slate 50
    surface: "#ffffff",
    border: "#cbd5e1", // Slate 300 - darkened for table visibility
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    accentBlue: "#0ea5e9",
    accentGreen: "#10b981",
    headerBg: "#FDE68A", // Darker Yellow for Table Header
    bodyBg: "#ffffff", // White for Table Body
    headerText: "#854d0e"
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
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h5: { fontWeight: 800, letterSpacing: -0.5 },
        h6: { fontWeight: 700 },
        subtitle2: { fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.5 },
        body2: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.875rem' },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
                    border: `1px solid ${COLORS.border}`,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: `1px solid ${COLORS.border}`,
                    borderRight: `1px solid ${COLORS.border}`,
                    padding: "8px",
                },
                head: {
                    fontWeight: 800,
                    backgroundColor: COLORS.headerBg,
                    color: COLORS.headerText,
                    whiteSpace: "normal",
                    textAlign: "center",
                    fontSize: "0.85rem",
                    verticalAlign: "middle",
                    lineHeight: 1.2
                },
                body: {
                    backgroundColor: COLORS.bodyBg,
                    verticalAlign: "top",
                }
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 4,
                        backgroundColor: "#fff",
                        fontSize: "0.85rem",
                        "& fieldset": { borderColor: "#cbd5e1" },
                        "&:hover fieldset": { borderColor: COLORS.primary },
                        "&.Mui-focused fieldset": { borderColor: COLORS.secondary, borderWidth: 1 },
                    },
                    "& .MuiInputBase-input": {
                        padding: "6px 8px",
                    }
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
            style: { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem', ...inputStyle }
        }}
        sx={{
            "& .MuiOutlinedInput-root": { backgroundColor: props.readOnly ? "rgba(0,0,0,0.04)" : "#fff" },
            ...props.sx
        }}
    />
);

const LabelText = ({ children }: { children: React.ReactNode }) => (
    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 0.5, display: 'block' }}>
        {children}
    </Typography>
);

/* ---------------- Types ---------------- */

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

interface PouringDetailsTableProps {
    pouringDetails?: PouringDetails;
    onPouringDetailsChange?: (details: PouringDetails) => void;
    submittedData?: SubmittedData;
}

/* ---------------- Main Component ---------------- */

function PouringDetailsTable({ pouringDetails, onPouringDetailsChange, submittedData }: PouringDetailsTableProps) {
    const { user } = useAuth();

    // Check if user has access to this page
    // if (user?.department_id !== 9) {
    //     return <NoAccess />;
    // }

    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State
    const [loading, setLoading] = useState(false);
    const [trialId, setTrialId] = useState<string>("");

    // Pouring Details State
    // Pouring Details State
    const [pouringDate, setPouringDate] = useState<string>(pouringDetails?.date || new Date().toISOString().split('T')[0]);
    const [heatCode, setHeatCode] = useState<string>(pouringDetails?.heatCode || "");
    const [chemState, setChemState] = useState({
        c: pouringDetails?.cComposition || "",
        si: pouringDetails?.siComposition || "",
        mn: pouringDetails?.mnComposition || "",
        p: pouringDetails?.pComposition || "",
        s: pouringDetails?.sComposition || "",
        mg: pouringDetails?.mgComposition || "",
        cr: pouringDetails?.crComposition || "",
        cu: pouringDetails?.cuComposition || ""
    });
    const [pouringTemp, setPouringTemp] = useState<string>(pouringDetails?.pouringTempDegC || "");
    const [pouringTime, setPouringTime] = useState<string>(pouringDetails?.pouringTimeSec || "");
    const [inoculationStream, setInoculationStream] = useState<string>("");
    const [inoculationInmould, setInoculationInmould] = useState<string>("");

    // Remarks State
    const [ficHeatNo, setFicHeatNo] = useState<string>(pouringDetails?.ficHeatNo || "");
    const [ppCode, setPpCode] = useState<string>(pouringDetails?.ppCode || "");
    const [followedBy, setFollowedBy] = useState<string>(pouringDetails?.followedBy || "");
    const [userName] = useState<string>(pouringDetails?.userName || "Admin_User");
    const [remarksText, setRemarksText] = useState<string>("");
    // Attach PDF / Images
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);




    useEffect(() => {
        if (onPouringDetailsChange) {
            onPouringDetailsChange({
                date: pouringDate,
                heatCode,
                cComposition: chemState.c,
                siComposition: chemState.si,
                mnComposition: chemState.mn,
                pComposition: chemState.p,
                sComposition: chemState.s,
                mgComposition: chemState.mg,
                crComposition: chemState.cr,
                cuComposition: chemState.cu,
                pouringTempDegC: pouringTemp,
                pouringTimeSec: pouringTime,
                ficHeatNo,
                ppCode,
                followedBy,
                userName
            });
        }
    }, [pouringDate, heatCode, chemState, pouringTemp, pouringTime, ficHeatNo, ppCode, followedBy, userName, onPouringDetailsChange]);

    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [previewMessage, setPreviewMessage] = useState<string | null>(null);
    const [userIP, setUserIP] = useState<string>("");

    useEffect(() => {
        if (previewMessage) { const t = setTimeout(() => setPreviewMessage(null), 4000); return () => clearTimeout(t); }
    }, [previewMessage]);

    useEffect(() => {
        const fetchIP = async () => {
            const ip = await ipService.getUserIP();
            setUserIP(ip);
        };
        fetchIP();
    }, []);
    // Handle PDF/Image Upload
    const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList) return;
        const files = Array.from(fileList) as File[];
        setAttachedFiles((prev: File[]) => [...prev, ...files]);
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };


    const handleSaveAndContinue = () => {
        const payload = {
            pouringDate,
            heatCode,
            chemical_composition: chemState,
            pouringTemp,
            pouringTime,
            inoculation: { stream: inoculationStream, inmould: inoculationInmould },
            remarks: { ficHeatNo, ppCode, followedBy, userName }
        };
        setPreviewPayload(payload);
        setPreviewMode(true);
    };

    const handleFinalSave = async () => {
        try {
            setLoading(true);

            // Construct the API payload according to backend schema
            const apiPayload = {
                trial_id: 'sample',
                pour_date: pouringDate,
                heat_code: heatCode,
                composition: {
                    C: chemState.c,
                    Si: chemState.si,
                    Mn: chemState.mn,
                    P: chemState.p,
                    S: chemState.s,
                    Mg: chemState.mg,
                    Cu: chemState.cu,
                    Cr: chemState.cr
                },
                pouring_temp_c: parseFloat(pouringTemp) || 0,
                pouring_time_sec: parseInt(pouringTime) || 0,
                inoculation: {
                    Stream: inoculationStream,
                    Inmould: inoculationInmould
                },
                other_remarks: {
                    "F/C & Heat No.": ficHeatNo,
                    "PP Code": ppCode,
                    "Followed by": followedBy,
                    "Username": userName
                },
                remarks: remarksText
            };

            console.log("Submitting pouring details:", apiPayload);

            const data = await inspectionService.submitPouringDetails(apiPayload);
            setSubmitted(true);
            setPreviewMessage("Pouring Details Registered Successfully");
        } catch (error) {
            console.error("Error saving pouring details:", error);
            setPreviewMessage("Failed to save pouring details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => { window.print(); };

    // Font style for data values to match inputs
    const dataFontStyle = { fontFamily: '"Roboto Mono", monospace', fontWeight: 500 };

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
                    <Paper sx={{ p: 1.5, mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `6px solid ${COLORS.secondary}` }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <FactoryIcon sx={{ fontSize: 32, color: COLORS.primary }} />
                            <Typography variant="h6" sx={{ color: COLORS.primary, textTransform: 'uppercase' }}>POURING DETAILS</Typography>
                            {submittedData?.trialNo && (
                                <Chip
                                    label={`Trial: ${submittedData.trialNo}`}
                                    color="secondary"
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                />
                            )}
                        </Box>
                        <Box display="flex" gap={1}>
                            <Chip label={userIP} size="small" variant="outlined" />
                            <Chip label="USER NAME" color="warning" size="small" icon={<PersonIcon />} />
                        </Box>
                    </Paper>

                    {/* Success/Error Message */}
                    {previewMessage && (
                        <Paper sx={{ p: 2, mb: 3, bgcolor: submitted ? COLORS.accentGreen : '#fee2e2', borderLeft: `6px solid ${submitted ? COLORS.accentGreen : '#dc2626'}` }}>
                            <Typography variant="body1" sx={{ color: submitted ? 'white' : '#991b1b', fontWeight: 600 }}>
                                {previewMessage}
                            </Typography>
                        </Paper>
                    )}

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}><CircularProgress /></Box>
                    ) : (
                        <Grid container spacing={3}>

                            {/* ---------------- POURING DETAILS TABLE ---------------- */}
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: { xs: 1, md: 2 }, overflow: "hidden" }}>
                                    {/* Updated Heading Color (No longer Red) */}


                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small" sx={{ minWidth: 1000, border: `2px solid ${COLORS.primary}` }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell width="12%">Date &<br />Heat code</TableCell>
                                                    <TableCell width="35%">Composition</TableCell>
                                                    <TableCell width="18%">
                                                        Pouring<br />Temperature<br />Deg.C
                                                    </TableCell>
                                                    <TableCell width="10%">
                                                        Pouring<br />Time<br />(Sec.)
                                                    </TableCell>
                                                    <TableCell width="25%"><br /></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow>
                                                    {/* COL 1: Date & Heat Code */}
                                                    <TableCell>
                                                        <Box display="flex" flexDirection="column" gap={2}>
                                                            <Box>
                                                                <LabelText>Date</LabelText>
                                                                <SpecInput
                                                                    type="date"
                                                                    value={pouringDate}
                                                                    onChange={(e: any) => setPouringDate(e.target.value)}
                                                                    inputStyle={{ textAlign: 'left' }}
                                                                />
                                                            </Box>
                                                            <Box>
                                                                <LabelText>Heat Code</LabelText>
                                                                <SpecInput
                                                                    placeholder="Code"
                                                                    value={heatCode}
                                                                    onChange={(e: any) => setHeatCode(e.target.value)}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* COL 2: Composition Grid */}
                                                    <TableCell>
                                                        <Grid container spacing={1}>
                                                            {["C", "Si", "Mn", "P"].map((el) => (
                                                                <Grid size={{ xs: 6, sm: 3 }} key={el}>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Typography variant="body2" fontWeight="bold">{el}-</Typography>
                                                                        <SpecInput
                                                                            value={(chemState as any)[el.toLowerCase()]}
                                                                            onChange={(e: any) => setChemState({ ...chemState, [el.toLowerCase()]: e.target.value })}
                                                                        />
                                                                    </Box>
                                                                </Grid>
                                                            ))}
                                                            {/* Spacer Row */}
                                                            <Grid size={{ xs: 12 }} sx={{ my: 0.5 }}><Divider /></Grid>

                                                            {["S", "Mg", "Cu", "Cr"].map((el) => (
                                                                <Grid size={{ xs: 6, sm: 3 }} key={el}>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Typography variant="body2" fontWeight="bold">{el}-</Typography>
                                                                        <SpecInput
                                                                            value={(chemState as any)[el.toLowerCase()]}
                                                                            onChange={(e: any) => setChemState({ ...chemState, [el.toLowerCase()]: e.target.value })}
                                                                        />
                                                                    </Box>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </TableCell>

                                                    {/* COL 3: Temp & Inoculation */}
                                                    <TableCell>
                                                        <Box display="flex" flexDirection="column" height="100%" justifyContent="space-between" gap={2}>
                                                            <Box>
                                                                <SpecInput
                                                                    placeholder="Deg C"
                                                                    value={pouringTemp}
                                                                    onChange={(e: any) => setPouringTemp(e.target.value)}
                                                                    InputProps={{
                                                                        endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Divider sx={{ borderStyle: 'dashed' }} />
                                                            <Box>
                                                                <Typography variant="caption" fontWeight="bold" sx={{ textDecoration: "underline" }}>Inoculation :</Typography>
                                                                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                                    <Grid size={{ xs: 12 }}>
                                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                            <Typography variant="caption">Stream</Typography>
                                                                            <SpecInput
                                                                                sx={{ width: 60 }}
                                                                                placeholder="gms"
                                                                                value={inoculationStream}
                                                                                onChange={(e: any) => setInoculationStream(e.target.value)}
                                                                            />
                                                                        </Box>
                                                                    </Grid>
                                                                    <Grid size={{ xs: 12 }}>
                                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                            <Typography variant="caption">Inmould</Typography>
                                                                            <SpecInput
                                                                                sx={{ width: 60 }}
                                                                                placeholder="gms"
                                                                                value={inoculationInmould}
                                                                                onChange={(e: any) => setInoculationInmould(e.target.value)}
                                                                            />
                                                                        </Box>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* COL 4: Time */}
                                                    <TableCell sx={{ verticalAlign: 'middle' }}>
                                                        <SpecInput
                                                            placeholder="Sec"
                                                            value={pouringTime}
                                                            onChange={(e: any) => setPouringTime(e.target.value)}
                                                        />
                                                    </TableCell>

                                                    {/* COL 5: Remarks */}
                                                    <TableCell>
                                                        <Grid container spacing={2}>
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" noWrap minWidth={90}>F/C & Heat No:</Typography>
                                                                    <SpecInput value={ficHeatNo} onChange={(e: any) => setFicHeatNo(e.target.value)} />
                                                                </Box>
                                                            </Grid>
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" noWrap minWidth={90}>PP Code :</Typography>
                                                                    <SpecInput value={ppCode} onChange={(e: any) => setPpCode(e.target.value)} />
                                                                </Box>
                                                            </Grid>
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" noWrap minWidth={90}>Followed by :</Typography>
                                                                    <SpecInput value={followedBy} onChange={(e: any) => setFollowedBy(e.target.value)} />
                                                                </Box>
                                                            </Grid>
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" noWrap minWidth={90}>Username :</Typography>
                                                                    <Typography variant="body2" fontWeight="bold" color="primary">{userName}</Typography>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Paper>
                            </Grid>
                            {/* Attach PDF / Image Section */}
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 3, mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase" }}>
                                        Attach PDF / Image Files
                                    </Typography>

                                    <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                        sx={{
                                            bgcolor: "white",
                                            borderStyle: "dashed",
                                            py: 1.5,
                                            fontWeight: 600
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

                                    {/* Show uploaded file names */}
                                    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {attachedFiles.map((file, i) => (
                                            <Chip
                                                key={i}
                                                label={file.name}
                                                onDelete={() => removeAttachedFile(i)}
                                                sx={{
                                                    bgcolor: "white",
                                                    border: `1px solid ${COLORS.border}`
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Free Remarks Section */}
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 3, mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, textTransform: "uppercase" }}>
                                        Remarks
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="Enter additional remarks..."
                                        value={remarksText}
                                        onChange={(e) => setRemarksText(e.target.value)}
                                        sx={{ bgcolor: "white" }}
                                    />
                                </Paper>
                            </Grid>


                            {/* Action Buttons */}
                            <Grid size={{ xs: 12 }} sx={{ mt: 2, mb: 4 }}>
                                <Box display="flex" justifyContent="flex-end" gap={2}>
                                    <Button variant="outlined" color="inherit" onClick={() => window.location.reload()}>Reset Form</Button>
                                    <Button variant="contained" color="secondary" onClick={handleSaveAndContinue} startIcon={<SaveIcon />}>Save & Continue</Button>
                                </Box>
                            </Grid>
                        </Grid>
                    )}

                    {/* ---------------- PREVIEW MODAL & PRINT LAYOUT ---------------- */}
                    {previewPayload && (
                        <>
                            {/* PREVIEW OVERLAY */}
                            {previewMode && (
                                <Box sx={{ position: "fixed", inset: 0, zIndex: 1300, bgcolor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
                                    <Paper sx={{ width: "100%", maxWidth: 1000, maxHeight: "95vh", overflowY: "auto", p: 4, bgcolor: "white", position: 'relative' }}>

                                        <IconButton
                                            onClick={() => navigate('/sand')}
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                color: 'grey.500'
                                            }}
                                        >
                                            <CloseIcon />
                                        </IconButton>

                                        {/* Updated Header Color (No longer Red) */}
                                        <Typography variant="h6" sx={{ textDecoration: 'underline', color: 'black', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>POURING DETAILS:</Typography>

                                        {/* Table with Main Font for Headers, Mono for Data */}
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '2px solid black', fontFamily: theme.typography.fontFamily }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#FDE68A', color: '#854d0e' }}>
                                                    <th style={{ border: '1px solid black', padding: '10px' }}>Date & Heat code</th>
                                                    <th style={{ border: '1px solid black', padding: '10px' }}>Composition</th>
                                                    <th style={{ border: '1px solid black', padding: '10px' }}>Pouring<br />Temperature<br />Deg.C</th>
                                                    <th style={{ border: '1px solid black', padding: '10px' }}>Pouring<br />Time<br />(Sec.)</th>
                                                    <th style={{ border: '1px solid black', padding: '10px' }}>Other<br />Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr style={{ verticalAlign: 'top' }}>
                                                    <td style={{ border: '1px solid black', padding: '12px' }}>
                                                        <div><strong>Date:</strong> <span style={dataFontStyle}>{previewPayload.pouringDate}</span></div>
                                                        <div style={{ marginTop: '15px' }}><strong>Heat Code:</strong><br /><span style={dataFontStyle}>{previewPayload.heatCode}</span></div>
                                                    </td>
                                                    <td style={{ border: '1px solid black', padding: '12px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                                                            {Object.entries(previewPayload.chemical_composition).map(([k, v]) => (
                                                                <div key={k}><strong>{k.toUpperCase()}-</strong> <span style={dataFontStyle}>{v as string}</span></div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td style={{ border: '1px solid black', padding: '12px' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
                                                            <span style={dataFontStyle}>{previewPayload.pouringTemp}°C</span>
                                                        </div>
                                                        <div style={{ borderTop: '1px dashed black', paddingTop: '10px' }}>
                                                            <u style={{ fontWeight: 'bold' }}>Inoculation:</u><br />
                                                            Stream: <span style={dataFontStyle}>{previewPayload.inoculation.stream}</span> gms<br />
                                                            Inmould: <span style={dataFontStyle}>{previewPayload.inoculation.inmould}</span> gms
                                                        </div>
                                                    </td>
                                                    <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', verticalAlign: 'middle', fontSize: '18px' }}>
                                                        <span style={dataFontStyle}>{previewPayload.pouringTime}</span>
                                                    </td>
                                                    <td style={{ border: '1px solid black', padding: '12px' }}>
                                                        <div>F/C & Heat No: <span style={dataFontStyle}>{previewPayload.remarks.ficHeatNo}</span></div>
                                                        <div style={{ marginTop: '8px' }}>PP Code: <span style={dataFontStyle}>{previewPayload.remarks.ppCode}</span></div>
                                                        <div style={{ marginTop: '8px' }}>Followed by: <span style={dataFontStyle}>{previewPayload.remarks.followedBy}</span></div>
                                                        <div style={{ marginTop: '15px' }}><strong>Username:</strong> <span style={{ ...dataFontStyle, color: COLORS.primary }}>{previewPayload.remarks.userName}</span></div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        {/* Attached Files in Preview */}
                                        {attachedFiles.length > 0 && (
                                            <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1, bgcolor: "white" }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                                    ATTACHED FILES:
                                                </Typography>
                                                {attachedFiles.map((file, i) => (
                                                    <Typography key={i} variant="body2">• {file.name}</Typography>
                                                ))}
                                            </Box>
                                        )}

                                        {/* Remarks in Preview */}
                                        {remarksText && (
                                            <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1, bgcolor: "white" }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>REMARKS:</Typography>
                                                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                                                    {remarksText}
                                                </Typography>
                                            </Box>
                                        )}


                                        <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2 }}>
                                            <Button variant="outlined" onClick={() => setPreviewMode(false)} sx={{ borderColor: 'black', color: 'black' }}>Back to Edit</Button>
                                            {submitted ?
                                                /* Updated Button Text to be clearer about functionality */
                                                <Button variant="contained" onClick={handleExportPDF} startIcon={<PrintIcon />} sx={{ bgcolor: COLORS.primary }}>Print / Save as PDF</Button> :
                                                <Button variant="contained" color="secondary" onClick={handleFinalSave}>Confirm & Submit</Button>
                                            }
                                        </Box>
                                    </Paper>
                                </Box>
                            )}

                            {/* PRINT SECTION (Exact replica of preview with fonts applied) */}
                            <Box className="print-section" sx={{ display: 'none', fontFamily: theme.typography.fontFamily }}>
                                {/* Updated Header Color (No longer Red) */}
                                <Typography variant="h5" sx={{ textDecoration: 'underline', color: 'black', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>POURING DETAILS:</Typography>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '2px solid black' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#FDE68A', color: '#854d0e' }}>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Date & Heat code</th>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Composition</th>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Pouring<br />Temperature<br />Deg.C</th>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Pouring<br />Time<br />(Sec.)</th>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Other<br />Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ verticalAlign: 'top' }}>
                                            <td style={{ border: '1px solid black', padding: '8px' }}>
                                                <div><strong>Date:</strong> <span style={dataFontStyle}>{previewPayload.pouringDate}</span></div>
                                                <div style={{ marginTop: '10px' }}><strong>Heat Code:</strong><br /><span style={dataFontStyle}>{previewPayload.heatCode}</span></div>
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px' }}>
                                                    {Object.entries(previewPayload.chemical_composition).map(([k, v]) => (
                                                        <div key={k}><strong>{k.toUpperCase()}-</strong> <span style={dataFontStyle}>{v as string}</span></div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>
                                                    <span style={dataFontStyle}>{previewPayload.pouringTemp}°C</span>
                                                </div>
                                                <div style={{ borderTop: '1px dashed black', paddingTop: '5px' }}>
                                                    <u style={{ fontWeight: 'bold' }}>Inoculation:</u><br />
                                                    Stream: <span style={dataFontStyle}>{previewPayload.inoculation.stream}</span> gms<br />
                                                    Inmould: <span style={dataFontStyle}>{previewPayload.inoculation.inmould}</span> gms
                                                </div>
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', verticalAlign: 'middle', fontSize: '16px' }}>
                                                <span style={dataFontStyle}>{previewPayload.pouringTime}</span>
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px' }}>
                                                <div>F/C & Heat No: <span style={dataFontStyle}>{previewPayload.remarks.ficHeatNo}</span></div>
                                                <div style={{ marginTop: '5px' }}>PP Code: <span style={dataFontStyle}>{previewPayload.remarks.ppCode}</span></div>
                                                <div style={{ marginTop: '5px' }}>Followed by: <span style={dataFontStyle}>{previewPayload.remarks.followedBy}</span></div>
                                                <div style={{ marginTop: '10px' }}><strong>Username:</strong> <span style={{ ...dataFontStyle, color: COLORS.primary }}>{previewPayload.remarks.userName}</span></div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                {/* Attached Files in Print */}
                                {attachedFiles.length > 0 && (
                                    <div style={{ marginTop: "20px" }}>
                                        <h3 style={{ margin: 0, paddingBottom: "5px", borderBottom: "1px solid #ccc" }}>Attached Files</h3>
                                        <ul style={{ marginTop: "5px" }}>
                                            {attachedFiles.map((file, i) => (
                                                <li key={i} style={{ fontSize: "14px" }}>{file.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Remarks in Print */}
                                {remarksText && (
                                    <div style={{ marginTop: "20px" }}>
                                        <h3 style={{ margin: 0, paddingBottom: "5px", borderBottom: "1px solid #ccc" }}>Remarks</h3>
                                        <p style={{ marginTop: "5px", whiteSpace: "pre-line" }}>{remarksText}</p>
                                    </div>
                                )}

                            </Box>
                        </>
                    )}

                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default PouringDetailsTable;