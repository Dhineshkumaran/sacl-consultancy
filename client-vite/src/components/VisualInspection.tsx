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
    RadioGroup,
    FormControlLabel,
    Radio,
    Button as MUIButton,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * VisualInspection component
 *
 * Usage:
 * <VisualInspection
 *    initialRows={["Insp Qty", "Accp Qty", "Rej Qty", "Reason for rejection: cavity wise"]}
 *    onSave={(payload) => console.log(payload)}
 * />
 *
 * This mirrors the features in your MetallurgicalInspection component:
 * - Dynamic columns (Add / Remove)
 * - Editable cells per row x column
 * - A right-hand grouped area with OK radio, Remarks (multiline), and file attach (image/pdf)
 * - Reset / Save buttons; Save calls onSave(payload)
 */

/* ---------- Types ---------- */
type Row = { id: string; label: string; values: string[] };
type GroupMeta = { ok: boolean | null; remarks: string; attachment: File | null };

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

const fileToMeta = (f: File | null) => {
    if (!f) return null;
    return { name: f.name, size: f.size, type: f.type };
};

function uid(prefix = "") {
    return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

/* ---------- Component ---------- */
export default function VisualInspection({
    initialRows = ["Insp Qty", "Accp Qty", "Rej Qty", "Reason for rejection: cavity wise"],
    initialCols = ["Cavity 1"],
    onSave = async (payload: any) => {
        // default no-op; you should pass your save handler that posts to backend
        console.log("VisualInspection default onSave", payload);
        return { ok: true };
    },
}: {
    initialRows?: string[];
    initialCols?: string[];
    onSave?: (payload: any) => Promise<any> | any;
}) {
    const makeRows = (labels: string[]): Row[] =>
        labels.map((lab, i) => ({ id: `${lab}-${i}-${uid()}`, label: lab, values: initialCols.map(() => "") }));

    const [cols, setCols] = useState<string[]>([...initialCols]);
    const [rows, setRows] = useState<Row[]>(() => makeRows(initialRows));
    const [groupMeta, setGroupMeta] = useState<GroupMeta>({ ok: null, remarks: "", attachment: null });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const addColumn = () => {
        const next = `Cavity ${cols.length + 1}`;
        setCols((c) => [...c, next]);
        setRows((r) => r.map((row) => ({ ...row, values: [...row.values, ""] })));
    };

    const removeColumn = (index: number) => {
        if (cols.length <= 1) return;
        setCols((c) => c.filter((_, i) => i !== index));
        setRows((r) => r.map((row) => ({ ...row, values: row.values.filter((_, i) => i !== index) })));
    };

    const updateCell = (rowId: string, colIndex: number, value: string) => {
        setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, values: r.values.map((v, i) => (i === colIndex ? value : v)) } : r)));
    };

    const updateColLabel = (index: number, label: string) => {
        setCols((prev) => prev.map((c, i) => (i === index ? label : c)));
    };

    const reset = () => {
        setCols([...initialCols]);
        setRows(makeRows(initialRows));
        setGroupMeta({ ok: null, remarks: "", attachment: null });
        setMessage(null);
    };

    const buildPayload = () => {
        return {
            created_at: new Date().toISOString(),
            cols: cols.slice(),
            rows: rows.map((r) => ({ label: r.label, values: r.values.map((v) => (v === "" ? null : v)) })),
            group: {
                ok: groupMeta.ok,
                remarks: groupMeta.remarks || null,
                attachment: fileToMeta(groupMeta.attachment),
            },
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
            console.error("VisualInspection save error", err);
            setMessage(err?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Render ---------- */
    return (
        <Box mb={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.darkGray, mb: 1 }}>
                VISUAL INSPECTION
            </Typography>

            <Paper variant="outlined" sx={{ overflowX: "auto", border: `2px solid ${COLORS.lightGray}` }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: COLORS.lightBlue }}>
                            <TableCell sx={{ minWidth: 200, color: COLORS.white, fontWeight: 700 }}>Parameter</TableCell>

                            {cols.map((col, ci) => (
                                <TableCell key={ci} sx={{ minWidth: 120, color: COLORS.white, fontWeight: 700 }}>
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                        <TextField
                                            variant="standard"
                                            value={col}
                                            onChange={(e) => updateColLabel(ci, e.target.value)}
                                            InputProps={{ disableUnderline: true }}
                                            size="small"
                                            sx={{
                                                '& .MuiInputBase-input': { textAlign: "center", color: COLORS.white, fontWeight: 700 },
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => removeColumn(ci)}
                                            title="Remove column"
                                            sx={{ color: COLORS.white, "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }}
                                            aria-label={`remove-column-${ci}`}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            ))}

                            <TableCell sx={{ width: 140, color: COLORS.white, fontWeight: 700 }}>OK</TableCell>
                            <TableCell sx={{ width: 320, color: COLORS.white, fontWeight: 700 }}>Remarks</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.map((r, ri) => (
                            <TableRow
                                key={r.id}
                                sx={{
                                    backgroundColor: ri % 2 === 0 ? COLORS.white : COLORS.background,
                                    "&:hover": { backgroundColor: COLORS.lightGreen, transition: "all .15s ease-in-out" },
                                }}
                            >
                                <TableCell sx={{ fontWeight: 600, backgroundColor: ri % 2 === 0 ? "#F8FBFF" : "#F7FFF6" }}>{r.label}</TableCell>

                                {cols.map((_, ci) => (
                                    <TableCell key={ci}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={r.values[ci] ?? ""}
                                            onChange={(e) => updateCell(r.id, ci, e.target.value)}
                                            variant="outlined"
                                            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }}
                                        />
                                    </TableCell>
                                ))}

                                {ri === 0 ? (
                                    <>
                                        <TableCell rowSpan={rows.length} sx={{ backgroundColor: COLORS.lightGreen, verticalAlign: "middle", padding: "12px 8px" }}>
                                            <RadioGroup
                                                row
                                                value={groupMeta.ok === null ? "" : String(groupMeta.ok)}
                                                onChange={(e) => setGroupMeta((g) => ({ ...g, ok: e.target.value === "true" }))}
                                            >
                                                <FormControlLabel value="true" control={<Radio />} label="OK" />
                                                <FormControlLabel value="false" control={<Radio />} label="NOT OK" />
                                            </RadioGroup>
                                        </TableCell>

                                        <TableCell rowSpan={rows.length} sx={{ backgroundColor: COLORS.lightOrange, verticalAlign: "top", padding: "12px 8px" }}>
                                            <Box display="flex" flexDirection="column" height="100%">
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    multiline
                                                    rows={6}
                                                    placeholder="Remarks (optional)"
                                                    value={groupMeta.remarks}
                                                    onChange={(e) => setGroupMeta((g) => ({ ...g, remarks: e.target.value }))}
                                                    variant="outlined"
                                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 6, backgroundColor: COLORS.white } }}
                                                />

                                                <Box mt={2} display="flex" alignItems="center" gap={1} marginTop="auto">
                                                    <input
                                                        accept="image/*,application/pdf"
                                                        id="visual-group-file"
                                                        style={{ display: "none" }}
                                                        type="file"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0] ?? null;
                                                            setGroupMeta((g) => ({ ...g, attachment: file }));
                                                        }}
                                                    />
                                                    <label htmlFor="visual-group-file">
                                                        <MUIButton size="small" variant="contained" component="span" startIcon={<UploadFileIcon />} sx={{ backgroundColor: COLORS.primary }}>
                                                            Attach File
                                                        </MUIButton>
                                                    </label>

                                                    {groupMeta.attachment ? (
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <InsertDriveFileIcon />
                                                            <Typography noWrap sx={{ maxWidth: 180 }}>{groupMeta.attachment.name}</Typography>
                                                            <IconButton size="small" onClick={() => setGroupMeta((g) => ({ ...g, attachment: null }))}>
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

                <Box p={1} sx={{ borderTop: `1px solid ${COLORS.lightGray}`, display: "flex", alignItems: "center", gap: 2 }}>
                    <MUIButton size="small" variant="contained" onClick={addColumn} sx={{ backgroundColor: COLORS.accent }}>
                        + Add Column
                    </MUIButton>
                    <Typography variant="caption" color="text.secondary">Add more cavities/columns as needed</Typography>

                    <Box sx={{ flex: 1 }} />

                    <MUIButton size="small" variant="outlined" onClick={reset} disabled={saving} sx={{ mr: 1 }}>
                        Reset
                    </MUIButton>
                    <MUIButton size="small" variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </MUIButton>
                </Box>
            </Paper>

            {message && (
                <Box mt={1}>
                    <Typography variant="body2" color="text.secondary">{message}</Typography>
                </Box>
            )}
        </Box>
    );
}