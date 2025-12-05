// src/components/moulding.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
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
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Import the inspection component so we can render it in-place after submit
import MetallurgicalInspection from "./MetallurgicalInspection";

// Colors
const SAKTHI_COLORS = {
  primary: "#2950bbff",
  secondary: "#DC2626",
  accent: "#F59E0B",
  background: "#F8FAFC",
  lightBlue: "#3B82F6",
  darkGray: "#374151",
  lightGray: "#E5E7EB",
  white: "#FFFFFF",
  success: "#10B981",
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

interface MouldingPreviewPayload {
  moulding: MouldingData;
  submittedData?: SubmittedData;
}

/* -------------------------
 Simple parsers (kept concise)
 ------------------------- */
const parseTensileData = (tensile: string) => {
  const lines = tensile ? tensile.split("\n") : [];
  let tensileStrength = "";
  let yieldStrength = "";
  let elongation = "";
  lines.forEach((line) => {
    const cleanLine = line.trim();
    if (
      !tensileStrength &&
      (cleanLine.match(/\d+\s*(MPa|N\/mm²|Mpa|Kgf\/mm²)/) ||
        cleanLine.includes("Tensile Strength"))
    ) {
      const m = cleanLine.match(/(\d+)/);
      if (m) tensileStrength = m[1];
    }
    if (!yieldStrength && cleanLine.includes("Yield")) {
      const m = cleanLine.match(/(\d+)/);
      if (m) yieldStrength = m[1];
    }
    if (!elongation && (cleanLine.includes("Elongation") || cleanLine.includes("%"))) {
      const m = cleanLine.match(/(\d+)/);
      if (m) elongation = m[1];
    }
  });
  return { tensileStrength, yieldStrength, elongation, impactCold: "", impactRoom: "" };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure ? microstructure.split("\n") : [];
  let nodularity = "";
  let pearlite = "";
  let carbide = "";
  lines.forEach((line) => {
    const cleanLine = line.toLowerCase();
    if (!nodularity && cleanLine.includes("nodularity")) {
      const m = cleanLine.match(/(\d+)/);
      if (m) nodularity = m[1];
    }
    if (!pearlite && cleanLine.includes("pearlite")) {
      const m = cleanLine.match(/(\d+)/);
      if (m) pearlite = m[1];
    }
    if (!carbide && (cleanLine.includes("carbide") || cleanLine.includes("cementite"))) {
      const m = cleanLine.match(/(\d+)/);
      if (m) carbide = m[1];
    }
  });
  return { nodularity: nodularity || "--", pearlite: pearlite || "--", carbide: carbide || "--" };
};

const parseHardnessData = (hardness: string) => {
  const lines = hardness ? hardness.split("\n") : [];
  let surface = "";
  let core = "";
  lines.forEach((line) => {
    const cleanLine = line.toLowerCase();
    if (cleanLine.includes("surface") && !surface) {
      const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (m) surface = m[1];
    } else if (cleanLine.includes("core") && !core) {
      const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (m) core = m[1];
    } else if (!surface) {
      const m = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (m) surface = m[1];
    }
  });
  return { surface: surface || "--", core: core || "--" };
};

/* -------------------------
 SubmittedSampleCard (read-only view) with Apple glass effect
 ------------------------- */
const SubmittedSampleCard: React.FC<{ submittedData: SubmittedData }> = ({ submittedData }) => {
  const chemicalData = submittedData?.selectedPart
    ? submittedData.selectedPart.chemical_composition || {
        c: "",
        si: "",
        mn: "",
        p: "",
        s: "",
        mg: "",
        cr: "",
        cu: "",
      }
    : { c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: "" };

  const tensileData = submittedData?.selectedPart
    ? parseTensileData(submittedData.selectedPart.tensile || "")
    : { tensileStrength: "", yieldStrength: "", elongation: "", impactCold: "", impactRoom: "" };

  const microData = submittedData?.selectedPart
    ? parseMicrostructureData(submittedData.selectedPart.micro_structure || "")
    : { nodularity: "", pearlite: "", carbide: "" };

  const hardnessData = submittedData?.selectedPart
    ? parseHardnessData(submittedData.selectedPart.hardness || "")
    : { surface: "", core: "" };

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        mb: 3,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.45)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(148,163,184,0.18))",
        backdropFilter: "blur(24px)",
        boxShadow: "0 24px 80px rgba(15,23,42,0.65)",
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid rgba(148,163,184,0.55)",
          background: "linear-gradient(135deg, rgba(15,23,42,0.75), rgba(30,64,175,0.90))",
          color: SAKTHI_COLORS.white,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>
              Pattern Code
            </Typography>
            <TextField
              fullWidth
              value={submittedData?.selectedPattern?.pattern_code || ""}
              size="small"
              InputProps={{
                readOnly: true,
                sx: {
                  bgcolor: "rgba(248,250,252,0.98)",
                  borderRadius: 2,
                  color: SAKTHI_COLORS.darkGray,
                  fontWeight: 600,
                },
              }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>
              Part Name
            </Typography>
            <TextField
              fullWidth
              value={submittedData?.selectedPart?.part_name || ""}
              size="small"
              InputProps={{
                readOnly: true,
                sx: {
                  bgcolor: "rgba(248,250,252,0.98)",
                  borderRadius: 2,
                  color: SAKTHI_COLORS.darkGray,
                  fontWeight: 600,
                },
              }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>
              TRIAL No
            </Typography>
            <TextField
              fullWidth
              value={submittedData?.trialNo || ""}
              size="small"
              InputProps={{
                readOnly: true,
                sx: {
                  bgcolor: "rgba(248,250,252,0.98)",
                  borderRadius: 2,
                  color: SAKTHI_COLORS.darkGray,
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Chip
          label="Submitted Sample Card Data (Read Only)"
          sx={{
            bgcolor: "rgba(22,163,74,0.12)",
            color: SAKTHI_COLORS.darkGray,
            border: "1px dashed rgba(16,185,129,0.7)",
            fontWeight: 600,
            py: 2,
          }}
        />
      </Box>

      <Box sx={{ p: 3 }}>
        {/* METALLURGICAL SPECIFICATION */}
        <Paper
          variant="outlined"
          sx={{
            border: `1px solid rgba(30,64,175,0.4)`,
            mb: 3,
            background: "rgba(248,250,252,0.9)",
          }}
        >
          <Box sx={{ bgcolor: SAKTHI_COLORS.accent, p: 1.5, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 800, color: SAKTHI_COLORS.white }}>
              METALLURGICAL SPECIFICATION
            </Typography>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ bgcolor: "#7f1d1d", fontWeight: 700, color: "#F9FAFB" }}
                >
                  Chemical Composition
                </TableCell>
                <TableCell
                  colSpan={3}
                  align="center"
                  sx={{ bgcolor: "#7f1d1d", fontWeight: 700, color: "#F9FAFB" }}
                >
                  Microstructure
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>C%</TableCell>
                <TableCell>Si%</TableCell>
                <TableCell>Mn%</TableCell>
                <TableCell>P%</TableCell>
                <TableCell>S%</TableCell>
                <TableCell>Mg%</TableCell>
                <TableCell>Cr%</TableCell>
                <TableCell>Cu%</TableCell>
                <TableCell>Nodularity%</TableCell>
                <TableCell>Pearlite%</TableCell>
                <TableCell>Carbide%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <TextField
                    fullWidth
                    value={chemicalData.c || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={chemicalData.si || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={chemicalData.mn || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={chemicalData.p || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={chemicalData.s || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={chemicalData.mg || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={chemicalData.cr || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={chemicalData.cu || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    fullWidth
                    value={microData.nodularity}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={microData.pearlite}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={microData.carbide}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Mechanical summary */}
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{ bgcolor: "#7f1d1d", fontWeight: 700, color: "#F9FAFB" }}
                >
                  Mechanical Properties
                </TableCell>
                <TableCell
                  colSpan={4}
                  align="center"
                  sx={{ bgcolor: "#7f1d1d", fontWeight: 700, color: "#F9FAFB" }}
                >
                  NDT Inspection
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tensile (Min)</TableCell>
                <TableCell>Yield (Min)</TableCell>
                <TableCell>Elongation%</TableCell>
                <TableCell>Impact Cold</TableCell>
                <TableCell>Impact Room</TableCell>
                <TableCell colSpan={2}>Hardness: Surface / Core</TableCell>
                <TableCell>X-Ray</TableCell>
                <TableCell>MPI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <TextField
                    fullWidth
                    value={tensileData.tensileStrength}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={tensileData.yieldStrength}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={tensileData.elongation}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={hardnessData.surface}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={hardnessData.core}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={submittedData?.selectedPart?.xray || ""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={""}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        {/* Date/moulds/machine table */}
        <Paper
          variant="outlined"
          sx={{
            border: `1px solid rgba(30,64,175,0.4)`,
            overflow: "auto",
            mb: 3,
            background: "rgba(248,250,252,0.9)",
          }}
        >
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
                <TableCell>
                  <TextField
                    fullWidth
                    value={submittedData?.samplingDate}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={submittedData?.mouldCount}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={submittedData?.machine}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={submittedData?.reason}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={submittedData?.sampleTraceability}
                    size="small"
                    InputProps={{ readOnly: true, sx: { bgcolor: SAKTHI_COLORS.background } }}
                  />
                </TableCell>
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
  const navigate = useNavigate();

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

  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false); // network sending state

  // When true we display MetallurgicalInspection in the same route
  const [showInspection, setShowInspection] = useState(false);

  // Preview overlay state (Apple glass, like VisualInspection)
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<MouldingPreviewPayload | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false); // final save done
  const [message, setMessage] = useState<string | null>(null);

  const setField = useCallback((key: keyof MouldingData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allFilled = Object.values(data).every((v) => v.toString().trim() !== "");

  const handleCloseToDashboard = () => {
    navigate("/dashboard");
  };

  const TopRightClose: React.FC = () => (
    <IconButton
      aria-label="Close"
      onClick={handleCloseToDashboard}
      sx={{
        position: "absolute",
        top: 16,
        right: 16,
        bgcolor: "rgba(15,23,42,0.85)",
        color: "#fff",
        "&:hover": { bgcolor: "rgba(15,23,42,1)" },
        zIndex: 10,
      }}
      size="small"
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  // auto-hide messages
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // POST to backend (http://localhost:3000/api/moulding)
  const sendToServer = useCallback(
    async (payload: { moulding: MouldingData; submittedData?: SubmittedData }) => {
      const BACKEND = "http://localhost:3000";
      const url = `${BACKEND}/api/moulding`;

      try {
        setSending(true);
        console.log("Sending moulding payload to:", url, payload);
        const token = localStorage.getItem("token");
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await axios.post(url, payload, {
          headers,
          timeout: 10000,
        });

        console.log("Moulding save response:", res?.status, res?.data);
        if (!res || res.status < 200 || res.status >= 300) {
          throw new Error(res?.data?.message || `Server responded with ${res?.status}`);
        }
        return res.data;
      } catch (err: any) {
        console.error("Moulding submit failed:", err?.response?.data || err.message || err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    []
  );

  // ---------- Save & Continue -> open Apple glass preview ----------
  const handleSaveAndContinue = useCallback(() => {
    if (!allFilled) {
      alert("Please fill all moulding fields before submitting.");
      return;
    }

    onSave && onSave(data);

    const payload: MouldingPreviewPayload = {
      moulding: { ...data },
      submittedData: submittedData ?? undefined,
    };

    setPreviewPayload(payload);
    setPreviewMode(true);
    setPreviewSubmitted(false);
    setMessage(null);
  }, [allFilled, data, onSave, submittedData]);

  // ---------- Final Save from preview ----------
  const handleFinalSave = useCallback(async () => {
    if (!previewPayload) return;

    try {
      setMessage(null);
      const result = await sendToServer(previewPayload);

      if (result?.insertedRow) {
        console.log("Inserted row from server:", result.insertedRow);
      }

      setPreviewSubmitted(true);
      setMessage("Moulding data submitted successfully.");
    } catch (err: any) {
      console.error("Moulding preview final save error", err);
      setMessage(err?.message || "Failed to submit moulding data");
    }
  }, [previewPayload, sendToServer]);

  const handleCompleteProcess = useCallback(() => {
    onComplete && onComplete();
  }, [onComplete]);

  // ---------- PDF Export (black & white, preview in new tab) ----------
  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) {
      alert("Nothing to export");
      return;
    }

    try {
      setExporting(true);

      const originalScrollY = window.scrollY;
      el.scrollIntoView({ behavior: "auto", block: "center" });

      const sourceCanvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });

      window.scrollTo(0, originalScrollY);

      // Convert to black & white (grayscale)
      const bwCanvas = document.createElement("canvas");
      bwCanvas.width = sourceCanvas.width;
      bwCanvas.height = sourceCanvas.height;
      const bwCtx = bwCanvas.getContext("2d");
      if (!bwCtx) throw new Error("Could not get BW canvas context");

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

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      const scale = (pageWidth - margin * 2) / canvas.width;
      const imgHeight = canvas.height * scale;
      const imgWidth = canvas.width * scale;

      if (imgHeight <= pageHeight - margin * 2) {
        const imgData = canvas.toDataURL("image/png");
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

      // Open preview instead of direct download
      const pdfBlobUrl = pdf.output("bloburl");
      window.open(pdfBlobUrl, "_blank");
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
    return (
      <Box sx={{ p: 3, position: "relative" }}>
        <TopRightClose />
        <MetallurgicalInspection />
      </Box>
    );
  }

  // ======= EDITABLE VIEW (main data entering page) =======
  return (
    <Box ref={printRef} sx={{ p: 3, position: "relative" }}>
      <TopRightClose />
      {submittedData && <SubmittedSampleCard submittedData={submittedData} />}

      <Paper elevation={3} sx={{ p: 2, bgcolor: "#c8d4f0", border: "2px solid black", mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ textDecoration: "underline", mb: 1 }}>
          MOULDING:
        </Typography>

        <Table size="small" sx={{ border: "2px solid black" }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ border: "2px solid black", bgcolor: "white", color: "red", fontWeight: "bold" }}
              >
                MOULDING
              </TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>
                Mould Thickness
              </TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>
                Compressability
              </TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>
                Squeeze Pressure
              </TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>
                Mould Hardness
              </TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>User Name</TableCell>
              <TableCell sx={{ border: "2px solid black", fontWeight: "bold" }}>
                Other Remarks
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ border: "2px solid black", height: 60, p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.type}
                  onChange={(e) => setField("type", e.target.value)}
                  placeholder="Enter type"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.mouldThickness}
                  onChange={(e) => setField("mouldThickness", e.target.value)}
                  placeholder="Enter thickness"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.compressability}
                  onChange={(e) => setField("compressability", e.target.value)}
                  placeholder="Enter compressability"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.squeezePressure}
                  onChange={(e) => setField("squeezePressure", e.target.value)}
                  placeholder="Enter pressure"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.mouldHardness}
                  onChange={(e) => setField("mouldHardness", e.target.value)}
                  placeholder="Enter hardness"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.userName}
                  onChange={(e) => setField("userName", e.target.value)}
                  placeholder="Enter username"
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
              <TableCell sx={{ border: "2px solid black", p: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={data.otherRemarks}
                  onChange={(e) => setField("otherRemarks", e.target.value)}
                  placeholder="Enter remarks"
                  multiline
                  rows={2}
                  InputProps={{ sx: { bgcolor: "white" } }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box
          sx={{ position: "relative", border: "2px solid black", borderTop: "none", height: 80, mt: -1, p: 1 }}
        />

        {/* Actions aligned center */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() =>
              setData({
                mouldThickness: "",
                compressability: "",
                squeezePressure: "",
                mouldHardness: "",
                userName: "",
                otherRemarks: "",
                type: "",
              })
            }
          >
            Clear
          </Button>

          {/* Only Submit & Continue button (no Export PDF here) */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveAndContinue}
            disabled={!allFilled || sending}
            startIcon={sending ? <CircularProgress size={16} /> : undefined}
          >
            {sending ? "Submitting..." : "Submit & Continue"}
          </Button>
        </Box>
      </Paper>

      {allFilled && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Moulding data is ready. Click "Submit & Continue" to open preview.
        </Alert>
      )}

      {/* ---------- Apple-style Liquid Glass preview overlay (like VisualInspection) ---------- */}
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
              background: "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(248,250,252,0.9))",
              boxShadow: "0 25px 80px rgba(15,23,42,0.45)",
              border: "1px solid rgba(255,255,255,0.8)",
              position: "relative",
            }}
          >
            {/* Red Cross close button on top-right */}
            <IconButton
              onClick={() => {
                if (previewSubmitted) {
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

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} pr={5}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Moulding – Preview
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Review your data before final submission
                </Typography>
              </Box>
            </Box>

            {/* Glassy sample card preview */}
            {previewPayload.submittedData && (
              <Box mb={3}>
                <SubmittedSampleCard submittedData={previewPayload.submittedData} />
              </Box>
            )}

            {/* Moulding data preview table */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                mb: 2,
                background: "rgba(248,250,252,0.95)",
                border: "1px solid rgba(148,163,184,0.6)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Moulding Data
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Mould Thickness</TableCell>
                    <TableCell>Compressability</TableCell>
                    <TableCell>Squeeze Pressure</TableCell>
                    <TableCell>Mould Hardness</TableCell>
                    <TableCell>User Name</TableCell>
                    <TableCell>Other Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{previewPayload.moulding.type || "--"}</TableCell>
                    <TableCell>{previewPayload.moulding.mouldThickness || "--"}</TableCell>
                    <TableCell>{previewPayload.moulding.compressability || "--"}</TableCell>
                    <TableCell>{previewPayload.moulding.squeezePressure || "--"}</TableCell>
                    <TableCell>{previewPayload.moulding.mouldHardness || "--"}</TableCell>
                    <TableCell>{previewPayload.moulding.userName || "--"}</TableCell>
                    <TableCell>{previewPayload.moulding.otherRemarks || "--"}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            {message && (
              <Box mt={1}>
                <Alert severity={previewSubmitted ? "success" : "info"} sx={{ borderRadius: 3 }}>
                  {message}
                </Alert>
              </Box>
            )}

            {/* Actions in preview */}
            <Box mt={3} display="flex" alignItems="center" gap={2}>
              {/* Edit button: disabled after Save */}
              <Button
                variant="outlined"
                onClick={() => setPreviewMode(false)}
                disabled={sending || previewSubmitted}
              >
                Edit
              </Button>

              <Button
                variant="contained"
                onClick={handleExportPDF}
                disabled={exporting}
                sx={{ backgroundColor: SAKTHI_COLORS.primary }}
              >
                {exporting ? "Generating PDF..." : "Export PDF"}
              </Button>

              <Button
                variant="contained"
                onClick={handleFinalSave}
                disabled={sending || previewSubmitted}
                sx={{ backgroundColor: SAKTHI_COLORS.accent }}
              >
                {sending ? "Saving..." : previewSubmitted ? "Saved" : "Save"}
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setPreviewMode(false);
                  setShowInspection(true);
                  handleCompleteProcess();
                }}
                disabled={!previewSubmitted}
                sx={{ backgroundColor: SAKTHI_COLORS.success }}
              >
                Continue
              </Button>

              <Box sx={{ flex: 1 }} />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MouldingTable;