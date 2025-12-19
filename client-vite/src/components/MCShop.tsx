import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import NoPendingWorks from "./common/NoPendingWorks";
import { useAuth } from "../context/AuthContext";
import { updateDepartment, updateDepartmentRole, approve } from "../services/departmentProgressService";
import { trialService } from "../services/trialService";
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

type Row = InspectionRow;
type GroupMeta = GroupMetadata;


export default function McShopInspection({
  initialCavities = ["", "", ""],
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
  const [userTime, setUserTime] = useState<string>("");
  const [userIP, setUserIP] = useState<string>("Loading...");
  const [remarks, setRemarks] = useState<string>("");
  const [cavities, setCavities] = useState<string[]>([...initialCavities]);

  const makeInitialRows = (cavLabels: string[]): Row[] => [
    { id: `cavity-${generateUid()}`, label: "Cavity details", values: cavLabels.map(() => "") },
    { id: `received-${generateUid()}`, label: "Received Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `insp-${generateUid()}`, label: "Inspected Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `accp-${generateUid()}`, label: "Accepted Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `rej-${generateUid()}`, label: "Rejected Quantity", values: cavLabels.map(() => ""), total: null },
    { id: `reason-${generateUid()}`, label: "Reason for rejection: cavity wise", values: cavLabels.map(() => ""), freeText: "" },
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
  const [isEditing, setIsEditing] = useState(false);

  const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";


  useEffect(() => {
    const fetchUserIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchUserIP();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'HOD' && trialId) {
        try {
          const response = await inspectionService.getMachineShopInspection(trialId);
          if (response.success && response.data && response.data.length > 0) {
            const data = response.data[0];
            setDate(data.inspection_date ? new Date(data.inspection_date).toISOString().slice(0, 10) : "");
            if (data.inspections) {
              let inspections: any[] = [];
              try {
                inspections = typeof data.inspections === 'string' ? JSON.parse(data.inspections) : data.inspections;
              } catch (e) {
                console.warn("Failed to parse inspections JSON", e);
                inspections = [];
              }
              if (!Array.isArray(inspections)) inspections = [];

              if (inspections.length > 0) {
                const newCavities = inspections.map((item: any) => item['Cavity Details'] || "");
                setCavities(newCavities);

                const getVals = (key: string) => inspections.map((item: any) => item[key] ?? "");

                setRows(prevRows => {
                  const newRows = [...prevRows];
                  const updateRowVals = (labelSnippet: string, values: any[]) => {
                    const rIndex = newRows.findIndex(r => r.label.toLowerCase().includes(labelSnippet));
                    if (rIndex !== -1) {
                      newRows[rIndex] = {
                        ...newRows[rIndex],
                        values: values.map(String),
                        total: labelSnippet === 'cavity details' ? null : values.reduce((acc, v) => acc + (parseFloat(String(v)) || 0), 0)
                      };
                    }
                  };

                  updateRowVals('cavity details', newCavities);
                  updateRowVals('received', getVals('Received Quantity'));
                  updateRowVals('inspected', getVals('Inspected Quantity'));
                  updateRowVals('accepted', getVals('Accepted Quantity'));
                  updateRowVals('rejected', getVals('Rejected Quantity'));
                  updateRowVals('reason', getVals('Reason for rejection'));

                  return newRows;
                });
              }
            }

            setGroupMeta(prev => ({ ...prev, remarks: data.remarks || "" }));

          }
        } catch (error) {
          console.error("Failed to fetch machine shop data:", error);
          showAlert('error', 'Failed to load existing data.');
        }
      }
    };
    if (trialId) fetchData();
  }, [user, trialId]);


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
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;

      const newValues = r.values.map((v, i) => (i === colIndex ? value : v));
      const isCavityOrReason = r.label.toLowerCase().includes("cavity details") || r.label.toLowerCase().includes("reason");

      if (isCavityOrReason) {
        return { ...r, values: newValues };
      }

      const total = newValues.reduce((sum, val) => {
        const n = parseFloat(String(val).trim());
        return sum + (isNaN(n) ? 0 : n);
      }, 0);

      return { ...r, values: newValues, total };
    }));
  };

  const updateReasonFreeText = (id: string, text: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, freeText: text } : r)));
  };

  const resetAll = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setUserTime("");
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
      user_time: userTime || null,
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

    setSaving(true);

    if (user?.role === 'HOD' && trialId) {
      try {
        if (isEditing) {
          const trialIdParam = trialId;
          const payload = buildPayload();
          const receivedRow = rows[1];
          const inspectedRow = rows[2];
          const acceptedRow = rows[3];
          const rejectedRow = rows[4];
          const reasonRow = rows[5];

          const inspections: any[] = cavities.map((cav, idx) => {
            return {
              'Cavity Details': cav || (rows[0]?.values?.[idx] ?? ''),
              'Received Quantity': receivedRow?.values?.[idx] ?? null,
              'Inspected Quantity': inspectedRow?.values?.[idx] ?? null,
              'Accepted Quantity': acceptedRow?.values?.[idx] ?? null,
              'Rejected Quantity': rejectedRow?.values?.[idx] ?? null,
              'Reason for rejection': reasonRow?.values?.[idx] ?? null,
            };
          });

          const serverPayload = {
            trial_id: trialIdParam,
            inspection_date: payload.inspection_date,
            inspections: inspections,
            remarks: remarks || groupMeta.remarks || null,
          };

          await inspectionService.updateMachineShopInspection(serverPayload);
        }

        await approve({
          trial_id: trialId
        });

        await trialService.updateTrialStatus({
          trial_id: trialId,
          status: "CLOSED"
        });

        setPreviewSubmitted(true);
        showAlert('success', 'Department progress approved and Trial Closed successfully.');
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (err) {
        showAlert('error', 'Failed to approve. Please try again.');
        console.error(err);
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      const trialIdParam = trialId;

      const payload = buildPayload();
      const receivedRow = rows[1];
      const inspectedRow = rows[2];
      const acceptedRow = rows[3];
      const rejectedRow = rows[4];
      const reasonRow = rows[5];

      const inspections: any[] = cavities.map((cav, idx) => {
        return {
          'Cavity Details': cav || (rows[0]?.values?.[idx] ?? ''),
          'Received Quantity': receivedRow?.values?.[idx] ?? null,
          'Inspected Quantity': inspectedRow?.values?.[idx] ?? null,
          'Accepted Quantity': acceptedRow?.values?.[idx] ?? null,
          'Rejected Quantity': rejectedRow?.values?.[idx] ?? null,
          'Reason for rejection': reasonRow?.values?.[idx] ?? null,
        };
      });

      const serverPayload = {
        trial_id: trialIdParam,
        inspection_date: payload.inspection_date,
        inspections: inspections,
        remarks: remarks || groupMeta.remarks || null,
      };

      await inspectionService.submitMachineShopInspection(serverPayload);
      setPreviewSubmitted(true);
      showAlert('success', 'Machine shop inspection created successfully.');

      if (attachedFiles.length > 0) {
        try {
          // const uploadResults = await uploadFiles(
          //   attachedFiles,
          //   trialIdParam,
          //   "MC_SHOP_INSPECTION",
          //   user?.username || "system",
          //   additionalRemarks || ""
          // );
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
        }
      }

      if (trialId) {
        try {
          await updateDepartmentRole({
            trial_id: trialId,
            current_department_id: 8,
            username: user?.username || "user",
            role: "user",
            remarks: remarks || groupMeta.remarks || "Completed by user"
          });
        } catch (roleError) {
          console.error("Failed to update role progress:", roleError);
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error saving machine shop inspection:", err);
      showAlert('error', 'Failed to save machine shop inspection. Please try again.');
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

          <SaclHeader />

          <DepartmentHeader title="MACHINE SHOP INSPECTION" userIP={userIP} user={user} />

          <Common trialId={trialId} />

          <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
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
                  onChange={(e) => setDate(e.target.value)}
                  fullWidth
                  sx={{ bgcolor: 'white' }}
                  disabled={user?.role === 'HOD'}
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
                            disabled={user?.role === 'HOD' && !isEditing}
                          />
                          <IconButton size="small" onClick={() => removeColumn(i)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={user?.role === 'HOD' && !isEditing} >
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

                        {isReasonRow ? (
                          <TableCell colSpan={cavities.length + 1}>
                            <TextField
                              size="small"
                              fullWidth
                              multiline
                              rows={2}
                              placeholder="Cavity wise rejection reason..."
                              value={r.freeText ?? ""}
                              onChange={(e) => updateReasonFreeText(r.id, e.target.value)}
                              variant="outlined"
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: 'white' } }}
                            />
                          </TableCell>
                        ) : (
                          <>
                            {r.values.map((val, ci) => (
                              <TableCell key={ci}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={val ?? ""}
                                  onChange={(e) => updateCell(r.id, ci, e.target.value)}
                                  variant="outlined"
                                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, backgroundColor: 'white' } }}
                                  disabled={user?.role === 'HOD' && !isEditing}
                                />
                              </TableCell>
                            ))}
                            <TableCell sx={{ textAlign: 'center', fontWeight: 700, bgcolor: '#f1f5f9' }}>
                              {r.label.toLowerCase().includes("cavity details") ? "-" : (r.total !== null && r.total !== undefined ? r.total : "-")}
                            </TableCell>
                          </>
                        )}

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
                                disabled={user?.role === 'HOD' && !isEditing}
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
                                  disabled={user?.role === 'HOD' && !isEditing}
                                />
                                <label htmlFor="mcshop-attach-file">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    component="span"
                                    startIcon={<UploadFileIcon />}
                                    sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                                    disabled={user?.role === 'HOD' && !isEditing}
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
                                    disabled={user?.role === 'HOD' && !isEditing}
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
              disabled={user?.role === 'HOD' && !isEditing}
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
                disabled={user?.role === 'HOD' && !isEditing}
              />
            </Box>

            <ActionButtons
              onReset={resetAll}
              onSave={handleSaveAndContinue}
              loading={saving}
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

          </Paper>

          <PreviewModal
            open={previewMode && previewPayload}
            onClose={() => setPreviewMode(false)}
            onSubmit={handleFinalSave}
            onExport={handleExportPDF}
            title="Verify Inspection Data"
            subtitle="Machine Shop Inspection Report"
            submitted={previewSubmitted}
            isSubmitting={saving}
          >
            <Box sx={{ p: 4 }}>
              <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Machine Shop Inspection Report</Typography>
                  <Typography variant="body2" color="textSecondary">Date: {previewPayload?.inspection_date}</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <AlertMessage alert={alert} />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" color="textSecondary">LOG TIME</Typography>
                    <Typography variant="body1" fontWeight="bold">{previewPayload?.user_time || "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" color="textSecondary">GENERAL NOTES</Typography>
                    <Typography variant="body2">{previewPayload?.dimensional_report_remarks || "-"}</Typography>
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
              </Box>

              {previewSubmitted && (
                <Alert severity="success" sx={{ mt: 2 }}>Inspection data submitted successfully.</Alert>
              )}
            </Box>
          </PreviewModal>

          <Box className="print-section" sx={{ display: 'none' }}>
            <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>MACHINE SHOP INSPECTION REPORT</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">IP: {userIP}</Typography>
                {previewPayload && <Typography variant="body2">Date: {previewPayload.inspection_date}</Typography>}
              </Box>
            </Box>

            {previewPayload && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography><strong>Inspector:</strong> {previewPayload.user_name}</Typography>
                  <Typography><strong>Notes:</strong> {previewPayload.dimensional_report_remarks}</Typography>
                </Box>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Parameter</th>
                      {previewPayload.cavities.map((c: string, i: number) => (
                        <th key={i} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{c}</th>
                      ))}
                      <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPayload.rows.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{r.label}</td>
                        {r.freeText !== undefined && r.freeText !== null ? (
                          <td colSpan={previewPayload.cavities.length + 1} style={{ border: '1px solid black', padding: '8px' }}>
                            {r.freeText}
                          </td>
                        ) : (
                          <>
                            {r.values.map((v: any, j: number) => (
                              <td key={j} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                                {v === null ? "" : String(v)}
                              </td>
                            ))}
                            <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                              {r.label.toLowerCase().includes("cavity details") ? "" : (r.total !== null && r.total !== undefined ? r.total : "")}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid black' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Side Remarks</div>
                  <div>{previewPayload.right_remarks || '-'}</div>
                </div>
              </>
            )}
          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}