import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";

import { useAuth } from "../../context/AuthContext";
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
} from "@mui/material";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";

import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { inspectionService } from '../../services/inspectionService';
import { documentService } from '../../services/documentService';
import { uploadFiles } from '../../services/fileUploadHelper';
import { getProgress } from "../../services/departmentProgressService";
import { COLORS, appTheme } from '../../theme/appTheme';
import { useAlert } from '../../hooks/useAlert';
import { AlertMessage } from '../common/AlertMessage';
import { fileToMeta, generateUid, formatDate } from '../../utils';
import { EmptyState, ActionButtons, PreviewModal, FileUploadSection, DocumentViewer } from '../common';
import BasicInfo from "../dashboard/BasicInfo";
import { safeParse } from "../../utils/jsonUtils";
import { apiService } from "../../services/commonService";
import Header from "../dashboard/Header";
import ProfileModal from "../dashboard/ProfileModal";
import { getDepartmentInfo } from "../../utils/dashboardUtils";

interface Row {
  id: string;
  label: string;
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
  cavityNumbers = [],
  sectionOk,
  onSectionOkChange,
  sectionRemarks,
  onSectionRemarksChange,
}: {
  title: string;
  rows: Row[];
  onChange: (id: string, patch: Partial<Row>) => void;
  showTotal?: boolean;
  onValidationError?: (message: string) => void;
  showAlert?: (severity: 'success' | 'error', message: string) => void;
  user: any;
  isEditing: boolean;
  cavityNumbers?: string[];
  sectionOk: boolean | null;
  onSectionOkChange: (val: boolean | null) => void;
  sectionRemarks: string;
  onSectionRemarksChange: (val: string) => void;
}) {
  const isMachineShop = user?.department_id === 8;
  const [cols, setCols] = useState<MicroCol[]>(() => {
    const maxLen = Math.max(...(rows?.map(r => (r?.value ? r.value.split('|').length : 1)) || [1]), 1);
    return Array.from({ length: maxLen }, (_, i) => ({ id: `c${i + 1}`, label: '' })); // Labels lost in string storage
  });

  const [values, setValues] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    rows?.forEach((r) => {
      init[r?.id] = r?.value ? r.value.split('|').map(s => s.trim()) : Array(cols?.length || 0).fill('');
    });
    return init;
  });


  useEffect(() => {
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      rows?.forEach((r) => { copy[r?.id] = prev[r?.id] ?? (r?.value ? r.value.split('|').map(s => s.trim()) : Array(cols?.length || 0).fill('')); });
      return copy;
    });
  }, [rows]);

  useEffect(() => {
    if (cavityNumbers && cavityNumbers?.length > 0) {
      const cavityRow = rows?.find(r => r?.label === "Cavity Number");
      if (cavityRow) {
        setValues(prev => ({
          ...prev,
          [cavityRow?.id]: cavityNumbers
        }));
        const newValue = cavityNumbers?.join(' | ');
        onChange(cavityRow?.id, { value: newValue });
      }
    }
  }, [cavityNumbers]);

  const addColumn = () => {
    setCols((prev) => [...(prev || []), { id: `c${(prev?.length || 0) + 1}`, label: '' }]);
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev || {}).forEach((k) => { copy[k] = [...(prev?.[k] || []), '']; });
      return copy;
    });
  };

  const removeColumn = (index: number) => {
    setCols((prev) => ((prev?.length || 0) <= 1 ? prev : prev?.filter((_, i) => i !== index)));
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev || {}).forEach((k) => {
        const arr = [...(prev?.[k] || [])];
        if (arr?.length > index) arr.splice(index, 1);
        copy[k] = arr;
      });
      return copy;
    });
  };


  const updateCell = (rowId: string, colIndex: number, val: string) => {
    setValues((prev) => {
      const arr = prev?.[rowId]?.map((v, i) => (i === colIndex ? val : v)) || [];
      let copy = { ...prev, [rowId]: arr };


      const combined = arr?.map(v => v || "")?.join(' | ');
      const total = arr?.reduce((acc, s) => {
        const n = parseFloat(String(s).trim());
        return acc + (isNaN(n) ? 0 : n);
      }, 0);
      onChange(rowId, { value: combined, total });
      return copy;
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
              {cols?.map((c, ci) => (
                <TableCell key={c?.id} sx={{ minWidth: 140 }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                    <TextField
                      size="small"
                      value={c?.label}
                      onChange={(e) => setCols((prev) => prev?.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                      variant="standard"
                      InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                      sx={{ input: { textAlign: 'center' } }}
                      disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                    />
                    <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing}>
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
              {cols?.map((c, ci) => (
                <TableCell key={c?.id} sx={{ bgcolor: '#f8fafc' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={cavityRow ? (values?.[cavityRow?.id]?.[ci] ?? "") : ""}
                    onChange={(e) => cavityRow && updateCell(cavityRow?.id, ci, e.target.value)}
                    variant="outlined"
                    sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                    disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                  />
                </TableCell>
              ))}

              <TableCell rowSpan={rows?.length + 1} sx={{ bgcolor: COLORS.successBg, verticalAlign: "middle", textAlign: 'center', width: 140, borderBottom: 'none' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <RadioGroup row sx={{ justifyContent: 'center' }} value={sectionOk === null ? "" : String(sectionOk)} onChange={(e) => onSectionOkChange(e.target.value === "true")}>
                    <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing} />
                    <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing} />
                  </RadioGroup>
                </Box>
              </TableCell>

              <TableCell rowSpan={rows?.length + 1} sx={{ bgcolor: '#fff7ed', verticalAlign: "top", borderBottom: 'none' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    value={sectionRemarks || ""}
                    onChange={(e) => onSectionRemarksChange(e.target.value)}
                    placeholder="Enter remarks..."
                    variant="outlined"
                    sx={{ bgcolor: 'white' }}
                    disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                  />

                </Box>
              </TableCell>
            </TableRow>

            {dataRows?.map((r: Row, idx: number) => {
              const rowVals = values?.[r?.id] ?? [];
              const displayTotal = rowVals?.reduce((acc, s) => {
                const n = parseFloat(String(s).trim());
                return acc + (isNaN(n) ? 0 : n);
              }, 0);
              const totalToShow = rowVals?.some(v => v && !isNaN(parseFloat(String(v)))) ? displayTotal : (r?.total ?? null);

              return (
                <TableRow key={r?.id}>
                  <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>{r?.label}</TableCell>

                  {cols?.map((c, ci) => {
                    const isFieldDisabled = ((user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing);

                    return (
                      <TableCell key={c?.id} sx={{ display: r?.label?.toLowerCase()?.includes('reason') ? 'none' : 'table-cell' }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={values?.[r?.id]?.[ci] ?? ""}
                          onChange={(e) => updateCell(r?.id, ci, e.target.value)}
                          variant="outlined"
                          sx={{
                            "& .MuiInputBase-input": {
                              textAlign: 'center',
                              fontFamily: 'Roboto Mono',
                              fontSize: '0.85rem',
                              bgcolor: 'inherit'
                            }
                          }}
                          disabled={isFieldDisabled}
                          error={false}
                        />
                      </TableCell>
                    );
                  })}


                  {r?.label?.toLowerCase()?.includes('reason') && (
                    <TableCell colSpan={(cols?.length || 0) + (showTotal ? 1 : 0)}>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        value={values?.[r?.id]?.[0] ?? ""}
                        onChange={(e) => updateCell(r?.id, 0, e.target.value)}
                        placeholder="Enter reason for rejection..."
                        variant="outlined"
                        sx={{ "& .MuiInputBase-input": { fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                        disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                      />
                    </TableCell>
                  )}

                  {showTotal && !r?.label?.toLowerCase()?.includes('reason') && (
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>
                      {totalToShow !== null && totalToShow !== undefined ? totalToShow : "-"}
                    </TableCell>
                  )}


                </TableRow>
              );
            })}


          </TableBody>
        </Table>
      </Box>

      <Button
        size="small"
        onClick={addColumn}
        startIcon={<AddCircleIcon />}
        sx={{ mt: 1, color: COLORS.secondary }}
        disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing}
      >
        Add Column
      </Button>
    </Box >
  );
}

function MicrostructureTable({
  params,
  cols,
  values,
  microOk,
  microRemarks,
  setMicroOk,
  setMicroRemarks,
  setCols,
  setValues,
  showAlert,
  user,
  isEditing,
}: {
  params: string[];
  cols: MicroCol[];
  values: Record<string, string[]>;
  microOk: boolean | null;
  microRemarks: string;
  setMicroOk: (ok: boolean | null) => void;
  setMicroRemarks: (remarks: string) => void;
  setCols: (c: MicroCol[] | ((prev: MicroCol[]) => MicroCol[])) => void;
  setValues: (v: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
  showAlert?: (severity: 'success' | 'error', message: string) => void;
  user: any;
  isEditing: boolean;
}) {
  const isMachineShop = user?.department_id === 8;
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
              {cols?.map((c, ci) => (
                <TableCell key={c?.id} sx={{ minWidth: 140 }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                    <TextField
                      size="small"
                      value={c?.label}
                      onChange={(e) => setCols((prev) => prev?.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                      variant="standard"
                      InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                      sx={{ input: { textAlign: 'center' } }}
                      disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing}
                    />
                    <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing}>
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
                {cols?.map((c, ci) => (
                  <TableCell key={c?.id}>
                    <TextField
                      size="small"
                      fullWidth
                      value={values?.[param]?.[ci] ?? ""}
                      onChange={(e) => updateCell(param, ci, e.target.value)}
                      variant="outlined"
                      sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                      disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 8) && !isEditing}
                    />
                  </TableCell>
                ))}

                {pIndex === 0 ? (
                  <>
                    <TableCell rowSpan={params.length} sx={{ bgcolor: COLORS.successBg, verticalAlign: "middle", textAlign: 'center' }}>
                      <RadioGroup
                        row
                        sx={{ justifyContent: 'center' }}
                        value={microOk === null ? "" : String(microOk)}
                        onChange={(e) => setMicroOk(e.target.value === "true")}
                      >
                        <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing} />
                        <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing} />
                      </RadioGroup>
                    </TableCell>

                    <TableCell rowSpan={params.length} colSpan={6} sx={{ bgcolor: '#fff7ed', verticalAlign: "top" }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={3}
                          value={microRemarks || ""}
                          onChange={(e) => setMicroRemarks(e.target.value)}
                          placeholder="Enter remarks..."
                          variant="outlined"
                          sx={{ bgcolor: 'white' }}
                          disabled={(user?.role === 'HOD' || isMachineShop) && !isEditing}
                        />

                      </Box>
                    </TableCell>

                  </>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Button size="small" onClick={addColumn} startIcon={<AddCircleIcon />} sx={{ mt: 1, color: COLORS.secondary }} disabled={(user?.role === 'HOD' || user?.role === 'Admin' || isMachineShop) && !isEditing}>Add Column</Button>
    </Box >
  );
}

export default function MetallurgicalInspection() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showProfile, setShowProfile] = useState(false);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const departmentInfo = getDepartmentInfo(user);
  const [userIP, setUserIP] = useState<string>("Loading...");
  const { alert, showAlert } = useAlert();
  const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";
  const isMachineShop = user?.department_id === 8;
  const [isAssigned, setIsAssigned] = useState<boolean | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [dataExists, setDataExists] = useState(false);

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
  const [microOk, setMicroOk] = useState<boolean | null>(null);
  const [microRemarks, setMicroRemarks] = useState<string>("");




  const [mechOk, setMechOk] = useState<boolean | null>(null);
  const [mechRemarks, setMechRemarks] = useState<string>("");
  const [impactOk, setImpactOk] = useState<boolean | null>(null);
  const [impactRemarks, setImpactRemarks] = useState<string>("");

  const [mechRows, setMechRows] = useState<Row[]>(initialRows(["Cavity Number", "Tensile strength", "Yield strength", "Elongation"]));
  const [impactRows, setImpactRows] = useState<Row[]>(initialRows(["Cavity Number", "Cold Temp °C", "Room Temp °C"]));

  const handleAttachFiles = (newFiles: File[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await apiService.getIP();
      setUserIP(ip);
    };
    fetchIP();
  }, []);

  useEffect(() => {
    const checkAssignment = async () => {
      if (user && trialId) {
        if (user.role === 'Admin' || user.department_id === 8) {
          setIsAssigned(true);
          return;
        }
        try {
          const pending = await getProgress(user.username, user.department_id);
          const found = pending.find(p => p.trial_id === trialId);
          setIsAssigned(!!found);
        } catch (error) {
          console.error("Failed to check assignment:", error);
          setIsAssigned(false);
        }
      } else {
        setIsAssigned(false);
      }
    };
    checkAssignment();
  }, [user, trialId]);

  useEffect(() => {
    const fetchData = async () => {
      if (trialId) {
        try {
          const response = await inspectionService.getMetallurgicalInspection(trialId);


          if (response.success && response.data && response.data.length > 0) {
            const data = response.data[0];
            setDate(data.inspection_date ? new Date(data.inspection_date).toISOString().slice(0, 10) : "");

            if (data.micro_structure) {
              const microData = safeParse<any[]>(data.micro_structure, []);
              if (microData.length > 0) {
                const colsCount = microData.length;
                setMicroCols(Array.from({ length: colsCount }, (_, i) => ({ id: `c${i + 1}`, label: '' })));

                const newValues: Record<string, string[]> = {};
                MICRO_PARAMS.forEach(param => {
                  newValues[param] = microData.map(obj => String(obj[param] || ""));
                });
                setMicroValues(prev => ({ ...prev, ...newValues }));

                setMicroOk(data.micro_structure_ok === null || data.micro_structure_ok === undefined ? null : (data.micro_structure_ok === true || data.micro_structure_ok === 1 || String(data.micro_structure_ok) === "1" || String(data.micro_structure_ok) === "true"));
                setMicroRemarks(data.micro_structure_remarks || "");

              }
            }

            const restoreSection = (source: any, labelKeys: string[], sectionOk: any = null, sectionRemarks: string = "") => {
              const arr = safeParse<any[]>(source, []);
              const okVal = sectionOk === null || sectionOk === undefined ? null : (sectionOk === true || sectionOk === 1 || String(sectionOk) === "1" || String(sectionOk) === "true");

              if (arr.length > 0 && typeof arr[0] === 'object' && !Array.isArray(arr[0])) {
                return labelKeys.map((label, i) => {
                  const values = arr.map(obj => String(obj[label] || ""));
                  return {
                    id: `${label}-${i}`,
                    label: label,
                    value: values.join(' | '),
                    ok: okVal,
                    remarks: sectionRemarks || "",
                    total: label.toLowerCase().includes('quantity') || label.toLowerCase().includes('strength') ? values.reduce((acc, v) => acc + (parseFloat(v) || 0), 0) : null,
                  };
                });
              }
              return arr.map((r: any, i: number) => ({
                id: (r.label || "Param") + "-" + i,
                label: r.label || "Param",
                value: Array.isArray(r.values) ? r.values.join(' | ') : (r.value || ""),
                ok: r.ok === null || r.ok === undefined ? okVal : (r.ok === true || String(r.ok) === "1" || String(r.ok) === "true"),
                remarks: r.remarks || sectionRemarks || "",
                total: r.total || null
              }));
            };

            setMechRows(restoreSection(data.mech_properties, ["Cavity Number", "Tensile strength", "Yield strength", "Elongation"], null, ""));
            setImpactRows(restoreSection(data.impact_strength, ["Cavity Number", "Cold Temp °C", "Room Temp °C"], null, ""));

            setMechOk(data.mech_properties_ok === null || data.mech_properties_ok === undefined ? null : (data.mech_properties_ok === true || data.mech_properties_ok === 1 || String(data.mech_properties_ok) === "1" || String(data.mech_properties_ok) === "true"));
            setMechRemarks(data.mech_properties_remarks || "");

            setImpactOk(data.impact_strength_ok === null || data.impact_strength_ok === undefined ? null : (data.impact_strength_ok === true || data.impact_strength_ok === 1 || String(data.impact_strength_ok) === "1" || String(data.impact_strength_ok) === "true"));
            setImpactRemarks(data.impact_strength_remarks || "");

            setLoadKey(prev => prev + 1);
            setDataExists(true);
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
    return {
      trial_id: trialId,
      inspection_date: date || null,
      microRows: MICRO_PARAMS?.map((p) => ({
        label: p,
        values: (microValues?.[p] || [])?.map((v) => (v === '' ? null : v)),
      })),
      micro_ok: microOk ?? null,
      micro_remarks: microRemarks ?? "",

      mechRows: mechRows?.map((r) => ({
        label: r?.label,
        value: r?.value ?? null,
        total: r?.total ?? null,
      })),
      mech_ok: mechOk ?? null,
      mech_remarks: mechRemarks ?? "",
      impactRows: impactRows?.map((r) => ({
        label: r?.label,
        value: r?.value ?? null,
        total: r?.total ?? null,
      })),
      impact_ok: impactOk ?? null,
      impact_remarks: impactRemarks ?? "",
      attachedFiles: attachedFiles?.map(f => f?.name),
      is_edit: isEditing
    };
  };

  const buildServerPayload = (isDraft: boolean = false) => {
    const source = previewPayload || buildPayload();

    const getMicroRow = (labelPart: string) => (source?.microRows || [])?.find((r: any) => String(r?.label)?.toLowerCase()?.includes(labelPart.toLowerCase()));
    const microCavityRow = getMicroRow('cavity number');
    const nodularityRow = getMicroRow('nodularity');
    const matrixRow = getMicroRow('matrix');
    const carbideRow = getMicroRow('carbide');
    const inclusionRow = getMicroRow('inclusion');

    const microMaxCols = Math.max(...(source?.microRows || [])?.map((r: any) => (r?.values?.length || 0)), 0);
    const micro_structure = Array.from({ length: microMaxCols }).map((_, idx) => ({
      'Cavity Number': String(microCavityRow?.values?.[idx] || ""),
      'Nodularity': String(nodularityRow?.values?.[idx] || ""),
      'Matrix': String(matrixRow?.values?.[idx] || ""),
      'Carbide': String(carbideRow?.values?.[idx] || ""),
      'Inclusion': String(inclusionRow?.values?.[idx] || ""),
    }));

    const getMechRow = (labelPart: string) => (source?.mechRows || [])?.find((r: any) => String(r?.label)?.toLowerCase()?.includes(labelPart.toLowerCase()));
    const mechCavityRow = getMechRow('cavity number');
    const tensileRow = getMechRow('tensile strength');
    const yieldRow = getMechRow('yield strength');
    const elongationRow = getMechRow('elongation');

    const mechMaxCols = Math.max(...(source?.mechRows || [])?.map((r: any) => (r?.value ? String(r?.value).split('|').length : 0)), 0);
    const mech_properties = Array.from({ length: mechMaxCols }).map((_, idx) => ({
      'Cavity Number': String(mechCavityRow?.value?.split('|')[idx]?.trim() || ""),
      'Tensile strength': String(tensileRow?.value?.split('|')[idx]?.trim() || ""),
      'Yield strength': String(yieldRow?.value?.split('|')[idx]?.trim() || ""),
      'Elongation': String(elongationRow?.value?.split('|')[idx]?.trim() || ""),
    }));

    const getImpactRow = (labelPart: string) => (source?.impactRows || [])?.find((r: any) => String(r?.label)?.toLowerCase()?.includes(labelPart.toLowerCase()));
    const impactCavityRow = getImpactRow('cavity number');
    const coldTempRow = getImpactRow('cold temp');
    const roomTempRow = getImpactRow('room temp');

    const impactMaxCols = Math.max(...(source?.impactRows || [])?.map((r: any) => (r?.value ? String(r?.value).split('|').length : 0)), 0);
    const impact_strength = Array.from({ length: impactMaxCols }).map((_, idx) => ({
      'Cavity Number': String(impactCavityRow?.value?.split('|')[idx]?.trim() || ""),
      'Cold Temp °C': String(coldTempRow?.value?.split('|')[idx]?.trim() || ""),
      'Room Temp °C': String(roomTempRow?.value?.split('|')[idx]?.trim() || ""),
    }));

    return {
      trial_id: trialId,
      inspection_date: source?.inspection_date || null,
      micro_structure: micro_structure,
      micro_structure_ok: source?.micro_ok,
      micro_structure_remarks: source?.micro_remarks,
      mech_properties: mech_properties,
      mech_properties_ok: source?.mech_ok,
      mech_properties_remarks: source?.mech_remarks,
      impact_strength: impact_strength,
      impact_strength_ok: source?.impact_ok,
      impact_strength_remarks: source?.impact_remarks,
      is_edit: isEditing || dataExists,
      is_draft: isDraft
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
    setSending(true);

    try {
      const apiPayload = buildServerPayload(false);

      if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
        await inspectionService.updateMetallurgicalInspection(apiPayload);
      } else {
        await inspectionService.submitMetallurgicalInspection(apiPayload);
      }

      if (attachedFiles.length > 0) {
        await uploadFiles(
          attachedFiles,
          trialId,
          "METALLURGICAL_INSPECTION",
          user?.username || "system",
          "METALLURGICAL_INSPECTION"
        ).catch(err => console.error("File upload error:", err));
      }

      setPreviewSubmitted(true);
      setPreviewMode(false);
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Metallurgical Inspection ${dataExists ? 'updated' : 'created'} successfully.`
      });
      navigate('/dashboard');
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to save Metallurgical Inspection. Please try again.'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setSending(true);
    try {
      const apiPayload = buildServerPayload(true);

      if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
        await inspectionService.updateMetallurgicalInspection(apiPayload);
      } else {
        await inspectionService.submitMetallurgicalInspection(apiPayload);
      }

      if (attachedFiles.length > 0) {
        await uploadFiles(
          attachedFiles,
          trialId,
          "METALLURGICAL_INSPECTION",
          user?.username || "system",
          "METALLURGICAL_INSPECTION"
        ).catch(err => console.error("Draft file upload error", err));
      }

      setPreviewSubmitted(true);
      await Swal.fire({
        icon: 'success',
        title: 'Saved as Draft',
        text: 'Progress saved and moved to next department.'
      });
      navigate('/dashboard');

    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save draft.'
      });
    } finally {
      setSending(false);
    }
  };


  const PreviewSectionTable = ({ title, rows, ok, remarks }: { title: string, rows: any[], ok: any, remarks: string }) => {
    const hasTotal = rows.some(r => typeof r.total === 'number' && !isNaN(r.total));

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
            {rows?.map((r, i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontSize: '0.8rem' }}>{r?.label}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'Roboto Mono' }}>{r?.value || '-'}</TableCell>
                {hasTotal && <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{(typeof r?.total === 'number') ? r.total : '-'}</TableCell>}
                {i === 0 && (
                  <>
                    <TableCell rowSpan={rows?.length || 1} sx={{ fontSize: '0.8rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      {ok === true ? <Chip label="OK" color="success" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /> :
                        ok === false ? <Chip label="NOT OK" color="error" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /> : '-'}
                    </TableCell>
                    <TableCell rowSpan={rows?.length || 1} sx={{ fontSize: '0.8rem', color: 'text.secondary', verticalAlign: 'top' }}>{remarks || '-'}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };


  const PreviewMicroTable = ({ data, ok, remarks }: { data: any[], ok: any, remarks: string }) => {
    const maxCols = Math.max(...data.map(d => d.values?.length || 0), 1);

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
            {data?.map((r: any, i: number) => (
              <TableRow key={i}>
                <TableCell sx={{ fontSize: '0.8rem' }}>{r?.label}</TableCell>
                {Array.from({ length: maxCols }).map((_, idx) => (
                  <TableCell key={idx} sx={{ fontSize: '0.8rem', fontFamily: 'Roboto Mono', textAlign: 'center' }}>
                    {r?.values?.[idx] || '-'}
                  </TableCell>
                ))}
                {i === 0 && (
                  <>
                    <TableCell rowSpan={data?.length || 1} sx={{ fontSize: '0.8rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      {ok === true ? <span style={{ color: 'green', fontWeight: 'bold' }}>OK</span> :
                        ok === false ? <span style={{ color: 'red', fontWeight: 'bold' }}>NOT OK</span> : '-'}
                    </TableCell>
                    <TableCell rowSpan={data?.length || 1} sx={{ fontSize: '0.8rem', color: 'text.secondary', verticalAlign: 'top' }}>{remarks || '-'}</TableCell>
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

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: COLORS.background }}>
        <Header
          setShowProfile={setShowProfile}
          departmentInfo={departmentInfo}
          photoRefreshKey={headerRefreshKey}
          showBackButton={true}
        />
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: { xs: 2, md: 4 } }}>
          <Container maxWidth="xl">
            <AlertMessage alert={alert} />

            {isAssigned === false && (user?.role !== 'Admin') ? (
              <EmptyState
                title="No Pending Works"
                description="This trial is not currently assigned to you."
                severity="warning"
                action={{
                  label: "Go to Dashboard",
                  onClick: () => navigate('/dashboard')
                }}
              />
            ) : (
              <>
                <BasicInfo trialId={trialId || ""} />

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
                    microOk={microOk}
                    microRemarks={microRemarks}
                    setCols={setMicroCols}
                    setValues={setMicroValues}
                    setMicroOk={setMicroOk}
                    setMicroRemarks={setMicroRemarks}

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
                        cavityNumbers={microValues["Cavity Number"] || []}
                        sectionOk={mechOk}
                        onSectionOkChange={setMechOk}
                        sectionRemarks={mechRemarks}
                        onSectionRemarksChange={setMechRemarks}
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
                        cavityNumbers={microValues["Cavity Number"] || []}
                        sectionOk={impactOk}
                        onSectionOkChange={setImpactOk}
                        sectionRemarks={impactRemarks}
                        onSectionRemarksChange={setImpactRemarks}
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
                      disabled={user?.role === 'HOD' || user?.role === 'Admin'}
                    />
                    <DocumentViewer trialId={trialId || ""} category="METALLURGICAL_INSPECTION" />
                  </Box>


                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                      {!isMachineShop && (
                        <ActionButtons
                          {...(user?.role !== 'HOD' && user?.role !== 'Admin' ? { onReset: () => window.location.reload() } : {})}
                          onSave={handleSaveAndContinue}
                          showSubmit={false}
                          saveLabel={user?.role === 'HOD' || user?.role === 'Admin' ? 'Approve' : 'Save & Continue'}
                          saveIcon={user?.role === 'HOD' || user?.role === 'Admin' ? <CheckCircleIcon /> : <SaveIcon />}
                        >
                          {(user?.role !== 'HOD' && user?.role !== 'Admin') && (
                            <Button
                              variant="outlined"
                              startIcon={<SaveIcon />}
                              onClick={handleSaveDraft}
                              disabled={sending}
                              sx={{ mr: 2 }}
                            >
                              Save as Draft
                            </Button>
                          )}
                          {(user?.role === 'HOD' || user?.role === 'Admin') && (
                            <Button
                              variant="outlined"
                              onClick={() => setIsEditing(!isEditing)}
                              sx={{ color: COLORS.secondary, borderColor: COLORS.secondary }}
                            >
                              {isEditing ? "Cancel Edit" : "Edit Details"}
                            </Button>
                          )}
                        </ActionButtons>
                      )}
                    </Box>
                  </Box>

                </Paper>
              </>
            )}

            <PreviewModal
              open={previewMode && previewPayload}
              onClose={() => setPreviewMode(false)}
              onSubmit={handleFinalSave}
              title="Verify Metallurgical Inspection Details"
              submitted={previewSubmitted}
              isSubmitting={sending}
            >
              <Box sx={{ p: 4 }} ref={printRef}>
                <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Metallurgical Inspection Report</Typography>
                    <Typography variant="body2" color="textSecondary">Date: {formatDate(previewPayload?.inspection_date)}</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <PreviewMicroTable data={previewPayload?.microRows} ok={previewPayload?.micro_ok} remarks={previewPayload?.micro_remarks} />
                  <PreviewSectionTable title="MECHANICAL PROPERTIES" rows={previewPayload?.mechRows} ok={previewPayload?.mech_ok} remarks={previewPayload?.mech_remarks} />
                  <PreviewSectionTable title="IMPACT STRENGTH" rows={previewPayload?.impactRows} ok={previewPayload?.impact_ok} remarks={previewPayload?.impact_remarks} />


                  <Box sx={{ mt: 3 }}>
                    <AlertMessage alert={alert} />
                  </Box>

                  {previewPayload?.attachedFiles && previewPayload.attachedFiles.length > 0 && (
                    <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="subtitle2" mb={1} color="textSecondary">ATTACHED FILES</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {previewPayload?.attachedFiles?.map((fileName: string, idx: number) => (
                          <Chip
                            key={idx}
                            icon={<InsertDriveFileIcon />}
                            label={fileName}
                            variant="outlined"
                            sx={{ bgcolor: 'white' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                </Box>

                {message && (
                  <Alert severity={previewSubmitted ? "success" : "info"} sx={{ mt: 2 }}>{message}</Alert>
                )}
              </Box>
            </PreviewModal>
          </Container>
        </Box>
      </Box>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
        />
      )}
    </ThemeProvider>
  );
}
