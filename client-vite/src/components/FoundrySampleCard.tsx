import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
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
  Chip,
  ThemeProvider,
  createTheme,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import PouringDetailsTable from "./PouringDetailsTable";
import type { PouringDetails } from "./PouringDetailsTable";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CloseIcon from "@mui/icons-material/Close";

/* ---------------- Colors + Theme ---------------- */

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

const theme = createTheme({
  palette: {
    primary: { main: SAKTHI_COLORS.primary },
    secondary: { main: SAKTHI_COLORS.secondary },
    background: { default: SAKTHI_COLORS.background },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: SAKTHI_COLORS.lightBlue,
          color: SAKTHI_COLORS.white,
          borderRight: `1px solid ${SAKTHI_COLORS.lightGray}`,
          padding: "12px 8px",
        },
        body: {
          backgroundColor: SAKTHI_COLORS.white,
          borderRight: `1px solid ${SAKTHI_COLORS.lightGray}`,
          padding: "8px",
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
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

/* ---------------- Types ---------------- */

interface PartData {
  id: number;
  pattern_code: string;
  part_name: string;
  material_grade: string;
  chemical_composition: any;
  micro_structure: string;
  tensile: string;
  impact: string;
  hardness: string;
  xray: string;
  created_at: string;
}

interface MouldCorrection {
  id: number;
  compressibility: string;
  squeezePressure: string;
  fillerSize: string;
}

/* ---------------- Error Boundary ---------------- */

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Something went wrong</Typography>
            <Typography variant="body2">
              {this.state.error?.message}
            </Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

/* ---------------- Parsing Helpers ---------------- */

const parseChemicalComposition = (composition: any) => {
  const blank = {
    c: "",
    si: "",
    mn: "",
    p: "",
    s: "",
    mg: "",
    cr: "",
    cu: "",
  };
  if (!composition) return blank;

  let obj: any = composition;

  if (typeof composition === "string") {
    try {
      obj = JSON.parse(composition);
    } catch (e) {
      console.warn(
        "chemical_composition is string and JSON.parse failed, using raw string as C",
        e
      );
      return { ...blank, c: composition };
    }
  }

  if (typeof obj !== "object" || obj === null) return blank;

  const map: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (typeof k === "string") {
      map[k.toLowerCase().replace(/\s+/g, "")] = obj[k];
    }
  });

  const siKeyCandidates = ["si", "silicon"];
  const getFirst = (keys: string[]) => {
    for (const k of keys) {
      if (map[k] !== undefined && map[k] !== null) return String(map[k]);
    }
    return "";
  };

  return {
    c: getFirst(["c"]),
    si: getFirst(siKeyCandidates),
    mn: getFirst(["mn"]),
    p: getFirst(["p"]),
    s: getFirst(["s"]),
    mg: getFirst(["mg"]),
    cr: getFirst(["cr"]),
    cu: getFirst(["cu"]),
  };
};

const parseTensileData = (tensile: string) => {
  const lines = tensile ? tensile.split("\n") : [];
  let tensileStrength = "";
  let yieldStrength = "";
  let elongation = "";
  let impactCold = "";
  let impactRoom = "";

  lines.forEach((line) => {
    const cleanLine = line.trim();

    if (
      cleanLine.match(/\d+\s*(MPa|N\/mm²|Mpa|Kgf\/mm²)/) ||
      cleanLine.includes("Tensile Strength") ||
      cleanLine.match(/[≥>]\s*\d+/)
    ) {
      if (cleanLine.includes("≥")) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !tensileStrength)
          tensileStrength = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes(">")) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !tensileStrength)
          tensileStrength = `>${numberMatch[1]}`;
      } else if (cleanLine.includes("Min")) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !tensileStrength)
          tensileStrength = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !tensileStrength)
          tensileStrength = numberMatch[1];
      }
    }

    if (cleanLine.includes("Yield Strength") || cleanLine.includes("Yield")) {
      if (cleanLine.includes("≥")) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes(">")) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `>${numberMatch[1]}`;
      } else if (cleanLine.includes("Min")) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = numberMatch[1];
      }
    }

    if (
      cleanLine.includes("Elongation") ||
      cleanLine.includes("%") ||
      cleanLine.match(/[≥>]\s*\d+\s*%/)
    ) {
      if (cleanLine.includes("≥")) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !elongation) elongation = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes(">")) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !elongation) elongation = `>${numberMatch[1]}`;
      } else if (cleanLine.includes("Min")) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !elongation) elongation = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !elongation) elongation = numberMatch[1];
      }
    }
  });

  return { tensileStrength, yieldStrength, elongation, impactCold, impactRoom };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure ? microstructure.split("\n") : [];
  let nodularity = "";
  let pearlite = "";
  let carbide = "";

  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();

    if (cleanLine.includes("nodularity")) {
      if (cleanLine.includes("≥")) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) nodularity = `≥${match[1]}`;
      } else if (cleanLine.includes("≤")) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) nodularity = `≤${match[1]}`;
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) nodularity = match[1];
      }
    }

    if (cleanLine.includes("pearlite")) {
      if (cleanLine.includes("≥")) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) pearlite = `≥${match[1]}`;
      } else if (cleanLine.includes("≤")) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) pearlite = `≤${match[1]}`;
      } else if (cleanLine.includes("<")) {
        const match = cleanLine.match(/<\s*(\d+)/);
        if (match) pearlite = `<${match[1]}`;
      } else if (cleanLine.includes(">")) {
        const match = cleanLine.match(/>\s*(\d+)/);
        if (match) pearlite = `>${match[1]}`;
      } else if (cleanLine.includes("max")) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = `≤${match[1]}`;
      } else if (cleanLine.includes("min")) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = `≥${match[1]}`;
      } else if (cleanLine.match(/\d+\s*-\s*\d+/)) {
        const match = cleanLine.match(/(\d+\s*-\s*\d+)/);
        if (match) pearlite = match[1];
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = match[1];
      }
    }

    if (cleanLine.includes("carbide") || cleanLine.includes("cementite")) {
      if (cleanLine.includes("≤")) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) carbide = `≤${match[1]}`;
      } else if (cleanLine.includes("<")) {
        const match = cleanLine.match(/<\s*(\d+)/);
        if (match) carbide = `<${match[1]}`;
      } else if (cleanLine.includes("≥")) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) carbide = `≥${match[1]}`;
      } else if (cleanLine.includes(">")) {
        const match = cleanLine.match(/>\s*(\d+)/);
        if (match) carbide = `>${match[1]}`;
      } else if (cleanLine.includes("max")) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = `≤${match[1]}`;
      } else if (cleanLine.includes("min")) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = `≥${match[1]}`;
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = match[1];
      }
    }
  });

  return {
    nodularity: nodularity || "--",
    pearlite: pearlite || "--",
    carbide: carbide || "--",
  };
};

const parseHardnessData = (hardness: string) => {
  const lines = hardness ? hardness.split("\n") : [];
  let surface = "";
  let core = "";

  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();

    if (cleanLine.includes("surface")) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) surface = match[1];
    } else if (cleanLine.includes("core")) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) core = match[1];
    } else if (!surface) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) surface = match[1];
    }
  });

  return { surface: surface || "--", core: core || "--" };
};

/* ---------------- Main Component ---------------- */

function FoundrySampleCard() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement | null>(null);

  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PartData | null>(
    null
  );
  const [trialNo, setTrialNo] = useState<string>("");
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  // metallurgical editable state
  const [chemState, setChemState] = useState({
    c: "",
    si: "",
    mn: "",
    p: "",
    s: "",
    mg: "",
    cr: "",
    cu: "",
  });
  const [tensileState, setTensileState] = useState({
    tensileStrength: "",
    yieldStrength: "",
    elongation: "",
    impactCold: "",
    impactRoom: "",
  });
  const [microState, setMicroState] = useState({
    nodularity: "",
    pearlite: "",
    carbide: "",
  });
  const [hardnessState, setHardnessState] = useState({
    surface: "",
    core: "",
  });

  // Pouring details state
  const [pouringDetails, setPouringDetails] = useState<PouringDetails>({
    date: "",
    heatCode: "",
    cComposition: "",
    siComposition: "",
    mnComposition: "",
    pComposition: "",
    sComposition: "",
    mgComposition: "",
    crComposition: "",
    cuComposition: "",
    pouringTempDegC: "",
    pouringTimeSec: "",
    ficHeatNo: "",
    ppCode: "",
    followedBy: "",
    userName: "",
  });

  const [currentView, setCurrentView] = useState<"form" | "pouring">("form");
  const [submittedData, setSubmittedData] = useState<any>(null);

  // whether metallurgical cells are editable
  const [editingOnlyMetallurgical, setEditingOnlyMetallurgical] =
    useState<boolean>(false);

  // preview states (like VisualInspection)
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  // IP state
  const [userIP, setUserIP] = useState<string>("");

  /* ------- preview message auto hide ------- */
  useEffect(() => {
    if (previewMessage) {
      const t = setTimeout(() => setPreviewMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [previewMessage]);

  /* ------- fetch IP once ------- */
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

  /* ------- pouring details handler ------- */
  const handlePouringDetailsChange = (details: PouringDetails) => {
    setPouringDetails(details);
  };

  /* ------- load master parts ------- */
  useEffect(() => {
    const getMasterParts = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/master-list");
        if (!response.ok) {
          throw new Error("Failed to fetch master list");
        }
        const res = await response.json();
        setMasterParts(res.data || []);
        setError(null);
      } catch (error) {
        console.error("Error loading master parts:", error);
        setError(
          "Failed to load master parts. Please check your connection."
        );
      } finally {
        setLoading(false);
      }
    };
    getMasterParts();
  }, []);

  /* ------- when part changes, init metallurgical spec ------- */
  useEffect(() => {
    if (selectedPart) {
      setSelectedPattern(selectedPart);
      const parsedChem = parseChemicalComposition(
        selectedPart.chemical_composition
      );
      setChemState(parsedChem);
      setTensileState(parseTensileData(selectedPart.tensile));
      setMicroState(parseMicrostructureData(selectedPart.micro_structure));
      setHardnessState(parseHardnessData(selectedPart.hardness));
    } else {
      setSelectedPattern(null);
    }
  }, [selectedPart]);

  /* ------- generate trial id (optional, backend commented) ------- */
  const generateTrialId = async (partName?: string) => {
    const name = partName || selectedPart?.part_name;
    if (!name) {
      setTrialNo("");
      setTrialError(null);
      return;
    }

    setTrialLoading(true);
    setTrialError(null);
    try {
      // call your backend here if you want
      // for now just simulate
      const fakeId = `TR-${Math.floor(Math.random() * 9000 + 1000)}`;
      setTrialNo(fakeId);
    } catch (err) {
      console.error("Error generating trial id:", err);
      setTrialError("Failed to generate trial number");
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPart) {
      setTrialNo("");
      setTrialError(null);
      return;
    }
    generateTrialId(selectedPart.part_name);
  }, [selectedPart]); // eslint-disable-line react-hooks/exhaustive-deps

  const chemicalData = chemState;
  const tensileData = tensileState;
  const microData = microState;
  const hardnessData = hardnessState;

  const handlePartChange = (newValue: PartData | null) => {
    setSelectedPart(newValue);
  };

  const handlePatternChange = (newValue: PartData | null) => {
    setSelectedPattern(newValue);
    if (newValue) {
      setSelectedPart(newValue);
    }
  };

  /* ------- submit to backend (kept, but NOT used by new Save) ------- */
  const submitToApi = async (payload: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:3000/api/trial-november", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(
            errorJson.message ||
            `Failed to submit trial data: ${response.status}`
          );
        } catch {
          throw new Error(
            `Failed to submit trial data: ${response.status} - ${errorText}`
          );
        }
      }

      const responseData = await response.json();

      const dataToSubmit = {
        selectedPart,
        selectedPattern,
        trialNo,
        chemical_composition: chemState,
        tensile: tensileState,
        micro_structure: microState,
        hardness: hardnessState,
        apiResponse: responseData,
      };

      setSubmittedData(dataToSubmit);
    } catch (err: any) {
      console.error("❌ Error submitting trial:", err);
      setError(err?.message || "Failed to submit trial data.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ------- Export PDF (VisualInspection-style: print dialog, NO direct download) ------- */
  const handleExportPDF = () => {
    if (!submitted) {
      alert('Please click Save before exporting.');
      return;
    }

    if (!previewPayload) {
      alert("Nothing to export");
      return;
    }

    const popup = window.open("", "_blank", "width=1000,height=800");
    if (!popup) {
      alert("Unable to open print window. Please disable popup blocker.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Foundry Sample Card Preview</title>
          <style>
            body {
              font-family: Inter, Roboto, Arial, sans-serif;
              margin: 20px;
              color: ${SAKTHI_COLORS.darkGray};
              background: #f3f4f6;
            }
            .glass {
              background: rgba(255,255,255,0.95);
              border-radius: 16px;
              padding: 24px;
              box-shadow: 0 18px 45px rgba(15,23,42,0.18);
              border: 1px solid rgba(229,231,235,0.9);
            }
            h2 {
              margin: 0 0 4px 0;
              font-size: 20px;
            }
            h3 {
              margin: 18px 0 8px 0;
              font-size: 16px;
            }
            .meta {
              margin-top: 8px;
              font-size: 12px;
            }
            .meta div {
              margin-bottom: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 6px 8px;
              text-align: center;
            }
            th {
              background: ${SAKTHI_COLORS.lightBlue};
              color: white;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <div class="glass">
            <h2>Foundry Sample Card</h2>
            <div class="meta">
              <div><strong>IP:</strong> ${userIP || ""}</div>
              <div><strong>Pattern Code:</strong> ${previewPayload.pattern_code || "--"}</div>
              <div><strong>Part Name:</strong> ${previewPayload.part_name || "--"}</div>
              <div><strong>TRIAL No:</strong> ${previewPayload.trial_no || "--"}</div>
              <div><strong>Created:</strong> ${new Date(previewPayload.created_at).toLocaleString()}</div>
            </div>

            <h3>Chemical Composition</h3>
            <table>
              <thead>
                <tr>
                  <th>C%</th>
                  <th>Si%</th>
                  <th>Mn%</th>
                  <th>P%</th>
                  <th>S%</th>
                  <th>Mg%</th>
                  <th>Cr%</th>
                  <th>Cu%</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${previewPayload.chemical_composition?.c || ""}</td>
                  <td>${previewPayload.chemical_composition?.si || ""}</td>
                  <td>${previewPayload.chemical_composition?.mn || ""}</td>
                  <td>${previewPayload.chemical_composition?.p || ""}</td>
                  <td>${previewPayload.chemical_composition?.s || ""}</td>
                  <td>${previewPayload.chemical_composition?.mg || ""}</td>
                  <td>${previewPayload.chemical_composition?.cr || ""}</td>
                  <td>${previewPayload.chemical_composition?.cu || ""}</td>
                </tr>
              </tbody>
            </table>

            <h3>Mechanical Properties & NDT</h3>
            <table>
              <thead>
                <tr>
                  <th>Tensile Strength</th>
                  <th>Yield Strength</th>
                  <th>Elongation%</th>
                  <th>Impact @ Cold</th>
                  <th>Impact @ Room</th>
                  <th>Hardness Surface</th>
                  <th>Hardness Core</th>
                  <th>X-Ray</th>
                  <th>MPI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${previewPayload.tensile?.tensileStrength || tensileState.tensileStrength || ""}</td>
                  <td>${previewPayload.tensile?.yieldStrength || tensileState.yieldStrength || ""}</td>
                  <td>${previewPayload.tensile?.elongation || tensileState.elongation || ""}</td>
                  <td>${previewPayload.tensile?.impactCold || tensileState.impactCold || ""}</td>
                  <td>${previewPayload.tensile?.impactRoom || tensileState.impactRoom || ""}</td>
                  <td>${previewPayload.hardness?.surface || hardnessState.surface || ""}</td>
                  <td>${previewPayload.hardness?.core || hardnessState.core || ""}</td>
                  <td>${selectedPart?.xray || ""}</td>
                  <td>--</td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  /* ------- Save & Continue -> open overlay preview ------- */
  const handleSaveAndContinue = () => {
    if (!selectedPart) {
      setError("Please select a Part Name before continuing.");
      return;
    }

    const payload = {
      trial_no: trialNo || null,
      pattern_code: selectedPart.pattern_code || null,
      part_name: selectedPart.part_name || null,
      material_grade: selectedPart.material_grade || null,
      chemical_composition: chemState,
      tensile: tensileState,
      micro_structure: microState,
      hardness: hardnessState,
      current_department: "methods",
      status: "draft",
      created_at: new Date().toISOString(),
    };

    setPreviewPayload(payload);
    setPreviewMode(true);
    setSubmitted(false);
    setPreviewMessage(null);
  };

  /* ------- Final Save from preview overlay (VisualInspection-like) ------- */
  const handleFinalSave = async () => {
    if (!previewPayload) return;
    try {
      // Frontend-only save behaviour (like VisualInspection)
      const dataToSubmit = {
        selectedPart,
        selectedPattern,
        trialNo,
        chemical_composition: chemState,
        tensile: tensileState,
        micro_structure: microState,
        hardness: hardnessState,
      };
      setSubmittedData(dataToSubmit);
      setSubmitted(true);
      setPreviewMessage("Successfully submitted");
    } catch (err) {
      console.error("Save failed:", err);
      setPreviewMessage("Save failed");
    }
  };

  /* ------- routing to pouring ------- */
  if (currentView === "pouring" && submittedData) {
    return (
      <PouringDetailsTable
        pouringDetails={pouringDetails}
        onPouringDetailsChange={handlePouringDetailsChange}
        submittedData={submittedData}
      />
    );
  }

  /* ---------------- Main Form UI ---------------- */

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pt: "80px" }}>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {loading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <CircularProgress size={60} />
            </Box>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Paper
              ref={printRef}
              variant="outlined"
              sx={{
                overflow: "hidden",
                border: `2px solid ${SAKTHI_COLORS.primary}`,
                bgcolor: SAKTHI_COLORS.white,
              }}
            >
              {/* Header Section */}
              <Box
                sx={{
                  p: 3,
                  borderBottom: `3px solid ${SAKTHI_COLORS.primary}`,
                  background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`,
                  color: SAKTHI_COLORS.white,
                }}
              >
                {/* Title + IP */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    FOUNDRY SAMPLE CARD
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "#ffb4b4" }}
                  >
                    IP:{" "}
                    <span style={{ color: "#ffebee", fontWeight: 700 }}>
                      {userIP || "Fetching..."}
                    </span>
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1fr 1fr 1fr",
                    },
                    gap: 3,
                    alignItems: "start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}
                    >
                      Pattern Code
                    </Typography>
                    <Autocomplete
                      options={masterParts}
                      value={selectedPattern}
                      onChange={(_, newValue) => handlePatternChange(newValue)}
                      getOptionLabel={(option) => option.pattern_code}
                      renderOption={(props, option) => (
                        <li
                          {...props}
                          key={option.id}
                          style={{
                            whiteSpace: "normal",
                            lineHeight: "1.5",
                            padding: "8px 16px",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {option.pattern_code}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.part_name}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => {
                        const { InputProps, ...other } = params;
                        return (
                          <TextField
                            {...other}
                            placeholder="Select pattern code"
                            size="small"
                            required
                            InputProps={{
                              ...(InputProps as any),
                              sx: {
                                bgcolor: SAKTHI_COLORS.white,
                                borderRadius: 2,
                              },
                            }}
                          />
                        );
                      }}
                      slotProps={{
                        paper: {
                          sx: {
                            width: "auto",
                            minWidth: "400px",
                            maxWidth: "90vw",
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}
                    >
                      Part Name
                    </Typography>
                    <Autocomplete
                      options={masterParts}
                      value={selectedPart}
                      onChange={(_, newValue) => handlePartChange(newValue)}
                      getOptionLabel={(option) => option.part_name}
                      renderOption={(props, option) => (
                        <li
                          {...props}
                          key={option.id}
                          style={{
                            whiteSpace: "normal",
                            lineHeight: "1.5",
                            padding: "8px 16px",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {option.part_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.pattern_code}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => {
                        const { InputProps, ...other } = params;
                        return (
                          <TextField
                            {...other}
                            placeholder="Select from Master list"
                            size="small"
                            required
                            InputProps={{
                              ...(InputProps as any),
                              sx: {
                                bgcolor: SAKTHI_COLORS.white,
                                borderRadius: 2,
                              },
                            }}
                          />
                        );
                      }}
                      slotProps={{
                        paper: {
                          sx: {
                            width: "auto",
                            minWidth: "400px",
                            maxWidth: "90vw",
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}
                    >
                      TRIAL No
                    </Typography>
                    <Box
                      sx={{ display: "flex", gap: 1, alignItems: "center" }}
                    >
                      <TextField
                        fullWidth
                        value={trialNo}
                        placeholder="Auto-generated"
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            bgcolor: SAKTHI_COLORS.white,
                            borderRadius: 2,
                          },
                          endAdornment: (
                            <InputAdornment position="end">
                              {trialLoading ? (
                                <CircularProgress size={18} />
                              ) : null}
                            </InputAdornment>
                          ),
                        }}
                      />
                      <IconButton
                        color="primary"
                        onClick={() =>
                          generateTrialId(selectedPart?.part_name)
                        }
                        disabled={!selectedPart || trialLoading}
                        size="large"
                        title="Regenerate trial number"
                        sx={{
                          bgcolor: SAKTHI_COLORS.white,
                          borderRadius: 2,
                          "&:hover": { bgcolor: "#f0f4ff" },
                        }}
                      >
                        <span style={{ fontSize: 18 }}>⟳</span>
                      </IconButton>
                    </Box>
                    {trialError && (
                      <Typography color="error" variant="caption">
                        {trialError}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Info Chip */}
              <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                <Chip
                  icon={<span style={{ fontSize: "1.2rem" }}>💡</span>}
                  label="Auto retrieval of spec once part name is selected (Metallurgical Spec)"
                  sx={{
                    bgcolor: selectedPart
                      ? SAKTHI_COLORS.success + "20"
                      : SAKTHI_COLORS.accent + "20",
                    color: SAKTHI_COLORS.darkGray,
                    border: `1px dashed ${selectedPart ? SAKTHI_COLORS.success : SAKTHI_COLORS.accent
                      }`,
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    py: 2.5,
                  }}
                />
              </Box>

              <Box sx={{ p: 3 }}>
                {/* METALLURGICAL SPECIFICATION Section */}
                <Paper
                  id="metallurgical-section"
                  variant="outlined"
                  sx={{
                    border: `2px solid ${SAKTHI_COLORS.primary}`,
                    overflow: "hidden",
                    mb: 3,
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      bgcolor: SAKTHI_COLORS.accent,
                      p: 1.5,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: SAKTHI_COLORS.white,
                        fontSize: "1rem",
                      }}
                    >
                      METALLURGICAL SPECIFICATION
                    </Typography>
                  </Box>

                  {/* Chemical Composition + Microstructure */}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          align="center"
                          sx={{
                            bgcolor: SAKTHI_COLORS.primary,
                            fontWeight: 700,
                            borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                            fontSize: "0.95rem",
                            py: 1.5,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Chemical Composition
                        </TableCell>
                        <TableCell
                          colSpan={3}
                          align="center"
                          sx={{
                            bgcolor: SAKTHI_COLORS.primary,
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            py: 1.5,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Microstructure
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "80px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          C%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "80px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Si%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "80px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Mn%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "80px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          P%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "80px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          S%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "80px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Mg%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "80px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Cr%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "80px",
                            fontSize: "0.85rem",
                            borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Cu%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "100px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Nodularity%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "100px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Pearlite%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "100px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Carbide%
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={chemicalData.c}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setChemState((s) => ({
                                ...s,
                                c: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: chemicalData.c
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: chemicalData.c ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={chemicalData.si}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setChemState((s) => ({
                                ...s,
                                si: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: chemicalData.si
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: chemicalData.si ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={chemicalData.mn}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setChemState((s) => ({
                                ...s,
                                mn: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: chemicalData.mn
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: chemicalData.mn ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={chemicalData.p}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setChemState((s) => ({
                                ...s,
                                p: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: chemicalData.p
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: chemicalData.p ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={chemicalData.s}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setChemState((s) => ({
                                ...s,
                                s: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: chemicalData.s
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: chemicalData.s ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={chemicalData.mg}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setChemState((s) => ({
                                ...s,
                                mg: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: chemicalData.mg
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: chemicalData.mg ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={chemicalData.cr}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setChemState((s) => ({
                                ...s,
                                cr: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: chemicalData.cr
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: chemicalData.cr ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderRight: `2px solid ${SAKTHI_COLORS.primary}` }}>
                          <TextField
                            fullWidth
                            value={chemicalData.cu}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setChemState((s) => ({
                                ...s,
                                cu: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: chemicalData.cu
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: chemicalData.cu ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={microData.nodularity}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setMicroState((s) => ({
                                ...s,
                                nodularity: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor:
                                  microData.nodularity !== "--"
                                    ? SAKTHI_COLORS.background
                                    : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight:
                                  microData.nodularity !== "--" ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={microData.pearlite}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setMicroState((s) => ({
                                ...s,
                                pearlite: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor:
                                  microData.pearlite !== "--"
                                    ? SAKTHI_COLORS.background
                                    : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight:
                                  microData.pearlite !== "--" ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={microData.carbide}
                            placeholder="--"
                            size="small"
                            onChange={(e) =>
                              setMicroState((s) => ({
                                ...s,
                                carbide: e.target.value,
                              }))
                            }
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor:
                                  microData.carbide !== "--"
                                    ? SAKTHI_COLORS.background
                                    : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight:
                                  microData.carbide !== "--" ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Mechanical Properties + NDT */}
                  <Table size="small" sx={{ mt: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{
                            bgcolor: SAKTHI_COLORS.primary,
                            fontWeight: 700,
                            borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                            fontSize: "0.95rem",
                            py: 1.5,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Mechanical Properties
                        </TableCell>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            bgcolor: SAKTHI_COLORS.primary,
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            py: 1.5,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          NDT Inspection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "120px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Tensile Strength (Min)
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "120px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Yield Strength (Min)
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "100px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Elongation%
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "100px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Impact strength@ Cold Temp °c
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "100px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          Impact strength@ Room Temp °c
                        </TableCell>
                        <TableCell
                          align="center"
                          colSpan={2}
                          sx={{
                            fontSize: "0.85rem",
                            borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                mb: 0.5,
                                color: SAKTHI_COLORS.white,
                              }}
                            >
                              Hardness (BHN)
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                borderTop: `1px solid ${SAKTHI_COLORS.lightGray}`,
                              }}
                            >
                              <Box
                                sx={{
                                  flex: 1,
                                  py: 0.5,
                                  borderRight: `1px solid ${SAKTHI_COLORS.lightGray}`,
                                  color: SAKTHI_COLORS.white,
                                }}
                              >
                                Surface
                              </Box>
                              <Box
                                sx={{
                                  flex: 1,
                                  py: 0.5,
                                  color: SAKTHI_COLORS.white,
                                }}
                              >
                                Core
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "120px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          X-Ray Inspection
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            minWidth: "100px",
                            fontSize: "0.85rem",
                            bgcolor: SAKTHI_COLORS.lightBlue,
                            color: SAKTHI_COLORS.white,
                          }}
                        >
                          MPI
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.tensileStrength}
                            onChange={(e) =>
                              setTensileState((s) => ({
                                ...s,
                                tensileStrength: e.target.value,
                              }))
                            }
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: tensileData.tensileStrength
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.tensileStrength
                                  ? 600
                                  : 400,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.yieldStrength}
                            onChange={(e) =>
                              setTensileState((s) => ({
                                ...s,
                                yieldStrength: e.target.value,
                              }))
                            }
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: tensileData.yieldStrength
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.yieldStrength
                                  ? 600
                                  : 400,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.elongation}
                            onChange={(e) =>
                              setTensileState((s) => ({
                                ...s,
                                elongation: e.target.value,
                              }))
                            }
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: tensileData.elongation
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.elongation ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            value={
                              tensileData.impactCold ||
                              (selectedPart?.impact
                                ? `${selectedPart.impact} (Cold)`
                                : "--")
                            }
                            onChange={(e) =>
                              setTensileState((s) => ({
                                ...s,
                                impactCold: e.target.value,
                              }))
                            }
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: selectedPart?.impact
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.impact ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            value={
                              tensileData.impactRoom ||
                              (selectedPart?.impact
                                ? `${selectedPart.impact} (Room)`
                                : "--")
                            }
                            onChange={(e) =>
                              setTensileState((s) => ({
                                ...s,
                                impactRoom: e.target.value,
                              }))
                            }
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor: selectedPart?.impact
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.impact ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            value={hardnessData.surface}
                            onChange={(e) =>
                              setHardnessState((s) => ({
                                ...s,
                                surface: e.target.value,
                              }))
                            }
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor:
                                  hardnessData.surface !== "--"
                                    ? SAKTHI_COLORS.background
                                    : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight:
                                  hardnessData.surface !== "--" ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            value={hardnessData.core}
                            onChange={(e) =>
                              setHardnessState((s) => ({
                                ...s,
                                core: e.target.value,
                              }))
                            }
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: !editingOnlyMetallurgical,
                              sx: {
                                bgcolor:
                                  hardnessData.core !== "--"
                                    ? SAKTHI_COLORS.background
                                    : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight:
                                  hardnessData.core !== "--" ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            value={selectedPart?.xray || "--"}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: selectedPart?.xray
                                  ? SAKTHI_COLORS.background
                                  : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.xray ? 600 : 400,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <TextField
                            fullWidth
                            placeholder="--"
                            size="small"
                            InputProps={{
                              sx: {
                                bgcolor: SAKTHI_COLORS.white,
                                borderRadius: 1,
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>

                {/* Save & Continue (opens preview overlay) */}
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSaveAndContinue}
                    sx={{
                      minWidth: 250,
                      height: 56,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`,
                      "&:hover": {
                        background: `linear-gradient(135deg, ${SAKTHI_COLORS.lightBlue} 0%, ${SAKTHI_COLORS.primary} 100%)`,
                      },
                      "&:disabled": {
                        bgcolor: SAKTHI_COLORS.lightGray,
                        color: SAKTHI_COLORS.darkGray,
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Save and Continue"
                    )}
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Floating Apple-style preview like VisualInspection */}
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
              {/* Top-right red cross */}
              <IconButton
                onClick={() => {
                  // route to the next Foundry sample card page
                  navigate('/foundry-sample-card-2');
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

              {/* Header inside overlay */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
                pr={5}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Sample Card – Preview
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

              {/* Basic info */}
              <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2">
                  <strong>Pattern Code:</strong>{" "}
                  {selectedPart?.pattern_code || "--"}
                </Typography>
                <Typography variant="body2">
                  <strong>Part Name:</strong> {selectedPart?.part_name || "--"}
                </Typography>
                <Typography variant="body2">
                  <strong>TRIAL No:</strong> {trialNo || "--"}
                </Typography>
                <Typography variant="body2">
                  <strong>Created:</strong>{" "}
                  {new Date(previewPayload.created_at).toLocaleString()}
                </Typography>
              </Box>

              {/* Metallurgical Spec preview (read-only) */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: "rgba(255,255,255,0.9)",
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, mb: 1.5 }}
                >
                  METALLURGICAL SPECIFICATION
                </Typography>

                {/* Chemical + Micro */}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                        sx={{
                          bgcolor: SAKTHI_COLORS.primary,
                          color: SAKTHI_COLORS.white,
                          fontWeight: 700,
                        }}
                      >
                        Chemical Composition
                      </TableCell>
                      <TableCell
                        colSpan={3}
                        align="center"
                        sx={{
                          bgcolor: SAKTHI_COLORS.primary,
                          color: SAKTHI_COLORS.white,
                          fontWeight: 700,
                        }}
                      >
                        Microstructure
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>C%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Si%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Mn%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>P%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>S%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Mg%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Cr%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Cu%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Nodularity%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Pearlite%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Carbide%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{chemState.c || "--"}</TableCell>
                      <TableCell>{chemState.si || "--"}</TableCell>
                      <TableCell>{chemState.mn || "--"}</TableCell>
                      <TableCell>{chemState.p || "--"}</TableCell>
                      <TableCell>{chemState.s || "--"}</TableCell>
                      <TableCell>{chemState.mg || "--"}</TableCell>
                      <TableCell>{chemState.cr || "--"}</TableCell>
                      <TableCell>{chemState.cu || "--"}</TableCell>
                      <TableCell>{microState.nodularity || "--"}</TableCell>
                      <TableCell>{microState.pearlite || "--"}</TableCell>
                      <TableCell>{microState.carbide || "--"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Mechanical + NDT */}
                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{
                          bgcolor: SAKTHI_COLORS.primary,
                          color: SAKTHI_COLORS.white,
                          fontWeight: 700,
                        }}
                      >
                        Mechanical Properties
                      </TableCell>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{
                          bgcolor: SAKTHI_COLORS.primary,
                          color: SAKTHI_COLORS.white,
                          fontWeight: 700,
                        }}
                      >
                        NDT Inspection
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Tensile Strength</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Yield Strength</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Elongation%</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Impact @ Cold</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Impact @ Room</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Hardness Surface</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Hardness Core</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>X-Ray</TableCell>
                      <TableCell align="center" sx={{ bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>MPI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{tensileState.tensileStrength || "--"}</TableCell>
                      <TableCell>{tensileState.yieldStrength || "--"}</TableCell>
                      <TableCell>{tensileState.elongation || "--"}</TableCell>
                      <TableCell>{tensileState.impactCold || "--"}</TableCell>
                      <TableCell>{tensileState.impactRoom || "--"}</TableCell>
                      <TableCell>{hardnessState.surface || "--"}</TableCell>
                      <TableCell>{hardnessState.core || "--"}</TableCell>
                      <TableCell>{selectedPart?.xray || "--"}</TableCell>
                      <TableCell>--</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>

              {/* Messages inside preview */}
              {previewMessage && (
                <Box mt={2}>
                  <Alert
                    severity={submitted ? "success" : "info"}
                    sx={{ borderRadius: 3 }}
                  >
                    {previewMessage}
                  </Alert>
                </Box>
              )}

              {/* Actions */}
              <Box
                mt={3}
                display="flex"
                alignItems="center"
                gap={2}
              >
                {/* Edit button: disabled after Save */}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPreviewMode(false);
                    setPreviewPayload(null);
                  }}
                  disabled={submitted}
                >
                  Edit
                </Button>

                {submitted && (
                  <Button
                    variant="contained"
                    onClick={handleExportPDF}
                    sx={{ backgroundColor: SAKTHI_COLORS.primary }}
                  >
                    Export PDF
                  </Button>
                )}

                <Button
                  variant="contained"
                  disabled={submitted}
                  onClick={handleFinalSave}
                  sx={{ backgroundColor: SAKTHI_COLORS.accent }}
                >
                  {submitted ? "Submitted" : "Submit"}
                </Button>

                <Box sx={{ flex: 1 }} />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

/* ---------------- Wrapper with ErrorBoundary ---------------- */

export default function FoundrySampleCardWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <FoundrySampleCard />
    </ErrorBoundary>
  );
}