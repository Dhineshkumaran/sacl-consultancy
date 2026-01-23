import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";

import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { uploadFiles } from '../../services/fileUploadHelper';
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
import Swal from 'sweetalert2';

import FactoryIcon from '@mui/icons-material/Factory';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import SaclHeader from "../common/SaclHeader";
import { apiService } from '../../services/commonService';
import { inspectionService } from '../../services/inspectionService';
import { trialService } from '../../services/trialService';
import { useAlert } from '../../hooks/useAlert';
import { AlertMessage } from '../common/AlertMessage';
import departmentProgressService from "../../services/departmentProgressService";
import DepartmentHeader from "../common/DepartmentHeader";
import { FileUploadSection, PreviewModal, SpecInput, FormSection, ActionButtons, EmptyState, LoadingState, DocumentViewer } from '../common';
import BasicInfo from "../dashboard/BasicInfo";
import { formatDate } from "../../utils";

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

function PouringDetailsTable() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";
    const [isAssigned, setIsAssigned] = useState<boolean | null>(null);



    useEffect(() => {
        const checkAssignment = async () => {
            if (user && trialId) {
                if (user.role === 'Admin') {
                    setIsAssigned(true);
                    return;
                }
                try {
                    const pending = await departmentProgressService.getProgress(user.username);
                    const found = pending.find(p => p.trial_id === trialId);
                    setIsAssigned(!!found);
                } catch (error) {
                    console.error("Failed to check assignment:", error);
                    setIsAssigned(false);
                }
            } else {
                setIsAssigned(false);
            }
        };
        checkAssignment();
    }, [user, trialId]);
    const [loading, setLoading] = useState(false);

    const [pouringDate, setPouringDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [heatCode, setHeatCode] = useState<string>("");
    const [userIP, setUserIP] = useState<string>("Loading...");
    const [actualMoulds, setActualMoulds] = useState<string>("");
    const [noOfMouldPoured, setNoOfMouldPoured] = useState<string>("");

    useEffect(() => {
        const fetchIP = async () => {
            const ip = await apiService.getIP();
            setUserIP(ip);
        };
        fetchIP();
    }, []);

    useEffect(() => {
        const fetchTrialDetails = async () => {
            if (trialId) {
                try {
                    const response = await trialService.getTrialById(trialId);
                    if (response && response.data) {
                        setActualMoulds(response.data.actual_moulds || "");
                        setNoOfMouldPoured(prev => prev || response.data.actual_moulds || "");
                    }
                } catch (error) {
                    console.error("Failed to fetch trial details:", error);
                }
            }
        };
        fetchTrialDetails();
    }, [trialId]);

    const [chemState, setChemState] = useState({
        c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: ""
    });
    const [pouringTemp, setPouringTemp] = useState<string>("");
    const [pouringTime, setPouringTime] = useState<string>("");
    const [inoculationText, setInoculationText] = useState<string>("");
    const [inoculationStream, setInoculationStream] = useState<string>("");
    const [inoculationInmould, setInoculationInmould] = useState<string>("");

    const [ficHeatNo, setFicHeatNo] = useState<string>("");
    const [ppCode, setPpCode] = useState<string>("");
    const [followedBy, setFollowedBy] = useState<string>("");
    const [userName] = useState<string>(user?.username || "Admin_User");
    const [remarksText, setRemarksText] = useState<string>("");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const { alert, showAlert } = useAlert();
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if ((user?.role === 'HOD' || user?.role === 'Admin') && trialId) {
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
                        setNoOfMouldPoured(String(data.no_of_mould_poured || ""));
                    }
                } catch (error) {
                    console.error("Failed to fetch pouring data:", error);
                    showAlert('error', 'Failed to load existing data.');
                }
            }
        };
        if (trialId) fetchData();
    }, [user, trialId]); // eslint-disable-line react-hooks/exhaustive-deps



    const handleSaveAndContinue = () => {
        const payload = {
            pouringDate,
            heatCode,
            chemical_composition: chemState,
            noOfMouldPoured,
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

            if ((user?.role === 'HOD' || user?.role === 'Admin') && trialId) {
                try {
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
                        no_of_mould_poured: parseInt(noOfMouldPoured) || 0,
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
                        remarks: previewPayload.remarksText,
                        is_edit: isEditing
                    };

                    await inspectionService.updatePouringDetails(updatePayload);

                    setSubmitted(true);
                    setPreviewMode(false);
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Pouring details updated successfully.'
                    });
                    navigate('/dashboard');
                } catch (err: any) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: err.message || 'Failed to update pouring details. Please try again.'
                    });
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
                no_of_mould_poured: parseInt(noOfMouldPoured) || 0,
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
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Some files failed to upload. Please try again.'
                        });
                    }
                } catch (uploadError) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'File upload error. Please try again.'
                    });
                }
            }
            setSubmitted(true);
            setPreviewMode(false);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Pouring details created successfully.'
            });
            navigate('/dashboard');
        } catch (error: any) {
            console.error("Error saving pouring details:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create pouring details. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };


    const dataFontStyle = { fontFamily: '"Roboto Mono", monospace', fontWeight: 500 };

    return (
        <ThemeProvider theme={theme}>

            <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
                <Container maxWidth="xl" disableGutters>

                    <SaclHeader />


                    <DepartmentHeader
                        title="POURING DETAILS"
                        icon={<FactoryIcon sx={{ fontSize: 32 }} />}
                        userIP={userIP}
                        user={user}
                    />
                    <AlertMessage alert={alert} />

                    {isAssigned === false && (user?.role !== 'Admin') ? (
                        <EmptyState
                            title="No Pending Works"
                            description="This trial is not currently assigned to you."
                            severity="warning"
                            action={{
                                label: "Go to Dashboard",
                                onClick: () => navigate('/dashboard')
                            }}
                        />
                    ) : (
                        <>
                            <BasicInfo trialId={trialId || ""} />

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
                                                                        disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                                                                    />
                                                                </Box>
                                                                <Box>
                                                                    <LabelText>Heat Code</LabelText>
                                                                    <SpecInput
                                                                        placeholder="Code"
                                                                        value={heatCode}
                                                                        onChange={(e: any) => setHeatCode(e.target.value)}
                                                                        disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                                            />
                                                                        </Box>
                                                                    </Grid>
                                                                ))}
                                                                <Grid size={{ xs: 12 }} sx={{ my: 0.5 }}><Divider /></Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Box display="flex" alignItems="center" gap={2}>
                                                                        <Typography variant="body2" fontWeight="bold">No of mould poured-</Typography>
                                                                        <SpecInput
                                                                            placeholder="Actual"
                                                                            value={noOfMouldPoured}
                                                                            onChange={(e: any) => setNoOfMouldPoured(e.target.value)}
                                                                            disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                                            sx={{ width: '100px' }}
                                                                        />
                                                                    </Box>
                                                                </Grid>
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
                                                                            endAdornment: <InputAdornment position="end">Â°C</InputAdornment>,
                                                                        }}
                                                                        disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                                                            disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                                                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                                                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                            />
                                                        </TableCell>


                                                        <TableCell>
                                                            <Grid container spacing={2}>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Typography variant="caption" noWrap minWidth={90}>F/C & Heat No:</Typography>
                                                                        <SpecInput value={ficHeatNo} onChange={(e: any) => setFicHeatNo(e.target.value)} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} />
                                                                    </Box>
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Typography variant="caption" noWrap minWidth={90}>PP Code :</Typography>
                                                                        <SpecInput value={ppCode} onChange={(e: any) => setPpCode(e.target.value)} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} />
                                                                    </Box>
                                                                </Grid>
                                                                <Grid size={{ xs: 12 }}>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Typography variant="caption" noWrap minWidth={90}>Followed by :</Typography>
                                                                        <SpecInput value={followedBy} onChange={(e: any) => setFollowedBy(e.target.value)} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} />
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
                                        {(user?.role !== 'HOD' && user?.role !== 'Admin' || isEditing) && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase" }}>
                                                    Attach PDF / Image Files
                                                </Typography>
                                                <FileUploadSection
                                                    files={attachedFiles}
                                                    onFilesChange={(newFiles) => setAttachedFiles(prev => [...prev, ...newFiles])}
                                                    onFileRemove={(index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                                                    showAlert={showAlert}
                                                    label="Upload Files"
                                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                />
                                            </>
                                        )}
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
                                            disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                        />
                                    </FormSection>
                                </Grid>


                                <Grid size={{ xs: 12 }} sx={{ mt: 2, mb: 4 }}>
                                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2}>
                                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                                            <ActionButtons
                                                {...(user?.role !== 'HOD' && user?.role !== 'Admin' ? { onReset: () => window.location.reload() } : {})}
                                                onSave={handleSaveAndContinue}
                                                showSubmit={false}
                                                saveLabel={user?.role === 'HOD' || user?.role === 'Admin' ? 'Approve' : 'Save & Continue'}
                                                saveIcon={user?.role === 'HOD' || user?.role === 'Admin' ? <CheckCircleIcon /> : <SaveIcon />}
                                            >
                                                {(user?.role === 'HOD' || user?.role === 'Admin') && (
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
                        </>
                    )}

                    <PreviewModal
                        open={previewMode}
                        onClose={() => setPreviewMode(false)}
                        onSubmit={handleFinalSave}
                        title="POURING DETAILS:"
                        submitted={submitted}
                        isSubmitting={loading}
                    >
                        <Box sx={{ p: 4 }}>
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
                                            <div><strong>Date:</strong> <span style={dataFontStyle}>{formatDate(previewPayload?.pouringDate)}</span></div>
                                            <div style={{ marginTop: '15px' }}><strong>Heat Code:</strong><br /><span style={dataFontStyle}>{previewPayload?.heatCode}</span></div>
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '12px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                                                {previewPayload?.chemical_composition && Object.entries(previewPayload.chemical_composition).map(([k, v]) => (
                                                    <div key={k}><strong>{k.toUpperCase()}-</strong> <span style={dataFontStyle}>{v as string}</span></div>
                                                ))}
                                            </div>
                                            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed #ccc' }}>
                                                <strong>No of mould poured:</strong> <span style={dataFontStyle}>{previewPayload?.noOfMouldPoured}</span>
                                            </div>
                                        </td>
                                        <td style={{ border: '1px solid black', padding: '12px' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
                                                <span style={dataFontStyle}>{previewPayload?.pouringTemp}Â°C</span>
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
                                        <Typography key={i} variant="body2">â€¢ {file.name}</Typography>
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
