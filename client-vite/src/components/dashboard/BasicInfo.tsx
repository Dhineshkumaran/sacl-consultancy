import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
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
import LoadingState from "../common/LoadingState";
import GearSpinner from "../common/GearSpinner";
import DocumentViewer from "../common/DocumentViewer";
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
  plan_moulds?: string | number;
  actual_moulds?: string | number;
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

const PatternDatasheetSection = ({ patternCode, data }: { patternCode: string, data?: any }) => {
  const [patternData, setPatternData] = useState<any | null>(data || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setPatternData(data);
      return;
    }

    const fetchPatternData = async () => {
      setLoading(true);
      try {
        const masterData = await trialService.getMasterListByPatternCode(patternCode);

        if (masterData) {
          setPatternData(masterData);
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
  }, [patternCode, data]);

  if (loading) return <Box sx={{ p: 2, textAlign: 'center' }}><div style={{ display: 'inline-block', transform: 'scale(0.8)' }}><GearSpinner /></div></Box>;

  if (!patternData || Object.keys(patternData).length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', fontStyle: 'italic', color: 'text.secondary' }}>
        No pattern datasheet data available for {patternCode}
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Left Column */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Paper elevation={0} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '13px' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '13px' }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { l: "Number of cavity in pattern", v: patternData.number_of_cavity },
                { l: "Cavity identification number", v: patternData.cavity_identification },
                { l: "Pattern material", v: patternData.pattern_material },
                { l: "Core weight in kgs", v: patternData.core_weight },
                { l: "Core mask thickness in mm", v: patternData.core_mask_thickness },
                { l: "Estimated casting weight", v: patternData.estimated_casting_weight },
              ].map((r, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ fontSize: '13px', color: 'text.secondary' }}>{r.l}</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{r.v || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Grid>

      {/* Right Column */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper elevation={0} variant="outlined">
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
                { l: "Pattern plate thickness in mm", sp: patternData.pattern_plate_thickness_sp, pp: patternData.pattern_plate_thickness_pp },
                { l: "Pattern plate weight in kgs", sp: patternData.pattern_plate_weight_sp, pp: patternData.pattern_plate_weight_pp },
                { l: "Crush pin height in mm", sp: patternData.crush_pin_height_sp, pp: patternData.crush_pin_height_pp },
                { l: "Core mask weight in kgs", sp: patternData.core_mask_weight_sp, pp: patternData.core_mask_weight_pp },
              ].map((r, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ fontSize: '13px', color: 'text.secondary' }}>{r.l}</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{r.sp || "-"}</TableCell>
                  <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{r.pp || "-"}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontSize: '13px', color: 'text.secondary' }}>Estimated Bunch weight</TableCell>
                <TableCell colSpan={2} sx={{ fontSize: '13px', fontWeight: 500 }}>
                  <Box display="flex" alignItems="center" gap={3}>
                    <span>{patternData.estimated_bunch_weight || "-"}</span>
                    {patternData.yield_label && (
                      <span style={{ fontWeight: 'bold' }}>Yield: {patternData.yield_label}</span>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Grid>

      {/* Remarks */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle2" gutterBottom fontWeight="bold">Remarks:</Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb', minHeight: '60px' }}>
          <Typography variant="body2">{patternData.remarks || "-"}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

interface CommonProps {
  trialId?: string;
}

const Common: React.FC<CommonProps> = ({ trialId: initialTrialId = "" }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlTrialId = urlParams.get('trial_id') || "";
  const effectiveTrialId = initialTrialId || urlTrialId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrialData | null>(null);
  const [masterListTooling, setMasterListTooling] = useState<any | null>(null);
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
        ['chemical_composition', 'micro_structure', 'tensile', 'hardness', 'mould_correction', 'pattern_data_sheet_files', 'tooling_files'].forEach(key => {
          if (typeof parsedTrial[key] === 'string') {
            try {
              parsedTrial[key] = JSON.parse(parsedTrial[key]);
            } catch (e) {
              console.error(`Failed to parse ${key}`, e);
            }
          }
        });

        // Fetch Master List Data for Specification
        if (parsedTrial.pattern_code) {
          try {
            const masterData = await trialService.getMasterListByPatternCode(parsedTrial.pattern_code);
            if (masterData) {

              setMasterListTooling(masterData);

              if (masterData.chemical_composition) {
                console.log("Raw Chemical Composition:", masterData.chemical_composition);
                parsedTrial.chemical_composition = parseChemicalComposition(masterData.chemical_composition);
                console.log("Parsed Chemical Composition:", parsedTrial.chemical_composition);
              } else {
                console.log("No Chemical Composition in Master Data");
              }

              if (masterData.micro_structure) {
                try {
                  const parsedMicro = typeof masterData.micro_structure === 'string'
                    ? JSON.parse(masterData.micro_structure)
                    : masterData.micro_structure;
                  if (parsedMicro && typeof parsedMicro === 'object') {
                    parsedTrial.micro_structure = {
                      nodularity: parsedMicro.nodularity || "--",
                      pearlite: parsedMicro.pearlite || "--",
                      carbide: parsedMicro.carbide || "--"
                    };
                  } else {
                    parsedTrial.micro_structure = parseMicrostructureData(String(masterData.micro_structure));
                  }
                } catch (e) {
                  parsedTrial.micro_structure = parseMicrostructureData(String(masterData.micro_structure));
                }
              }

              if (masterData.tensile) {
                parsedTrial.tensile = parseTensileData(masterData.tensile);
              }
              if (masterData.hardness) {
                parsedTrial.hardness = parseHardnessData(masterData.hardness);
              }

              if (masterData.xray) {
                parsedTrial.xray = masterData.xray;
              }
            }
          } catch (masterError) {
            console.error("Failed to fetch master list data:", masterError);
          }
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
              <LoadingState size={60} />
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
                        <PatternDatasheetSection patternCode={data.pattern_code} data={masterListTooling} />
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
                            "Plan Moulds",
                            "Actual Moulds",
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
                              value={data.date_of_sampling ? new Date(data.date_of_sampling).toISOString().slice(0, 10) : '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.plan_moulds || data.no_of_moulds || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.actual_moulds || '-'}
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
                              <DocumentViewer trialId={effectiveTrialId} category="PATTERN_DATA_SHEET" label="" />
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
                          <DocumentViewer trialId={effectiveTrialId} category="TOOLING_MODIFICATION" label="" />
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