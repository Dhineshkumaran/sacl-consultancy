import React, { useState } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

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

  // Function to get all data (for parent component)
  const getData = () => {
    return rows;
  };

  // Expose getData function for parent component access
  React.useEffect(() => {
    // @ts-ignore - Expose function to parent if needed
    window.getMaterialCorrectionData = getData;
  }, [rows]);

  return (
    <TableContainer
      component={Paper}
      sx={{
        width: "100%",
        overflow: "hidden", // Changed from "auto" to "hidden" to remove scrollbar
        boxShadow: 1,
        border: "1px solid #c9bca3",
      }}
    >
      <Table 
        size="small" 
        aria-label="Material correction details table"
        sx={{
          tableLayout: "fixed", // Fixed layout to prevent overflow
          width: "100%",
        }}
      >
        <colgroup>
          {chemicalCols.map((col, index) => (
            <col 
              key={col.key} 
              style={{ 
                width: `${100 / totalCols}%`, 
                minWidth: "80px" 
              }} 
            />
          ))}
          {processCols.map((col, index) => (
            <col 
              key={col.key} 
              style={{ 
                width: `${100 / totalCols}%`, 
                minWidth: "100px" 
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
                  borderRight: idx === processCols.length - 1 ? "none" : "1px solid #d3c8b0",
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
                    onChange={(e) => handleInputChange(rowIndex, col.key, e.target.value)}
                    placeholder={col.label}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
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
                    position: "relative"
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={row[col.key]}
                    onChange={(e) => handleInputChange(rowIndex, col.key, e.target.value)}
                    placeholder={col.label}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                  {col.key === "inocType" && rowIndex === rows.length - 1 && (
                    <Box sx={{ 
                      position: "absolute", 
                      right: 4, 
                      top: "50%", 
                      transform: "translateY(-50%)",
                      display: "flex",
                      gap: 0.5
                    }}>
                      <IconButton
                        size="small"
                        onClick={() => clearRow(rowIndex)}
                        title="Clear row"
                        sx={{ 
                          bgcolor: "#f5f5f5",
                          '&:hover': { bgcolor: "#e0e0e0" },
                          width: 24,
                          height: 24,
                        }}
                      >
                      </IconButton>
                      {rows.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeRow(rowIndex)}
                          title="Delete row"
                          sx={{ 
                            bgcolor: "#ffebee",
                            '&:hover': { bgcolor: "#ffcdd2" },
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
      
      <Box sx={{ 
        px: 2, 
        py: 1.5, 
        display: "flex", 
        justifyContent: "flex-end", 
        alignItems: "center",
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#fafafa"
      }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setRows([{ ...initialRow }])}
            sx={{ textTransform: "none", fontSize: '0.875rem' }}
          >
            Clear All
          </Button>
          
        </Box>
      </Box>
    </TableContainer>
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

  const clearRow = (rowIndex: number) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = { ...initialRow };
    setRows(updatedRows);
    if (onChange) onChange(updatedRows);
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
          {chemicalCols.map((col, index) => (
            <col 
              key={col.key} 
              style={{ 
                width: `${100 / totalCols}%`, 
                minWidth: "80px" 
              }} 
            />
          ))}
          {processCols.map((col, index) => (
            <col 
              key={col.key} 
              style={{ 
                width: `${100 / totalCols}%`, 
                minWidth: "100px" 
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
                  borderRight: idx === processCols.length - 1 ? "none" : "1px solid #d3c8b0",
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
                    onChange={(e) => handleInputChange(rowIndex, col.key, e.target.value)}
                    placeholder={col.label}
                    disabled={readOnly}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
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
                    position: "relative"
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={row[col.key]}
                    onChange={(e) => handleInputChange(rowIndex, col.key, e.target.value)}
                    placeholder={col.label}
                    disabled={readOnly}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                  {!readOnly && col.key === "inocType" && rowIndex === rows.length - 1 && (
                    <Box sx={{ 
                      position: "absolute", 
                      right: 4, 
                      top: "50%", 
                      transform: "translateY(-50%)",
                      display: "flex",
                      gap: 0.5
                    }}>
                      
                      {rows.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeRow(rowIndex)}
                          title="Delete row"
                          sx={{ 
                            bgcolor: "#ffebee",
                            '&:hover': { bgcolor: "#ffcdd2" },
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
        <Box sx={{ 
          px: 2, 
          py: 1.5, 
          display: "flex", 
          justifyContent: "flex-end", 
          alignItems: "center",
          borderTop: "1px solid #e0e0e0",
          backgroundColor: "#fafafa"
        }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={clearAll}
              sx={{ textTransform: "none", fontSize: '0.875rem' }}
            >
              Clear All
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={addRow}
              startIcon={<AddIcon />}
              sx={{ textTransform: "none", fontSize: '0.875rem' }}
            >
              Add Row
            </Button>
          </Box>
        </Box>
      )}
    </TableContainer>
  );
}