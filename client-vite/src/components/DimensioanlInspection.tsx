import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  IconButton,
  Button as MUIButton,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";

/* ---------- Types ---------- */
type CavRow = { id: string; label: string; values: string[] };
type GroupMeta = { remarks: string; attachment: File | null };

const COLORS = {
  primary: "#2446acff",
  accent: "#F59E0B",
  lightBlue: "#7FB3FF",
  lightGray: "#E5E7EB",
  background: "#F8FAFC",
  lightOrange: "#FEF3C7",
  lightGreen: "#D1FAE5",
  darkGray: "#374151",
  white: "#ffffff",
};

const fileToMeta = (f: File | null) => (f ? { name: f.name, size: f.size, type: f.type } : null);

function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------- Component ---------- */
export default function DimensionalInspection({
  initialCavities = ["Cavity 1"],
  onSave = async (payload: any) => {
    console.log("DimensionalInspection default onSave", payload);
    return { ok: true };
  },
}: {
  initialCavities?: string[];
  onSave?: (payload: any) => Promise<any> | any;
}) {
  // top-level fields
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [weightTarget, setWeightTarget] = useState<string>(""); // single small input
  const makeCavRows = (cavLabels: string[]) => [
    { id: `avg-${uid()}`, label: "Avg Casting weight", values: cavLabels.map(() => "") } as CavRow,
    // You can add other per-cavity rows if needed
  ];

  const [cavities, setCavities] = useState<string[]>([...initialCavities]);
  const [cavRows, setCavRows] = useState<CavRow[]>(() => makeCavRows(initialCavities));
  const [bunchWeight, setBunchWeight] = useState<string>("");
  const [groupMeta, setGroupMeta] = useState<GroupMeta>({ remarks: "", attachment: null });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Cavities management (dynamic columns)
  const addCavity = () => {
    const next = `Cavity ${cavities.length + 1}`;
    setCavities((c) => [...c, next]);
    setCavRows((rows) => rows.map((r) => ({ ...r, values: [...r.values, ""] })));
  };

  const removeCavity = (index: number) => {
    if (cavities.length <= 1) return;
    setCavities((c) => c.filter((_, i) => i !== index));
    setCavRows((rows) => rows.map((r) => ({ ...r, values: r.values.filter((_, i) => i !== index) })));
  };

  const updateCavityLabel = (index: number, label: string) => {
    setCavities((prev) => prev.map((c, i) => (i === index ? label : c)));
  };

  const updateCavCell = (rowId: string, colIndex: number, value: string) => {
    setCavRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, values: r.values.map((v, i) => (i === colIndex ? value : v)) } : r)));
  };

  // reset
  const resetAll = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setWeightTarget("");
    setCavities([...initialCavities]);
    setCavRows(makeCavRows(initialCavities));
    setBunchWeight("");
    setGroupMeta({ remarks: "", attachment: null });
    setMessage(null);
  };

  // payload builder
  const buildPayload = () => {
    return {
      inspection_date: date || null,
      weight_target: weightTarget || null,
      cavities: cavities.slice(),
      cavity_rows: cavRows.map((r) => ({ label: r.label, values: r.values.map((v) => (v === "" ? null : v)) })),
      bunch_weight: bunchWeight || null,
      dimensional_remarks: groupMeta.remarks || null,
      attachment: fileToMeta(groupMeta.attachment),
      created_at: new Date().toISOString(),
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = buildPayload();
      await onSave(payload);
      setMessage("Saved successfully");
    } catch (err: any) {
      console.error("DimensionalInspection save error", err);
      setMessage(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <Box mb={3}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.darkGray, mb: 1 }}>
        DIMENSIONAL INSPECTION
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, border: `2px solid ${COLORS.lightGray}` }}>
        {/* Header row: Date on right */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
          <Box flex={1} />
          <Box>
            <TextField
              label="Date"
              type="date"
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>

        {/* Dimensional Inspection Remarks row with attach area */}
        <Box display="flex" gap={2} mb={2}>
          <Box sx={{ minWidth: 240 }}>
            <Typography sx={{ fontWeight: 700 }}>Dimensional Inspection Remarks</Typography>
            <Typography sx={{ pt: 1 }}>:</Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Paper variant="outlined" sx={{ p: 2, borderStyle: "dashed", borderColor: COLORS.lightGray }}>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={5}
                placeholder="Remarks (optional)"
                value={groupMeta.remarks}
                onChange={(e) => setGroupMeta((g) => ({ ...g, remarks: e.target.value }))}
                variant="outlined"
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }}
              />

              <Box display="flex" alignItems="center" gap={2}>
                <input
                  accept="image/*,application/pdf"
                  id="dimensional-attach-file"
                  style={{ display: "none" }}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setGroupMeta((g) => ({ ...g, attachment: file }));
                  }}
                />
                <label htmlFor="dimensional-attach-file">
                  <MUIButton size="small" variant="contained" component="span" startIcon={<UploadFileIcon />} sx={{ backgroundColor: COLORS.primary }}>
                    Attach File
                  </MUIButton>
                </label>

                {groupMeta.attachment ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <InsertDriveFileIcon />
                    <Typography noWrap sx={{ maxWidth: 240 }}>{groupMeta.attachment.name}</Typography>
                    <IconButton size="small" onClick={() => setGroupMeta((g) => ({ ...g, attachment: null }))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">No file attached</Typography>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Right spacer so layout resembles your reference */}
          <Box sx={{ width: 120 }} />
        </Box>

        {/* Weight Target row */}
        <Box mb={2}>
          <Paper variant="outlined" sx={{ p: 1, borderColor: COLORS.lightGray }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography sx={{ fontWeight: 700, minWidth: 220 }}>Bunch Wt, (or) Casting Weight</Typography>
              <Typography sx={{ minWidth: 8 }}>:</Typography>
              <TextField size="small" value={weightTarget} onChange={(e) => setWeightTarget(e.target.value)} placeholder="Weight Target" sx={{ width: 240 }} />
            </Box>
          </Paper>
        </Box>

        {/* Cavities table */}
        <Box mb={2}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Cavity details</Typography>

          <Paper variant="outlined" sx={{ overflowX: "auto", border: `2px solid ${COLORS.lightGray}` }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: COLORS.lightBlue }}>
                  <TableCell sx={{ minWidth: 200, color: COLORS.white, fontWeight: 700 }}> </TableCell>

                  {cavities.map((c, ci) => (
                    <TableCell key={ci} sx={{ minWidth: 120, color: COLORS.white, fontWeight: 700 }}>
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <TextField
                          size="small"
                          variant="standard"
                          value={c}
                          onChange={(e) => updateCavityLabel(ci, e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={{ "& .MuiInputBase-input": { textAlign: "center", color: COLORS.white, fontWeight: 700 } }}
                        />
                        <IconButton size="small" onClick={() => removeCavity(ci)} sx={{ color: COLORS.white }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  ))}

                  <TableCell sx={{ width: 140, color: COLORS.white, fontWeight: 700 }}></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {cavRows.map((r) => (
                  <TableRow key={r.id} sx={{ backgroundColor: COLORS.white }}>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: "#F8FBFF" }}>{r.label}</TableCell>
                    {r.values.map((val, ci) => (
                      <TableCell key={ci}>
                        <TextField
                          size="small"
                          fullWidth
                          value={val}
                          onChange={(e) => updateCavCell(r.id, ci, e.target.value)}
                          variant="outlined"
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }}
                        />
                      </TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                ))}

                {/* Bunch Wt row (single entry) */}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Bunch Wt</TableCell>
                  {/* Provide one large input spanning remaining columns */}
                  <TableCell colSpan={cavities.length} sx={{ padding: 1 }}>
                    <TextField size="small" fullWidth placeholder="Bunch Wt" value={bunchWeight} onChange={(e) => setBunchWeight(e.target.value)} variant="outlined" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }} />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>

            <Box p={1} sx={{ borderTop: `1px solid ${COLORS.lightGray}`, display: "flex", alignItems: "center", gap: 2 }}>
              <MUIButton size="small" variant="contained" onClick={addCavity} sx={{ backgroundColor: COLORS.accent }}>
                + Add Column
              </MUIButton>
              <Typography variant="caption" color="text.secondary">Add more cavities as needed</Typography>

              <Box sx={{ flex: 1 }} />

              <MUIButton size="small" variant="outlined" onClick={resetAll} disabled={saving} sx={{ mr: 1 }}>
                Reset
              </MUIButton>
              <MUIButton size="small" variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </MUIButton>
            </Box>
          </Paper>
        </Box>

        {message && (
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary">{message}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}