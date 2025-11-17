import React, {useEffect, useState} from "react";
import SampleCardSubmitted from "./melting";
import type { SubmittedData } from "./melting";
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
  Divider,
  Chip,
  ThemeProvider,
  createTheme,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  Alert,
  CircularProgress,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

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
const SAMPLING_REASONS = ["First trial", "Metallurgy trial", "others"];
const NAV_ITEMS = ["Contact Us"];

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
          borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
        },
        body: {
          backgroundColor: SAKTHI_COLORS.white,
          borderRight: `2px solid ${SAKTHI_COLORS.lightGray}`,
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
  chemical_composition: string;
  micro_structure: string;
  tensile: string;
  impact: string;
  hardness: string;
  xray: string;
  created_at: string;
}

const parseTensileData = (tensile: string) => {
  const lines = tensile.split('\n');
  let tensileStrength = '';
  let yieldStrength = '';
  let elongation = '';
  
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
  
  return { tensileStrength, yieldStrength, elongation };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure.split('\n');
  let pearlite = '';
  let ferrite = '';
  let carbide = '';
  
  lines.forEach(line => {
    const cleanLine = line.trim().toLowerCase();
    
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
    
    if (cleanLine.includes('ferrite')) {
      if (cleanLine.includes('≥')) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) ferrite = `≥${match[1]}`;
      } else if (cleanLine.includes('≤')) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) ferrite = `≤${match[1]}`;
      } else if (cleanLine.includes('<')) {
        const match = cleanLine.match(/<\s*(\d+)/);
        if (match) ferrite = `<${match[1]}`;
      } else if (cleanLine.includes('>')) {
        const match = cleanLine.match(/>\s*(\d+)/);
        if (match) ferrite = `>${match[1]}`;
      } else if (cleanLine.includes('max')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) ferrite = `≤${match[1]}`;
      } else if (cleanLine.includes('min')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) ferrite = `≥${match[1]}`;
      } else if (cleanLine.match(/\d+\s*-\s*\d+/)) {
        const match = cleanLine.match(/(\d+\s*-\s*\d+)/);
        if (match) ferrite = match[1];
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) ferrite = match[1];
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
    pearlite: pearlite || '--', 
    ferrite: ferrite || '--', 
    carbide: carbide || '--' 
  };
};

const HamburgerIcon = () => (
  <Box sx={{ width: 20, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <Box sx={{ width: '100%', height: 2, backgroundColor: 'currentColor' }} />
    <Box sx={{ width: '100%', height: 2, backgroundColor: 'currentColor' }} />
    <Box sx={{ width: '100%', height: 2, backgroundColor: 'currentColor' }} />
  </Box>
);

function NavigationBar() {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: SAKTHI_COLORS.primary }}>
        SAKTHI AUTO COMPONENT LIMITED
      </Typography>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item} disablePadding>
            <ListItemText 
              primary={item} 
              sx={{ 
                textAlign: 'center',
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: SAKTHI_COLORS.primary,
                }
              }} 
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="fixed"
      sx={{ 
        bgcolor: SAKTHI_COLORS.white, 
        color: SAKTHI_COLORS.primary, 
        boxShadow: 1,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <HamburgerIcon />
          </IconButton>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            sx={{
              width: 138,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              mr: 2
            }}
          >
            <img 
              src="/assets/LOGO.png" 
              alt="Sakthi Auto Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                borderRadius: 4
              }}
            />
          </Box>

          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 700,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            SAKTHI AUTO COMPONENT LIMITED
          </Typography>
        </Box>

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item}
                sx={{
                  color: SAKTHI_COLORS.primary,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  '&:hover': {
                    bgcolor: SAKTHI_COLORS.background,
                  }
                }}
              >
                {item}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 240,
            top: '64px',
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
}

export default function FoundrySampleCard() {
  const [selectedPart, setSelectedPart] = React.useState<PartData | null>(null);
  const [selectedPattern, setSelectedPattern] = React.useState<PartData | null>(null);
  const [machine, setMachine] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [trialNo, setTrialNo] = React.useState("");
  const [hodApproved, setHodApproved] = React.useState(false);
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [samplingDate, setSamplingDate] = React.useState("");
  const [mouldCount, setMouldCount] = React.useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmittedData | null>(null);

  useEffect(() => {
    const getMasterParts = async() => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/master-list');
        if(!response.ok){
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

  React.useEffect(() => {
    if (selectedPart) {
      setSelectedPattern(selectedPart);
    } else {
      setSelectedPattern(null);
    }
  }, [selectedPart]);

  const tensileData = selectedPart ? parseTensileData(selectedPart.tensile) : { tensileStrength: '', yieldStrength: '', elongation: '' };
  const microData = selectedPart ? parseMicrostructureData(selectedPart.micro_structure) : { pearlite: '', ferrite: '', carbide: '' };

  const handleHodApproval = () => {
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
    if (!hodApproved || !selectedPart) return;
    
    const dataToSubmit: SubmittedData = {
      selectedPart,
      selectedPattern,
      machine,
      reason,
      trialNo,
      samplingDate,
      mouldCount,
      tensileData: parseTensileData(selectedPart.tensile),
      microData: parseMicrostructureData(selectedPart.micro_structure)
    };
    
    setSubmittedData(dataToSubmit);
    setIsSubmitted(true);
  };

  if (isSubmitted && submittedData) {
    return (
      <SampleCardSubmitted 
        submittedData={submittedData} 
        onBackToForm={() => setIsSubmitted(false)} 
      />
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: '100vh', pt: '80px' }}>
        <NavigationBar />

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress size={60} />
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {!loading && !error && (
            <Paper variant="outlined" sx={{ overflow: "hidden", border: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white }}>
              <Box sx={{ p: 3, borderBottom: `3px solid ${SAKTHI_COLORS.primary}`, background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, color: SAKTHI_COLORS.white }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Pattern Code</Typography>
                    <Autocomplete
                      options={masterParts}
                      value={selectedPattern}
                      onChange={(_, newValue) => handlePatternChange(newValue)}
                      getOptionLabel={(option) => option.pattern_code}
                      renderOption={(props, option) => (
                        <li {...props} style={{ whiteSpace: 'normal', lineHeight: '1.5', padding: '8px 16px' }}>
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
                            placeholder="Auto-filled when part is selected"
                            size="small"
                            InputProps={{ ...(InputProps as any), sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, '& input': { fontSize: '0.875rem' } } }}
                            sx={{ minWidth: { xs: '100%', md: '450px' } }}
                          />
                        );
                      }}
                      slotProps={{ paper: { sx: { width: 'auto', minWidth: '550px', maxWidth: '90vw' } } }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField label="TRIAL No" value={trialNo} onChange={(e) => setTrialNo(e.target.value)} placeholder="Enter trial number" variant="outlined" size="small" type="number" InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2 } }} />
                      <Autocomplete
                        options={masterParts}
                        value={selectedPart}
                        onChange={(_, newValue) => handlePartChange(newValue)}
                        getOptionLabel={(option) => option.part_name}
                        renderOption={(props, option) => (
                          <li {...props} style={{ whiteSpace: 'normal', lineHeight: '1.5', padding: '8px 16px' }}>
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
                              label="Part Name"
                              placeholder="Select from Master list"
                              size="small"
                              InputProps={{ ...(InputProps as any), sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, '& input': { fontSize: '0.875rem' } } }}
                              sx={{ minWidth: { xs: '100%', md: '450px' } }}
                            />
                          );
                        }}
                        slotProps={{ paper: { sx: { width: 'auto', minWidth: '550px', maxWidth: '90vw' } } }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3, borderBottom: `2px solid ${SAKTHI_COLORS.lightGray}`, bgcolor: SAKTHI_COLORS.background }}>
                <Card variant="outlined" sx={{ border: `4px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white, borderRadius: 2 }}>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800, color: SAKTHI_COLORS.primary, fontSize: '1.1rem' }}>Metallurgical Specification</Typography>
                  </CardContent>
                </Card>
                <Chip label="MICRO" sx={{ bgcolor: SAKTHI_COLORS.secondary, color: SAKTHI_COLORS.white, fontWeight: 700, fontSize: "1rem", height: 36, px: 2 }} />
              </Box>

              <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                <Chip icon={<span style={{ fontSize: '1.2rem' }}>💡</span>} label="Auto retrieval of specification and pattern once part name is selected" sx={{ bgcolor: selectedPart ? SAKTHI_COLORS.success + '20' : SAKTHI_COLORS.accent + '20', color: SAKTHI_COLORS.darkGray, border: `1px dashed ${selectedPart ? SAKTHI_COLORS.success : SAKTHI_COLORS.accent}`, fontWeight: 600, fontSize: '0.875rem', py: 2.5 }} />
              </Box>

              <Box sx={{ p: 3 }}>
                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Material Grade", "Tensile Strength (N/mm²)", "Elongation (%)", "Pearlite (%)", "Ferrite (%)", "Carbide (%)", "Hardness (BHN)"].map((h) => (
                          <TableCell key={h} align="center" sx={{ fontSize: '0.9rem', minWidth: '120px' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell><TextField fullWidth value={selectedPart?.material_grade || ""} placeholder="Auto-fill" size="small" InputProps={{ readOnly: true, sx: { bgcolor: selectedPart ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: selectedPart ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={tensileData.tensileStrength} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: tensileData.tensileStrength ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: tensileData.tensileStrength ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={tensileData.elongation} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: tensileData.elongation ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: tensileData.elongation ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.pearlite} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.pearlite !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.pearlite !== '--' ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.ferrite} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.ferrite !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.ferrite !== '--' ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.carbide} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.carbide !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.carbide !== '--' ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={selectedPart?.hardness.split('\n')[0] || ""} placeholder="--" size="small" multiline minRows={2} maxRows={4} InputProps={{ readOnly: true, sx: { bgcolor: selectedPart?.hardness ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: selectedPart?.hardness ? 600 : 400 } }} /></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>

                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '150px' }}>Date of Sampling</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '140px' }}>No. of Moulds</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '180px' }}>DISA / FOUNDRY-A</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '180px' }}>Reason For Sampling</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell><TextField fullWidth type="date" value={samplingDate} onChange={(e) => setSamplingDate(e.target.value)} size="small" InputLabelProps={{ shrink: true }} InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }} /></TableCell>
                        <TableCell><TextField fullWidth type="number" value={mouldCount} onChange={(e) => setMouldCount(e.target.value)} placeholder="Enter number" size="small" inputProps={{ min: 0 }} InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }} /></TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select value={machine} onChange={(e) => setMachine(e.target.value)} displayEmpty sx={{ bgcolor: SAKTHI_COLORS.white, borderRadius: 1 }}>
                              <MenuItem value="" disabled>Select Machine</MenuItem>
                              {MACHINES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select value={reason} onChange={(e) => setReason(e.target.value)} displayEmpty sx={{ bgcolor: SAKTHI_COLORS.white, borderRadius: 1 }}>
                              <MenuItem value="" disabled>Select Reason</MenuItem>
                              {SAMPLING_REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>

                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "hidden", mb: 3, p: 3 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SAKTHI_COLORS.primary, fontSize: '1.05rem', borderBottom: `2px solid ${SAKTHI_COLORS.primary}`, pb: 1.5, mb: 1 }}>
                        Tooling Modification Done
                      </Typography>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Type</Typography>
                        <TextField fullWidth placeholder="Enter modification type" size="small" multiline rows={2} InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Attach Photo or PDF</Typography>
                        <Button variant="outlined" component="label" fullWidth sx={{ borderWidth: 2, borderStyle: 'dashed', borderColor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.primary, py: 1.5, '&:hover': { borderColor: SAKTHI_COLORS.lightBlue, backgroundColor: SAKTHI_COLORS.background, borderWidth: 2 } }}>
                          📎 Upload Files
                          <input type="file" hidden accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" multiple />
                        </Button>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SAKTHI_COLORS.primary, fontSize: '1.05rem', borderBottom: `2px solid ${SAKTHI_COLORS.primary}`, pb: 1.5, mb: 1 }}>
                        Material Correction
                      </Typography>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Type</Typography>
                        <TextField fullWidth placeholder="Enter correction type" size="small" multiline rows={2} InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Attach Photo or PDF</Typography>
                        <Button variant="outlined" component="label" fullWidth sx={{ borderWidth: 2, borderStyle: 'dashed', borderColor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.primary, py: 1.5, '&:hover': { borderColor: SAKTHI_COLORS.lightBlue, backgroundColor: SAKTHI_COLORS.background, borderWidth: 2 } }}>
                          📎 Upload Files
                          <input type="file" hidden accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" multiple />
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, p: 3, bgcolor: hodApproved ? SAKTHI_COLORS.success + '10' : SAKTHI_COLORS.background, borderRadius: 2, border: `2px solid ${hodApproved ? SAKTHI_COLORS.success : SAKTHI_COLORS.lightGray}`, transition: 'all 0.3s ease' }}>
                  {hodApproved && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: SAKTHI_COLORS.success }}>✓ Approved by HOD</Typography>
                    </Box>
                  )}
                  <Box sx={{ marginLeft: 'auto' }}>
                    <Button variant={hodApproved ? "contained" : "outlined"} color={hodApproved ? "success" : "primary"} onClick={handleHodApproval} disabled={hodApproved} sx={{ minWidth: 200, height: 48, fontSize: '1rem', fontWeight: 700, boxShadow: hodApproved ? 2 : 0, '&:disabled': { bgcolor: SAKTHI_COLORS.success, color: SAKTHI_COLORS.white } }}>
                      {hodApproved ? "✓ APPROVED" : "HOD APPROVAL"}
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    onClick={handleSubmit}
                    disabled={!hodApproved || !selectedPart} 
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