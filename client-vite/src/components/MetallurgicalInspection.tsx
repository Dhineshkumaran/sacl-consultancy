import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import NoPendingWorks from "./common/NoPendingWorks";
import { useAuth } from "../context/AuthContext";
import { updateDepartment, updateDepartmentRole } from "../services/departmentProgressService";
import type { Dispatch, SetStateAction } from "react";
import {
  Paper,
  Typography,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ThemeProvider,
  createTheme,
  Button,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Container,
  Grid,
  Chip,
  Divider,
  GlobalStyles
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useNavigate } from "react-router-dom";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FactoryIcon from '@mui/icons-material/Factory';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { inspectionService } from '../services/inspectionService';
import { uploadFiles } from '../services/fileUploadHelper';
import { COLORS, appTheme } from '../theme/appTheme';
import { useAlert } from '../hooks/useAlert';
import { AlertMessage } from './common/AlertMessage';
import { fileToMeta, generateUid, validateFileSizes } from '../utils';
import SaclHeader from "./common/SaclHeader";
import DepartmentHeader from "./common/DepartmentHeader";
import { LoadingState, EmptyState, ActionButtons, PreviewModal, Common, FileUploadSection, DocumentViewer } from './common';
import { ipService } from "../services/ipService";

interface Row {
  id: string;
  label: string;
  attachment: File | null;
  ok: boolean | null;
  remarks: string;
  value?: string;
  total?: number | null;
}

interface MicroCol {
  id: string;
  label: string;
}

const initialRows = (labels: string[]): Row[] =>
  labels.map((label, i) => ({
    id: `${label}-${i}`,
    label,
    attachment: null,
    ok: null,
    remarks: "",
    total: null,
  }));

const MICRO_PARAMS = ["Cavity Number", "Nodularity", "Matrix", "Carbide", "Inclusion"];

function SectionTable({
  title,
  rows,
  onChange,
  showTotal = false,
  onValidationError,
  showAlert,
  user,
  isEditing,
}: {
  title: string;
  rows: Row[];
  onChange: (id: string, patch: Partial<Row>) => void;
  showTotal?: boolean;
  onValidationError?: (message: string) => void;
  showAlert?: (severity: 'success' | 'error', message: string) => void;
  user: any;
  isEditing: boolean;
}) {
  const [cols, setCols] = useState<MicroCol[]>(() => {
    const maxLen = Math.max(...rows.map(r => (r.value ? r.value.split('|').length : 1)), 1);
    return Array.from({ length: maxLen }, (_, i) => ({ id: `c${i + 1}`, label: '' })); // Labels lost in string storage
  });

  const [values, setValues] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    rows.forEach((r) => {
      init[r.id] = r.value ? r.value.split('|').map(s => s.trim()) : Array(cols.length).fill('');
    });
    return init;
  });

  const [groupMeta, setGroupMeta] = useState<{ attachment: File | null; ok: boolean | null; remarks: string }>(() => ({ attachment: null, ok: null, remarks: '' }));

  useEffect(() => {
    if (rows.length > 0) {
      const firstWithStatus = rows.find(r => r.ok !== null && r.ok !== undefined);
      if (firstWithStatus) {
        setGroupMeta(prev => ({
          ...prev,
          ok: firstWithStatus.ok,
          remarks: firstWithStatus.remarks || prev.remarks || ""
        }));
      }
    }
  }, [rows]);

  useEffect(() => {
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      rows.forEach((r) => { copy[r.id] = prev[r.id] ?? (r.value ? r.value.split('|').map(s => s.trim()) : Array(cols.length).fill('')); });
      return copy;
    });
  }, [rows]);

  const addColumn = () => {
    setCols((prev) => [...prev, { id: `c${prev.length + 1}`, label: '' }]);
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => { copy[k] = [...prev[k], '']; });
      return copy;
    });
  };

  const removeColumn = (index: number) => {
    setCols((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => {
        const arr = [...prev[k]];
        if (arr.length > index) arr.splice(index, 1);
        copy[k] = arr;
      });
      return copy;
    });
  };


  const updateCell = (rowId: string, colIndex: number, val: string) => {
    setValues((prev) => {
      const arr = prev[rowId].map((v, i) => (i === colIndex ? val : v));
      let copy = { ...prev, [rowId]: arr };

      if (title === "NDT INSPECTION ANALYSIS") {
        const inspectedRow = rows.find(r => r.label.toLowerCase().includes('inspected'));
        const acceptedRow = rows.find(r => r.label.toLowerCase().includes('accepted'));
        const rejectedRow = rows.find(r => r.label.toLowerCase().includes('rejected'));

        if (inspectedRow && acceptedRow && rejectedRow) {
          const inspectedValues = copy[inspectedRow.id] || [];
          const acceptedValues = copy[acceptedRow.id] || [];
          const rejectedValues = [...(copy[rejectedRow.id] || [])];

          const inspectedNum = parseFloat(String(inspectedValues[colIndex] || '').trim());
          const acceptedNum = parseFloat(String(acceptedValues[colIndex] || '').trim());

          if (!isNaN(inspectedNum) && !isNaN(acceptedNum)) {
            if (acceptedNum > inspectedNum) {
              rejectedValues[colIndex] = 'Invalid';
              if (onValidationError) {
                onValidationError(`Column ${colIndex + 1}: Accepted quantity (${acceptedNum}) cannot be greater than Inspected quantity (${inspectedNum})`);
              }
            } else {
              const calculatedRejected = inspectedNum - acceptedNum;
              rejectedValues[colIndex] = calculatedRejected >= 0 ? calculatedRejected.toString() : '';
            }
            copy = { ...copy, [rejectedRow.id]: rejectedValues };

            const rejectedCombined = rejectedValues.map(v => v || "").join(' | ');
            onChange(rejectedRow.id, { value: rejectedCombined });
          }
        }
      }

      const combined = arr.map(v => v || "").join(' | ');
      const total = arr.reduce((acc, s) => {
        const n = parseFloat(String(s).trim());
        return acc + (isNaN(n) ? 0 : n);
      }, 0);
      onChange(rowId, { value: combined, total });
      return copy;
    });
  };


  const updateGroupMeta = (patch: Partial<{ attachment: File | null; ok: boolean | null; remarks: string }>) => {
    setGroupMeta((prev) => ({ ...prev, ...patch }));
    rows.forEach(r => {
      onChange(r.id, { ...patch });
    });
  };

  const cavityRow = rows.find(r => r.label === "Cavity Number");
  const dataRows = rows.filter(r => r.label !== "Cavity Number");

  return (
    <Box mb={4}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

      <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 180 }}>Parameter</TableCell>
              {cols.map((c, ci) => (
                <TableCell key={c.id} sx={{ minWidth: 140 }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                    <TextField
                      size="small"
                      value={c.label}
                      onChange={(e) => setCols((prev) => prev.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                      variant="standard"
                      InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                      sx={{ input: { textAlign: 'center' } }}
                      disabled={user?.role === 'HOD' && !isEditing}
                    />
                    <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={user?.role === 'HOD' && !isEditing}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}

              {showTotal && (
                <TableCell sx={{ width: 120, bgcolor: '#f1f5f9', fontWeight: 700, textAlign: 'center' }}>
                  Total
                </TableCell>
              )}

              <TableCell sx={{ width: 140, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>OK / NOT OK</TableCell>
              <TableCell sx={{ bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>Cavity Number</TableCell>
              {cols.map((c, ci) => (
                <TableCell key={c.id} sx={{ bgcolor: '#f8fafc' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={cavityRow ? (values[cavityRow.id]?.[ci] ?? "") : ""}
                    onChange={(e) => cavityRow && updateCell(cavityRow.id, ci, e.target.value)}
                    variant="outlined"
                    sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                    disabled={user?.role === 'HOD' && !isEditing}
                  />
                </TableCell>
              ))}

              {showTotal && <TableCell rowSpan={1} sx={{ bgcolor: '#f8fafc' }} />}

              <TableCell rowSpan={rows.length + (title === "NDT INSPECTION ANALYSIS" ? 2 : 1)} sx={{ bgcolor: COLORS.successBg, verticalAlign: "middle", textAlign: 'center', width: 140, borderBottom: 'none' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <RadioGroup row sx={{ justifyContent: 'center' }} value={groupMeta.ok === null ? "" : String(groupMeta.ok)} onChange={(e) => updateGroupMeta({ ok: e.target.value === "true" })}>
                    <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} disabled={user?.role === 'HOD' && !isEditing} />
                    <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} disabled={user?.role === 'HOD' && !isEditing} />
                  </RadioGroup>
                </Box>
              </TableCell>

              <TableCell rowSpan={rows.length + (title === "NDT INSPECTION ANALYSIS" ? 2 : 1)} sx={{ bgcolor: '#fff7ed', verticalAlign: "top", borderBottom: 'none' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    value={groupMeta.remarks}
                    onChange={(e) => updateGroupMeta({ remarks: e.target.value })}
                    placeholder="Enter remarks..."
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                    disabled={user?.role === 'HOD' && !isEditing}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                    <input accept="image/*,application/pdf" style={{ display: 'none' }} id={`${title}-group-file`} type="file" onChange={(e) => { const file = e.target.files?.[0] ?? null; if (file) { const validation = validateFileSizes([file]); if (!validation.isValid) { validation.errors.forEach((error: string) => { if (showAlert) showAlert('error', error); }); e.target.value = ''; return; } } updateGroupMeta({ attachment: file }); }} disabled={user?.role === 'HOD' && !isEditing} />
                    <label htmlFor={`${title}-group-file`}>
                      <Button component="span" size="small" variant="outlined" startIcon={<UploadFileIcon />} sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }} disabled={user?.role === 'HOD' && !isEditing}>
                        Attach PDF
                      </Button>
                    </label>

                    {groupMeta.attachment && (
                      <Chip
                        icon={<InsertDriveFileIcon />}
                        label={groupMeta.attachment.name}
                        onDelete={() => updateGroupMeta({ attachment: null })}
                        size="small"
                        variant="outlined"
                        sx={{ maxWidth: 120 }}
                        disabled={user?.role === 'HOD' && !isEditing}
                      />
                    )}
                  </Box>
                </Box>
              </TableCell>
            </TableRow>

            {dataRows.map((r: Row, idx: number) => {
              const rowVals = values[r.id] ?? [];
              const displayTotal = rowVals.reduce((acc, s) => {
                const n = parseFloat(String(s).trim());
                return acc + (isNaN(n) ? 0 : n);
              }, 0);
              const totalToShow = rowVals.some(v => v && !isNaN(parseFloat(String(v)))) ? displayTotal : (r.total ?? null);

              const inspectedRow = rows.find(rr => rr.label.toLowerCase().includes('inspected'));
              const isAcceptedOrRejected = r.label.toLowerCase().includes('accepted') || r.label.toLowerCase().includes('rejected');

              return (
                <TableRow key={r.id}>
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>{r.label}</TableCell>

                  {cols.map((c, ci) => {
                    const inspectedValue = inspectedRow ? (values[inspectedRow.id]?.[ci] ?? "") : "";
                    const isRejectedQty = r.label.toLowerCase().includes('rejected') && !r.label.toLowerCase().includes('reason');
                    const isAcceptedQty = r.label.toLowerCase().includes('accepted');

                    const inspectedNum = inspectedRow ? parseFloat(String(values[inspectedRow.id]?.[ci] ?? '').trim()) : NaN;
                    const acceptedNum = isAcceptedQty ? parseFloat(String(values[r.id]?.[ci] ?? '').trim()) : NaN;
                    const isInvalid = title === "NDT INSPECTION ANALYSIS" && !isNaN(inspectedNum) && !isNaN(acceptedNum) && acceptedNum > inspectedNum;
                    const rejectedValue = isRejectedQty ? (values[r.id]?.[ci] ?? "") : "";
                    const isRejectedInvalid = rejectedValue === 'Invalid';

                    const isFieldDisabled = (user?.role === 'HOD' && !isEditing) ||
                      (title === "NDT INSPECTION ANALYSIS" && isAcceptedOrRejected && !inspectedValue) ||
                      (title === "NDT INSPECTION ANALYSIS" && isRejectedQty);

                    return (
                      <TableCell key={c.id} sx={{ display: r.label.toLowerCase().includes('reason') ? 'none' : 'table-cell' }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={values[r.id]?.[ci] ?? ""}
                          onChange={(e) => updateCell(r.id, ci, e.target.value)}
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-input": {
                              textAlign: 'center',
                              fontFamily: 'Roboto Mono',
                              fontSize: '0.85rem',
                              bgcolor: isRejectedQty ? '#f3f4f6' : (isInvalid || isRejectedInvalid) ? '#fee2e2' : 'inherit'
                            }
                          }}
                          disabled={isFieldDisabled}
                          error={isInvalid || isRejectedInvalid}
                        />
                      </TableCell>
                    );
                  })}


                  {r.label.toLowerCase().includes('reason') && (
                    <TableCell colSpan={cols.length + (showTotal ? 1 : 0)}>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        value={values[r.id]?.[0] ?? ""}
                        onChange={(e) => updateCell(r.id, 0, e.target.value)}
                        placeholder="Enter reason for rejection..."
                        variant="outlined"
                        sx={{ "& .MuiInputBase-input": { fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                        disabled={user?.role === 'HOD' && !isEditing}
                      />
                    </TableCell>
                  )}

                  {showTotal && !r.label.toLowerCase().includes('reason') && (
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                      {totalToShow !== null && totalToShow !== undefined ? totalToShow : "-"}
                    </TableCell>
                  )}


                </TableRow>
              );
            })}

            {title === "NDT INSPECTION ANALYSIS" && (() => {
              const inspected = rows.find(rr => rr.label.toLowerCase().includes('inspected'));
              const rejected = rows.find(rr => rr.label.toLowerCase().includes('rejected'));
              if (!inspected || !rejected) return null;
              return (
                <TableRow key="rejection-percentage">
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>Rejection Percentage</TableCell>
                  {cols.map((_, ci) => {
                    const insValRaw = values[inspected.id]?.[ci] ?? "";
                    const rejValRaw = values[rejected.id]?.[ci] ?? "";
                    const insNum = parseFloat(String(insValRaw).trim());
                    const rejNum = parseFloat(String(rejValRaw).trim());

                    let cellContent = '-';
                    let bgColor = '#fff';

                    if (!isNaN(rejNum) && !isNaN(insNum) && rejNum > insNum) {
                      cellContent = 'Invalid';
                      bgColor = '#fee2e2';
                      if (onValidationError) {
                        onValidationError(`Column ${ci + 1}: Rejected quantity (${rejNum}) cannot be greater than Inspected quantity (${insNum})`);
                      }
                    } else if (!isNaN(insNum) && insNum > 0 && !isNaN(rejNum)) {
                      const percent = (rejNum / insNum) * 100;
                      cellContent = `${percent.toFixed(2)}%`;
                    }

                    return (
                      <TableCell key={`rej-${ci}`} sx={{ textAlign: 'center', bgcolor: bgColor, cursor: 'pointer' }}>
                        {cellContent}
                      </TableCell>
                    );
                  })}

                  {showTotal && (() => {
                    const inspectedRow = rows.find(rr => rr.label.toLowerCase().includes('inspected'));
                    const rejectedRow = rows.find(rr => rr.label.toLowerCase().includes('rejected') && !rr.label.toLowerCase().includes('percentage'));

                    if (!inspectedRow || !rejectedRow) return <TableCell sx={{ bgcolor: '#fff' }} />;

                    const inspectedVals = values[inspectedRow.id] || [];
                    const rejectedVals = values[rejectedRow.id] || [];

                    const totalInspected = inspectedVals.reduce((acc, v) => {
                      const n = parseFloat(String(v).trim());
                      return acc + (isNaN(n) ? 0 : n);
                    }, 0);

                    const totalRejected = rejectedVals.reduce((acc, v) => {
                      const n = parseFloat(String(v).trim());
                      return acc + (isNaN(n) ? 0 : n);
                    }, 0);

                    let totalPercentage = '-';
                    if (totalInspected > 0 && !isNaN(totalRejected)) {
                      const percent = (totalRejected / totalInspected) * 100;
                      totalPercentage = `${percent.toFixed(2)}%`;
                    }

                    return (
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, bgcolor: '#f8fafc' }}>
                        {totalPercentage}
                      </TableCell>
                    );
                  })()}
                </TableRow>
              );
            })()}
          </TableBody>
        </Table>
      </Box>

      <Button
        size="small"
        onClick={addColumn}
        startIcon={<AddCircleIcon />}
        sx={{ mt: 1, color: COLORS.secondary }}
        disabled={user?.role === 'HOD' && !isEditing}
      >
        Add Column
      </Button>
    </Box>
  );
}

function MicrostructureTable({
  params,
  cols,
  values,
  meta,
  setCols,
  setValues,
  setMeta,
  showAlert,
  user,
  isEditing,
}: {
  params: string[];
  cols: MicroCol[];
  values: Record<string, string[]>;
  meta: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }>;
  setCols: (c: MicroCol[] | ((prev: MicroCol[]) => MicroCol[])) => void;
  setValues: (v: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
  setMeta: (m: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }> | ((prev: any) => any)) => void;
  showAlert?: (severity: 'success' | 'error', message: string) => void;
  user: any;
  isEditing: boolean;
}) {
  const [cavityNumbers, setCavityNumbers] = useState<string[]>(['']);

  const addColumn = () => {
    setCols((prev: MicroCol[]) => {
      const nextIndex = prev.length + 1;
      return [...prev, { id: `c${nextIndex}`, label: '' }];
    });

    setCavityNumbers((prev) => [...prev, '']);
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => { copy[k] = [...prev[k], ""]; });
      return copy;
    });
  };

  const removeColumn = (index: number) => {
    setCols((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setCavityNumbers((prev) => {
      const arr = [...prev];
      if (arr.length > index) arr.splice(index, 1);
      return arr.length > 0 ? arr : [''];
    });
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => {
        const arr = [...prev[k]];
        if (arr.length > index) arr.splice(index, 1);
        copy[k] = arr;
      });
      return copy;
    });
  };

  const updateCell = (param: string, colIndex: number, val: string) => {
    setValues((prev) => ({ ...prev, [param]: prev[param].map((v, i) => (i === colIndex ? val : v)) }));
  };

  const updateMeta = (param: string, patch: Partial<{ attachment: File | null; ok: boolean | null; remarks: string }>) => {
    setMeta((prev: any) => ({ ...prev, [param]: { ...prev[param], ...patch } }));
  };

  return (
    <Box mb={4}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>MICROSTRUCTURE EXAMINATION RESULT</Typography>
      </Box>
      <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

      <Box sx={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 180 }}>Parameter</TableCell>
              {cols.map((c, ci) => (
                <TableCell key={c.id} sx={{ minWidth: 140 }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                    <TextField
                      size="small"
                      value={c.label}
                      onChange={(e) => setCols((prev) => prev.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                      variant="standard"
                      InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                      sx={{ input: { textAlign: 'center' } }}
                      disabled={user?.role === 'HOD' && !isEditing}
                    />
                    <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={user?.role === 'HOD' && !isEditing}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}
              <TableCell sx={{ width: 140, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>OK / NOT OK</TableCell>
              <TableCell sx={{ width: 240, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks & Files</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {params.map((param, pIndex) => (
              <TableRow key={param}>
                <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>
                  {param}
                </TableCell>
                {cols.map((c, ci) => (
                  <TableCell key={c.id}>
                    <TextField
                      size="small"
                      fullWidth
                      value={values[param]?.[ci] ?? ""}
                      onChange={(e) => updateCell(param, ci, e.target.value)}
                      variant="outlined"
                      sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                      disabled={user?.role === 'HOD' && !isEditing}
                    />
                  </TableCell>
                ))}

                {pIndex === 0 ? (
                  <>
                    <TableCell rowSpan={params.length} sx={{ bgcolor: COLORS.successBg, verticalAlign: "middle", textAlign: 'center' }}>
                      <RadioGroup
                        row
                        sx={{ justifyContent: 'center' }}
                        value={meta["group"]?.ok === null ? "" : String(meta["group"]?.ok)}
                        onChange={(e) => updateMeta("group", { ok: e.target.value === "true" })}
                      >
                        <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} disabled={user?.role === 'HOD' && !isEditing} />
                        <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} disabled={user?.role === 'HOD' && !isEditing} />
                      </RadioGroup>
                    </TableCell>

                    <TableCell rowSpan={params.length} colSpan={6} sx={{ bgcolor: '#fff7ed', verticalAlign: "top" }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={3}
                          value={meta["group"]?.remarks ?? ""}
                          onChange={(e) => updateMeta("group", { remarks: e.target.value })}
                          placeholder="Enter remarks..."
                          variant="outlined"
                          sx={{ bgcolor: 'white' }}
                          disabled={user?.role === 'HOD' && !isEditing}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                          <input accept="image/*,application/pdf" style={{ display: 'none' }} id={`micro-group-file`} type="file" onChange={(e) => { const file = e.target.files?.[0] ?? null; if (file) { const validation = validateFileSizes([file]); if (!validation.isValid) { validation.errors.forEach((error: string) => { if (showAlert) showAlert('error', error); }); e.target.value = ''; return; } } updateMeta('group', { attachment: file }); }} disabled={user?.role === 'HOD' && !isEditing} />
                          <label htmlFor={`micro-group-file`}>
                            <Button component="span" size="small" variant="outlined" startIcon={<UploadFileIcon />} sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }} disabled={user?.role === 'HOD' && !isEditing}>
                              Attach PDF
                            </Button>
                          </label>

                          {meta['group']?.attachment && (
                            <Chip
                              icon={<InsertDriveFileIcon />}
                              label={meta['group']?.attachment?.name}
                              onDelete={() => updateMeta('group', { attachment: null })}
                              size="small"
                              variant="outlined"
                              sx={{ maxWidth: 120 }}
                              disabled={user?.role === 'HOD' && !isEditing}
                            />
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
      </Box>
      <Button size="small" onClick={addColumn} startIcon={<AddCircleIcon />} sx={{ mt: 1, color: COLORS.secondary }} disabled={user?.role === 'HOD' && !isEditing}>Add Column</Button>
    </Box>
  );
}

export default function MetallurgicalInspection() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [userIP, setUserIP] = useState<string>("Loading...");
  const { alert, showAlert } = useAlert();
  const [loadKey, setLoadKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [ndtValidationError, setNdtValidationError] = useState<string | null>(null);

  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [microCols, setMicroCols] = useState<MicroCol[]>([{ id: 'c1', label: '' }]);
  const [microValues, setMicroValues] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    MICRO_PARAMS.forEach((p) => { init[p] = ['']; });
    return init;
  });
  const [microMeta, setMicroMeta] = useState<Record<string, { attachment: File | null; ok: boolean | null; remarks: string }>>(() => {
    const init: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }> = {};
    MICRO_PARAMS.forEach((p) => { init[p] = { attachment: null, ok: null, remarks: '' }; });
    init['group'] = { attachment: null, ok: null, remarks: '' };
    return init;
  });

  const [mechRows, setMechRows] = useState<Row[]>(initialRows(["Cavity Number", "Tensile strength", "Yield strength", "Elongation"]));
  const [impactRows, setImpactRows] = useState<Row[]>(initialRows(["Cavity Number", "Cold Temp °C", "Room Temp °C"]));
  const [hardRows, setHardRows] = useState<Row[]>(initialRows(["Cavity Number", "Surface", "Core"]));
  const [ndtRows, setNdtRows] = useState<Row[]>(initialRows(["Cavity Number", "Inspected Qty", "Accepted Qty", "Rejected Qty", "Reason for Rejection"]));

  const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";

  const handleAttachFiles = (newFiles: File[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchIP();
  }, []);



  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'HOD' && trialId) {
        try {
          const response = await inspectionService.getMetallurgicalInspection(trialId);
          if (response.success && response.data && response.data.length > 0) {
            const data = response.data[0];
            setDate(data.inspection_date ? new Date(data.inspection_date).toISOString().slice(0, 10) : "");

            const parseRows = (jsonStr: string | object) => {
              if (!jsonStr) return [];
              const arr = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
              return Array.isArray(arr) ? arr : [];
            };

            if (data.micro_structure) {
              const microData = parseRows(data.micro_structure);
              if (microData.length > 0) {
                const colsCount = Math.max(...microData.map((m: any) => m.values ? m.values.length : 0), 1);
                setMicroCols(Array.from({ length: colsCount }, (_, i) => ({ id: `c${i + 1}`, label: '' })));

                const newValues: any = {};
                microData.forEach((row: any) => {
                  newValues[row.label] = row.values || [];
                });
                setMicroValues(prev => ({ ...prev, ...newValues }));

                setMicroMeta(prev => ({
                  ...prev,
                  'group': {
                    ok: data.micro_structure_ok === null || data.micro_structure_ok === undefined ? null : (data.micro_structure_ok === true || data.micro_structure_ok === 1 || String(data.micro_structure_ok) === "1" || String(data.micro_structure_ok) === "true"),
                    remarks: data.micro_structure_remarks || "",
                    attachment: null
                  }
                }));
              }
            }

            const restoreSection = (source: any) => {
              const arr = parseRows(source);
              return arr.map((r: any) => ({
                id: r.label + "-" + generateUid(),
                label: r.label,
                value: Array.isArray(r.values) ? r.values.join(' | ') : r.value,
                ok: r.ok === null || r.ok === undefined ? null : (r.ok === true || String(r.ok) === "1" || String(r.ok) === "true"),
                remarks: r.remarks,
                total: r.total,
                attachment: null
              }));
            }

            if (data.mech_properties) setMechRows(restoreSection(data.mech_properties));
            if (data.impact_strength) setImpactRows(restoreSection(data.impact_strength));
            if (data.hardness) setHardRows(restoreSection(data.hardness));
            if (data.ndt_inspection) setNdtRows(restoreSection(data.ndt_inspection));

            setLoadKey(prev => prev + 1);
          }
        } catch (error) {
          console.error("Failed to fetch metallurgical data:", error);
          showAlert('error', 'Failed to load existing data.');
        }
      }
    };
    if (trialId) fetchData();
  }, [user, trialId]);



  const updateRow = (setRows: React.Dispatch<React.SetStateAction<Row[]>>) => (id: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const buildPayload = () => {
    const mapRows = (rows: Row[]) => rows.map((r) => ({
      label: r.label,
      value: r.value ?? null,
      ok: r.ok === null ? null : Boolean(r.ok),
      remarks: r.remarks ?? "",
      attachment: fileToMeta(r.attachment),
      total: r.total ?? null,
    }));

    const microRowsPayload = MICRO_PARAMS.map((p) => ({
      label: p,
      values: (microValues[p] || []).map((v) => (v === '' ? null : v)),
      ok: microMeta['group']?.ok ?? null,
      remarks: microMeta['group']?.remarks ?? "",
      attachment: fileToMeta(microMeta['group']?.attachment ?? null),
    }));

    const ndtMapped = mapRows(ndtRows);
    const findByLabel = (arr: any[], key: string) => arr.find((x: any) => (x.label || '').toLowerCase().includes(key));
    const inspectedMapped = findByLabel(ndtMapped, 'inspected');
    const rejectedMapped = findByLabel(ndtMapped, 'rejected');
    if (inspectedMapped && rejectedMapped) {
      const insValues = (inspectedMapped.value || '').split(' | ').map((s: string) => s.trim());
      const rejValues = (rejectedMapped.value || '').split(' | ').map((s: string) => s.trim());
      const maxCols = Math.max(insValues.length, rejValues.length, 1);
      const percents: string[] = [];
      for (let i = 0; i < maxCols; i++) {
        const insN = parseFloat(insValues[i] ?? '');
        const rejN = parseFloat(rejValues[i] ?? '');
        if (!isNaN(insN) && insN > 0 && !isNaN(rejN) && rejN <= insN) {
          percents.push(`${((rejN / insN) * 100).toFixed(2)}%`);
        } else {
          percents.push(rejN > insN ? 'Invalid' : '-');
        }
      }
      ndtMapped.push({
        label: 'Rejection Percentage',
        value: percents.join(' | '),
        ok: null,
        remarks: "",
        attachment: null,
        total: null,
      });
    }

    return {
      inspection_date: date || null,
      microRows: microRowsPayload,
      mechRows: mapRows(mechRows),
      impactRows: mapRows(impactRows),
      hardRows: mapRows(hardRows),
      ndtRows: ndtMapped,
      status: "draft",
    };
  };

  const handleSaveAndContinue = async () => {
    const payload = buildPayload();
    setPreviewPayload(payload);
    setPreviewMode(true);
    setPreviewSubmitted(false);
    setMessage(null);
  };

  const handleFinalSave = async () => {
    if (!previewPayload) return;

    const transformToServerPayload = (payload: any) => {
      const microOk = microMeta['group']?.ok ?? null;
      const microRemarks = microMeta['group']?.remarks ?? '';

      const getMechOk = () => {
        const hasNotOk = payload.mechRows?.some((r: any) => r.ok === false);
        if (hasNotOk) return false;
        const hasOk = payload.mechRows?.some((r: any) => r.ok === true);
        return hasOk ? true : null;
      };

      const getImpactOk = () => {
        const hasNotOk = payload.impactRows?.some((r: any) => r.ok === false);
        if (hasNotOk) return false;
        const hasOk = payload.impactRows?.some((r: any) => r.ok === true);
        return hasOk ? true : null;
      };

      const getHardnessOk = () => {
        const hasNotOk = payload.hardRows?.some((r: any) => r.ok === false);
        if (hasNotOk) return false;
        const hasOk = payload.hardRows?.some((r: any) => r.ok === true);
        return hasOk ? true : null;
      };

      const getNdtOk = () => {
        const hasNotOk = payload.ndtRows?.some((r: any) => r.ok === false);
        if (hasNotOk) return false;
        const hasOk = payload.ndtRows?.some((r: any) => r.ok === true);
        return hasOk ? true : null;
      };

      const getMechRemarks = () => payload.mechRows?.map((r: any) => r.remarks).filter(Boolean).join('; ') || '';
      const getImpactRemarks = () => payload.impactRows?.map((r: any) => r.remarks).filter(Boolean).join('; ') || '';
      const getHardnessRemarks = () => payload.hardRows?.map((r: any) => r.remarks).filter(Boolean).join('; ') || '';
      const getNdtRemarks = () => payload.ndtRows?.map((r: any) => r.remarks).filter(Boolean).join('; ') || '';

      return {
        trial_id: trialId,
        inspection_date: payload.inspection_date,
        micro_structure: payload.microRows || [],
        micro_structure_ok: microOk,
        micro_structure_remarks: microRemarks,
        mech_properties: payload.mechRows || [],
        mech_properties_ok: getMechOk(),
        mech_properties_remarks: getMechRemarks(),
        impact_strength: payload.impactRows || [],
        impact_strength_ok: getImpactOk(),
        impact_strength_remarks: getImpactRemarks(),
        hardness: payload.hardRows || [],
        hardness_ok: getHardnessOk(),
        hardness_remarks: getHardnessRemarks(),
        ndt_inspection: payload.ndtRows || [],
        ndt_inspection_ok: getNdtOk(),
        ndt_inspection_remarks: getNdtRemarks()
      };
    };

    if (user?.role === 'HOD' && trialId) {
      setSending(true);
      try {
        if (isEditing) {
          const serverPayload = transformToServerPayload(previewPayload);
          await inspectionService.updateMetallurgicalInspection(serverPayload);
        }

        const approvalPayload = {
          trial_id: trialId,
          next_department_id: 5,
          username: user.username,
          current_form: "VISUAL_INSPECTION",
          role: user.role,
          remarks: "Approved by HOD"
        };
        await updateDepartment(approvalPayload);
        setPreviewSubmitted(true);
        showAlert('success', 'Department progress approved successfully.');
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (err) {
        showAlert('error', 'Failed to approve. Please try again.');
        console.error(err);
      } finally {
        setSending(false);
      }
      return;
    }

    try {
      setSending(true);

      const serverPayload = transformToServerPayload(previewPayload);
      await inspectionService.submitMetallurgicalInspection(serverPayload);

      if (trialId) {
        try {
          await updateDepartmentRole({
            trial_id: trialId,
            current_department_id: 7,
            username: user?.username || "user",
            role: "user",
            remarks: "Completed by user"
          });
        } catch (roleError) {
          console.error("Failed to update role progress:", roleError);
        }
      }

      if (attachedFiles.length > 0) {
        try {
          const uploadResults = await uploadFiles(
            attachedFiles,
            trialId,
            "METALLURGICAL_INSPECTION",
            user?.username || "system",
            "METALLURGICAL_INSPECTION"
          );

          const failures = uploadResults.filter(r => !r.success);
          if (failures.length > 0) {
            console.error("Some files failed to upload:", failures);
            showAlert('warning', 'Some files failed to upload, but inspection data was saved.');
          }
          setPreviewSubmitted(true);
          showAlert('success', 'Metallurgical inspection created and department progress updated successfully.');
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          showAlert('warning', 'File upload failed, but inspection data was saved.');
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      setMessage('Failed to submit inspection data');
      showAlert('error', err.message || 'Failed to submit inspection data');
    } finally {
      setSending(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const PreviewSectionTable = ({ title, rows }: { title: string, rows: any[] }) => {
    const hasTotal = rows.some(r => typeof r.total === 'number' && !isNaN(r.total));
    const firstRow = rows[0];
    const okValue = firstRow?.ok;
    const remarksValue = firstRow?.remarks;

    return (
      <Box mt={2} mb={3}>
        <Typography variant="subtitle2" sx={{ bgcolor: '#f1f5f9', p: 1, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          {title}
        </Typography>
        <Table size="small" sx={{ border: '1px solid #e2e8f0' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Value</TableCell>
              {hasTotal && <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Total</TableCell>}
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>OK / NOT OK</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontSize: '0.8rem' }}>{r.label}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'Roboto Mono' }}>{r.value || '-'}</TableCell>
                {hasTotal && <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{(typeof r.total === 'number') ? r.total : '-'}</TableCell>}
                {i === 0 && (
                  <>
                    <TableCell rowSpan={rows.length} sx={{ fontSize: '0.8rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      {okValue === true ? <Chip label="OK" color="success" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /> :
                        okValue === false ? <Chip label="NOT OK" color="error" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /> : '-'}
                    </TableCell>
                    <TableCell rowSpan={rows.length} sx={{ fontSize: '0.8rem', color: 'text.secondary', verticalAlign: 'top' }}>{remarksValue || '-'}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  const PreviewMicroTable = ({ data }: { data: any[] }) => {
    const maxCols = Math.max(...data.map(d => d.values?.length || 0), 1);
    const firstRow = data[0];
    const okValue = firstRow?.ok;
    const remarksValue = firstRow?.remarks;

    return (
      <Box mt={2} mb={3}>
        <Typography variant="subtitle2" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', p: 1, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          MICROSTRUCTURE EXAMINATION
        </Typography>
        <Table size="small" sx={{ border: '1px solid #e2e8f0' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
              {Array.from({ length: maxCols }).map((_, i) => (
                <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>Value {i + 1}</TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>OK / NOT OK</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontSize: '0.8rem' }}>{r.label}</TableCell>
                {Array.from({ length: maxCols }).map((_, idx) => (
                  <TableCell key={idx} sx={{ fontSize: '0.8rem', fontFamily: 'Roboto Mono', textAlign: 'center' }}>
                    {r.values?.[idx] || '-'}
                  </TableCell>
                ))}
                {i === 0 && (
                  <>
                    <TableCell rowSpan={data.length} sx={{ fontSize: '0.8rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      {okValue === true ? <span style={{ color: 'green', fontWeight: 'bold' }}>OK</span> :
                        okValue === false ? <span style={{ color: 'red', fontWeight: 'bold' }}>NOT OK</span> : '-'}
                    </TableCell>
                    <TableCell rowSpan={data.length} sx={{ fontSize: '0.8rem', color: 'text.secondary', verticalAlign: 'top' }}>{remarksValue || '-'}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  const PrintSectionTable = ({ title, rows }: { title: string, rows: any[] }) => {
    const hasTotal = rows.some(r => typeof r.total === 'number' && !isNaN(r.total));
    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', marginBottom: '5px' }}>{title}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Parameter</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Value</th>
              {hasTotal && <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>Total</th>}
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '80px' }}>OK / NOT OK</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid black', padding: '5px' }}>{r.label}</td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{r.value || '-'}</td>
                {hasTotal && <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{(typeof r.total === 'number') ? r.total : '-'}</td>}
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                  {r.ok === true ? 'OK' : r.ok === false ? 'NOT OK' : '-'}
                </td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{r.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const PrintMicroTable = ({ data }: { data: any[] }) => {
    const maxCols = Math.max(...data.map(d => d.values?.length || 0), 1);
    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', marginBottom: '5px' }}>MICROSTRUCTURE EXAMINATION</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Parameter</th>
              {Array.from({ length: maxCols }).map((_, i) => (
                <th key={i} style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>Value {i + 1}</th>
              ))}
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '80px' }}>OK / NOT OK</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid black', padding: '5px' }}>{r.label}</td>
                {Array.from({ length: maxCols }).map((_, idx) => (
                  <td key={idx} style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{r.values?.[idx] || '-'}</td>
                ))}
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                  {r.ok === true ? 'OK' : r.ok === false ? 'NOT OK' : '-'}
                </td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{r.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <ThemeProvider theme={appTheme}>
      <GlobalStyles styles={{
        "@media print": {
          "html, body": { height: "initial !important", overflow: "initial !important", backgroundColor: "white !important" },
          "body *": { visibility: "hidden" },
          ".print-section, .print-section *": { visibility: "visible" },
          ".print-section": { display: "block !important", position: "absolute", left: 0, top: 0, width: "100%", color: "black", backgroundColor: "white", padding: "20px" },
          ".MuiModal-root": { display: "none !important" }
        }
      }} />

      <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
        <Container maxWidth="xl" disableGutters>

          <SaclHeader />
          <DepartmentHeader title="METALLURGICAL INSPECTION" userIP={userIP} user={user} />

          <Common trialId={trialId} />

          <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-end"
              mb={1}
              flexWrap="wrap"
              gap={2}
            >
              <Box />

              <Box display="flex" gap={2}>
                <TextField
                  size="small"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  sx={{ width: 160 }}
                  disabled={user?.role === 'HOD'}
                />
              </Box>
            </Box>


            <MicrostructureTable
              params={MICRO_PARAMS}
              cols={microCols}
              values={microValues}
              meta={microMeta}
              setCols={setMicroCols}
              setValues={setMicroValues}
              setMeta={setMicroMeta}
              showAlert={showAlert}
              user={user}
              isEditing={isEditing}
            />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <SectionTable
                  key={`mech-${loadKey}`}
                  title="MECHANICAL PROPERTIES"
                  rows={mechRows}
                  onChange={updateRow(setMechRows)}
                  showAlert={showAlert}
                  user={user}
                  isEditing={isEditing}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SectionTable
                  key={`impact-${loadKey}`}
                  title="IMPACT STRENGTH"
                  rows={impactRows}
                  onChange={updateRow(setImpactRows)}
                  showAlert={showAlert}
                  user={user}
                  isEditing={isEditing}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SectionTable
                  key={`hard-${loadKey}`}
                  title="HARDNESS"
                  rows={hardRows}
                  onChange={updateRow(setHardRows)}
                  showAlert={showAlert}
                  user={user}
                  isEditing={isEditing}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SectionTable
                  key={`ndt-${loadKey}`}
                  title="NDT INSPECTION ANALYSIS"
                  rows={ndtRows}
                  onChange={updateRow(setNdtRows)}
                  showTotal={true}
                  onValidationError={setNdtValidationError}
                  showAlert={showAlert}
                  user={user}
                  isEditing={isEditing}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, p: 3, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: "uppercase" }}>
                Attach PDF / Image Files
              </Typography>
              <FileUploadSection
                files={attachedFiles}
                onFilesChange={handleAttachFiles}
                onFileRemove={removeAttachedFile}
                showAlert={showAlert}
                label="Attach PDF"
                disabled={user?.role === 'HOD' && !isEditing}
              />
              <DocumentViewer trialId={trialId || ""} category="METALLURGICAL_INSPECTION" />
            </Box>


            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                <ActionButtons
                  {...(user?.role !== 'HOD' ? { onReset: () => window.location.reload() } : {})}
                  onSave={handleSaveAndContinue}
                  showSubmit={false}
                  saveLabel={user?.role === 'HOD' ? 'Approve' : 'Save & Continue'}
                  saveIcon={user?.role === 'HOD' ? <CheckCircleIcon /> : <SaveIcon />}
                >
                  {user?.role === 'HOD' && (
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditing(!isEditing)}
                      sx={{ color: COLORS.secondary, borderColor: COLORS.secondary }}
                    >
                      {isEditing ? "Cancel Edit" : "Edit Details"}
                    </Button>
                  )}
                </ActionButtons>
              </Box>
            </Box>

          </Paper>

          <PreviewModal
            open={previewMode && previewPayload}
            onClose={() => setPreviewMode(false)}
            onSubmit={handleFinalSave}
            onExport={handleExportPDF}
            title="Verify Inspection Data"
            subtitle="Metallurgical Inspection Report"
            submitted={previewSubmitted}
            isSubmitting={sending}
          >
            <Box sx={{ p: 4 }} ref={printRef}>
              <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Metallurgical Inspection Report</Typography>
                  <Typography variant="body2" color="textSecondary">Date: {previewPayload?.inspection_date}</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <PreviewMicroTable data={previewPayload?.microRows} />
                <PreviewSectionTable title="MECHANICAL PROPERTIES" rows={previewPayload?.mechRows} />
                <PreviewSectionTable title="IMPACT STRENGTH" rows={previewPayload?.impactRows} />
                <PreviewSectionTable title="HARDNESS" rows={previewPayload?.hardRows} />
                <PreviewSectionTable title="NDT INSPECTION ANALYSIS" rows={previewPayload?.ndtRows} />

                <Box sx={{ mt: 3 }}>
                  <AlertMessage alert={alert} />
                </Box>
              </Box>

              {message && (
                <Alert severity={previewSubmitted ? "success" : "info"} sx={{ mt: 2 }}>{message}</Alert>
              )}
            </Box>
          </PreviewModal>

          <Box className="print-section" sx={{ display: 'none' }}>
            <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>METALLURGICAL INSPECTION REPORT</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">Date: {date}</Typography>
              </Box>
            </Box>

            {previewPayload && (
              <>
                <PrintMicroTable data={previewPayload.microRows} />
                <PrintSectionTable title="MECHANICAL PROPERTIES" rows={previewPayload.mechRows} />
                <PrintSectionTable title="IMPACT STRENGTH" rows={previewPayload.impactRows} />
                <PrintSectionTable title="HARDNESS" rows={previewPayload.hardRows} />
                <PrintSectionTable title="NDT INSPECTION ANALYSIS" rows={previewPayload.ndtRows} />
              </>
            )}
          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}
