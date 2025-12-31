import React, { useEffect, useState } from "react";
import { trialService } from "../services/trialService";
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
    Button,
    IconButton,
    Grid,
    Container,
    Alert,
    GlobalStyles,
    useMediaQuery
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';

import { appTheme, COLORS } from "../theme/appTheme";
import {
    SaclHeader,
    DepartmentHeader,
    PreviewModal,
    AlertMessage,
    SpecInput,
    FileUploadSection,
    DocumentViewer
} from "./common";
import { useAuth } from "../context/AuthContext";
import { ipService } from "../services/ipService";
import { inspectionService } from "../services/inspectionService";
import { uploadFiles } from "../services/fileUploadHelper";
import { updateDepartment, updateDepartmentRole } from "../services/departmentProgressService";
import { ActionButtons, EmptyState } from "./common";


const SectionHeader = ({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${color}`, width: '100%' }}>
        <Box sx={{ color: color, display: "flex" }}>{icon}</Box>
        <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
            {title}
        </Typography>
    </Box>
);

export default function MaterialCorrection() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));

    const [remarks, setRemarks] = useState("");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const [chemState, setChemState] = useState({ c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: "" });
    const [processState, setProcessState] = useState({ pouringTemp: "", inoculantPerSec: "", inoculantType: "" });

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ severity: 'success' | 'error' | 'warning', message: string } | null>(null);
    const [userIP, setUserIP] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";

    useEffect(() => {
        const fetchData = async () => {
            if (user?.role === 'HOD' && trialId) {
                try {
                    const response = await inspectionService.getMaterialCorrection(trialId);
                    if (response.success && response.data && response.data.length > 0) {
                        const data = response.data[0];

                        const comp = typeof data.chemical_composition === 'string'
                            ? JSON.parse(data.chemical_composition)
                            : data.chemical_composition || {};

                        setChemState({
                            c: comp.c || "",
                            si: comp.si || "",
                            mn: comp.mn || "",
                            p: comp.p || "",
                            s: comp.s || "",
                            mg: comp.mg || "",
                            cr: comp.cr || "",
                            cu: comp.cu || ""
                        });

                        const proc = typeof data.process_parameters === 'string'
                            ? JSON.parse(data.process_parameters)
                            : data.process_parameters || {};

                        setProcessState({
                            pouringTemp: proc.pouringTemp || "",
                            inoculantPerSec: proc.inoculantPerSec || "",
                            inoculantType: proc.inoculantType || ""
                        });

                        setRemarks(data.remarks || "");
                    }
                } catch (error) {
                    console.error("Failed to fetch material correction data:", error);
                    setAlertMessage({ severity: 'error', message: 'Failed to load existing data.' });
                }
            }
        };
        if (trialId) fetchData();
    }, [user, trialId]);

    useEffect(() => {
        if (alertMessage) { const t = setTimeout(() => setAlertMessage(null), 4000); return () => clearTimeout(t); }
    }, [alertMessage]);

    useEffect(() => {
        const fetchIP = async () => {
            const ip = await ipService.getUserIP();
            setUserIP(ip);
        };
        fetchIP();
    }, []);

    const handleFileChange = (newFiles: File[]) => {
        setAttachedFiles(prev => [...prev, ...newFiles]);
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleExportPDF = () => {
        if (!submitted) return;
        window.print();
    };

    const handleSaveAndContinue = () => {
        const payload = {
            trial_id: trialId,
            chemical_composition: chemState,
            process_parameters: processState,
            remarks,
        };
        setPreviewPayload(payload);
        setPreviewOpen(true);
        setSubmitted(false);
        setAlertMessage(null);
    };

    const handleFinalSave = async () => {
        try {
            setLoading(true);

            if (user?.role === 'HOD' && trialId) {
                try {
                    if (isEditing) {
                        const updatePayload = {
                            trial_id: trialId,
                            chemical_composition: previewPayload.chemical_composition,
                            process_parameters: previewPayload.process_parameters,
                            remarks: previewPayload.remarks,
                            user_name: user?.username || 'Unknown',
                            user_ip: userIP
                        };

                        await inspectionService.updateMaterialCorrection(updatePayload);
                    }

                    const approvalPayload = {
                        trial_id: trialId,
                        next_department_id: 7,
                        username: user.username,
                        current_form: "POURING",
                        role: user.role,
                        remarks: "Approved by HOD"
                    };

                    await updateDepartment(approvalPayload);
                    setSubmitted(true);
                    setAlertMessage({ severity: 'success', message: 'Department progress approved successfully.' });
                    setTimeout(() => navigate('/dashboard'), 1500);
                } catch (err) {
                    setAlertMessage({ severity: 'error', message: 'Failed to approve. Please try again.' });
                    console.error(err);
                }
                return;
            }

            if (!previewPayload) return;

            const response = await inspectionService.submitMaterialCorrection({
                ...previewPayload,
                user_name: user?.username || 'Unknown',
                user_ip: userIP
            });

            if (response.success) {
                if (attachedFiles.length > 0) {
                    const uploadResults = await uploadFiles(
                        attachedFiles,
                        trialId,
                        "MATERIAL_CORRECTION",
                        user?.username || "system",
                        "MATERIAL_CORRECTION"
                    );
                }
                if (trialId) {
                    try {
                        await updateDepartmentRole({
                            trial_id: trialId,
                            current_department_id: 3,
                            username: user?.username || "user",
                            role: "HOD",
                            remarks: "Completed by user"
                        });
                        await trialService.updateTrialStatus({
                            trial_id: trialId,
                            status: "IN_PROGRESS"
                        });
                        setSubmitted(true);
                        setAlertMessage({ severity: 'success', message: "Material correction created and department progress updated successfully!" });
                    } catch (roleError) {
                        console.error("Failed to update role progress or trial status:", roleError);
                    }
                }

                setTimeout(() => navigate('/dashboard'), 1500);

            } else {
                setAlertMessage({ severity: 'error', message: response.message || "Submission failed" });
            }
        } catch (error) {
            console.error(error);
            setAlertMessage({ severity: 'error', message: "An error occurred during submission." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={appTheme}>
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
                    <DepartmentHeader title="MATERIAL CORRECTION DETAILS" userIP={userIP} user={user} />

                    <AlertMessage alert={alertMessage} />

                    <Grid container spacing={3}>

                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: { xs: 2, md: 3 } }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <SectionHeader icon={<ScienceIcon />} title="Material correction details" color={COLORS.accentBlue} />
                                    {!isMobile && <Chip label="Input Required" size="small" variant="outlined" sx={{ opacity: 0.7 }} />}
                                </Box>

                                <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
                                    <Table size="small" sx={{ minWidth: 1000, border: `1px solid ${COLORS.border}` }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    align="center"
                                                    sx={{
                                                        bgcolor: "#f0f9ff",
                                                        color: COLORS.accentBlue,
                                                        borderRight: `2px solid ${COLORS.border} !important`
                                                    }}
                                                >
                                                    Chemical Composition
                                                </TableCell>
                                                <TableCell
                                                    colSpan={3}
                                                    align="center"
                                                    sx={{
                                                        bgcolor: "#fff7ed",
                                                        color: COLORS.secondary
                                                    }}
                                                >
                                                    Process parameters
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                {["C%", "Si%", "Mn%", "P%", "S%", "Mg%", "Cu%", "Cr%"].map((h, index) => (
                                                    <TableCell
                                                        key={h}
                                                        align="center"
                                                        sx={{
                                                            backgroundColor: '#f1f5f9',
                                                            color: 'black',
                                                            fontWeight: 600,
                                                            borderBottom: `1px solid ${COLORS.headerBg}`
                                                        }}
                                                    >
                                                        {h}
                                                    </TableCell>
                                                ))}
                                                <TableCell align="center" sx={{ backgroundColor: '#f1f5f9', color: 'black', fontWeight: 600, borderBottom: `1px solid ${COLORS.headerBg}` }}>Pouring temp °C</TableCell>
                                                <TableCell align="center" sx={{ backgroundColor: '#f1f5f9', color: 'black', fontWeight: 600, borderBottom: `1px solid ${COLORS.headerBg}` }}>Inoculant per Sec</TableCell>
                                                <TableCell align="center" sx={{ backgroundColor: '#f1f5f9', color: 'black', fontWeight: 600, borderBottom: `1px solid ${COLORS.headerBg}` }}>Inoculant type</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><SpecInput value={chemState.c} onChange={(e: any) => setChemState({ ...chemState, c: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell><SpecInput value={chemState.si} onChange={(e: any) => setChemState({ ...chemState, si: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell><SpecInput value={chemState.mn} onChange={(e: any) => setChemState({ ...chemState, mn: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell><SpecInput value={chemState.p} onChange={(e: any) => setChemState({ ...chemState, p: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell><SpecInput value={chemState.s} onChange={(e: any) => setChemState({ ...chemState, s: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell><SpecInput value={chemState.mg} onChange={(e: any) => setChemState({ ...chemState, mg: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell><SpecInput value={chemState.cu} onChange={(e: any) => setChemState({ ...chemState, cu: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell sx={{ borderRight: `2px solid ${COLORS.border} !important` }}>
                                                    <SpecInput value={chemState.cr} onChange={(e: any) => setChemState({ ...chemState, cr: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} />
                                                </TableCell>

                                                <TableCell><SpecInput value={processState.pouringTemp} onChange={(e: any) => setProcessState({ ...processState, pouringTemp: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell><SpecInput value={processState.inoculantPerSec} onChange={(e: any) => setProcessState({ ...processState, inoculantPerSec: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                                <TableCell><SpecInput value={processState.inoculantType} onChange={(e: any) => setProcessState({ ...processState, inoculantType: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </Box>
                                {isMobile && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>← Swipe to view more →</Typography>}
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                                <SectionHeader
                                    icon={<UploadFileIcon />}
                                    title="Attach PDF / Image Files"
                                    color={COLORS.accentBlue}
                                />

                                <FileUploadSection
                                    files={attachedFiles}
                                    onFilesChange={handleFileChange}
                                    onFileRemove={removeAttachedFile}
                                    label="Upload Files"
                                    showAlert={(severity, message) => setAlertMessage({ severity, message })}
                                />
                                <DocumentViewer trialId={trialId} category="MATERIAL_CORRECTION" />
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                                <SectionHeader
                                    icon={<EditIcon />}
                                    title="Remarks"
                                    color={COLORS.primary}
                                />

                                <TextField
                                    multiline
                                    rows={3}
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Enter remarks..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    sx={{ bgcolor: "#fff" }}
                                    disabled={user?.role === 'HOD' && !isEditing}
                                />
                            </Paper>
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
                        open={previewOpen}
                        onClose={() => setPreviewOpen(false)}
                        onSubmit={handleFinalSave}
                        onExport={handleExportPDF}
                        title="Verify Specification"
                        subtitle="Composition & Process Check"
                        submitted={submitted}
                        isSubmitting={loading}
                    >
                        {previewPayload && (
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.accentBlue }}>Composition Check</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 1, mb: 3 }}>
                                    {["C", "Si", "Mn", "P", "S", "Mg", "Cu", "Cr"].map(k => (
                                        <Box key={k} sx={{ textAlign: "center", p: 1, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                                            <Typography variant="caption" color="text.secondary">{k}</Typography>
                                            <Typography variant="body2" fontWeight="bold">{previewPayload.chemical_composition[k.toLowerCase()] || "-"}</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <Box sx={{ mb: 3, p: 2, bgcolor: "white", border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>PROCESS PARAMETERS</Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 4 }}><Typography variant="body2">Temp <b>{previewPayload.process_parameters.pouringTemp || "-"}°C</b></Typography></Grid>
                                        <Grid size={{ xs: 4 }}><Typography variant="body2">Inoc/Sec <b>{previewPayload.process_parameters.inoculantPerSec || "-"}</b></Typography></Grid>
                                        <Grid size={{ xs: 4 }}><Typography variant="body2">Type <b>{previewPayload.process_parameters.inoculantType || "-"}</b></Typography></Grid>
                                    </Grid>
                                </Box>

                                {attachedFiles.length > 0 && (
                                    <Box sx={{ mt: 3, p: 2, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                            ATTACHED FILES
                                        </Typography>
                                        {attachedFiles.map((file, i) => (
                                            <Typography key={i} variant="body2">• {file.name}</Typography>
                                        ))}
                                    </Box>
                                )}

                                {remarks && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                            REMARKS
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                                            {remarks}
                                        </Typography>
                                    </Box>
                                )}

                                {alertMessage && alertMessage.severity === 'success' && <Alert severity="success" sx={{ mt: 2 }}>{alertMessage.message}</Alert>}
                            </Box>
                        )}
                    </PreviewModal>

                    {previewPayload && (
                        <Box className="print-section" sx={{ display: 'none' }}>
                            <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>FOUNDRY SAMPLE CARD</Typography>
                                    <Typography variant="body1">Trial Report & Specification Sheet</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2">Date: {new Date().toLocaleDateString()}</Typography>
                                    <Typography variant="body2">IP: {userIP}</Typography>
                                </Box>
                            </Box>

                            <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Material Correction Details</Typography>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                <thead>
                                    <tr>
                                        <th colSpan={8} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Chemical Composition</th>
                                        <th colSpan={3} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Process Parameters</th>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                                        {["C", "Si", "Mn", "P", "S", "Mg", "Cu", "Cr"].map(h => (
                                            <th key={h} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{h}</th>
                                        ))}
                                        <th style={{ border: '1px solid #999', padding: '6px' }}>Pouring Temp</th>
                                        <th style={{ border: '1px solid #999', padding: '6px' }}>Inoculant/Sec</th>
                                        <th style={{ border: '1px solid #999', padding: '6px' }}>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {["c", "si", "mn", "p", "s", "mg", "cu", "cr"].map(k => (
                                            <td key={k} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>
                                                {previewPayload.chemical_composition[k] || "-"}
                                            </td>
                                        ))}
                                        <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.process_parameters.pouringTemp}</td>
                                        <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.process_parameters.inoculantPerSec}</td>
                                        <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.process_parameters.inoculantType}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {remarks && (
                                <div style={{ marginTop: "20px" }}>
                                    <h3 style={{ margin: 0, paddingBottom: "5px", borderBottom: "1px solid #ccc" }}>Remarks</h3>
                                    <p style={{ whiteSpace: "pre-line", marginTop: "5px" }}>{remarks}</p>
                                </div>
                            )}
                            {attachedFiles.length > 0 && (
                                <div style={{ marginTop: "20px" }}>
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
                    )}

                </Container>
            </Box>
        </ThemeProvider>
    );
}
