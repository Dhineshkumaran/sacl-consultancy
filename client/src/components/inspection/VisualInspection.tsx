import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
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
    GlobalStyles
} from "@mui/material";
import Swal from 'sweetalert2';

import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FactoryIcon from '@mui/icons-material/Factory';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaclHeader from "../common/SaclHeader";
import { apiService } from '../../services/commonService';

import { inspectionService } from '../../services/inspectionService';
import { documentService } from '../../services/documentService';
import { uploadFiles } from '../../services/fileUploadHelper';
import departmentProgressService from "../../services/departmentProgressService";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from "react-router-dom";
import { COLORS, appTheme } from '../../theme/appTheme';
import { useAlert } from '../../hooks/useAlert';
import { AlertMessage } from '../common/AlertMessage';
import { fileToMeta, generateUid, validateFileSizes, formatDateTime } from '../../utils';
import type { InspectionRow, GroupMetadata } from '../../types/inspection';
import DepartmentHeader from "../common/DepartmentHeader";
import { LoadingState, EmptyState, ActionButtons, FileUploadSection, PreviewModal, DocumentViewer } from '../common';
import BasicInfo from "../dashboard/BasicInfo";

type Row = InspectionRow;
type GroupMeta = { ok: boolean | null; remarks: string; attachment: File | null };

const buildRows = (labels: string[], initialCols: string[]): Row[] =>
    labels.map((lab, i) => ({
        id: `${lab}-${i}-${generateUid()}`,
        label: lab,
        values: initialCols.map(() => ""),
    }));

const viewAttachment = (file: any) => {
    if (!file) return;
    if (file instanceof File) {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    } else if (file.file_base64) {
        try {
            const byteCharacters = atob(file.file_base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const ext = (file.name || file.file_name || "").split('.').pop()?.toLowerCase();
            let mime = 'application/pdf';
            if (['jpg', 'jpeg', 'png'].includes(ext)) mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

            const blob = new Blob([byteArray], { type: mime });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (e) {
            console.error("Error viewing file", e);
            alert("Could not view file.");
        }
    }
};

export default function VisualInspection({
    initialRows = ["Cavity Number", "Inspected Quantity", "Accepted Quantity", "Rejected Quantity", "Rejection Percentage (%)", "Reason for rejection:"],
    initialCols = [""],
    onSave = async (payload: any) => {
        return new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000));
    },
}: {
    initialRows?: string[];
    initialCols?: string[];
    onSave?: (payload: any) => Promise<any> | any;
}) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cols, setCols] = useState<string[]>([...initialCols]);
    const [rows, setRows] = useState<Row[]>(() => buildRows(initialRows, initialCols));
    const [groupMeta, setGroupMeta] = useState<GroupMeta>({
        ok: null,
        remarks: "",
        attachment: null,
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const { alert, showAlert } = useAlert();
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [additionalRemarks, setAdditionalRemarks] = useState<string>("");
    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [userIP, setUserIP] = useState<string>("Loading...");
    const [isEditing, setIsEditing] = useState(false);


    const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";
    const [isAssigned, setIsAssigned] = useState<boolean | null>(null);

    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

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

    useEffect(() => {
        const fetchData = async () => {
            if ((user?.role === 'HOD' || user?.role === 'Admin') && trialId) {
                try {
                    const response = await inspectionService.getVisualInspection(trialId);

                    let docsMap: Record<string, any> = {};
                    try {
                        const docRes = await documentService.getDocument(trialId);
                        if (docRes && docRes.success && Array.isArray(docRes.data)) {
                            docRes.data.forEach((d: any) => {
                                if (d.document_type === 'VISUAL_INSPECTION') docsMap[d.file_name] = d;
                            });
                        }
                    } catch (e) { console.error(e); }

                    if (response.success && response.data && response.data.length > 0) {
                        const data = response.data[0];
                        if (data.inspection_date) setDate(new Date(data.inspection_date).toISOString().slice(0, 10));

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
                            const loadedCols = inspections.map((item: any) => item['Cavity Number'] || '');

                            setCols(loadedCols);
                            setRows(prevRows => prevRows.map(row => {
                                const fieldName = "Reason for rejection";
                                return {
                                    ...row,
                                    values: inspections.map((item: any) => String(item[fieldName] || ''))
                                };
                            }));
                        }

                        const linkedAttachment = data.attachment_name ? docsMap[data.attachment_name] : null;

                        setGroupMeta({
                            ok: data.visual_ok === null || data.visual_ok === undefined ? null : (data.visual_ok === true || data.visual_ok === 1 || String(data.visual_ok) === "1" || String(data.visual_ok) === "true"),
                            remarks: data.remarks || "",
                            attachment: linkedAttachment || null
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch visual inspection:", error);
                    showAlert('error', 'Failed to load existing data.');
                }
            }
        };
        if (trialId) fetchData();
    }, [user, trialId]);

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


    useEffect(() => {
        const fetchIP = async () => {
            const ip = await apiService.getIP();
            setUserIP(ip);
        };
        fetchIP();
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


    const handleAttachFiles = (newFiles: File[]) => {
        setAttachedFiles(prev => [...prev, ...newFiles]);
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
        setRows(prev => {
            let updated = prev.map(r => {
                if (r.id !== rowId) return r;
                const newValues = r.values.map((v, i) => (i === colIndex ? value : v));
                return { ...r, values: newValues };
            });

            const inspectedRow = updated.find(r => r.label === "Inspected Quantity");
            const acceptedRow = updated.find(r => r.label === "Accepted Quantity");
            const rejectedRow = updated.find(r => r.label === "Rejected Quantity");
            const percentageRow = updated.find(r => r.label === "Rejection Percentage (%)");

            if (inspectedRow && acceptedRow && rejectedRow) {
                const inspectedNum = parseFloat(String(inspectedRow.values[colIndex] || '').trim());
                const acceptedNum = parseFloat(String(acceptedRow.values[colIndex] || '').trim());

                if (!isNaN(inspectedNum) && !isNaN(acceptedNum)) {
                    const newRejectedValues = [...rejectedRow.values];
                    if (acceptedNum > inspectedNum) {
                        newRejectedValues[colIndex] = 'Invalid';
                        showAlert('error', `Column ${colIndex + 1}: Accepted quantity (${acceptedNum}) cannot be greater than Inspected quantity (${inspectedNum})`);
                    } else {
                        const calculatedRejected = inspectedNum - acceptedNum;
                        newRejectedValues[colIndex] = calculatedRejected >= 0 ? calculatedRejected.toString() : '';
                    }
                    updated = updated.map(r => r.id === rejectedRow.id ? { ...r, values: newRejectedValues } : r);
                }
            }

            if (inspectedRow && rejectedRow && percentageRow) {
                const newPercentageValues = [...percentageRow.values];
                const inspectedNum = parseFloat(String(inspectedRow.values[colIndex] || '').trim());
                const rejectedNum = parseFloat(String(rejectedRow.values[colIndex] || '').trim());

                if (!isNaN(inspectedNum) && inspectedNum > 0 && !isNaN(rejectedNum)) {
                    if (rejectedNum > inspectedNum) {
                        newPercentageValues[colIndex] = 'Invalid';
                    } else {
                        const percentage = (rejectedNum / inspectedNum) * 100;
                        newPercentageValues[colIndex] = percentage.toFixed(2);
                    }
                } else {
                    newPercentageValues[colIndex] = '';
                }
                updated = updated.map(r => r.id === percentageRow.id ? { ...r, values: newPercentageValues } : r);
            }

            return updated.map(r => {
                if (r.label === "Cavity Number") return r;
                const total = r.values.reduce((sum, val) => {
                    const n = parseFloat(String(val).trim());
                    return sum + (isNaN(n) ? 0 : n);
                }, 0);
                return { ...r, total };
            });
        });
    };


    const updateColLabel = (index: number, label: string) => {
        setCols((prev) => prev.map((c, i) => (i === index ? label : c)));
    };

    const reset = () => {
        setCols([...initialCols]);
        setRows(buildRows(initialRows, initialCols));
        setGroupMeta({ ok: null, remarks: "", attachment: null });
        setAttachedFiles([]);
        setAdditionalRemarks("");
        setMessage(null);

        setPreviewMode(false);
        setPreviewPayload(null);
        setSubmitted(false);
    };

    const buildPayload = () => {
        return {
            created_at: formatDateTime(new Date().toISOString()),
            cols: cols.slice(),
            rows: rows.map(r => {
                if (r.label === "Rejection Percentage (%)") {
                    const inspectedRow = rows.find(row => row.label === "Inspected Quantity");
                    const rejectedRow = rows.find(row => row.label === "Rejected Quantity");
                    const calculatedValues = r.values.map((_, i) => {
                        const ins = parseFloat(inspectedRow?.values[i] || "0");
                        const rej = parseFloat(rejectedRow?.values[i] || "0");
                        if (isNaN(ins) || isNaN(rej) || ins === 0) return "0.00";
                        return ((rej / ins) * 100).toFixed(2);
                    });
                    return { ...r, values: calculatedValues, total: null };
                }
                return {
                    label: r.label,
                    values: r.values,

                    total: r.label === "Cavity Number" ? null : r.values.reduce((acc, v) => {
                        const n = parseFloat(String(v).trim());
                        return acc + (isNaN(n) ? 0 : n);
                    }, 0)
                };
            }),

            group: {
                ok: groupMeta.ok,
                remarks: groupMeta.remarks || null,
                attachment: fileToMeta(groupMeta.attachment),
            },
            attachedFiles: attachedFiles.map(f => f.name),
            additionalRemarks: additionalRemarks,
        };
    };

    const handleSaveAndContinue = () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = buildPayload();
            setPreviewPayload(payload);
            setPreviewMode(true);
            setSubmitted(false);
        } catch (err: any) {
            showAlert('error', 'Failed to prepare preview. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleFinalSave = async () => {
        if (!previewPayload) return;
        setSaving(true);
        setMessage(null);

        if ((user?.role === 'HOD' || user?.role === 'Admin') && trialId) {
            try {
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
                        if (isNaN(ins) || isNaN(rej) || ins === 0) return "0.00";
                        return ((rej / ins) * 100).toFixed(2);
                    })();

                    return {
                        'Cavity Number': cavityRow?.values?.[idx] ?? col ?? null,
                        'Inspected Quantity': inspected ?? null,
                        'Accepted Quantity': accepted ?? null,
                        'Rejected Quantity': rejected ?? null,
                        'Rejection Percentage': rejectionPercentage ?? null,
                        'Reason for rejection': reasonRow?.values?.[idx] ?? null,
                    };
                });

                const updatePayload = {
                    trial_id: trialId,
                    inspections,
                    visual_ok: groupMeta.ok,
                    remarks: groupMeta.remarks || null,
                    is_edit: isEditing
                };
                await inspectionService.updateVisualInspection(updatePayload);

                setSubmitted(true);
                setPreviewMode(false);
                await Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Visual Inspection updated successfully.'
                });
                navigate('/dashboard');
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update. Please try again.'
                });
            } finally {
                setSaving(false);
            }
            return;
        }

        try {
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
                    if (isNaN(ins) || isNaN(rej) || ins === 0) return "0.00";
                    return ((rej / ins) * 100).toFixed(2);
                })();

                return {
                    'Cavity Number': cavityRow?.values?.[idx] ?? col ?? null,
                    'Inspected Quantity': inspected ?? null,
                    'Accepted Quantity': accepted ?? null,
                    'Rejected Quantity': rejected ?? null,
                    'Rejection Percentage': rejectionPercentage ?? null,
                    'Reason for rejection': reasonRow?.values?.[idx] ?? null,
                };
            });

            const serverPayload = {
                trial_id: trialId,
                inspections,
                visual_ok: previewPayload.group?.ok ?? null,
                remarks: previewPayload.additionalRemarks || previewPayload.group?.remarks || null,
            };

            await inspectionService.submitVisualInspection(serverPayload);

            const allFiles = [...attachedFiles];
            if (groupMeta.attachment instanceof File) allFiles.push(groupMeta.attachment);

            if (allFiles.length > 0) {
                try {
                    const uploadResults = await uploadFiles(
                        allFiles,
                        trialId || "trial_id",
                        "VISUAL_INSPECTION",
                        user?.username || "system",
                        "VISUAL_INSPECTION"
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
            setPreviewMode(false);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Visual inspection created successfully.'
            });
            navigate('/dashboard');
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err?.message || 'Failed to save visual inspection. Please try again.'
            });
        } finally {
            setSaving(false);
        }
    };


    return (
        <ThemeProvider theme={appTheme}>

            <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
                <Container maxWidth="xl" disableGutters>

                    <SaclHeader />

                    <DepartmentHeader title="VISUAL INSPECTION" userIP={userIP} user={user} />
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
                                    <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>INSPECTION DETAILS</Typography>
                                </Box>
                                <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                </Grid>



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
                                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                            />
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => removeColumn(ci)}
                                                                sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }}
                                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                                                        const inspectedRow = rows.find(r => r.label === "Inspected Quantity");
                                                        const isRejectionPercentage = r.label === "Rejection Percentage (%)";
                                                        const isRejectedQty = r.label === "Rejected Quantity";
                                                        const isAcceptedQty = r.label === "Accepted Quantity";

                                                        const inspectedValue = inspectedRow ? (inspectedRow.values[ci] ?? "") : "";
                                                        const inspectedNum = parseFloat(String(inspectedValue).trim());
                                                        const acceptedNum = isAcceptedQty ? parseFloat(String(r.values[ci] ?? '').trim()) : NaN;
                                                        const isInvalid = !isNaN(inspectedNum) && !isNaN(acceptedNum) && acceptedNum > inspectedNum;
                                                        const rejectedValue = isRejectedQty ? (r.values[ci] ?? "") : "";
                                                        const isRejectedInvalid = rejectedValue === 'Invalid';

                                                        const displayValue = isRejectionPercentage ? calculateRejectionPercentage(ci) : (r.values[ci] ?? "");
                                                        const isFieldDisabled = ((user?.role === 'HOD' || user?.role === 'Admin') && !isEditing) ||
                                                            (isAcceptedQty && !inspectedValue) ||
                                                            isRejectedQty ||
                                                            isRejectionPercentage;

                                                        return (
                                                            <TableCell key={ci}>
                                                                <TextField
                                                                    size="small"
                                                                    fullWidth
                                                                    value={displayValue}
                                                                    onChange={(e) => updateCell(r.id, ci, e.target.value)}
                                                                    variant="outlined"
                                                                    InputProps={{
                                                                        readOnly: isFieldDisabled,
                                                                    }}
                                                                    sx={{
                                                                        "& .MuiInputBase-input": {
                                                                            textAlign: 'center',
                                                                            fontFamily: 'Roboto Mono',
                                                                            fontSize: '0.85rem',
                                                                            bgcolor: isRejectionPercentage ? '#fffbeb' :
                                                                                isRejectedQty ? '#f3f4f6' :
                                                                                    (isInvalid || isRejectedInvalid) ? '#fee2e2' :
                                                                                        'transparent',
                                                                            fontWeight: isRejectionPercentage ? 700 : 400,
                                                                        },
                                                                        "& .MuiInputBase-root": {
                                                                            bgcolor: isRejectionPercentage ? '#fffbeb' :
                                                                                isRejectedQty ? '#f3f4f6' :
                                                                                    'white'
                                                                        }
                                                                    }}
                                                                    error={isInvalid || isRejectedInvalid}
                                                                />
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                                                        {(() => {
                                                            if (r.label === "Cavity Number") return "-";

                                                            if (r.label === "Rejection Percentage (%)") {
                                                                const inspectedRow = rows.find(row => row.label === "Inspected Quantity");
                                                                const rejectedRow = rows.find(row => row.label === "Rejected Quantity");

                                                                if (!inspectedRow || !rejectedRow) return "-";

                                                                const totalInspected = inspectedRow.values.reduce((acc, v) => {
                                                                    const n = parseFloat(String(v).trim());
                                                                    return acc + (isNaN(n) ? 0 : n);
                                                                }, 0);

                                                                const totalRejected = rejectedRow.values.reduce((acc, v) => {
                                                                    const n = parseFloat(String(v).trim());
                                                                    return acc + (isNaN(n) ? 0 : n);
                                                                }, 0);

                                                                if (totalInspected > 0 && !isNaN(totalRejected)) {
                                                                    const percent = (totalRejected / totalInspected) * 100;
                                                                    return `${percent.toFixed(2)}%`;
                                                                }
                                                                return "-";
                                                            }

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
                                                                    <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} />
                                                                    <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} />
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
                                                                        disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                                    />

                                                                    <Box display="flex" alignItems="center" gap={1} mt="auto">
                                                                        <input
                                                                            accept="image/*,application/pdf"
                                                                            id="visual-group-file"
                                                                            style={{ display: "none" }}
                                                                            type="file"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0] ?? null;
                                                                                if (file) {
                                                                                    const validation = validateFileSizes([file]);
                                                                                    if (!validation.isValid) {
                                                                                        validation.errors.forEach((error: string) => showAlert('error', error));
                                                                                        e.target.value = '';
                                                                                        return;
                                                                                    }
                                                                                }
                                                                                setGroupMeta((g) => ({ ...g, attachment: file }));
                                                                            }}
                                                                            disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                                        />
                                                                        <label htmlFor="visual-group-file">
                                                                            <Button
                                                                                size="small"
                                                                                variant="outlined"
                                                                                component="span"
                                                                                startIcon={<UploadFileIcon />}
                                                                                sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                                                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                                            >
                                                                                Attach PDF
                                                                            </Button>
                                                                        </label>

                                                                        {groupMeta.attachment ? (
                                                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                                                <Chip
                                                                                    icon={<InsertDriveFileIcon />}
                                                                                    label={groupMeta.attachment.name}
                                                                                    onDelete={() => setGroupMeta((g) => ({ ...g, attachment: null }))}
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                    sx={{ maxWidth: 140 }}
                                                                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                                                                />
                                                                                <IconButton size="small" onClick={() => viewAttachment(groupMeta.attachment)}>
                                                                                    <VisibilityIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Box>
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
                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                >
                                    Add Column
                                </Button>

                                <Box sx={{ p: 3, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}` }}>
                                    {(user?.role !== 'HOD' && user?.role !== 'Admin' || isEditing) && (
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
                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                            />
                                        </>
                                    )}
                                    <DocumentViewer trialId={trialId} category="VISUAL_INSPECTION" />
                                </Box>


                                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
                                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <ActionButtons
                                            {...(user?.role !== 'HOD' && user?.role !== 'Admin' ? { onReset: reset } : {})}
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

                            </Paper>

                            <PreviewModal
                                open={previewMode}
                                onClose={() => setPreviewMode(false)}
                                onSubmit={handleFinalSave}
                                title="VISUAL INSPECTION DETAILS"
                                submitted={submitted}
                                isSubmitting={saving}
                            >
                                <Box sx={{ p: 4 }}>
                                    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Visual Inspection Report</Typography>
                                            <Typography variant="body2" color="textSecondary">Created: {previewPayload?.created_at}</Typography>
                                        </Box>
                                        <Divider sx={{ mb: 3 }} />

                                        <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                                                        {previewPayload?.cols.map((c: string, i: number) => (
                                                            <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>{c}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {previewPayload?.rows.map((r: any, idx: number) => (
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
                                            <Typography variant="subtitle2" mb={1} color="textSecondary">FINAL STATUS & REMARKS</Typography>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="body2">Status:</Typography>
                                                        {previewPayload?.group.ok === true ?
                                                            <Chip label="OK" color="success" size="small" /> :
                                                            previewPayload?.group.ok === false ?
                                                                <Chip label="NOT OK" color="error" size="small" /> :
                                                                <Chip label="-" size="small" />
                                                        }
                                                    </Box>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 8 }}>
                                                    <Typography variant="body2">
                                                        <strong>Remarks:</strong> {previewPayload?.group.remarks || "No remarks"}
                                                    </Typography>
                                                    {previewPayload?.group.attachment && (
                                                        <Typography variant="caption" display="block" mt={0.5} color="primary">
                                                            Attachment: {previewPayload.group.attachment.name}
                                                        </Typography>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Attached PDF Files Preview */}
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

                                        {/* Additional Remarks Preview */}
                                        {previewPayload?.additionalRemarks && (
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
                            </PreviewModal>

                        </>
                    )}
                </Container>
            </Box>
        </ThemeProvider>
    );
}
