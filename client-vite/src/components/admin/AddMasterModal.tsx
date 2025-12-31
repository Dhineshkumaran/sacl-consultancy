import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Collapse,
    IconButton,
    Alert,
    Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import { masterListService } from '../../services/masterListService';
import { useAlert } from '../../hooks/useAlert';
import FileUploadSection from '../common/FileUploadSection';
import ActionButtons from '../common/ActionButtons';

interface AddMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess?: () => void;
}

const AddMasterModal: React.FC<AddMasterModalProps> = ({ isOpen, onClose, initialData, onSuccess }) => {
    const { alert, showAlert } = useAlert();
    const [formData, setFormData] = useState<any>({
        pattern_code: '',
        part_name: '',
        material_grade: '',
        chemical_composition: {
            C: '', Si: '', Mn: '', P: '', S: '', Mg: '', Cr: '', Cu: '', Nodularity: '', Pearlite: '', Carbide: ''
        },
        micro_structure: '',
        tensile_strength_min: '',
        yield_strength_min: '',
        elongation: '',
        impact_cold: '',
        impact_room: '',
        hardness_surface: '',
        hardness_core: '',
        xray: '',
        mpi: '',
        tooling: {
            number_of_cavity: '',
            number_of_cavity_sp: '',
            number_of_cavity_pp: '',
            cavity_identification: '',
            pattern_material: '',
            core_weight: '',
            core_mask_weight: '',
            core_mask_thickness: '',
            estimated_casting_weight: '',
            estimated_bunch_weight: '',
            pattern_plate_thickness_sp: '',
            pattern_plate_thickness_pp: '',
            cavity_identification_sp: '',
            cavity_identification_pp: '',
            pattern_plate_weight_sp: '',
            pattern_plate_weight_pp: '',
            pattern_material_sp: '',
            pattern_material_pp: '',
            crush_pin_height_sp: '',
            crush_pin_height_pp: '',
            core_weight_sp: '',
            core_weight_pp: '',
            core_mask_weight_sp: '',
            core_mask_weight_pp: '',
            core_mask_thickness_sp: '',
            core_mask_thickness_pp: '',
            calculated_yield_sp: '',
            calculated_yield_pp: '',
            estimated_casting_weight_sp: '',
            estimated_casting_weight_pp: '',
            estimated_bunch_weight_sp: '',
            estimated_bunch_weight_pp: '',
            yield_label: '',
            remarks: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [showToolingTable, setShowToolingTable] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleChemicalChange = (element: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            chemical_composition: {
                ...prev.chemical_composition,
                [element]: value
            }
        }));
    };

    const handleToolingChange = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            tooling: {
                ...prev.tooling,
                [field]: value
            }
        }));
    };

    const handleFilesChange = (files: File[]) => {
        setAttachments(prev => [...prev, ...files]);
    };

    const handleFileRemove = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        if (initialData) {
            // Parse Logic
            let chemComp = { C: '', Si: '', Mn: '', P: '', S: '', Mg: '', Cr: '', Cu: '', Nodularity: '', Pearlite: '', Carbide: '' };
            try {
                if (typeof initialData.chemical_composition === 'string') {
                    chemComp = { ...chemComp, ...JSON.parse(initialData.chemical_composition) };
                } else if (typeof initialData.chemical_composition === 'object') {
                    chemComp = { ...chemComp, ...initialData.chemical_composition };
                }
            } catch (e) {
                console.error("Error parsing chemical composition", e);
            }

            // Impact Parsing
            let impactCold = '', impactRoom = '';
            if (initialData.impact) {
                const coldMatch = initialData.impact.match(/Cold:\s*(.*?)(?=\s*Room:|$)/i);
                if (coldMatch) impactCold = coldMatch[1].trim();
                const roomMatch = initialData.impact.match(/Room:\s*(.*?)$/i);
                if (roomMatch) impactRoom = roomMatch[1].trim();
            }

            // Hardness Parsing
            let hardSurf = '', hardCore = '';
            if (initialData.hardness) {
                const surfMatch = initialData.hardness.match(/Surface:\s*(.*?)(?=\s*Core:|$)/i);
                if (surfMatch) hardSurf = surfMatch[1].trim();
                const coreMatch = initialData.hardness.match(/Core:\s*(.*?)$/i);
                if (coreMatch) hardCore = coreMatch[1].trim();
            }

            // Xray Parsing
            let xrayVal = '', mpiVal = '';
            if (initialData.xray) {
                const parts = initialData.xray.split('•');
                const xrayPart = parts.find((p: string) => p.trim().startsWith('X-Ray:'));
                const mpiPart = parts.find((p: string) => p.trim().startsWith('MPI:'));
                if (xrayPart) xrayVal = xrayPart.replace('X-Ray:', '').trim();
                if (mpiPart) mpiVal = mpiPart.replace('MPI:', '').trim();
                if (!xrayPart && !mpiPart && parts.length === 1) xrayVal = initialData.xray; // Fallback
            }

            setFormData({
                pattern_code: initialData.pattern_code || '',
                part_name: initialData.part_name || '',
                material_grade: initialData.material_grade || '',
                chemical_composition: chemComp,
                micro_structure: initialData.micro_structure || '',
                tensile_strength_min: initialData.tensile || '',
                yield_strength_min: '',
                elongation: '',
                impact_cold: impactCold,
                impact_room: impactRoom,
                hardness_surface: hardSurf,
                hardness_core: hardCore,
                xray: xrayVal,
                mpi: mpiVal,
                tooling: initialData.tooling || { ...formData.tooling }
            });
        } else {
            setFormData({
                pattern_code: '',
                part_name: '',
                material_grade: '',
                chemical_composition: { C: '', Si: '', Mn: '', P: '', S: '', Mg: '', Cr: '', Cu: '', Nodularity: '', Pearlite: '', Carbide: '' },
                micro_structure: '',
                tensile_strength_min: '',
                yield_strength_min: '',
                elongation: '',
                impact_cold: '',
                impact_room: '',
                hardness_surface: '',
                hardness_core: '',
                xray: '',
                mpi: '',
                tooling: {
                    number_of_cavity: '',
                    number_of_cavity_sp: '',
                    number_of_cavity_pp: '',
                    cavity_identification: '',
                    pattern_material: '',
                    core_weight: '',
                    core_mask_weight: '',
                    core_mask_thickness: '',
                    estimated_casting_weight: '',
                    estimated_bunch_weight: '',
                    pattern_plate_thickness_sp: '',
                    pattern_plate_thickness_pp: '',
                    cavity_identification_sp: '',
                    cavity_identification_pp: '',
                    pattern_plate_weight_sp: '',
                    pattern_plate_weight_pp: '',
                    pattern_material_sp: '',
                    pattern_material_pp: '',
                    crush_pin_height_sp: '',
                    crush_pin_height_pp: '',
                    core_weight_sp: '',
                    core_weight_pp: '',
                    core_mask_weight_sp: '',
                    core_mask_weight_pp: '',
                    core_mask_thickness_sp: '',
                    core_mask_thickness_pp: '',
                    calculated_yield_sp: '',
                    calculated_yield_pp: '',
                    estimated_casting_weight_sp: '',
                    estimated_casting_weight_pp: '',
                    estimated_bunch_weight_sp: '',
                    estimated_bunch_weight_pp: '',
                    yield_label: '',
                    remarks: ''
                }
            });
            setAttachments([]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            if (!formData.pattern_code.trim()) throw new Error('Pattern Code is required');
            if (!formData.part_name.trim()) throw new Error('Part Name is required');

            const chemicalComposition: Record<string, string> = {};
            Object.entries(formData.chemical_composition).forEach(([element, value]) => {
                if (typeof value === 'string' && value.trim() !== '') {
                    chemicalComposition[element] = value.trim();
                }
            });

            const tensileFields = [
                formData.tensile_strength_min.trim(),
                formData.yield_strength_min.trim(),
                formData.elongation.trim()
            ].filter(v => v !== '');
            const tensile = tensileFields.length > 0 ? tensileFields.join(' ') : null;

            const impactFields = [
                formData.impact_cold.trim() ? `Cold: ${formData.impact_cold.trim()}` : '',
                formData.impact_room.trim() ? `Room: ${formData.impact_room.trim()}` : ''
            ].filter(v => v !== '');
            const impact = impactFields.length > 0 ? impactFields.join(' ') : null;

            const hardnessFields = [
                formData.hardness_surface.trim() ? `Surface: ${formData.hardness_surface.trim()}` : '',
                formData.hardness_core.trim() ? `Core: ${formData.hardness_core.trim()}` : ''
            ].filter(v => v !== '');
            const hardness = hardnessFields.length > 0 ? hardnessFields.join(' ') : null;

            const xrayFields = [
                formData.xray.trim() ? `X-Ray: ${formData.xray.trim()}` : '',
                formData.mpi.trim() ? `MPI: ${formData.mpi.trim()}` : ''
            ].filter(v => v !== '');
            const xray = xrayFields.length > 0 ? xrayFields.join(' • ') : null;

            const payloadObj: Record<string, any> = {
                pattern_code: formData.pattern_code.trim(),
                part_name: formData.part_name.trim(),
                material_grade: formData.material_grade.trim() || null,
                chemical_composition: Object.keys(chemicalComposition).length > 0 ? chemicalComposition : null,
                micro_structure: formData.micro_structure.trim() || null,
                tensile: tensile,
                impact: impact,
                hardness: hardness,
                xray: xray,
                tooling: formData.tooling
            };

            let response: Response;

            if (initialData && initialData.id) {
                // UPDATE MODE
                response = await masterListService.updateMasterList(initialData.id, payloadObj);
            } else {
                // CREATE MODE
                if (attachments.length > 0) {
                    response = await masterListService.submitMasterListFormData(payloadObj, attachments);
                } else {
                    response = await masterListService.submitMasterListJson(payloadObj);
                }
            }

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            showAlert('success', initialData ? 'Master list updated successfully!' : 'Successfully added to master list!');
            setTimeout(() => {
                onClose();
                resetForm();
                if (onSuccess) onSuccess();
            }, 2000);

        } catch (err) {
            console.error('Error submitting form:', err);
            showAlert('error', err instanceof Error ? err.message : 'An error occurred while submitting the form');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen, initialData]);

    // Auto-calculate yield percentage
    useEffect(() => {
        const calculateYield = (cavityCount: string, castingWeight: string, bunchWeight: string): string => {
            const cavity = parseFloat(cavityCount);
            const casting = parseFloat(castingWeight);
            const bunch = parseFloat(bunchWeight);

            if (isNaN(cavity) || isNaN(casting) || isNaN(bunch) || bunch === 0) {
                return '';
            }

            const yieldValue = ((casting * cavity) / bunch) * 100;
            const clampedYield = Math.max(0, Math.min(100, yieldValue));

            return clampedYield.toFixed(2);
        };

        const calculatedYield = calculateYield(
            formData.tooling.number_of_cavity,
            formData.tooling.estimated_casting_weight,
            formData.tooling.estimated_bunch_weight
        );

        if (calculatedYield !== formData.tooling.yield_label) {
            setFormData((prev: any) => ({
                ...prev,
                tooling: {
                    ...prev.tooling,
                    yield_label: calculatedYield
                }
            }));
        }
    }, [
        formData.tooling.number_of_cavity,
        formData.tooling.estimated_casting_weight,
        formData.tooling.estimated_bunch_weight
    ]);

    const chemicalElements = ['C', 'Si', 'Mn', 'P', 'S', 'Mg', 'Cr', 'Cu', 'Nodularity', 'Pearlite', 'Carbide'];

    const toolingRows = [
        {
            left: "Number of cavity in pattern",
            right: "Pattern plate thickness in mm",
            fieldLeft: "number_of_cavity",
            sp: "number_of_cavity_sp",
            pp: "number_of_cavity_pp"
        },
        {
            left: "Cavity identification number",
            right: "Pattern plate weight in kgs",
            fieldLeft: "cavity_identification",
            sp: "cavity_identification_sp",
            pp: "cavity_identification_pp"
        },
        {
            left: "Pattern material",
            right: "Crush pin height in mm",
            fieldLeft: "pattern_material",
            sp: "pattern_material_sp",
            pp: "pattern_material_pp"
        },
        {
            left: "Core weight in kgs",
            right: "Core mask weight in kgs",
            fieldLeft: "core_weight",
            sp: "core_weight_sp",
            pp: "core_weight_pp"
        },
        {
            left: "Core mask thickness in mm",
            right: "Calculated Yield in percentage",
            fieldLeft: "core_mask_thickness",
            sp: "core_mask_thickness_sp",
            pp: "core_mask_thickness_pp"
        },
        {
            left: "Estimated casting weight",
            right: "Estimated Bunch weight",
            fieldLeft: "estimated_casting_weight",
            fieldRight: "estimated_bunch_weight",
            sp: "estimated_casting_weight_sp",
            pp: "estimated_casting_weight_pp",
            isYieldRow: true
        }
    ];

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { maxHeight: '90vh' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" fontWeight={700}>Add to Master List</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {alert && (
                    <Alert severity={alert.severity} sx={{ mb: 2 }}>
                        {alert.message}
                    </Alert>
                )}

                <Box component="form" noValidate>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
                        Basic Information
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                required
                                label="Pattern Code"
                                value={formData.pattern_code}
                                onChange={(e) => handleInputChange('pattern_code', e.target.value)}
                                placeholder="e.g., PC-001"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                required
                                label="Part Name"
                                value={formData.part_name}
                                onChange={(e) => handleInputChange('part_name', e.target.value)}
                                placeholder="e.g., Gear Wheel"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Material Grade"
                                value={formData.material_grade}
                                onChange={(e) => handleInputChange('material_grade', e.target.value)}
                                placeholder="e.g., EN8"
                                size="small"
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Chemical Composition
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'primary.main' }}>
                                    {chemicalElements.map((element) => (
                                        <TableCell key={element} align="center" sx={{ color: 'white', fontWeight: 700 }}>
                                            {element}%
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    {chemicalElements.map((element) => (
                                        <TableCell key={element} align="center" sx={{ p: 0.5 }}>
                                            <TextField
                                                value={formData.chemical_composition[element]}
                                                onChange={(e) => handleChemicalChange(element, e.target.value)}
                                                placeholder="--"
                                                size="small"
                                                sx={{ '& .MuiInputBase-input': { textAlign: 'center', p: 1 } }}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Material Properties
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Micro Structure"
                                value={formData.micro_structure}
                                onChange={(e) => handleInputChange('micro_structure', e.target.value)}
                                placeholder="e.g., Fine pearlite with ferrite"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Grid container spacing={1}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Tensile Strength (Min)"
                                        value={formData.tensile_strength_min}
                                        onChange={(e) => handleInputChange('tensile_strength_min', e.target.value)}
                                        placeholder="e.g., 550 MPa"
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Yield Strength (Min)"
                                        value={formData.yield_strength_min}
                                        onChange={(e) => handleInputChange('yield_strength_min', e.target.value)}
                                        placeholder="e.g., 420 MPa"
                                        size="small"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Elongation"
                                        value={formData.elongation}
                                        onChange={(e) => handleInputChange('elongation', e.target.value)}
                                        placeholder="e.g., 12%"
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Impact (Cold)"
                                value={formData.impact_cold}
                                onChange={(e) => handleInputChange('impact_cold', e.target.value)}
                                placeholder="e.g., 18 J"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Impact (Room)"
                                value={formData.impact_room}
                                onChange={(e) => handleInputChange('impact_room', e.target.value)}
                                placeholder="e.g., 20 J"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Hardness (Surface)"
                                value={formData.hardness_surface}
                                onChange={(e) => handleInputChange('hardness_surface', e.target.value)}
                                placeholder="e.g., 62 HRC"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Hardness (Core)"
                                value={formData.hardness_core}
                                onChange={(e) => handleInputChange('hardness_core', e.target.value)}
                                placeholder="e.g., 58 HRC"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="X-Ray"
                                value={formData.xray}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const mpiMatch = value.match(/MPI\s*[:\-]\s*(.*)$/i);

                                    if (mpiMatch) {
                                        const mpi = mpiMatch[1].trim();
                                        const xrayValue = value
                                            .replace(mpiMatch[0], "")
                                            .replace(/•$/, "")
                                            .trim();

                                        handleInputChange("xray", xrayValue);
                                        handleInputChange("mpi", mpi);
                                    } else {
                                        handleInputChange("xray", value);
                                    }
                                }}
                                placeholder="e.g., No internal defects"
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="MPI"
                                value={formData.mpi}
                                onChange={(e) => handleInputChange('mpi', e.target.value)}
                                placeholder="e.g., No indications"
                                size="small"
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Attachments
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <FileUploadSection
                            files={attachments}
                            onFilesChange={handleFilesChange}
                            onFileRemove={handleFileRemove}
                            accept=".pdf,image/*"
                            multiple
                            label="Choose Files"
                            showAlert={showAlert}
                        />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setShowToolingTable(!showToolingTable)}
                            endIcon={showToolingTable ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        >
                            {showToolingTable ? 'Hide' : 'Show'} Tooling (Pattern) Data Sheet
                        </Button>
                    </Box>

                    <Collapse in={showToolingTable}>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>SP Side Pattern</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>PP Side Pattern</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {toolingRows.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{row.left}</TableCell>
                                            <TableCell sx={{ p: 0.5 }}>
                                                <TextField
                                                    fullWidth
                                                    value={formData.tooling[row.fieldLeft] || ""}
                                                    onChange={(e) => handleToolingChange(row.fieldLeft, e.target.value)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{row.right}</TableCell>
                                            <TableCell sx={{ p: 0.5 }}>
                                                <TextField
                                                    fullWidth
                                                    value={formData.tooling[row.fieldRight || row.sp] || ""}
                                                    onChange={(e) => handleToolingChange(row.fieldRight || row.sp, e.target.value)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ p: 0.5 }}>
                                                {row.isYieldRow ? (
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="body2" fontWeight={600}>Yield:</Typography>
                                                        <TextField
                                                            fullWidth
                                                            value={formData.tooling.yield_label ? `${formData.tooling.yield_label}%` : ""}
                                                            size="small"
                                                            InputProps={{
                                                                readOnly: true,
                                                                sx: { bgcolor: 'action.hover' }
                                                            }}
                                                            placeholder="Auto-calculated"
                                                        />
                                                    </Box>
                                                ) : (
                                                    <TextField
                                                        fullWidth
                                                        value={formData.tooling[row.pp] || ""}
                                                        onChange={(e) => handleToolingChange(row.pp, e.target.value)}
                                                        size="small"
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Typography variant="body2" fontWeight={600} gutterBottom>Remarks:</Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={4}
                                                value={formData.tooling.remarks || ""}
                                                onChange={(e) => handleToolingChange("remarks", e.target.value)}
                                                size="small"
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Collapse>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="outlined" disabled={loading}>
                    Cancel
                </Button>
                <ActionButtons
                    onSubmit={handleSubmit}
                    loading={loading}
                    submitLabel="Add to Master List"
                    showReset={false}
                    showSave={false}
                />
            </DialogActions>
        </Dialog>
    );
};

export default AddMasterModal;