import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  ThemeProvider,
  createTheme,
  Box,
  Typography,
  Chip,
  FormControl,
  Button,
  Alert,
} from '@mui/material';

import SandPropertiesTable from './sand';
import type { SandProperties } from './sand';
import MouldingTable from './moulding';

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

const theme = createTheme({
  palette: {
    primary: { main: SAKTHI_COLORS.primary },
    secondary: { main: SAKTHI_COLORS.secondary },
  },
});

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

// Exported interfaces
export interface PouringDetails {
  date: string;
  heatCode: string;
  cComposition: string;
  siComposition: string;
  mnComposition: string;
  pComposition: string;
  sComposition: string;
  mgComposition: string;
  crComposition: string;
  cuComposition: string;
  pouringTempDegC: string;
  pouringTimeSec: string;
  ficHeatNo: string;
  ppCode: string;
  followedBy: string;
  userName: string;
}

export interface SubmittedData {
  selectedPart: any | null;
  selectedPattern: any | null;
  machine: string;
  reason: string;
  trialNo: string;
  samplingDate: string;
  mouldCount: string;
  sampleTraceability: string;
}

interface PouringDetailsProps {
  pouringDetails: PouringDetails;
  onPouringDetailsChange: (details: PouringDetails) => void;
  submittedData: SubmittedData;
  readOnly?: boolean;
}

// Component to display submitted sample card data (exact same tables)
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

const PouringDetailsTable: React.FC<PouringDetailsProps> = ({ 
  pouringDetails, 
  onPouringDetailsChange, 
  submittedData,
  readOnly = false 
}) => {
  const handleChange = (field: string, value: string) => {
    if (!readOnly) {
      onPouringDetailsChange({
        ...pouringDetails,
        [field]: value
      });
    }
  };

  // Auto-fetch current date
  useEffect(() => {
    if (!pouringDetails.date) {
      const currentDate = new Date().toISOString().split('T')[0];
      handleChange('date', currentDate);
    }
  }, []);

  // HOD approval and submission state
  const [hodApproved, setHodApproved] = useState<boolean>(false);
  const [submitInProgress, setSubmitInProgress] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'pouring' | 'success' | 'sand' | 'moulding'>('pouring');
  const [sandData, setSandData] = useState<SandProperties | null>(null);

  const handleHodApproval = () => {
    if (!submittedData) return; // require submitted sample card
    setHodApproved(true);
  };

  const handleFinalSubmit = () => {
    if (!hodApproved) return;
    setSubmitInProgress(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitInProgress(false);
      setCurrentView('success');
    }, 600);
  };

  // keep sandData usage to avoid unused-variable lint
  useEffect(() => {
    if (sandData) {
      // placeholder: sandData is available after sand step
      // we log it for now; later this can be sent to backend or passed to moulding
      // eslint-disable-next-line no-console
      console.log('Sand properties available:', sandData);
    }
  }, [sandData]);

  const handleGoToSand = () => {
    setCurrentView('sand');
  };

  const handleSandComplete = (data: SandProperties) => {
    setSandData(data);
    setCurrentView('moulding');
  };

  const handleBackToPouring = () => {
    setCurrentView('pouring');
  };

  // Render sand properties page
  if (currentView === 'sand') {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        <SandPropertiesTable 
          submittedData={submittedData} // Pass the submitted data
          onSave={handleSandComplete}
          onComplete={() => setCurrentView('moulding')}
        />
      </Box>
    </ThemeProvider>
  );
}

  // Render moulding page
  if (currentView === 'moulding') {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        <MouldingTable 
          submittedData={submittedData} // Pass the submitted data
          onComplete={() => {
            // Handle final completion
            console.log('Entire process completed!');
            // You can add navigation to a final success page or dashboard here
          }}
        />
      </Box>
    </ThemeProvider>
  );
}

  // Render success message
  if (currentView === 'success') {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ p: 3, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 600, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 600 }}>
              ✅ Sample Card & Pouring Details Submitted Successfully!
            </Alert>
            
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: SAKTHI_COLORS.primary }}>
              Data Successfully Sent
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, color: SAKTHI_COLORS.darkGray }}>
              Your sample card and pouring details have been successfully submitted and stored in the system.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                onClick={handleBackToPouring}
                sx={{ minWidth: 140 }}
              >
                Back to Pouring
              </Button>
              <Button 
                variant="contained" 
                onClick={handleGoToSand}
                sx={{ 
                  minWidth: 160, 
                  background: `linear-gradient(135deg, ${SAKTHI_COLORS.accent} 0%, ${SAKTHI_COLORS.primary} 100%)`,
                  fontWeight: 700 
                }}
              >
                Proceed to Sand Properties
              </Button>
            </Box>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  // Render pouring details form
  return (
    <ThemeProvider theme={theme}>
      {/* Display submitted sample card data (read-only) */}
      <SubmittedSampleCard submittedData={submittedData} />

      {/* Pouring Details Table (editable) */}
      <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.secondary}`, overflow: "auto", mb: 3, bgcolor: '#FFFACD' }}>
        <Table size="small" sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            {/* Main Header */}
            <TableRow>
              <TableCell 
                colSpan={7} 
                align="center" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.2rem', 
                  color: SAKTHI_COLORS.white, 
                  py: 2,
                  bgcolor: SAKTHI_COLORS.secondary,
                  border: '2px solid black'
                }}
              >
                POURING DETAILS
              </TableCell>
            </TableRow>
            
            {/* Column Headers */}
            <TableRow>
              <TableCell 
                rowSpan={2}
                sx={{ 
                  fontWeight: 700, 
                  bgcolor: '#FFFF00', 
                  border: '2px solid black', 
                  width: '150px', 
                  textAlign: 'center', 
                  verticalAlign: 'middle',
                  fontSize: '0.9rem'
                }}
              >
                Date & Heat code
              </TableCell>
              <TableCell 
                colSpan={3}
                align="center"
                sx={{ 
                  fontWeight: 700, 
                  bgcolor: '#FFFF00', 
                  border: '2px solid black', 
                  fontSize: '0.9rem'
                }}
              >
                Composition
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  bgcolor: '#FFFF00', 
                  border: '2px solid black', 
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}
              >
                Pouring Temperature Deg.C
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  bgcolor: '#FFFF00', 
                  border: '2px solid black', 
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}
              >
                Pouring Time (Sec.)
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  bgcolor: '#FFFF00', 
                  border: '2px solid black', 
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}
              >
                Other Remarks
              </TableCell>
            </TableRow>

            {/* Composition Sub-headers */}
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#FFFF00', border: '2px solid black', textAlign: 'center', fontSize: '0.8rem' }}>
                C
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#FFFF00', border: '2px solid black', textAlign: 'center', fontSize: '0.8rem' }}>
                Si
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#FFFF00', border: '2px solid black', textAlign: 'center', fontSize: '0.8rem' }}>
                Mn
              </TableCell>
              <TableCell sx={{ border: '2px solid black', bgcolor: '#FFFF00' }}></TableCell>
              <TableCell sx={{ border: '2px solid black', bgcolor: '#FFFF00' }}></TableCell>
              <TableCell sx={{ border: '2px solid black', bgcolor: '#FFFF00' }}></TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {/* First Data Row - Date and C, Si, Mn */}
            <TableRow sx={{ bgcolor: '#FFFACD' }}>
              {/* Date */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth
                  size="small" 
                  type="date"
                  value={pouringDetails.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              {/* Composition - C, Si, Mn */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.cComposition}
                  onChange={(e) => handleChange('cComposition', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.siComposition}
                  onChange={(e) => handleChange('siComposition', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.mnComposition}
                  onChange={(e) => handleChange('mnComposition', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              {/* Pouring Temperature */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.pouringTempDegC}
                  onChange={(e) => handleChange('pouringTempDegC', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              {/* Pouring Time */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.pouringTimeSec}
                  onChange={(e) => handleChange('pouringTimeSec', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              {/* Other Remarks - F/C & Heat No. */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="F/C & Heat No."
                  value={pouringDetails.ficHeatNo}
                  onChange={(e) => handleChange('ficHeatNo', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
            </TableRow>

            {/* Second Data Row - Heat Code and P, S, Mg */}
            <TableRow sx={{ bgcolor: '#FFFACD' }}>
              {/* Heat Code */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth
                  size="small" 
                  placeholder="Heat Code"
                  value={pouringDetails.heatCode}
                  onChange={(e) => handleChange('heatCode', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              {/* Composition - P, S, Mg */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.pComposition}
                  onChange={(e) => handleChange('pComposition', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.sComposition}
                  onChange={(e) => handleChange('sComposition', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.mgComposition}
                  onChange={(e) => handleChange('mgComposition', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              {/* Empty cells for Pouring Temperature and Time */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              
              {/* Other Remarks - PP Code */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="PP Code"
                  value={pouringDetails.ppCode}
                  onChange={(e) => handleChange('ppCode', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
            </TableRow>

            {/* Third Data Row - Cu, Cr */}
            <TableRow sx={{ bgcolor: '#FFFACD' }}>
              {/* Empty Date & Heat Code */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              
              {/* Composition - Cu, Cr */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.cuComposition}
                  onChange={(e) => handleChange('cuComposition', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={pouringDetails.crComposition}
                  onChange={(e) => handleChange('crComposition', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
              
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              
              {/* Other Remarks - Followed by */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Followed by"
                  value={pouringDetails.followedBy}
                  onChange={(e) => handleChange('followedBy', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
            </TableRow>

            {/* Fourth Data Row - Username */}
            <TableRow sx={{ bgcolor: '#FFFACD' }}>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}></TableCell>
              
              {/* Other Remarks - Username */}
              <TableCell sx={{ border: '2px solid #999', p: 0.5 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Username"
                  value={pouringDetails.userName}
                  onChange={(e) => handleChange('userName', e.target.value)}
                  InputProps={{ 
                    sx: { 
                      bgcolor: SAKTHI_COLORS.white, 
                      borderRadius: 0, 
                      fontSize: '0.8rem',
                    }, 
                    readOnly 
                  }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      {/* HOD Approval + Submit area */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', mt: 2 }}>

        <Box>
          <Button
            variant={hodApproved ? 'contained' : 'outlined'}
            color={hodApproved ? 'success' : 'primary'}
            onClick={handleHodApproval}
            disabled={hodApproved}
            sx={{ minWidth: 160, fontWeight: 700 }}
          >
            {hodApproved ? '✓ APPROVED' : 'HOD APPROVAL'}
          </Button>
        </Box>

        <Box>
          <Button
            variant="contained"
            onClick={handleFinalSubmit}
            disabled={!hodApproved || submitInProgress}
            sx={{ 
              minWidth: 220, 
              background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, 
              fontWeight: 700,
              '&:disabled': {
                bgcolor: SAKTHI_COLORS.lightGray,
                color: SAKTHI_COLORS.darkGray
              }
            }}
          >
            {submitInProgress ? 'Submitting...' : 'Submit Sample & Pouring'}
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PouringDetailsTable;