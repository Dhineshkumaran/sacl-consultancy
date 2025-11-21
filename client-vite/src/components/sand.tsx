import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Chip,
  FormControl,
  Alert,
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
export interface SandProperties {
  tClay: string;
  aClay: string;
  vcm: string;
  loi: string;
  afs: string;
  gcs: string;
  moi: string;
  compactability: string;
  perm: string;
  otherRemarks: string;
  date: string; // YYYY-MM-DD
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

interface SandPropertiesTableProps {
  submittedData?: SubmittedData;
  onSave?: (data: SandProperties) => void;
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
                placeholder="No modifications recorded" 
                size="small" 
                multiline 
                rows={2} 
                InputProps={{ 
                  readOnly: true,
                  sx: { bgcolor: SAKTHI_COLORS.background, borderRadius: 1 } 
                }} 
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Attach Photo or PDF</Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                disabled
                sx={{ 
                  borderWidth: 2, 
                  borderStyle: 'dashed', 
                  borderColor: SAKTHI_COLORS.lightGray, 
                  color: SAKTHI_COLORS.darkGray, 
                  py: 1.5, 
                  bgcolor: SAKTHI_COLORS.background,
                }}
              >
                📎 No Files Attached
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* HOD Approval Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, p: 3, bgcolor: SAKTHI_COLORS.success + '10', borderRadius: 2, border: `2px solid ${SAKTHI_COLORS.success}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: SAKTHI_COLORS.success }}>✓ Approved by HOD</Typography>
          </Box>
          <Box sx={{ marginLeft: 'auto' }}>
            <Button 
              variant="contained" 
              color="success" 
              disabled
              sx={{ 
                minWidth: 200, 
                height: 48, 
                fontSize: '1rem', 
                fontWeight: 700, 
                boxShadow: 2,
                bgcolor: SAKTHI_COLORS.success,
                color: SAKTHI_COLORS.white 
              }}
            >
              ✓ APPROVED
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

/* -------------------------
   Stable Field component (memoized)
   ------------------------- */
const Field = React.memo(function Field({
  value,
  onChange,
  onBlur,
  error,
  helperText,
  multiline = false,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: string;
  multiline?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <TextField
      variant="outlined"
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      multiline={multiline}
      rows={multiline ? 2 : 1}
      placeholder={placeholder}
      type={type}
      error={error}
      helperText={helperText}
      inputProps={{ autoComplete: "off" }}
      sx={{
        background: "transparent",
        "& .MuiOutlinedInput-notchedOutline": {
          border: error ? "1px solid #d32f2f" : "1px solid #000",
        },
        "& .MuiOutlinedInput-input": { padding: "8px 10px", fontSize: "0.92rem" },
      }}
    />
  );
});
Field.displayName = "Field";

/* -------------------------
   Main Sand Properties Table Component
   ------------------------- */
const SandPropertiesTable: React.FC<SandPropertiesTableProps> = ({
  submittedData,
  onSave,
  onComplete,
  readOnly = false,
}) => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [data, setData] = useState<SandProperties>({
    tClay: "",
    aClay: "",
    vcm: "",
    loi: "",
    afs: "",
    gcs: "",
    moi: "",
    compactability: "",
    perm: "",
    otherRemarks: "",
    date: today,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submittedSandData, setSubmittedSandData] = useState<SandProperties | null>(null);

  const initialTouched: Record<keyof SandProperties, boolean> = {
    tClay: false,
    aClay: false,
    vcm: false,
    loi: false,
    afs: false,
    gcs: false,
    moi: false,
    compactability: false,
    perm: false,
    otherRemarks: false,
    date: false,
  };
  const [touched, setTouched] = useState(initialTouched);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const setField = useCallback((key: keyof SandProperties, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleBlur = useCallback((key: keyof SandProperties) => {
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const allFilled = Object.values(data).every((v) => v.toString().trim() !== "");

  const shouldShowError = useCallback((key: keyof SandProperties) => {
    return (touched[key] || triedSubmit) && data[key].toString().trim() === "";
  }, [touched, triedSubmit, data]);

  const handleSave = useCallback(() => {
    setTriedSubmit(true);
    if (!allFilled) {
      setTouched(Object.keys(touched).reduce((acc, k) => {
        (acc as any)[k] = true;
        return acc;
      }, { ...initialTouched }));
      return;
    }
    setSubmittedSandData(data);
    setSubmitted(true);
    onSave && onSave(data);
  }, [allFilled, data, onSave]);

  const handleClear = useCallback(() => {
    setData({
      tClay: "",
      aClay: "",
      vcm: "",
      loi: "",
      afs: "",
      gcs: "",
      moi: "",
      compactability: "",
      perm: "",
      otherRemarks: "",
      date: today,
    });
    setTouched(initialTouched);
    setTriedSubmit(false);
  }, [today]);

  const handleProceedToMould = useCallback(() => {
    onComplete && onComplete();
  }, [onComplete]);

  // Helper to render the Field component
  const RenderCell = useCallback(({ keyName, multiline = false }: { keyName: keyof SandProperties; multiline?: boolean }) => {
    const value = submitted && submittedSandData ? submittedSandData[keyName] : data[keyName];
    
    if (submitted || readOnly) {
      return (
        <Typography
          variant="body2"
          sx={{
            minHeight: multiline ? 56 : 40,
            display: "flex",
            alignItems: multiline ? "flex-start" : "center",
            px: 1,
            py: multiline ? 1 : 0,
            color: value ? "text.primary" : "text.secondary",
            fontSize: "0.9rem",
            whiteSpace: multiline ? "normal" : "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value || "--"}
        </Typography>
      );
    }

    return (
      <Field
        value={value}
        onChange={(v) => setField(keyName, v)}
        onBlur={() => handleBlur(keyName)}
        error={shouldShowError(keyName)}
        helperText={shouldShowError(keyName) ? "Required" : ""}
        multiline={multiline}
        placeholder={keyName === "date" ? undefined : undefined}
        type={keyName === "date" ? "date" : "text"}
      />
    );
  }, [data, submitted, submittedSandData, readOnly, setField, handleBlur, shouldShowError]);

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
            ✅ Sand Properties Submitted Successfully!
          </Alert>
          
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: SAKTHI_COLORS.primary }}>
            Sand Data Successfully Recorded
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, color: SAKTHI_COLORS.darkGray }}>
            Your sand properties have been successfully submitted and stored in the system.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="outlined" 
              onClick={() => setSubmitted(false)}
              sx={{ minWidth: 140 }}
            >
              Back to Edit
            </Button>
            <Button 
              variant="contained" 
              onClick={handleProceedToMould}
              sx={{ 
                minWidth: 160, 
                background: `linear-gradient(135deg, ${SAKTHI_COLORS.accent} 0%, ${SAKTHI_COLORS.primary} 100%)`,
                fontWeight: 700 
              }}
            >
              Proceed to Moulding
            </Button>
          </Box>
        </Paper>

        {/* Submitted Sand Properties (read-only) */}
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 1200,
            mx: "auto",
            border: "2px solid #000",
            bgcolor: "#f5f5f5",
            p: 0,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              background: "#bfbfbf",
              borderBottom: "2px solid #000",
              px: 1.5,
              py: 0.7,
            }}
          >
            <Typography sx={{ fontWeight: 800, letterSpacing: 0.5, fontSize: "0.95rem" }}>
              SAND PROPERTIES (Submitted)
            </Typography>
            <Box sx={{ flex: 1 }} />
          </Box>

          <Box sx={{ px: 0, py: 0 }}>
            <Table size="small" sx={{ borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={9} sx={{ border: "none", background: "transparent" }} />
                  <TableCell sx={{ border: "1px solid #000", background: "#d0d0d0", px: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Date :</Typography>
                      <Typography sx={{ fontSize: "0.9rem" }}>{submittedSandData?.date}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>

                <TableRow>
                  {[
                    "T.Clay",
                    "A.Clay",
                    "VCM",
                    "LOI",
                    "AFS",
                    "G.C.S",
                    "MOI",
                    "Compactability",
                    "Perm",
                    "Other Remarks",
                  ].map((label) => (
                    <TableCell
                      key={label}
                      align="center"
                      sx={{
                        border: "1px solid #000",
                        background: "#d0d0d0",
                        fontWeight: 700,
                        px: 0.5,
                        py: 0.7,
                        fontSize: "0.85rem",
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                <TableRow>
                  <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}>
                    <RenderCell keyName="tClay" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}>
                    <RenderCell keyName="aClay" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                    <RenderCell keyName="vcm" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                    <RenderCell keyName="loi" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                    <RenderCell keyName="afs" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                    <RenderCell keyName="gcs" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                    <RenderCell keyName="moi" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", width: 140, p: 0.5 }}>
                    <RenderCell keyName="compactability" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                    <RenderCell keyName="perm" />
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", p: 0.5 }}>
                    <RenderCell keyName="otherRemarks" multiline />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={10} sx={{ border: "none", background: "transparent", height: 12 }} />
                </TableRow>
              </TableBody>
            </Table>
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

      {/* Sand Properties Table (editable) */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1200,
          mx: "auto",
          border: "2px solid #000",
          bgcolor: "#f5f5f5",
          p: 0,
          mb: 3,
        }}
      >
        {/* Top bar: label only (no date here) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            background: "#bfbfbf",
            borderBottom: "2px solid #000",
            px: 1.5,
            py: 0.7,
          }}
        >
          <Typography sx={{ fontWeight: 800, letterSpacing: 0.5, fontSize: "0.95rem" }}>
            SAND PROPERTIES:
          </Typography>
          <Box sx={{ flex: 1 }} />
        </Box>

        {/* Main table */}
        <Box sx={{ px: 0, py: 0 }}>
          <Table size="small" sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              {/* Row to position Date input inside the table on the right */}
              <TableRow>
                <TableCell colSpan={9} sx={{ border: "none", background: "transparent" }} />
                <TableCell sx={{ border: "1px solid #000", background: "#d0d0d0", px: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Date :</Typography>
                    <Field
                      value={data.date}
                      onChange={(v) => setField("date", v)}
                      onBlur={() => handleBlur("date")}
                      error={shouldShowError("date")}
                      helperText={shouldShowError("date") ? "Required" : ""}
                      type="date"
                    />
                  </Box>
                </TableCell>
              </TableRow>

              {/* Header labels */}
              <TableRow>
                {[
                  "T.Clay",
                  "A.Clay",
                  "VCM",
                  "LOI",
                  "AFS",
                  "G.C.S",
                  "MOI",
                  "Compactability",
                  "Perm",
                  "Other Remarks",
                ].map((label) => (
                  <TableCell
                    key={label}
                    align="center"
                    sx={{
                      border: "1px solid #000",
                      background: "#d0d0d0",
                      fontWeight: 700,
                      px: 0.5,
                      py: 0.7,
                      fontSize: "0.85rem",
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}>
                  <RenderCell keyName="tClay" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}>
                  <RenderCell keyName="aClay" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                  <RenderCell keyName="vcm" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                  <RenderCell keyName="loi" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                  <RenderCell keyName="afs" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                  <RenderCell keyName="gcs" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                  <RenderCell keyName="moi" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 140, p: 0.5 }}>
                  <RenderCell keyName="compactability" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
                  <RenderCell keyName="perm" />
                </TableCell>
                <TableCell sx={{ border: "1px solid #000", p: 0.5 }}>
                  <RenderCell keyName="otherRemarks" multiline />
                </TableCell>
              </TableRow>

              {/* Spacer row (keeps layout like the screenshot) */}
              <TableRow>
                <TableCell colSpan={10} sx={{ border: "none", background: "transparent", height: 12 }} />
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* Actions row */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", p: 2 }}>
          <Button variant="outlined" color="secondary" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={!allFilled}>
            Submit Sand Properties
          </Button>
        </Box>
      </Paper>

      {/* Success message when completed */}
      {allFilled && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Sand properties data is ready to be submitted. Click "Submit Sand Properties" to proceed.
        </Alert>
      )}
    </Box>
  );
};

export default SandPropertiesTable;