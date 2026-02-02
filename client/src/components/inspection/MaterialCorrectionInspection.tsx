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
    Button,
    IconButton,
    Grid,
    Container,
    Alert,
    GlobalStyles,
    useMediaQuery
} from "@mui/material";
import Swal from 'sweetalert2';

import UploadFileIcon from "@mui/icons-material/UploadFile";
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';

import { appTheme, COLORS } from "../../theme/appTheme";
import {
    PreviewModal,
    AlertMessage,
    SpecInput,
    FileUploadSection,
    DocumentViewer
} from "../common";
import Header from "../dashboard/Header";
import ProfileModal from "../dashboard/ProfileModal";
import { getDepartmentInfo } from "../../utils/dashboardUtils";
import BasicInfo from "../dashboard/BasicInfo";
import { useAuth } from "../../context/AuthContext";
import { inspectionService } from "../../services/inspectionService";
import { uploadFiles } from "../../services/fileUploadHelper";
import { formatDate } from "../../utils";
import { ActionButtons, EmptyState } from "../common";
import departmentProgressService from "../../services/departmentProgressService";
import { useAlert } from "../../hooks/useAlert";
import { apiService } from "../../services/commonService";
import { safeParse } from "../../utils/jsonUtils";


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
    const [userIP, setUserIP] = useState<string>("Loading...");
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
    const departmentInfo = getDepartmentInfo(user);


    const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";
    const [isAssigned, setIsAssigned] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAssignment = async () => {
            if (user && trialId) {
                if (user.role === 'Admin' || user.department_id === 8) {
                    setIsAssigned(true);
                    return;
                }
                try {
                    const pending = await departmentProgressService.getProgress(user.username, user.department_id);
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

    useEffect(() => {
        const fetchIP = async () => {
            const ip = await apiService.getIP();
            setUserIP(ip);
        };
        fetchIP();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if ((user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && trialId) {
                try {
                    const response = await inspectionService.getMaterialCorrection(trialId);
                    if (response.success && response.data && response.data.length > 0) {
                        const data = response.data[0];

                        const comp = safeParse<any>(data.chemical_composition, {});

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

                        const proc = safeParse<any>(data.process_parameters, {});

                        setProcessState({
                            pouringTemp: proc.pouringTemp || "",
                            inoculantPerSec: proc.inoculantPerSec || "",
                            inoculantType: proc.inoculantType || ""
                        });

                        setRemarks(data.remarks || "");
                    }
                } catch (error) {
                    console.error("Failed to fetch material correction data:", error);
                    showAlert('error', 'Failed to load existing data.');
                }
            }
        };
        if (trialId) fetchData();
    }, [user, trialId]); // eslint-disable-line react-hooks/exhaustive-deps

    const { showAlert, alert } = useAlert();

    const handleFileChange = (newFiles: File[]) => {
        setAttachedFiles(prev => [...prev, ...newFiles]);
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };


    const buildServerPayload = (isDraft: boolean = false) => {
        const source = previewPayload || {
            trial_id: trialId,
            chemical_composition: chemState,
            process_parameters: processState,
            remarks,
            is_edit: isEditing
        };

        return {
            ...source,
            user_name: user?.username || 'Unknown',
            user_ip: userIP,
            is_draft: isDraft,
            is_edit: isEditing
        };
    };

    const handleSaveAndContinue = () => {
        const payload = {
            trial_id: trialId,
            chemical_composition: chemState,
            process_parameters: processState,
            remarks,
            is_edit: isEditing
        };

        setPreviewPayload(payload);
        setPreviewOpen(true);
        setSubmitted(false);
    };

    const handleFinalSave = async () => {
        setLoading(true);
        try {
            const apiPayload = buildServerPayload(false);

            if (((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
                await inspectionService.updateMaterialCorrection(apiPayload);
            } else {
                await inspectionService.submitMaterialCorrection(apiPayload);
            }

            if (attachedFiles.length > 0) {
                await uploadFiles(
                    attachedFiles,
                    trialId,
                    "MATERIAL_CORRECTION",
                    user?.username || "system",
                    "MATERIAL_CORRECTION"
                ).catch(err => console.error("File upload error:", err));
            }

            setSubmitted(true);
            setPreviewOpen(false);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Material Correction created successfully.`
            });
            navigate('/dashboard');
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || "Failed to save Material Correction. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        setLoading(true);
        try {
            const apiPayload = buildServerPayload(true);

            if ((user?.role === 'HOD' || user?.role === 'Admin') && trialId) {
                await inspectionService.updateMaterialCorrection(apiPayload);
            } else {
                await inspectionService.submitMaterialCorrection(apiPayload);
            }

            if (attachedFiles.length > 0) {
                await uploadFiles(
                    attachedFiles,
                    trialId,
                    "MATERIAL_CORRECTION",
                    user?.username || "system",
                    "MATERIAL_CORRECTION"
                ).catch(err => console.error("Draft file upload error:", err));
            }

            setSubmitted(true);
            await Swal.fire({
                icon: 'success',
                title: 'Saved as Draft',
                text: 'Progress saved and moved to next department.'
            });
            navigate('/dashboard');
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || "Failed to save draft."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={appTheme}>

            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: COLORS.background }}>
                <Header
                    setShowProfile={setShowProfile}
                    departmentInfo={departmentInfo}
                    photoRefreshKey={headerRefreshKey}
                    showBackButton={true}
                />
                <Box sx={{ flexGrow: 1, overflow: 'auto', py: { xs: 2, md: 4 } }}>
                    <Container maxWidth="xl">
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
                                <BasicInfo trialId={trialId} />

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
                                                            <TableCell><SpecInput value={chemState.c} onChange={(e: any) => setChemState({ ...chemState, c: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell><SpecInput value={chemState.si} onChange={(e: any) => setChemState({ ...chemState, si: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell><SpecInput value={chemState.mn} onChange={(e: any) => setChemState({ ...chemState, mn: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell><SpecInput value={chemState.p} onChange={(e: any) => setChemState({ ...chemState, p: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell><SpecInput value={chemState.s} onChange={(e: any) => setChemState({ ...chemState, s: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell><SpecInput value={chemState.mg} onChange={(e: any) => setChemState({ ...chemState, mg: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell><SpecInput value={chemState.cu} onChange={(e: any) => setChemState({ ...chemState, cu: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell sx={{ borderRight: `2px solid ${COLORS.border} !important` }}>
                                                                <SpecInput value={chemState.cr} onChange={(e: any) => setChemState({ ...chemState, cr: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} />
                                                            </TableCell>
                                                            <TableCell><SpecInput value={processState.pouringTemp} onChange={(e: any) => setProcessState({ ...processState, pouringTemp: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell><SpecInput value={processState.inoculantPerSec} onChange={(e: any) => setProcessState({ ...processState, inoculantPerSec: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                            <TableCell><SpecInput value={processState.inoculantType} onChange={(e: any) => setProcessState({ ...processState, inoculantType: e.target.value })} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} /></TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                            {isMobile && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>â† Swipe to view more â†’</Typography>}
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
                                                showAlert={showAlert}
                                                disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                                            />
                                            <DocumentViewer trialId={trialId || ""} category="MATERIAL_CORRECTION" />
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
                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                                            />
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12 }} sx={{ mt: 2, mb: 4 }}>
                                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2}>
                                            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                                                {user?.department_id !== 8 && (
                                                    <ActionButtons
                                                        {...(user?.role !== 'HOD' && user?.role !== 'Admin' ? { onReset: () => window.location.reload() } : {})}
                                                        onSave={handleSaveAndContinue}
                                                        showSubmit={false}
                                                        saveLabel={user?.role === 'HOD' || user?.role === 'Admin' ? 'Approve' : 'Save & Continue'}
                                                        saveIcon={user?.role === 'HOD' || user?.role === 'Admin' ? <CheckCircleIcon /> : <SaveIcon />}
                                                    >
                                                        {(user?.role !== 'HOD' && user?.role !== 'Admin') && (
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={<SaveIcon />}
                                                                onClick={handleSaveDraft}
                                                                disabled={loading}
                                                                sx={{ mr: 2 }}
                                                            >
                                                                Save as Draft
                                                            </Button>
                                                        )}
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
                                                )}
                                            </Box>
                                        </Box>
                                    </Grid>

                                </Grid>
                                <PreviewModal
                                    open={previewOpen}
                                    onClose={() => setPreviewOpen(false)}
                                    onSubmit={handleFinalSave}
                                    title="Verify Material Correction Details"
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
                                        </Box>
                                    )}
                                </PreviewModal>

                            </>
                        )}

                    </Container>
                </Box>
            </Box>

            {/* Profile Modal */}
            {showProfile && (
                <ProfileModal
                    onClose={() => setShowProfile(false)}
                    onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
                />
            )}
        </ThemeProvider>
    );
}
