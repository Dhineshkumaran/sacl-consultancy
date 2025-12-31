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
  IconButton,
  useMediaQuery,
  GlobalStyles,
  Divider
} from "@mui/material";

import FactoryIcon from '@mui/icons-material/Factory';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from "@mui/icons-material/Close";
import ScienceIcon from '@mui/icons-material/Science';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";
import NoAccess from "./common/NoAccess";
import { ipService } from '../services/ipService';
import { inspectionService } from '../services/inspectionService';
import { uploadFiles } from '../services/fileUploadHelper';
import { COLORS, appTheme } from '../theme/appTheme';
import { useAlert } from '../hooks/useAlert';
import { AlertMessage } from './common/AlertMessage';
import { fileToMeta, validateFileSizes } from '../utils';
import type { InspectionRow, GroupMetadata } from '../types/inspection';
import DepartmentHeader from "./common/DepartmentHeader";
import { SpecInput, FileUploadSection, LoadingState, EmptyState, ActionButtons, FormSection, PreviewModal, Common, DocumentViewer } from './common';

function MouldingTable() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));
  const { alert, showAlert } = useAlert();
  const [mouldState, setMouldState] = useState({
    thickness: "",
    compressability: "",
    pressure: "",
    hardness: "",
    remarks: ""
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [mouldCorrectionLoading, setMouldCorrectionLoading] = useState(false);
  const [mouldCorrectionSubmitted, setMouldCorrectionSubmitted] = useState(false);
  const [mouldDate, setMouldDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [previewMode, setPreviewMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userIP, setUserIP] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";

  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'HOD' && trialId) {
        try {
          const response = await inspectionService.getMouldingCorrection(trialId);
          if (response.success && response.data && response.data.length > 0) {
            const data = response.data[0];
            setMouldState({
              thickness: String(data.mould_thickness || ""),
              compressability: String(data.compressability || ""),
              pressure: String(data.squeeze_pressure || ""),
              hardness: String(data.mould_hardness || ""),
              remarks: data.remarks || ""
            });
          }
        } catch (error) {
          console.error("Failed to fetch moulding data:", error);
          showAlert('error', 'Failed to load existing data.');
        }
      }
    };
    if (trialId) fetchData();
  }, [user, trialId]);

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchIP();
  }, []);


  const handleChange = (field: string, value: string) => {
    setMouldState(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setMouldState({
      thickness: "", compressability: "", pressure: "", hardness: "",
      remarks: ""
    });
    setSubmitted(false);
  };
  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];

    const validation = validateFileSizes(files);
    if (!validation.isValid) {
      validation.errors.forEach((error: string) => showAlert('error', error));
      e.target.value = '';
      return;
    }

    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleSaveAndContinue = () => {
    setPreviewMode(true);
  };

  const handleExportPDF = () => { window.print(); };

  const GridValueBox = ({ label, value }: { label: string, value: string }) => (
    <Box sx={{
      p: 2,
      borderRadius: 2,
      border: `1px solid ${COLORS.border}`,
      textAlign: 'center',
      bgcolor: 'white',
      flex: 1
    }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
      <Typography variant="h6" sx={{ fontSize: '1rem' }}>{value || "-"}</Typography>
    </Box>
  );

  const postMouldCorrection = async (payload: {
    mould_thickness: string;
    compressability: string;
    squeeze_pressure: string;
    mould_hardness: string;
    remarks: string;
    trial_id?: string;
  }) => {
    setMouldCorrectionLoading(true);
    try {
      const body = { ...payload, trial_id: 'Sample1', date: mouldDate };
      await inspectionService.submitMouldingCorrection(body);
      setMouldCorrectionSubmitted(true);
      return { ok: true, data: {} };
    } catch (err) {
      showAlert('error', 'Failed to save moulding details. Please try again.');
      return { ok: false, message: 'Failed to save mould correction' };
    } finally {
      setMouldCorrectionLoading(false);
    }
  };

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      if (user?.role === 'HOD' && trialId) {

        if (isEditing) {
          const payload = {
            mould_thickness: mouldState.thickness,
            compressability: mouldState.compressability,
            squeeze_pressure: mouldState.pressure,
            mould_hardness: mouldState.hardness,
            remarks: mouldState.remarks,
            trial_id: trialId
          };
          await inspectionService.updateMouldingCorrection(payload);
        }

        const approvalPayload = {
          trial_id: trialId,
          next_department_id: 7,
          username: user.username,
          current_form: "METALLURGICAL_INSPECTION",
          role: user.role,
          remarks: "Approved by HOD"
        };

        await updateDepartment(approvalPayload);
        showAlert('success', 'Department progress approved successfully.');
        setSubmitted(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {

        const payload = {
          mould_thickness: mouldState.thickness,
          compressability: mouldState.compressability,
          squeeze_pressure: mouldState.pressure,
          mould_hardness: mouldState.hardness,
          remarks: mouldState.remarks,
          trial_id: trialId,
          date: mouldDate
        };

        await inspectionService.submitMouldingCorrection(payload);

        if (attachedFiles.length > 0) {
          try {
            const uploadResults = await uploadFiles(
              attachedFiles,
              trialId || "trial_id",
              "MOULDING",
              user?.username || "system",
              "MOULDING"
            );

            const failures = uploadResults.filter(r => !r.success);
            if (failures.length > 0) {
              console.error("Some files failed to upload:", failures);
            }
          } catch (uploadError) {
            console.error("File upload error:", uploadError);
          }
        }

        if (trialId) {
          await updateDepartmentRole({
            trial_id: trialId,
            current_department_id: 6,
            username: user?.username || "user",
            role: "user",
            remarks: "Completed by user"
          });
          showAlert('success', 'Moulding details created and department progress updated successfully.');
          setSubmitted(true);
        }
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error saving moulding details:", error);
      showAlert('error', 'Failed to save details.');
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
          <DepartmentHeader title="MOULDING DETAILS" userIP={userIP} user={user} />

          <Common trialId={trialId} />


          <Paper sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <EngineeringIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>MOULD CORRECTION DETAILS</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.primary }}>Date</Typography>
                <TextField
                  type="date"
                  size="small"
                  hiddenLabel
                  value={mouldDate}
                  onChange={(e) => setMouldDate(e.target.value)}
                  sx={{ bgcolor: 'white', borderRadius: 1, width: 140, "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" } }}
                  disabled={user?.role === 'HOD' && !isEditing}
                />
              </Box>
            </Box>
            <Divider sx={{ mb: 2, borderColor: COLORS.blueHeaderText, opacity: 0.3 }} />

            <Box sx={{ overflowX: "auto", mb: 4 }}>
              <Table size="small" sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={4} sx={{ bgcolor: COLORS.blueHeaderBg, color: COLORS.blueHeaderText, borderBottom: 'none' }}>
                      <Typography variant="subtitle2" sx={{ color: 'inherit', letterSpacing: 1 }}>Moulding Parameters</Typography>
                    </TableCell>
                    <TableCell colSpan={1} sx={{ bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText, borderBottom: 'none' }}>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Mould Thickness</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Compressability</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Squeeze Pressure</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary, borderRight: `2px solid ${COLORS.border}` }}>Mould Hardness</TableCell>

                    <TableCell width="40%" sx={{ bgcolor: '#fff7ed', color: COLORS.textSecondary }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell><SpecInput value={mouldState.thickness} onChange={(e: any) => handleChange('thickness', e.target.value)} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                    <TableCell><SpecInput value={mouldState.compressability} onChange={(e: any) => handleChange('compressability', e.target.value)} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                    <TableCell><SpecInput value={mouldState.pressure} onChange={(e: any) => handleChange('pressure', e.target.value)} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                    <TableCell sx={{ borderRight: `2px solid ${COLORS.border}` }}>
                      <SpecInput value={mouldState.hardness} onChange={(e: any) => handleChange('hardness', e.target.value)} disabled={user?.role === 'HOD' && !isEditing} />
                    </TableCell>

                    <TableCell>
                      <SpecInput
                        value={mouldState.remarks}
                        onChange={(e: any) => handleChange('remarks', e.target.value)}
                        placeholder="--"
                        disabled={user?.role === 'HOD' && !isEditing}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", color: COLORS.primary }}
              >
                Attach PDF / Image Files
              </Typography>

              <Button
                variant="outlined"
                component="label"
                sx={{
                  bgcolor: "white",
                  borderStyle: "dashed",
                  py: 1.5,
                  px: 3,
                  fontWeight: 600,
                }}
              >
                Attach PDF
                <input
                  type="file"
                  hidden
                  multiple
                  accept="application/pdf,image/*"
                  onChange={handleAttachFiles}
                />
              </Button>

              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {attachedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => removeAttachedFile(index)}
                    sx={{
                      bgcolor: "white",
                      border: `1px solid ${COLORS.border}`,
                      fontSize: "0.8rem"
                    }}
                  />
                ))}
              </Box>
              <DocumentViewer trialId={trialId || ""} category="MOULDING" />
            </Box>


            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                <ActionButtons
                  {...(user?.role !== 'HOD' ? { onReset: handleReset } : {})}
                  onSave={handleSaveAndContinue}
                  showSubmit={false}
                  saveLabel={user?.role === 'HOD' ? 'Approve' : 'Save & Continue'}
                  saveIcon={user?.role === 'HOD' ? <CheckCircleIcon /> : <SaveIcon />}
                >
                  {user?.role === 'HOD' && (
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditing(!isEditing)}
                      sx={{ color: COLORS.secondary, borderColor: COLORS.secondary, mr: 2 }}
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
            onExport={handleExportPDF}
            title="Verify Moulding Details"
            subtitle="Review your moulding parameters"
            submitted={submitted}
            isSubmitting={loading}
          >
            <Box sx={{ p: 4 }}>

              <Typography variant="caption" sx={{ color: COLORS.blueHeaderText, mb: 2, display: 'block' }}>MOULDING PARAMETERS</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 3 }}><GridValueBox label="Thickness" value={mouldState.thickness} /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><GridValueBox label="Compressability" value={mouldState.compressability} /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><GridValueBox label="Pressure" value={mouldState.pressure} /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><GridValueBox label="Hardness" value={mouldState.hardness} /></Grid>
              </Grid>

              <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>REMARKS & LOG</Typography>
              <Box sx={{
                p: 3,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: `1px solid ${COLORS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 3
              }}>
                <Box flex={2}>
                  <Typography variant="caption" color="textSecondary" display="block">REMARKS</Typography>
                  <Typography variant="body2">{mouldState.remarks || "No remarks entered."}</Typography>
                </Box>
              </Box>
              {attachedFiles.length > 0 && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: "white",
                    borderRadius: 2,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                    ATTACHED FILES
                  </Typography>

                  {attachedFiles.map((file, i) => (
                    <Typography key={i} variant="body2">• {file.name}</Typography>
                  ))}
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <AlertMessage alert={alert} />
              </Box>
            </Box>
          </PreviewModal>
          <Box className="print-section" sx={{ display: 'none', fontFamily: appTheme.typography.fontFamily }}>
            <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>FOUNDRY SAMPLE CARD</Typography>
                <Typography variant="body1">Moulding Correction Report</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">Date: {new Date().toLocaleDateString()}</Typography>
                <Typography variant="body2">IP: {userIP}</Typography>
              </Box>
            </Box>

            <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Moulding Details</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th colSpan={4} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Moulding Parameters</th>
                  <th colSpan={1} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Log Data</th>
                </tr>
                <tr style={{ backgroundColor: '#f9f9f9' }}>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Thickness</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Compressability</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Pressure</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Hardness</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.thickness}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.compressability}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.pressure}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.hardness}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.remarks || "-"}</td>
                </tr>
              </tbody>
            </table>
            {/* Attached Files - Print Version */}
            {attachedFiles.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{
                  margin: 0,
                  paddingBottom: "5px",
                  borderBottom: "1px solid #999"
                }}>
                  Attached Files
                </h3>

                <ul style={{ marginTop: "5px" }}>
                  {attachedFiles.map((file, index) => (
                    <li key={index} style={{ fontSize: "14px" }}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

          </Box>

        </Container>
      </Box >
    </ThemeProvider >
  );
}

export default MouldingTable;
