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
  Container,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import Swal from 'sweetalert2';

import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiService } from '../../services/commonService';
import { inspectionService } from '../../services/inspectionService';
import { uploadFiles } from '../../services/fileUploadHelper';
import { COLORS, appTheme } from '../../theme/appTheme';
import { useAlert } from '../../hooks/useAlert';
import { AlertMessage } from '../common/AlertMessage';
import { fileToMeta, generateUid, validateFileSizes, formatDate } from '../../utils';
import type { InspectionRow, GroupMetadata } from '../../types/inspection';
import departmentProgressService from "../../services/departmentProgressService";
import Header from "../dashboard/Header";
import ProfileModal from "../dashboard/ProfileModal";
import { getDepartmentInfo } from "../../utils/dashboardUtils";
import { LoadingState, EmptyState, ActionButtons, FileUploadSection, PreviewModal, DocumentViewer } from '../common';
import BasicInfo from "../dashboard/BasicInfo";
import { safeParse } from "../../utils/jsonUtils";


type Row = InspectionRow;
type GroupMeta = GroupMetadata;


export default function McShopInspection({
  initialCavities = ["", "", ""],
  onSave = async (payload: any) => {

    return { ok: true };
  },
  onValidationError,
}: {
  initialCavities?: string[];
  onSave?: (payload: any) => Promise<any> | any;
  onValidationError?: (message: string) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();


  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [userIP, setUserIP] = useState<string>("Loading...");
  const [isEditing, setIsEditing] = useState(false);
  const [dataExists, setDataExists] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const departmentInfo = getDepartmentInfo(user);
  const [cavities, setCavities] = useState<string[]>([...initialCavities]);



  const makeInitialRows = (cavLabels: string[]): Row[] => [
    { id: `cavity-${generateUid()}`, label: "Cavity details", values: cavLabels.map(() => "") },
    { id: `received-${generateUid()}`, label: "Received Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `insp-${generateUid()}`, label: "Inspected Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `accp-${generateUid()}`, label: "Accepted Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `rej-${generateUid()}`, label: "Rejected Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `rej-perc-${generateUid()}`, label: "Rejection Percentage (%)", values: cavLabels.map(() => ""), total: null },
    { id: `reason-${generateUid()}`, label: "Reason for rejection:", values: cavLabels.map(() => "") },
  ];

  const [rows, setRows] = useState<Row[]>(() => makeInitialRows(initialCavities));
  const [groupMeta, setGroupMeta] = useState<GroupMeta>({ remarks: "", attachment: null });
  const [dimensionalRemarks, setDimensionalRemarks] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [additionalRemarks, setAdditionalRemarks] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { alert, showAlert } = useAlert();
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

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
    const fetchUserIP = async () => {
      const ip = await apiService.getIP();
      setUserIP(ip);
    };
    fetchUserIP();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (trialId) {
        try {
          const response = await inspectionService.getMachineShopInspection(trialId);
          if (response.success && response.data && response.data.length > 0) {
            const data = response.data[0];
            setDate(data.inspection_date ? new Date(data.inspection_date).toISOString().slice(0, 10) : "");
            const parsedInspections = safeParse<any[]>(data.inspections, []);

            if (parsedInspections.length > 0) {
              const newCavities = parsedInspections.map((item: any) => item['Cavity Details'] || "");
              setCavities(newCavities);

              const getVals = (key: string) => parsedInspections.map((item: any) => item[key] ?? "");

              setRows(prevRows => {
                const newRows = [...prevRows];
                const updateRowVals = (labelSnippet: string, values: any[]) => {
                  const rIndex = newRows.findIndex(r => r.label.toLowerCase().includes(labelSnippet));
                  if (rIndex !== -1) {
                    const isPercentage = labelSnippet === 'rejection percentage';
                    const isCavity = labelSnippet === 'cavity details';
                    const isReason = labelSnippet.includes('reason');

                    newRows[rIndex] = {
                      ...newRows[rIndex],
                      values: values.map(String),
                      total: (isCavity || isReason || isPercentage) ? null : values.reduce((acc, v) => acc + (parseFloat(String(v)) || 0), 0)
                    };
                  }
                };

                updateRowVals('cavity details', newCavities);
                updateRowVals('received', getVals('Received Quantity'));
                updateRowVals('inspected', getVals('Inspected Quantity'));
                updateRowVals('accepted', getVals('Accepted Quantity'));
                updateRowVals('rejected', getVals('Rejected Quantity'));
                updateRowVals('rejection percentage', getVals('Rejection Percentage (%)'));
                updateRowVals('reason', getVals('Reason for rejection'));

                const inspRow = newRows.find(r => r.label === "Inspected Quantity");
                const rejRow = newRows.find(r => r.label === "Rejected Quantity");
                const percRow = newRows.find(r => r.label === "Rejection Percentage (%)");

                if (inspRow && rejRow && percRow) {
                  const totalInsp = inspRow.total || 0;
                  const totalRej = rejRow.total || 0;
                  if (totalInsp > 0) {
                    percRow.total = parseFloat(((totalRej / totalInsp) * 100).toFixed(2));
                  }
                }

                return newRows;
              });
            }
            setGroupMeta(prev => ({ ...prev, remarks: data.remarks || "" }));
            setDataExists(true);
          }
        } catch (error) {
          console.error("Failed to fetch machine shop data:", error);
          showAlert('error', 'Failed to load existing data.');
        }
      }
    };
    if (trialId) fetchData();
  }, [user, trialId]); // eslint-disable-line react-hooks/exhaustive-deps


  const addColumn = () => {
    setCavities((c) => [...c, ""]);
    setRows((r) => r.map((row) => ({ ...row, values: [...row.values, ""] })));
  };

  const handleAttachFiles = (newFiles: File[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeColumn = (index: number) => {
    if (cavities.length <= 1) return;
    setCavities((c) => c.filter((_, i) => i !== index));
    setRows((r) => r.map((row) => ({ ...row, values: row.values.filter((_, i) => i !== index) })));
  };

  const updateCavityLabel = (index: number, label: string) => {
    setCavities((prev) => prev.map((c, i) => (i === index ? label : c)));
  };

  const updateCell = (rowId: string, colIndex: number, value: string) => {
    setRows((prev) => {
      const updatedRows = [...prev];
      const rIndex = updatedRows.findIndex(r => r.id === rowId);
      if (rIndex === -1) return prev;

      const newValues = updatedRows[rIndex].values.map((v, i) => (i === colIndex ? value : v));
      const isCavityOrReason = updatedRows[rIndex].label.toLowerCase().includes("cavity details") || updatedRows[rIndex].label.toLowerCase().includes("reason");

      if (isCavityOrReason) {
        updatedRows[rIndex] = { ...updatedRows[rIndex], values: newValues };
        return updatedRows;
      }

      const total = newValues.reduce((sum, val) => {
        const n = parseFloat(String(val).trim());
        return sum + (isNaN(n) ? 0 : n);
      }, 0);

      updatedRows[rIndex] = { ...updatedRows[rIndex], values: newValues, total };

      // Auto-calculation logic
      let updated = [...updatedRows];
      const inspectedRow = updated.find(r => r.label === "Inspected Quantity");
      const acceptedRow = updated.find(r => r.label === "Accepted Quantity");
      const rejectedRow = updated.find(r => r.label === "Rejected Quantity");
      const percentageRow = updated.find(r => r.label === "Rejection Percentage (%)");

      if (inspectedRow && acceptedRow && rejectedRow) {
        const inspectedNum = parseFloat(String(inspectedRow.values[colIndex] || '').trim());
        const acceptedNum = parseFloat(String(acceptedRow.values[colIndex] || '').trim());

        if (!isNaN(inspectedNum) && !isNaN(acceptedNum)) {
          if (acceptedNum > inspectedNum) {
            if (onValidationError) {
              onValidationError(`Column ${colIndex + 1}: Accepted quantity (${acceptedNum}) cannot be greater than Inspected quantity (${inspectedNum})`);
            } else {
              showAlert('error', `Column ${colIndex + 1}: Accepted quantity (${acceptedNum}) cannot be greater than Inspected quantity (${inspectedNum})`);
            }
            const newRejectedValues = [...rejectedRow.values];
            newRejectedValues[colIndex] = "Invalid";
            updated = updated.map(r => r.id === rejectedRow.id ? { ...r, values: newRejectedValues } : r);
          } else {
            const calculatedRejected = inspectedNum - acceptedNum;
            const newRejectedValues = [...rejectedRow.values];
            newRejectedValues[colIndex] = calculatedRejected >= 0 ? calculatedRejected.toString() : '';
            updated = updated.map(r => r.id === rejectedRow.id ? { ...r, values: newRejectedValues, total: newRejectedValues.reduce((s, v) => s + (parseFloat(v) || 0), 0) } : r);
          }
        }
      }

      const updatedRejectedRow = updated.find(r => r.label === "Rejected Quantity");

      if (inspectedRow && updatedRejectedRow && percentageRow) {
        const inspectedNum = parseFloat(String(inspectedRow.values[colIndex] || '').trim());
        const rejectedNum = parseFloat(String(updatedRejectedRow.values[colIndex] || '').trim());
        const newPercentageValues = [...percentageRow.values];

        if (!isNaN(inspectedNum) && inspectedNum > 0 && !isNaN(rejectedNum)) {
          const percentage = (rejectedNum / inspectedNum) * 100;
          newPercentageValues[colIndex] = percentage.toFixed(2);
        } else {
          newPercentageValues[colIndex] = '';
        }

        const totalInspected = inspectedRow.values.reduce((acc, val) => acc + (parseFloat(String(val)) || 0), 0);
        const totalRejected = updated.find(r => r.label === "Rejected Quantity")?.values.reduce((acc, val) => acc + (parseFloat(String(val)) || 0), 0) || 0;

        let totalPercentage = null;
        if (totalInspected > 0) {
          totalPercentage = (totalRejected / totalInspected) * 100;
        }

        updated = updated.map(r => r.id === percentageRow.id ? { ...r, values: newPercentageValues, total: totalPercentage !== null ? parseFloat(totalPercentage.toFixed(2)) : null } : r);
      }

      return updated;
    });
  };

  const resetAll = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setCavities([...initialCavities]);
    setRows(makeInitialRows(initialCavities));
    setGroupMeta({ remarks: "", attachment: null });
    setDimensionalRemarks("");
    setAttachedFiles([]);
    setAdditionalRemarks("");

    setPreviewSubmitted(false);
  };

  const buildPayload = () => {
    return {
      inspection_type: "mc_shop",
      inspection_date: date || null,
      user_name: user?.username || null,
      user_ip: userIP || null,
      cavities: cavities.slice(),
      rows: rows.map((r) => ({
        label: r.label,
        values: r.values.map((v) => (v === "" ? null : v)),
        freeText: r.freeText || null,
        total: r.total ?? null,
      })),
      right_remarks: groupMeta.remarks || null,
      right_attachment: fileToMeta(groupMeta.attachment),
      dimensional_report_remarks: dimensionalRemarks || null,
      attachedFiles: attachedFiles.map(f => f.name),
      additionalRemarks: additionalRemarks,
      created_at: new Date().toISOString(),
    };
  };

  const buildServerPayload = (isDraft: boolean = false) => {
    const receivedRow = rows.find(r => r.label === "Received Quantity");
    const inspectedRow = rows.find(r => r.label === "Inspected Quantity");
    const acceptedRow = rows.find(r => r.label === "Accepted Quantity");
    const rejectedRow = rows.find(r => r.label === "Rejected Quantity");
    const percentageRow = rows.find(r => r.label === "Rejection Percentage (%)");
    const reasonRow = rows.find(r => r.label === "Reason for rejection:");

    const inspections: any[] = cavities.map((cav, idx) => ({
      'Cavity Details': cav || (rows[0]?.values?.[idx] ?? ''),
      'Received Quantity': receivedRow?.values?.[idx] ?? null,
      'Inspected Quantity': inspectedRow?.values?.[idx] ?? null,
      'Accepted Quantity': acceptedRow?.values?.[idx] ?? null,
      'Rejected Quantity': rejectedRow?.values?.[idx] ?? null,
      'Rejection Percentage (%)': percentageRow?.values?.[idx] ?? null,
      'Reason for rejection': reasonRow?.values?.[idx] ?? null,
    }));

    return {
      trial_id: trialId,
      inspection_date: date || null,
      inspections: inspections,
      remarks: groupMeta.remarks || null,
      is_edit: isEditing || dataExists,
      is_draft: isDraft
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

    try {
      const serverPayload = buildServerPayload(false);

      if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
        await inspectionService.updateMachineShopInspection(serverPayload);
      } else {
        await inspectionService.submitMachineShopInspection(serverPayload);
      }

      if (attachedFiles.length > 0) {
        await uploadFiles(
          attachedFiles,
          trialId,
          "MC_SHOP_INSPECTION",
          user?.username || "system",
          "MC_SHOP_INSPECTION"
        );
      }

      setPreviewSubmitted(true);
      setPreviewMode(false);
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Machine Shop Inspection ${dataExists ? 'updated' : 'created'} successfully.`
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error saving machine shop inspection:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to save machine shop inspection. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const serverPayload = buildServerPayload(true);

      if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
        await inspectionService.updateMachineShopInspection(serverPayload);
      } else {
        await inspectionService.submitMachineShopInspection(serverPayload);
      }

      if (attachedFiles.length > 0) {
        await uploadFiles(
          attachedFiles,
          trialId,
          "MC_SHOP_INSPECTION",
          user?.username || "system",
          "MC_SHOP_INSPECTION"
        ).catch(console.error);
      }

      setPreviewSubmitted(true);
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
                <BasicInfo trialId={trialId || ""} />

                <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>INSPECTION DETAILS</Typography>
                  </Box>
                  <Divider sx={{ mb: 3, borderColor: COLORS.border }} />



                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Inspection Date</Typography>
                      <TextField
                        size="small"
                        type="date"
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                        }}
                        fullWidth
                        sx={{ bgcolor: 'white' }}
                        disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                      />
                    </Grid>

                  </Grid>

                  <Box sx={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', color: COLORS.blueHeaderText, backgroundColor: COLORS.blueHeaderBg }}>Parameter</TableCell>
                          {cavities.map((cav, i) => (
                            <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', color: COLORS.blueHeaderText, backgroundColor: COLORS.blueHeaderBg }}>
                              <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                <TextField
                                  variant="standard"
                                  value={cav}
                                  onChange={(e) => updateCavityLabel(i, e.target.value)}
                                  InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                                  size="small"
                                  sx={{ input: { textAlign: 'center' } }}
                                  disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                />
                                <IconButton size="small" onClick={() => removeColumn(i)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          ))}
                          <TableCell sx={{ width: 120, bgcolor: '#f1f5f9', fontWeight: 700, textAlign: 'center' }}>Total</TableCell>
                          <TableCell sx={{ width: 240, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {rows.map((r, ri) => {
                          const isReasonRow = r.label.toLowerCase().includes("reason");
                          return (
                            <TableRow key={r.id}>
                              <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>{r.label}</TableCell>

                              {r.values.map((val, ci) => (
                                <TableCell key={ci}>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={val ?? ""}
                                    onChange={(e) => updateCell(r.id, ci, e.target.value)}
                                    variant="outlined"
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: 'white' } }}
                                    disabled={((user?.role === 'HOD' || user?.role === 'Admin') && !isEditing) || r.label.toLowerCase().includes("rejected quantity") || r.label.toLowerCase().includes("rejection percentage")}
                                  />
                                </TableCell>
                              ))}
                              <TableCell sx={{ textAlign: 'center', fontWeight: 700, bgcolor: '#f1f5f9' }}>
                                {r.label.toLowerCase().includes("cavity details") || r.label.toLowerCase().includes("reason") ? "-" : (r.total !== null && r.total !== undefined ? r.total : "-")}
                              </TableCell>

                              {ri === 0 && (
                                <TableCell rowSpan={rows.length} sx={{ verticalAlign: "top", bgcolor: '#fff7ed', padding: 2, minWidth: 240 }}>
                                  <Box display="flex" flexDirection="column" height="100%" gap={2}>
                                    <TextField
                                      size="small"
                                      fullWidth
                                      multiline
                                      rows={8}
                                      placeholder="General remarks..."
                                      value={groupMeta.remarks}
                                      onChange={(e) => setGroupMeta((g) => ({ ...g, remarks: e.target.value }))}
                                      variant="outlined"
                                      sx={{ bgcolor: 'white' }}
                                      disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                    />

                                    <Box display="flex" alignItems="center" gap={1} mt="auto">
                                      <input
                                        accept="image/*,application/pdf"
                                        id="mcshop-attach-file"
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
                                        disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                                      />
                                      <label htmlFor="mcshop-attach-file">
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          component="span"
                                          startIcon={<UploadFileIcon />}
                                          sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                                          disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                                        >
                                          Attach
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
                                          disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                                        />
                                      ) : (
                                        <Typography variant="caption" color="text.secondary">
                                          No file attached
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </TableCell>
                              )}
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
                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                    <DocumentViewer trialId={trialId || ""} category="MC_SHOP_INSPECTION" />
                  </Box>


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

                </Paper>
              </>
            )}

            <PreviewModal
              open={previewMode && previewPayload}
              onClose={() => setPreviewMode(false)}
              onSubmit={handleFinalSave}
              title="Verify Machine Shop Inspection Details"
              submitted={previewSubmitted}
              isSubmitting={saving}
            >
              <Box sx={{ p: 4 }}>
                <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Machine Shop Inspection Report</Typography>
                    <Typography variant="body2" color="textSecondary">Date: {formatDate(previewPayload?.inspection_date)}</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                          {previewPayload?.cavities.map((c: string, i: number) => (
                            <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>{c}</TableCell>
                          ))}
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewPayload?.rows.map((r: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{r.label}</TableCell>
                            {r.freeText !== undefined && r.freeText !== null ? (
                              <TableCell colSpan={previewPayload.cavities.length + 1} sx={{ textAlign: 'left', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                {r.freeText}
                              </TableCell>
                            ) : (
                              <>
                                {r.values.map((v: any, j: number) => (
                                  <TableCell key={j} sx={{ textAlign: 'center', fontSize: '0.8rem', fontFamily: 'Roboto Mono' }}>
                                    {v === null ? "-" : String(v)}
                                  </TableCell>
                                ))}
                                <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                                  {r.label.toLowerCase().includes("cavity details") ? "-" : (r.total !== null && r.total !== undefined ? r.total : "-")}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

                  <Box sx={{ mt: 3 }}>
                    <AlertMessage alert={alert} />
                  </Box>
                </Box>
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
}
