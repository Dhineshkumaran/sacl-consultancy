import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
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

import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

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

// Local helper lists
const MACHINES = ["DISA", "FOUNDRY-A", "FOUNDRY-B", "MACHINESHOP"];
const SAMPLING_REASONS = [
  "Routine",
  "Customer Complaint",
  "Process Change",
  "Audit",
  "Other",
];

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

// Error Boundary Component
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

function FoundrySampleCard() {
  const printRef = useRef<HTMLDivElement | null>(null);

  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [machine, setMachine] = useState("");
  const [reason, setReason] = useState("");
  const [trialNo, setTrialNo] = useState<string>("");
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [samplingDate, setSamplingDate] = useState("");
  const [mouldCount, setMouldCount] = useState("");
  const [sampleTraceability, setSampleTraceability] = useState("");
  const [toolingType, setToolingType] = useState("");
  const [toolingFiles, setToolingFiles] = useState<File[]>([]);

  // routing
  const [currentView, setCurrentView] = useState<
    "form" | "submitted" | "pouring"
  >("form");
  const [submittedData, setSubmittedData] = useState<any>(null);

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

  // preview overlay states (Apple glass style)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<any | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Handler used by PouringDetailsTable to update pouring details
  const handlePouringDetailsChange = (details: PouringDetails) => {
    setPouringDetails(details);
  };

  // New states for pattern data sheet and std box uploads
  const [patternFiles, setPatternFiles] = useState<File[]>([]);
  const [stdFiles, setStdFiles] = useState<File[]>([]);

  // Mould correction details rows
  const [mouldCorrections, setMouldCorrections] = useState<MouldCorrection[]>(
    [{ id: 1, compressibility: "", squeezePressure: "", fillerSize: "" }]
  );

  // tooling files
  const handleToolingFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setToolingFiles(files);
  };

  const removeToolingFile = (index: number) => {
    setToolingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // pattern files handlers
  const handlePatternFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPatternFiles((prev) => [...prev, ...files]);
  };

  const removePatternFile = (index: number) => {
    setPatternFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // std files handlers
  const handleStdFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setStdFiles((prev) => [...prev, ...files]);
  };

  const removeStdFile = (index: number) => {
    setStdFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // mould correction handlers
  const handleMouldCorrectionChange = (
    id: number,
    field: keyof Omit<MouldCorrection, "id">,
    value: string
  ) => {
    setMouldCorrections((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const addMouldCorrectionRow = () => {
    setMouldCorrections((prev) => [
      ...prev,
      { id: Date.now(), compressibility: "", squeezePressure: "", fillerSize: "" },
    ]);
  };

  const removeMouldCorrectionRow = (id: number) => {
    if (mouldCorrections.length > 1) {
      setMouldCorrections((prev) => prev.filter((row) => row.id !== id));
    }
  };

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
        setError("Failed to load master parts. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    getMasterParts();
  }, []);

  // Set today's date automatically when component loads
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    setSamplingDate(formattedDate);
  }, []);

  // Generate trial number when selectedPart changes (auto-generate via backend)
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
      const res = await fetch(
        `http://localhost:3000/api/trial/id?part_name=${encodeURIComponent(
          name
        )}`
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Failed to generate trial id (${res.status}) ${body}`
        );
      }
      const json = await res.json();
      if (json && json.trialId) {
        setTrialNo(json.trialId);
      } else {
        setTrialNo("");
        setTrialError("Unexpected response from server");
      }
    } catch (err) {
      console.error("Error generating trial id:", err);
      setTrialError("Failed to generate trial number");
    } finally {
      setTrialLoading(false);
    }
  };

  // auto-generate when user selects a part
  useEffect(() => {
    if (!selectedPart) {
      setTrialNo("");
      setTrialError(null);
      return;
    }
    generateTrialId(selectedPart.part_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPart]);

  const handlePartChange = (newValue: PartData | null) => {
    setSelectedPart(newValue);
  };

  // ---- Apple-glass Preview Trigger (Save & Continue) ----
  const handleSaveAndContinue = () => {
    const data = {
      selectedPart,
      machine,
      reason,
      trialNo,
      samplingDate,
      mouldCount,
      sampleTraceability,
      toolingType,
      toolingFiles,
      patternFiles,
      stdFiles,
      mouldCorrections,
    };

    setReviewData(data);
    setPreviewOpen(true);
    setSubmitted(false);
    setPreviewMessage(null);
  };

  // ---- Final Submit from preview (uses existing API logic) ----
  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const prepareFileData = (files: File[]) => {
        if (!files || files.length === 0) {
          return null;
        }
        return files.map((file) => ({
          name: file.name || "",
          size: file.size || 0,
          type: file.type || "",
          lastModified: file.lastModified || Date.now(),
        }));
      };

      const mouldCorrectionData = mouldCorrections.map((row) => ({
        compressibility: row.compressibility || "",
        squeeze_pressure: row.squeezePressure || "",
        filler_size: row.fillerSize || "",
      }));

      const trialData = {
        trial_no: trialNo || null,
        pattern_code: selectedPart?.pattern_code || null,
        part_name: selectedPart?.part_name || null,
        material_grade: selectedPart?.material_grade || null,
        machine_used: machine || null,
        sampling_date: samplingDate || null,
        no_of_moulds: mouldCount ? parseInt(mouldCount) : null,
        reason_for_sampling: reason || null,
        sample_traceability: sampleTraceability || null,
        tooling_type: toolingType || null,
        tooling_modification_files: prepareFileData(toolingFiles),
        pattern_data_sheet_files: prepareFileData(patternFiles),
        std_doc_files: prepareFileData(stdFiles),
        mould_correction_details:
          mouldCorrectionData.length > 0 ? mouldCorrectionData : null,
        current_department: "methods",
        status: "draft",
      };

      const cleanTrialData = Object.fromEntries(
        Object.entries(trialData).map(([key, value]) => [
          key,
          value === undefined ? null : value,
        ])
      );

      console.log(
        "🔧 DEBUG - Sending trial data to API:",
        JSON.stringify(cleanTrialData, null, 2)
      );

      const response = await fetch(
        "http://localhost:3000/api/trial-november",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cleanTrialData),
        }
      );

      console.log("📡 DEBUG - Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error Response:", errorText);

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
      console.log("✅ DEBUG - Success API Response:", responseData);

      const dataToSubmit = {
        selectedPart,
        machine,
        reason,
        trialNo,
        samplingDate,
        mouldCount,
        sampleTraceability,
        toolingType,
        toolingFiles,
        patternFiles,
        stdFiles,
        mouldCorrections,
        apiResponse: responseData,
      };

      setSubmittedData(dataToSubmit);
      setSubmitted(true);
      setPreviewMessage("Successfully submitted");
      // NOTE: we KEEP the overlay open so Edit button can be disabled visibly.
      // If you still want the old submitted screen, uncomment:
      // setCurrentView('submitted');
    } catch (error) {
      console.error("❌ Error submitting trial:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit trial data. Please check console for details."
      );
      setPreviewMessage("Failed to submit trial data");
    } finally {
      setLoading(false);
    }
  };

  // ---------- PDF Export (VisualInspection-style: B/W print, no direct download) ----------
  const handleExportPDF = () => {
    if (!submitted) {
      alert('Please click Save before exporting.');
      return;
    }

    const data =
      reviewData ||
      submittedData || {
        selectedPart,
        machine,
        reason,
        trialNo,
        samplingDate,
        mouldCount,
        sampleTraceability,
        toolingType,
        toolingFiles,
        patternFiles,
        stdFiles,
        mouldCorrections,
      };

    if (!data) {
      alert("Nothing to export");
      return;
    }

    const popup = window.open("", "_blank", "width=1000,height=800");
    if (!popup) {
      alert("Unable to open print window. Please disable popup blocker.");
      return;
    }

    const patternNames =
      data.patternFiles?.map((f: any) => f.name || f?.fileName || "") || [];
    const stdNames =
      data.stdFiles?.map((f: any) => f.name || f?.fileName || "") || [];
    const toolingNames =
      data.toolingFiles?.map((f: any) => f.name || f?.fileName || "") || [];

    const html = `
      <html>
        <head>
          <title>Foundry Sample Card</title>
          <style>
            body {
              font-family: Inter, Roboto, Arial, sans-serif;
              margin: 24px;
              color: #000000;
              background: #ffffff;
            }
            .card {
              border: 1px solid #000;
              padding: 16px 20px;
              border-radius: 4px;
            }
            h2 {
              margin: 0 0 4px 0;
              font-size: 18px;
            }
            h3 {
              margin: 14px 0 6px 0;
              font-size: 14px;
            }
            .meta {
              margin-top: 6px;
              font-size: 11px;
            }
            .meta div {
              margin-bottom: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 6px;
              text-align: left;
            }
            th {
              font-weight: 700;
            }
            .section-title {
              font-weight: 700;
              font-size: 12px;
              margin-top: 10px;
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Foundry Sample Card</h2>
            <div class="meta">
              <div><strong>Date of Sampling:</strong> ${data.samplingDate || "--"}</div>
              <div><strong>No. of Moulds:</strong> ${data.mouldCount || "--"}</div>
              <div><strong>DISA / FOUNDRY-A:</strong> ${data.machine || "--"}</div>
              <div><strong>Trial No:</strong> ${data.trialNo || "--"}</div>
            </div>

            <div class="section-title">Part Details</div>
            <table>
              <tr>
                <th>Part Name</th>
                <td>${data.selectedPart?.part_name || "--"}</td>
              </tr>
              <tr>
                <th>Pattern Code</th>
                <td>${data.selectedPart?.pattern_code || "--"}</td>
              </tr>
              <tr>
                <th>Material Grade</th>
                <td>${data.selectedPart?.material_grade || "--"}</td>
              </tr>
              <tr>
                <th>Reason for Sampling</th>
                <td>${data.reason || "--"}</td>
              </tr>
              <tr>
                <th>Sample Traceability</th>
                <td>${data.sampleTraceability || "--"}</td>
              </tr>
            </table>

            <div class="section-title">Tooling Modification</div>
            <table>
              <tr>
                <th>Type</th>
                <td>${data.toolingType || "--"}</td>
              </tr>
              <tr>
                <th>Pattern Data Sheet Files</th>
                <td>${patternNames.length ? patternNames.join(", ") : "None"}</td>
              </tr>
              <tr>
                <th>STD Doc Files</th>
                <td>${stdNames.length ? stdNames.join(", ") : "None"}</td>
              </tr>
              <tr>
                <th>Tooling Modification Files</th>
                <td>${toolingNames.length ? toolingNames.join(", ") : "None"}</td>
              </tr>
            </table>

            <div class="section-title">Mould Correction Details</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Compressibility</th>
                  <th>Squeeze Pressure</th>
                  <th>Filler Size</th>
                </tr>
              </thead>
              <tbody>
                ${
                  (data.mouldCorrections || [])
                    .map(
                      (row: any, idx: number) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${row.compressibility || "--"}</td>
                    <td>${row.squeezePressure || row.squeeze_pressure || "--"}</td>
                    <td>${row.fillerSize || row.filler_size || "--"}</td>
                  </tr>
                `
                    )
                    .join("") || `
                  <tr>
                    <td colspan="4">No mould corrections recorded</td>
                  </tr>
                `
                }
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

  // Render pouring details page when submitted
  if (currentView === "pouring" && submittedData) {
    return (
      <PouringDetailsTable
        pouringDetails={pouringDetails}
        onPouringDetailsChange={handlePouringDetailsChange}
        submittedData={submittedData}
      />
    );
  }

  // Render submitted confirmation (still available but not used by new overlay flow unless you call setCurrentView('submitted'))
  if (currentView === "submitted" && submittedData) {
    return (
      <SampleCardSubmitted
        submittedData={submittedData}
        onProceedToPouring={() => setCurrentView("pouring")}
        onExportPDF={handleExportPDF}
      />
    );
  }

  // Render main form
  return (
    <ThemeProvider theme={theme}>
      <Box ref={printRef} sx={{ p: 3, background: SAKTHI_COLORS.background }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", py: 2 }}>
          {/* Date, Moulds, Machine, Reason, Sample Traceability Table + Pattern Data Sheet + STD Box */}
          <Paper
            variant="outlined"
            sx={{
              border: `2px solid ${SAKTHI_COLORS.primary}`,
              overflow: "auto",
              mb: 3,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      minWidth: "140px",
                      bgcolor: SAKTHI_COLORS.primary,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Date of Sampling
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      minWidth: "120px",
                      bgcolor: SAKTHI_COLORS.primary,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    No. of Moulds
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      minWidth: "180px",
                      bgcolor: SAKTHI_COLORS.primary,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    DISA / FOUNDRY-A
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      minWidth: "180px",
                      bgcolor: SAKTHI_COLORS.primary,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Reason For Sampling
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      minWidth: "150px",
                      bgcolor: SAKTHI_COLORS.primary,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Sample Traceability
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      minWidth: "160px",
                      bgcolor: SAKTHI_COLORS.primary,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Pattern Data Sheet
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      minWidth: "160px",
                      bgcolor: SAKTHI_COLORS.primary,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Std Doc
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                <TableRow>
                  <TableCell>
                    <TextField
                      fullWidth
                      type="date"
                      value={samplingDate}
                      onChange={(e) => setSamplingDate(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      required
                      InputProps={{
                        sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      type="number"
                      value={mouldCount}
                      onChange={(e) => setMouldCount(e.target.value)}
                      placeholder="10"
                      size="small"
                      inputProps={{ min: 0 }}
                      required
                      InputProps={{
                        sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" required>
                      <Select
                        value={machine}
                        onChange={(e) => setMachine(e.target.value)}
                        displayEmpty
                        sx={{
                          bgcolor: SAKTHI_COLORS.white,
                          borderRadius: 1,
                        }}
                      >
                        <MenuItem value="" disabled>
                          Select Machine
                        </MenuItem>
                        {MACHINES.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" required>
                      <Select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        displayEmpty
                        sx={{
                          bgcolor: SAKTHI_COLORS.white,
                          borderRadius: 1,
                        }}
                      >
                        <MenuItem value="" disabled>
                          Select Reason
                        </MenuItem>
                        {SAMPLING_REASONS.map((r) => (
                          <MenuItem key={r} value={r}>
                            {r}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      value={sampleTraceability}
                      onChange={(e) => setSampleTraceability(e.target.value)}
                      placeholder="Enter option"
                      size="small"
                      required
                      InputProps={{
                        sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 },
                      }}
                    />
                  </TableCell>

                  {/* Pattern Data Sheet Upload */}
                  <TableCell>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{
                        borderWidth: 2,
                        borderStyle: "dashed",
                        borderColor: SAKTHI_COLORS.primary,
                        color: SAKTHI_COLORS.primary,
                        py: 1.5,
                        bgcolor: SAKTHI_COLORS.white,
                        "&:hover": {
                          borderColor: SAKTHI_COLORS.lightBlue,
                          backgroundColor: SAKTHI_COLORS.background,
                          borderWidth: 2,
                        },
                      }}
                    >
                      📎 Upload Pattern PDF / Image
                      <input
                        type="file"
                        hidden
                        accept=".jpg,.jpeg,.png,.pdf"
                        multiple
                        onChange={handlePatternFilesChange}
                      />
                    </Button>

                    {patternFiles.length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          gap: 1,
                          flexDirection: "column",
                        }}
                      >
                        {patternFiles.map((f, i) => (
                          <Box
                            key={i}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              bgcolor: "#fff",
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              border: `1px solid ${SAKTHI_COLORS.lightGray}`,
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {f.name}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => removePatternFile(i)}
                              sx={{ color: SAKTHI_COLORS.secondary }}
                            >
                              Remove
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </TableCell>

                  {/* STD Box Upload */}
                  <TableCell>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{
                        borderWidth: 2,
                        borderStyle: "dashed",
                        borderColor: SAKTHI_COLORS.primary,
                        color: SAKTHI_COLORS.primary,
                        py: 1.5,
                        bgcolor: SAKTHI_COLORS.white,
                        "&:hover": {
                          borderColor: SAKTHI_COLORS.lightBlue,
                          backgroundColor: SAKTHI_COLORS.background,
                          borderWidth: 2,
                        },
                      }}
                    >
                      📎 Attach STD PDF
                      <input
                        type="file"
                        hidden
                        accept=".pdf"
                        multiple
                        onChange={handleStdFilesChange}
                      />
                    </Button>

                    {stdFiles.length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          gap: 1,
                          flexDirection: "column",
                        }}
                      >
                        {stdFiles.map((f, i) => (
                          <Box
                            key={i}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              bgcolor: "#fff",
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              border: `1px solid ${SAKTHI_COLORS.lightGray}`,
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {f.name}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => removeStdFile(i)}
                              sx={{ color: SAKTHI_COLORS.secondary }}
                            >
                              Remove
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {/* Part selection + Trial No (kept from your original structure) */}
          <Paper
            variant="outlined"
            sx={{
              border: `2px solid ${SAKTHI_COLORS.primary}`,
              overflow: "hidden",
              mb: 3,
              p: 3,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "2fr 2fr 1fr" },
                gap: 3,
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}
                >
                  Part Name
                </Typography>
                <Autocomplete
                  options={masterParts}
                  value={selectedPart}
                  onChange={(_, newValue) => handlePartChange(newValue)}
                  getOptionLabel={(option) => option.part_name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select Part"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        sx: {
                          bgcolor: SAKTHI_COLORS.white,
                          borderRadius: 1,
                        },
                      }}
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}
                >
                  Pattern Code
                </Typography>
                <TextField
                  fullWidth
                  value={selectedPart?.pattern_code || ""}
                  placeholder="Auto from part selection"
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: {
                      bgcolor: SAKTHI_COLORS.white,
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}
                >
                  Trial No
                </Typography>
                <TextField
                  fullWidth
                  value={trialNo}
                  placeholder="Auto-generated"
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: {
                      bgcolor: SAKTHI_COLORS.white,
                      borderRadius: 1,
                    },
                  }}
                />
                {trialError && (
                  <Typography color="error" variant="caption">
                    {trialError}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Tooling Modification Section */}
          <Paper
            variant="outlined"
            sx={{
              border: `2px solid ${SAKTHI_COLORS.primary}`,
              overflow: "hidden",
              mb: 3,
              p: 3,
              bgcolor: "#D3D3D3",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: SAKTHI_COLORS.darkGray,
                fontSize: "1rem",
                mb: 2,
              }}
            >
              Tooling Modification Done
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: SAKTHI_COLORS.darkGray,
                  }}
                >
                  Type
                </Typography>
                <TextField
                  fullWidth
                  value={toolingType}
                  onChange={(e) => setToolingType(e.target.value)}
                  placeholder="Enter modification type"
                  size="small"
                  multiline
                  rows={2}
                  required
                  InputProps={{
                    sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 },
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: SAKTHI_COLORS.darkGray,
                  }}
                >
                  Attach Photo or PDF
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: SAKTHI_COLORS.primary,
                    color: SAKTHI_COLORS.primary,
                    py: 1.5,
                    bgcolor: SAKTHI_COLORS.white,
                    "&:hover": {
                      borderColor: SAKTHI_COLORS.lightBlue,
                      backgroundColor: SAKTHI_COLORS.background,
                      borderWidth: 2,
                    },
                  }}
                >
                  📎 Upload Files
                  <input
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    multiple
                    onChange={handleToolingFilesChange}
                  />
                </Button>
                {toolingFiles.length > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {toolingFiles.map((f, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          bgcolor: "#fff",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          border: `1px solid ${SAKTHI_COLORS.lightGray}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.name}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => removeToolingFile(i)}
                          sx={{ color: SAKTHI_COLORS.secondary }}
                        >
                          Remove
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Mould correction details */}
          <Paper
            variant="outlined"
            sx={{
              border: `2px solid ${SAKTHI_COLORS.primary}`,
              overflow: "hidden",
              mb: 3,
              p: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: SAKTHI_COLORS.darkGray,
                  fontSize: "1rem",
                }}
              >
                Mould Correction Details
              </Typography>
              <Button
                variant="outlined"
                onClick={addMouldCorrectionRow}
                sx={{
                  borderColor: SAKTHI_COLORS.primary,
                  color: SAKTHI_COLORS.primary,
                }}
              >
                + Add Row
              </Button>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      bgcolor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Compressibility
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      bgcolor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Squeeze Pressure
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      bgcolor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Filler Size
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      bgcolor: SAKTHI_COLORS.lightBlue,
                      color: SAKTHI_COLORS.white,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mouldCorrections.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={row.compressibility}
                        size="small"
                        placeholder="Enter value"
                        required
                        onChange={(e) =>
                          handleMouldCorrectionChange(
                            row.id,
                            "compressibility",
                            e.target.value
                          )
                        }
                        InputProps={{
                          sx: {
                            bgcolor: SAKTHI_COLORS.white,
                            borderRadius: 1,
                            "& .MuiInputBase-input": {
                              textAlign: "center",
                            },
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={row.squeezePressure}
                        size="small"
                        placeholder="Enter pressure"
                        required
                        onChange={(e) =>
                          handleMouldCorrectionChange(
                            row.id,
                            "squeezePressure",
                            e.target.value
                          )
                        }
                        InputProps={{
                          sx: {
                            bgcolor: SAKTHI_COLORS.white,
                            borderRadius: 1,
                            "& .MuiInputBase-input": {
                              textAlign: "center",
                            },
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={row.fillerSize}
                        size="small"
                        placeholder="Enter size"
                        required
                        onChange={(e) =>
                          handleMouldCorrectionChange(
                            row.id,
                            "fillerSize",
                            e.target.value
                          )
                        }
                        InputProps={{
                          sx: {
                            bgcolor: SAKTHI_COLORS.white,
                            borderRadius: 1,
                            "& .MuiInputBase-input": {
                              textAlign: "center",
                            },
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {mouldCorrections.length > 1 && (
                        <Button
                          size="small"
                          onClick={() => removeMouldCorrectionRow(row.id)}
                          sx={{ color: SAKTHI_COLORS.secondary }}
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Submit + Export Buttons */}
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
              disabled={loading}
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
              {loading ? <CircularProgress size={24} /> : "Save and Continue"}
            </Button>

          </Box>
        </Box>

        {/* -------- Apple Glass Preview Overlay (like VisualInspection) -------- */}
        {previewOpen && reviewData && (
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
                maxWidth: 1100,
                maxHeight: "80vh",
                overflow: "auto",
                borderRadius: 4,
                p: 3,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.95))",
                boxShadow: "0 25px 80px rgba(15,23,42,0.45)",
                border: "1px solid rgba(255,255,255,0.9)",
                position: "relative",
              }}
            >
              {/* Top-right Cancel Cross -> Dashboard */}
              <IconButton
                onClick={() => {
                  // Close preview and navigate to the next sample card page (card 3)
                  window.location.href = "/foundry-sample-card-3";
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

              {/* Header */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                pr={5}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Sample Card – Preview
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Review your data before final submission
                  </Typography>
                </Box>
                {trialNo && (
                  <Chip
                    label={`Trial: ${trialNo}`}
                    sx={{ fontWeight: 700, bgcolor: "#eef2ff" }}
                  />
                )}
              </Box>

              {/* Preview Table (same info as old review screen) */}
              <Paper
                variant="outlined"
                sx={{
                  mb: 3,
                  border: `2px solid ${SAKTHI_COLORS.primary}`,
                  bgcolor: "rgba(255,255,255,0.9)",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        colSpan={7}
                        sx={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          bgcolor: SAKTHI_COLORS.primary,
                          color: SAKTHI_COLORS.white,
                          py: 2,
                        }}
                      >
                        SAMPLE CARD DETAILS - PREVIEW
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Basic Information */}
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                          width: "200px",
                        }}
                      >
                        Date of Sampling
                      </TableCell>
                      <TableCell colSpan={2}>
                        {reviewData.samplingDate || "Not provided"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        No. of Moulds
                      </TableCell>
                      <TableCell>
                        {reviewData.mouldCount || "Not provided"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        DISA / FOUNDRY-A
                      </TableCell>
                      <TableCell>
                        {reviewData.machine || "Not provided"}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Part Name
                      </TableCell>
                      <TableCell colSpan={2}>
                        {reviewData.selectedPart?.part_name || "Not selected"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Pattern Code
                      </TableCell>
                      <TableCell>
                        {reviewData.selectedPart?.pattern_code ||
                          "Not selected"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Trial No.
                      </TableCell>
                      <TableCell>{reviewData.trialNo || "Not generated"}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Reason for Sampling
                      </TableCell>
                      <TableCell colSpan={2}>
                        {reviewData.reason || "Not provided"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Sample Traceability
                      </TableCell>
                      <TableCell colSpan={3}>
                        {reviewData.sampleTraceability || "Not provided"}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Material Grade
                      </TableCell>
                      <TableCell colSpan={6}>
                        {reviewData.selectedPart?.material_grade ||
                          "Not selected"}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Tooling Modification Type
                      </TableCell>
                      <TableCell colSpan={6}>
                        {reviewData.toolingType || "Not provided"}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Pattern Data Sheet Files
                      </TableCell>
                      <TableCell colSpan={6}>
                        {reviewData.patternFiles.length > 0
                          ? reviewData.patternFiles.map(
                              (f: File, i: number) => (
                                <Chip
                                  key={i}
                                  label={f.name}
                                  size="small"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              )
                            )
                          : "No files uploaded"}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        STD Doc Files
                      </TableCell>
                      <TableCell colSpan={6}>
                        {reviewData.stdFiles.length > 0
                          ? reviewData.stdFiles.map((f: File, i: number) => (
                              <Chip
                                key={i}
                                label={f.name}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))
                          : "No files uploaded"}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: SAKTHI_COLORS.lightGray,
                        }}
                      >
                        Tooling Modification Files
                      </TableCell>
                      <TableCell colSpan={6}>
                        {reviewData.toolingFiles.length > 0
                          ? reviewData.toolingFiles.map(
                              (f: File, i: number) => (
                                <Chip
                                  key={i}
                                  label={f.name}
                                  size="small"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              )
                            )
                          : "No files uploaded"}
                      </TableCell>
                    </TableRow>

                    {/* Mould Correction Details */}
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        sx={{
                          fontWeight: 700,
                          bgcolor: SAKTHI_COLORS.lightBlue,
                          color: SAKTHI_COLORS.white,
                          textAlign: "center",
                        }}
                      >
                        MOULD CORRECTION DETAILS
                      </TableCell>
                    </TableRow>

                    {reviewData.mouldCorrections.map(
                      (row: MouldCorrection, index: number) => (
                        <TableRow key={row.id}>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              bgcolor: SAKTHI_COLORS.lightGray,
                            }}
                          >
                            Row {index + 1}
                          </TableCell>
                          <TableCell>
                            Compressibility: {row.compressibility || "--"}
                          </TableCell>
                          <TableCell>
                            Squeeze Pressure: {row.squeezePressure || "--"}
                          </TableCell>
                          <TableCell colSpan={4}>
                            Filler Size: {row.fillerSize || "--"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </Paper>

              {/* Success / info message */}
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

              {/* Action Buttons inside overlay */}
              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  justifyContent: "flex-start",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<EditIcon />}
                  onClick={() => setPreviewOpen(false)}
                  disabled={submitted}
                  sx={{
                    minWidth: 200,
                    height: 48,
                    fontWeight: 700,
                    borderColor: SAKTHI_COLORS.primary,
                    color: SAKTHI_COLORS.primary,
                    bgcolor: SAKTHI_COLORS.white,
                    "&:hover": {
                      bgcolor: SAKTHI_COLORS.background,
                    },
                    "&.Mui-disabled": {
                      borderColor: SAKTHI_COLORS.lightGray,
                      color: SAKTHI_COLORS.lightGray,
                    },
                  }}
                >
                  Edit Details
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleFinalSubmit}
                  disabled={loading || submitted}
                  sx={{
                    minWidth: 200,
                    height: 48,
                    fontSize: "1rem",
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${SAKTHI_COLORS.success} 0%, #34D399 100%)`,
                    "&:hover": {
                      background: `linear-gradient(135deg, #34D399 0%, ${SAKTHI_COLORS.success} 100%)`,
                    },
                    "&:disabled": {
                      bgcolor: SAKTHI_COLORS.lightGray,
                      color: SAKTHI_COLORS.darkGray,
                    },
                  }}
                >
                  {submitted
                    ? "Submitted"
                    : loading
                    ? "Submitting..."
                    : "Submit"}
                </Button>

                {submitted && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleExportPDF}
                    sx={{
                      minWidth: 200,
                      height: 48,
                      fontWeight: 700,
                      borderColor: SAKTHI_COLORS.accent,
                      color: SAKTHI_COLORS.accent,
                      bgcolor: SAKTHI_COLORS.white,
                      "&:hover": {
                        bgcolor: "#FEF3C7",
                      },
                    }}
                  >
                    Export as PDF
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

// SampleCardSubmitted Component (unchanged)
const SampleCardSubmitted = ({
  submittedData,
  onProceedToPouring,
  onExportPDF,
}: any) => {
  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography variant="h6">
          Sample Card Submitted Successfully!
        </Typography>
        <Typography variant="body2">
          Trial Number: {submittedData?.trialNo}
        </Typography>
      </Alert>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
        <Button variant="contained" onClick={onProceedToPouring}>
          Proceed to Pouring Details
        </Button>
        <Button variant="outlined" onClick={onExportPDF}>
          Export as PDF
        </Button>
      </Box>
    </Box>
  );
};

// Wrap with Error Boundary
export default function FoundrySampleCardWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <FoundrySampleCard />
    </ErrorBoundary>
  );
}