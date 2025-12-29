import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import NoPendingWorks from "./common/NoPendingWorks";
import { useAuth } from "../context/AuthContext";
import { updateDepartment, updateDepartmentRole } from "../services/departmentProgressService";
import { useNavigate } from "react-router-dom";
import {
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaclHeader from "./common/SaclHeader";
import NoAccess from "./common/NoAccess";
import { ipService } from '../services/ipService';
import { inspectionService } from '../services/inspectionService';
import { uploadFiles } from '../services/fileUploadHelper';
import { COLORS, appTheme } from '../theme/appTheme';
import { useAlert } from '../hooks/useAlert';
import { AlertMessage } from './common/AlertMessage';
import { fileToMeta, generateUid, validateFileSizes } from '../utils';
import type { InspectionRow, GroupMetadata } from '../types/inspection';
import DepartmentHeader from "./common/DepartmentHeader";
import { LoadingState, EmptyState, ActionButtons, FileUploadSection, PreviewModal, Common } from './common';

type CavRow = InspectionRow;
type GroupMeta = GroupMetadata;

export default function DimensionalInspection({
    initialCavities = [""],
    onSave = async (payload: any) => {

        return { ok: true };
    },
}: {
    initialCavities?: string[];
    onSave?: (payload: any) => Promise<any> | any;
}) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [weightTarget, setWeightTarget] = useState<string>("");
    const [cavities, setCavities] = useState<string[]>([...initialCavities]);
    const [cavRows, setCavRows] = useState<CavRow[]>(() => {
        const makeCavRows = (cavLabels: string[]) => [
            { id: `cavity-${generateUid()}`, label: "Cavity Number", values: cavLabels.map(() => "") } as CavRow,
            { id: `avg-${generateUid()}`, label: "Casting Weight", values: cavLabels.map(() => "") } as CavRow,
        ];
        return makeCavRows(initialCavities);
    });
    const [bunchWeight, setBunchWeight] = useState<string>("");
    const [numberOfCavity, setNumberOfCavity] = useState<string>("");
    const [groupMeta, setGroupMeta] = useState<GroupMeta>({ remarks: "", attachment: null });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const { alert, showAlert } = useAlert();
    const [userIP, setUserIP] = useState<string>("Loading...");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [additionalRemarks, setAdditionalRemarks] = useState<string>("");
    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [previewSubmitted, setPreviewSubmitted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";



    useEffect(() => {
        const fetchData = async () => {
            if (user?.role === 'HOD' && trialId) {
                try {
                    const response = await inspectionService.getDimensionalInspection(trialId);
                    if (response.success && response.data && response.data.length > 0) {
                        const data = response.data[0];
                        setDate(data.inspection_date ? new Date(data.inspection_date).toISOString().slice(0, 10) : "");
                        setWeightTarget(String(data.casting_weight || ""));
                        setBunchWeight(String(data.bunch_weight || ""));
                        setNumberOfCavity(String(data.no_of_cavities || ""));
                        setGroupMeta({ remarks: data.remarks || "", attachment: null });
                        setAdditionalRemarks(data.remarks || "");
                        if (data.inspections) {
                            try {
                                if (Array.isArray(data.inspections)) {
                                    setCavities(data.inspections.map((_: any, i: number) => `Cavity ${i + 1}`));
                                    setCavRows(prev => prev.map(row => {
                                        if (row.label === "Cavity Number") {
                                            return { ...row, values: data.inspections.map((p: any) => String(p["Cavity Number"] || "")) };
                                        }
                                        if (row.label === "Casting Weight") {
                                            return { ...row, values: data.inspections.map((p: any) => String(p["Casting Weight"] || "")) };
                                        }
                                        return row;
                                    }));
                                }
                            } catch (e) {
                                console.error("Error parsing inspections data:", e);
                            }
                        }
                    }
                } catch (error) {
                    showAlert('error', 'Failed to load existing data.');
                }
            }
        };
        if (trialId) fetchData();
    }, [user, trialId]);



    useEffect(() => {
        const fetchUserIP = async () => {
            const ip = await ipService.getUserIP();
            setUserIP(ip);
        };
        fetchUserIP();
    }, []);



    const makeCavRows = (cavLabels: string[]) => [
        { id: `cavity-${generateUid()}`, label: "Cavity Number", values: cavLabels.map(() => "") } as CavRow,
        { id: `avg-${generateUid()}`, label: "Casting Weight", values: cavLabels.map(() => "") } as CavRow,
    ];

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

    const addCavity = () => {
        const next = "";
        setCavities((c) => [...c, next]);
        setCavRows((rows) => rows.map((r) => ({ ...r, values: [...r.values, ""] })));
    };

    const handleAttachFiles = (newFiles: File[]) => {
        setAttachedFiles(prev => [...prev, ...newFiles]);
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_: File, i: number) => i !== index));
    };

    const removeCavity = (index: number) => {
        if (cavities.length <= 1) return;
        setCavities((c) => c.filter((_: string, i: number) => i !== index));
        setCavRows((rows) => rows.map((r) => ({ ...r, values: r.values.filter((_: string, i: number) => i !== index) })));
    };

    const updateCavityLabel = (index: number, label: string) => {
        setCavities((prev) => prev.map((c, i) => (i === index ? label : c)));
    };

    const updateCavCell = (rowId: string, colIndex: number, value: string) => {
        setCavRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, values: r.values.map((v, i) => (i === colIndex ? value : v)) } : r)));
    };

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
        setMessage(null);
        setPreviewSubmitted(false);
    };

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

    const handleSaveAndContinue = async () => {
        const payload = buildPayload();
        setPreviewPayload(payload);
        setPreviewMode(true);
        setPreviewSubmitted(false);
        setMessage(null);
    };

    const handleFinalSave = async () => {
        if (!previewPayload) return;
        setSaving(true);

        if (user?.role === 'HOD' && trialId) {
            try {
                if (isEditing) {
                    const cavityRow = previewPayload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('cavity'));
                    const castingRow = previewPayload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('casting'));

                    const inspections = (previewPayload.cavities || []).map((_: any, i: number) => ({
                        "Cavity Number": (cavityRow?.values?.[i] ?? previewPayload.cavities[i] ?? null),
                        "Casting Weight": (castingRow?.values?.[i] ?? null)
                    }));

                    const updatePayload = {
                        trial_id: trialId,
                        inspection_date: previewPayload.inspection_date || previewPayload.created_at || null,
                        casting_weight: parseFloat(previewPayload.weight_target) || 0,
                        bunch_weight: parseFloat(previewPayload.bunch_weight) || 0,
                        no_of_cavities: parseInt(previewPayload.number_of_cavity) || (previewPayload.cavities ? previewPayload.cavities.length : 0),
                        yields: previewPayload.yield ? parseFloat(previewPayload.yield) : null,
                        inspections: JSON.stringify(inspections),
                        remarks: previewPayload.dimensional_remarks || ""
                    };

                    await inspectionService.updateDimensionalInspection(updatePayload);
                }

                const approvalPayload = {
                    trial_id: trialId,
                    next_department_id: 8,
                    username: user.username,
                    role: user.role || "HOD",
                    remarks: "Approved by HOD"
                };

                await updateDepartment(approvalPayload);
                setPreviewSubmitted(true);
                showAlert('success', 'Department progress approved successfully.');
                setTimeout(() => navigate('/dashboard'), 1500);
            } catch (err) {
                showAlert('error', 'Failed to approve. Please try again.');
            } finally {
                setSaving(false);
            }
            return;
        }

        try {
            const trialId = new URLSearchParams(window.location.search).get('trial_id') || 'trial_id';

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
                remarks: previewPayload.dimensional_remarks || ""
            };

            await inspectionService.submitDimensionalInspection(apiPayload);

            if (attachedFiles.length > 0) {
                try {
                    // const uploadResults = await uploadFiles(
                    //     attachedFiles,
                    //     trialId,
                    //     "DIMENSIONAL_INSPECTION",
                    //     user?.username || "system",
                    //     "DIMENSIONAL_INSPECTION"
                    // );
                } catch (uploadError) {
                    console.error("File upload error:", uploadError);
                    showAlert('warning', 'File upload failed, but inspection data was saved.');
                }
            }

            if (trialId) {
                try {
                    await updateDepartmentRole({
                        trial_id: trialId,
                        current_department_id: 10,
                        username: user?.username || "user",
                        role: "user",
                        remarks: "Completed by user"
                    });
                } catch (roleError) {
                    console.error("Failed to update role progress:", roleError);
                    showAlert('warning', 'Failed to update role progress, but inspection data was saved.');
                }
            }
            setPreviewSubmitted(true);
            showAlert('success', 'Dimensional inspection created and department progress updated successfully.');
            navigate('/dashboard');
        } catch (err: any) {
            showAlert('error', 'Failed to save dimensional inspection. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPDF = () => {
        window.print();
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

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => navigate('/dashboard')}
                            sx={{ minWidth: 180, fontWeight: 600 }}
                        >
                            Back to Dashboard
                        </Button>
                    </Box>

                    <SaclHeader />

                    <DepartmentHeader title="DIMENSIONAL INSPECTION" userIP={userIP} user={user} />

                    <Common trialId={trialId} />

                    <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>DIMENSIONAL DETAILS</Typography>
                        </Box>
                        <Divider sx={{ mb: 3, borderColor: COLORS.border }} />

                        <AlertMessage alert={alert} />

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
                                    disabled={user?.role === 'HOD'}
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
                                    disabled={user?.role === 'HOD' && !isEditing}
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
                                    disabled={user?.role === 'HOD' && !isEditing}
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
                                    disabled={user?.role === 'HOD' && !isEditing}
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
                                                        disabled={user?.role === 'HOD' && !isEditing}
                                                    />
                                                    <IconButton size="small" onClick={() => removeCavity(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={user?.role === 'HOD' && !isEditing}>
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
                                                        disabled={user?.role === 'HOD' && !isEditing}
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
                            disabled={user?.role === 'HOD' && !isEditing}
                        >
                            Add Column
                        </Button>

                        <Box sx={{ p: 3, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}`, mt: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: "uppercase" }}>
                                Attach PDF / Image Files
                            </Typography>
                            <FileUploadSection
                                files={attachedFiles}
                                onFilesChange={handleAttachFiles}
                                onFileRemove={removeAttachedFile}
                                showAlert={showAlert}
                                label="Attach PDF"
                            />
                        </Box>
                    </Paper>

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
                            disabled={user?.role === 'HOD' && !isEditing}
                        />
                    </Paper>


                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => navigate('/dashboard')}
                            sx={{ minWidth: 180, fontWeight: 600 }}
                        >
                            Back to Dashboard
                        </Button>
                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                            <ActionButtons
                                {...(user?.role !== 'HOD' ? { onReset: resetAll } : {})}
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

                    <PreviewModal
                        open={previewMode && previewPayload}
                        onClose={() => setPreviewMode(false)}
                        onSubmit={handleFinalSave}
                        onExport={handleExportPDF}
                        title="Verify Inspection Data"
                        submitted={previewSubmitted}
                        isSubmitting={saving}
                    >
                        <Box sx={{ p: 4 }}>
                            <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Dimensional Inspection Report</Typography>
                                    <Typography variant="body2" color="textSecondary">Date: {previewPayload?.inspection_date}</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="caption" color="textSecondary">TARGET WEIGHT</Typography>
                                        <Typography variant="body1" fontWeight="bold">{previewPayload?.weight_target || "-"} Kg</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="caption" color="textSecondary">BUNCH WEIGHT</Typography>
                                        <Typography variant="body1" fontWeight="bold">{previewPayload?.bunch_weight || "-"} Kg</Typography>
                                    </Grid>
                                </Grid>

                                <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                                                {previewPayload?.cavities.map((c: string, i: number) => (
                                                    <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>{c}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {previewPayload?.cavity_rows.map((r: any, idx: number) => (
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
                                    {previewPayload?.attachment && (
                                        <Typography variant="caption" display="block" mt={1} color="primary">
                                            Attachment: {previewPayload.attachment.name}
                                        </Typography>
                                    )}
                                </Box>

                                {previewPayload?.attachedFiles && previewPayload.attachedFiles.length > 0 && (
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

                                {previewPayload?.additionalRemarks && (
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
                    </PreviewModal>

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
};
