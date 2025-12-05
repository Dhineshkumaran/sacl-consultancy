import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate } from "react-router-dom";

/**
 * MaterialCorrectionTable
 *
 * - Editable table for material correction details
 * - Users can add/remove rows
 * - All fields are editable TextFields
 * - State management for all inputs
 */

const chemicalCols = [
  { key: "C", label: "C%" },
  { key: "Si", label: "Si%" },
  { key: "Mn", label: "Mn%" },
  { key: "P", label: "P%" },
  { key: "S", label: "S%" },
  { key: "Mg", label: "Mg%" },
  { key: "Cu", label: "Cu%" },
  { key: "Cr", label: "Cr%" },
];

const processCols = [
  { key: "pouringTemp", label: "Pouring temp °C" },
  { key: "inocPerSec", label: "Inoculant per Sec" },
  { key: "inocType", label: "Inoculant type" },
];

type RowData = Record<string, string>;

const initialRow: RowData = {
  C: "",
  Si: "",
  Mn: "",
  P: "",
  S: "",
  Mg: "",
  Cu: "",
  Cr: "",
  pouringTemp: "",
  inocPerSec: "",
  inocType: "",
};

export default function MaterialCorrectionTable() {
  const [rows, setRows] = useState<RowData[]>([{ ...initialRow }]);
  const totalCols = chemicalCols.length + processCols.length;

  // Apple glass preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();

  // auto-hide message
  useEffect(() => {
    if (previewMessage) {
      const t = setTimeout(() => setPreviewMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [previewMessage]);

  const handleInputChange = (
    rowIndex: number,
    fieldKey: string,
    value: string
  ) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][fieldKey] = value;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, { ...initialRow }]);
  };

  const removeRow = (rowIndex: number) => {
    if (rows.length > 1) {
      const updatedRows = rows.filter((_, index) => index !== rowIndex);
      setRows(updatedRows);
    }
  };

  const clearRow = (rowIndex: number) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = { ...initialRow };
    setRows(updatedRows);
  };

  const clearAll = () => {
    setRows([{ ...initialRow }]);
  };

  // Function to get all data (for parent component) – still available
  const getData = () => {
    return rows;
  };

  // Expose getData function for parent component access
  React.useEffect(() => {
    // @ts-ignore - Expose function to parent if needed
    window.getMaterialCorrectionData = getData;
  }, [rows]);

  // ----- Save & Continue -> open Apple glass preview -----
  const handleSaveAndContinue = () => {
    setPreviewOpen(true);
    setSubmitted(false);
    setPreviewMessage(null);
  };

  // ----- "Save" inside preview (no backend here, just simulate submit) -----
  const handleFinalSave = () => {
    setSubmitted(true);
    setPreviewMessage("Successfully submitted");
  };

  // ----- Export PDF: black & white print window (no direct download) -----
  const handleExportPDF = () => {
    if (!submitted) {
      alert('Please click Save before exporting.');
      return;
    }

    if (!rows || rows.length === 0) {
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
          <title>Material Correction Details</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 24px;
              color: #000000;
              background: #ffffff;
            }
            h2 {
              margin: 0 0 8px 0;
              font-size: 18px;
            }
            .card {
              border: 1px solid #000;
              padding: 12px 16px;
              border-radius: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 6px;
              text-align: center;
            }
            th {
              font-weight: 700;
            }
            .group-header {
              background: #e5e5e5;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Material Correction Details</h2>
            <table>
              <thead>
                <tr>
                  <th colspan="${chemicalCols.length}" class="group-header">Chemical Composition</th>
                  <th colspan="${processCols.length}" class="group-header">Process Parameters</th>
                </tr>
                <tr>
                  ${chemicalCols
                    .map((c) => `<th>${c.label}</th>`)
                    .join("")}
                  ${processCols
                    .map((c) => `<th>${c.label}</th>`)
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (row) => `
                  <tr>
                    ${chemicalCols
                      .map(
                        (c) =>
                          `<td>${row[c.key] && row[c.key].trim()
                            ? row[c.key]
                            : "--"}</td>`
                      )
                      .join("")}
                    ${processCols
                      .map(
                        (c) =>
                          `<td>${row[c.key] && row[c.key].trim()
                            ? row[c.key]
                            : "--"}</td>`
                      )
                      .join("")}
                  </tr>
                `
                  )
                  .join("")}
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

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          width: "100%",
          overflow: "hidden", // no scrollbar
          boxShadow: 1,
          border: "1px solid #c9bca3",
        }}
      >
        <Table
          size="small"
          aria-label="Material correction details table"
          sx={{
            tableLayout: "fixed",
            width: "100%",
          }}
        >
          <colgroup>
            {chemicalCols.map((col) => (
              <col
                key={col.key}
                style={{
                  width: `${100 / totalCols}%`,
                  minWidth: "80px",
                }}
              />
            ))}
            {processCols.map((col) => (
              <col
                key={col.key}
                style={{
                  width: `${100 / totalCols}%`,
                  minWidth: "100px",
                }}
              />
            ))}
          </colgroup>

          <TableHead>
            {/* Row 1: Title spanning full width */}
            <TableRow>
              <TableCell
                colSpan={totalCols}
                sx={{
                  backgroundColor: "#ffa319ff",
                  fontWeight: "bold",
                  borderBottom: "1px solid #acaaa6ff",
                  textAlign: "center",
                  py: 1.5,
                  fontSize: "1rem",
                }}
              >
                Material correction details:
              </TableCell>
            </TableRow>

            {/* Row 2: Group headers */}
            <TableRow>
              <TableCell
                colSpan={chemicalCols.length}
                sx={{
                  backgroundColor: "#ffa319ff",
                  fontWeight: "600",
                  borderRight: "1px solid #acaaa6ff",
                  textAlign: "center",
                  py: 1,
                }}
              >
                Chemical Composition:
              </TableCell>

              <TableCell
                colSpan={processCols.length}
                sx={{
                  backgroundColor: "#ffa319ff",
                  fontWeight: "600",
                  textAlign: "center",
                  py: 1,
                }}
              >
                Process parameters
              </TableCell>
            </TableRow>

            {/* Row 3: Column labels */}
            <TableRow>
              {chemicalCols.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    backgroundColor: "#f0e9d6",
                    fontWeight: "600",
                    textAlign: "center",
                    borderRight: "1px solid #d3c8b0",
                    paddingY: 1,
                    fontSize: "0.875rem",
                  }}
                >
                  {col.label}
                </TableCell>
              ))}

              {processCols.map((col, idx) => (
                <TableCell
                  key={col.key}
                  sx={{
                    backgroundColor: "#f0e9d6",
                    fontWeight: "600",
                    textAlign: "center",
                    paddingY: 1,
                    fontSize: "0.875rem",
                    borderRight:
                      idx === processCols.length - 1
                        ? "none"
                        : "1px solid #d3c8b0",
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {chemicalCols.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      padding: "4px 8px",
                      borderRight: "1px solid #eee",
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      value={row[col.key]}
                      onChange={(e) =>
                        handleInputChange(rowIndex, col.key, e.target.value)
                      }
                      placeholder={col.label}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "36px",
                        },
                        "& .MuiOutlinedInput-input": {
                          padding: "8px 10px",
                          textAlign: "center",
                          fontSize: "0.875rem",
                        },
                      }}
                    />
                  </TableCell>
                ))}

                {processCols.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      padding: "4px 8px",
                      position: "relative",
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      value={row[col.key]}
                      onChange={(e) =>
                        handleInputChange(rowIndex, col.key, e.target.value)
                      }
                      placeholder={col.label}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "36px",
                        },
                        "& .MuiOutlinedInput-input": {
                          padding: "8px 10px",
                          textAlign: "center",
                          fontSize: "0.875rem",
                        },
                      }}
                    />
                    {col.key === "inocType" && rowIndex === rows.length - 1 && (
                      <Box
                        sx={{
                          position: "absolute",
                          right: 4,
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          gap: 0.5,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => clearRow(rowIndex)}
                          title="Clear row"
                          sx={{
                            bgcolor: "#f5f5f5",
                            "&:hover": { bgcolor: "#e0e0e0" },
                            width: 24,
                            height: 24,
                          }}
                        >
                          {/* empty icon, just a small clickable pill */}
                        </IconButton>
                        {rows.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => removeRow(rowIndex)}
                            title="Delete row"
                            sx={{
                              bgcolor: "#ffebee",
                              "&:hover": { bgcolor: "#ffcdd2" },
                              width: 24,
                              height: 24,
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Footer with Clear All + Save and Continue */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #e0e0e0",
            backgroundColor: "#fafafa",
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={clearAll}
            sx={{ textTransform: "none", fontSize: "0.875rem" }}
          >
            Clear All
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={handleSaveAndContinue}
            sx={{
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Save and Continue
          </Button>
        </Box>
      </TableContainer>

      {/* -------- Apple Glass Preview Overlay (Visual Inspection style) -------- */}
      {previewOpen && (
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
                // Close preview and navigate to pouring page via router
                setPreviewOpen(false);
                navigate("/pouring");
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
                  Material Correction – Preview
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary" }}
                >
                  Review your data before final submission
                </Typography>
              </Box>
              <Chip
                label={`${rows.length} row${rows.length > 1 ? "s" : ""}`}
                sx={{ fontWeight: 700, bgcolor: "#eef2ff" }}
              />
            </Box>

            {/* Read-only preview using the props-based component */}
            <MaterialCorrectionTableWithProps
              initialData={rows}
              readOnly={true}
            />

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
                  minWidth: 180,
                  height: 44,
                  fontWeight: 700,
                  borderColor: "#2950bbff",
                  color: "#2950bbff",
                  bgcolor: "#ffffff",
                  "&:hover": {
                    bgcolor: "#f3f4ff",
                  },
                  "&.Mui-disabled": {
                    borderColor: "#d1d5db",
                    color: "#d1d5db",
                  },
                }}
              >
                Edit
              </Button>

              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleFinalSave}
                disabled={submitted}
                sx={{
                  minWidth: 180,
                  height: 44,
                  fontSize: "1rem",
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
                  },
                  "&:disabled": {
                    bgcolor: "#d1d5db",
                    color: "#374151",
                  },
                }}
              >
                {submitted ? "Submitted" : "Save"}
              </Button>

              {submitted && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleExportPDF}
                  sx={{
                    minWidth: 180,
                    height: 44,
                    fontWeight: 700,
                    borderColor: "#F59E0B",
                    color: "#F59E0B",
                    bgcolor: "#ffffff",
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
    </>
  );
}

// Optional: Create a version with props for parent component control
interface MaterialCorrectionTableProps {
  initialData?: RowData[];
  onChange?: (data: RowData[]) => void;
  readOnly?: boolean;
}

export function MaterialCorrectionTableWithProps({
  initialData = [{ ...initialRow }],
  onChange,
  readOnly = false,
}: MaterialCorrectionTableProps) {
  const [rows, setRows] = useState<RowData[]>(initialData);

  const handleInputChange = (
    rowIndex: number,
    fieldKey: string,
    value: string
  ) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][fieldKey] = value;
    setRows(updatedRows);

    // Notify parent component
    if (onChange) {
      onChange(updatedRows);
    }
  };

  const addRow = () => {
    const newRows = [...rows, { ...initialRow }];
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  const removeRow = (rowIndex: number) => {
    if (rows.length > 1) {
      const updatedRows = rows.filter((_, index) => index !== rowIndex);
      setRows(updatedRows);
      if (onChange) onChange(updatedRows);
    }
  };

  const clearAll = () => {
    const clearedRows = [{ ...initialRow }];
    setRows(clearedRows);
    if (onChange) onChange(clearedRows);
  };

  const totalCols = chemicalCols.length + processCols.length;

  return (
    <TableContainer
      component={Paper}
      sx={{
        width: "100%",
        overflow: "hidden",
        boxShadow: 1,
        border: "1px solid #c9bca3",
      }}
    >
      <Table
        size="small"
        aria-label="Material correction details table"
        sx={{
          tableLayout: "fixed",
          width: "100%",
        }}
      >
        <colgroup>
          {chemicalCols.map((col) => (
            <col
              key={col.key}
              style={{
                width: `${100 / totalCols}%`,
                minWidth: "80px",
              }}
            />
          ))}
          {processCols.map((col) => (
            <col
              key={col.key}
              style={{
                width: `${100 / totalCols}%`,
                minWidth: "100px",
              }}
            />
          ))}
        </colgroup>

        <TableHead>
          <TableRow>
            <TableCell
              colSpan={totalCols}
              sx={{
                backgroundColor: "#ffa319ff",
                fontWeight: "bold",
                borderBottom: "1px solid #acaaa6ff",
                textAlign: "center",
                py: 1.5,
                fontSize: "1rem",
              }}
            >
              Material correction details:
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell
              colSpan={chemicalCols.length}
              sx={{
                backgroundColor: "#ffa319ff",
                fontWeight: "600",
                borderRight: "1px solid #acaaa6ff",
                textAlign: "center",
                py: 1,
              }}
            >
              Chemical Composition:
            </TableCell>

            <TableCell
              colSpan={processCols.length}
              sx={{
                backgroundColor: "#ffa319ff",
                fontWeight: "600",
                textAlign: "center",
                py: 1,
              }}
            >
              Process parameters
            </TableCell>
          </TableRow>

          <TableRow>
            {chemicalCols.map((col) => (
              <TableCell
                key={col.key}
                sx={{
                  backgroundColor: "#f0e9d6",
                  fontWeight: "600",
                  textAlign: "center",
                  borderRight: "1px solid #d3c8b0",
                  paddingY: 1,
                  fontSize: "0.875rem",
                }}
              >
                {col.label}
              </TableCell>
            ))}

            {processCols.map((col, idx) => (
              <TableCell
                key={col.key}
                sx={{
                  backgroundColor: "#f0e9d6",
                  fontWeight: "600",
                  textAlign: "center",
                  paddingY: 1,
                  fontSize: "0.875rem",
                  borderRight:
                    idx === processCols.length - 1
                      ? "none"
                      : "1px solid #d3c8b0",
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {chemicalCols.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    padding: "4px 8px",
                    borderRight: "1px solid #eee",
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={row[col.key]}
                    onChange={(e) =>
                      handleInputChange(rowIndex, col.key, e.target.value)
                    }
                    placeholder={col.label}
                    disabled={readOnly}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "36px",
                      },
                      "& .MuiOutlinedInput-input": {
                        padding: "8px 10px",
                        textAlign: "center",
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                </TableCell>
              ))}

              {processCols.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    padding: "4px 8px",
                    position: "relative",
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={row[col.key]}
                    onChange={(e) =>
                      handleInputChange(rowIndex, col.key, e.target.value)
                    }
                    placeholder={col.label}
                    disabled={readOnly}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "36px",
                      },
                      "& .MuiOutlinedInput-input": {
                        padding: "8px 10px",
                        textAlign: "center",
                        fontSize: "0.875rem",
                      },
                    }}
                  />
                  {!readOnly &&
                    col.key === "inocType" &&
                    rowIndex === rows.length - 1 && (
                      <Box
                        sx={{
                          position: "absolute",
                          right: 4,
                          top: "50%",
                          transform: "translateY(-50%)",
                          display: "flex",
                          gap: 0.5,
                        }}
                      >
                        {rows.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => removeRow(rowIndex)}
                            title="Delete row"
                            sx={{
                              bgcolor: "#ffebee",
                              "&:hover": { bgcolor: "#ffcdd2" },
                              width: 24,
                              height: 24,
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!readOnly && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            borderTop: "1px solid #e0e0e0",
            backgroundColor: "#fafafa",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={clearAll}
              sx={{ textTransform: "none", fontSize: "0.875rem" }}
            >
              Clear All
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={addRow}
              startIcon={<AddIcon />}
              sx={{ textTransform: "none", fontSize: "0.875rem" }}
            >
              Add Row
            </Button>
          </Box>
        </Box>
      )}
    </TableContainer>
  );
}