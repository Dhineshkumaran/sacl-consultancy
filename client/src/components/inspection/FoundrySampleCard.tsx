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
  TableContainer,
  Chip,
  ThemeProvider,
  Button,
  Alert,
  IconButton,
  Grid,
  Container,
  Card,
  CardContent,
  InputAdornment,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress
} from "@mui/material";
import Swal from 'sweetalert2';
import Autocomplete from "@mui/material/Autocomplete";

import CloseIcon from "@mui/icons-material/Close";
import ScienceIcon from '@mui/icons-material/Science';
import ConstructionIcon from '@mui/icons-material/Construction';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import { appTheme, COLORS } from "../../theme/appTheme";
import { trialService } from "../../services/trialService";
import { apiService } from "../../services/commonService";
import departmentProgressService from "../../services/departmentProgressService";
import { uploadFiles } from '../../services/fileUploadHelper';
import { useAlert } from '../../hooks/useAlert';
import { formatDate } from '../../utils/dateUtils';
import { AlertMessage } from '../common/AlertMessage';
import { useAuth } from '../../context/AuthContext';
import Header from "../dashboard/Header";
import ProfileModal from "../dashboard/ProfileModal";
import { getDepartmentInfo } from "../../utils/dashboardUtils";
import { LoadingState, EmptyState, FileUploadSection, PreviewModal, DocumentViewer } from '../common';
import GearSpinner from '../common/GearSpinner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';



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
    try {
      obj = JSON.parse(composition);
    } catch (e) {
      const result = { ...blank };
      const parts = composition.split(/\s+(?=[A-Z][a-z]?[a-z]?\s*:)/);
      parts.forEach(part => {
        const match = part.match(/^([A-Za-z]+)\s*:\s*(.+?)(?:%|$)/);
        if (match) {
          const element = match[1].toLowerCase().trim();
          const value = match[2].trim();
          if (element === 'c') result.c = value;
          else if (element === 'si' || element === 'silicon') result.si = value;
          else if (element === 'mn') result.mn = value;
          else if (element === 'p') result.p = value;
          else if (element === 's') result.s = value;
          else if (element === 'mg') result.mg = value;
          else if (element === 'cr') result.cr = value;
          else if (element === 'cu') result.cu = value;
        }
      });
      return result;
    }
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
  if (!tensile) return { tensileStrength: "", yieldStrength: "", elongation: "", impactCold: "", impactRoom: "" };
  let tensileStrength = "", yieldStrength = "", elongation = "", impactCold = "", impactRoom = "";
  const spaceSepMatches = tensile.match(/([≥>=]+)?\s*(\d+)\s*(?:MPa|N\/mm²|N\/mm2)?/g);
  if (spaceSepMatches && spaceSepMatches.length >= 2) {
    const first = spaceSepMatches[0].match(/([≥>=]+)?\s*(\d+)/);
    if (first) tensileStrength = (first[1] || "≥") + first[2];
    const second = spaceSepMatches[1].match(/([≥>=]+)?\s*(\d+)/);
    if (second) yieldStrength = (second[1] || "≥") + second[2];
    if (spaceSepMatches.length >= 3) {
      const third = spaceSepMatches[2].match(/([≥>=]+)?\s*(\d+)/);
      if (third) elongation = (third[1] || "≥") + third[2];
    }
    return { tensileStrength, yieldStrength, elongation, impactCold, impactRoom };
  }
  const lines = tensile.split("\n");
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
  if (!microstructure) return { nodularity: "--", pearlite: "--", carbide: "--" };
  let nodularity = "", pearlite = "", carbide = "";
  const lines = microstructure.split("\n");
  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();
    if (cleanLine.includes("nodularity") || cleanLine.includes("spheroidization")) {
      const match = cleanLine.match(/([≥≤]?)\s*(\d+)/);
      if (match) nodularity = `${match[1]}${match[2]}`;
    }
    else if (cleanLine.includes("shape") && cleanLine.match(/(\d+)\s*%/)) {
      const match = cleanLine.match(/([≥≤<>]?)\s*(\d+)\s*%/);
      if (match && !nodularity) nodularity = `${match[1] || "≥"}${match[2]}`;
    }
    if (cleanLine.includes("pearlite") || cleanLine.includes("pearlitic")) {
      const match = cleanLine.match(/([≥≤<>]?)\s*(\d+)/);
      if (match) pearlite = `${match[1]}${match[2]}`;
    }
    else if (cleanLine.includes("matrix") && cleanLine.includes("ferrite")) {
      const match = cleanLine.match(/([≥≤<>=]?)\s*(\d+)\s*%/);
      if (match && !pearlite) pearlite = `${match[1] || "≥"}${match[2]}`;
    }
    if (cleanLine.includes("carbide")) {
      const match = cleanLine.match(/([≥≤<>=]?)\s*(\d+)/);
      if (match) carbide = `${match[1]}${match[2]}`;
    }
  });
  return { nodularity: nodularity || "--", pearlite: pearlite || "--", carbide: carbide || "--" };
};

const parseHardnessData = (hardness: string) => {
  if (!hardness) return { surface: "--", core: "--" };
  const lines = hardness.split("\n");
  let surface = "", core = "";
  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();
    if (cleanLine.includes("surface")) {
      const match = cleanLine.match(/(\d+\s*[-–]\s*\d+|\d+)/);
      if (match) surface = match[1].replace(/\s+/g, ' ');
    }
    else if (cleanLine.includes("core")) {
      const match = cleanLine.match(/(\d+\s*[-–]\s*\d+|\d+)/);
      if (match) core = match[1].replace(/\s+/g, ' ');
    }
    else if (!surface) {
      const match = cleanLine.match(/(\d+\s*[-–]\s*\d+|\d+)/);
      if (match) surface = match[1].replace(/\s+/g, ' ');
    }
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
      readOnly: props.readOnly,
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
  const [initiatedBy, setInitiatedBy] = useState<string>("");
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialLoading, setTrialLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPatternDialog, setShowPatternDialog] = useState(false);

  const { user } = useAuth();
  const { alert, showAlert } = useAlert();
  const [docsRefreshTrigger, setDocsRefreshTrigger] = useState(0);

  const [showProfile, setShowProfile] = useState(false);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const departmentInfo = getDepartmentInfo(user);

  const MACHINES = ["DISA - 1", "DISA - 2", "DISA - 3", "DISA - 4", "DISA - 5"];
  const SAMPLING_REASONS = ["First trial", "Metallurgical Trial", "Others"];
  const TRIAL_TYPES = ["INHOUSE MACHINING(NPD)", "INHOUSE MACHINING(REGULAR)", "MACHINING - CUSTOMER END"];
  const [samplingDate, setSamplingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [planMoulds, setPlanMoulds] = useState("");
  const [machine, setMachine] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [reason_for_sampling, setReasonForSampling] = useState("");
  const [sampleTraceability, setSampleTraceability] = useState("");
  const [trialType, setTrialType] = useState("");
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

  const trialIdFromUrl = new URLSearchParams(window.location.search).get('trial_id') || "";

  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [userIP, setUserIP] = useState<string>("");
  const [isAssigned, setIsAssigned] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAssignment = async () => {
      if (!user) return;

      if (user.role === 'Admin' || user.role === 'User') {
        setIsAssigned(true);
        return;
      }

      if (trialIdFromUrl) {
        try {
          const pending = await departmentProgressService.getProgress(user.username, user.department_id);
          const found = pending.find(p => p.trial_id === trialIdFromUrl);
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
  }, [user, trialIdFromUrl]);

  useEffect(() => {
    if (previewMessage) { const t = setTimeout(() => setPreviewMessage(null), 4000); return () => clearTimeout(t); }
  }, [previewMessage]);

  useEffect(() => {
    const fetchTrialDataForHOD = async () => {
      if ((user?.role === 'HOD' || user?.role === 'Admin') && trialIdFromUrl) {
        try {
          const response = await trialService.getTrialById(trialIdFromUrl);
          if (response && response.data) {
            const data = response.data;
            setTrialId(data.trial_id || trialIdFromUrl);
            setTrialNo(data.trial_id?.split('-').pop() || '');
            setSamplingDate(data.date_of_sampling?.split('T')[0] || new Date().toISOString().split("T")[0]);
            setPlanMoulds(data.plan_moulds || '');
            setMachine(data.disa || '');
            setInitiatedBy(data.initiated_by || '');
            setReason(data.reason_for_sampling || '');
            setSampleTraceability(data.sample_traceability && data.sample_traceability !== 'null' && data.sample_traceability !== 'undefined' ? data.sample_traceability : '');
            setTrialType(data.trial_type && data.trial_type !== 'null' && data.trial_type !== 'undefined' ? data.trial_type : '');
            setToolingModification(data.tooling_modification && data.tooling_modification !== 'null' && data.tooling_modification !== 'undefined' ? data.tooling_modification : '');
            setRemarks(data.remarks && data.remarks !== 'null' && data.remarks !== 'undefined' ? data.remarks : '');

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
          }
        } catch (error) {
          console.error("Failed to fetch trial data for HOD:", error);
          showAlert("error", "Failed to load existing trial data.");
        }
      }
    };
    if (trialIdFromUrl && masterParts.length > 0) fetchTrialDataForHOD();
  }, [user, trialIdFromUrl, masterParts]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await apiService.getIP();
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if ((user?.role === 'HOD' || user?.role === 'Admin') && trialIdFromUrl) {
      return;
    }
    if (selectedPart) fetchTrialId();
    else setTrialNo("");
  }, [selectedPart, user, trialIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePartChange = (v: PartData | null) => { setSelectedPart(v); };
  const handlePatternChange = (v: PartData | null) => { setSelectedPattern(v); if (v) setSelectedPart(v); };


  const handleSaveAndContinue = () => {
    if (!selectedPart) { showAlert("error", "Please select a Part Name first."); return; }

    const reasonFinal = reason === 'Others' ? `Others (${customReason})` : reason;

    const payload = {
      trial_id: trialId,
      pattern_code: selectedPart.pattern_code,
      part_name: selectedPart.part_name,
      material_grade: selectedPart.material_grade,
      date_of_sampling: samplingDate,
      status: "CREATED",
      plan_moulds: planMoulds,
      reason_for_sampling: reasonFinal,
      sample_traceability: sampleTraceability,
      trial_type: trialType,
      mould_correction: mouldCorrections,
      disa: machine,
      initiated_by: user?.username || "Unknown",
      tooling_modification: toolingModification,
      remarks: remarks,
      chemical_composition: chemState,
      tensile: tensileState,
      micro_structure: microState,
      hardness: hardnessState,
      is_edit: isEditing
    };

    setPreviewPayload(payload);
    setPreviewMode(true);
  };

  const handleFinalSave = async () => {
    setIsSubmitting(true);
    try {
      if ((user?.role === 'HOD' || user?.role === 'Admin') && trialIdFromUrl) {
        try {
          const payload = {
            trial_id: trialIdFromUrl,
            user_name: user?.username || 'Unknown',
            initiated_by: initiatedBy || 'Unknown',
            user_ip: userIP,
            part_name: selectedPart?.part_name,
            pattern_code: selectedPart?.pattern_code,
            material_grade: selectedPart?.material_grade,
            date_of_sampling: samplingDate,
            plan_moulds: planMoulds,
            reason_for_sampling: reason === 'Others' ? `Others (${customReason})` : reason,
            disa: machine,
            sample_traceability: sampleTraceability,
            trial_type: trialType,
            mould_correction: mouldCorrections,
            tooling_modification: toolingModification,
            remarks: remarks,
            is_edit: isEditing
          }

          await trialService.updateTrial(payload);

          setSubmitted(true);
          setPreviewMode(false);
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Trial approved successfully.'
          });
          navigate('/dashboard');
          return;
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message || 'Failed to update Trial Specification. Please try again.'
          });
          console.error(err);
          return;
        } finally {
          setIsSubmitting(false);
        }
      }

      await trialService.submitTrial(previewPayload);

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
        setDocsRefreshTrigger(prev => prev + 1);
      } catch (uploadError) {
        console.error(`Failed to upload file:`, uploadError);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'File upload error. Please try again.'
        });
      }

      setSubmittedData({ ...previewPayload });
      setSubmitted(true);
      setPreviewMode(false);
      setPreviewMessage("Trial Specification Registered Successfully");
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Trial Specification Registered Successfully'
      });
      navigate("/dashboard");

    } catch (err: any) {
      console.error("Submission Error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || "Failed to submit trial data. Please try again."
      });
    } finally {
      setIsSubmitting(false);
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
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
          <Container maxWidth="xl" disableGutters>
            <AlertMessage alert={alert} />

            {isAssigned === false ? (
              <EmptyState
                title="No Pending Works"
                description="This trial is not currently assigned to you."
                severity="warning"
                action={{
                  label: "Go to Dashboard",
                  onClick: () => navigate('/dashboard')
                }}
              />
            ) : (loading || isAssigned === null) ? (
              <LoadingState message={user?.role === 'Admin' || user?.role === 'User' ? "Loading master data..." : "Checking assignment..."} />
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
                            disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                            renderInput={(params) =>
                              <TextField
                                {...params}
                                placeholder="Select Pattern"
                              />
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>COMPONENT NAME</Typography>
                          <Autocomplete
                            options={masterParts}
                            value={selectedPart}
                            onChange={(_, v) => handlePartChange(v)}
                            getOptionLabel={(o) => o.part_name}
                            disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                            renderInput={(params) =>
                              <TextField
                                {...params}
                                placeholder="Select Part"
                              />
                            }
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
                              endAdornment: user?.role !== 'HOD' || user?.role !== 'Admin' ? (
                                <InputAdornment position="end">
                                  <IconButton onClick={() => fetchTrialId()} disabled={!selectedPart || trialLoading} size="small">
                                    {trialLoading ? <div style={{ transform: 'scale(0.7)' }}><GearSpinner /></div> : <RefreshIcon fontSize="small" />}
                                  </IconButton>
                                </InputAdornment>
                              ) : undefined
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
                                  onChange={() => { }}
                                  readOnly={true}
                                />
                              </TableCell>
                            ))}
                            <TableCell sx={{ border: 'none' }}></TableCell>
                            {Object.keys(microState).map((key) => (
                              <TableCell key={key}>
                                <SpecInput
                                  value={(microState as any)[key]}
                                  onChange={() => { }}
                                  readOnly={true}
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
                            <TableCell><SpecInput value={tensileState.tensileStrength} onChange={() => { }} readOnly={true} /></TableCell>
                            <TableCell><SpecInput value={tensileState.yieldStrength} onChange={() => { }} readOnly={true} /></TableCell>
                            <TableCell><SpecInput value={tensileState.elongation} onChange={() => { }} readOnly={true} /></TableCell>
                            <TableCell><SpecInput value={tensileState.impactCold} onChange={() => { }} readOnly={true} /></TableCell>
                            <TableCell><SpecInput value={tensileState.impactRoom} onChange={() => { }} readOnly={true} /></TableCell>
                            <TableCell><SpecInput value={hardnessState.surface} onChange={() => { }} readOnly={true} /></TableCell>
                            <TableCell><SpecInput value={hardnessState.core} onChange={() => { }} readOnly={true} /></TableCell>
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
              title="Verify Trial Specification Details"
              submitted={submitted}
              isSubmitting={isSubmitting}
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
                      <Typography variant="subtitle1">{formatDate(previewPayload?.date_of_sampling || previewPayload?.samplingDate) || "-"}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="caption" color="text.secondary">No. of Moulds</Typography>
                      <Typography variant="caption" color="text.secondary">No. of Moulds</Typography>
                      <Typography variant="subtitle1">
                        Plan: {previewPayload?.plan_moulds || previewPayload?.planMoulds || "-"}
                      </Typography>
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

                <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Tooling Modification Done</Typography>
                <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: "white", border: `1px solid ${COLORS.border}`, }}>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>MODIFICATION DETAILS</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#333', mt: 0.5 }}>{previewPayload?.tooling_modification || previewPayload?.toolingModification || "-"}</Typography>
                  </Box>
                  {previewPayload?.toolingFiles && previewPayload.toolingFiles.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>TOOLING FILES</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
                        {previewPayload.toolingFiles.map((file: any, idx: number) => {
                          const fileUrl = file.url || file.path || '#';
                          const fileName = file.name || file.fileName || `File ${idx + 1}`;
                          const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                          return (
                            <Box key={idx}>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: COLORS.primary, textDecoration: 'underline', fontSize: '0.95em', display: 'inline-block', marginBottom: 4 }}
                              >
                                {fileName}
                              </a>
                              {isPdf && fileUrl !== '#' && (
                                <Box sx={{ mt: 1, mb: 1, border: '1px solid #eee', borderRadius: 1, overflow: 'hidden', background: '#fafafa' }}>
                                  <iframe
                                    src={fileUrl}
                                    title={fileName}
                                    width="100%"
                                    height="320px"
                                    style={{ border: 'none' }}
                                  />
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </Paper>

                {previewPayload?.patternDataSheetFiles && previewPayload.patternDataSheetFiles.length > 0 && (
                  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd', border: `1.5px solid ${COLORS.accentBlue}` }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.accentBlue, fontWeight: 700, letterSpacing: 0.5 }}>PATTERN DATA SHEET FILES</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
                      {previewPayload.patternDataSheetFiles.map((file: any, idx: number) => {
                        const fileUrl = file.url || file.path || '#';
                        const fileName = file.name || file.fileName || `File ${idx + 1}`;
                        const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                        return (
                          <Box key={idx}>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: COLORS.accentBlue, textDecoration: 'underline', fontSize: '0.95em', display: 'inline-block', marginBottom: 4 }}
                            >
                              {fileName}
                            </a>
                            {isPdf && fileUrl !== '#' && (
                              <Box sx={{ mt: 1, mb: 1, border: '1px solid #eee', borderRadius: 1, overflow: 'hidden', background: '#fafafa' }}>
                                <iframe
                                  src={fileUrl}
                                  title={fileName}
                                  width="100%"
                                  height="320px"
                                  style={{ border: 'none' }}
                                />
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Paper>
                )}

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

                <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>Remarks</Typography>
                <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}`, mb: 3 }}>
                  <Typography variant="body2">{previewPayload?.remarks || "-"}</Typography>
                </Paper>

                {previewMessage && <Alert severity="success" sx={{ mt: 2 }}>{previewMessage}</Alert>}
              </Box>
            </PreviewModal>

            {/* Show these sections only when not in empty state for HOD */}
            {!loading && (
              <React.Fragment>
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
                          "Trial Type",
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
                            onChange={(e) => {
                              setSamplingDate(e.target.value);
                            }}
                            size="small"
                            disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" flexDirection="column" gap={1}>
                            <TextField
                              type="number"
                              fullWidth
                              label="Plan"
                              value={planMoulds}
                              onChange={(e) => {
                                setPlanMoulds(e.target.value);
                              }}
                              size="small"
                              placeholder="20"
                              disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                              InputLabelProps={{ shrink: true }}
                              sx={{
                                bgcolor: '#FFF59D',
                                "& .MuiInputBase-input": { color: "black !important" },
                                "& .MuiInputLabel-root": { color: "black !important", fontWeight: 600 },
                                "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "black !important" }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={machine}
                              onChange={(e) => {
                                setMachine(e.target.value);
                              }}
                              displayEmpty
                              disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                              onChange={(e) => {
                                setReason(e.target.value);
                                if (e.target.value !== 'Others') setCustomReason("");
                              }}
                              displayEmpty
                              disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
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
                          {reason === 'Others' && (
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Please specify..."
                              value={customReason}
                              onChange={e => {
                                setCustomReason(e.target.value);
                              }}
                              sx={{ mt: 1 }}
                              disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={sampleTraceability}
                            onChange={(e) => {
                              setSampleTraceability(e.target.value);
                            }}
                            size="small"
                            placeholder="Enter option"
                            disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl component="fieldset" fullWidth>
                            <RadioGroup
                              value={trialType}
                              onChange={(e) => {
                                setTrialType(e.target.value);
                              }}
                            >
                              {TRIAL_TYPES.map((type) => (
                                <FormControlLabel
                                  key={type}
                                  value={type}
                                  control={<Radio size="small" />}
                                  label={<Typography variant="caption">{type}</Typography>}
                                  disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                                  sx={{ mb: 0.5 }}
                                />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ConstructionIcon />}
                            onClick={() => {
                              if (selectedPattern) setShowPatternDialog(true);
                              else showAlert("warning", "Please select a pattern first.");
                            }}
                            sx={{ textTransform: 'none', width: '100%' }}
                          >
                            View Pattern Data Sheet
                          </Button>
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
                        disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary, display: 'block', mb: 1 }}>
                        Tooling Files
                      </Typography>
                      {((user?.role !== 'HOD' && user?.role !== 'Admin')) && (
                        <FileUploadSection
                          files={toolingFiles}
                          onFilesChange={handleToolingFilesChange}
                          onFileRemove={removeToolingFile}
                          showAlert={showAlert}
                          label="Attach Tooling PDF"
                        />
                      )}
                      <DocumentViewer trialId={trialId || ""} category="TOOLING_MODIFICATION" label="Attached Tooling Files" refreshTrigger={docsRefreshTrigger} />
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
                            <TextField fullWidth size="small" value={row.compressibility} onChange={(e) => handleMouldCorrectionChange(row.id, 'compressibility', e.target.value)} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} />
                          </TableCell>
                          <TableCell>
                            <TextField fullWidth size="small" value={row.squeezePressure} onChange={(e) => handleMouldCorrectionChange(row.id, 'squeezePressure', e.target.value)} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} />
                          </TableCell>
                          <TableCell>
                            <TextField fullWidth size="small" value={row.fillerSize} onChange={(e) => handleMouldCorrectionChange(row.id, 'fillerSize', e.target.value)} disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing} />
                          </TableCell>
                          <TableCell align="center">
                            {mouldCorrections.length > 1 && !((user?.role === 'HOD' || user?.role === 'Admin') && !isEditing) && (
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
                    disabled={(user?.role === 'HOD' || user?.role === 'Admin') && !isEditing}
                  />
                </Paper>

                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} sx={{ mt: 2, mb: 4, justifyContent: 'flex-end' }}>
                  {!(user?.role === 'HOD' || user?.role === 'Admin') && (
                    <Button variant="outlined" color="inherit" fullWidth={isMobile} onClick={() => window.location.reload()}>
                      Reset Form
                    </Button>
                  )}
                  {(user?.role === 'HOD' || user?.role === 'Admin') && trialIdFromUrl && (
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
                    startIcon={((user?.role === 'HOD' || user?.role === 'Admin') && trialIdFromUrl) ? <CheckCircleIcon /> : <SaveIcon />}
                    sx={{
                      bgcolor: COLORS.secondary,
                      color: 'white',
                      '&:hover': { bgcolor: '#c2410c' }
                    }}
                  >
                    {((user?.role === 'HOD' || user?.role === 'Admin') && trialIdFromUrl) ? 'Approve' : 'Save & Continue'}
                  </Button>
                </Box>

              </React.Fragment>
            )}


          </Container>
        </Box >

        <Dialog open={showPatternDialog} onClose={() => setShowPatternDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: COLORS.primary, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Pattern Data Sheet
            <IconButton onClick={() => setShowPatternDialog(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedPattern ? (
              <Grid container spacing={3}>
                {/* Left Column */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '13px' }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '13px' }}>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { l: "Number of cavity in pattern", v: (selectedPattern as any).number_of_cavity },
                          { l: "Cavity identification number", v: (selectedPattern as any).cavity_identification },
                          { l: "Pattern material", v: (selectedPattern as any).pattern_material },
                          { l: "Core weight in kgs", v: (selectedPattern as any).core_weight },
                          { l: "Core mask thickness in mm", v: (selectedPattern as any).core_mask_thickness },
                          { l: "Estimated casting weight", v: (selectedPattern as any).estimated_casting_weight },
                        ].map((r, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontSize: '13px', color: COLORS.textSecondary }}>{r.l}</TableCell>
                            <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{r.v || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Right Column */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '13px' }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '13px' }}>SP Side Pattern</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '13px' }}>PP Side Pattern</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { l: "Pattern plate thickness in mm", sp: (selectedPattern as any).pattern_plate_thickness_sp, pp: (selectedPattern as any).pattern_plate_thickness_pp },
                          { l: "Pattern plate weight in kgs", sp: (selectedPattern as any).pattern_plate_weight_sp, pp: (selectedPattern as any).pattern_plate_weight_pp },
                          { l: "Crush pin height in mm", sp: (selectedPattern as any).crush_pin_height_sp, pp: (selectedPattern as any).crush_pin_height_pp },
                          { l: "Core mask weight in kgs", sp: (selectedPattern as any).core_mask_weight_sp, pp: (selectedPattern as any).core_mask_weight_pp },
                        ].map((r, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontSize: '13px', color: COLORS.textSecondary }}>{r.l}</TableCell>
                            <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{r.sp || "-"}</TableCell>
                            <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{r.pp || "-"}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell sx={{ fontSize: '13px', color: COLORS.textSecondary }}>Estimated Bunch weight</TableCell>
                          <TableCell colSpan={2} sx={{ fontSize: '13px', fontWeight: 500 }}>
                            <Box display="flex" alignItems="center" gap={3}>
                              <span>{(selectedPattern as any).estimated_bunch_weight || "-"}</span>
                              {(selectedPattern as any).yield_label && (
                                <span style={{ fontWeight: 'bold' }}>Yield: {(selectedPattern as any).yield_label}</span>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Remarks */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">Remarks:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb', minHeight: '60px' }}>
                    <Typography variant="body2">{(selectedPattern as any).remarks || "-"}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">No pattern selected</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPatternDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Profile Modal */}
        {
          showProfile && (
            <ProfileModal
              onClose={() => setShowProfile(false)}
              onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
            />
          )
        }
      </Box >
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
