// src/components/sand.tsx
import React, { useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* -------------------------
  CONFIG - Backend base URL
------------------------- */
const BACKEND = (import.meta.env?.VITE_API_BASE as string) || "http://localhost:3000";

/* -------------------------
  Colors
------------------------- */
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

/* -------------------------
  Types
------------------------- */
export interface SandProperties {
  tClay: string;
  aClay: string;
  vcm: string;
  loi: string;
  afs: string;
  gcs: string;
  moi: string;
  compactability: string;
  perm: string;
  otherRemarks: string;
  date: string; // YYYY-MM-DD
}

interface SubmittedData {
  selectedPart: any | null;
  selectedPattern: any | null;
  machine: string;
  reason: string;
  trialNo: string;
  samplingDate: string;
  mouldCount: string;
  sampleTraceability: string;
}

interface SandPropertiesTableProps {
  submittedData?: SubmittedData;
  onSave?: (data: SandProperties) => void;
  onComplete?: () => void;
  readOnly?: boolean;
}

/* -------------------------
  Small Field helper
------------------------- */
const Field = React.memo(function Field({
  value,
  onChange,
  onBlur,
  error,
  helperText,
  multiline = false,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: string;
  multiline?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <TextField
      variant="outlined"
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      multiline={multiline}
      rows={multiline ? 2 : 1}
      placeholder={placeholder}
      type={type}
      error={error}
      helperText={helperText}
      inputProps={{ autoComplete: "off" }}
      sx={{
        background: "transparent",
        "& .MuiOutlinedInput-notchedOutline": {
          border: error ? "1px solid #d32f2f" : "1px solid #000",
        },
        "& .MuiOutlinedInput-input": { padding: "8px 10px", fontSize: "0.92rem" },
      }}
    />
  );
});
Field.displayName = "Field";

/* -------------------------
  Submitted sample card (read-only)
------------------------- */
const SubmittedSampleCard: React.FC<{ submittedData?: SubmittedData }> = ({ submittedData }) => {
  if (!submittedData) return null;

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", border: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white, mb: 3 }}>
      <Box sx={{ p: 3, borderBottom: `3px solid ${SAKTHI_COLORS.primary}`, background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, color: SAKTHI_COLORS.white }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, alignItems: 'start' }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Pattern Code</Typography>
            <TextField fullWidth value={submittedData.selectedPattern?.pattern_code || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } }} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Part Name</Typography>
            <TextField fullWidth value={submittedData.selectedPart?.part_name || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } }} />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>TRIAL No</Typography>
            <TextField fullWidth value={submittedData.trialNo || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Chip icon={<span style={{ fontSize: '1.2rem' }}>📋</span>} label="Submitted Sample Card Data (Read Only)" sx={{ bgcolor: SAKTHI_COLORS.success + '20', color: SAKTHI_COLORS.darkGray, border: `1px dashed ${SAKTHI_COLORS.success}`, fontWeight: 600, fontSize: '0.875rem', py: 2.5 }} />
      </Box>
    </Paper>
  );
};

/* -------------------------
  Main SandPropertiesTable component
------------------------- */
const SandPropertiesTable: React.FC<SandPropertiesTableProps> = ({ submittedData, onSave, onComplete, readOnly = false }) => {
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [data, setData] = useState<SandProperties>({
    tClay: "",
    aClay: "",
    vcm: "",
    loi: "",
    afs: "",
    gcs: "",
    moi: "",
    compactability: "",
    perm: "",
    otherRemarks: "",
    date: today,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submittedSandData, setSubmittedSandData] = useState<SandProperties | null>(null);

  // Preview overlay states (like moulding)
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);

  const initialTouched: Record<keyof SandProperties, boolean> = {
    tClay: false, aClay: false, vcm: false, loi: false, afs: false, gcs: false, moi: false, compactability: false, perm: false, otherRemarks: false, date: false
  };
  const [touched, setTouched] = useState(initialTouched);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const [exporting_old, setExporting_old] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);

  const setField = useCallback((key: keyof SandProperties, value: string) => setData(prev => ({ ...prev, [key]: value })), []);
  const handleBlur = useCallback((key: keyof SandProperties) => setTouched(t => ({ ...t, [key]: true })), []);

  // Validation removed - no required fields

  // Send payload to backend
  const sendToServer = useCallback(async (payload: any) => {
    const BACKEND = (import.meta.env?.VITE_API_BASE as string) || "http://localhost:3000";
    const url = `${BACKEND}/api/sand`;
    try {
      setSending(true);
      const token = typeof window !== "undefined" ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await axios.post(url, payload, { headers, timeout: 10000 });
      if (!res || res.status < 200 || res.status >= 300) throw new Error(res?.data?.message || `Server ${res?.status}`);
      return res.data;
    } catch (err) {
      console.error('Sand submit failed', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  // Open preview (like moulding)
  const handleSaveAndContinue = () => {
    const payload = { sand: data, submittedData: submittedData ?? undefined };
    setPreviewPayload(payload);
    setPreviewMode(true);
    setPreviewSubmitted(false);
    setMessage(null);
  };

  // Final save from preview
  const handleFinalSave = async () => {
    if (!previewPayload) return;
    try {
      setMessage(null);
      const result = await sendToServer(previewPayload);
      setPreviewSubmitted(true);
      setMessage('Sand data submitted successfully.');
      setSubmittedSandData(previewPayload.sand);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Sand final save error', err);
      setMessage(err?.message || 'Failed to submit sand data');
    }
  };

  // Export PDF from preview
  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) {
      setMessage('Nothing to export');
      return;
    }

    try {
      setExporting(true);
      const originalScrollY = window.scrollY;
      el.scrollIntoView({ behavior: 'auto', block: 'center' });

      const sourceCanvas = await html2canvas(el as HTMLElement, { scale: 2, useCORS: true, logging: false });
      window.scrollTo(0, originalScrollY);

      // Convert to black & white (grayscale)
      const bwCanvas = document.createElement('canvas');
      bwCanvas.width = sourceCanvas.width;
      bwCanvas.height = sourceCanvas.height;
      const bwCtx = bwCanvas.getContext('2d');
      if (!bwCtx) throw new Error('Could not get BW canvas context');

      bwCtx.drawImage(sourceCanvas, 0, 0);
      const imgDataObj = bwCtx.getImageData(0, 0, bwCanvas.width, bwCanvas.height);
      const dataArr = imgDataObj.data;
      for (let i = 0; i < dataArr.length; i += 4) {
        const r = dataArr[i];
        const g = dataArr[i + 1];
        const b = dataArr[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        dataArr[i] = gray;
        dataArr[i + 1] = gray;
        dataArr[i + 2] = gray;
      }
      bwCtx.putImageData(imgDataObj, 0, 0);

      const canvas = bwCanvas;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      const scale = (pageWidth - margin * 2) / canvas.width;
      const imgHeight = canvas.height * scale;
      const imgWidth = canvas.width * scale;

      if (imgHeight <= pageHeight - margin * 2) {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        const totalPages = Math.ceil(imgHeight / (pageHeight - margin * 2));
        const sliceHeightPx = Math.floor((pageHeight - margin * 2) / scale);

        for (let page = 0; page < totalPages; page++) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          const remainingPx = canvas.height - page * sliceHeightPx;
          pageCanvas.height = remainingPx < sliceHeightPx ? remainingPx : sliceHeightPx;

          const ctx = pageCanvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');

          ctx.drawImage(
            canvas,
            0,
            page * sliceHeightPx,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );

          const pageData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = pageCanvas.height * scale;

          if (page > 0) pdf.addPage();
          pdf.addImage(pageData, 'PNG', margin, margin, imgWidth, pageImgHeight);
        }
      }

      const pdfBlobUrl = pdf.output('bloburl');
      window.open(pdfBlobUrl, '_blank');
    } catch (err) {
      console.error('Export PDF failed:', err);
      setMessage('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleSave = useCallback(async () => {
    const payload = { sand: data, submittedData: submittedData || {} };
    console.log('🔧 DEBUG - Sending sand data to API:', payload);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post(`${BACKEND}/api/sand`, payload, { headers });

      console.log('📡 DEBUG - Response status:', res.status);
      console.log('✅ DEBUG - Success API Response:', res.data);

      setSubmittedSandData(data);
      setSubmitted(true);

      onSave && onSave(data);
    } catch (err: any) {
      console.error('Save sand failed', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Save failed - check server console';
      alert(errMsg);
    }
  }, [data, initialTouched, onSave, submittedData, touched]);

  const handleClear = useCallback(() => {
    setData({ tClay: "", aClay: "", vcm: "", loi: "", afs: "", gcs: "", moi: "", compactability: "", perm: "", otherRemarks: "", date: today });
    setTouched(initialTouched);
    setTriedSubmit(false);
  }, [today]);

  const handleProceedToMould = useCallback(() => { onComplete && onComplete(); }, [onComplete]);


  // Editable form with preview overlay
  return (
    <Box sx={{ p: 3 }} ref={printRef}>
      {/* Preview overlay (Apple-glass) */}
      {previewMode && previewPayload && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Box
            sx={{
              width: '90%',
              maxWidth: 980,
              maxHeight: '80vh',
              overflow: 'auto',
              borderRadius: 4,
              p: 3,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.82), rgba(248,250,252,0.9))',
              boxShadow: '0 25px 80px rgba(15,23,42,0.45)',
              border: '1px solid rgba(255,255,255,0.8)',
              position: 'relative',
            }}
          >
            {/* Close button in preview - routes to metallurgical inspection */}
            <IconButton
              onClick={() => {
                navigate('/metallurgical-inspection');
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: '#DC2626',
                '&:hover': { backgroundColor: 'rgba(220,38,38,0.08)' },
              }}
            >
              <CloseIcon />
            </IconButton>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} pr={5}>
              <Box>
                <Box component="div" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  Sand – Preview
                </Box>
                <Box component="div" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  Review your data before final submission
                </Box>
              </Box>
            </Box>

            {previewPayload.submittedData && (
              <Box mb={3}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Box sx={{ fontWeight: 600, mb: 0.5 }}>Pattern Code</Box>
                      <TextField fullWidth size="small" value={previewPayload.submittedData.selectedPattern?.pattern_code || ''} InputProps={{ readOnly: true }} />
                    </Box>
                    <Box>
                      <Box sx={{ fontWeight: 600, mb: 0.5 }}>Part Name</Box>
                      <TextField fullWidth size="small" value={previewPayload.submittedData.selectedPart?.part_name || ''} InputProps={{ readOnly: true }} />
                    </Box>
                    <Box>
                      <Box sx={{ fontWeight: 600, mb: 0.5 }}>TRIAL No</Box>
                      <TextField fullWidth size="small" value={previewPayload.submittedData.trialNo || ''} InputProps={{ readOnly: true }} />
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
              <Box sx={{ fontWeight: 700, mb: 1 }}>Sand Properties Data</Box>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>T.Clay</TableCell>
                    <TableCell>{previewPayload.sand.tClay || '--'}</TableCell>
                    <TableCell>A.Clay</TableCell>
                    <TableCell>{previewPayload.sand.aClay || '--'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>VCM</TableCell>
                    <TableCell>{previewPayload.sand.vcm || '--'}</TableCell>
                    <TableCell>LOI</TableCell>
                    <TableCell>{previewPayload.sand.loi || '--'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>AFS</TableCell>
                    <TableCell>{previewPayload.sand.afs || '--'}</TableCell>
                    <TableCell>G.C.S</TableCell>
                    <TableCell>{previewPayload.sand.gcs || '--'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>MOI</TableCell>
                    <TableCell>{previewPayload.sand.moi || '--'}</TableCell>
                    <TableCell>Compactability</TableCell>
                    <TableCell>{previewPayload.sand.compactability || '--'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Perm</TableCell>
                    <TableCell>{previewPayload.sand.perm || '--'}</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>{previewPayload.sand.date || '--'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            {message && (
              <Box mt={1}>
                <Box sx={{ p: 1, bgcolor: previewSubmitted ? 'rgba(16,185,129,0.12)' : 'rgba(14,165,233,0.06)', borderRadius: 2 }}>{message}</Box>
              </Box>
            )}

            <Box mt={3} display="flex" alignItems="center" gap={2}>
              <Button variant="outlined" onClick={() => setPreviewMode(false)} disabled={sending || previewSubmitted}>
                Edit
              </Button>

              <Button variant="contained" onClick={() => handleExportPDF()} disabled={exporting} sx={{ backgroundColor: SAKTHI_COLORS.primary }}>
                {exporting ? 'Generating PDF...' : 'Export PDF'}
              </Button>

              <Button variant="contained" onClick={handleFinalSave} disabled={sending || previewSubmitted} sx={{ backgroundColor: SAKTHI_COLORS.accent }}>
                {sending ? 'Saving...' : previewSubmitted ? 'Saved' : 'Save'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {submittedData && <SubmittedSampleCard submittedData={submittedData} />}

      <Paper elevation={0} sx={{ width: "100%", maxWidth: 1200, mx: "auto", border: "2px solid #000", bgcolor: "#f5f5f5", p: 0, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", background: "#bfbfbf", borderBottom: "2px solid #000", px: 1.5, py: 0.7 }}>
          <Typography sx={{ fontWeight: 800, letterSpacing: 0.5, fontSize: "0.95rem" }}>SAND PROPERTIES:</Typography>
          <Box sx={{ flex: 1 }} />
        </Box>

        <Box sx={{ px: 0, py: 0 }}>
          <Table size="small" sx={{ borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                <TableCell colSpan={9} sx={{ border: "none", background: "transparent" }} />
                <TableCell sx={{ border: "1px solid #000", background: "#d0d0d0", px: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Date :</Typography>
                    <Field value={data.date} onChange={(v) => setField("date", v)} type="date" />
                  </Box>
                </TableCell>
              </TableRow>

              <TableRow>
                {["T.Clay","A.Clay","VCM","LOI","AFS","G.C.S","MOI","Compactability","Perm","Other Remarks"].map(label => (
                  <TableCell key={label} align="center" sx={{ border: "1px solid #000", background: "#d0d0d0", fontWeight: 700, px: 0.5, py: 0.7, fontSize: "0.85rem" }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}><Field value={data.tClay} onChange={(v) => setField("tClay", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}><Field value={data.aClay} onChange={(v) => setField("aClay", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}><Field value={data.vcm} onChange={(v) => setField("vcm", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}><Field value={data.loi} onChange={(v) => setField("loi", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}><Field value={data.afs} onChange={(v) => setField("afs", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}><Field value={data.gcs} onChange={(v) => setField("gcs", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}><Field value={data.moi} onChange={(v) => setField("moi", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 140, p: 0.5 }}><Field value={data.compactability} onChange={(v) => setField("compactability", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}><Field value={data.perm} onChange={(v) => setField("perm", v)} /></TableCell>
                <TableCell sx={{ border: "1px solid #000", p: 0.5 }}><Field value={data.otherRemarks} onChange={(v) => setField("otherRemarks", v)} multiline /></TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={10} sx={{ border: "none", background: "transparent", height: 12 }} />
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", p: 2 }}>
          <Button variant="outlined" color="secondary" onClick={handleClear}>Clear</Button>
          <Button variant="contained" color="primary" onClick={handleSaveAndContinue}>Submit Sand Properties</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SandPropertiesTable;