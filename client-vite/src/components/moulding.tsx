// src/components/moulding.tsx
import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Import the inspection component so we can render it in-place after submit
import MetallurgicalInspection from "./MetallurgicalInspection";

// Colors
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
export interface MouldingData {
  mouldThickness: string;
  compressability: string;
  squeezePressure: string;
  mouldHardness: string;
  userName: string;
  otherRemarks: string;
  type: string;
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

interface MouldingTableProps {
  submittedData?: SubmittedData;
  onSave?: (data: MouldingData) => void;
  onComplete?: () => void;
  readOnly?: boolean;
}

/* -------------------------
 Simple parsers (kept concise)
 ------------------------- */
const parseTensileData = (tensile: string) => {
  const lines = tensile ? tensile.split('\n') : [];
  let tensileStrength = '';
  let yieldStrength = '';
  let elongation = '';
  lines.forEach(line => {
    const cleanLine = line.trim();
    if (!tensileStrength && (cleanLine.match(/\d+\s*(MPa|N\/mm²|Mpa|Kgf\/mm²)/) || cleanLine.includes('Tensile Strength'))) {
      const m = cleanLine.match(/(\d+)/);
      if (m) tensileStrength = m[1];
    }
    if (!yieldStrength && cleanLine.includes('Yield')) {
      const m = cleanLine.match(/(\d+)/);
      if (m) yieldStrength = m[1];
    }
    if (!elongation && (cleanLine.includes('Elongation') || cleanLine.includes('%'))) {
      const m = cleanLine.match(/(\d+)/);
      if (m) elongation = m[1];
    }
  });
  return { tensileStrength, yieldStrength, elongation, impactCold: '', impactRoom: '' };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure ? microstructure.split('\n') : [];
  let nodularity = '';
  let pearlite = '';
  let carbide = '';
  lines.forEach(line => {
    const cleanLine = line.toLowerCase();
    if (!nodularity && cleanLine.includes('nodularity')) {
      const m = cleanLine.match(/(\d+)/);
      if (m) nodularity = m[1];
    }
    if (!pearlite && cleanLine.includes('pearlite')) {
      const m = cleanLine.match(/(\d+)/);
      if (m) pearlite = m[1];
    }
    if (!carbide && (cleanLine.includes('carbide') || cleanLine.includes('cementite'))) {
      const m = cleanLine.match(/(\d+)/);
      if (m) carbide = m[1];
    }
  });
  return { nodularity: nodularity || '--', pearlite: pearlite || '--', carbide: carbide || '--' };
};

const parseHardnessData = (hardness: string) => {
  const lines = hardness ? hardness.split('\n') : [];
  let surface = '';
  let core = '';
  lines.forEach(line => {
    const cleanLine = line.toLowerCase();
    if (cleanLine.includes('surface') && !surface) {
      const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (m) surface = m[1];
    } else if (cleanLine.includes('core') && !core) {
      const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (m) core = m[1];
    } else if (!surface) {
      const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (m) surface = m[1];
    }
  });
  return { surface: surface || '--', core: core || '--' };
};

/* -------------------------
 SubmittedSampleCard (read-only view)
 ------------------------- */
const SubmittedSampleCard: React.FC<{ submittedData: SubmittedData }> = ({ submittedData }) => {
  const chemicalData = submittedData?.selectedPart ? (submittedData.selectedPart.chemical_composition || { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' }) : { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' };
  const tensileData = submittedData?.selectedPart ? parseTensileData(submittedData.selectedPart.tensile || '') : { tensileStrength: '', yieldStrength: '', elongation: '', impactCold: '', impactRoom: '' };
  const microData = submittedData?.selectedPart ? parseMicrostructureData(submittedData.selectedPart.micro_structure || '') : { nodularity: '', pearlite: '', carbide: '' };
  const hardnessData = submittedData?.selectedPart ? parseHardnessData(submittedData.selectedPart.hardness || '') : { surface: '', core: '' };

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", border: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white, mb: 3 }}>
      <Box sx={{ p: 3, borderBottom: `3px solid ${SAKTHI_COLORS.primary}`, background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, color: SAKTHI_COLORS.white }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Pattern Code</Typography>
            <TextField fullWidth value={submittedData?.selectedPattern?.pattern_code || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.white } }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Part Name</Typography>
            <TextField fullWidth value={submittedData?.selectedPart?.part_name || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.white } }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>TRIAL No</Typography>
            <TextField fullWidth value={submittedData?.trialNo || ''} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.white } }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Chip label="Submitted Sample Card Data (Read Only)" sx={{ bgcolor: SAKTHI_COLORS.success + '20', color: SAKTHI_COLORS.darkGray, border: `1px dashed ${SAKTHI_COLORS.success}`, fontWeight: 600, py: 2 }} />
      </Box>

      <Box sx={{ p: 3 }}>
        {/* condensed metallurgical spec render */}
        <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, mb: 3 }}>
          <Box sx={{ bgcolor: SAKTHI_COLORS.accent, p: 1.5, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 800, color: SAKTHI_COLORS.white }}>METALLURGICAL SPECIFICATION</Typography>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ bgcolor: 'red', fontWeight: 700 }}>Chemical Composition</TableCell>
                <TableCell colSpan={3} align="center" sx={{ bgcolor: 'red', fontWeight: 700 }}>Microstructure</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>C%</TableCell><TableCell>Si%</TableCell><TableCell>Mn%</TableCell><TableCell>P%</TableCell><TableCell>S%</TableCell><TableCell>Mg%</TableCell><TableCell>Cr%</TableCell><TableCell>Cu%</TableCell>
                <TableCell>Nodularity%</TableCell><TableCell>Pearlite%</TableCell><TableCell>Carbide%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell><TextField fullWidth value={chemicalData.c || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.si || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.mn || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.p || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.s || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.mg || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.cr || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={chemicalData.cu || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>

                <TableCell><TextField fullWidth value={microData.nodularity} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={microData.pearlite} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={microData.carbide} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Mechanical summary */}
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ bgcolor: 'red', fontWeight: 700 }}>Mechanical Properties</TableCell>
                <TableCell colSpan={4} align="center" sx={{ bgcolor: 'red', fontWeight: 700 }}>NDT Inspection</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tensile (Min)</TableCell><TableCell>Yield (Min)</TableCell><TableCell>Elongation%</TableCell><TableCell>Impact Cold</TableCell><TableCell>Impact Room</TableCell>
                <TableCell colSpan={2}>Hardness: Surface / Core</TableCell><TableCell>X-Ray</TableCell><TableCell>MPI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell><TextField fullWidth value={tensileData.tensileStrength} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={tensileData.yieldStrength} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={tensileData.elongation} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={hardnessData.surface} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={hardnessData.core} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={submittedData?.selectedPart?.xray || ""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={""} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        {/* Date/moulds/machine table */}
        <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date of Sampling</TableCell>
                <TableCell>No. of Moulds</TableCell>
                <TableCell>DISA / FOUNDRY-A</TableCell>
                <TableCell>Reason For Sampling</TableCell>
                <TableCell>Sample Traceability</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell><TextField fullWidth value={submittedData?.samplingDate} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={submittedData?.mouldCount} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={submittedData?.machine} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={submittedData?.reason} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
                <TableCell><TextField fullWidth value={submittedData?.sampleTraceability} size="small" InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }} /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Paper>
  );
};

/* -------------------------
 Main Moulding Table Component
 ------------------------- */
const MouldingTable: React.FC<MouldingTableProps> = ({
  submittedData,
  onSave,
  onComplete,
}) => {
  // ref points to the entire content we want to export (sample card + moulding)
  const printRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<MouldingData>({
    mouldThickness: "",
    compressability: "",
    squeezePressure: "",
    mouldHardness: "",
    userName: "",
    otherRemarks: "",
    type: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submittedMouldData, setSubmittedMouldData] = useState<MouldingData | null>(null);
  const [exporting, setExporting] = useState(false);

  const [sending, setSending] = useState(false); // network sending state

  // When true we display MetallurgicalInspection in the same route
  const [showInspection, setShowInspection] = useState(false);

  const setField = useCallback((key: keyof MouldingData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allFilled = Object.values(data).every((v) => v.toString().trim() !== "");

  // POST to backend (http://localhost:3000/api/moulding)
  const sendToServer = useCallback(async (payload: { moulding: MouldingData; submittedData?: SubmittedData }) => {
    const BACKEND = 'http://localhost:3000';
    const url = `${BACKEND}/api/moulding`;

    try {
      setSending(true);
      console.log('Sending moulding payload to:', url, payload);
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post(url, payload, {
        headers,
        timeout: 10000,
      });

      console.log('Moulding save response:', res?.status, res?.data);
      if (!res || res.status < 200 || res.status >= 300) {
        throw new Error(res?.data?.message || `Server responded with ${res?.status}`);
      }
      return res.data;
    } catch (err: any) {
      console.error('Moulding submit failed:', err?.response?.data || err.message || err);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  // Updated save handler — validate, send, then set submitted state on success
  const handleSave = useCallback(async () => {
    if (!allFilled) {
      alert('Please fill all moulding fields before submitting.');
      return;
    }

    onSave && onSave(data);

    const payload = {
      moulding: data,
      submittedData: submittedData ?? undefined,
    };

    try {
      const result = await sendToServer(payload);

      setSubmittedMouldData(data);
      setSubmitted(true);

      if (result?.insertedRow) {
        console.log('Inserted row from server:', result.insertedRow);
      }

      // --- CHANGED: show inspection component in the same route
      setShowInspection(true);

    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to submit moulding data. See console.');
    } finally {
      setSending(false);
    }
  }, [allFilled, data, onSave, sendToServer, submittedData]);

  const handleCompleteProcess = useCallback(() => {
    onComplete && onComplete();
  }, [onComplete]);

  const handleBackToEdit = useCallback(() => {
    setSubmitted(false);
  }, []);

  // ---------- PDF Export ----------
  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) {
      alert("Nothing to export");
      return;
    }

    try {
      setExporting(true);

      // bring into view before capture
      const originalScrollY = window.scrollY;
      el.scrollIntoView({ behavior: "auto", block: "center" });

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });

      window.scrollTo(0, originalScrollY);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      const scale = (pageWidth - margin * 2) / canvas.width;
      const imgHeight = canvas.height * scale;
      const imgWidth = canvas.width * scale;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      } else {
        const totalPages = Math.ceil(imgHeight / (pageHeight - margin * 2));
        const sliceHeightPx = Math.floor((pageHeight - margin * 2) / scale);

        for (let page = 0; page < totalPages; page++) {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          const remainingPx = canvas.height - page * sliceHeightPx;
          pageCanvas.height = remainingPx < sliceHeightPx ? remainingPx : sliceHeightPx;

          const ctx = pageCanvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

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

          const pageData = pageCanvas.toDataURL("image/png");
          const pageImgHeight = pageCanvas.height * scale;

          if (page > 0) pdf.addPage();
          pdf.addImage(pageData, "PNG", margin, margin, imgWidth, pageImgHeight);
        }
      }

      const safeName = (submittedMouldData?.type || "moulding_data").replace(/\s+/g, "_");
      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error("Export PDF failed:", err);
      alert("Failed to export PDF. See console for details.");
    } finally {
      setExporting(false);
    }
  };

  // ---------------------------
  // If showInspection is true, render MetallurgicalInspection in-place
  // ---------------------------
  if (showInspection) {
    return <MetallurgicalInspection />;
  }

  // ======= SUBMITTED VIEW =======
  if (submitted) {
    return (
      <Box ref={printRef} sx={{ p: 3 }}>
        {submittedData && <SubmittedSampleCard submittedData={submittedData} />}

        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mb: 3, bgcolor: SAKTHI_COLORS.success + '10', border: `2px solid ${SAKTHI_COLORS.success}` }}>
          <Alert severity="success" sx={{ mb: 3 }}>✅ Moulding Data Submitted Successfully!</Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={handleBackToEdit} sx={{ minWidth: 140 }}>Back to Edit</Button>

            <Button variant="contained" onClick={handleCompleteProcess} sx={{ minWidth: 160, background: `linear-gradient(135deg, ${SAKTHI_COLORS.success} 0%, ${SAKTHI_COLORS.primary} 100%)`, fontWeight: 700 }}>
              Complete Process
            </Button>

            <Button variant="outlined" onClick={handleExportPDF} disabled={exporting} startIcon={exporting ? <CircularProgress size={16} /> : undefined} sx={{ minWidth: 160 }}>
              {exporting ? "Generating..." : "Export as PDF"}
            </Button>
          </Box>
        </Paper>

        {/* Submitted Moulding Data (read-only) */}
        <Paper elevation={3} sx={{ p: 2, bgcolor: "#c8d4f0", border: "2px solid black", mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ textDecoration: "underline", mb: 1 }}>MOULDING (Submitted):</Typography>

          <Table size="small" sx={{ border: "2px solid black" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ border: "2px solid black", bgcolor: "white", color: "red", fontWeight: "bold" }}>MOULDING</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Mould Thickness</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Compressability</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Squeeze Pressure</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Mould Hardness</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>User Name</TableCell>
                <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Other Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ border: "2px solid black", height: 60 }}>{submittedMouldData?.type || "--"}</TableCell>
                <TableCell sx={{ border: "2px solid black" }}>{submittedMouldData?.mouldThickness || "--"}</TableCell>
                <TableCell sx={{ border: "2px solid black" }}>{submittedMouldData?.compressability || "--"}</TableCell>
                <TableCell sx={{ border: "2px solid black" }}>{submittedMouldData?.squeezePressure || "--"}</TableCell>
                <TableCell sx={{ border: "2px solid black" }}>{submittedMouldData?.mouldHardness || "--"}</TableCell>
                <TableCell sx={{ border: "2px solid black" }}>{submittedMouldData?.userName || "--"}</TableCell>
                <TableCell sx={{ border: "2px solid black" }}>{submittedMouldData?.otherRemarks || "--"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Box sx={{ position: "relative", border: "2px solid black", borderTop: "none", height: 80, mt: -1 }}>
            <Chip label={`Type: ${submittedMouldData?.type || "--"}`} sx={{ position: "absolute", right: 140, top: 10, bgcolor: "yellow", border: "1px solid black" }} />
            <Chip label={`Username: ${submittedMouldData?.userName || "--"}`} sx={{ position: "absolute", right: 10, bottom: 10, bgcolor: "yellow", border: "1px solid black" }} />
          </Box>
        </Paper>
      </Box>
    );
  }

  // ======= EDITABLE VIEW =======
  return (
    <Box ref={printRef} sx={{ p: 3 }}>
      {submittedData && <SubmittedSampleCard submittedData={submittedData} />}

      <Paper elevation={3} sx={{ p: 2, bgcolor: "#c8d4f0", border: "2px solid black", mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ textDecoration: "underline", mb: 1 }}>MOULDING:</Typography>

        <Table size="small" sx={{ border: "2px solid black" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ border: '2px solid black', bgcolor: 'white', color: 'red', fontWeight: 'bold' }}>MOULDING</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Mould Thickness</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Compressability</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Squeeze Pressure</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Mould Hardness</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>User Name</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>Other Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ border: "2px solid black", height: 60, p: 0.5 }}>
                <TextField fullWidth size="small" value={data.type} onChange={(e) => setField("type", e.target.value)} placeholder="Enter type" InputProps={{ sx: { bgcolor: "white" } }} />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField fullWidth size="small" value={data.mouldThickness} onChange={(e) => setField("mouldThickness", e.target.value)} placeholder="Enter thickness" InputProps={{ sx: { bgcolor: "white" } }} />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField fullWidth size="small" value={data.compressability} onChange={(e) => setField("compressability", e.target.value)} placeholder="Enter compressability" InputProps={{ sx: { bgcolor: "white" } }} />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField fullWidth size="small" value={data.squeezePressure} onChange={(e) => setField("squeezePressure", e.target.value)} placeholder="Enter pressure" InputProps={{ sx: { bgcolor: "white" } }} />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField fullWidth size="small" value={data.mouldHardness} onChange={(e) => setField("mouldHardness", e.target.value)} placeholder="Enter hardness" InputProps={{ sx: { bgcolor: "white" } }} />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField fullWidth size="small" value={data.userName} onChange={(e) => setField("userName", e.target.value)} placeholder="Enter username" InputProps={{ sx: { bgcolor: "white" } }} />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField fullWidth size="small" value={data.otherRemarks} onChange={(e) => setField("otherRemarks", e.target.value)} placeholder="Enter remarks" multiline rows={2} InputProps={{ sx: { bgcolor: "white" } }} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ position: "relative", border: "2px solid black", borderTop: "none", height: 80, mt: -1, p: 1 }} />

        {/* Actions aligned center */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setData({
            mouldThickness: "",
            compressability: "",
            squeezePressure: "",
            mouldHardness: "",
            userName: "",
            otherRemarks: "",
            type: "",
          })}>
            Clear
          </Button>

          <Button variant="outlined" color="primary" onClick={handleExportPDF} disabled={exporting} startIcon={exporting ? <CircularProgress size={16} /> : undefined}>
            {exporting ? "Generating..." : "Export as PDF"}
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!allFilled || sending}
            startIcon={sending ? <CircularProgress size={16} /> : undefined}
          >
            {sending ? "Submitting..." : "Submit Moulding Data"}
          </Button>
        </Box>
      </Paper>

      {allFilled && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Moulding data is ready to be submitted. Click "Submit Moulding Data" to proceed.
        </Alert>
      )}
    </Box>
  );
};

export default MouldingTable;