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

// Icons
import FactoryIcon from '@mui/icons-material/Factory';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from "@mui/icons-material/Close";
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
import DepartmentHeader from "./common/DepartmentHeader";
import { SpecInput, FileUploadSection, LoadingState, EmptyState, ActionButtons, FormSection, PreviewModal, Common } from './common';

interface SandTableProps {
  submittedData?: {
    selectedPart?: any;
    selectedPattern?: any;
    machine?: string;
    reason?: string;
    trialNo?: string;
    samplingDate?: string;
    mouldCount?: string;
    sampleTraceability?: string;
  };
  onSave?: (data: any) => void;
  onComplete?: () => void;
  fromPendingCards?: boolean;
}

function SandTable({ submittedData, onSave, onComplete, fromPendingCards }: SandTableProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));

  const [sandDate, setSandDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sandProps, setSandProps] = useState({
    tClay: "",
    aClay: "",
    vcm: "",
    loi: "",
    afs: "",
    gcs: "",
    moi: "",
    compactability: "",
    perm: "",
    remarks: ""
  });

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { alert, showAlert } = useAlert();
  const [userIP, setUserIP] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";

  useEffect(() => {
    const fetchData = async () => {
      const urlTrialId = new URLSearchParams(window.location.search).get('trial_id');
      if (user?.role === 'HOD' && urlTrialId) {
        try {
          const response = await inspectionService.getSandProperties(urlTrialId);
          if (response.success && response.data && response.data.length > 0) {
            const data = response.data[0];
            setSandDate(data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setSandProps({
              tClay: String(data.t_clay || ""),
              aClay: String(data.a_clay || ""),
              vcm: String(data.vcm || ""),
              loi: String(data.loi || ""),
              afs: String(data.afs || ""),
              gcs: String(data.gcs || ""),
              moi: String(data.moi || ""),
              compactability: String(data.compactability || ""),
              perm: String(data.permeability || ""),
              remarks: data.remarks || ""
            });
          }
        } catch (error) {
          console.error("Failed to fetch sand data:", error);
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
    setSandProps(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setSandProps({
      tClay: "", aClay: "", vcm: "", loi: "", afs: "",
      gcs: "", moi: "", compactability: "", perm: "", remarks: ""
    });
    setSandDate(new Date().toISOString().split('T')[0]);

    setSubmitted(false);
  };
  // Handle file uploads
  const handleAttachFiles = (newFiles: File[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  // Remove a selected file
  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndContinue = () => {
    setPreviewMode(true);
  };

  const handleFinalSave = async () => {

    setLoading(true);
    try {
      const trialId = new URLSearchParams(window.location.search).get('trial_id') || "trial_id";

      if (user?.role === 'HOD' && trialId) {
        const payload = {
          trial_id: trialId,
          date: sandDate,
          t_clay: Number((sandProps as any).tClay) || 0,
          a_clay: Number((sandProps as any).aClay) || 0,
          vcm: Number((sandProps as any).vcm) || 0,
          loi: Number((sandProps as any).loi) || 0,
          afs: Number((sandProps as any).afs) || 0,
          gcs: Number((sandProps as any).gcs) || 0,
          moi: Number((sandProps as any).moi) || 0,
          compactability: Number((sandProps as any).compactability) || 0,
          permeability: Number((sandProps as any).perm) || 0,
          remarks: (sandProps as any).remarks || ""
        };

        if (isEditing) {
          await inspectionService.updateSandProperties(payload);
        }

        const approvalPayload = {
          trial_id: trialId,
          next_department_id: 6,
          username: user.username,
          role: user.role,
          remarks: "Approved by HOD"
        };

        await updateDepartment(approvalPayload);
        setSubmitted(true);
        showAlert('success', 'Department progress approved successfully.');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const payload = {
          trial_id: trialId,
          date: sandDate,
          t_clay: Number((sandProps as any).tClay) || 0,
          a_clay: Number((sandProps as any).aClay) || 0,
          vcm: Number((sandProps as any).vcm) || 0,
          loi: Number((sandProps as any).loi) || 0,
          afs: Number((sandProps as any).afs) || 0,
          gcs: Number((sandProps as any).gcs) || 0,
          moi: Number((sandProps as any).moi) || 0,
          compactability: Number((sandProps as any).compactability) || 0,
          permeability: Number((sandProps as any).perm) || 0,
          remarks: (sandProps as any).remarks || ""
        };

        await inspectionService.submitSandProperties(payload);

        if (attachedFiles.length > 0) {
          try {
            // const uploadResults = await uploadFiles(
            //   attachedFiles,
            //   trialId,
            //   "SAND_PROPERTIES",
            //   user?.username || "system",
            //   "SAND_PROPERTIES"
            // );

            // const failures = uploadResults.filter(r => !r.success);
            // if (failures.length > 0) {
            //   console.error("Some files failed to upload:", failures);
            // }
          } catch (uploadError) {
            console.error("File upload error:", uploadError);
          }
        }

        if (trialId) {
          try {
            await updateDepartmentRole({
              trial_id: trialId,
              current_department_id: 4,
              username: user?.username || "user",
              role: "user",
              remarks: "Completed by user"
            });
          } catch (roleError) {
            console.error("Failed to update role progress:", roleError);
            showAlert('error', 'Failed to update role progress. Please try again.');
          }
        }
        setSubmitted(true);
        showAlert('success', 'Sand properties created and department progress updated successfully.');

        navigate('/dashboard');
      }
    } catch (err) {
      showAlert('error', user?.role === 'HOD' ? 'Failed to approve. Please try again.' : 'Failed to save sand properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => { window.print(); };

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
          {/* Header Bar */}

          <DepartmentHeader title="SAND PROPERTIES" userIP={userIP} user={user} />

          <Common trialId={trialId} />

          <AlertMessage alert={alert} />

          {/* Main Content Card */}
          <Paper sx={{ overflow: 'hidden', border: `2px solid ${COLORS.border}` }}>

            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 1000, borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={10} sx={{ backgroundColor: COLORS.headerBg, textAlign: 'left', py: 1.5, borderBottom: `1px solid ${COLORS.border}` }}>
                      <Typography variant="h6" sx={{ color: 'black', textTransform: 'uppercase', fontSize: '1rem' }}>SAND PROPERTIES</Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={9} sx={{ borderRight: 'none', backgroundColor: '#fff' }}></TableCell>
                    <TableCell
                      colSpan={1}
                      sx={{
                        backgroundColor: '#f1f5f9',
                        borderLeft: `1px solid ${COLORS.border}`,
                        minWidth: 250,
                        p: 1,
                        borderBottom: `1px solid ${COLORS.headerBg}`
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'black' }}>Date</Typography>
                        <TextField
                          type="date"
                          size="small"
                          fullWidth
                          value={sandDate}
                          onChange={(e) => setSandDate(e.target.value)}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    {["T.Clay", "A.Clay", "VCM", "LOI", "AFS", "G.C.S", "MOI", "Compactability", "Perm"].map((header) => (
                      <TableCell
                        key={header}
                        width="9%"
                        sx={{
                          backgroundColor: '#f1f5f9',
                          color: 'black',
                          fontWeight: 600,
                          textAlign: 'center',
                          borderBottom: `1px solid ${COLORS.headerBg}`
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                    <TableCell
                      width="19%"
                      sx={{
                        backgroundColor: '#f1f5f9',
                        color: 'black',
                        fontWeight: 600,
                        textAlign: 'center',
                        borderBottom: `1px solid ${COLORS.headerBg}`
                      }}
                    >
                      Remarks
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow>
                    {["tClay", "aClay", "vcm", "loi", "afs", "gcs", "moi", "compactability", "perm"].map((key) => (
                      <TableCell key={key} sx={{ p: 2, verticalAlign: 'middle' }}>
                        <SpecInput
                          value={(sandProps as any)[key]}
                          onChange={(e: any) => handleChange(key, e.target.value)}
                          disabled={user?.role === 'HOD' && !isEditing}
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={{ p: 1 }}>
                      <TextField
                        multiline
                        rows={3}
                        fullWidth
                        variant="outlined"
                        placeholder="Enter remarks..."
                        value={sandProps.remarks}
                        onChange={(e) => handleChange("remarks", e.target.value)}
                        disabled={user?.role === 'HOD' && !isEditing}
                        sx={{ bgcolor: '#fff' }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ p: 3, mt: 4, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}` }}>
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

            <Box sx={{ p: 3, display: "flex", flexDirection: { xs: 'column', sm: 'row' }, justifyContent: "space-between", alignItems: "flex-end", gap: 2, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}` }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/dashboard')}
                sx={{ minWidth: 180, fontWeight: 600 }}
              >
                Back to Dashboard
              </Button>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                {user?.role !== 'HOD' && (
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    fullWidth={isMobile}
                    sx={{
                      color: COLORS.primary,
                      borderColor: COLORS.primary,
                      borderWidth: '1.5px',
                      '&:hover': {
                        borderColor: COLORS.primary,
                        borderWidth: '1.5px',
                        bgcolor: '#f3f4f6'
                      }
                    }}
                  >
                    Reset Form
                  </Button>
                )}

                {user?.role === 'HOD' && (
                  <Button
                    variant="outlined"
                    onClick={() => setIsEditing(!isEditing)}
                    sx={{ color: COLORS.secondary, borderColor: COLORS.secondary }}
                  >
                    {isEditing ? "Cancel Edit" : "Edit Details"}
                  </Button>
                )}

                <Button
                  variant="contained"
                  onClick={handleSaveAndContinue}
                  fullWidth={isMobile}
                  startIcon={user?.role === 'HOD' ? <CheckCircleIcon /> : <SaveIcon />}
                  sx={{
                    bgcolor: COLORS.secondary,
                    color: 'white',
                    '&:hover': { bgcolor: '#c2410c' }
                  }}
                >
                  {user?.role === 'HOD' ? 'Approve' : 'Save & Continue'}
                </Button>
              </Box>
            </Box>

          </Paper>


          <PreviewModal
            open={previewMode}
            onClose={() => setPreviewMode(false)}
            onSubmit={handleFinalSave}
            onExport={handleExportPDF}
            title="Verify Sand Properties"
            subtitle="Review your sand test data"
            submitted={submitted}
            isSubmitting={loading}
          >
            <Box sx={{ p: 4 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', fontFamily: appTheme.typography.fontFamily, fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.headerBg }}>
                    <th colSpan={10} style={{ textAlign: 'left', padding: '10px', border: '1px solid black' }}>SAND PROPERTIES:</th>
                  </tr>
                  <tr>
                    <td colSpan={9} style={{ border: '1px solid black', borderRight: 'none', backgroundColor: '#fff' }}></td>
                    <td style={{ border: '1px solid black', padding: '10px', backgroundColor: COLORS.headerBg }}>
                      <strong>Date:</strong> {sandDate}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: COLORS.headerBg, textAlign: 'center' }}>
                    {["T.Clay", "A.Clay", "VCM", "LOI", "AFS", "G.C.S", "MOI", "Comp.", "Perm", "Remarks"].map((h, i) => (
                      <th key={i} style={{ border: '1px solid black', padding: '8px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ textAlign: 'center' }}>
                    {["tClay", "aClay", "vcm", "loi", "afs", "gcs", "moi", "compactability", "perm"].map((k) => (
                      <td key={k} style={{ border: '1px solid black', padding: '12px' }}>
                        {(sandProps as any)[k] || "-"}
                      </td>
                    ))}
                    <td style={{ border: '1px solid black', padding: '12px', textAlign: 'left' }}>
                      {sandProps.remarks || "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* Attached Files in Preview */}
              {attachedFiles.length > 0 && (
                <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1, bgcolor: "white" }}>
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

        </Container>

        {/* PRINT LAYOUT */}
        <Box className="print-section" sx={{ display: 'none', fontFamily: appTheme.typography.fontFamily }}>
          <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>FOUNDRY LAB REPORT</Typography>
              <Typography variant="body1">Sand Properties Specification Sheet</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2">Report Date: {new Date().toLocaleDateString()}</Typography>
              <Typography variant="body2">IP: {userIP}</Typography>
            </Box>
          </Box>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.headerBg }}>
                <th colSpan={10} style={{ textAlign: 'left', padding: '10px', border: '1px solid black', fontWeight: 'bold' }}>SAND PROPERTIES:</th>
              </tr>
              <tr>
                <td colSpan={9} style={{ border: '1px solid black', borderRight: 'none', backgroundColor: '#fff' }}></td>
                <td style={{ border: '1px solid black', padding: '10px', backgroundColor: COLORS.headerBg }}>
                  <strong>Date:</strong> {sandDate}
                </td>
              </tr>
              <tr style={{ backgroundColor: COLORS.headerBg, textAlign: 'center' }}>
                {["T.Clay", "A.Clay", "VCM", "LOI", "AFS", "G.C.S", "MOI", "Compactability", "Perm", "Other Remarks"].map((h, i) => (
                  <th key={i} style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ textAlign: 'center', height: '60px', verticalAlign: 'middle' }}>
                {["tClay", "aClay", "vcm", "loi", "afs", "gcs", "moi", "compactability", "perm"].map((k) => (
                  <td key={k} style={{ border: '1px solid black', padding: '8px' }}>
                    {(sandProps as any)[k]}
                  </td>
                ))}
                <td style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>
                  {sandProps.remarks}
                </td>
              </tr>
            </tbody>
          </table>
          {/* Attached Files in Print */}
          {attachedFiles.length > 0 && (
            <div style={{ marginTop: "25px" }}>
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

      </Box>
    </ThemeProvider >
  );
}

export default SandTable;
