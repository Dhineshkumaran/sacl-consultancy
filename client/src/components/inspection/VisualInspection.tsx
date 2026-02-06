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
    Container,
    Grid,
    Chip,
    Divider
} from "@mui/material";
import Swal from 'sweetalert2';

import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiService } from '../../services/commonService';
import { inspectionService } from '../../services/inspectionService';
import { uploadFiles } from '../../services/fileUploadHelper';
import departmentProgressService from "../../services/departmentProgressService";
import Header from "../dashboard/Header";
import ProfileModal from "../dashboard/ProfileModal";
import { getDepartmentInfo } from "../../utils/dashboardUtils";
import { useNavigate } from "react-router-dom";
import { COLORS, appTheme } from '../../theme/appTheme';
import { useAlert } from '../../hooks/useAlert';
import { AlertMessage } from '../common/AlertMessage';

import { fileToMeta, generateUid, formatDateTime } from '../../utils';
import type { InspectionRow } from '../../types/inspection';
import { EmptyState, ActionButtons, FileUploadSection, PreviewModal, DocumentViewer } from '../common';
import { safeParse } from '../../utils/jsonUtils';
import BasicInfo from "../dashboard/BasicInfo";

type Row = InspectionRow;

const buildRows = (labels: string[], initialCols: string[]): Row[] =>
    labels.map((lab, i) => ({
        id: `${lab}-${i}-${generateUid()}`,
        label: lab,
        values: initialCols.map(() => ""),
    }));

interface NdtRow {
    id: string;
    label: string;
    ok: boolean | null;
    remarks: string;
    value?: string;
    total?: number | null;
}

interface MicroCol {
    id: string;
    label: string;
}

const initialNdtRows = (labels: string[]): NdtRow[] =>
    labels.map((label, i) => ({
        id: `${label}-${i}`,
        label,
        ok: null,
        remarks: "",
        total: null,
    }));

function SectionTable({
    title,
    rows,
    onChange,
    showTotal = false,
    showAlert,
    user,
    isEditing,
    onSectionChange,
}: {
    title: string;
    rows: NdtRow[];
    onChange: (id: string, patch: Partial<NdtRow>) => void;
    showTotal?: boolean;
    showAlert?: (severity: 'success' | 'error', message: string) => void;
    user: any;
    isEditing: boolean;
    onSectionChange?: (patch: Partial<NdtRow>) => void;
}) {
    const [cols, setCols] = useState<MicroCol[]>(() => {
        const maxLen = Math.max(...(rows?.map(r => (r?.value ? r.value.split('|').length : 1)) || []), 1);
        return Array.from({ length: maxLen }, (_, i) => ({ id: `c${i + 1}`, label: '' }));
    });

    const [values, setValues] = useState<Record<string, string[]>>(() => {
        const init: Record<string, string[]> = {};
        rows?.forEach((r) => {
            init[r.id] = r?.value ? r.value.split('|') : Array(cols?.length || 0).fill('');
        });
        return init;
    });

    const [okStatus, setOkStatus] = useState<boolean | null>(null);
    const [remarks, setRemarks] = useState<string>("");

    useEffect(() => {
        if (rows && rows.length > 0) {
            const firstRowStatus = rows.find(r => r.ok === true || r.ok === false);
            const firstRowRemarks = rows.find(r => r.remarks && r.remarks.length > 0);
            if (firstRowStatus) {
                setOkStatus(firstRowStatus.ok);
            }
            if (firstRowRemarks) {
                setRemarks(firstRowRemarks.remarks);
            }
        }
    }, [rows]);

    useEffect(() => {
        const maxLen = Math.max(...(rows?.map(r => (r?.value ? r.value.split('|').length : 1)) || []), 1);
        if (maxLen > (cols?.length || 0)) {
            setCols(Array.from({ length: maxLen }, (_, i) => ({ id: `c${i + 1}`, label: '' })));
        }
    }, [rows]);

    useEffect(() => {
        setValues((prev) => {
            const copy: Record<string, string[]> = {};
            rows?.forEach((r) => {
                const rowVals = r?.value ? r.value.split('|') : [];
                copy[r.id] = (rowVals.length > 0) ? rowVals : (prev[r.id] ?? Array(cols?.length || 0).fill(''));

                if (copy[r.id].length < (cols?.length || 0)) {
                    copy[r.id] = [...copy[r.id], ...Array((cols?.length || 0) - copy[r.id].length).fill('')];
                } else if (copy[r.id].length > (cols?.length || 0) && (cols?.length || 0) > 0) {
                    copy[r.id] = copy[r.id].slice(0, cols.length);
                }
            });
            return copy;
        });
    }, [rows, cols.length]);

    const addColumn = () => {
        setCols((prev) => [...prev, { id: `c${prev.length + 1}`, label: '' }]);
        setValues((prev) => {
            const copy: Record<string, string[]> = {};
            Object.keys(prev).forEach((k) => { copy[k] = [...prev[k], '']; });
            return copy;
        });
    };

    const removeColumn = (index: number) => {
        setCols((prev) => ((prev?.length || 0) <= 1 ? prev : prev.filter((_, i) => i !== index)));
        setValues((prev) => {
            const copy: Record<string, string[]> = {};
            Object.keys(prev || {}).forEach((k) => {
                const arr = [...(prev[k] || [])];
                if (arr.length > index) arr.splice(index, 1);
                copy[k] = arr;
            });
            return copy;
        });
    };

    const updateCell = (rowId: string, colIndex: number, val: string) => {
        setValues((prev) => {
            const arr = prev[rowId].map((v, i) => (i === colIndex ? val : v));
            let copy = { ...prev, [rowId]: arr };

            if (title === "NDT INSPECTION ANALYSIS" || title === "HARDNESS INSPECTION ANALYSIS" || title === "HARDNESS INSPECTION") {
                const inspectedRow = rows?.find(r => r?.label?.toLowerCase()?.includes('inspected'));
                const acceptedRow = rows?.find(r => r?.label?.toLowerCase()?.includes('accepted'));
                const rejectedRow = rows?.find(r => r?.label?.toLowerCase()?.includes('rejected'));
                const percentageRow = rows?.find(r => r?.label?.toLowerCase()?.includes('rejection percentage'));

                if (inspectedRow && acceptedRow && rejectedRow) {
                    const inspectedValues = copy[inspectedRow.id] || [];
                    const acceptedValues = copy[acceptedRow.id] || [];
                    const rejectedValues = [...(copy[rejectedRow.id] || [])];
                    const percentageValues = percentageRow ? [...(copy[percentageRow.id] || [])] : [];

                    const inspectedNum = parseFloat(String(inspectedValues[colIndex] || '').trim());
                    const acceptedNum = parseFloat(String(acceptedValues[colIndex] || '').trim());

                    if (!isNaN(inspectedNum) && !isNaN(acceptedNum)) {
                        if (acceptedNum > inspectedNum) {
                            rejectedValues[colIndex] = 'Invalid';
                            if (percentageRow) percentageValues[colIndex] = 'Invalid';
                            if (showAlert) {
                                showAlert('error', `Column ${colIndex + 1}: Accepted quantity (${acceptedNum}) cannot be greater than Inspected quantity (${inspectedNum})`);
                            }
                        } else {
                            const calculatedRejected = inspectedNum - acceptedNum;
                            rejectedValues[colIndex] = calculatedRejected >= 0 ? calculatedRejected.toString() : '';

                            if (percentageRow) {
                                if (inspectedNum > 0) {
                                    percentageValues[colIndex] = ((calculatedRejected / inspectedNum) * 100).toFixed(2);
                                } else {
                                    percentageValues[colIndex] = '0.00';
                                }
                            }
                        }
                        copy = { ...copy, [rejectedRow.id]: rejectedValues };
                        if (percentageRow) copy = { ...copy, [percentageRow.id]: percentageValues };

                        const rejectedCombined = rejectedValues?.map(v => v || "").join('|');
                        onChange(rejectedRow.id, { value: rejectedCombined });

                        if (percentageRow) {
                            const percentageCombined = percentageValues?.map(v => v || "").join('|');
                            onChange(percentageRow.id, { value: percentageCombined });
                        }
                    }
                }
            }

            const combined = arr?.map(v => v || "").join('|');
            const total = arr?.reduce((acc, s) => {
                const n = parseFloat(String(s).trim());
                return acc + (isNaN(n) ? 0 : n);
            }, 0);
            onChange(rowId, { value: combined, total });
            return copy;
        });
    };

    const updateSectionMeta = (patch: Partial<{ ok: boolean | null; remarks: string }>) => {
        if (patch.ok !== undefined) setOkStatus(patch.ok);
        if (patch.remarks !== undefined) setRemarks(patch.remarks);

        if (onSectionChange) {
            onSectionChange(patch);
        } else {
            rows.forEach(r => {
                onChange(r.id, patch);
            });
        }
    };

    const cavityRow = rows.find(r => r.label === "Cavity Number");
    const dataRows = rows.filter(r => r && r.label && r.label !== "Cavity Number" && !r.label.toLowerCase().includes('rejection percentage'));

    return (
        <Box mb={4}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
                <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>{title}</Typography>
            </Box>
            <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

            <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ minWidth: 180 }}>Parameter</TableCell>
                            {cols.map((c, ci) => (
                                <TableCell key={c.id} sx={{ minWidth: 140 }}>
                                    <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                                        <TextField
                                            size="small"
                                            value={c.label}
                                            onChange={(e) => setCols((prev) => prev.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                                            variant="standard"
                                            InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                                            sx={{ input: { textAlign: 'center' } }}
                                            disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                                        />
                                        <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            ))}
                            {showTotal && (
                                <TableCell sx={{ width: 120, bgcolor: '#f1f5f9', fontWeight: 700, textAlign: 'center' }}>Total</TableCell>
                            )}
                            <TableCell sx={{ width: 140, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>OK / NOT OK</TableCell>
                            <TableCell sx={{ bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>Cavity Number</TableCell>
                            {cols.map((c, ci) => (
                                <TableCell key={c.id} sx={{ bgcolor: '#f8fafc' }}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        value={cavityRow ? (values[cavityRow.id]?.[ci] ?? "") : ""}
                                        onChange={(e) => cavityRow && updateCell(cavityRow.id, ci, e.target.value)}
                                        variant="outlined"
                                        sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                                        disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                                    />
                                </TableCell>
                            ))}
                            {showTotal && <TableCell sx={{ bgcolor: '#f8fafc' }} />}
                            <TableCell rowSpan={rows?.length + 1} sx={{ bgcolor: COLORS.successBg, verticalAlign: "middle", textAlign: 'center', width: 140, borderBottom: 'none' }}>
                                <RadioGroup row sx={{ justifyContent: 'center' }} value={okStatus === null ? "" : String(okStatus)} onChange={(e) => updateSectionMeta({ ok: e.target.value === "true" })}>
                                    <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} />
                                    <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing} />
                                </RadioGroup>
                            </TableCell>
                            <TableCell rowSpan={rows?.length + 1} sx={{ bgcolor: '#fff7ed', verticalAlign: "top", borderBottom: 'none' }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={remarks || ""}
                                    onChange={(e) => updateSectionMeta({ remarks: e.target.value })}
                                    placeholder="Enter remarks..."
                                    variant="outlined"
                                    sx={{ bgcolor: 'white' }}
                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                />
                            </TableCell>
                        </TableRow>
                        {dataRows.map((r: NdtRow) => {
                            const rowVals = values[r.id] ?? [];
                            const displayTotal = rowVals.reduce((acc, s) => {
                                const n = parseFloat(String(s).trim());
                                return acc + (isNaN(n) ? 0 : n);
                            }, 0);
                            const totalToShow = rowVals.some(v => v && !isNaN(parseFloat(String(v)))) ? displayTotal : (r.total ?? null);
                            const isRejectedQty = r.label.toLowerCase().includes('rejected') && !r.label.toLowerCase().includes('reason');
                            const isAcceptedQty = r.label.toLowerCase().includes('accepted');

                            return (
                                <TableRow key={r.id}>
                                    <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>{r.label}</TableCell>
                                    {cols.map((c, ci) => (
                                        <TableCell key={c.id}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={values[r.id]?.[ci] ?? ""}
                                                onChange={(e) => updateCell(r.id, ci, e.target.value)}
                                                variant="outlined"
                                                sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                                                disabled={((user?.role === 'HOD' || user?.role === 'Admin') && !isEditing) || isRejectedQty || r.label.toLowerCase().includes('percentage')}
                                            />
                                        </TableCell>
                                    ))}
                                    {showTotal && <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{totalToShow !== null ? totalToShow : "-"}</TableCell>}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
            <Button size="small" onClick={addColumn} startIcon={<AddCircleIcon />} sx={{ mt: 1, color: COLORS.secondary }} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}>Add Column</Button>
        </Box>
    );
}

export default function VisualInspection({
    initialRows = ["Cavity Number", "Inspected Quantity", "Accepted Quantity", "Rejected Quantity", "Rejection Percentage", "Reason for rejection"],
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
    const [visualOk, setVisualOk] = useState<boolean | null>(null);
    const [remarks, setRemarks] = useState<string>("");
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
    const [showProfile, setShowProfile] = useState(false);
    const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
    const departmentInfo = getDepartmentInfo(user);
    const [dataExists, setDataExists] = useState(false);
    const [ndtRows, setNdtRows] = useState<NdtRow[]>(initialNdtRows(["Cavity Number", "Inspected Quantity", "Accepted Quantity", "Rejected Quantity", "Rejection Percentage", "Reason for rejection"]));
    const [hardRows, setHardRows] = useState<NdtRow[]>(initialNdtRows(["Cavity Number", "Inspected Quantity", "Accepted Quantity", "Rejected Quantity", "Rejection Percentage", "Reason for rejection"]));

    const handleNdtChange = (id: string, patch: Partial<NdtRow>) => {
        setNdtRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    };

    const handleHardnessChange = (id: string, patch: Partial<NdtRow>) => {
        setHardRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    };

    const handleNdtSectionChange = (patch: Partial<NdtRow>) => {
        setNdtRows(prev => prev.map(r => ({ ...r, ...patch })));
    };

    const handleHardnessSectionChange = (patch: Partial<NdtRow>) => {
        setHardRows(prev => prev.map(r => ({ ...r, ...patch })));
    };

    const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";
    const [isAssigned, setIsAssigned] = useState<boolean | null>(null);

    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

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
                    const response = await inspectionService.getVisualInspection(trialId);

                    if (response.success && response.data && response.data.length > 0) {
                        const data = response.data[0];
                        if (data.inspection_date) setDate(new Date(data.inspection_date).toISOString().slice(0, 10));

                        const inspections = safeParse<any[]>(data.inspections, []);
                        if (inspections && inspections.length > 0) {
                            const loadedCols = inspections?.map((item: any) => item?.['Cavity Number'] || '');

                            setCols(loadedCols);
                            setRows(prevRows => prevRows?.map(row => {
                                let fieldName = row?.label;
                                return {
                                    ...row,
                                    values: inspections?.map((item: any) => String(item?.[fieldName] || ''))
                                };
                            }));
                        }

                        setVisualOk(data?.visual_ok === null || data?.visual_ok === undefined ? null : (data.visual_ok === true || data.visual_ok === 1 || String(data.visual_ok) === "1" || String(data.visual_ok) === "true"));
                        setRemarks(data?.remarks || "");

                        const restoreSection = (source: any, labelKeys: string[], sectionOk: any = null, sectionRemarks: string = "") => {
                            const arr = safeParse<any[]>(source, []);
                            const okVal = sectionOk === null || sectionOk === undefined ? null : (sectionOk === true || sectionOk === 1 || String(sectionOk) === "1" || String(sectionOk) === "true");

                            if (arr?.length > 0 && typeof arr?.[0] === 'object' && !Array.isArray(arr?.[0])) {
                                return labelKeys?.map((label, i) => {
                                    const values = arr?.map(obj => String(obj?.[label] || ""));
                                    return {
                                        id: `${label}-${i}-${generateUid()}`,
                                        label: label,
                                        value: values?.join('|'),
                                        ok: okVal,
                                        remarks: sectionRemarks || "",
                                        total: label?.toLowerCase()?.includes('quantity') || label?.toLowerCase()?.includes('strength') ? values?.reduce((acc, v) => acc + (parseFloat(v) || 0), 0) : null,
                                    };
                                });
                            }

                            if (arr?.length > 0) {
                                return arr?.map((r: any, i: number) => ({
                                    id: (r?.label || "Param") + "-" + i + "-" + generateUid(),
                                    label: r?.label || "Param",
                                    value: Array.isArray(r?.values) ? r.values.join('|') : (r?.value || ""),
                                    ok: r?.ok === null || r?.ok === undefined ? okVal : (r.ok === true || String(r.ok) === "1" || String(r.ok) === "true"),
                                    remarks: r?.remarks || sectionRemarks || "",
                                    total: r?.total || null,
                                }));
                            }

                            return labelKeys.map((label, i) => ({
                                id: `${label}-${i}-${generateUid()}`,
                                label: label,
                                value: "",
                                ok: okVal,
                                remarks: sectionRemarks || "",
                                total: null
                            }));
                        };

                        const ndtRowsData = restoreSection(data?.ndt_inspection, ["Cavity Number", "Inspected Quantity", "Accepted Quantity", "Rejected Quantity", "Rejection Percentage", "Reason for rejection"], data?.ndt_inspection_ok, data?.ndt_inspection_remarks);
                        if (ndtRowsData?.length > 0) setNdtRows(ndtRowsData as NdtRow[]);

                        const hardRowsData = restoreSection(data?.hardness, ["Cavity Number", "Inspected Quantity", "Accepted Quantity", "Rejected Quantity", "Rejection Percentage", "Reason for rejection"], data?.hardness_ok, data?.hardness_remarks);
                        if (hardRowsData?.length > 0) setHardRows(hardRowsData as NdtRow[]);

                        setDataExists(true);
                    }
                } catch (error) {
                    console.error("Failed to fetch visual inspection:", error);
                    showAlert('error', 'Failed to load existing data.');
                }
            }
        };
        if (trialId) fetchData();
    }, [user, trialId]); // eslint-disable-line react-hooks/exhaustive-deps


    const calculateRejectionPercentage = (colIndex: number): string => {
        const findRow = (labelPart: string) => rows?.find(r => r?.label?.toLowerCase()?.includes(labelPart?.toLowerCase()));
        const inspectedRow = findRow("inspected quantity");
        const rejectedRow = findRow("rejected quantity");

        if (!inspectedRow || !rejectedRow) return "";

        const inspected = parseFloat(inspectedRow?.values?.[colIndex] || "0");
        const rejected = parseFloat(rejectedRow?.values?.[colIndex] || "0");

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
        setCols((c) => [...(c || []), ""]);
        setRows((r) =>
            r?.map((row) => ({
                ...row,
                values: [...(row?.values || []), ""],
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
        if ((cols?.length || 0) <= 1) return;
        setCols((c) => c?.filter((_, i) => i !== index));
        setRows((r) =>
            r?.map((row) => ({
                ...row,
                values: row?.values?.filter((_, i) => i !== index),
            }))
        );
    };

    const updateCell = (rowId: string, colIndex: number, value: string) => {
        setRows(prev => {
            let updated = prev?.map(r => {
                if (r.id !== rowId) return r;
                const newValues = r?.values?.map((v, i) => (i === colIndex ? value : v));
                return { ...r, values: newValues };
            });

            const findInUpdated = (labelPart: string) => updated?.find(r => r?.label?.toLowerCase()?.includes(labelPart?.toLowerCase()));
            const inspectedRow = findInUpdated("inspected quantity");
            const acceptedRow = findInUpdated("accepted quantity");
            const rejectedRow = findInUpdated("rejected quantity");
            const percentageRow = findInUpdated("rejection percentage");

            if (inspectedRow && acceptedRow && rejectedRow) {
                const inspectedNum = parseFloat(String(inspectedRow?.values?.[colIndex] || '').trim());
                const acceptedNum = parseFloat(String(acceptedRow?.values?.[colIndex] || '').trim());

                if (!isNaN(inspectedNum) && !isNaN(acceptedNum)) {
                    const newRejectedValues = [...(rejectedRow?.values || [])];
                    if (acceptedNum > inspectedNum) {
                        newRejectedValues[colIndex] = 'Invalid';
                        showAlert('error', `Column ${colIndex + 1}: Accepted quantity (${acceptedNum}) cannot be greater than Inspected quantity (${inspectedNum})`);
                    } else {
                        const calculatedRejected = inspectedNum - acceptedNum;
                        newRejectedValues[colIndex] = calculatedRejected >= 0 ? calculatedRejected.toString() : '';
                    }
                    updated = updated?.map(r => r.id === rejectedRow.id ? { ...r, values: newRejectedValues } : r);
                }
            }

            if (inspectedRow && rejectedRow && percentageRow) {
                const newPercentageValues = [...(percentageRow?.values || [])];
                const inspectedNum = parseFloat(String(inspectedRow?.values?.[colIndex] || '').trim());
                const rejectedNum = parseFloat(String(rejectedRow?.values?.[colIndex] || '').trim());

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
                updated = updated?.map(r => r.id === percentageRow.id ? { ...r, values: newPercentageValues } : r);
            }

            return updated?.map(r => {
                if (r?.label === "Cavity Number") return r;
                const total = r?.values?.reduce((sum, val) => {
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
        setVisualOk(null);
        setRemarks("");
        setAttachedFiles([]);
        setAdditionalRemarks("");
        setMessage(null);

        setPreviewMode(false);
        setPreviewPayload(null);
        setSubmitted(false);
    };

    const buildPayload = () => {
        const processedRows = rows?.map(r => {
            const totalVal = r?.label?.toLowerCase()?.includes("cavity") ? null : r?.values?.reduce((acc, v) => {
                const n = parseFloat(String(v).trim());
                return acc + (isNaN(n) ? 0 : n);
            }, 0);
            return { ...r, total: totalVal };
        });

        const inspRow = processedRows?.find(r => r?.label === "Inspected Quantity");
        const rejRow = processedRows?.find(r => r?.label === "Rejected Quantity");
        const percRow = processedRows?.find(r => r?.label === "Rejection Percentage");

        if (inspRow && rejRow && percRow) {
            const totalInsp = inspRow?.total || 0;
            const totalRej = rejRow?.total || 0;
            if (totalInsp > 0) {
                percRow.total = parseFloat(((totalRej / totalInsp) * 100).toFixed(2));
            } else {
                percRow.total = 0;
            }
        }

        const getOkStatus = (rows: any[]) => {
            const hasNotOk = rows?.some(r => r?.ok === false || String(r?.ok) === "false" || String(r?.ok) === "0");
            if (hasNotOk) return false;
            const hasOk = rows?.some(r => r?.ok === true || String(r?.ok) === "true" || String(r?.ok) === "1");
            return hasOk ? true : null;
        };

        return {
            created_at: formatDateTime(new Date().toISOString()),
            cols: cols?.slice(),
            rows: processedRows,
            visual_ok: visualOk,
            remarks: remarks || null,
            attachedFiles: attachedFiles?.map(f => f?.name),
            additionalRemarks: additionalRemarks,
            ndt_rows: ndtRows?.map(r => ({ ...r })),
            ndt_ok: getOkStatus(ndtRows || []),
            ndt_remarks: ndtRows?.find(r => r?.remarks)?.remarks || "",
            hard_rows: hardRows?.map(r => ({ ...r })),
            hard_ok: getOkStatus(hardRows || []),
            hard_remarks: hardRows?.find(r => r?.remarks)?.remarks || ""
        };
    };

    const buildServerPayload = (isDraft: boolean = false) => {
        const source = previewPayload || buildPayload();

        const findRow = (labelPart: string) => (source?.rows || []).find((r: any) => r?.label?.toLowerCase()?.includes(labelPart?.toLowerCase()));
        const cavityRow = findRow('cavity number');
        const inspectedRow = findRow('inspected quantity');
        const acceptedRow = findRow('accepted quantity');
        const rejectedRow = findRow('rejected quantity');
        const reasonRow = findRow('reason for rejection');

        const inspections = source?.cols?.map((col: any, idx: number) => {
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
                'Cavity Number': String(cavityRow?.values?.[idx] ?? col ?? ""),
                'Inspected Quantity': String(inspected ?? ""),
                'Accepted Quantity': String(accepted ?? ""),
                'Rejected Quantity': String(rejected ?? ""),
                'Rejection Percentage': String(rejectionPercentage),
                'Reason for rejection': String(reasonRow?.values?.[idx] ?? ""),
            };
        }) || [];

        const getNdtRow = (labelPart: string) => (source?.ndt_rows || []).find((r: any) => r?.label?.toLowerCase()?.includes(labelPart?.toLowerCase()));
        const ndtCavityRow = getNdtRow('cavity number');
        const ndtInspectedRow = getNdtRow('inspected quantity');
        const ndtAcceptedRow = getNdtRow('accepted quantity');
        const ndtRejectedRow = getNdtRow('rejected quantity');
        const ndtReasonRow = getNdtRow('reason for rejection');

        const ndtMaxCols = Math.max(...(source?.ndt_rows || [])?.map((r: any) => r?.value ? r.value.split('|').length : 0), 0);
        const ndt_inspection = Array.from({ length: ndtMaxCols }).map((_, idx) => {
            const inspected = ndtInspectedRow?.value?.split('|')[idx] || "";
            const accepted = ndtAcceptedRow?.value?.split('|')[idx] || "";
            const rejected = ndtRejectedRow?.value?.split('|')[idx] || "";
            const rejectionPercentage = (() => {
                const ins = parseFloat(String(inspected || '0'));
                const rej = parseFloat(String(rejected || '0'));
                if (isNaN(ins) || ins === 0) return "0.00";
                return ((rej / ins) * 100).toFixed(2);
            })();

            return {
                'Cavity Number': String(ndtCavityRow?.value?.split('|')[idx] || ""),
                'Inspected Quantity': String(inspected),
                'Accepted Quantity': String(accepted),
                'Rejected Quantity': String(rejected),
                'Rejection Percentage': String(rejectionPercentage),
                'Reason for rejection': String(ndtReasonRow?.value?.split('|')[idx] || ""),
            };
        });

        const getHardRow = (labelPart: string) => (source?.hard_rows || []).find((r: any) => r?.label?.toLowerCase()?.includes(labelPart?.toLowerCase()));
        const hardCavityRow = getHardRow('cavity number');
        const hardInspectedRow = getHardRow('inspected quantity');
        const hardAcceptedRow = getHardRow('accepted quantity');
        const hardRejectedRow = getHardRow('rejected quantity');
        const hardReasonRow = getHardRow('reason for rejection');

        const hardMaxCols = Math.max(...(source?.hard_rows || [])?.map((r: any) => r?.value ? r.value.split('|').length : 0), 0);
        const hardness = Array.from({ length: hardMaxCols }).map((_, idx) => {
            const inspected = hardInspectedRow?.value?.split('|')[idx] || "";
            const accepted = hardAcceptedRow?.value?.split('|')[idx] || "";
            const rejected = hardRejectedRow?.value?.split('|')[idx] || "";
            const rejectionPercentage = (() => {
                const ins = parseFloat(String(inspected || '0'));
                const rej = parseFloat(String(rejected || '0'));
                if (isNaN(ins) || ins === 0) return "0.00";
                return ((rej / ins) * 100).toFixed(2);
            })();

            return {
                'Cavity Number': String(hardCavityRow?.value?.split('|')[idx] || ""),
                'Inspected Quantity': String(inspected),
                'Accepted Quantity': String(accepted),
                'Rejected Quantity': String(rejected),
                'Rejection Percentage': String(rejectionPercentage),
                'Reason for rejection': String(hardReasonRow?.value?.split('|')[idx] || ""),
            };
        });

        return {
            trial_id: trialId,
            inspections,
            visual_ok: source.visual_ok === null ? null : Boolean(source.visual_ok),
            remarks: source.remarks || null,
            ndt_inspection_ok: source.ndt_ok === null ? null : Boolean(source.ndt_ok),
            ndt_inspection_remarks: source.ndt_remarks || "",
            ndt_inspection,
            hardness_ok: source.hard_ok === null ? null : Boolean(source.hard_ok),
            hardness_remarks: source.hard_remarks || "",
            hardness,
            is_edit: isEditing || dataExists,
            is_draft: isDraft,
            inspection_date: date
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

        try {
            const apiPayload = buildServerPayload(false);

            if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
                await inspectionService.updateVisualInspection(apiPayload);
            } else {
                await inspectionService.submitVisualInspection(apiPayload);
            }


            if (attachedFiles.length > 0) {
                await uploadFiles(
                    attachedFiles,
                    trialId,
                    "VISUAL_INSPECTION",
                    user?.username || "system",
                    "VISUAL_INSPECTION"
                ).catch(err => console.error("File upload error:", err));
            }

            setSubmitted(true);
            setPreviewMode(false);
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `Visual Inspection ${dataExists ? 'updated' : 'created'} successfully.`
            });
            navigate('/dashboard');
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err?.message || 'Failed to save Visual Inspection. Please try again.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const apiPayload = buildServerPayload(true);

            if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
                await inspectionService.updateVisualInspection(apiPayload);
            } else {
                await inspectionService.submitVisualInspection(apiPayload);
            }

            if (attachedFiles.length > 0) {
                await uploadFiles(attachedFiles, trialId, "VISUAL_INSPECTION", user?.username || "system", "VISUAL_INSPECTION")
                    .catch(err => console.error("Draft file upload error", err));
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

                                <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, overflow: 'hidden' }}>
                                    <SectionTable
                                        title="NDT INSPECTION ANALYSIS"
                                        rows={ndtRows}
                                        onChange={handleNdtChange}
                                        showTotal={true}
                                        showAlert={showAlert}
                                        user={user}
                                        isEditing={isEditing}
                                        onSectionChange={handleNdtSectionChange}
                                    />

                                </Paper>

                                <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, overflow: 'hidden' }}>
                                    <SectionTable
                                        title="HARDNESS INSPECTION"
                                        rows={hardRows}
                                        onChange={handleHardnessChange}
                                        showAlert={showAlert}
                                        user={user}
                                        isEditing={isEditing}
                                        onSectionChange={handleHardnessSectionChange}
                                    />
                                </Paper>

                                <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
                                        <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>VISUAL INSPECTION DETAILS</Typography>
                                    </Box>
                                    <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                    </Grid>


                                    <Box sx={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ minWidth: 200 }}>Parameter</TableCell>
                                                    {cols?.map((col, ci) => (
                                                        <TableCell key={ci} sx={{ minWidth: 140 }}>
                                                            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                                <TextField
                                                                    variant="standard"
                                                                    value={col}
                                                                    onChange={(e) => updateColLabel(ci, e.target.value)}
                                                                    InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                                                                    size="small"
                                                                    sx={{ input: { textAlign: 'center' } }}
                                                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                                                                />
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => removeColumn(ci)}
                                                                    sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }}
                                                                    disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
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
                                                {rows.map((r, ri) => {
                                                    const labelLower = r.label?.toLowerCase() || "";
                                                    const isRejectionPercentage = labelLower.includes("rejection percentage");
                                                    const isRejectedQty = labelLower.includes("rejected quantity");
                                                    const isAcceptedQty = labelLower.includes("accepted quantity");
                                                    const findRowMain = (p: string) => rows.find(row => row.label?.toLowerCase().includes(p.toLowerCase()));
                                                    const inspectedRow = findRowMain("inspected quantity");

                                                    return (
                                                        <TableRow key={r.id}>
                                                            <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>
                                                                {r.label}
                                                            </TableCell>

                                                            {cols?.map((_, ci) => {
                                                                const inspectedValue = inspectedRow ? (inspectedRow?.values?.[ci] ?? "") : "";
                                                                const inspectedNum = parseFloat(String(inspectedValue).trim());
                                                                const acceptedNum = isAcceptedQty ? parseFloat(String(r?.values?.[ci] ?? '').trim()) : NaN;
                                                                const isInvalid = !isNaN(inspectedNum) && !isNaN(acceptedNum) && acceptedNum > inspectedNum;
                                                                const rejectedValue = isRejectedQty ? (r?.values?.[ci] ?? "") : "";
                                                                const isRejectedInvalid = rejectedValue === 'Invalid';

                                                                const displayValue = isRejectionPercentage ? calculateRejectionPercentage(ci) : (r?.values?.[ci] ?? "");
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
                                                                    if (labelLower?.includes("cavity")) return "-";
                                                                    if (labelLower?.includes("reason")) return "-";

                                                                    if (isRejectionPercentage) {
                                                                        const rejectedRow = findRowMain("rejected quantity");
                                                                        if (!inspectedRow || !rejectedRow) return "-";

                                                                        const totalInspected = inspectedRow?.values?.reduce((acc: number, v: any) => acc + (parseFloat(String(v).trim()) || 0), 0);
                                                                        const totalRejected = rejectedRow?.values?.reduce((acc: number, v: any) => acc + (parseFloat(String(v).trim()) || 0), 0);

                                                                        if (totalInspected > 0) {
                                                                            return `${((totalRejected / totalInspected) * 100).toFixed(2)}%`;
                                                                        }
                                                                        return "0.00%";
                                                                    }

                                                                    const sum = r?.values?.reduce((acc: number, v: any) => acc + (parseFloat(String(v).trim()) || 0), 0);
                                                                    return sum;
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
                                                                            value={visualOk === null ? "" : String(visualOk)}

                                                                            onChange={(e) => setVisualOk(e.target.value === "true")}

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
                                                                                placeholder="Enter remarks..."
                                                                                value={remarks}
                                                                                onChange={(e) => setRemarks(e.target.value)}
                                                                                variant="outlined"
                                                                                sx={{ bgcolor: 'white' }}
                                                                                disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                                                                            />

                                                                        </Box>
                                                                    </TableCell>
                                                                </>
                                                            ) : null}
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
                                        disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                                    >
                                        Add Column
                                    </Button>

                                    <Box sx={{ p: 3, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}` }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: "uppercase" }}>
                                            Attach PDF / Image Files
                                        </Typography>
                                        <FileUploadSection
                                            files={attachedFiles}
                                            onFilesChange={handleAttachFiles}
                                            onFileRemove={removeAttachedFile}
                                            showAlert={showAlert}
                                            label="Attach PDF"
                                            disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                                        />
                                        <DocumentViewer trialId={trialId} category="VISUAL_INSPECTION" />
                                    </Box>


                                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
                                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                                            {user?.department_id !== 8 && (
                                                <ActionButtons
                                                    {...(user?.role !== 'HOD' && user?.role !== 'Admin' ? { onReset: reset } : {})}
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
                                            )}
                                        </Box>
                                    </Box>

                                </Paper>

                                <PreviewModal
                                    open={previewMode}
                                    onClose={() => setPreviewMode(false)}
                                    onSubmit={handleFinalSave}
                                    title="Verify Visual Inspection Details"
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
                                            {previewPayload?.cols && (
                                                <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                                                                {previewPayload?.cols?.map((c: string, i: number) => (<TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>{c}</TableCell>
                                                                ))}
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {previewPayload?.rows?.map((r: any, idx: number) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{r.label}</TableCell>
                                                                    {r.values?.map((v: any, j: number) => (
                                                                        <TableCell key={j} sx={{ textAlign: 'center', fontSize: '0.8rem', fontFamily: 'Roboto Mono' }}>
                                                                            {v === null ? "-" : String(v)}
                                                                        </TableCell>
                                                                    ))}
                                                                </TableRow>
                                                            ))}
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                                                                <TableCell colSpan={(previewPayload?.cols?.length || 0) + 1} sx={{ textAlign: 'center' }}>
                                                                    {previewPayload?.visual_ok ? <Chip label="OK" color="success" size="small" /> : <Chip label="NOT OK" color="error" size="small" />}
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </Box>
                                            )}

                                            {/* NDT Preview in Modal */}
                                            {previewPayload?.ndt_rows && previewPayload.ndt_rows.length > 0 && (
                                                <Box mt={3}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>NDT INSPECTION ANALYSIS(X-RAY & MPI)</Typography>
                                                    <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                                                                    {previewPayload?.cols?.map((col: string, i: number) => (
                                                                        <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>{col}</TableCell>
                                                                    ))}
                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>Total</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {previewPayload?.ndt_rows?.map((r: any, idx: number) => {
                                                                    const vals = (r?.value || "")?.split('|');
                                                                    return (
                                                                        <TableRow key={idx}>
                                                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{r?.label}</TableCell>
                                                                            {previewPayload?.cols?.map((_: any, j: number) => (
                                                                                <TableCell key={j} sx={{ textAlign: 'center', fontSize: '0.75rem', fontFamily: 'Roboto Mono' }}>
                                                                                    {vals?.[j]?.trim() || "-"}
                                                                                </TableCell>
                                                                            ))}
                                                                            <TableCell sx={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{r?.total ?? "-"}</TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                                <TableRow>
                                                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                                                                    <TableCell colSpan={(previewPayload?.cols?.length || 0) + 1} sx={{ textAlign: 'center' }}>                                                                        {previewPayload?.ndt_ok ? <Chip label="OK" color="success" size="small" /> : <Chip label="NOT OK" color="error" size="small" />}
                                                                    </TableCell>
                                                                </TableRow>
                                                                {previewPayload?.ndt_remarks && (
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Remarks</TableCell>
                                                                        <TableCell colSpan={(previewPayload?.cols?.length || 0) + 1} sx={{ textAlign: 'center', fontSize: '0.75rem' }}>{previewPayload?.ndt_remarks}</TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Hardness Preview in Modal */}
                                            {previewPayload?.hard_rows && previewPayload.hard_rows.length > 0 && (
                                                <Box mt={3}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>HARDNESS INSPECTION</Typography>
                                                    <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                                                                    {previewPayload?.cols?.map((col: string, i: number) => (
                                                                        <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>{col}</TableCell>
                                                                    ))}
                                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>Total</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {previewPayload?.hard_rows?.map((r: any, idx: number) => {
                                                                    const vals = (r?.value || "")?.split('|');
                                                                    return (
                                                                        <TableRow key={idx}>
                                                                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{r?.label}</TableCell>
                                                                            {previewPayload?.cols?.map((_: any, j: number) => (
                                                                                <TableCell key={j} sx={{ textAlign: 'center', fontSize: '0.75rem', fontFamily: 'Roboto Mono' }}>
                                                                                    {vals?.[j]?.trim() || "-"}
                                                                                </TableCell>
                                                                            ))}
                                                                            <TableCell sx={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{r?.total ?? "-"}</TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                                <TableRow>
                                                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                                                                    <TableCell colSpan={previewPayload?.cols?.length || 0} sx={{ textAlign: 'center' }}>                                                                        {previewPayload?.hard_ok ? <Chip label="OK" color="success" size="small" /> : <Chip label="NOT OK" color="error" size="small" />}
                                                                    </TableCell>
                                                                </TableRow>
                                                                {previewPayload?.hard_remarks && (
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Remarks</TableCell>
                                                                        <TableCell colSpan={previewPayload?.cols?.length || 0} sx={{ textAlign: 'center', fontSize: '0.75rem' }}>{previewPayload?.hard_remarks}</TableCell>                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Attached PDF Files Preview */}
                                            {previewPayload?.attachedFiles && previewPayload.attachedFiles.length > 0 && (
                                                <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                                                    <Typography variant="subtitle2" mb={1} color="textSecondary">ATTACHED FILES</Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {previewPayload?.attachedFiles?.map((fileName: string, idx: number) => (
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
            </Box >

            {/* Profile Modal */}
            {
                showProfile && (
                    <ProfileModal
                        onClose={() => setShowProfile(false)}
                        onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
                    />
                )
            }
        </ThemeProvider >
    );
}
