import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";

import { useAuth } from "../../context/AuthContext";
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
    GlobalStyles
} from "@mui/material";
import Swal from 'sweetalert2';

import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ScienceIcon from '@mui/icons-material/Science';
import { apiService } from '../../services/commonService';
import { inspectionService } from '../../services/inspectionService';
import { uploadFiles } from '../../services/fileUploadHelper';
import departmentProgressService from "../../services/departmentProgressService";
import { COLORS, appTheme } from '../../theme/appTheme';
import { useAlert } from '../../hooks/useAlert';
import { AlertMessage } from '../common/AlertMessage';
import Header from "../dashboard/Header";
import ProfileModal from "../dashboard/ProfileModal";
import { getDepartmentInfo } from "../../utils/dashboardUtils";
import { fileToMeta, generateUid, validateFileSizes, formatDate } from '../../utils';
import type { InspectionRow, GroupMetadata } from '../../types/inspection';
import { LoadingState, EmptyState, ActionButtons, FileUploadSection, PreviewModal, DocumentViewer } from '../common';
import BasicInfo from "../dashboard/BasicInfo";


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
    const [remarks, setRemarks] = useState<string>("");
    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [previewSubmitted, setPreviewSubmitted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isYieldInvalid, setIsYieldInvalid] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [dataExists, setDataExists] = useState(false);


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
        const fetchData = async () => {
            if (trialId) {
                try {
                    const response = await inspectionService.getDimensionalInspection(trialId);
                    if (response.success && response.data && response.data.length > 0) {
                        const data = response.data[0];
                        setDate(data.inspection_date ? new Date(data.inspection_date).toISOString().slice(0, 10) : "");
                        setWeightTarget(String(data.casting_weight || ""));
                        setBunchWeight(String(data.bunch_weight || ""));
                        setNumberOfCavity(String(data.no_of_cavities || ""));
                        setGroupMeta({ remarks: data.remarks || "", attachment: null });
                        setRemarks(data.remarks || "");

                        let inspections = data.inspections;
                        if (typeof inspections === 'string') {
                            try {
                                inspections = JSON.parse(inspections);
                            } catch (parseError) {
                                console.error("Failed to parse inspections JSON:", parseError);
                                inspections = [];
                            }
                        }

                        if (inspections && Array.isArray(inspections)) {
                            setCavities(inspections.map((_: any, i: number) => `Cavity ${i + 1}`));
                            setCavRows(prev => prev.map(row => {
                                if (row.label === "Cavity Number") {
                                    return { ...row, values: inspections.map((p: any) => String(p["Cavity Number"] || "")) };
                                }
                                if (row.label === "Casting Weight") {
                                    return { ...row, values: inspections.map((p: any) => String(p["Casting Weight"] || "")) };
                                }
                                return row;
                            }));
                        }
                        setDataExists(true);
                    }
                } catch (error) {
                    showAlert('error', 'Failed to load existing data.');
                }
            }
        };
        if (trialId) fetchData();
    }, [user, trialId]); // eslint-disable-line react-hooks/exhaustive-deps



    useEffect(() => {
        const fetchUserIP = async () => {
            const ip = await apiService.getIP();
            setUserIP(ip);
        };
        fetchUserIP();
    }, []);

    useEffect(() => {
        const castingWeight = parseFloat(weightTarget);
        const numCavity = parseFloat(numberOfCavity);
        const bunch = parseFloat(bunchWeight);

        if (!isNaN(castingWeight) && !isNaN(numCavity) && !isNaN(bunch) && bunch > 0) {
            const totalCastingWeight = castingWeight * numCavity;
            if (totalCastingWeight > bunch) {
                setIsYieldInvalid(true);
                showAlert('warning', 'Yield exceeds 100%! Total casting weight (casting weight Ã— no. of cavities) cannot exceed bunch weight. Please adjust the values.');
            } else {
                setIsYieldInvalid(false);
            }
        } else {
            setIsYieldInvalid(false);
        }
    }, [weightTarget, numberOfCavity, bunchWeight, showAlert]);



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

        const totalCastingWeight = castingWeight * numCavity;
        const yieldValue = (totalCastingWeight / bunch) * 100;
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
        setRemarks("");
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
            remarks: remarks,
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

        if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
            try {
                const cavityRow = previewPayload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('cavity'));
                const castingRow = previewPayload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('casting'));

                const inspections = (previewPayload.cavities || []).map((_: any, i: number) => ({
                    "Cavity Number": (cavityRow?.values?.[i] ?? previewPayload.cavities[i] ?? null),
                    "Casting Weight": (castingRow?.values?.[i] ?? null)
                }));

                const updatePayload = {
                    trial_id: trialId,
                    inspection_date: previewPayload.inspection_date || previewPayload.created_at || null,
                    casting_weight: parseFloat(previewPayload.weight_target || "0") || 0,
                    bunch_weight: parseFloat(previewPayload.bunch_weight || "0") || 0,
                    no_of_cavities: parseInt(previewPayload.number_of_cavity || "0") || (previewPayload.cavities ? previewPayload.cavities.length : 0),
                    yields: previewPayload.yield ? parseFloat(previewPayload.yield) : null,
                    inspections: JSON.stringify(inspections),
                    remarks: previewPayload.remarks || "",
                    is_edit: isEditing || dataExists
                };

                await inspectionService.updateDimensionalInspection(updatePayload);

                setPreviewSubmitted(true);
                setPreviewMode(false);
                await Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Dimensional Inspection updated successfully.'
                });
                navigate('/dashboard');
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.message || 'Failed to update Dimensional Inspection. Please try again.'
                });
            } finally {
                setSaving(false);
            }
            return;
        }

        try {
            const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";

            const cavityRow = previewPayload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('cavity'));
            const castingRow = previewPayload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('casting'));

            const inspections = (previewPayload.cavities || []).map((_: any, i: number) => ({
                "Cavity Number": (cavityRow?.values?.[i] ?? previewPayload.cavities[i] ?? null),
                "Casting Weight": (castingRow?.values?.[i] ?? null)
            }));

            const apiPayload = {
                trial_id: trialId,
                inspection_date: previewPayload.inspection_date || previewPayload.created_at || null,
                casting_weight: parseFloat(previewPayload.weight_target || "0") || 0,
                bunch_weight: parseFloat(previewPayload.bunch_weight || "0") || 0,
                no_of_cavities: parseInt(previewPayload.number_of_cavity || "0") || (previewPayload.cavities ? previewPayload.cavities.length : 0),
                yields: previewPayload.yield ? parseFloat(previewPayload.yield) : null,
                inspections: JSON.stringify(inspections),
                remarks: previewPayload.remarks || ""
            };

            await inspectionService.submitDimensionalInspection(apiPayload);

            if (attachedFiles.length > 0) {
                try {
                    const uploadResults = await uploadFiles(
                        attachedFiles,
                        trialId,
                        "DIMENSIONAL_INSPECTION",
                        user?.username || "system",
                        "DIMENSIONAL_INSPECTION"
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
                    console.error("File upload error:", uploadError);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'File upload error. Please try again.'
                    });
                }
            }

            setPreviewSubmitted(true);
            setPreviewMode(false);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Dimensional inspection created successfully.'
            });
            navigate('/dashboard');
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'Failed to save dimensional inspection. Please try again.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const payload = buildPayload();
            const cavityRow = payload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('cavity'));
            const castingRow = payload.cavity_rows.find((r: any) => String(r.label).toLowerCase().includes('casting'));

            const inspections = (payload.cavities || []).map((_: any, i: number) => ({
                "Cavity Number": (cavityRow?.values?.[i] ?? payload.cavities[i] ?? null),
                "Casting Weight": (castingRow?.values?.[i] ?? null)
            }));

            const apiPayload = {
                trial_id: trialId,
                inspection_date: payload.inspection_date || payload.created_at || null,
                casting_weight: parseFloat(payload.weight_target || "0") || 0,
                bunch_weight: parseFloat(payload.bunch_weight || "0") || 0,
                no_of_cavities: parseInt(payload.number_of_cavity || "0") || (payload.cavities ? payload.cavities.length : 0),
                yields: payload.yield ? parseFloat(payload.yield) : null,
                inspections: JSON.stringify(inspections),
                remarks: payload.remarks || "",
                is_edit: isEditing,
                is_draft: true
            };

            if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
                await inspectionService.updateDimensionalInspection(apiPayload);
            } else {
                await inspectionService.submitDimensionalInspection(apiPayload);
            }

            if (attachedFiles.length > 0) {
                try {
                    await uploadFiles(
                        attachedFiles,
                        trialId,
                        "DIMENSIONAL_INSPECTION",
                        user?.username || "system",
                        "DIMENSIONAL_INSPECTION"
                    );
                } catch (uploadError) {
                    console.error("Draft file upload error", uploadError);
                }
            }

            setPreviewSubmitted(true);
            await Swal.fire({
                icon: 'success',
                title: 'Saved as Draft',
                text: 'Progress saved and next stage unlocked (if eligible).'
            });
            navigate('/dashboard');

        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to save draft.'
            });
        } finally {
            setSaving(false);
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
                                <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
                                        <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>DIMENSIONAL DETAILS</Typography>
                                    </Box>
                                    <Divider sx={{ mb: 3, borderColor: COLORS.border }} />

                                    <Grid container spacing={3} sx={{ mb: 3 }}>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Inspection Date</Typography>
                                            <TextField
                                                type="date"
                                                size="small"
                                                fullWidth
                                                value={date}
                                                onChange={(e) => {
                                                    setDate(e.target.value);
                                                }}
                                                sx={{ bgcolor: 'white' }}
                                                disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Casting Weight (Kg)</Typography>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="e.g. 12.5"
                                                value={weightTarget}
                                                onChange={(e) => {
                                                    setWeightTarget(e.target.value);
                                                }}
                                                sx={{ bgcolor: 'white' }}
                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 2 }}>
                                            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Bunch Weight (Kg)</Typography>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Total Bunch Wt"
                                                value={bunchWeight}
                                                onChange={(e) => {
                                                    setBunchWeight(e.target.value);
                                                }}
                                                sx={{ bgcolor: 'white' }}
                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                                onChange={(e) => {
                                                    setNumberOfCavity(e.target.value);
                                                }}
                                                sx={{ bgcolor: 'white' }}
                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 2 }}>
                                            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Yield (%)</Typography>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={calculateYield()}
                                                InputProps={{ readOnly: true }}
                                                error={isYieldInvalid}
                                                sx={{
                                                    bgcolor: isYieldInvalid ? '#ffebee' : 'white',
                                                    '& .MuiInputBase-input': { fontWeight: 700 },
                                                    '& .MuiOutlinedInput-root': {
                                                        borderColor: isYieldInvalid ? '#d32f2f' : undefined
                                                    }
                                                }}
                                            />
                                            {isYieldInvalid && (
                                                <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.5, display: 'block' }}>
                                                    âš  Yield exceeds 100%. Please adjust values.
                                                </Typography>
                                            )}
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
                                                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                                />
                                                                <IconButton size="small" onClick={() => removeCavity(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}>
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
                                                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                        disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                    >
                                        Add Column
                                    </Button>

                                    <Box sx={{ p: 3, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}`, mt: 3 }}>
                                        {(user?.role !== 'HOD' && user?.role !== 'Admin') && (
                                            <>
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
                                            </>
                                        )}
                                        <DocumentViewer trialId={trialId || ""} category="DIMENSIONAL_INSPECTION" />
                                    </Box>
                                </Paper>

                                <Paper sx={{ p: 3, mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${COLORS.primary}`, width: '100%' }}>
                                        <EditIcon sx={{ color: COLORS.primary }} />
                                        <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
                                            Remarks
                                        </Typography>
                                    </Box>
                                    <TextField
                                        multiline
                                        rows={3}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Enter remarks..."
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        sx={{ bgcolor: '#fff' }}
                                        disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                    />
                                </Paper>


                                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
                                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <ActionButtons
                                            {...(user?.role !== 'HOD' && user?.role !== 'Admin' ? { onReset: resetAll } : {})}
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
                                                    disabled={saving}
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
                                    </Box>
                                </Box>
                            </>
                        )}

                        <PreviewModal
                            open={previewMode && previewPayload}
                            onClose={() => setPreviewMode(false)}
                            onSubmit={handleFinalSave}
                            title="Verify Dimensional Inspection Details"
                            submitted={previewSubmitted}
                            isSubmitting={saving}
                        >
                            <Box sx={{ p: 4 }}>
                                <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Dimensional Inspection Report</Typography>
                                        <Typography variant="body2" color="textSecondary">Date: {formatDate(previewPayload?.inspection_date)}</Typography>
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

                                    {previewPayload?.remarks && (
                                        <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                                            <Typography variant="subtitle2" mb={1} color="textSecondary">REMARKS</Typography>
                                            <Typography variant="body2">{previewPayload.remarks}</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {previewSubmitted && (
                                    <Alert severity="success" sx={{ mt: 2 }}>Inspection data submitted successfully.</Alert>
                                )}
                            </Box>
                        </PreviewModal>

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
};
