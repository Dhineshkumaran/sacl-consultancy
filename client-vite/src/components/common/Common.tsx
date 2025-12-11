import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
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
  createTheme,
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ConstructionIcon from '@mui/icons-material/Construction';
import EditIcon from '@mui/icons-material/Edit';

type MouldCorrection = { compressibility?: string; squeeze_pressure?: string; filler_size?: string };

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
};

const COLORS = {
  primary: "#1e293b",
  secondary: "#ea580c",
  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  accentBlue: "#0ea5e9",
  accentGreen: "#10b981",
};

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  palette: {
    primary: { main: COLORS.primary },
    secondary: { main: COLORS.secondary },
    background: { default: COLORS.background, paper: COLORS.surface },
    text: { primary: COLORS.textPrimary, secondary: COLORS.textSecondary },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 800, letterSpacing: -0.5 },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.5 },
    body2: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.875rem' },
  },
});

const SectionHeader = ({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${color}`, width: '100%' }}>
    <Box sx={{ color: color, display: "flex" }}>{icon}</Box>
    <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
      {title}
    </Typography>
  </Box>
);

const Common: React.FC = ({ trialId }: { trialId: string }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrialData | null>(null);

  const fetchTrial = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`http://localhost:3000/api/trial/trial_id?trial_id=${encodeURIComponent(id)}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setData(json.data[0]);
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
    console.log(trialId);
    fetchTrial(trialId);
  }, [trialId]);

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <Card elevation={0} sx={{ border: `1px solid ${COLORS.border}`, mb: 2 }}>
          <CardContent>
            <SectionHeader icon={<PrecisionManufacturingIcon />} title="Part Identification" color={COLORS.primary} />

            {data ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>PATTERN CODE</Typography>
                  <TextField fullWidth size="small" value={data.pattern_code || ''} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>COMPONENT NAME</Typography>
                  <TextField fullWidth size="small" value={data.part_name || ''} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>TRIAL REFERENCE</Typography>
                  <TextField fullWidth size="small" value={data.trial_id || ''} disabled />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>MATERIAL GRADE</Typography>
                  <TextField fullWidth size="small" value={data.material_grade || ''} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>INITIATED BY</Typography>
                  <TextField fullWidth size="small" value={data.initiated_by || ''} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>DATE OF SAMPLING</Typography>
                  <TextField fullWidth size="small" value={data.date_of_sampling || ''} disabled />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>NO. OF MOULDS</Typography>
                  <TextField fullWidth size="small" value={String(data.no_of_moulds ?? '')} disabled />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>REASON FOR SAMPLING</Typography>
                  <TextField fullWidth size="small" value={data.reason_for_sampling || ''} disabled />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>TOOLING MODIFICATION</Typography>
                  <TextField fullWidth size="small" value={data.tooling_modification || ''} disabled />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>SAMPLE TRACEABILITY</Typography>
                  <TextField fullWidth size="small" value={data.sample_traceability || ''} disabled />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>REMARKS</Typography>
                  <TextField fullWidth size="small" multiline rows={3} value={data.remarks || ''} disabled />
                </Grid>

                <Grid item xs={12}>
                  <SectionHeader icon={<EditIcon />} title="Mould Correction Details" color={COLORS.primary} />
                  <Paper variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">Compressibility</TableCell>
                          <TableCell align="center">Squeeze Pressure</TableCell>
                          <TableCell align="center">Filler Size</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(data.mould_correction || []).map((r, i) => (
                          <TableRow key={i}>
                            <TableCell align="center">{r.compressibility || '-'}</TableCell>
                            <TableCell align="center">{r.squeeze_pressure || '-'}</TableCell>
                            <TableCell align="center">{r.filler_size || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>TOOLING FILES</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {(data.tooling_files || []).map((f, i) => (
                      <Chip key={i} label={f.name} disabled />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Box>
                {loading ? <CircularProgress size={20} /> : <Typography variant="body2">No trial loaded</Typography>}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

export default Common;