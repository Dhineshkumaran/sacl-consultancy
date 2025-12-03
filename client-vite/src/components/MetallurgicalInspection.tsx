// src/components/MetallurgicalInspection.tsx
import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ThemeProvider,
  createTheme,
  Button,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const COLORS = {
  primary: "#2446acff",
  secondary: "#DC2626",
  accent: "#F59E0B",
  background: "#F8FAFC",
  lightBlue: "#7FB3FF",
  darkGray: "#374151",
  lightGray: "#E5E7EB",
  white: "#FFFFFF",
  lightOrange: "#FEF3C7",
  lightGreen: "#D1FAE5",
};

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Poppins", sans-serif',
    h6: { fontWeight: 700, color: COLORS.darkGray },
    subtitle1: { fontWeight: 600, color: COLORS.darkGray },
    body1: { fontWeight: 400, color: COLORS.darkGray },
    body2: { fontWeight: 400, color: COLORS.darkGray },
  },
  palette: {
    primary: { main: COLORS.primary },
    secondary: { main: COLORS.secondary },
    background: { default: COLORS.background },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: COLORS.lightBlue,
          color: COLORS.white,
          borderRight: `1px solid ${COLORS.lightGray}`,
          padding: "12px 8px",
          textAlign: "center",
        },
        body: {
          backgroundColor: COLORS.white,
          borderRight: `1px solid ${COLORS.lightGray}`,
          padding: "8px",
          textAlign: "left",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 6,
          },
        },
      },
    },
  },
});

interface Row {
  id: string;
  label: string;
  attachment: File | null;
  ok: boolean | null;
  remarks: string;
  value?: string;
}

interface MicroCol {
  id: string;
  label: string;
}

const initialRows = (labels: string[]): Row[] =>
  labels.map((label, i) => ({
    id: `${label}-${i}`,
    label,
    attachment: null,
    ok: null,
    remarks: "",
  }));

// Default microstructure parameters
const MICRO_PARAMS = ["Cavity number", "Nodularity", "Matrix", "Carbide", "Inclusion"];

function SectionTable({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: Row[];
  onChange: (id: string, patch: Partial<Row>) => void;
}) {
  // Local dynamic columns + values per row (independent per table instance)
  const [cols, setCols] = useState<MicroCol[]>([{ id: 'c1', label: 'Value' }]);
  const [values, setValues] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    rows.forEach((r) => { init[r.id] = ['']; });
    return init;
  });

  const [groupMeta, setGroupMeta] = useState<{ attachment: File | null; ok: boolean | null; remarks: string }>(() => ({ attachment: null, ok: null, remarks: '' }));

  useEffect(() => {
    // keep values in sync if rows prop changes
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      rows.forEach((r) => { copy[r.id] = prev[r.id] ?? ['']; });
      return copy;
    });
  }, [rows]);

  const addColumn = () => {
    setCols((prev) => [...prev, { id: `c${prev.length + 1}`, label: 'Value' }]);
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => { copy[k] = [...prev[k], '']; });
      return copy;
    });
  };

  const removeColumn = (index: number) => {
    setCols((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => {
        const arr = [...prev[k]];
        if (arr.length > index) arr.splice(index, 1);
        copy[k] = arr;
      });
      return copy;
    });
  };

  const updateCell = (rowId: string, colIndex: number, val: string) => {
    setValues((prev) => ({ ...prev, [rowId]: prev[rowId].map((v, i) => (i === colIndex ? val : v)) }));
    // propagate a combined value to parent so existing save logic still receives something
    const combined = (values[rowId] || []).map((v, i) => (i === colIndex ? val : v)).filter(Boolean).join(' | ');
    onChange(rowId, { value: combined });
  };

  const updateGroupMeta = (patch: Partial<{ attachment: File | null; ok: boolean | null; remarks: string }>) => {
    setGroupMeta((prev) => ({ ...prev, ...patch }));
  };

  return (
    <Box mb={2}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: COLORS.darkGray }}>
        {title}
      </Typography>

      <Paper variant="outlined" sx={{ overflowX: 'auto', border: `2px solid ${COLORS.lightGray}` }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: COLORS.lightBlue }}>
              <TableCell sx={{ minWidth: 220, fontWeight: 700, color: COLORS.white }}>Parameter</TableCell>
              {cols.map((c, ci) => (
                <TableCell key={c.id} sx={{ minWidth: 120, fontWeight: 700, color: COLORS.white }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                    <TextField
                      size="small"
                      value={c.label}
                      onChange={(e) => setCols((prev) => prev.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                      sx={{
                        input: { textAlign: 'center', fontWeight: 700, color: COLORS.white },
                        '& .MuiInputBase-input': { textAlign: 'center', fontWeight: 700, color: COLORS.white },
                        '& .MuiInput-root': { justifyContent: 'center' }
                      }}
                    />
                    <IconButton size="small" onClick={() => removeColumn(ci)} title="Remove column" sx={{ color: COLORS.white, "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}

              <TableCell sx={{ width: 140, fontWeight: 700, color: COLORS.white }}>OK</TableCell>
              <TableCell sx={{ width: 240, fontWeight: 700, color: COLORS.white }}>Remarks</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r: Row, idx: number) => (
              <TableRow key={r.id} sx={{ backgroundColor: idx % 2 === 0 ? COLORS.white : COLORS.background, "&:hover": { backgroundColor: COLORS.lightGreen, transition: "all 0.2s ease" } }}>
                <TableCell sx={{ fontWeight: 600, color: COLORS.darkGray, backgroundColor: idx % 2 === 0 ? "#F8FBFF" : "#F7FFF6" }}>{r.label}</TableCell>

                {cols.map((c, ci) => (
                  <TableCell key={c.id} sx={{ backgroundColor: idx % 2 === 0 ? COLORS.white : COLORS.background }}>
                    <TextField size="small" fullWidth value={values[r.id]?.[ci] ?? ""} onChange={(e) => updateCell(r.id, ci, e.target.value)} variant="outlined" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }} />
                  </TableCell>
                ))}

                {idx === 0 ? (
                  <>
                    <TableCell rowSpan={rows.length} sx={{ backgroundColor: COLORS.lightGreen, verticalAlign: "middle", padding: "12px 8px" }}>
                      <RadioGroup row value={groupMeta.ok === null ? "" : String(groupMeta.ok)} onChange={(e) => updateGroupMeta({ ok: e.target.value === "true" })}>
                        <FormControlLabel value="true" control={<Radio />} label="OK" />
                        <FormControlLabel value="false" control={<Radio />} label="NOT OK" />
                      </RadioGroup>
                    </TableCell>

                    <TableCell rowSpan={rows.length} colSpan={4} sx={{ backgroundColor: COLORS.lightOrange, verticalAlign: "top", padding: "12px 8px" }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <TextField size="small" fullWidth multiline rows={8} value={groupMeta.remarks} onChange={(e) => updateGroupMeta({ remarks: e.target.value })} placeholder="Remarks (optional)" variant="outlined" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }} />
                          <br />
                          <Box mt={2} sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 'auto' }}>
                          <input accept="image/*,application/pdf" style={{ display: 'none' }} id={`${title}-group-file`} type="file" onChange={(e) => { const file = e.target.files?.[0] ?? null; updateGroupMeta({ attachment: file }); }} />
                          <label htmlFor={`${title}-group-file`}>
                            <Button component="span" size="small" variant="contained" startIcon={<UploadFileIcon />} sx={{ backgroundColor: COLORS.primary, '&:hover': { opacity: 0.95 } }}>
                              Attach File
                            </Button>
                          </label>

                          {groupMeta.attachment ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <InsertDriveFileIcon color="action" />
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{groupMeta.attachment?.name}</Typography>
                              <IconButton size="small" onClick={() => updateGroupMeta({ attachment: null })}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">No file attached</Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box p={1} sx={{ borderTop: `1px solid ${COLORS.lightGray}`, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button size="small" variant="contained" onClick={addColumn} sx={{ backgroundColor: COLORS.accent, '&:hover': { backgroundColor: COLORS.accent, opacity: 0.8 } }}>
            + Add Column
          </Button>
          <Typography variant="caption" color="text.secondary">Add more columns as needed</Typography>
        </Box>

      </Paper>

    </Box>
  );
}

/**
 * Helper to convert File to lightweight metadata object for DB JSON column.
 * We are not uploading file content here — the backend controller stores JSON metadata.
 */
const fileToMeta = (f: File | null) => {
  if (!f) return null;
  return { name: f.name, size: f.size, type: f.type };
};

export default function MetallurgicalInspection() {
  const [, setUserName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState< { severity: "success" | "error" | "info" | "warning"; message: string } | null >(null);

  // Microstructure dynamic columns state
  const [microCols, setMicroCols] = useState<MicroCol[]>([{ id: 'c1', label: 'Value' }]);
  const [microValues, setMicroValues] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    MICRO_PARAMS.forEach((p) => {
      init[p] = [''];
    });
    return init;
  });

  const [microMeta, setMicroMeta] = useState<Record<string, { attachment: File | null; ok: boolean | null; remarks: string }>>(() => {
    const init: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }> = {};
    MICRO_PARAMS.forEach((p) => {
      init[p] = { attachment: null, ok: null, remarks: '' };
    });
    // shared meta for grouped rows (Nodularity, Matrix, Carbide, Inclusion)
    init['group'] = { attachment: null, ok: null, remarks: '' };
    return init;
  });

  const [mechRows, setMechRows] = useState<Row[]>(initialRows(["Tensile strength", "Yield strength", "Elongation"]));
  const [impactRows, setImpactRows] = useState<Row[]>(initialRows(["Impact strength", "Cold Temp °C", "Room Temp °C"]));
  const [hardRows, setHardRows] = useState<Row[]>(initialRows(["Surface", "Core"]));
  const [ndtRows, setNdtRows] = useState<Row[]>(initialRows(["Cavity number", "Insp Qty", "Accp Qty", "Rej Qty", "Reason for Rej"]));

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const updateRow = (setRows: Dispatch<SetStateAction<Row[]>>) => (id: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const buildPayload = () => {
    const mapRows = (rows: Row[]) =>
      rows.map((r) => ({
        label: r.label,
        value: r.value ?? null,
        ok: r.ok === null ? null : Boolean(r.ok),
        remarks: r.remarks ?? null,
        attachment: fileToMeta(r.attachment),
      }));

    const microRowsPayload = MICRO_PARAMS.map((p) => ({
      label: p,
      values: (microValues[p] || []).map((v) => (v === '' ? null : v)),
      // all rows use shared 'group' meta for ok, remarks, attachment
      ok: microMeta['group']?.ok ?? null,
      remarks: microMeta['group']?.remarks ?? null,
      attachment: fileToMeta(microMeta['group']?.attachment ?? null),
    }));

    return {
      inspection_date: date || null,
      user_name: undefined,
      microRows: microRowsPayload,
      mechRows: mapRows(mechRows),
      impactRows: mapRows(impactRows),
      hardRows: mapRows(hardRows),
      ndtRows: mapRows(ndtRows),
      status: "draft",
    };
  };

  const handleSave = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const payload = buildPayload();
      console.log("DEBUG: sending inspection payload:", payload);

      const BACKEND = "http://localhost:3000";
      const res = await axios.post(`${BACKEND}/api/metallurgical-inspection`, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      });

      if (res.status === 201 || res.status === 200) {
        setAlert({ severity: "success", message: "Inspection saved successfully (insertId: " + (res.data?.insertId ?? "n/a") + ")" });
      } else {
        setAlert({ severity: "error", message: "Unexpected server response: " + res.status });
      }
    } catch (err: any) {
      console.error("ERROR saving inspection:", err?.response?.data ?? err.message ?? err);
      const msg = err?.response?.data?.message || err?.message || "Save failed — check server logs";
      setAlert({ severity: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
        <Paper elevation={2}>
          <Box flex={1} p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">METALLURGICAL INSPECTION</Typography>

              <Box display="flex" gap={2}>
                <Autocomplete freeSolo options={["Inspector A", "Inspector B", "Lab User"]} onChange={(_, v) => setUserName(v || "")} renderInput={(params) => <TextField {...params} size="small" label="User Name (optional)" />} sx={{ width: 220 }} />
                <TextField size="small" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
            </Box>

            {alert && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.message}</Alert>}

            <MicrostructureTable
              params={MICRO_PARAMS}
              cols={microCols}
              values={microValues}
              meta={microMeta}
              setCols={setMicroCols}
              setValues={setMicroValues}
              setMeta={setMicroMeta}
            />
            <SectionTable title="Mechanical Properties" rows={mechRows} onChange={updateRow(setMechRows)} />
            <SectionTable title="Impact strength" rows={impactRows} onChange={updateRow(setImpactRows)} />
            <SectionTable title="Hardness" rows={hardRows} onChange={updateRow(setHardRows)} />
            <SectionTable title="NDT Inspection Analysis" rows={ndtRows} onChange={updateRow(setNdtRows)} />

            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button variant="outlined" sx={{ mr: 1 }} onClick={() => {
                // reset microstructure dynamic table
                setMicroCols([{ id: 'c1', label: 'Value' }]);
                setMicroValues(() => {
                  const init: Record<string, string[]> = {};
                  MICRO_PARAMS.forEach((p) => { init[p] = ['']; });
                  return init;
                });
                setMicroMeta(() => {
                  const init: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }> = {};
                  MICRO_PARAMS.forEach((p) => { init[p] = { attachment: null, ok: null, remarks: '' }; });
                  init['group'] = { attachment: null, ok: null, remarks: '' };
                  return init;
                });
                setMechRows(initialRows(["Tensile strength", "Yield strength", "Elongation"]));
                setImpactRows(initialRows(["Impact strength", "Cold Temp °C", "Room Temp °C"]));
                setHardRows(initialRows(["Surface", "Core"]));
                setNdtRows(initialRows(["Cavity number", "Insp Qty", "Accp Qty", "Rej Qty", "Reason for Rej"]));
                setAlert(null);
              }}>Reset</Button>

              <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : "Save & Continue"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

function MicrostructureTable({
  params,
  cols,
  values,
  meta,
  setCols,
  setValues,
  setMeta,
}: {
  params: string[];
  cols: MicroCol[];
  values: Record<string, string[]>;
  meta: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }>;
  setCols: (c: MicroCol[] | ((prev: MicroCol[]) => MicroCol[])) => void;
  setValues: (v: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
  setMeta: (m: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }> | ((prev: any) => any)) => void;
}) {
  const addColumn = () => {
    setCols((prev: MicroCol[]) => {
      const nextIndex = prev.length + 1;
      const next = [...prev, { id: `c${nextIndex}`, label: 'Value' }];
      return next;
    });

    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => {
        copy[k] = [...prev[k], ""];
      });
      return copy;
    });
  };

  const removeColumn = (index: number) => {
    setCols((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => {
        const arr = [...prev[k]];
        if (arr.length > index) arr.splice(index, 1);
        copy[k] = arr;
      });
      return copy;
    });
  };

  const updateCell = (param: string, colIndex: number, val: string) => {
    setValues((prev) => ({ ...prev, [param]: prev[param].map((v, i) => (i === colIndex ? val : v)) }));
  };

  const updateMeta = (param: string, patch: Partial<{ attachment: File | null; ok: boolean | null; remarks: string }>) => {
    setMeta((prev: any) => ({ ...prev, [param]: { ...prev[param], ...patch } }));
  };

  return (
    <Box mb={3}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: COLORS.darkGray }}>
        Microstructure Examination Result
      </Typography>

      <Paper variant="outlined" sx={{ overflowX: "auto", border: `2px solid ${COLORS.lightGray}` }}>
        <Table size="small" sx={{ borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: COLORS.lightBlue }}>
              <TableCell sx={{ minWidth: 200, fontWeight: 700, color: COLORS.white }}>
                Parameter
              </TableCell>
              {cols.map((c, ci) => (
                <TableCell key={c.id} sx={{ minWidth: 120, fontWeight: 700, color: COLORS.white }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                    <TextField
                      size="small"
                      value={c.label}
                      onChange={(e) => setCols((prev) => prev.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                      sx={{
                        input: { textAlign: 'center', fontWeight: 700, color: COLORS.white },
                        '& .MuiInputBase-input': { textAlign: 'center', fontWeight: 700, color: COLORS.white },
                        '& .MuiInput-root': { justifyContent: 'center' }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeColumn(ci)}
                      title="Remove column"
                      sx={{ color: COLORS.white, "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}

              <TableCell sx={{ width: 140, fontWeight: 700, color: COLORS.white }}>
                OK
              </TableCell>
              <TableCell sx={{ width: 240, fontWeight: 700, color: COLORS.white }}>
                Remarks
              </TableCell>
            </TableRow>
            {/* Add Column button moved below table for better layout */}
          </TableHead>

          <TableBody>
            {params.map((param, pIndex) => (
              <TableRow
                key={param}
                sx={{
                  backgroundColor: pIndex % 2 === 0 ? COLORS.white : COLORS.background,
                  "&:hover": { backgroundColor: COLORS.lightGreen, transition: "all 0.2s ease" },
                }}
              >
                <TableCell sx={{ fontWeight: 600, color: COLORS.darkGray, backgroundColor: pIndex % 2 === 0 ? "#F0F9FF" : "#F0FDF4" }}>
                  {param}
                </TableCell>
                {cols.map((c, ci) => (
                  <TableCell key={c.id} sx={{ backgroundColor: pIndex % 2 === 0 ? COLORS.white : COLORS.background }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={values[param]?.[ci] ?? ""}
                      onChange={(e) => updateCell(param, ci, e.target.value)}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 6,
                          backgroundColor: COLORS.white,
                        },
                      }}
                    />
                  </TableCell>
                ))}

                {pIndex === 0 ? (
                  <>
                    <TableCell
                      rowSpan={params.length}
                      sx={{
                        backgroundColor: COLORS.lightGreen,
                        verticalAlign: "middle",
                        padding: "12px 8px",
                      }}
                    >
                      <RadioGroup
                        row
                        value={meta["group"]?.ok === null ? "" : String(meta["group"]?.ok)}
                        onChange={(e) => updateMeta("group", { ok: e.target.value === "true" })}
                      >
                        <FormControlLabel value="true" control={<Radio />} label="OK" />
                        <FormControlLabel value="false" control={<Radio />} label="NOT OK" />
                      </RadioGroup>
                    </TableCell>

                    <TableCell
                      rowSpan={params.length}
                      colSpan={6}
                      sx={{
                        backgroundColor: COLORS.lightOrange,
                        verticalAlign: "top",
                        padding: "12px 8px",
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={8}
                          value={meta["group"]?.remarks ?? ""}
                          onChange={(e) => updateMeta("group", { remarks: e.target.value })}
                          placeholder="Remarks (optional)"
                          variant="outlined"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 6,
                              backgroundColor: COLORS.white,
                            },
                          }}
                        />
                        <br />
                        <Box mt={2} sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 'auto' }}>
                          <input
                            accept="image/*,application/pdf"
                            style={{ display: 'none' }}
                            id={`micro-group-file`}
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              updateMeta('group', { attachment: file });
                            }}
                          />
                          
                          <label htmlFor={`micro-group-file`}>
                            <Button component="span" size="small" variant="contained" startIcon={<UploadFileIcon />} sx={{ backgroundColor: COLORS.primary, '&:hover': { opacity: 0.95 } }}>
                              Attach File
                            </Button>
                          </label>

                          {meta['group']?.attachment ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <InsertDriveFileIcon color="action" />
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{meta['group']?.attachment?.name}</Typography>
                              <IconButton size="small" onClick={() => updateMeta('group', { attachment: null })}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">No file attached</Typography>
                          )}
                        </Box>
                      </Box>
                      {/* Make the remarks cell span 4 columns for more horizontal space */}
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box p={1} sx={{ borderTop: `1px solid ${COLORS.lightGray}`, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button size="small" variant="contained" onClick={addColumn} sx={{ backgroundColor: COLORS.accent, '&:hover': { backgroundColor: COLORS.accent, opacity: 0.8 } }}>
            + Add Column
          </Button>
          <Typography variant="caption" color="text.secondary">Add more columns as needed</Typography>
        </Box>

      </Paper>
    </Box>
  );
}