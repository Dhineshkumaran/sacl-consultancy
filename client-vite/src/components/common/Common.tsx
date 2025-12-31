import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  ThemeProvider,
  Container,
  Alert,
  Button,
  Collapse,
} from "@mui/material";
import { COLORS, appTheme } from "../../theme/appTheme";
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ConstructionIcon from '@mui/icons-material/Construction';
import ScienceIcon from '@mui/icons-material/Science';
import EditIcon from '@mui/icons-material/Edit';
import FactoryIcon from '@mui/icons-material/Factory';
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { trialService } from "../../services/trialService";
import { specificationService } from "../../services/specificationService";

// Helper component for consistent input styling
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

type MouldCorrection = {
  compressibility?: string;
  squeezePressure?: string;
  fillerSize?: string;
};

type TrialData = {
  trial_id?: string;
  part_name?: string;
  pattern_code?: string;
  material_grade?: string;
  initiated_by?: string;
  date_of_sampling?: string;
  no_of_moulds?: number;
  reason_for_sampling?: string;
  status?: string;
  tooling_modification?: string;
  remarks?: string;
  current_department_id?: number;
  disa?: string;
  sample_traceability?: string;
  mould_correction?: MouldCorrection[];
  tooling_files?: { name: string }[];
  pattern_data_sheet_files?: { name: string }[];
  chemical_composition?: any;
  micro_structure?: any;
  tensile?: any;
  hardness?: any;
  xray?: string;
  mpi?: string;
};

const SectionHeader = ({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${color}`, width: '100%' }}>
    <Box sx={{ color: color, display: "flex" }}>{icon}</Box>
    <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
      {title}
    </Typography>
  </Box>
);

// Parsing utility functions for master list data
const parseChemicalComposition = (composition: any) => {
  const blank = { c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: "" };
  if (!composition) return blank;
  let obj: any = composition;
  if (typeof composition === "string") {
    try { obj = JSON.parse(composition); } catch (e) { return blank; }
  }
  if (typeof obj !== "object" || obj === null) return blank;
  const map: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (typeof k === "string") { map[k.toLowerCase().replace(/\s+/g, "")] = obj[k]; }
  });
  return {
    c: map["c"] || "",
    si: map["si"] || map["silicon"] || "",
    mn: map["mn"] || "",
    p: map["p"] || "",
    s: map["s"] || "",
    mg: map["mg"] || "",
    cr: map["cr"] || "",
    cu: map["cu"] || ""
  };
};

const parseTensileData = (tensile: string) => {
  const lines = tensile ? tensile.split("\n") : [];
  let tensileStrength = "", yieldStrength = "", elongation = "", impactCold = "", impactRoom = "";
  lines.forEach((line) => {
    const cleanLine = line.trim();
    if (cleanLine.match(/\d+\s*(MPa|N\/mm²)/) || cleanLine.includes("Tensile")) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/);
      if (match && !tensileStrength) tensileStrength = `${match[1]}${match[2]}`;
    }
    if (cleanLine.includes("Yield")) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/);
      if (match && !yieldStrength) yieldStrength = `${match[1]}${match[2]}`;
    }
    if (cleanLine.includes("Elongation") || cleanLine.includes("%")) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/);
      if (match && !elongation) elongation = `${match[1]}${match[2]}`;
    }
  });
  return { tensileStrength, yieldStrength, elongation, impactCold, impactRoom };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure ? microstructure.split("\n") : [];
  let nodularity = "", pearlite = "", carbide = "";
  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();
    if (cleanLine.includes("nodularity")) {
      const match = cleanLine.match(/([≥≤]?)\s*(\d+)/);
      if (match) nodularity = `${match[1]}${match[2]}`;
    }
    if (cleanLine.includes("pearlite")) {
      const match = cleanLine.match(/([≥≤<>]?)\s*(\d+)/);
      if (match) pearlite = `${match[1]}${match[2]}`;
    }
    if (cleanLine.includes("carbide")) {
      const match = cleanLine.match(/([≥≤<>]?)\s*(\d+)/);
      if (match) carbide = `${match[1]}${match[2]}`;
    }
  });
  return { nodularity: nodularity || "--", pearlite: pearlite || "--", carbide: carbide || "--" };
};

const parseHardnessData = (hardness: string) => {
  const lines = hardness ? hardness.split("\n") : [];
  let surface = "", core = "";
  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();
    if (cleanLine.includes("surface")) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) surface = match[1];
    } else if (cleanLine.includes("core")) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) core = match[1];
    } else if (!surface) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) surface = match[1];
    }
  });
  return { surface: surface || "--", core: core || "--" };
};

const PatternDatasheetSection = ({ patternCode }: { patternCode: string }) => {
  const [patternData, setPatternData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatternData = async () => {
      setLoading(true);
      try {
        const masterList = await trialService.getMasterList();
        const match = masterList.find((item: any) => item.pattern_code === patternCode);
        if (match) {
          // Parse tooling if it's a string (it shouldn't be based on my analysis of saving, but let's be safe)
          let tooling = match.tooling;
          if (typeof tooling === 'string') {
            try { tooling = JSON.parse(tooling); } catch { }
          }
          setPatternData(tooling || {});
        }
      } catch (e) {
        console.error("Failed to fetch pattern data", e);
      } finally {
        setLoading(false);
      }
    };
    if (patternCode) {
      fetchPatternData();
    }
  }, [patternCode]);

  if (loading) return <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>;
  if (!patternData || Object.keys(patternData).length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', fontStyle: 'italic', color: 'text.secondary' }}>
        No pattern datasheet data available for {patternCode}
      </Box>
    );
  }

  const rows = [
    { label: "Number of cavity", sp: "number_of_cavity_sp", pp: "number_of_cavity_pp", common: "number_of_cavity" },
    { label: "Pattern plate thickness", sp: "pattern_plate_thickness_sp", pp: "pattern_plate_thickness_pp" },
    { label: "Cavity identification", sp: "cavity_identification_sp", pp: "cavity_identification_pp", common: "cavity_identification" },
    { label: "Pattern plate weight", sp: "pattern_plate_weight_sp", pp: "pattern_plate_weight_pp" },
    { label: "Pattern material", sp: "pattern_material_sp", pp: "pattern_material_pp", common: "pattern_material" },
    { label: "Crush pin height", sp: "crush_pin_height_sp", pp: "crush_pin_height_pp" },
    { label: "Core weight", sp: "core_weight_sp", pp: "core_weight_pp", common: "core_weight" },
    { label: "Core mask weight", sp: "core_mask_weight_sp", pp: "core_mask_weight_pp" },
    { label: "Core mask thickness", sp: "core_mask_thickness_sp", pp: "core_mask_thickness_pp" },
    { label: "Calculated Yield (%)", sp: "calculated_yield_sp", pp: "calculated_yield_pp", yieldLabel: "yield_label" },
    { label: "Estimated casting weight", sp: "estimated_casting_weight_sp", pp: "estimated_casting_weight_pp", common: "estimated_casting_weight" },
    { label: "Estimated Bunch weight", sp: "estimated_bunch_weight_sp", pp: "estimated_bunch_weight_pp", common: "estimated_bunch_weight" },
  ];

  return (
    <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
      <Table size="small" sx={{ minWidth: 600, border: '1px solid #ddd', '& td, & th': { border: '1px solid #ddd' } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}>Description</TableCell>
            <TableCell align="center" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}>SP Side</TableCell>
            <TableCell align="center" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}>PP Side</TableCell>
            <TableCell align="center" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}>Common/Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell variant="head" sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.label}</TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontFamily="Roboto Mono">{patternData[row.sp] || '-'}</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontFamily="Roboto Mono">{patternData[row.pp] || '-'}</Typography>
              </TableCell>
              <TableCell align="center">
                {row.yieldLabel ? (
                  <Typography variant="body2" fontFamily="Roboto Mono" fontWeight={700}>
                    {patternData[row.yieldLabel] ? `${patternData[row.yieldLabel]}%` : '-'}
                  </Typography>
                ) : (
                  <Typography variant="body2" fontFamily="Roboto Mono">
                    {row.common ? (patternData[row.common] || '-') : '-'}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {patternData.remarks && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Remarks</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{patternData.remarks}</Typography>
        </Box>
      )}
    </Box>
  );
};

interface CommonProps {
  trialId?: string;
}

const Common: React.FC<CommonProps> = ({ trialId: initialTrialId = "" }) => {
  // Read trial ID from URL if not provided as prop
  const urlParams = new URLSearchParams(window.location.search);
  const urlTrialId = urlParams.get('trial_id') || "";
  const effectiveTrialId = initialTrialId || urlTrialId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrialData | null>(null);
  const [userIP, setUserIP] = useState<string>("");
  const [showSpecifications, setShowSpecifications] = useState(false);

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const ipData = await response.json();
        setUserIP(ipData.ip);
      } catch {
        setUserIP('N/A');
      }
    };
    fetchIP();
  }, []);

  const fetchTrial = async (id: string) => {
    if (!id) {
      setError("Please provide a Trial ID");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const trial = await trialService.getTrialByTrialId(id);
      if (trial) {
        // Parse JSON fields if they are strings
        const parsedTrial = { ...trial };
        ['chemical_composition', 'micro_structure', 'tensile', 'hardness', 'mould_correction'].forEach(key => {
          if (typeof parsedTrial[key] === 'string') {
            try {
              parsedTrial[key] = JSON.parse(parsedTrial[key]);
            } catch (e) {
              console.error(`Failed to parse ${key}`, e);
            }
          }
        });


        try {
          const metallurgicalSpecs = await specificationService.getMetallurgicalSpecs(id);
          if (metallurgicalSpecs) {
            if (metallurgicalSpecs.chemical_composition) {
              parsedTrial.chemical_composition = parseChemicalComposition(metallurgicalSpecs.chemical_composition);
            }
            if (metallurgicalSpecs.microstructure) {
              try {
                const parsedMicro = typeof metallurgicalSpecs.microstructure === 'string'
                  ? JSON.parse(metallurgicalSpecs.microstructure)
                  : metallurgicalSpecs.microstructure;

                if (parsedMicro && (parsedMicro.nodularity || parsedMicro.pearlite || parsedMicro.carbide)) {
                  parsedTrial.micro_structure = {
                    nodularity: parsedMicro.nodularity || "--",
                    pearlite: parsedMicro.pearlite || "--",
                    carbide: parsedMicro.carbide || "--"
                  };
                } else {
                  parsedTrial.micro_structure = parseMicrostructureData(metallurgicalSpecs.microstructure);
                }
              } catch (e) {
                parsedTrial.micro_structure = parseMicrostructureData(metallurgicalSpecs.microstructure);
              }
            }
          }
        } catch (specError) {
          console.error("Failed to fetch specific metallurgical specs:", specError);
        }

        try {
          const mechanicalProps = await specificationService.getMechanicalProperties(id);
          if (mechanicalProps) {
            parsedTrial.tensile = {
              tensileStrength: mechanicalProps.tensile_strength,
              yieldStrength: mechanicalProps.yield_strength,
              elongation: mechanicalProps.elongation,
              impactCold: mechanicalProps.impact_strength_cold,
              impactRoom: mechanicalProps.impact_strength_room
            };
            parsedTrial.hardness = {
              surface: mechanicalProps.hardness_surface,
              core: mechanicalProps.hardness_core
            };
            parsedTrial.xray = mechanicalProps.x_ray_inspection;
            parsedTrial.mpi = mechanicalProps.mpi;
          }
        } catch (mechError) {
          console.error("Failed to fetch specific mechanical properties:", mechError);
        }

        setData(parsedTrial);
      } else {
        setData(null);
        setError('No trial found');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch trial');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveTrialId) {
      fetchTrial(effectiveTrialId);
    }
  }, [effectiveTrialId]);

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
        <Container maxWidth="xl" disableGutters>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <>
              {/* Part Identification - Always Visible */}
              {data && (
                <Grid container spacing={3} sx={{ mb: 3, mt: 2 }}>
                  <Grid size={12}>
                    <Card elevation={0} sx={{ border: `1px solid ${COLORS.border}` }}>
                      <CardContent>
                        <SectionHeader icon={<PrecisionManufacturingIcon />} title="Part Identification" color={COLORS.primary} />
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>PATTERN CODE</Typography>
                            <TextField
                              fullWidth
                              value={data?.pattern_code || ''}
                              InputProps={{ readOnly: true, sx: { bgcolor: "#f8fafc" } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>COMPONENT NAME</Typography>
                            <TextField
                              fullWidth
                              value={data?.part_name || ''}
                              InputProps={{ readOnly: true, sx: { bgcolor: "#f8fafc" } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>TRIAL REFERENCE</Typography>
                            <TextField
                              fullWidth
                              value={initialTrialId || 'No Trial ID'}
                              InputProps={{
                                readOnly: true,
                                sx: { bgcolor: "#f1f5f9", fontWeight: 700, color: COLORS.primary }
                              }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Show/Hide Specifications Button */}
              {data && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={showSpecifications ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={() => setShowSpecifications(!showSpecifications)}
                    sx={{ textTransform: 'none' }}
                  >
                    {showSpecifications ? 'Hide' : 'Show'} Basic Information
                  </Button>
                </Box>
              )}

              <Collapse in={showSpecifications} timeout="auto" unmountOnExit>
                <Grid container spacing={3} sx={{ mb: 3, mt: 0 }}>

                  {/* Pattern Datasheet Details */}
                  {data && data.pattern_code && (
                    <Grid size={12}>
                      <Paper sx={{ p: { xs: 2, md: 3 } }}>
                        <SectionHeader icon={<FactoryIcon />} title="Pattern Datasheet Details" color={COLORS.primary} />
                        <PatternDatasheetSection patternCode={data.pattern_code} />
                      </Paper>
                    </Grid>
                  )}

                  {/* Metallurgical Composition */}
                  {data && (
                    <Grid size={12}>
                      <Paper sx={{ p: { xs: 2, md: 3 } }}>
                        <SectionHeader icon={<ScienceIcon />} title="Metallurgical Composition" color={COLORS.accentBlue} />
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
                                {["c", "si", "mn", "p", "s", "mg", "cr", "cu"].map((key) => (
                                  <TableCell key={key} align="center">
                                    <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                      {data?.chemical_composition?.[key] || data?.chemical_composition?.[key.toUpperCase()] || '-'}
                                    </Typography>
                                  </TableCell>
                                ))}
                                <TableCell sx={{ border: 'none' }}></TableCell>
                                {["nodularity", "pearlite", "carbide"].map((key) => (
                                  <TableCell key={key} align="center">
                                    <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                      {data?.micro_structure?.[key] || '-'}
                                    </Typography>
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                      </Paper>
                    </Grid>
                  )}

                  {/* Mechanical Properties & NDT */}
                  {data && (
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
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.tensile?.tensileStrength || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.tensile?.yieldStrength || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.tensile?.elongation || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.tensile?.impactCold || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.tensile?.impactRoom || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.hardness?.surface || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.hardness?.core || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.xray || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="500" sx={{ fontFamily: 'Roboto Mono' }}>
                                    {data?.mpi || '-'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Collapse>

              {data && (
                <>
                  {/* Sampling Details Table */}
                  <Paper sx={{ overflowX: "auto", p: 2, mb: 3 }}>
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
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.date_of_sampling || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.no_of_moulds || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.disa || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.reason_for_sampling || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.sample_traceability || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {(data.pattern_data_sheet_files || []).length > 0 ? (
                                (data.pattern_data_sheet_files || []).map((f, i) => (
                                  <Chip key={i} label={f.name} size="small" />
                                ))
                              ) : (
                                <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontStyle: 'italic' }}>
                                  No files
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>

                  {/* Tooling Modification */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <SectionHeader
                      icon={<ConstructionIcon />}
                      title="Tooling Modification Done"
                      color={COLORS.secondary}
                    />
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary, display: 'block', mb: 1 }}>
                          Tooling Modification
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          variant="outlined"
                          value={data.tooling_modification || '-'}
                          InputProps={{ readOnly: true, sx: { bgcolor: '#f8fafc' } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary, display: 'block', mb: 1 }}>
                          Tooling Files
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', p: 2, border: `1px solid ${COLORS.border}`, borderRadius: 1, bgcolor: '#f8fafc', minHeight: 100 }}>
                          {(data.tooling_files || []).length > 0 ? (
                            (data.tooling_files || []).map((f, i) => (
                              <Chip key={i} label={f.name} size="small" />
                            ))
                          ) : (
                            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontStyle: 'italic' }}>
                              No files attached
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Mould Correction Details */}
                  <Paper sx={{ p: 3, overflowX: "auto", mb: 3 }}>
                    <SectionHeader icon={<EditIcon />} title="Mould Correction Details" color={COLORS.primary} />
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
                        {(data.mould_correction || []).length > 0 ? (
                          (data.mould_correction || []).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={row.compressibility || '-'}
                                  InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={row.squeezePressure || '-'}
                                  InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={row.fillerSize || '-'}
                                  InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ color: COLORS.textSecondary, py: 3, fontStyle: 'italic' }}>
                              No mould correction data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Paper>

                  {/* Remarks */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <SectionHeader icon={<EditIcon />} title="Remarks" color={COLORS.primary} />
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      variant="outlined"
                      value={data.remarks || '-'}
                      InputProps={{ readOnly: true, sx: { bgcolor: '#f8fafc' } }}
                    />
                  </Paper>
                </>
              )}

              {!data && !loading && (
                <Paper sx={{ p: 6, textAlign: 'center', mt: 3 }}>
                  <PrecisionManufacturingIcon sx={{ fontSize: 80, color: COLORS.border, mb: 2 }} />
                  <Typography variant="h6" sx={{ color: COLORS.textSecondary, fontWeight: 600, mb: 1 }}>
                    No Trial Data Loaded
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                    Provide a valid Trial ID to load details
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Container>
      </Box >
    </ThemeProvider >
  );
};

export default Common;