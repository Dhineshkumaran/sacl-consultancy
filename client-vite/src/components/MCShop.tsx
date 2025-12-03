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
  Autocomplete,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";

/* ---------- Types ---------- */
type Row = { id: string; label: string; values: string[]; freeText?: string };
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
export default function McShopInspection({
  initialCavities = ["Cavity 1", "Cavity 2", "Cavity 3"],
  onSave = async (payload: any) => {
    console.log("McShopInspection default onSave", payload);
    return { ok: true };
  },
}: {
  initialCavities?: string[];
  onSave?: (payload: any) => Promise<any> | any;
}) {
  // header fields
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [userName, setUserName] = useState<string>("");
  const [userTime, setUserTime] = useState<string>("");
  const [userIP, setUserIP] = useState<string>("");

  // dynamic columns
  const [cavities, setCavities] = useState<string[]>([...initialCavities]);

  // table rows (each row has a values array matching cavities length)
  const makeInitialRows = (cavLabels: string[]): Row[] => [
    { id: `cavity-${uid()}`, label: "Cavity details", values: cavLabels.map(() => "") },
    { id: `received-${uid()}`, label: "Received Qty", values: cavLabels.map(() => "") },
    { id: `insp-${uid()}`, label: "Insp Qty", values: cavLabels.map(() => "") },
    { id: `accp-${uid()}`, label: "Accp Qty", values: cavLabels.map(() => "") },
    { id: `rej-${uid()}`, label: "Rej Qty", values: cavLabels.map(() => "") },
    // Reason for rejection row uses freeText (long cell) — still keep values for alignment but we'll show a single wide cell
    { id: `reason-${uid()}`, label: "Reason for rejection: cavity wise", values: cavLabels.map(() => ""), freeText: "" },
  ];

  const [rows, setRows] = useState<Row[]>(() => makeInitialRows(initialCavities));
  const [groupMeta, setGroupMeta] = useState<GroupMeta>({ remarks: "", attachment: null });
  const [dimensionalRemarks, setDimensionalRemarks] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Cavities management
  const addColumn = () => {
    const next = `Cavity ${cavities.length + 1}`;
    setCavities((c) => [...c, next]);
    setRows((r) => r.map((row) => ({ ...row, values: [...row.values, ""] })));
  };

  const removeColumn = (index: number) => {
    if (cavities.length <= 1) return;
    setCavities((c) => c.filter((_, i) => i !== index));
    setRows((r) => r.map((row) => ({ ...row, values: row.values.filter((_, i) => i !== index) })));
  };

  const updateCavityLabel = (index: number, label: string) => {
    setCavities((prev) => prev.map((c, i) => (i === index ? label : c)));
  };

  // cell updates
  const updateCell = (rowId: string, colIndex: number, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, values: r.values.map((v, i) => (i === colIndex ? value : v)) } : r)));
  };

  const updateReasonFreeText = (id: string, text: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, freeText: text } : r)));
  };

  const resetAll = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setUserName("");
    setUserTime("");
    setUserIP("");
    setCavities([...initialCavities]);
    setRows(makeInitialRows(initialCavities));
    setGroupMeta({ remarks: "", attachment: null });
    setDimensionalRemarks("");
    setMessage(null);
  };

  const buildPayload = () => {
    return {
      inspection_type: "mc_shop",
      inspection_date: date || null,
      user_name: userName || null,
      user_time: userTime || null,
      user_ip: userIP || null,
      cavities: cavities.slice(),
      rows: rows.map((r) => ({
        label: r.label,
        values: r.values.map((v) => (v === "" ? null : v)),
        freeText: r.freeText || null,
      })),
      right_remarks: groupMeta.remarks || null,
      right_attachment: fileToMeta(groupMeta.attachment),
      dimensional_report_remarks: dimensionalRemarks || null,
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
      console.error("McShopInspection save error", err);
      setMessage(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // fetch public IP (uses ipify); sets userIP (falls back to "Unavailable")
  const fetchUserIP = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (!res.ok) throw new Error("ip fetch failed");
      const data = await res.json();
      setUserIP(data.ip ?? "Unavailable");
    } catch (err) {
      console.error("Failed to fetch IP:", err);
      setUserIP("Unavailable");
    }
  };

  // When user enters/selects a name → capture current time and fetch IP (one-shot)
  const handleUserNameChange = async (value: string | null) => {
    const v = value ?? "";
    setUserName(v);

    if (v) {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setUserTime(formattedTime);

      // Fetch IP but don't block the UI — still await so state is set quickly
      await fetchUserIP();
    } else {
      setUserTime("");
      setUserIP("");
    }
  };

  /* ---------- Render ---------- */
  return (
    <Box mb={3}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.darkGray, mb: 1 }}>
        M/C SHOP
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, border: `2px solid ${COLORS.lightGray}` }}>
        {/* Header: Date (right) */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>{/* left can be empty or show other info */}</Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Typography sx={{ fontWeight: 600 }}>Date :</Typography>
            <TextField size="small" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
        </Box>

        {/* Table with dynamic cavities and right-hand Remarks column */}
        <Paper variant="outlined" sx={{ overflowX: "auto", border: `1px solid ${COLORS.lightGray}`, mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: COLORS.lightBlue }}>
                <TableCell sx={{ minWidth: 220, color: COLORS.white, fontWeight: 700 }}> </TableCell>

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
                      <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ color: COLORS.white }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                ))}

                <TableCell sx={{ width: 280, color: COLORS.white, fontWeight: 700, textAlign: "center" }}>Remarks</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r, ri) => {
                const isReasonRow = r.label.toLowerCase().includes("reason");
                return (
                  <TableRow key={r.id} sx={{ backgroundColor: ri % 2 === 0 ? COLORS.white : COLORS.background }}>
                    <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>{r.label}</TableCell>

                    {isReasonRow ? (
                      // For "Reason for rejection" row we render single wide cell spanning cavities
                      <TableCell colSpan={cavities.length}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Cavity wise reason..."
                          value={r.freeText ?? ""}
                          onChange={(e) => updateReasonFreeText(r.id, e.target.value)}
                          variant="outlined"
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }}
                        />
                      </TableCell>
                    ) : (
                      // Normal row: one input per cavity
                      r.values.map((val, ci) => (
                        <TableCell key={ci}>
                          <TextField
                            size="small"
                            fullWidth
                            value={val ?? ""}
                            onChange={(e) => updateCell(r.id, ci, e.target.value)}
                            variant="outlined"
                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }}
                          />
                        </TableCell>
                      ))
                    )}

                    {/* Right grouped cell - only on first row it should span all rows (like your reference) */}
                    {ri === 0 && (
                      <TableCell rowSpan={rows.length} sx={{ verticalAlign: "top", backgroundColor: COLORS.lightOrange, padding: 2 }}>
                        <Box display="flex" flexDirection="column" height="100%">
                          <TextField
                            size="small"
                            fullWidth
                            multiline
                            rows={8}
                            placeholder="Remarks (optional)"
                            value={groupMeta.remarks}
                            onChange={(e) => setGroupMeta((g) => ({ ...g, remarks: e.target.value }))}
                            variant="outlined"
                            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }}
                          />

                          <Box display="flex" alignItems="center" gap={2} marginTop="auto">
                            <input
                              accept="image/*,application/pdf"
                              id="mcshop-attach-file"
                              style={{ display: "none" }}
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setGroupMeta((g) => ({ ...g, attachment: file }));
                              }}
                            />
                            <label htmlFor="mcshop-attach-file">
                              <MUIButton size="small" variant="contained" component="span" startIcon={<UploadFileIcon />} sx={{ backgroundColor: COLORS.primary }}>
                                Attach File
                              </MUIButton>
                            </label>

                            {groupMeta.attachment ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                <InsertDriveFileIcon />
                                <Typography noWrap sx={{ maxWidth: 140 }}>
                                  {groupMeta.attachment.name}
                                </Typography>
                                <IconButton size="small" onClick={() => setGroupMeta((g) => ({ ...g, attachment: null }))}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No file attached
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* footer controls for cavities */}
          <Box p={1} sx={{ borderTop: `1px solid ${COLORS.lightGray}`, display: "flex", alignItems: "center", gap: 2 }}>
            <MUIButton size="small" variant="contained" onClick={addColumn} sx={{ backgroundColor: COLORS.accent }}>
              + Add Column
            </MUIButton>
            <Typography variant="caption" color="text.secondary">
              Add more cavities/columns as needed
            </Typography>

            <Box sx={{ flex: 1 }} />

            <MUIButton size="small" variant="outlined" onClick={resetAll} disabled={saving} sx={{ mr: 1 }}>
              Reset
            </MUIButton>
            <MUIButton size="small" variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </MUIButton>
          </Box>
        </Paper>

        {/* Dimensional Report Remarks and User Name */}
        <Box display="flex" gap={2} alignItems="flex-start">
          <Box flex={1}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Dimensional Report Remarks</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              size="small"
              value={dimensionalRemarks}
              onChange={(e) => setDimensionalRemarks(e.target.value)}
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }}
            />
          </Box>

          <Box sx={{ width: 240 }}>
            <Typography sx={{ fontWeight: 700, mb: 1, visibility: "hidden" }}>User Name (placeholder)</Typography>

            <Autocomplete
              freeSolo
              options={["Inspector A", "Inspector B", "Lab User"]}
              onChange={(_, v) => handleUserNameChange(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="User Name"
                  onChange={(e) => handleUserNameChange(e.target.value)}
                />
              )}
            />

            {/* Show time when user name is selected */}
            {userTime && (
              <Typography sx={{ mt: 1, fontWeight: 600, color: COLORS.darkGray }}>
                Time: {userTime}
              </Typography>
            )}

            {/* Show IP when fetched */}
            {userIP && (
              <Typography sx={{ mt: 0.5, fontWeight: 600, color: COLORS.darkGray }}>
                IP: {userIP}
              </Typography>
            )}
          </Box>
        </Box>

        {message && (
          <Box mt={1}>
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}