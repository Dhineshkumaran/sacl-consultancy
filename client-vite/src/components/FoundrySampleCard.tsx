import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  ThemeProvider,
  createTheme,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  Container,
  Card,
  CardContent,
  InputAdornment,
  useMediaQuery,
  GlobalStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ScienceIcon from '@mui/icons-material/Science';
import ConstructionIcon from '@mui/icons-material/Construction';
import RefreshIcon from '@mui/icons-material/Refresh';
import FactoryIcon from '@mui/icons-material/Factory';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from '@mui/icons-material/Delete';
import SaclHeader from "./common/SaclHeader";
import { appTheme, COLORS } from "../theme/appTheme";
import { trialService } from "../services/trialService";
import { ipService } from "../services/ipService";
import { uploadFiles } from '../services/fileUploadHelper';
import { specificationService } from "../services/specificationService";
import departmentProgressService, { updateDepartment, updateDepartmentRole } from "../services/departmentProgressService";
import { validateFileSizes, fileToBase64 } from '../utils/fileHelpers';
import { useAlert } from '../hooks/useAlert';
import { AlertMessage } from './common/AlertMessage';
import { useAuth } from '../context/AuthContext';
import DepartmentHeader from "./common/DepartmentHeader";
import { LoadingState, EmptyState, ActionButtons, FileUploadSection, PreviewModal } from './common';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface PartData {
  id: number;
  pattern_code: string;
  part_name: string;
  material_grade: string;
  chemical_composition: any;
  micro_structure: string;
  tensile: string;
  impact?: string;
  hardness: string;
  xray: string;
  mpi?: string;
  created_at: string;
}

const parseChemicalComposition = (composition: any) => {
  const blank = { c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: "" };
  if (!composition) return blank;
  let obj: any = composition;
  if (typeof composition === "string") {
    try { obj = JSON.parse(composition); } catch (e) { return { ...blank, c: composition }; }
  }
  if (typeof obj !== "object" || obj === null) return blank;
  const map: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (typeof k === "string") { map[k.toLowerCase().replace(/\s+/g, "")] = obj[k]; }
  });
  const siKeyCandidates = ["si", "silicon"];
  const getFirst = (keys: string[]) => {
    for (const k of keys) {
      if (map[k] !== undefined && map[k] !== null) return String(map[k]);
    }
    return "";
  };
  return {
    c: getFirst(["c"]), si: getFirst(siKeyCandidates), mn: getFirst(["mn"]), p: getFirst(["p"]),
    s: getFirst(["s"]), mg: getFirst(["mg"]), cr: getFirst(["cr"]), cu: getFirst(["cu"]),
  };
};

const parseTensileData = (tensile: string) => {
  const lines = tensile ? tensile.split("\n") : [];
  let tensileStrength = "", yieldStrength = "", elongation = "", impactCold = "", impactRoom = "";
  lines.forEach((line) => {
    const cleanLine = line.trim();
    if (cleanLine.match(/\d+\s*(MPa|N\/mm²)/) || cleanLine.includes("Tensile") || cleanLine.match(/[≥>]\s*\d+/)) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/); if (match && !tensileStrength) tensileStrength = `${match[1]}${match[2]}`;
    }
    if (cleanLine.includes("Yield")) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/); if (match && !yieldStrength) yieldStrength = `${match[1]}${match[2]}`;
    }
    if (cleanLine.includes("Elongation") || cleanLine.includes("%")) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/); if (match && !elongation) elongation = `${match[1]}${match[2]}`;
    }
  });
  return { tensileStrength, yieldStrength, elongation, impactCold, impactRoom };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure ? microstructure.split("\n") : [];
  let nodularity = "", pearlite = "", carbide = "";
  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();
    if (cleanLine.includes("nodularity")) { const match = cleanLine.match(/([≥≤]?)\s*(\d+)/); if (match) nodularity = `${match[1]}${match[2]}`; }
    if (cleanLine.includes("pearlite")) { const match = cleanLine.match(/([≥≤<>]?)\s*(\d+)/); if (match) pearlite = `${match[1]}${match[2]}`; }
    if (cleanLine.includes("carbide")) { const match = cleanLine.match(/([≥≤<>]?)\s*(\d+)/); if (match) carbide = `${match[1]}${match[2]}`; }
  });
  return { nodularity: nodularity || "--", pearlite: pearlite || "--", carbide: carbide || "--" };
};

const parseHardnessData = (hardness: string) => {
  const lines = hardness ? hardness.split("\n") : [];
  let surface = "", core = "";
  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();
    if (cleanLine.includes("surface")) { const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/); if (match) surface = match[1]; }
    else if (cleanLine.includes("core")) { const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/); if (match) core = match[1]; }
    else if (!surface) { const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/); if (match) surface = match[1]; }
  });
  return { surface: surface || "--", core: core || "--" };
};

const SectionHeader = ({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${color}`, width: '100%' }}>
    <Box sx={{ color: color, display: "flex" }}>{icon}</Box>
    <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
      {title}
    </Typography>
  </Box>
);

const SpecInput = (props: any) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    fullWidth
    inputProps={{
      ...props.inputProps,
      style: { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' }
    }}
    sx={{
      minWidth: "70px",
      "& .MuiOutlinedInput-root": { backgroundColor: props.readOnly ? "#f8fafc" : "#fff" }
    }}
  />
);

function FoundrySampleCard() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));

  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PartData | null>(null);
  const [trialId, setTrialId] = useState<string>("");
  const [trialNo, setTrialNo] = useState<string>("");
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialLoading, setTrialLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { alert, showAlert } = useAlert();

  const MACHINES = ["DISA - 1", "DISA - 2", "DISA - 3", "DISA - 4", "DISA - 5"];
  const SAMPLING_REASONS = ["First trial", "Metallurgical Trial", "Others"];
  const [samplingDate, setSamplingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [mouldCount, setMouldCount] = useState("");
  const [machine, setMachine] = useState("");
  const [reason, setReason] = useState("");
  const [sampleTraceability, setSampleTraceability] = useState("");
  const [toolingModification, setToolingModification] = useState("");
  const [toolingFiles, setToolingFiles] = useState<File[]>([]);
  const handleToolingFilesChange = (newFiles: File[]) => {
    setToolingFiles(prev => [...prev, ...newFiles]);
  };
  const [patternDataSheetFiles, setPatternDataSheetFiles] = useState<File[]>([]);
  const handlePatternDataSheetFilesChange = (newFiles: File[]) => {
    setPatternDataSheetFiles(prev => [...prev, ...newFiles]);
  };
  const removePatternDataSheetFile = (index: number) => setPatternDataSheetFiles(prev => prev.filter((_, i) => i !== index));
  const removeToolingFile = (index: number) => setToolingFiles(prev => prev.filter((_, i) => i !== index));

  const [remarks, setRemarks] = useState("");

  const [mouldCorrections, setMouldCorrections] = useState<any[]>([
    { id: 1, compressibility: "", squeezePressure: "", fillerSize: "" },
  ]);
  const handleMouldCorrectionChange = (id: number, field: string, value: string) => {
    setMouldCorrections(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addMouldCorrectionRow = () => setMouldCorrections(prev => [...prev, { id: Date.now(), compressibility: "", squeezePressure: "", fillerSize: "" }]);
  const removeMouldCorrectionRow = (id: number) => setMouldCorrections(prev => prev.filter(r => r.id !== id));

  const [chemState, setChemState] = useState({ c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: "" });
  const [tensileState, setTensileState] = useState({ tensileStrength: "", yieldStrength: "", elongation: "", impactCold: "", impactRoom: "" });
  const [microState, setMicroState] = useState({ nodularity: "", pearlite: "", carbide: "" });
  const [hardnessState, setHardnessState] = useState({ surface: "", core: "" });

  const [submittedData, setSubmittedData] = useState<any>(null);
  const [editingOnlyMetallurgical, setEditingOnlyMetallurgical] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState(false);
  const [assigned, setAssigned] = useState<boolean | null>(null);

  const trialIdFromUrl = new URLSearchParams(window.location.search).get('trial_id') || "";

  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [userIP, setUserIP] = useState<string>("");



  useEffect(() => {
    if (previewMessage) { const t = setTimeout(() => setPreviewMessage(null), 4000); return () => clearTimeout(t); }
  }, [previewMessage]);

  useEffect(() => {
    const fetchTrialDataForHOD = async () => {
      if (user?.role === 'HOD' && trialIdFromUrl) {
        try {
          const response = await trialService.getTrialById(trialIdFromUrl);
          if (response && response.data) {
            const data = response.data;
            setTrialId(data.trial_id || trialIdFromUrl);
            setTrialNo(data.trial_id?.split('-').pop() || '');
            setSamplingDate(data.date_of_sampling || new Date().toISOString().split("T")[0]);
            setMouldCount(data.no_of_moulds || '');
            setMachine(data.disa || '');
            setReason(data.reason_for_sampling || '');
            setSampleTraceability(data.sample_traceability && data.sample_traceability !== 'null' ? data.sample_traceability : '');
            setToolingModification(data.tooling_modification && data.tooling_modification !== 'null' ? data.tooling_modification : '');
            setRemarks(data.remarks && data.remarks !== 'null' ? data.remarks : '');

            const comp = typeof data.chemical_composition === 'string'
              ? JSON.parse(data.chemical_composition)
              : data.chemical_composition || {};
            setChemState({
              c: comp.c || "", si: comp.si || "", mn: comp.mn || "",
              p: comp.p || "", s: comp.s || "", mg: comp.mg || "",
              cr: comp.cr || "", cu: comp.cu || ""
            });

            const micro = typeof data.micro_structure === 'string'
              ? JSON.parse(data.micro_structure)
              : data.micro_structure || {};
            setMicroState({
              nodularity: micro.nodularity || "",
              pearlite: micro.pearlite || "",
              carbide: micro.carbide || ""
            });

            const tensile = typeof data.tensile === 'string'
              ? JSON.parse(data.tensile)
              : data.tensile || {};
            setTensileState({
              tensileStrength: tensile.tensileStrength || "",
              yieldStrength: tensile.yieldStrength || "",
              elongation: tensile.elongation || "",
              impactCold: tensile.impactCold || "",
              impactRoom: tensile.impactRoom || ""
            });

            const hardness = typeof data.hardness === 'string'
              ? JSON.parse(data.hardness)
              : data.hardness || {};
            setHardnessState({
              surface: hardness.surface || "",
              core: hardness.core || ""
            });

            if (data.mould_correction) {
              const mouldCorr = typeof data.mould_correction === 'string'
                ? JSON.parse(data.mould_correction)
                : data.mould_correction;
              if (Array.isArray(mouldCorr) && mouldCorr.length > 0) {
                setMouldCorrections(mouldCorr.map((m: any, i: number) => ({ id: i + 1, ...m })));
              }
            }

            const matchingPart = masterParts.find(p => p.part_name === data.part_name);
            if (matchingPart) {
              setSelectedPart(matchingPart);
              setSelectedPattern(matchingPart);
            }
            setAssigned(true);
          }
        } catch (error) {
          console.error("Failed to fetch trial data for HOD:", error);
          showAlert("error", "Failed to load existing trial data.");
          setAssigned(false);
        }
      } else if (user?.role === 'HOD') {
        setAssigned(false);
      }
    };
    if (trialIdFromUrl && masterParts.length > 0) fetchTrialDataForHOD();
  }, [user, trialIdFromUrl, masterParts]);

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchIP();
  }, []);

  useEffect(() => {
    const getMasterParts = async () => {
      try {
        setLoading(true);
        const parts = await trialService.getMasterList();
        setMasterParts(parts);
      } catch (e) {
        setMasterParts([]);
        showAlert("error", "Failed to load master parts.");
      } finally {
        setLoading(false);
      }
    };
    getMasterParts();
  }, []);

  useEffect(() => {
    if (selectedPart) {
      setSelectedPattern(selectedPart);
      setChemState(parseChemicalComposition(selectedPart.chemical_composition));
      setTensileState(parseTensileData(selectedPart.tensile));
      setMicroState(parseMicrostructureData(selectedPart.micro_structure));
      setHardnessState(parseHardnessData(selectedPart.hardness));
    } else { setSelectedPattern(null); }
  }, [selectedPart]);

  const fetchTrialId = async () => {
    if (!selectedPart) return;
    setTrialLoading(true);
    try {
      const json = await trialService.getTrialIdByPartName(selectedPart.part_name);
      const trialId = (json && (json.trialId || json.data)) as string | undefined;
      if (trialId) {
        setTrialId(trialId);
        const formattedTrialId = trialId.includes('-') ? trialId.split('-').pop() : trialId;
        setTrialNo(formattedTrialId || "");
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      console.warn("Using fallback trial ID", error);
      setTrialNo(`${Date.now()}`);
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => { if (selectedPart) fetchTrialId(); else setTrialNo(""); }, [selectedPart]);

  const handlePartChange = (v: PartData | null) => { setSelectedPart(v); };
  const handlePatternChange = (v: PartData | null) => { setSelectedPattern(v); if (v) setSelectedPart(v); };

  const handleExportPDF = () => {
    if (!submitted) return;
    window.print();
  };

  const handleSaveAndContinue = () => {
    if (!selectedPart) { showAlert("error", "Please select a Part Name first."); return; }
    const payload = {
      trial_id: trialId,
      pattern_code: selectedPart.pattern_code,
      part_name: selectedPart.part_name,
      material_grade: selectedPart.material_grade,
      date_of_sampling: samplingDate,
      status: "CREATED",
      current_department_id: 3,
      no_of_moulds: mouldCount,
      reason_for_sampling: reason,
      sample_traceability: sampleTraceability,
      mould_correction: mouldCorrections,
      disa: machine,
      initiated_by: user?.username || "Unknown",
      tooling_modification: toolingModification,
      remarks: remarks,
      chemical_composition: chemState,
      tensile: tensileState,
      micro_structure: microState,
      hardness: hardnessState,
    };
    setPreviewPayload(payload);
    setPreviewMode(true);
  };

  const handleFinalSave = async () => {
    setIsSubmitting(true);
    try {
      if (user?.role === 'HOD' && trialIdFromUrl) {
        try {
          if (isEditing) {
            await trialService.updateTrial({
              ...previewPayload,
              trial_id: trialIdFromUrl,
              user_name: user?.username || 'Unknown',
              user_ip: userIP
            });
          }

          const approvalPayload = {
            trial_id: trialIdFromUrl,
            next_department_id: 3,
            username: user.username,
            role: user.role,
            remarks: remarks || "Approved by HOD"
          };

          await updateDepartment(approvalPayload);
          setSubmitted(true);
          showAlert('success', 'Trial approved successfully.');
          setTimeout(() => navigate('/dashboard'), 1500);
          return;
        } catch (err) {
          showAlert('error', 'Failed to approve. Please try again.');
          console.error(err);
          return;
        } finally {
          setIsSubmitting(false);
        }
      }

      await trialService.submitTrial(previewPayload);

      await specificationService.submitMetallurgicalSpecs({
        trial_id: trialId,
        chemical_composition: chemState,
        microstructure: microState
      });

      await specificationService.submitMechanicalProperties({
        trial_id: trialId,
        tensile_strength: tensileState.tensileStrength,
        yield_strength: tensileState.yieldStrength,
        elongation: tensileState.elongation,
        impact_strength_cold: tensileState.impactCold,
        impact_strength_room: tensileState.impactRoom,
        hardness_surface: hardnessState.surface,
        hardness_core: hardnessState.core,
        x_ray_inspection: selectedPart?.xray || "N/A",
        mpi: selectedPart?.mpi || "N/A"
      });

      try {
        await uploadFiles(
          toolingFiles,
          trialId,
          "TOOLING_MODIFICATION",
          user?.username || "Unknown",
          "Tooling Modification files"
        );
        await uploadFiles(
          patternDataSheetFiles,
          trialId,
          "PATTERN_DATA_SHEET",
          user?.username || "Unknown",
          "Pattern Data Sheet files"
        );
      } catch (uploadError) {
        console.error(`Failed to upload file:`, uploadError);
        showAlert("error", `Failed to upload file`);
      }

      try {
        await departmentProgressService.createDepartmentProgress({
          trial_id: trialId,
          department_id: 2,
          username: user?.username || "Unknown",
          approval_status: "pending",
          remarks: "Trial Initiated",
          completed_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });

        await updateDepartmentRole({
          trial_id: trialId,
          current_department_id: 2,
          username: user?.username || "HOD",
          role: "HOD",
          remarks: "Completed by user"
        });
      } catch (progressError) {
        console.error("Failed to update department progress:", progressError);
        showAlert("warning", "Trial saved but failed to update department progress.");
      }

      setSubmittedData({ ...previewPayload });
      setSubmitted(true);
      setPreviewMessage("Trial Specification Registered Successfully");
      showAlert("success", "Trial Specification Registered Successfully");

    } catch (err: any) {
      console.error("Submission Error:", err);
      showAlert("error", "Failed to submit trial data: " + (err.message || "Unknown error"));
    } finally {
      navigate("/dashboard");
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={appTheme}>
      <GlobalStyles styles={{
        "@media print": {
          "html, body": {
            height: "initial !important",
            overflow: "initial !important",
            backgroundColor: "white !important",
          },
          "body *": {
            visibility: "hidden",
          },
          ".print-section, .print-section *": {
            visibility: "visible",
          },
          ".print-section": {
            display: "block !important",
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            color: "black",
            backgroundColor: "white",
            padding: "20px",
          },
          ".MuiModal-root": {
            display: "none !important",
          }
        }
      }} />

      <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
        <Container maxWidth="xl" disableGutters>

          <SaclHeader />
          <DepartmentHeader title="FOUNDRY SAMPLE CARD" userIP={userIP} user={user} />

          <AlertMessage alert={alert} />

          {loading ? (
            <LoadingState message="Loading trial data..." />
          ) : user?.role === 'HOD' && assigned === null ? (
            <LoadingState message="Checking assigned work..." />
          ) : user?.role === 'HOD' && !assigned ? (
            <EmptyState title="No pending works at the moment" severity="warning" />
          ) : (
            <Grid container spacing={3}>

              <Grid size={12}>
                <Card elevation={0} sx={{ border: `1px solid ${COLORS.border}` }}>
                  <CardContent>
                    <SectionHeader icon={<PrecisionManufacturingIcon />} title="Part Identification" color={COLORS.primary} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>PATTERN CODE</Typography>
                        <Autocomplete
                          options={masterParts}
                          value={selectedPattern}
                          onChange={(_, v) => handlePatternChange(v)}
                          getOptionLabel={(o) => o.pattern_code}
                          disabled={user?.role === 'HOD' && !isEditing}
                          renderInput={(params) => <TextField {...params} placeholder="Select Pattern" />}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>COMPONENT NAME</Typography>
                        <Autocomplete
                          options={masterParts}
                          value={selectedPart}
                          onChange={(_, v) => handlePartChange(v)}
                          getOptionLabel={(o) => o.part_name}
                          disabled={user?.role === 'HOD' && !isEditing}
                          renderInput={(params) => <TextField {...params} placeholder="Select Part" />}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>TRIAL REFERENCE</Typography>
                        <TextField
                          fullWidth
                          value={trialNo}
                          placeholder="Generating..."
                          InputProps={{
                            readOnly: true,
                            sx: { bgcolor: "#f1f5f9", fontWeight: 700, color: COLORS.primary },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => fetchTrialId()} disabled={!selectedPart || trialLoading} size="small">
                                  {trialLoading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={12}>
                <Paper sx={{ p: { xs: 2, md: 3 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <SectionHeader icon={<ScienceIcon />} title="Metallurgical Composition" color={COLORS.accentBlue} />
                    {!isMobile && <Chip label="Auto-Populated" size="small" variant="outlined" sx={{ opacity: 0.7 }} />}
                  </Box>

                  <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
                    <Table size="small" sx={{ minWidth: 800, border: '1px solid #ddd', '& td, & th': { border: '1px solid #ddd' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ bgcolor: "#f0f9ff", color: COLORS.accentBlue, border: '1px solid #ddd' }}>Chemical Elements (%)</TableCell>
                          <TableCell sx={{ width: 20, border: 'none', bgcolor: 'transparent' }}></TableCell>
                          <TableCell colSpan={3} align="center" sx={{ bgcolor: "#fff7ed", color: COLORS.secondary, border: '1px solid #ddd' }}>Microstructure</TableCell>
                        </TableRow>
                        <TableRow>
                          {["C", "Si", "Mn", "P", "S", "Mg", "Cr", "Cu"].map(h => (
                            <TableCell
                              key={h}
                              align="center"
                              sx={{
                                backgroundColor: '#f1f5f9',
                                color: 'black',
                                fontWeight: 600,
                                border: '1px solid #ddd'
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                          <TableCell sx={{ border: 'none' }}></TableCell>
                          {["Nodularity", "Pearlite", "Carbide"].map(h => (
                            <TableCell
                              key={h}
                              align="center"
                              sx={{
                                backgroundColor: '#f1f5f9',
                                color: 'black',
                                fontWeight: 600,
                                border: '1px solid #ddd'
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          {Object.keys(chemState).map((key) => (
                            <TableCell key={key}>
                              <SpecInput
                                value={(chemState as any)[key]}
                                onChange={(e: any) => setChemState({ ...chemState, [key]: e.target.value })}
                                disabled={user?.role === 'HOD' && !isEditing}
                              />
                            </TableCell>
                          ))}
                          <TableCell sx={{ border: 'none' }}></TableCell>
                          {Object.keys(microState).map((key) => (
                            <TableCell key={key}>
                              <SpecInput
                                value={(microState as any)[key]}
                                onChange={(e: any) => setMicroState({ ...microState, [key]: e.target.value })}
                                disabled={user?.role === 'HOD' && !isEditing}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={12}>
                <Paper sx={{ p: { xs: 2, md: 3 } }}>
                  <SectionHeader icon={<ConstructionIcon />} title="Mechanical Properties & NDT" color={COLORS.secondary} />

                  <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
                    <Table size="small" sx={{ minWidth: 900, border: '1px solid #ddd', '& td, & th': { border: '1px solid #ddd' } }}>
                      <TableHead>
                        <TableRow>
                          {["Tensile (MPa)", "Yield (MPa)", "Elongation (%)", "Impact Cold", "Impact Room", "Hardness (Surf)", "Hardness (Core)", "X-Ray Grade", "MPI"].map(h => (
                            <TableCell
                              key={h}
                              align="center"
                              sx={{
                                backgroundColor: '#f1f5f9',
                                color: 'black',
                                fontWeight: 600,
                                border: '1px solid #ddd'
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell><SpecInput value={tensileState.tensileStrength} onChange={(e: any) => setTensileState({ ...tensileState, tensileStrength: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                          <TableCell><SpecInput value={tensileState.yieldStrength} onChange={(e: any) => setTensileState({ ...tensileState, yieldStrength: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                          <TableCell><SpecInput value={tensileState.elongation} onChange={(e: any) => setTensileState({ ...tensileState, elongation: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                          <TableCell><SpecInput value={tensileState.impactCold} onChange={(e: any) => setTensileState({ ...tensileState, impactCold: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                          <TableCell><SpecInput value={tensileState.impactRoom} onChange={(e: any) => setTensileState({ ...tensileState, impactRoom: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                          <TableCell><SpecInput value={hardnessState.surface} onChange={(e: any) => setHardnessState({ ...hardnessState, surface: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                          <TableCell><SpecInput value={hardnessState.core} onChange={(e: any) => setHardnessState({ ...hardnessState, core: e.target.value })} disabled={user?.role === 'HOD' && !isEditing} /></TableCell>
                          <TableCell><SpecInput value={selectedPart?.xray || "--"} readOnly /></TableCell>
                          <TableCell><SpecInput value={selectedPart?.mpi || "--"} readOnly /></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              </Grid>

            </Grid>
          )}

          <PreviewModal
            open={previewMode && previewPayload}
            onClose={() => {
              setPreviewMode(false)
            }}
            onSubmit={handleFinalSave}
            onExport={handleExportPDF}
            title="Verify Specification"
            subtitle="Foundry Sample Card - Review your data"
            submitted={submitted}
            isSubmitting={isSubmitting} // Pass loading state to PreviewModal if it supports it, or handle in parent
          >
            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <AlertMessage alert={alert} />
              <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Part Identification</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                    <Typography variant="caption" color="text.secondary">PATTERN CODE</Typography>
                    <Typography variant="subtitle1">{previewPayload?.pattern_code}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                    <Typography variant="caption" color="text.secondary">PART NAME</Typography>
                    <Typography variant="subtitle1">{previewPayload?.part_name}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.accentGreen}`, bgcolor: "#ecfdf5" }}>
                    <Typography variant="caption" color="success.main">TRIAL ID</Typography>
                    <Typography variant="subtitle1" color="success.main">{previewPayload?.trial_id || previewPayload?.trial_no}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.accentBlue }}>Chemical Composition</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 1, mb: 3 }}>
                {["C", "Si", "Mn", "P", "S", "Mg", "Cr", "Cu"].map(k => (
                  <Box key={k} sx={{ textAlign: "center", p: 1, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                    <Typography variant="caption" color="text.secondary">{k}</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewPayload?.chemical_composition[k.toLowerCase()] || "-"}</Typography>
                  </Box>
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.secondary }}>Microstructure</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                <Box sx={{ p: 1.5, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                  <Typography variant="caption" color="text.secondary">Nodularity</Typography>
                  <Typography variant="body2" fontWeight="bold">{previewPayload?.micro_structure.nodularity || "-"}</Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                  <Typography variant="caption" color="text.secondary">Pearlite</Typography>
                  <Typography variant="body2" fontWeight="bold">{previewPayload?.micro_structure.pearlite || "-"}</Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                  <Typography variant="caption" color="text.secondary">Carbide</Typography>
                  <Typography variant="body2" fontWeight="bold">{previewPayload?.micro_structure.carbide || "-"}</Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>Mechanical Properties & NDT</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "white", mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Tensile</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewPayload?.tensile.tensileStrength || "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Yield</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewPayload?.tensile.yieldStrength || "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Elongation</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewPayload?.tensile.elongation || "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Impact (Cold)</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewPayload?.tensile.impactCold || "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Impact (Room)</Typography>
                    <Typography variant="body2" fontWeight="bold">{previewPayload?.tensile.impactRoom || "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Hardness (Surf/Core)</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {previewPayload?.hardness.surface || "-"} / {previewPayload?.hardness.core || "-"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">NDT (X-Ray / MPI)</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {previewPayload?.x_ray_inspection || "-"} / {previewPayload?.mpi || "-"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Sampling Details</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                    <Typography variant="caption" color="text.secondary">Sampling Date</Typography>
                    <Typography variant="subtitle1">{previewPayload?.date_of_sampling || previewPayload?.samplingDate || "-"}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                    <Typography variant="caption" color="text.secondary">No. of Moulds</Typography>
                    <Typography variant="subtitle1">{previewPayload?.no_of_moulds || previewPayload?.mouldCount || "-"}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                    <Typography variant="caption" color="text.secondary">Machine</Typography>
                    <Typography variant="subtitle1">{previewPayload?.disa || previewPayload?.machine || "-"}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                    <Typography variant="caption" color="text.secondary">Reason</Typography>
                    <Typography variant="subtitle1">{previewPayload?.reason_for_sampling || previewPayload?.reason || "-"}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                    <Typography variant="caption" color="text.secondary">Traceability</Typography>
                    <Typography variant="subtitle1">{previewPayload?.sample_traceability || previewPayload?.sampleTraceability || "-"}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Tooling Modification</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Modification Details</Typography>
                    <Typography variant="subtitle1">{previewPayload?.tooling_modification || previewPayload?.toolingModification || "-"}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>Remarks</Typography>
              <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}`, mb: 3 }}>
                <Typography variant="body2">{previewPayload?.remarks || "-"}</Typography>
              </Paper>

              <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Mould Corrections</Typography>
              <Table size="small" sx={{ bgcolor: "white", border: `1px solid ${COLORS.border}`, borderRadius: 1, mb: 3 }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">Compressibility</TableCell>
                    <TableCell align="center">Squeeze Pressure</TableCell>
                    <TableCell align="center">Filler Size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(previewPayload?.mould_correction || previewPayload?.mouldCorrections || []).map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell sx={{ textAlign: 'center' }}>{r.compressibility || "-"}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{r.squeezePressure || "-"}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{r.fillerSize || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {previewMessage && <Alert severity="success" sx={{ mt: 2 }}>{previewMessage}</Alert>}
            </Box>
          </PreviewModal>

          {/* Show these sections only when not in empty state for HOD */}
          {!(user?.role === 'HOD' && !assigned) && !loading && (
            <>
              <Paper sx={{ overflowX: "auto", mb: 3, p: 2 }}>
                <Table size="small" sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      {[
                        "Date of Sampling",
                        "No. of Moulds",
                        "DISA / FOUNDRY-A",
                        "Reason For Sampling",
                        "Sample Traceability",
                        "Pattern Data Sheet",
                      ].map((head) => (
                        <TableCell
                          key={head}
                          align="center"
                          sx={{
                            backgroundColor: '#f1f5f9',
                            color: 'black',
                            fontWeight: 600,
                            borderBottom: `1px solid ${COLORS.headerBg}`
                          }}
                        >
                          {head}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <TextField
                          type="date"
                          fullWidth
                          value={samplingDate}
                          onChange={(e) => setSamplingDate(e.target.value)}
                          size="small"
                          disabled={user?.role === 'HOD' && !isEditing}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          fullWidth
                          value={mouldCount}
                          onChange={(e) => setMouldCount(e.target.value)}
                          size="small"
                          placeholder="10"
                          disabled={user?.role === 'HOD' && !isEditing}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={machine}
                            onChange={(e) => setMachine(e.target.value)}
                            displayEmpty
                            disabled={user?.role === 'HOD' && !isEditing}
                          >
                            <MenuItem value="" disabled>
                              Select
                            </MenuItem>
                            {MACHINES.map((m) => (
                              <MenuItem key={m} value={m}>
                                {m}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            displayEmpty
                            disabled={user?.role === 'HOD' && !isEditing}
                          >
                            <MenuItem value="" disabled>
                              Select
                            </MenuItem>
                            {SAMPLING_REASONS.map((r) => (
                              <MenuItem key={r} value={r}>
                                {r}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          value={sampleTraceability}
                          onChange={(e) => setSampleTraceability(e.target.value)}
                          size="small"
                          placeholder="Enter option"
                          disabled={user?.role === 'HOD' && !isEditing}
                        />
                      </TableCell>
                      <TableCell>
                        <FileUploadSection
                          files={patternDataSheetFiles}
                          onFilesChange={handlePatternDataSheetFilesChange}
                          onFileRemove={removePatternDataSheetFile}
                          showAlert={showAlert}
                          label="Attach Pattern Data Sheet"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>

              <Paper sx={{ p: 3, mb: 3 }}>
                <SectionHeader
                  icon={<ConstructionIcon />}
                  title="Tooling Modification Done"
                  color={COLORS.secondary}
                />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary, display: 'block', mb: 1 }}>
                      Tooling Modification
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      placeholder="Enter tooling modification details..."
                      value={toolingModification}
                      onChange={(e) => setToolingModification(e.target.value)}
                      sx={{ bgcolor: '#fff' }}
                      disabled={user?.role === 'HOD' && !isEditing}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary, display: 'block', mb: 1 }}>
                      Tooling Files
                    </Typography>
                    <FileUploadSection
                      files={toolingFiles}
                      onFilesChange={handleToolingFilesChange}
                      onFileRemove={removeToolingFile}
                      showAlert={showAlert}
                      label="Attach Tooling PDF"
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3, mb: 3, overflowX: "auto" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <SectionHeader icon={<EditIcon />} title="Mould Correction Details" color={COLORS.primary} />
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Compressibility", "Squeeze Pressure", "Filler Size"].map(h => (
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mouldCorrections.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <TextField fullWidth size="small" value={row.compressibility} onChange={(e) => handleMouldCorrectionChange(row.id, 'compressibility', e.target.value)} disabled={user?.role === 'HOD' && !isEditing} />
                        </TableCell>
                        <TableCell>
                          <TextField fullWidth size="small" value={row.squeezePressure} onChange={(e) => handleMouldCorrectionChange(row.id, 'squeezePressure', e.target.value)} disabled={user?.role === 'HOD' && !isEditing} />
                        </TableCell>
                        <TableCell>
                          <TextField fullWidth size="small" value={row.fillerSize} onChange={(e) => handleMouldCorrectionChange(row.id, 'fillerSize', e.target.value)} disabled={user?.role === 'HOD' && !isEditing} />
                        </TableCell>
                        <TableCell align="center">
                          {mouldCorrections.length > 1 && !(user?.role === 'HOD' && !isEditing) && (
                            <IconButton size="small" onClick={() => removeMouldCorrectionRow(row.id)} sx={{ color: '#DC2626' }}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>


              <Paper sx={{ p: 3, mb: 3 }}>
                <SectionHeader icon={<EditIcon />} title="Remarks" color={COLORS.primary} />

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

              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
                <Button variant="outlined" color="inherit" fullWidth={isMobile} onClick={() => window.location.reload()}>
                  Reset Form
                </Button>
                {user?.role === 'HOD' && trialIdFromUrl && (
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
                  startIcon={(user?.role === 'HOD' && trialIdFromUrl) ? <CheckCircleIcon /> : <SaveIcon />}
                  sx={{
                    bgcolor: COLORS.secondary,
                    color: 'white',
                    '&:hover': { bgcolor: '#c2410c' }
                  }}
                >
                  {(user?.role === 'HOD' && trialIdFromUrl) ? 'Approve' : 'Save & Continue'}
                </Button>
              </Box>
            </>
          )}
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

              <Box sx={{ mb: 4, display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.700' }}>PATTERN:</Typography>
                  <Typography variant="h6">{previewPayload.pattern_code}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.700' }}>PART NAME:</Typography>
                  <Typography variant="h6">{previewPayload.part_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.700' }}>TRIAL NO:</Typography>
                  <Typography variant="h6">{previewPayload.trial_no}</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Sampling Details</Typography>
                <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                  <div>
                    <strong>Date:</strong> {previewPayload.samplingDate || '-'}
                  </div>
                  <div>
                    <strong>No. of Moulds:</strong> {previewPayload.mouldCount || '-'}
                  </div>
                  <div>
                    <strong>Machine:</strong> {previewPayload.machine || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                  <div>
                    <strong>Reason:</strong> {previewPayload.reason || '-'}
                  </div>
                  <div>
                    <strong>Traceability:</strong> {previewPayload.sampleTraceability || '-'}
                  </div>
                </div>
              </Box>

              <h3 style={{ borderBottom: "1px solid #ccc", marginBottom: "10px", marginTop: "20px" }}>Tooling Modification</h3>
              <p>
                <strong>Details:</strong> {previewPayload.toolingModification || "-"}
              </p>
              <h3 style={{ borderBottom: "1px solid #ccc", marginBottom: "10px", marginTop: "20px" }}>Mould Corrections</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: 16 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ border: "1px solid black", padding: "5px" }}>#</th>
                    <th style={{ border: "1px solid black", padding: "5px" }}>Compressibility</th>
                    <th style={{ border: "1px solid black", padding: "5px" }}>Squeeze Pressure</th>
                    <th style={{ border: "1px solid black", padding: "5px" }}>Filler Size</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewPayload.mouldCorrections || []).map((row: any, i: number) => (
                    <tr key={i}>
                      <td style={{ border: "1px solid black", padding: "5px", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ border: "1px solid black", padding: "5px", textAlign: "center" }}>{row.compressibility}</td>
                      <td style={{ border: "1px solid black", padding: "5px", textAlign: "center" }}>{row.squeezePressure}</td>
                      <td style={{ border: "1px solid black", padding: "5px", textAlign: "center" }}>{row.fillerSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Chemical Composition</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    {["C", "Si", "Mn", "P", "S", "Mg", "Cr", "Cu"].map(h => (
                      <th key={h} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {["c", "si", "mn", "p", "s", "mg", "cr", "cu"].map(k => (
                      <td key={k} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>
                        {previewPayload.chemical_composition[k] || "-"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Microstructure</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>Nodularity</th>
                    <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>Pearlite</th>
                    <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>Carbide</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.micro_structure.nodularity || "-"}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.micro_structure.pearlite || "-"}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.micro_structure.carbide || "-"}</td>
                  </tr>
                </tbody>
              </table>

              <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1, mt: 3 }}>Mechanical Properties</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Tensile</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Yield</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Elongation</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Impact (Cold)</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Impact (Room)</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Hardness (Surf)</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Hardness (Core)</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>X-Ray / MPI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.tensileStrength}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.yieldStrength}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.elongation}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.impactCold}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.impactRoom}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.hardness.surface}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.hardness.core}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.x_ray_inspection} / {previewPayload.mpi}</td>
                  </tr>
                </tbody>
              </table>
            </Box>
          )}

        </Container>
      </Box>
    </ThemeProvider >
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { if (this.state.hasError) return <Alert severity="error">System Error. Please refresh.</Alert>; return this.props.children; }
}

export default function FoundrySampleCardApp() {
  return (
    <ErrorBoundary>
      <FoundrySampleCard />
    </ErrorBoundary>
  );
}