import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
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
  InputAdornment,
  IconButton,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import PouringDetailsTable from './pouring';
import type { PouringDetails } from './pouring';

// Colors
const SAKTHI_COLORS = {
  primary: "#2950bbff",
  secondary: "#DC2626",
  accent: "#F59E0B",
  background: "#F8FAFC",
  lightBlue: "#3B82F6",
  darkGray: "#374151",
  lightGray: "#E5E7EB",
  white: "#FFFFFF",
  success: "#10B981",
};

const MACHINES = ["DISA-1", "DISA-2", "DISA-3", "DISA-4", "DISA-5"];
const SAMPLING_REASONS = ["First trial", "Metallurgy trial", "Porosity verification", "others"];

const theme = createTheme({
  palette: {
    primary: { main: SAKTHI_COLORS.primary },
    secondary: { main: SAKTHI_COLORS.secondary },
    background: { default: SAKTHI_COLORS.background },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: SAKTHI_COLORS.lightBlue,
          color: SAKTHI_COLORS.white,
          borderRight: `1px solid ${SAKTHI_COLORS.lightGray}`,
          padding: '12px 8px',
        },
        body: {
          backgroundColor: SAKTHI_COLORS.white,
          borderRight: `1px solid ${SAKTHI_COLORS.lightGray}`,
          padding: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 600,
        }
      }
    }
  },
});

interface PartData {
  id: number;
  pattern_code: string;
  part_name: string;
  material_grade: string;
  // chemical_composition may come as an object (preferred) or as a JSON string
  chemical_composition: any;
  micro_structure: string;
  tensile: string;
  impact: string;
  hardness: string;
  xray: string;
  created_at: string;
}

interface MouldCorrection {
  id: number;
  compressibility: string;
  squeezePressure: string;
  fillerSize: string;
}

/*
  REPLACED PARSING LOGIC:
  Backend now returns chemical_composition as JSON (object). Accept either object or JSON string.
  Normalize keys case-insensitively and return a simple object with keys: c, si, mn, p, s, mg, cr, cu
*/
const parseChemicalComposition = (composition: any) => {
  const blank = { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' };
  if (!composition) return blank;

  let obj: any = composition;

  if (typeof composition === 'string') {
    // try parse; if fails, return a fallback placing the string under c for visibility
    try {
      obj = JSON.parse(composition);
    } catch (e) {
      console.warn('chemical_composition is string and JSON.parse failed, using raw string as C', e);
      return { ...blank, c: composition };
    }
  }

  if (typeof obj !== 'object' || obj === null) return blank;

  // build lowercase-key map to handle "C" or "c" etc.
  const map: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (typeof k === 'string') {
      map[k.toLowerCase().replace(/\s+/g, '')] = obj[k];
    }
  });

  // support common alternative names if needed
  const siKeyCandidates = ['si', 'silicon'];
  const getFirst = (keys: string[]) => {
    for (const k of keys) {
      if (map[k] !== undefined && map[k] !== null) return String(map[k]);
    }
    return '';
  };

  return {
    c: getFirst(['c']),
    si: getFirst(siKeyCandidates),
    mn: getFirst(['mn']),
    p: getFirst(['p']),
    s: getFirst(['s']),
    mg: getFirst(['mg']),
    cr: getFirst(['cr']),
    cu: getFirst(['cu']),
  };
};

const parseTensileData = (tensile: string) => {
  const lines = tensile.split('\n');
  let tensileStrength = '';
  let yieldStrength = '';
  let elongation = '';
  let impactCold = '';
  let impactRoom = '';

  lines.forEach(line => {
    const cleanLine = line.trim();

    if (cleanLine.match(/\d+\s*(MPa|N\/mm²|Mpa|Kgf\/mm²)/) ||
      cleanLine.includes('Tensile Strength') ||
      cleanLine.match(/[≥>]\s*\d+/)) {

      if (cleanLine.includes('≥')) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !tensileStrength) tensileStrength = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes('>')) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !tensileStrength) tensileStrength = `>${numberMatch[1]}`;
      } else if (cleanLine.includes('Min')) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !tensileStrength) tensileStrength = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !tensileStrength) tensileStrength = numberMatch[1];
      }
    }

    if (cleanLine.includes('Yield Strength') || cleanLine.includes('Yield')) {
      if (cleanLine.includes('≥')) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes('>')) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `>${numberMatch[1]}`;
      } else if (cleanLine.includes('Min')) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = numberMatch[1];
      }
    }

    if (cleanLine.includes('Elongation') || cleanLine.includes('%') || cleanLine.match(/[≥>]\s*\d+\s*%/)) {
      if (cleanLine.includes('≥')) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !elongation) elongation = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes('>')) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !elongation) elongation = `>${numberMatch[1]}`;
      } else if (cleanLine.includes('Min')) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !elongation) elongation = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !elongation) elongation = numberMatch[1];
      }
    }
  });

  return { tensileStrength, yieldStrength, elongation, impactCold, impactRoom };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure.split('\n');
  let nodularity = '';
  let pearlite = '';
  let carbide = '';

  lines.forEach(line => {
    const cleanLine = line.trim().toLowerCase();

    if (cleanLine.includes('nodularity')) {
      if (cleanLine.includes('≥')) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) nodularity = `≥${match[1]}`;
      } else if (cleanLine.includes('≤')) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) nodularity = `≤${match[1]}`;
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) nodularity = match[1];
      }
    }

    if (cleanLine.includes('pearlite')) {
      if (cleanLine.includes('≥')) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) pearlite = `≥${match[1]}`;
      } else if (cleanLine.includes('≤')) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) pearlite = `≤${match[1]}`;
      } else if (cleanLine.includes('<')) {
        const match = cleanLine.match(/<\s*(\d+)/);
        if (match) pearlite = `<${match[1]}`;
      } else if (cleanLine.includes('>')) {
        const match = cleanLine.match(/>\s*(\d+)/);
        if (match) pearlite = `>${match[1]}`;
      } else if (cleanLine.includes('max')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = `≤${match[1]}`;
      } else if (cleanLine.includes('min')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = `≥${match[1]}`;
      } else if (cleanLine.match(/\d+\s*-\s*\d+/)) {
        const match = cleanLine.match(/(\d+\s*-\s*\d+)/);
        if (match) pearlite = match[1];
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = match[1];
      }
    }

    if (cleanLine.includes('carbide') || cleanLine.includes('cementite')) {
      if (cleanLine.includes('≤')) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) carbide = `≤${match[1]}`;
      } else if (cleanLine.includes('<')) {
        const match = cleanLine.match(/<\s*(\d+)/);
        if (match) carbide = `<${match[1]}`;
      } else if (cleanLine.includes('≥')) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) carbide = `≥${match[1]}`;
      } else if (cleanLine.includes('>')) {
        const match = cleanLine.match(/>\s*(\d+)/);
        if (match) carbide = `>${match[1]}`;
      } else if (cleanLine.includes('max')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = `≤${match[1]}`;
      } else if (cleanLine.includes('min')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = `≥${match[1]}`;
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = match[1];
      }
    }
  });

  return {
    nodularity: nodularity || '--',
    pearlite: pearlite || '--',
    carbide: carbide || '--'
  };
};

const parseHardnessData = (hardness: string) => {
  const lines = hardness.split('\n');
  let surface = '';
  let core = '';

  lines.forEach(line => {
    const cleanLine = line.trim().toLowerCase();

    if (cleanLine.includes('surface')) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) surface = match[1];
    } else if (cleanLine.includes('core')) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) core = match[1];
    } else if (!surface) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) surface = match[1];
    }
  });

  return { surface: surface || '--', core: core || '--' };
};

function SampleCardSubmitted({
  submittedData,
  onBackToForm,
  onProceedToPouring,
}: {
  submittedData: any;
  onBackToForm: () => void;
  onProceedToPouring: () => void;
}) {
  return (
    <Box sx={{ p: 3, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper variant="outlined" sx={{ p: 3, width: '100%', maxWidth: 1000 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Sample Card Submitted Successfully!
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Pattern Code</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{submittedData.selectedPart.pattern_code}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600 }}>Part Name</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{submittedData.selectedPart.part_name}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600 }}>Machine</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{submittedData.machine}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600 }}>Trial No</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{submittedData.trialNo}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600 }}>Sampling Date</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{submittedData.samplingDate}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600 }}>Pattern Data Sheet Files</Typography>
          <Box>
            {submittedData.patternFiles && submittedData.patternFiles.length > 0 ? (
              submittedData.patternFiles.map((f: File, i: number) => <Typography key={i} variant="caption">{f.name}</Typography>)
            ) : <Typography variant="caption">None</Typography>}
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>STD Box Files</Typography>
          <Box>
            {submittedData.stdFiles && submittedData.stdFiles.length > 0 ? (
              submittedData.stdFiles.map((f: File, i: number) => <Typography key={i} variant="caption">{f.name}</Typography>)
            ) : <Typography variant="caption">None</Typography>}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="primary" onClick={onBackToForm}>
            Back to Form
          </Button>
          <Button variant="contained" color="primary" onClick={onProceedToPouring}>
            Proceed to Pouring Details
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default function FoundrySampleCard() {
  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PartData | null>(null);
  const [machine, setMachine] = useState("");
  const [reason, setReason] = useState("");
  const [trialNo, setTrialNo] = useState<string>("");
  const [hodApproved, setHodApproved] = useState(false);
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [samplingDate, setSamplingDate] = useState("");
  const [mouldCount, setMouldCount] = useState("");
  const [sampleTraceability, setSampleTraceability] = useState("");
  const [toolingType, setToolingType] = useState("");
  const [toolingFiles, setToolingFiles] = useState<File[]>([]);

  // New state for routing
  const [currentView, setCurrentView] = useState<'form' | 'submitted' | 'pouring'>('form');
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Pouring details state
  const [pouringDetails, setPouringDetails] = useState<PouringDetails>({
    date: '',
    heatCode: '',
    cComposition: '',
    siComposition: '',
    mnComposition: '',
    pComposition: '',
    sComposition: '',
    mgComposition: '',
    crComposition: '',
    cuComposition: '',
    pouringTempDegC: '',
    pouringTimeSec: '',
    ficHeatNo: '',
    ppCode: '',
    followedBy: '',
    userName: ''
  });

  // New states for pattern data sheet and std box uploads
  const [patternFiles, setPatternFiles] = useState<File[]>([]);
  const [stdFiles, setStdFiles] = useState<File[]>([]);

  // Mould correction details rows
  const [mouldCorrections, setMouldCorrections] = useState<MouldCorrection[]>([
    { id: 1, compressibility: '', squeezePressure: '', fillerSize: '' }
  ]);

  // Add validation helper: all required fields must be populated and HOD approved
  const isAllFieldsFilled = Boolean(
    selectedPart &&
    trialNo &&
    samplingDate &&
    mouldCount &&
    machine &&
    reason &&
    sampleTraceability &&
    toolingType &&
    // Check if all mould corrections have required fields filled
    mouldCorrections.every(correction =>
      correction.compressibility &&
      correction.squeezePressure &&
      correction.fillerSize
    )
  );

  // handlers for tooling files
  const handleToolingFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setToolingFiles(files);
  };

  const removeToolingFile = (index: number) => {
    setToolingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // pattern files handlers
  const handlePatternFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPatternFiles(prev => [...prev, ...files]);
  };

  const removePatternFile = (index: number) => {
    setPatternFiles(prev => prev.filter((_, i) => i !== index));
  };

  // std files handlers
  const handleStdFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setStdFiles(prev => [...prev, ...files]);
  };

  const removeStdFile = (index: number) => {
    setStdFiles(prev => prev.filter((_, i) => i !== index));
  };

  // mould correction handlers
  const handleMouldCorrectionChange = (id: number, field: keyof Omit<MouldCorrection, 'id'>, value: string) => {
    setMouldCorrections(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  useEffect(() => {
    const getMasterParts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/master-list');
        if (!response.ok) {
          throw new Error("Failed to fetch master list");
        }
        const data = await response.json();
        setMasterParts(data);
        setError(null);
      } catch (error) {
        console.error("Error loading master parts:", error);
        setError("Failed to load master parts. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    getMasterParts();
  }, []);

  useEffect(() => {
    if (selectedPart) {
      setSelectedPattern(selectedPart);
    } else {
      setSelectedPattern(null);
    }
  }, [selectedPart]);

  // Generate trial number when selectedPart changes (auto-generate via backend)
  const generateTrialId = async (partName?: string) => {
    const name = partName || selectedPart?.part_name;
    if (!name) {
      setTrialNo('');
      setTrialError(null);
      return;
    }

    setTrialLoading(true);
    setTrialError(null);
    try {
      // call backend API (your backend examples use /api/trial/id?part_name="PART_NAME")
      const res = await fetch(`http://localhost:3000/api/trial/id?part_name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Failed to generate trial id (${res.status}) ${body}`);
      }
      const json = await res.json();
      if (json && json.trialId) {
        setTrialNo(json.trialId);
      } else {
        setTrialNo('');
        setTrialError('Unexpected response from server');
      }
    } catch (err) {
      console.error('Error generating trial id:', err);
      setTrialError('Failed to generate trial number');
    } finally {
      setTrialLoading(false);
    }
  };

  // auto-generate when user selects a part
  useEffect(() => {
    if (!selectedPart) {
      setTrialNo('');
      setTrialError(null);
      return;
    }
    // generate trial id for selected part
    generateTrialId(selectedPart.part_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPart]);

  // Use the new JSON-parsing chemical data
  const chemicalData = selectedPart ? parseChemicalComposition(selectedPart.chemical_composition) : { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' };
  const tensileData = selectedPart ? parseTensileData(selectedPart.tensile) : { tensileStrength: '', yieldStrength: '', elongation: '', impactCold: '', impactRoom: '' };
  const microData = selectedPart ? parseMicrostructureData(selectedPart.micro_structure) : { nodularity: '', pearlite: '', carbide: '' };
  const hardnessData = selectedPart ? parseHardnessData(selectedPart.hardness) : { surface: '', core: '' };

  const handleHodApproval = () => {
    // only allow approval when all required fields are filled
    if (!isAllFieldsFilled) return;
    setHodApproved(true);
  };

  const handlePartChange = (newValue: PartData | null) => {
    setSelectedPart(newValue);
  };

  const handlePatternChange = (newValue: PartData | null) => {
    setSelectedPattern(newValue);
    if (newValue) {
      setSelectedPart(newValue);
    }
  };

  const handleSubmit = () => {
    // only allow submit after HOD has approved
    if (!hodApproved || !selectedPart) return;

    const dataToSubmit = {
      selectedPart,
      selectedPattern,
      machine,
      reason,
      trialNo,
      samplingDate,
      mouldCount,
      sampleTraceability,
      toolingType,
      toolingFiles,
      tensileData: parseTensileData(selectedPart.tensile),
      microData: parseMicrostructureData(selectedPart.micro_structure),
      patternFiles,
      stdFiles,
      mouldCorrections
    };

    // Store the submitted data and show confirmation screen
    setSubmittedData(dataToSubmit);
    setCurrentView('submitted');
  };

  const handlePouringDetailsChange = (details: PouringDetails) => {
    setPouringDetails(details);
  };

  // Render pouring details page when submitted
  if (currentView === 'pouring' && submittedData) {
    return (
      <PouringDetailsTable
        pouringDetails={pouringDetails}
        onPouringDetailsChange={handlePouringDetailsChange}
        submittedData={submittedData}
      />
    );
  }

  // Render submitted confirmation
  if (currentView === 'submitted' && submittedData) {
    return (
      <SampleCardSubmitted
        submittedData={submittedData}
        onBackToForm={() => setCurrentView('form')}
        onProceedToPouring={() => setCurrentView('pouring')}
      />
    );
  }

  // Render main form
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: '100vh', pt: '80px' }}>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress size={60} />
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {!loading && !error && (
            <Paper variant="outlined" sx={{ overflow: "hidden", border: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white }}>
              {/* Header Section */}
              <Box sx={{ p: 3, borderBottom: `3px solid ${SAKTHI_COLORS.primary}`, background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, color: SAKTHI_COLORS.white }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, alignItems: 'start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Pattern Code</Typography>
                    <Autocomplete
                      options={masterParts}
                      value={selectedPattern}
                      onChange={(_, newValue) => handlePatternChange(newValue)}
                      getOptionLabel={(option) => option.pattern_code}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ whiteSpace: 'normal', lineHeight: '1.5', padding: '8px 16px' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.pattern_code}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.part_name}</Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => {
                        const { InputProps, ...other } = params;
                        return (
                          <TextField
                            {...other}
                            placeholder="Select pattern code"
                            size="small"
                            required
                            InputProps={{ ...(InputProps as any), sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2 } }}
                          />
                        );
                      }}
                      slotProps={{ paper: { sx: { width: 'auto', minWidth: '400px', maxWidth: '90vw' } } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Part Name</Typography>
                    <Autocomplete
                      options={masterParts}
                      value={selectedPart}
                      onChange={(_, newValue) => handlePartChange(newValue)}
                      getOptionLabel={(option) => option.part_name}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ whiteSpace: 'normal', lineHeight: '1.5', padding: '8px 16px' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.part_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.pattern_code}</Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => {
                        const { InputProps, ...other } = params;
                        return (
                          <TextField
                            {...other}
                            placeholder="Select from Master list"
                            size="small"
                            required
                            InputProps={{ ...(InputProps as any), sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2 } }}
                          />
                        );
                      }}
                      slotProps={{ paper: { sx: { width: 'auto', minWidth: '400px', maxWidth: '90vw' } } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>TRIAL No</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        value={trialNo}
                        placeholder="Auto-generated"
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2 },
                          endAdornment: (
                            <InputAdornment position="end">
                              {trialLoading ? <CircularProgress size={18} /> : null}
                            </InputAdornment>
                          )
                        }}
                      />
                      <IconButton
                        color="primary"
                        onClick={() => generateTrialId(selectedPart?.part_name)}
                        disabled={!selectedPart || trialLoading}
                        size="large"
                        title="Regenerate trial number"
                        sx={{ bgcolor: SAKTHI_COLORS.white, borderRadius: 2, '&:hover': { bgcolor: '#f0f4ff' } }}
                      >
                        {/* using a simple unicode refresh glyph to avoid extra dependency */}
                        <span style={{ fontSize: 18 }}>⟳</span>
                      </IconButton>
                    </Box>
                    {trialError && <Typography color="error" variant="caption">{trialError}</Typography>}
                  </Box>
                </Box>
              </Box>

              {/* Info Chip */}
              <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                <Chip
                  icon={<span style={{ fontSize: '1.2rem' }}>💡</span>}
                  label="Auto retrieval of spec once part name is selected (Metallurgical Spec)"
                  sx={{
                    bgcolor: selectedPart ? SAKTHI_COLORS.success + '20' : SAKTHI_COLORS.accent + '20',
                    color: SAKTHI_COLORS.darkGray,
                    border: `1px dashed ${selectedPart ? SAKTHI_COLORS.success : SAKTHI_COLORS.accent}`,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 2.5
                  }}
                />
              </Box>

              <Box sx={{ p: 3 }}>
                {/* METALLURGICAL SPECIFICATION Section */}
                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "hidden", mb: 3 }}>
                  {/* Header */}
                  <Box sx={{ bgcolor: SAKTHI_COLORS.accent, p: 1.5, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800, color: SAKTHI_COLORS.white, fontSize: '1rem' }}>
                      METALLURGICAL SPECIFICATION
                    </Typography>
                  </Box>

                  {/* Chemical Composition and Microstructure Row */}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          align="center"
                          sx={{
                            bgcolor: 'red',
                            fontWeight: 700,
                            borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                            fontSize: '0.95rem',
                            py: 1.5
                          }}
                        >
                          Chemical Composition
                        </TableCell>
                        <TableCell
                          colSpan={3}
                          align="center"
                          sx={{
                            bgcolor: 'red',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            py: 1.5
                          }}
                        >
                          Microstructure
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem' }}>C%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem' }}>Si%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem' }}>Mn%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem' }}>P%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem' }}>S%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem' }}>Mg%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem' }}>Cr%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', borderRight: `2px solid ${SAKTHI_COLORS.primary}` }}>Cu%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Nodularity%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Pearlite%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Carbide%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell><TextField fullWidth value={chemicalData.c} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.c ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.c ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.si} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.si ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.si ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.mn} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.mn ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.mn ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.p} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.p ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.p ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.s} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.s ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.s ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.mg} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.mg ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.mg ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.cr} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.cr ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.cr ? 600 : 400 } }} /></TableCell>
                        <TableCell sx={{ borderRight: `2px solid ${SAKTHI_COLORS.primary}` }}><TextField fullWidth value={chemicalData.cu} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.cu ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.cu ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.nodularity} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.nodularity !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.nodularity !== '--' ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.pearlite} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.pearlite !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.pearlite !== '--' ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.carbide} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.carbide !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.carbide !== '--' ? 600 : 400 } }} /></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Mechanical Properties and NDT Inspection Row */}
                  <Table size="small" sx={{ mt: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{
                            bgcolor: 'red',
                            fontWeight: 700,
                            borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                            fontSize: '0.95rem',
                            py: 1.5
                          }}
                        >
                          Mechanical Properties
                        </TableCell>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            bgcolor: 'red',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            py: 1.5
                          }}
                        >
                          NDT Inspection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="center" sx={{ minWidth: '120px', fontSize: '0.85rem' }}>Tensile Strength (Min)</TableCell>
                        <TableCell align="center" sx={{ minWidth: '120px', fontSize: '0.85rem' }}>Yield Strength (Min)</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Elongation%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Impact strength@ Cold Temp °c</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Impact strength@ Room Temp °c</TableCell>
                        <TableCell align="center" colSpan={2} sx={{ fontSize: '0.85rem', borderRight: `2px solid ${SAKTHI_COLORS.primary}` }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5,color:'white'}}>Hardness (BHN)</Typography>
                            <Box sx={{ display: 'flex', borderTop: `1px solid ${SAKTHI_COLORS.lightGray}` }}>
                              <Box sx={{ flex: 1, py: 0.5, borderRight: `1px solid ${SAKTHI_COLORS.lightGray}` }}>Surface</Box>
                              <Box sx={{ flex: 1, py: 0.5 }}>Core</Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: '120px', fontSize: '0.85rem' }}>X-Ray Inspection</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>MPI</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>

                        {/* Tensile Strength */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.tensileStrength}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: tensileData.tensileStrength ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.tensileStrength ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Yield Strength */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.yieldStrength}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: tensileData.yieldStrength ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.yieldStrength ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Elongation */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.elongation}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: tensileData.elongation ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.elongation ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Impact Strength @ Cold Temp */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={selectedPart?.impact ? `${selectedPart.impact} (Cold)` : "--"}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: selectedPart?.impact ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.impact ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Impact Strength @ Room Temp */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={selectedPart?.impact ? `${selectedPart.impact} (Room)` : "--"}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: selectedPart?.impact ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.impact ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Hardness Surface */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={hardnessData.surface}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: hardnessData.surface !== "--" ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: hardnessData.surface !== "--" ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Hardness Core */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={hardnessData.core}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: hardnessData.core !== "--" ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: hardnessData.core !== "--" ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* X-Ray */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={selectedPart?.xray || "--"}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: selectedPart?.xray ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.xray ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* MPI */}
                        <TableCell>
                          <TextField
                            fullWidth
                            placeholder="--"
                            size="small"
                            InputProps={{
                              sx: {
                                bgcolor: SAKTHI_COLORS.white,
                                borderRadius: 1
                              }
                            }}
                          />
                        </TableCell>

                      </TableRow>
                    </TableBody>

                  </Table>
                </Paper>

                {/* Date, Moulds, Machine, Reason, Sample Traceability Table + Pattern Data Sheet + STD Box */}
                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '140px', bgcolor: 'green' }}>Date of Sampling</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '120px', bgcolor: 'green' }}>No. of Moulds</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '180px', bgcolor: 'green' }}>DISA / FOUNDRY-A</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '180px', bgcolor: 'green' }}>Reason For Sampling</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '150px', bgcolor: 'green' }}>Sample Traceability</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '160px', bgcolor: 'green' }}>Pattern Data Sheet</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '160px', bgcolor: 'green' }}> Std Doc</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <TextField
                            fullWidth
                            type="date"
                            value={samplingDate}
                            onChange={(e) => setSamplingDate(e.target.value)}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            required
                            InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            type="number"
                            value={mouldCount}
                            onChange={(e) => setMouldCount(e.target.value)}
                            placeholder="10"
                            size="small"
                            inputProps={{ min: 0 }}
                            required
                            InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" required={!machine}>
                            <Select
                              value={machine}
                              onChange={(e) => setMachine(e.target.value)}
                              displayEmpty
                              sx={{ bgcolor: SAKTHI_COLORS.white, borderRadius: 1 }}
                            >
                              <MenuItem value="" disabled>Select Machine</MenuItem>
                              {MACHINES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" required={!reason}>
                            <Select
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              displayEmpty
                              sx={{ bgcolor: SAKTHI_COLORS.white, borderRadius: 1 }}
                            >
                              <MenuItem value="" disabled>Select Reason</MenuItem>
                              {SAMPLING_REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={sampleTraceability}
                            onChange={(e) => setSampleTraceability(e.target.value)}
                            placeholder="Enter option"
                            size="small"
                            required
                            InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }}
                          />
                        </TableCell>

                        {/* Pattern Data Sheet Upload */}
                        <TableCell>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{
                              borderWidth: 2,
                              borderStyle: 'dashed',
                              borderColor: SAKTHI_COLORS.primary,
                              color: SAKTHI_COLORS.primary,
                              py: 1.5,
                              bgcolor: SAKTHI_COLORS.white,
                              '&:hover': {
                                borderColor: SAKTHI_COLORS.lightBlue,
                                backgroundColor: SAKTHI_COLORS.background,
                                borderWidth: 2
                              }
                            }}
                          >
                            📎 Upload Pattern PDF / Image
                            <input
                              type="file"
                              hidden
                              accept=".jpg,.jpeg,.png,.pdf"
                              multiple
                              onChange={handlePatternFilesChange}
                            />
                          </Button>

                          {patternFiles.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: 'column' }}>
                              {patternFiles.map((f, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', px: 1, py: 0.5, borderRadius: 1, border: `1px solid ${SAKTHI_COLORS.lightGray}`, justifyContent: 'space-between' }}>
                                  <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                                  <Button size="small" onClick={() => removePatternFile(i)}>Remove</Button>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </TableCell>

                        {/* STD Box Upload */}
                        <TableCell>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{
                              borderWidth: 2,
                              borderStyle: 'dashed',
                              borderColor: SAKTHI_COLORS.primary,
                              color: SAKTHI_COLORS.primary,
                              py: 1.5,
                              bgcolor: SAKTHI_COLORS.white,
                              '&:hover': {
                                borderColor: SAKTHI_COLORS.lightBlue,
                                backgroundColor: SAKTHI_COLORS.background,
                                borderWidth: 2
                              }
                            }}
                          >
                            📎 Attach STD PDF
                            <input
                              type="file"
                              hidden
                              accept=".pdf"
                              multiple
                              onChange={handleStdFilesChange}
                            />
                          </Button>

                          {stdFiles.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: 'column' }}>
                              {stdFiles.map((f, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', px: 1, py: 0.5, borderRadius: 1, border: `1px solid ${SAKTHI_COLORS.lightGray}`, justifyContent: 'space-between' }}>
                                  <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                                  <Button size="small" onClick={() => removeStdFile(i)}>Remove</Button>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </TableCell>

                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>

                {/* Tooling Modification Done */}
                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "hidden", mb: 3, p: 3, bgcolor: '#D3D3D3' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SAKTHI_COLORS.darkGray, fontSize: '1rem', mb: 2 }}>
                    Tooling Modification Done
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Type</Typography>
                      <TextField
                        fullWidth
                        value={toolingType}
                        onChange={(e) => setToolingType(e.target.value)}
                        placeholder="Enter modification type"
                        size="small"
                        multiline
                        rows={2}
                        required
                        InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Attach Photo or PDF</Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{
                          borderWidth: 2,
                          borderStyle: 'dashed',
                          borderColor: SAKTHI_COLORS.primary,
                          color: SAKTHI_COLORS.primary,
                          py: 1.5,
                          bgcolor: SAKTHI_COLORS.white,
                          '&:hover': {
                            borderColor: SAKTHI_COLORS.lightBlue,
                            backgroundColor: SAKTHI_COLORS.background,
                            borderWidth: 2
                          }
                        }}
                      >
                        📎 Upload Files
                        <input
                          type="file"
                          hidden
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                          multiple
                          onChange={handleToolingFilesChange}
                        />
                      </Button>
                      {/* show selected files */}
                      {toolingFiles.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {toolingFiles.map((f, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', px: 1, py: 0.5, borderRadius: 1, border: `1px solid ${SAKTHI_COLORS.lightGray}` }}>
                              <Typography variant="caption" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                              <Button size="small" onClick={() => removeToolingFile(i)}>Remove</Button>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>

               {/* Mould correction details */}
<Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "hidden", mb: 3, p: 3 }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SAKTHI_COLORS.darkGray, fontSize: '1rem' }}>
      Mould Correction Details
    </Typography>
   
  </Box>

  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Compressibility</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Squeeze Pressure</TableCell>
        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Filler Size</TableCell>
        
      </TableRow>
    </TableHead>
    <TableBody>
      {mouldCorrections.map((row, _index) => (
        <TableRow key={row.id}>
          {/* Compressibility */}
          <TableCell>
            <TextField 
              fullWidth 
              value={row.compressibility} 
              size="small" 
              placeholder="Enter value"
              required
              onChange={(e) => handleMouldCorrectionChange(row.id, 'compressibility', e.target.value)}
              InputProps={{ 
                sx: { 
                  bgcolor: SAKTHI_COLORS.white, 
                  borderRadius: 1,
                  '& .MuiInputBase-input': {
                    textAlign: 'center'
                  }
                } 
              }}
            />
          </TableCell>
          
          {/* Squeeze Pressure */}
          <TableCell>
            <TextField 
              fullWidth 
              value={row.squeezePressure} 
              size="small" 
              placeholder="Enter pressure"
              required
              onChange={(e) => handleMouldCorrectionChange(row.id, 'squeezePressure', e.target.value)}
              InputProps={{ 
                sx: { 
                  bgcolor: SAKTHI_COLORS.white, 
                  borderRadius: 1,
                  '& .MuiInputBase-input': {
                    textAlign: 'center'
                  }
                } 
              }}
            />
          </TableCell>
          
          {/* Filler Size */}
          <TableCell>
            <TextField 
              fullWidth 
              value={row.fillerSize} 
              size="small" 
              placeholder="Enter size"
              required
              onChange={(e) => handleMouldCorrectionChange(row.id, 'fillerSize', e.target.value)}
              InputProps={{ 
                sx: { 
                  bgcolor: SAKTHI_COLORS.white, 
                  borderRadius: 1,
                  '& .MuiInputBase-input': {
                    textAlign: 'center'
                  }
                } 
              }}
            />
          </TableCell>
          
         
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Paper>

                {/* HOD Approval Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, p: 3, bgcolor: hodApproved ? SAKTHI_COLORS.success + '10' : SAKTHI_COLORS.background, borderRadius: 2, border: `2px solid ${hodApproved ? SAKTHI_COLORS.success : SAKTHI_COLORS.lightGray}`, transition: 'all 0.3s ease' }}>
                  {hodApproved && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: SAKTHI_COLORS.success }}>✓ Approved by HOD</Typography>
                    </Box>
                  )}
                  <Box sx={{ marginLeft: 'auto' }}>
                    <Button
                      variant={hodApproved ? "contained" : "outlined"}
                      color={hodApproved ? "success" : "primary"}
                      onClick={handleHodApproval}
                      disabled={!isAllFieldsFilled || hodApproved} // only enable when all fields are filled
                      sx={{
                        minWidth: 200,
                        height: 48,
                        fontSize: '1rem',
                        fontWeight: 700,
                        boxShadow: hodApproved ? 2 : 0,
                        '&:disabled': {
                          bgcolor: SAKTHI_COLORS.success,
                          color: SAKTHI_COLORS.white
                        }
                      }}
                    >
                      {hodApproved ? "✓ APPROVED" : "HOD APPROVAL"}
                    </Button>
                  </Box>
                </Box>

                {/* Submit Button */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={!hodApproved} // submit enabled only after HOD approval
                    sx={{
                      minWidth: 250,
                      height: 56,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${SAKTHI_COLORS.lightBlue} 0%, ${SAKTHI_COLORS.primary} 100%)`
                      },
                      '&:disabled': {
                        bgcolor: SAKTHI_COLORS.lightGray,
                        color: SAKTHI_COLORS.darkGray
                      }
                    }}
                  >
                    Submit Sample Card
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}