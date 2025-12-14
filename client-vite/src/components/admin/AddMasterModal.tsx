import React, { useState, useEffect } from 'react';
import { masterListService } from '../../services/masterListService';

interface AddMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddMasterModal: React.FC<AddMasterModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState<any>({
        pattern_code: '',
        part_name: '',
        material_grade: '',

        // Chemical Composition (JSON)
        chemical_composition: {
            C: '',
            Si: '',
            Mn: '',
            P: '',
            S: '',
            Mg: '',
            Cr: '',
            Cu: '',
            Nodularity: '',
            Pearlite: '',
            Carbide: ''
        },

        // Microstructure
        micro_structure: '',

        // Mechanical Properties
        tensile_strength_min: '',
        yield_strength_min: '',
        elongation: '',
        impact_cold: '',
        impact_room: '',

        // NDT Inspection
        hardness_surface: '',
        hardness_core: '',
        xray: '',
        mpi: '',

        // Tooling / Pattern Data Sheet (added fields)
        tooling: {
            number_of_cavity_sp: '',
            number_of_cavity_pp: '',
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
            calculated_casting_weight_sp: '',
            calculated_casting_weight_pp: '',
            core_mask_weight_sp: '',
            core_mask_weight_pp: '',
            calculated_punch_weight_sp: '',
            calculated_punch_weight_pp: '',
            core_mask_thickness_sp: '',
            core_mask_thickness_pp: '',
            calculated_yield_sp: '',
            calculated_yield_pp: '',
            estimated_casting_weight_sp: '',
            estimated_casting_weight_pp: '',
            estimated_bunch_weight_sp: '',
            estimated_bunch_weight_pp: '',
            yield_label: '', // for any special small cell "Yield :" text if needed
            remarks: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // New: attachments state to hold selected files
    const [attachments, setAttachments] = useState<File[]>([]);

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

    // New: file selection handler (multiple)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;
        setAttachments(prev => [...prev, ...files]);
        // clear the input value so same file can be re-selected if needed
        e.currentTarget.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const testExactSQLPayload = async () => {
        console.log('🧪 Testing with EXACT SQL payload structure...');

        // This is the EXACT same structure as your working SQL insert
        const exactSQLPayload = {
            pattern_code: 'PC-' + Date.now(), // Make it unique
            part_name: 'Gear Wheel',
            material_grade: 'EN8',
            chemical_composition: {
                C: '0.40',
                Mn: '0.70',
                Nodularity: 'N/A'
            },
            micro_structure: 'Fine pearlite with ferrite',
            tensile_strength_min: '550 MPa',
            yield_strength_min: '420 MPa',
            elongation: '12%',
            impact_room: '20 J',
            impact_cold: '18 J',
            hardness_surface: '62 HRC',
            hardness_core: '58 HRC',
            xray: 'No internal defects',
            mpi: 'No indications'
        };

        console.log('🔧 EXACT SQL Payload:', JSON.stringify(exactSQLPayload, null, 2));

        try {
            const response = await masterListService.submitMasterListJson(exactSQLPayload);
            const responseText = await response.text();
            console.log('📡 Response status:', response.status);
            console.log('📡 Response text:', responseText);

            if (response.ok) {
                console.log('✅ SUCCESS with exact SQL payload!');
                return true;
            } else {
                console.log('❌ FAILED with exact SQL payload');
                return false;
            }
        } catch (err) {
            console.error('❌ Error with exact SQL payload:', err);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // First, test with the exact SQL payload to see if it works
            console.log('🚀 Step 1: Testing with exact SQL payload...');
            const sqlTestSuccess = await testExactSQLPayload();

            if (!sqlTestSuccess) {
                throw new Error('Even the exact SQL payload fails! The issue is in the backend API validation.');
            }

            console.log('🚀 Step 2: Now trying with form data...');

            // Validate required fields
            if (!formData.pattern_code.trim()) {
                throw new Error('Pattern Code is required');
            }
            if (!formData.part_name.trim()) {
                throw new Error('Part Name is required');
            }

            // Prepare chemical composition - only include non-empty values
            const chemicalComposition: Record<string, string> = {};
            Object.entries(formData.chemical_composition).forEach(([element, value]) => {
                if (typeof value === 'string' && value.trim() !== '') {
                    chemicalComposition[element] = value.trim();
                }
            });

            // Create payload object (plain JS object)
            const payloadObj: Record<string, any> = {
                pattern_code: formData.pattern_code.trim(),
                part_name: formData.part_name.trim(),
                material_grade: formData.material_grade.trim() || null,
                chemical_composition: Object.keys(chemicalComposition).length > 0 ? chemicalComposition : null,
                micro_structure: formData.micro_structure.trim() || null,
                tensile_strength_min: formData.tensile_strength_min.trim() || null,
                yield_strength_min: formData.yield_strength_min.trim() || null,
                elongation: formData.elongation.trim() || null,
                impact_cold: formData.impact_cold.trim() || null,
                impact_room: formData.impact_room.trim() || null,
                hardness_surface: formData.hardness_surface.trim() || null,
                hardness_core: formData.hardness_core.trim() || null,
                xray: formData.xray.trim() || null,
                mpi: formData.mpi.trim() || null,
                tooling: formData.tooling || null // include tooling block
            };

            console.log('🔧 Form Data Payload:', JSON.stringify(payloadObj, null, 2));
            console.log('📎 Attachments count:', attachments.length);

            let response: Response;
            // If attachments present, send as FormData
            if (attachments.length > 0) {
                response = await masterListService.submitMasterListFormData(payloadObj, attachments);
            } else {
                // No attachments -> send JSON as before
                response = await masterListService.submitMasterListJson(payloadObj);
            }

            const responseText = await response.text();
            console.log('📡 Form Data Response status:', response.status);
            console.log('📡 Form Data Response text:', responseText);

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = responseText || errorMessage;
                }

                if (errorMessage.includes('Missing required fields') && sqlTestSuccess) {
                    errorMessage += '\n\n💡 The exact SQL payload works but form data fails. Check backend validation rules.';
                }

                throw new Error(errorMessage);
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                // Reset form and attachments
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
                        number_of_cavity_sp: '',
                        number_of_cavity_pp: '',
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
                        calculated_casting_weight_sp: '',
                        calculated_casting_weight_pp: '',
                        core_mask_weight_sp: '',
                        core_mask_weight_pp: '',
                        calculated_punch_weight_sp: '',
                        calculated_punch_weight_pp: '',
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
            }, 2000);

        } catch (err) {
            console.error('❌ Error submitting form:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while submitting the form');
        } finally {
            setLoading(false);
        }
    };

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
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
                    number_of_cavity_sp: '',
                    number_of_cavity_pp: '',
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
                    calculated_casting_weight_sp: '',
                    calculated_casting_weight_pp: '',
                    core_mask_weight_sp: '',
                    core_mask_weight_pp: '',
                    calculated_punch_weight_sp: '',
                    calculated_punch_weight_pp: '',
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
            setError(null);
            setSuccess(false);
            // Reset attachments as well
            setAttachments([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                width: '95%',
                maxWidth: '1200px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid #e0e0e0',
                    paddingBottom: '15px'
                }}>
                    <h3 style={{ margin: 0, color: '#333', fontWeight: 700 }}>Add to Master List</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        fontWeight: 500,
                        border: '1px solid #f5c6cb',
                        fontSize: '14px',
                        whiteSpace: 'pre-wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>❌</span>
                            <span style={{ flex: 1 }}>{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        fontWeight: 500,
                        border: '1px solid #c3e6cb',
                        fontSize: '14px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✅</span>
                            <span>Successfully added to master list!</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '15px', color: '#333' }}>Basic Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                                    Pattern Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.pattern_code}
                                    onChange={(e) => handleInputChange('pattern_code', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        backgroundColor: '#fafafa'
                                    }}
                                    placeholder="e.g., PC-001"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                                    Part Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.part_name}
                                    onChange={(e) => handleInputChange('part_name', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        backgroundColor: '#fafafa'
                                    }}
                                    placeholder="e.g., Gear Wheel"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                                    Material Grade
                                </label>
                                <input
                                    type="text"
                                    value={formData.material_grade}
                                    onChange={(e) => handleInputChange('material_grade', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        backgroundColor: '#fafafa'
                                    }}
                                    placeholder="e.g., EN8"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Chemical Composition Table */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '15px', color: '#333' }}>Chemical Composition</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#f8f9fa' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#2950bbff', color: 'white' }}>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>C%</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Si%</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Mn%</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>P%</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>S%</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Mg%</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Cr%</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Cu%</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Nodularity</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Pearlite</th>
                                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>Carbide</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {['C', 'Si', 'Mn', 'P', 'S', 'Mg', 'Cr', 'Cu', 'Nodularity', 'Pearlite', 'Carbide'].map((element) => (
                                            <td key={element} style={{ padding: '8px', textAlign: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={formData.chemical_composition[element as keyof typeof formData.chemical_composition]}
                                                    onChange={(e) => handleChemicalChange(element, e.target.value)}
                                                    style={{
                                                        width: '80%',
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        textAlign: 'center',
                                                        backgroundColor: 'white'
                                                    }}
                                                    placeholder="--"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Additional Properties */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '15px', color: '#333' }}>Material Properties</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Micro Structure</label>
                                <textarea
                                    value={formData.micro_structure}
                                    onChange={(e) => handleInputChange('micro_structure', e.target.value)}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        backgroundColor: '#fafafa'
                                    }}
                                    placeholder="e.g., Fine pearlite with ferrite"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Tensile Strength (Min)</label>
                                    <input
                                        type="text"
                                        value={formData.tensile_strength_min}
                                        onChange={(e) => handleInputChange('tensile_strength_min', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#fafafa' }}
                                        placeholder="e.g., 550 MPa"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Yield Strength (Min)</label>
                                    <input
                                        type="text"
                                        value={formData.yield_strength_min}
                                        onChange={(e) => handleInputChange('yield_strength_min', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#fafafa' }}
                                        placeholder="e.g., 420 MPa"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Elongation</label>
                                    <input
                                        type="text"
                                        value={formData.elongation}
                                        onChange={(e) => handleInputChange('elongation', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#fafafa' }}
                                        placeholder="e.g., 12%"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Impact (Cold)</label>
                                    <input
                                        type="text"
                                        value={formData.impact_cold}
                                        onChange={(e) => handleInputChange('impact_cold', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#fafafa' }}
                                        placeholder="e.g., 18 J"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Impact (Room)</label>
                                    <input
                                        type="text"
                                        value={formData.impact_room}
                                        onChange={(e) => handleInputChange('impact_room', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#fafafa' }}
                                        placeholder="e.g., 20 J"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Hardness (Surface)</label>
                                    <input
                                        type="text"
                                        value={formData.hardness_surface}
                                        onChange={(e) => handleInputChange('hardness_surface', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#fafafa' }}
                                        placeholder="e.g., 62 HRC"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Hardness (Core)</label>
                                    <input
                                        type="text"
                                        value={formData.hardness_core}
                                        onChange={(e) => handleInputChange('hardness_core', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#fafafa' }}
                                        placeholder="e.g., 58 HRC"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>X-Ray</label>
                                    <input
                                        type="text"
                                        value={formData.xray}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            // Check if MPI is included
                                            const mpiMatch = value.match(/MPI\s*[:\-]\s*(.*)$/i);

                                            if (mpiMatch) {
                                                // Extract MPI value
                                                const mpi = mpiMatch[1].trim();

                                                // Extract X-Ray part before MPI
                                                const xrayValue = value
                                                    .replace(mpiMatch[0], "")  // remove "MPI: ..."
                                                    .replace(/•$/, "")         // remove trailing dot if exists
                                                    .trim();

                                                // Update both fields
                                                handleInputChange("xray", xrayValue);
                                                handleInputChange("mpi", mpi);
                                            } else {
                                                // Standard X-ray update
                                                handleInputChange("xray", value);
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#fafafa'
                                        }}
                                        placeholder="e.g., No internal defects"
                                    />
                                </div>


                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>MPI</label>
                                    <input
                                        type="text"
                                        value={formData.mpi}
                                        onChange={(e) => handleInputChange('mpi', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            backgroundColor: '#fafafa'
                                        }}
                                        placeholder="e.g., No indications"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* New: Attachments Section */}
                    <div style={{
                        marginBottom: '20px',
                        backgroundColor: '#f0f0f0',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h4 style={{ marginBottom: '15px', color: '#333', fontWeight: 600 }}>
                            Attachment
                        </h4>

                        {/* Custom Styled File Upload Button */}
                        <label
                            style={{
                                display: 'inline-block',
                                padding: '12px 18px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                marginBottom: '15px',
                                transition: 'background-color 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0069d9'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#007bff'; }}
                        >
                            📎 Choose Files

                            <input
                                type="file"
                                accept=".pdf,image/*"
                                multiple
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </label>

                        {/* File Preview */}
                        {attachments.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {attachments.map((file, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            backgroundColor: '#ffffff',
                                            padding: '12px 15px',
                                            borderRadius: '6px',
                                            border: '1px solid #e0e0e0',
                                            transition: 'background-color 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            const el = e.currentTarget;
                                            el.style.backgroundColor = '#f7faff';
                                            el.style.boxShadow = '0 3px 6px rgba(0,0,0,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            const el = e.currentTarget;
                                            el.style.backgroundColor = '#ffffff';
                                            el.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                                                {file.name}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#666' }}>
                                                {Math.round(file.size / 1024)} KB
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            style={{
                                                padding: '8px 14px',
                                                backgroundColor: '#ff4d4d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e63939'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ff4d4d'; }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tooling (Pattern) Data Sheet Table – FINAL FIX */}
                    <div style={{
                        marginBottom: '20px',
                        backgroundColor: '#fff',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        fontFamily: "'Poppins', sans-serif"
                    }}>
                        <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: '8px', fontSize: '16px' }}>
                            TOOLING ( PATTERN ) DATA SHEET
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #333', padding: '10px' }}>DESCRIPTION</th>
                                        <th style={{ border: '1px solid #333', padding: '10px' }}>Value</th>
                                        <th style={{ border: '1px solid #333', padding: '10px' }}> Description</th>
                                        <th style={{ border: '1px solid #333', padding: '10px' }}>SP side pattern</th>
                                        <th style={{ border: '1px solid #333', padding: '10px' }}>PP side pattern</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {[
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
                                            right: "Calculated casting weight in kgs",
                                            fieldLeft: "core_weight",
                                            sp: "core_weight_sp",
                                            pp: "core_weight_pp"
                                        },
                                        {
                                            left: "Core mask weight in kgs",
                                            right: "Calculated punch weight in kgs",
                                            fieldLeft: "core_mask_weight",
                                            sp: "core_mask_weight_sp",
                                            pp: "core_mask_weight_pp"
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
                                            sp: "estimated_casting_weight_sp",
                                            pp: "estimated_casting_weight_pp",
                                            isYieldRow: true
                                        }
                                    ].map((row: any, idx) => (
                                        <tr key={idx}>

                                            {/* LEFT label */}
                                            <td style={{ border: "1px solid #333", padding: "10px" }}>
                                                {row.left}
                                            </td>

                                            {/* Editable LEFT input */}
                                            <td style={{ border: "1px solid #333", padding: "8px" }}>
                                                <input
                                                    type="text"
                                                    value={formData.tooling[row.fieldLeft] || ""}
                                                    onChange={(e) => handleToolingChange(row.fieldLeft, e.target.value)}
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        border: "1px solid #ddd",
                                                        borderRadius: "4px",
                                                        backgroundColor: "#fafafa"
                                                    }}
                                                />
                                            </td>

                                            {/* RIGHT LABEL */}
                                            <td style={{ border: "1px solid #333", padding: "10px" }}>
                                                {row.right}
                                            </td>

                                            {/* SP field */}
                                            <td style={{ border: "1px solid #333", padding: "8px" }}>
                                                <input
                                                    type="text"
                                                    value={formData.tooling[row.sp] || ""}
                                                    onChange={(e) => handleToolingChange(row.sp, e.target.value)}
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px",
                                                        border: "1px solid #ddd",
                                                        borderRadius: "4px",
                                                        backgroundColor: "#fafafa"
                                                    }}
                                                />
                                            </td>

                                            {/* PP field */}
                                            <td style={{ border: "1px solid #333", padding: "8px" }}>
                                                {/* If this is the special Yield row → show yield input */}
                                                {row.isYieldRow ? (
                                                    <div style={{ display: "flex", flexDirection: "column" }}>


                                                        {/* Yield label + input */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                            <span style={{ fontWeight: 600 }}>Yield :</span>

                                                            <input
                                                                type="text"
                                                                value={formData.tooling.yield_label || ""}
                                                                onChange={(e) => handleToolingChange("yield_label", e.target.value)}
                                                                placeholder="Enter yield"
                                                                style={{
                                                                    flex: 1,
                                                                    padding: "8px",
                                                                    border: "1px solid #ddd",
                                                                    borderRadius: "4px",
                                                                    backgroundColor: "#fafafa"
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Normal PP input for all other rows */
                                                    <input
                                                        type="text"
                                                        value={formData.tooling[row.pp] || ""}
                                                        onChange={(e) => handleToolingChange(row.pp, e.target.value)}
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            border: "1px solid #ddd",
                                                            borderRadius: "4px",
                                                            backgroundColor: "#fafafa"
                                                        }}
                                                    />
                                                )}
                                            </td>


                                        </tr>
                                    ))}

                                    {/* Remarks */}
                                    <tr>
                                        <td colSpan={5} style={{ border: "1px solid #333", padding: "10px" }}>
                                            <label style={{ fontWeight: 600 }}>Remarks:</label>
                                            <textarea
                                                value={formData.tooling.remarks || ""}
                                                onChange={(e) => handleToolingChange("remarks", e.target.value)}
                                                rows={4}
                                                style={{
                                                    width: "100%",
                                                    marginTop: "6px",
                                                    padding: "10px",
                                                    border: "1px solid #ddd",
                                                    borderRadius: "4px",
                                                    backgroundColor: "#fafafa"
                                                }}
                                            />
                                        </td>
                                    </tr>

                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            justifyContent: "flex-end",
                            marginTop: "20px",
                            paddingTop: "20px",
                            borderTop: "1px solid #ddd",
                        }}
                    >
                        {/* Cancel Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: "#6c757d",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight: 500,
                                fontSize: "14px",
                                transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#545b62";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#6c757d";
                            }}
                        >
                            Cancel
                        </button>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: loading ? "#6c757d" : "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontWeight: 500,
                                fontSize: "14px",
                            }}
                            onMouseEnter={(e) => {
                                const target = e.currentTarget as HTMLButtonElement;
                                if (!loading) target.style.backgroundColor = "#218838";
                            }}
                            onMouseLeave={(e) => {
                                const target = e.currentTarget as HTMLButtonElement;
                                target.style.backgroundColor = loading ? "#6c757d" : "#28a745";
                            }}
                        >
                            {loading ? "Testing..." : "Debug & Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMasterModal;
