import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TextField,
  Button,
  Alert,
  FormControl,
} from "@mui/material";

// Colors
const SAKTHI_COLORS = {
  primary: '#2950bbff',
  secondary: '#DC2626',
  accent: '#F59E0B',
  background: '#F8FAFC',
  lightBlue: '#3B82F6',
  darkGray: '#374151',
  lightGray: '#E5E7EB',
  white: '#FFFFFF',
  success: '#10B981',
};

/* -------------------------
   Types
   ------------------------- */
export interface MouldingData {
  mouldThickness: string;
  compressability: string;
  squeezePressure: string;
  mouldHardness: string;
  userName: string;
  otherRemarks: string;
  type: string;
}

interface SubmittedData {
  selectedPart: any | null;
  selectedPattern: any | null;
  machine: string;
  reason: string;
  trialNo: string;
  samplingDate: string;
  mouldCount: string;
  sampleTraceability: string;
}

interface MouldingTableProps {
  submittedData?: SubmittedData;
  onSave?: (data: MouldingData) => void;
  onComplete?: () => void;
  readOnly?: boolean;
}

const parseTensileData = (tensile: string) => {
  const lines = tensile.split('\n');
  let tensileStrength = '';
  let yieldStrength = '';
  let elongation = '';
  
  lines.forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine.match(/\d+\s*(MPa|N\/mm²|Mpa|Kgf\/mm²)/) || cleanLine.includes('Tensile Strength') || cleanLine.match(/[≥>]\s*\d+/)) {
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
  
  return { tensileStrength, yieldStrength, elongation, impactCold: '', impactRoom: '' };
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

/* -------------------------
   Component to display submitted sample card data (read-only)
   ------------------------- */
const SubmittedSampleCard: React.FC<{ submittedData: SubmittedData }> = ({ submittedData }) => {
  const chemicalData = submittedData.selectedPart ? submittedData.selectedPart.chemical_composition : { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' };
  const tensileData = submittedData.selectedPart ? parseTensileData(submittedData.selectedPart.tensile) : { tensileStrength: '', yieldStrength: '', elongation: '', impactCold: '', impactRoom: '' };
  const microData = submittedData.selectedPart ? parseMicrostructureData(submittedData.selectedPart.micro_structure) : { nodularity: '', pearlite: '', carbide: '' };
  const hardnessData = submittedData.selectedPart ? parseHardnessData(submittedData.selectedPart.hardness) : { surface: '', core: '' };

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", border: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white, mb: 3 }}>
      {/* Header Section */}
      <Box sx={{ p: 3, borderBottom: `3px solid ${SAKTHI_COLORS.primary}`, background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, color: SAKTHI_COLORS.white }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, alignItems: 'start' }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Pattern Code</Typography>
            <TextField 
              fullWidth
              value={submittedData.selectedPattern?.pattern_code || ''}
              size="small"
              InputProps={{ 
                readOnly: true,
                sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } 
              }}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Part Name</Typography>
            <TextField 
              fullWidth
              value={submittedData.selectedPart?.part_name || ''}
              size="small"
              InputProps={{ 
                readOnly: true,
                sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } 
              }}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>TRIAL No</Typography>
            <TextField 
              fullWidth
              value={submittedData.trialNo} 
              size="small" 
              InputProps={{ 
                readOnly: true,
                sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } 
              }} 
            />
          </Box>
        </Box>
      </Box>

      {/* Info Chip */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Chip 
          icon={<span style={{ fontSize: '1.2rem' }}>📋</span>} 
          label="Submitted Sample Card Data (Read Only)" 
          sx={{ 
            bgcolor: SAKTHI_COLORS.success + '20', 
            color: SAKTHI_COLORS.darkGray, 
            border: `1px dashed ${SAKTHI_COLORS.success}`, 
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
                <TableCell colSpan={8} align="center" sx={{ bgcolor: 'red', fontWeight: 700, borderRight: `2px solid ${SAKTHI_COLORS.primary}`, fontSize: '0.95rem', py: 1.5 }}>
                  Chemical Composition
                </TableCell>
                <TableCell colSpan={3} align="center" sx={{ bgcolor: 'red', fontWeight: 700, fontSize: '0.95rem', py: 1.5 }}>
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
                <TableCell><TextField fullWidth value={chemicalData.c} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.si} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.mn} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.p} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.s} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.mg} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.cr} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell sx={{ borderRight: `2px solid ${SAKTHI_COLORS.primary}` }}><TextField fullWidth value={chemicalData.cu} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={microData.nodularity} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={microData.pearlite} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={microData.carbide} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Mechanical Properties and NDT Inspection Row */}
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ bgcolor: 'red', fontWeight: 700, borderRight: `2px solid ${SAKTHI_COLORS.primary}`, fontSize: '0.95rem', py: 1.5 }}>
                  Mechanical Properties
                </TableCell>
                <TableCell colSpan={4} align="center" sx={{ bgcolor: 'red', fontWeight: 700, fontSize: '0.95rem', py: 1.5 }}>
                  NDT Inspection
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell align="center" sx={{ minWidth: '120px', fontSize: '0.85rem' }}>Tensile Strength (Min)</TableCell>
                <TableCell align="center" sx={{ minWidth: '120px', fontSize: '0.85rem' }}>Yield Strength (Min)</TableCell>
                <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Elongation%</TableCell>
                <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Impact strength@ Cold Temp0c</TableCell>
                <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem' }}>Impact strength@ Room Temp0c</TableCell>
                <TableCell align="center" colSpan={2} sx={{ fontSize: '0.85rem', borderRight: `2px solid ${SAKTHI_COLORS.primary}` }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5, color:'white'}}>Hardness (BHN)</Typography>
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
                <TableCell><TextField fullWidth value={tensileData.tensileStrength} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={tensileData.yieldStrength} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={tensileData.elongation} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={hardnessData.surface} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell sx={{ borderRight: `2px solid ${SAKTHI_COLORS.primary}` }}><TextField fullWidth value={hardnessData.core} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth value={submittedData.selectedPart?.xray || ""} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1, fontWeight: 600 } }} /></TableCell>
                <TableCell><TextField fullWidth placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1 } }} /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        {/* Date, Moulds, Machine, Reason, Sample Traceability Table */}
        <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '150px', bgcolor: 'green' }}>Date of Sampling</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '120px', bgcolor: 'green' }}>No. of Moulds</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '180px', bgcolor: 'green' }}>DISA / FOUNDRY-A</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '180px', bgcolor: 'green' }}>Reason For Sampling</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '150px', bgcolor: 'green' }}>Sample Traceability</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <TextField 
                    fullWidth 
                    value={submittedData.samplingDate} 
                    size="small" 
                    InputProps={{ 
                      readOnly: true,
                      sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1 } 
                    }} 
                  />
                </TableCell>
                <TableCell>
                  <TextField 
                    fullWidth 
                    value={submittedData.mouldCount} 
                    placeholder="10" 
                    size="small" 
                    InputProps={{ 
                      readOnly: true,
                      sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1 } 
                    }} 
                  />
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <TextField
                      value={submittedData.machine}
                      size="small"
                      InputProps={{
                        readOnly: true,
                        sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1 }
                      }}
                    />
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <TextField
                      value={submittedData.reason}
                      size="small"
                      InputProps={{
                        readOnly: true,
                        sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1 }
                      }}
                    />
                  </FormControl>
                </TableCell>
                <TableCell>
                  <TextField 
                    fullWidth 
                    value={submittedData.sampleTraceability} 
                    placeholder="Enter option" 
                    size="small" 
                    InputProps={{ 
                      readOnly: true,
                      sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1 } 
                    }} 
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Paper>
  );
};

/* -------------------------
   Main Moulding Table Component
   ------------------------- */
const MouldingTable: React.FC<MouldingTableProps> = ({
  submittedData,
  onSave,
  onComplete,
}) => {
  const [data, setData] = useState<MouldingData>({
    mouldThickness: "",
    compressability: "",
    squeezePressure: "",
    mouldHardness: "",
    userName: "",
    otherRemarks: "",
    type: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submittedMouldData, setSubmittedMouldData] = useState<MouldingData | null>(null);

  const setField = useCallback((key: keyof MouldingData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allFilled = Object.values(data).every((v) => v.toString().trim() !== "");

  const handleSave = useCallback(() => {
    if (!allFilled) return;
    setSubmittedMouldData(data);
    setSubmitted(true);
    onSave && onSave(data);
  }, [allFilled, data, onSave]);

  const handleCompleteProcess = useCallback(() => {
    onComplete && onComplete();
  }, [onComplete]);

  const handleBackToEdit = useCallback(() => {
    setSubmitted(false);
  }, []);

  // Success view after submission
  if (submitted) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Display submitted sample card data */}
        {submittedData && (
          <SubmittedSampleCard submittedData={submittedData} />
        )}

        {/* Success message */}
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mb: 3, bgcolor: SAKTHI_COLORS.success + '10', border: `2px solid ${SAKTHI_COLORS.success}` }}>
          <Alert severity="success" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 600 }}>
            ✅ Moulding Data Submitted Successfully!
          </Alert>
          
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: SAKTHI_COLORS.primary }}>
            Moulding Process Completed
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, color: SAKTHI_COLORS.darkGray }}>
            Your moulding data has been successfully submitted. The entire sample card process is now complete.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              onClick={handleBackToEdit}
              sx={{ minWidth: 140 }}
            >
              Back to Edit
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCompleteProcess}
              sx={{ 
                minWidth: 160, 
                background: `linear-gradient(135deg, ${SAKTHI_COLORS.success} 0%, ${SAKTHI_COLORS.primary} 100%)`,
                fontWeight: 700 
              }}
            >
              Complete Process
            </Button>
          </Box>
        </Paper>

        {/* Submitted Moulding Data (read-only) */}
        <Paper elevation={3} sx={{ p: 2, bgcolor: "#c8d4f0", border: "2px solid black", mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ textDecoration: "underline", mb: 1 }}>
            MOULDING (Submitted):
          </Typography>

          <Table size="small" sx={{ border: "2px solid black" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ border: "2px solid black", bgcolor: "white", color: "red", fontWeight: "bold" }}>
                  MOULDING
                </TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Mould Thickness</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Compressability</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Squeeze Pressure</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Mould Hardness</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>User Name</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Other Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "2px solid black", height: 60 }}>
                  <Typography variant="body2" sx={{ p: 1 }}>
                    {submittedMouldData?.type || "--"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: "2px solid black" }}>
                  <Typography variant="body2" sx={{ p: 1 }}>
                    {submittedMouldData?.mouldThickness || "--"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: "2px solid black" }}>
                  <Typography variant="body2" sx={{ p: 1 }}>
                    {submittedMouldData?.compressability || "--"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: "2px solid black" }}>
                  <Typography variant="body2" sx={{ p: 1 }}>
                    {submittedMouldData?.squeezePressure || "--"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: "2px solid black" }}>
                  <Typography variant="body2" sx={{ p: 1 }}>
                    {submittedMouldData?.mouldHardness || "--"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: "2px solid black" }}>
                  <Typography variant="body2" sx={{ p: 1 }}>
                    {submittedMouldData?.userName || "--"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ border: "2px solid black" }}>
                  <Typography variant="body2" sx={{ p: 1 }}>
                    {submittedMouldData?.otherRemarks || "--"}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Box sx={{ position: "relative", border: "2px solid black", borderTop: "none", height: 80, mt: -1 }}>
            <Chip
              label={`Type: ${submittedMouldData?.type || "--"}`}
              sx={{ position: "absolute", right: 140, top: 10, bgcolor: "yellow", border: "1px solid black" }}
            />
            <Chip
              label={`Username: ${submittedMouldData?.userName || "--"}`}
              sx={{ position: "absolute", right: 10, bottom: 10, bgcolor: "yellow", border: "1px solid black" }}
            />
          </Box>
        </Paper>
      </Box>
    );
  }

  // Main editable view
  return (
    <Box sx={{ p: 3 }}>
      {/* Display submitted sample card data if provided */}
      {submittedData && (
        <SubmittedSampleCard submittedData={submittedData} />
      )}

      {/* Moulding Table (editable) */}
      <Paper elevation={3} sx={{ p: 2, bgcolor: "#c8d4f0", border: "2px solid black", mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ textDecoration: "underline", mb: 1 }}>
          MOULDING:
        </Typography>

        <Table size="small" sx={{ border: "2px solid black" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: "2px solid black", bgcolor: "white", color: "red", fontWeight: "bold" }}>
                MOULDING
              </TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Mould Thickness</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Compressability</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Squeeze Pressure</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Mould Hardness</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>User Name</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Other Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ border: "2px solid black", height: 60, p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.type}
                  onChange={(e) => setField("type", e.target.value)}
                  placeholder="Enter type"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.mouldThickness}
                  onChange={(e) => setField("mouldThickness", e.target.value)}
                  placeholder="Enter thickness"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.compressability}
                  onChange={(e) => setField("compressability", e.target.value)}
                  placeholder="Enter compressability"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.squeezePressure}
                  onChange={(e) => setField("squeezePressure", e.target.value)}
                  placeholder="Enter pressure"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.mouldHardness}
                  onChange={(e) => setField("mouldHardness", e.target.value)}
                  placeholder="Enter hardness"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.userName}
                  onChange={(e) => setField("userName", e.target.value)}
                  placeholder="Enter username"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.otherRemarks}
                  onChange={(e) => setField("otherRemarks", e.target.value)}
                  placeholder="Enter remarks"
                  multiline
                  rows={2}
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ position: "relative", border: "2px solid black", borderTop: "none", height: 80, mt: -1, p: 1 }}>
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setData({
            mouldThickness: "",
            compressability: "",
            squeezePressure: "",
            mouldHardness: "",
            userName: "",
            otherRemarks: "",
            type: "",
          })}>
            Clear
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={!allFilled}>
            Submit Moulding Data
          </Button>
        </Box>
      </Paper>

      {/* Success message when completed */}
      {allFilled && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Moulding data is ready to be submitted. Click "Submit Moulding Data" to proceed.
        </Alert>
      )}
    </Box>
  );
};

export default MouldingTable;