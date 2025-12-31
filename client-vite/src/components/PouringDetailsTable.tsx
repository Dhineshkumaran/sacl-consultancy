import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import NoPendingWorks from "./common/NoPendingWorks";
import { useAuth } from "../context/AuthContext";
import { updateDepartment, updateDepartmentRole } from "../services/departmentProgressService";
import { useNavigate } from 'react-router-dom';
import { uploadFiles } from '../services/fileUploadHelper';
import {
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
    InputAdornment,
    useMediaQuery,
    GlobalStyles,
    Divider,
    IconButton
} from "@mui/material";


import FactoryIcon from '@mui/icons-material/Factory';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";
import { ipService } from '../services/ipService';
import { inspectionService } from '../services/inspectionService';
import { useAlert } from '../hooks/useAlert';
import { AlertMessage } from './common/AlertMessage';
import DepartmentHeader from "./common/DepartmentHeader";
import { FileUploadSection, PreviewModal, SpecInput, FormSection, ActionButtons, Common, EmptyState, LoadingState, DocumentViewer } from './common';



const COLORS = {
    primary: "#1e293b",
    secondary: "#ea580c",
    background: "#f8fafc",
    surface: "#ffffff",
    border: "#cbd5e1",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    accentBlue: "#0ea5e9",
    accentGreen: "#10b981",
    headerBg: "#FDE68A",
    bodyBg: "#ffffff",
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



const LabelText = ({ children }: { children: React.ReactNode }) => (
    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 0.5, display: 'block' }}>
        {children}
    </Typography>
);

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

function PouringDetailsTable({ pouringDetails, onPouringDetailsChange, submittedData }: PouringDetailsTableProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(false);

    const [pouringDate, setPouringDate] = useState<string>(pouringDetails?.date || new Date().toISOString().split('T')[0]);
    const [heatCode, setHeatCode] = useState<string>(pouringDetails?.heatCode || "");
    const [userIP, setUserIP] = useState<string>("Loading...");

    useEffect(() => {
        const fetchIP = async () => {
            const ip = await ipService.getUserIP();
            setUserIP(ip);
        };
        fetchIP();
    }, []);

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
    const [inoculationText, setInoculationText] = useState<string>("");
    const [inoculationStream, setInoculationStream] = useState<string>("");
    const [inoculationInmould, setInoculationInmould] = useState<string>("");

    const [ficHeatNo, setFicHeatNo] = useState<string>(pouringDetails?.ficHeatNo || "");
    const [ppCode, setPpCode] = useState<string>(pouringDetails?.ppCode || "");
    const [followedBy, setFollowedBy] = useState<string>(pouringDetails?.followedBy || "");
    const [userName] = useState<string>(user?.username || "Admin_User");
    const [remarksText, setRemarksText] = useState<string>("");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const { alert, showAlert } = useAlert();
    const [isEditing, setIsEditing] = useState(false);

    const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";



    useEffect(() => {
        const fetchData = async () => {
            if (user?.role === 'HOD' && trialId) {
                try {
                    const response = await inspectionService.getPouringDetails(trialId);
                    if (response.success && response.data && response.data.length > 0) {
                        const data = response.data[0];
                        setPouringDate(data.pour_date ? new Date(data.pour_date).toISOString().slice(0, 10) : "");
                        setHeatCode(data.heat_code || "");

                        const comp = typeof data.composition === 'string' ? JSON.parse(data.composition) : data.composition || {};
                        setChemState({
                            c: comp.C || "",
                            si: comp.Si || "",
                            mn: comp.Mn || "",
                            p: comp.P || "",
                            s: comp.S || "",
                            mg: comp.Mg || "",
                            cr: comp.Cr || "",
                            cu: comp.Cu || ""
                        });

                        setPouringTemp(String(data.pouring_temp_c || ""));
                        setPouringTime(String(data.pouring_time_sec || ""));

                        const inoc = typeof data.inoculation === 'string' ? JSON.parse(data.inoculation) : data.inoculation || {};
                        setInoculationText(inoc.Text || "");
                        setInoculationStream(inoc.Stream || "");
                        setInoculationInmould(inoc.Inmould || "");

                        const rem = typeof data.other_remarks === 'string' ? JSON.parse(data.other_remarks) : data.other_remarks || {};
                        setFicHeatNo(rem["F/C & Heat No."] || "");
                        setPpCode(rem["PP Code"] || "");
                        setFollowedBy(rem["Followed by"] || "");
                        setRemarksText(data.remarks || "");
                    }
                } catch (error) {
                    console.error("Failed to fetch pouring data:", error);
                    showAlert('error', 'Failed to load existing data.');
                }
            }
        };
        if (trialId) fetchData();
    }, [user, trialId]);

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

    const handleSaveAndContinue = () => {
        const payload = {
            pouringDate,
            heatCode,
            chemical_composition: chemState,
            pouringTemp,
            pouringTime,
            inoculation: { text: inoculationText, stream: inoculationStream, inmould: inoculationInmould },
            remarks: { ficHeatNo, ppCode, followedBy, userName },
            remarksText,
            attachedFiles
        };
        setPreviewPayload(payload);
        setPreviewMode(true);
    };

    const handleFinalSave = async () => {
        try {
            setLoading(true);

            if (user?.role === 'HOD' && trialId) {
                try {
                    if (isEditing) {
                        const updatePayload = {
                            trial_id: trialId,
                            pour_date: previewPayload.pouringDate,
                            heat_code: previewPayload.heatCode,
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
                            pouring_temp_c: parseFloat(previewPayload.pouringTemp) || 0,
                            pouring_time_sec: parseInt(previewPayload.pouringTime) || 0,
                            inoculation: {
                                Text: inoculationText,
                                Stream: inoculationStream,
                                Inmould: inoculationInmould
                            },
                            other_remarks: {
                                "F/C & Heat No.": ficHeatNo,
                                "PP Code": ppCode,
                                "Followed by": followedBy,
                                "Username": userName
                            },
                            remarks: previewPayload.remarksText
                        };

                        await inspectionService.updatePouringDetails(updatePayload);
                    }

                    const approvalPayload = {
                        trial_id: trialId,
                        next_department_id: 4,
                        username: user.username,
                        current_form: "SANDPLANT",
                        role: user.role,
                        remarks: "Approved by HOD"
                    };

                    await updateDepartment(approvalPayload);
                    setSubmitted(true);
                    showAlert('success', 'Department progress approved successfully.');
                    setTimeout(() => navigate('/dashboard'), 1500);
                } catch (err: any) {
                    showAlert('error', 'Failed to approve. Please try again.');
                    console.error(err);
                }
                return;
            }

            const apiPayload = {
                trial_id: trialId,
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
                    Text: inoculationText,
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

            await inspectionService.submitPouringDetails(apiPayload);

            if (trialId) {
                try {
                    await updateDepartmentRole({
                        trial_id: trialId,
                        current_department_id: 7,
                        username: user?.username || "user",
                        role: "user",
                        remarks: "Completed by user"
                    });
                } catch (roleError) {
                    console.error("Failed to update role progress:", roleError);
                }
            }

            if (attachedFiles.length > 0) {
                try {
                    const uploadResults = await uploadFiles(
                        attachedFiles,
                        trialId || "trial_id",
                        "POURING_DETAILS",
                        user?.username || "system",
                        "POURING_DETAILS"
                    );

                    const failures = uploadResults.filter(r => !r.success);
                    if (failures.length > 0) {
                        console.error("Some files failed to upload:", failures);
                    }
                } catch (uploadError) {
                    console.error("File upload error:", uploadError);
                }
            }
            setSubmitted(true);
            showAlert('success', 'Pouring Details Registered and department progress updated Successfully');
            navigate('/dashboard');
        } catch (error) {
            console.error("Error saving pouring details:", error);
            showAlert('error', 'Failed to save pouring details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => { window.print(); };

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


                    <DepartmentHeader
                        title="POURING DETAILS"
                        icon={<FactoryIcon sx={{ fontSize: 32 }} />}
                        userIP={userIP}
                        user={user}
                        extra={submittedData?.trialNo && (
                            <Chip
                                label={`Trial: ${submittedData.trialNo}`}
                                color="secondary"
                                size="small"
                                sx={{ fontWeight: 600 }}
                            />
                        )}
                    />

                    <Common trialId={trialId} />

                    <AlertMessage alert={alert} />

                    <Grid container spacing={3}>


                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: { xs: 1, md: 2 }, overflow: "hidden" }}>
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

                                                <TableCell>
                                                    <Box display="flex" flexDirection="column" gap={2}>
                                                        <Box>
                                                            <LabelText>Date</LabelText>
                                                            <SpecInput
                                                                type="date"
                                                                value={pouringDate}
                                                                onChange={(e: any) => setPouringDate(e.target.value)}
                                                                inputStyle={{ textAlign: 'left' }}
                                                                disabled={user?.role === 'HOD'}
                                                            />
                                                        </Box>
                                                        <Box>
                                                            <LabelText>Heat Code</LabelText>
                                                            <SpecInput
                                                                placeholder="Code"
                                                                value={heatCode}
                                                                onChange={(e: any) => setHeatCode(e.target.value)}
                                                                disabled={user?.role === 'HOD' && !isEditing}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </TableCell>


                                                <TableCell>
                                                    <Grid container spacing={1}>
                                                        {["C", "Si", "Mn", "P"].map((el) => (
                                                            <Grid size={{ xs: 6, sm: 3 }} key={el}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="body2" fontWeight="bold">{el}-</Typography>
                                                                    <SpecInput
                                                                        value={(chemState as any)[el.toLowerCase()]}
                                                                        onChange={(e: any) => setChemState({ ...chemState, [el.toLowerCase()]: e.target.value })}
                                                                        disabled={user?.role === 'HOD' && !isEditing}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                        <Grid size={{ xs: 12 }} sx={{ my: 0.5 }}><Divider /></Grid>

                                                        {["S", "Mg", "Cu", "Cr"].map((el) => (
                                                            <Grid size={{ xs: 6, sm: 3 }} key={el}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="body2" fontWeight="bold">{el}-</Typography>
                                                                    <SpecInput
                                                                        value={(chemState as any)[el.toLowerCase()]}
                                                                        onChange={(e: any) => setChemState({ ...chemState, [el.toLowerCase()]: e.target.value })}
                                                                        disabled={user?.role === 'HOD' && !isEditing}
                                                                    />
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </TableCell>


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
                                                                disabled={user?.role === 'HOD' && !isEditing}
                                                            />
                                                        </Box>
                                                        <Divider sx={{ borderStyle: 'dashed' }} />
                                                        <Box>
                                                            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
                                                                <Typography variant="caption" fontWeight="bold" sx={{ textDecoration: "underline" }}>Inoculation</Typography>
                                                                <SpecInput
                                                                    placeholder="Type"
                                                                    value={inoculationText}
                                                                    onChange={(e: any) => setInoculationText(e.target.value)}
                                                                    sx={{ width: 80 }}
                                                                    disabled={user?.role === 'HOD' && !isEditing}
                                                                />
                                                            </Box>
                                                            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                        <Typography variant="caption">Stream</Typography>
                                                                        <SpecInput
                                                                            sx={{ width: 60 }}
                                                                            placeholder="gms"
                                                                            value={inoculationStream}
                                                                            onChange={(e: any) => setInoculationStream(e.target.value)}
                                                                            disabled={user?.role === 'HOD' && !isEditing}
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
                                                                            disabled={user?.role === 'HOD' && !isEditing}
                                                                        />
                                                                    </Box>
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                    </Box>
                                                </TableCell>


                                                <TableCell sx={{ verticalAlign: 'middle' }}>
                                                    <SpecInput
                                                        placeholder="Sec"
                                                        value={pouringTime}
                                                        onChange={(e: any) => setPouringTime(e.target.value)}
                                                        disabled={user?.role === 'HOD' && !isEditing}
                                                    />
                                                </TableCell>


                                                <TableCell>
                                                    <Grid container spacing={2}>
                                                        <Grid size={{ xs: 12 }}>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography variant="caption" noWrap minWidth={90}>F/C & Heat No:</Typography>
                                                                <SpecInput value={ficHeatNo} onChange={(e: any) => setFicHeatNo(e.target.value)} disabled={user?.role === 'HOD' && !isEditing} />
                                                            </Box>
                                                        </Grid>
                                                        <Grid size={{ xs: 12 }}>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography variant="caption" noWrap minWidth={90}>PP Code :</Typography>
                                                                <SpecInput value={ppCode} onChange={(e: any) => setPpCode(e.target.value)} disabled={user?.role === 'HOD' && !isEditing} />
                                                            </Box>
                                                        </Grid>
                                                        <Grid size={{ xs: 12 }}>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography variant="caption" noWrap minWidth={90}>Followed by :</Typography>
                                                                <SpecInput value={followedBy} onChange={(e: any) => setFollowedBy(e.target.value)} disabled={user?.role === 'HOD' && !isEditing} />
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


                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase" }}>
                                    Attach PDF / Image Files
                                </Typography>
                                <FileUploadSection
                                    files={attachedFiles}
                                    onFilesChange={(newFiles) => setAttachedFiles(prev => [...prev, ...newFiles])}
                                    onFileRemove={(index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                                    showAlert={showAlert}
                                    label="Upload Files"
                                    disabled={user?.role === 'HOD' && !isEditing}
                                />
                                <DocumentViewer trialId={trialId || ""} category="POURING_DETAILS" />
                            </Paper>
                        </Grid>


                        <Grid size={{ xs: 12 }}>
                            <FormSection title="Remarks" icon={<EditIcon />}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Enter additional remarks..."
                                    value={remarksText}
                                    onChange={(e) => setRemarksText(e.target.value)}
                                    sx={{ bgcolor: "white" }}
                                    disabled={user?.role === 'HOD' && !isEditing}
                                />
                            </FormSection>
                        </Grid>


                        <Grid size={{ xs: 12 }} sx={{ mt: 2, mb: 4 }}>
                            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2}>
                                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                                    <ActionButtons
                                        {...(user?.role !== 'HOD' ? { onReset: () => window.location.reload() } : {})}
                                        onSave={handleSaveAndContinue}
                                        showSubmit={false}
                                        saveLabel={user?.role === 'HOD' ? 'Approve' : 'Save & Continue'}
                                        saveIcon={user?.role === 'HOD' ? <CheckCircleIcon /> : <SaveIcon />}
                                    >
                                        {user?.role === 'HOD' && (
                                            <Button
                                                variant="outlined"
                                                onClick={() => setIsEditing(!isEditing)}
                                                sx={{ color: COLORS.secondary, borderColor: COLORS.secondary }}
                                            >
                                                {isEditing ? "Cancel Edit" : "Edit Details"}
                                            </Button>
                                        )}
                                    </ActionButtons>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>


                    <PreviewModal
                        open={previewMode}
                        onClose={() => setPreviewMode(false)}
                        onSubmit={handleFinalSave}
                        onExport={handleExportPDF}
                        title="POURING DETAILS:"
                        submitted={submitted}
                        isSubmitting={loading}
                    >
                        <Box sx={{ p: 4 }} className="print-section">
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
                                            <div><strong>Date:</strong> <span style={dataFontStyle}>{previewPayload?.pouringDate}</span></div>
                                            <div style={{ marginTop: '15px' }}><strong>Heat Code:</strong><br /><span style={dataFontStyle}>{previewPayload?.heatCode}</span></div>
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '12px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                                                {previewPayload?.chemical_composition && Object.entries(previewPayload.chemical_composition).map(([k, v]) => (
                                                    <div key={k}><strong>{k.toUpperCase()}-</strong> <span style={dataFontStyle}>{v as string}</span></div>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '12px' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
                                                <span style={dataFontStyle}>{previewPayload?.pouringTemp}°C</span>
                                            </div>
                                            <div style={{ borderTop: '1px dashed black', paddingTop: '10px' }}>
                                                <u style={{ fontWeight: 'bold' }}>Inoculation: <span style={{ ...dataFontStyle, fontWeight: 'normal' }}>{previewPayload?.inoculation?.text}</span></u><br />
                                                Stream: <span style={dataFontStyle}>{previewPayload?.inoculation.stream}</span> gms<br />
                                                Inmould: <span style={dataFontStyle}>{previewPayload?.inoculation.inmould}</span> gms
                                            </div>
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', verticalAlign: 'middle', fontSize: '18px' }}>
                                            <span style={dataFontStyle}>{previewPayload?.pouringTime}</span>
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '12px' }}>
                                            <div>F/C & Heat No: <span style={dataFontStyle}>{previewPayload?.remarks.ficHeatNo}</span></div>
                                            <div style={{ marginTop: '8px' }}>PP Code: <span style={dataFontStyle}>{previewPayload?.remarks.ppCode}</span></div>
                                            <div style={{ marginTop: '8px' }}>Followed by: <span style={dataFontStyle}>{previewPayload?.remarks.followedBy}</span></div>
                                            <div style={{ marginTop: '15px' }}><strong>Username:</strong> <span style={{ ...dataFontStyle, color: COLORS.primary }}>{previewPayload?.remarks.userName}</span></div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {previewPayload?.attachedFiles?.length > 0 && (
                                <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1, bgcolor: "white" }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>ATTACHED FILES:</Typography>
                                    {previewPayload.attachedFiles.map((file: File, i: number) => (
                                        <Typography key={i} variant="body2">• {file.name}</Typography>
                                    ))}
                                </Box>
                            )}

                            {previewPayload?.remarksText && (
                                <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1, bgcolor: "white" }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>REMARKS:</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                                        {previewPayload.remarksText}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mt: 3 }}>
                                <AlertMessage alert={alert} />
                            </Box>
                        </Box>
                    </PreviewModal>

                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default PouringDetailsTable;
