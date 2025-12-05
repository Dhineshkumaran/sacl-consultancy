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
    Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

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
        labels.map((lab, i) => ({
            id: `${lab}-${i}-${uid()}`,
            label: lab,
            values: initialCols.map(() => ""),
        }));

    const [cols, setCols] = useState<string[]>([...initialCols]);
    const [rows, setRows] = useState<Row[]>(() => makeRows(initialRows));
    const [groupMeta, setGroupMeta] = useState<GroupMeta>({
        ok: null,
        remarks: "",
        attachment: null,
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // preview state
    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // IP state
    const [userIP, setUserIP] = useState<string>("");
    const [shouldRedirect, setShouldRedirect] = useState<boolean>(true);

    // auto-hide messages
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(t);
        }
    }, [message]);

    // fetch IP once on mount
    useEffect(() => {
        const fetchUserIP = async () => {
            try {
                const res = await fetch("https://api.ipify.org?format=json");
                if (!res.ok) throw new Error("Failed to fetch IP");
                const data = await res.json();
                setUserIP(data.ip ?? "Unavailable");
            } catch (err) {
                console.error("IP fetch error:", err);
                setUserIP("Unavailable");
            }
        };
        fetchUserIP();
    }, []);

    // auto redirect effect: only if submitted AND shouldRedirect is true
    useEffect(() => {
        if (submitted && shouldRedirect) {
            const t = setTimeout(() => {
                window.location.href = "/dashboard"; // adjust dashboard route if needed
            }, 2000);
            return () => clearTimeout(t);
        }
    }, [submitted, shouldRedirect]);

    const addColumn = () => {
        const next = `Cavity ${cols.length + 1}`;
        setCols((c) => [...c, next]);
        setRows((r) => r.map((row) => ({ ...row, values: [...row.values, ""] })));
    };

    const removeColumn = (index: number) => {
        if (cols.length <= 1) return;
        setCols((c) => c.filter((_, i) => i !== index));
        setRows((r) =>
            r.map((row) => ({
                ...row,
                values: row.values.filter((_, i) => i !== index),
            }))
        );
    };

    const updateCell = (rowId: string, colIndex: number, value: string) => {
        setRows((prev) =>
            prev.map((r) =>
                r.id === rowId
                    ? { ...r, values: r.values.map((v, i) => (i === colIndex ? value : v)) }
                    : r
            )
        );
    };

    const updateColLabel = (index: number, label: string) => {
        setCols((prev) => prev.map((c, i) => (i === index ? label : c)));
    };

    const reset = () => {
        setCols([...initialCols]);
        setRows(makeRows(initialRows));
        setGroupMeta({ ok: null, remarks: "", attachment: null });
        setMessage(null);
        setPreviewMode(false);
        setPreviewPayload(null);
        setSubmitted(false);
        setShouldRedirect(true);
    };

    const buildPayload = () => {
        return {
            created_at: new Date().toISOString(),
            cols: cols.slice(),
            rows: rows.map((r) => ({
                label: r.label,
                values: r.values.map((v) => (v === "" ? null : v)),
            })),
            group: {
                ok: groupMeta.ok,
                remarks: groupMeta.remarks || null,
                attachment: fileToMeta(groupMeta.attachment),
            },
        };
    };

    // Save & Continue -> show floating preview (no final save yet)
    const handleSaveAndContinue = () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = buildPayload();
            setPreviewPayload(payload);
            setPreviewMode(true);
            setSubmitted(false);
            setShouldRedirect(true);
        } catch (err: any) {
            console.error("VisualInspection prepare preview error", err);
            setMessage(err?.message || "Failed to prepare preview");
        } finally {
            setSaving(false);
        }
    };

    // Final save from preview
    const handleFinalSave = async () => {
        if (!previewPayload) return;
        setSaving(true);
        setMessage(null);
        try {
            await onSave(previewPayload);
            setSubmitted(true);
            setMessage("Successfully submitted");
            // redirect handled by useEffect (and can be disabled if user prints)
        } catch (err: any) {
            console.error("VisualInspection final save error", err);
            setMessage(err?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    // Export preview as PDF via browser print
    const handleExportPdf = () => {
        if (!previewPayload) return;

        // user wants to print -> don't auto redirect anymore
        setShouldRedirect(false);

        const popup = window.open("", "_blank", "width=1000,height=800");
        if (!popup) {
            alert("Unable to open print window. Please check popup blocker.");
            return;
        }
        const html = `
      <html>
        <head>
          <title>Visual Inspection Preview</title>
          <style>
            body { font-family: Inter, Roboto, Arial, sans-serif; margin: 20px; color: ${COLORS.darkGray}; }
            .glass { background: rgba(255,255,255,0.9); border-radius: 16px; padding: 24px; box-shadow: 0 18px 45px rgba(15,23,42,0.18); }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            th { background: ${COLORS.lightBlue}; color: white; font-weight: 700; text-align:center; }
            h2 { margin: 0 0 8px 0; }
          </style>
        </head>
        <body>
          <div class="glass">
            ${renderPreviewHtml(previewPayload)}
          </div>
        </body>
      </html>
    `;
        popup.document.write(html);
        popup.document.close();
        popup.focus();
        popup.print();
    };

    const renderPreviewHtml = (payload: any) => {
        if (!payload) return "<div>No preview data</div>";
        const colsHtml = (payload.cols || [])
            .map((c: string) => `<th>${escapeHtml(c)}</th>`)
            .join("");
        const rowsHtml = (payload.rows || [])
            .map((r: any) => {
                const vals = (r.values || [])
                    .map((v: any) => `<td>${v === null ? "" : escapeHtml(String(v))}</td>`)
                    .join("");
                return `<tr><td style="font-weight:700;">${escapeHtml(r.label)}</td>${vals}</tr>`;
            })
            .join("");

        return `
      <h2>Visual Inspection</h2>
      <div><strong>IP:</strong> ${escapeHtml(userIP || "")}</div>
      <div><strong>Created:</strong> ${escapeHtml(
            new Date(payload.created_at).toLocaleString()
        )}</div>
      <table>
        <thead>
          <tr><th style="min-width:180px;">Parameter</th>${colsHtml}</tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div style="margin-top:16px;">
        <strong>Group OK:</strong> ${payload.group?.ok === null ? "" : payload.group.ok ? "OK" : "NOT OK"
            }<br/>
        <strong>Remarks:</strong> ${escapeHtml(payload.group?.remarks ?? "")}<br/>
        <strong>Attachment:</strong> ${payload.group?.attachment
                ? escapeHtml(payload.group.attachment.name)
                : "No file attached"
            }
      </div>
    `;
    };

    const escapeHtml = (s: string) =>
        s
            ?.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;") ?? s;

    /* ---------- Render ---------- */

    return (
        <Box mb={3} sx={{ position: "relative" }}>
            {/* Heading row with IP on the right */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                }}
            >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.darkGray }}>
                    VISUAL INSPECTION
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "#DC2626" }} // bold red IP
                >
                    IP: {userIP || "Fetching..."}
                </Typography>
            </Box>

            <Paper variant="outlined" sx={{ overflowX: "auto", border: `2px solid ${COLORS.lightGray}` }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: COLORS.lightBlue }}>
                            <TableCell sx={{ minWidth: 200, color: COLORS.white, fontWeight: 700 }}>
                                Parameter
                            </TableCell>

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
                                                "& .MuiInputBase-input": {
                                                    textAlign: "center",
                                                    color: COLORS.white,
                                                    fontWeight: 700,
                                                },
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
                                <TableCell
                                    sx={{
                                        fontWeight: 600,
                                        backgroundColor: ri % 2 === 0 ? "#F8FBFF" : "#F7FFF6",
                                    }}
                                >
                                    {r.label}
                                </TableCell>

                                {cols.map((_, ci) => (
                                    <TableCell key={ci}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={r.values[ci] ?? ""}
                                            onChange={(e) => updateCell(r.id, ci, e.target.value)}
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

                                {ri === 0 ? (
                                    <>
                                        <TableCell
                                            rowSpan={rows.length}
                                            sx={{
                                                backgroundColor: COLORS.lightGreen,
                                                verticalAlign: "middle",
                                                padding: "12px 8px",
                                            }}
                                        >
                                            <RadioGroup
                                                row
                                                value={groupMeta.ok === null ? "" : String(groupMeta.ok)}
                                                onChange={(e) =>
                                                    setGroupMeta((g) => ({ ...g, ok: e.target.value === "true" }))
                                                }
                                            >
                                                <FormControlLabel value="true" control={<Radio />} label="OK" />
                                                <FormControlLabel value="false" control={<Radio />} label="NOT OK" />
                                            </RadioGroup>
                                        </TableCell>

                                        <TableCell
                                            rowSpan={rows.length}
                                            sx={{
                                                backgroundColor: COLORS.lightOrange,
                                                verticalAlign: "top",
                                                padding: "12px 8px",
                                            }}
                                        >
                                            <Box display="flex" flexDirection="column" height="100%">
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    multiline
                                                    rows={6}
                                                    placeholder="Remarks (optional)"
                                                    value={groupMeta.remarks}
                                                    onChange={(e) =>
                                                        setGroupMeta((g) => ({ ...g, remarks: e.target.value }))
                                                    }
                                                    variant="outlined"
                                                    sx={{
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 6,
                                                            backgroundColor: COLORS.white,
                                                        },
                                                        mb: 2,
                                                    }}
                                                />

                                                <Box display="flex" alignItems="center" gap={2}>
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
                                                        <MUIButton
                                                            size="small"
                                                            variant="contained"
                                                            component="span"
                                                            startIcon={<UploadFileIcon />}
                                                            sx={{ backgroundColor: COLORS.primary }}
                                                        >
                                                            Attach File
                                                        </MUIButton>
                                                    </label>

                                                    {groupMeta.attachment ? (
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <InsertDriveFileIcon />
                                                            <Typography noWrap sx={{ maxWidth: 180 }}>
                                                                {groupMeta.attachment.name}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    setGroupMeta((g) => ({ ...g, attachment: null }))
                                                                }
                                                            >
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
                                    </>
                                ) : null}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <Box
                    p={1}
                    sx={{
                        borderTop: `1px solid ${COLORS.lightGray}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <MUIButton
                        size="small"
                        variant="contained"
                        onClick={addColumn}
                        sx={{ backgroundColor: COLORS.accent }}
                    >
                        + Add Column
                    </MUIButton>
                    <Typography variant="caption" color="text.secondary">
                        Add more cavities/columns as needed
                    </Typography>

                    <Box sx={{ flex: 1 }} />

                    <MUIButton size="small" variant="outlined" onClick={reset} disabled={saving} sx={{ mr: 1 }}>
                        Reset
                    </MUIButton>

                    <MUIButton size="small" variant="contained" onClick={handleSaveAndContinue} disabled={saving}>
                        {saving ? "Processing..." : "Save & Continue"}
                    </MUIButton>
                </Box>
            </Paper>

            {message && !previewMode && (
                <Box mt={1}>
                    <Typography variant="body2" color="text.secondary">
                        {message}
                    </Typography>
                </Box>
            )}

            {/* Floating Apple-style Liquid Glass preview overlay */}
            {previewMode && previewPayload && (
                <Box
                    sx={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1300,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "rgba(15,23,42,0.5)",
                        backdropFilter: "blur(6px)",
                    }}
                >
                    <Box
                        sx={{
                            width: "90%",
                            maxWidth: 980,
                            maxHeight: "80vh",
                            overflow: "auto",
                            borderRadius: 4,
                            p: 3,
                            background:
                                "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(248,250,252,0.9))",
                            boxShadow: "0 25px 80px rgba(15,23,42,0.45)",
                            border: "1px solid rgba(255,255,255,0.8)",
                            position: "relative",
                        }}
                    >
                        {/* Red Cross close button on top-right */}
                        <IconButton
                            onClick={() => {
                                if (submitted) {
                                    window.location.href = "/dashboard";
                                } else {
                                    setPreviewMode(false);
                                    setPreviewPayload(null);
                                }
                            }}
                            sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                color: "#DC2626",
                                "&:hover": { backgroundColor: "rgba(220,38,38,0.08)" },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                            pr={5}
                        >
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Visual Inspection – Preview
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Review your data before final submission
                                </Typography>
                            </Box>

                            {/* IP display in preview */}
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 700, color: "#DC2626" }}
                            >
                                IP: {userIP || "Fetching..."}
                            </Typography>
                        </Box>

                        <Box mt={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: COLORS.lightBlue }}>
                                        <TableCell sx={{ minWidth: 180, color: COLORS.white, fontWeight: 700 }}>
                                            Parameter
                                        </TableCell>
                                        {previewPayload.cols.map((c: string, i: number) => (
                                            <TableCell
                                                key={i}
                                                sx={{
                                                    minWidth: 120,
                                                    color: COLORS.white,
                                                    fontWeight: 700,
                                                    textAlign: "center",
                                                }}
                                            >
                                                {c}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewPayload.rows.map((r: any, idx: number) => (
                                        <TableRow
                                            key={idx}
                                            sx={{
                                                backgroundColor: idx % 2 === 0 ? COLORS.white : COLORS.background,
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 700 }}>{r.label}</TableCell>
                                            {r.values.map((v: any, j: number) => (
                                                <TableCell key={j}>{v === null ? "" : String(v)}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>

                        <Box mt={2} display="flex" gap={3}>
                            <Box flex={1}>
                                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Group Result</Typography>
                                <Typography variant="body2">
                                    <strong>OK:</strong>{" "}
                                    {previewPayload.group.ok === null
                                        ? ""
                                        : previewPayload.group.ok
                                            ? "OK"
                                            : "NOT OK"}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Remarks:</strong> {previewPayload.group.remarks ?? ""}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Attachment:</strong>{" "}
                                    {previewPayload.group.attachment
                                        ? previewPayload.group.attachment.name
                                        : "No file attached"}
                                </Typography>
                            </Box>
                        </Box>

                        {message && (
                            <Box mt={2}>
                                <Alert severity={submitted ? "success" : "info"} sx={{ borderRadius: 3 }}>
                                    {message}
                                </Alert>
                            </Box>
                        )}

                        <Box mt={3} display="flex" alignItems="center" gap={2}>
                            {/* Edit button: disabled after Save */}
                            <MUIButton
                                variant="outlined"
                                onClick={() => setPreviewMode(false)}
                                disabled={saving || submitted}
                            >
                                Edit
                            </MUIButton>

                            <MUIButton
                                variant="contained"
                                onClick={handleExportPdf}
                                startIcon={<UploadFileIcon />}
                                sx={{ backgroundColor: COLORS.primary }}
                            >
                                Export PDF
                            </MUIButton>

                            <MUIButton
                                variant="contained"
                                onClick={handleFinalSave}
                                disabled={saving || submitted}
                                sx={{ backgroundColor: COLORS.accent }}
                            >
                                {saving ? "Saving..." : submitted ? "Submitted" : "Save"}
                            </MUIButton>

                            <Box sx={{ flex: 1 }} />
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}