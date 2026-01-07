import React, { useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Grid,
    Container,
    ThemeProvider,
    useMediaQuery,
    useTheme
} from "@mui/material";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useLocation, useNavigate } from "react-router-dom";
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { inspectionService } from "../services/inspectionService";
import SaclHeader from "../components/common/SaclHeader";
import { COLORS, appTheme } from '../theme/appTheme';

const ReportSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Box sx={{
        mb: 2,
        '@media print': {
            mb: 0.5,
            pageBreakInside: 'auto'
        }
    }}>
        <Typography variant="h6" sx={{
            fontWeight: 'bold',
            mb: 0.5,
            borderBottom: '2px solid #000',
            '@media print': {
                fontSize: '9pt',
                mb: 0.2,
                borderBottom: '1px solid #000',
                lineHeight: 1.2
            }
        }}>
            {title}
        </Typography>
        {children}
    </Box>
);

const VerticalTable = ({ data }: { data: { label: string, value: string | number | null }[] }) => (
    <Table size="small" sx={{
        border: '1px solid #ddd',
        mb: 1,
        '@media print': {
            mb: 0.1,
            fontSize: '6pt'
        }
    }}>
        <TableBody>
            {data.map((item, index) => (
                <TableRow key={index}>
                    <TableCell sx={{
                        fontWeight: 'bold',
                        bgcolor: '#f5f5f5',
                        width: '40%',
                        border: '1px solid #ddd',
                        padding: '4px 8px',
                        '@media print': {
                            padding: '0px 2px',
                            fontSize: '6pt',
                            height: 'auto',
                            lineHeight: 1.1
                        }
                    }}>
                        {item.label}
                    </TableCell>
                    <TableCell sx={{
                        border: '1px solid #ddd',
                        padding: '4px 8px',
                        '@media print': {
                            padding: '0px 2px',
                            fontSize: '6pt',
                            height: 'auto',
                            lineHeight: 1.1
                        }
                    }}>
                        {item.value || "-"}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const SimpleTable = ({ headers, rows }: { headers: string[], rows: (string | number | null)[][] }) => (
    <Table size="small" sx={{
        border: '1px solid #ddd',
        mb: 1,
        '@media print': {
            mb: 0.1,
            fontSize: '6pt'
        }
    }}>
        <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                {headers.map((h, i) => (
                    <TableCell key={i} sx={{
                        fontWeight: 'bold',
                        border: '1px solid #ddd',
                        padding: '4px 8px',
                        '@media print': {
                            padding: '0px 2px',
                            fontSize: '6pt',
                            height: 'auto',
                            lineHeight: 1.1
                        }
                    }}>{h}</TableCell>
                ))}
            </TableRow>
        </TableHead>
        <TableBody>
            {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} sx={{
                            border: '1px solid #ddd',
                            padding: '4px 8px',
                            '@media print': {
                                padding: '0px 2px',
                                fontSize: '6pt',
                                height: 'auto',
                                lineHeight: 1.1
                            }
                        }}>{cell ?? "-"}</TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

export default function FullReportPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const useQuery = () => new URLSearchParams(location.search);
    const query = useQuery();
    const trialId = query.get("trial_id");

    useEffect(() => {
        if (!trialId) {
            setError("No Trial ID provided");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const response = await inspectionService.getAllDepartmentData(trialId);
                if (response.success) {
                    setData(response.data);
                } else {
                    setError("Failed to fetch data");
                }
            } catch (err) {
                console.error(err);
                setError("Error fetching data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [trialId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><LoadingSpinner /></Box>;
    if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'red' }}><Typography variant="h5">{error}</Typography></Box>;
    if (!data) return null;

    const trialCard = data.trial_cards?.[0] || {};
    const pouring = data.pouring_details?.[0] || {};
    const sand = data.sand_properties?.[0] || {};
    const moulding = data.mould_correction?.[0] || {};
    const meta = data.metallurgical_inspection?.[0] || {};
    const visual = data.visual_inspection?.[0] || {};
    const dimensional = data.dimensional_inspection?.[0] || {};

    const mcShop = data.machine_shop?.[0] || {};

    const safeParse = (data: any, fallback: any = {}) => {
        if (!data) return fallback;
        if (typeof data === 'object') return data;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.warn("JSON parse error:", e, data);
            return fallback;
        }
    };

    const tcChem = safeParse(trialCard.chemical_composition);
    const tcTensile = safeParse(trialCard.tensile);
    const mcInspections = safeParse(mcShop.inspections, []);
    const pComp = safeParse(pouring.composition);
    const pInoc = safeParse(pouring.inoculation);
    const pRem = safeParse(pouring.other_remarks);
    const mechRows = safeParse(meta.mechanical_properties, []);
    const impactRows = safeParse(meta.impact_strength, []);
    const hardRows = safeParse(meta.hardness, []);
    const ndtRows = safeParse(meta.ndt_inspection, []);
    const microRows = safeParse(meta.microstructure, []);

    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{
                bgcolor: '#fff',
                minHeight: '100vh',
                py: 4,
                "@media print": {
                    py: 0,
                    '@page': {
                        size: 'A4',
                        margin: '0.5cm'
                    }
                }
            }}>
                <Container maxWidth="lg" sx={{
                    "@media print": {
                        maxWidth: '100%',
                        padding: 0
                    }
                }}>
                    {/* Header Actions - Hidden on Print */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, "@media print": { display: 'none' } }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                marginRight: '8px',
                                fontSize: '14px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#545b62')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
                        >
                            ← Back to Dashboard
                        </button>
                        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
                            Print Report
                        </Button>
                    </Box>

                    {/* Report Header */}
                    <SaclHeader />
                    <Box sx={{ textAlign: 'center', mb: 4, mt: 2, borderBottom: '2px solid #000', pb: 2, '@media print': { mb: 1, mt: 0, pb: 0.5, borderBottomWidth: '1px' } }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ '@media print': { fontSize: '12pt', fontWeight: 800 } }}>FULL INSPECTION REPORT</Typography>
                        <Typography variant="h6" sx={{ '@media print': { fontSize: '9pt' } }}>Trial ID: {trialId}</Typography>
                    </Box>


                    {/* PAGE 1 CONTENT WRAPPER */}
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', gap: 2,
                        '@media print': { display: 'block' }
                    }}>
                        {/* ROW 1: Trial Card & Pouring */}
                        <Box sx={{
                            display: 'flex', gap: 4,
                            '@media print': { display: 'flex', gap: '0.5cm', mb: '0.2cm' }
                        }}>
                            {/* 0. TRIAL CARD DETAILS */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {Object.keys(trialCard).length > 0 && (
                                    <ReportSection title="1. TRIAL CARD DETAILS">
                                        <VerticalTable data={[
                                            { label: "Part Name", value: trialCard.part_name },
                                            { label: "Pattern Code", value: trialCard.pattern_code },
                                            { label: "Trial No", value: trialCard.trial_id },
                                            { label: "Date of Sampling", value: trialCard.date_of_sampling },
                                            { label: "Mould Count (Plan)", value: trialCard.plan_moulds || trialCard.no_of_moulds },
                                            { label: "Mould Count (Actual)", value: trialCard.actual_moulds },
                                            { label: "Machine", value: trialCard.disa },
                                            { label: "Reason", value: trialCard.reason_for_sampling },
                                        ]} />
                                    </ReportSection>
                                )}
                            </Box>

                            {/* 1. POURING DETAILS */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {Object.keys(pouring).length > 0 && (
                                    <ReportSection title="2. POURING DETAILS">
                                        <VerticalTable data={[
                                            { label: "Pour Date", value: pouring.pour_date },
                                            { label: "Heat Code", value: pouring.heat_code },
                                            { label: "Pouring Temp (°C)", value: pouring.pouring_temp_c },
                                            { label: "Pouring Time (sec)", value: pouring.pouring_time_sec },
                                            { label: "F/C Heat No.", value: pRem["F/C & Heat No."] },
                                            { label: "No. of Mould Poured", value: pouring.no_of_mould_poured },
                                            { label: "Inoculation Type", value: pInoc.Text },
                                            { label: "Stream Inoc.", value: pInoc.Stream },
                                            { label: "Inmould Inoc.", value: pInoc.Inmould }
                                        ]} />
                                        <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold', '@media print': { fontSize: '8pt', mt: 0.5, mb: 0.2 } }}>Chemical Composition</Typography>
                                        <SimpleTable
                                            headers={Object.keys(pComp)}
                                            rows={[Object.values(pComp)]}
                                        />
                                    </ReportSection>
                                )}
                            </Box>
                        </Box>

                        {/* ROW 2: Sand & Mould */}
                        <Box sx={{
                            display: 'flex', gap: 4,
                            '@media print': { display: 'flex', gap: '0.5cm', mb: '0.2cm' }
                        }}>
                            {/* 2. SAND PROPERTIES */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {Object.keys(sand).length > 0 && (
                                    <ReportSection title="3. SAND PROPERTIES">
                                        <VerticalTable data={[
                                            { label: "Date", value: sand.date },
                                            { label: "T. Clay %", value: sand.t_clay },
                                            { label: "A. Clay %", value: sand.a_clay },
                                            { label: "V.C.M. %", value: sand.vcm },
                                            { label: "L.O.I. %", value: sand.loi },
                                            { label: "A.F.S.", value: sand.afs },
                                            { label: "G.C.S.", value: sand.gcs },
                                            { label: "M.O.I.", value: sand.moi },
                                            { label: "Compactability", value: sand.compactability },
                                            { label: "Permeability", value: sand.permeability },
                                            { label: "Remarks", value: sand.remarks },
                                        ]} />
                                    </ReportSection>
                                )}
                            </Box>

                            {/* 3. MOULD CORRECTION */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {Object.keys(moulding).length > 0 && (
                                    <ReportSection title="4. MOULD CORRECTION">
                                        <VerticalTable data={[
                                            { label: "Date", value: moulding.date },
                                            { label: "Mould Thickness", value: moulding.mould_thickness },
                                            { label: "Compressibility", value: moulding.compressability },
                                            { label: "Squeeze Pressure", value: moulding.squeeze_pressure },
                                            { label: "Mould Hardness", value: moulding.mould_hardness },
                                            { label: "Remarks", value: moulding.remarks }
                                        ]} />
                                    </ReportSection>
                                )}
                            </Box>
                        </Box>

                    </Box>



                    {/* 4. METALLURGICAL */}
                    {Object.keys(meta).length > 0 && (
                        <ReportSection title="5. METALLURGICAL INSPECTION">

                            {/* Row 1: Mechanical & Hardness */}
                            <Box sx={{ display: 'flex', gap: 4, '@media print': { display: 'flex', gap: '0.5cm', mb: '0.2cm' } }}>
                                {/* Mechanical Properties */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {mechRows.length > 0 && (
                                        <Box mb={2} sx={{ '@media print': { mb: 0 } }}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ '@media print': { fontSize: '8pt', mb: 0.2 } }}>Mechanical Properties</Typography>
                                            <SimpleTable
                                                headers={["Parameter", "Value", "Status", "Remarks"]}
                                                rows={mechRows.map((r: any) => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])} />
                                        </Box>
                                    )}
                                </Box>
                                {/* Hardness */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {hardRows.length > 0 && (
                                        <Box mb={2} sx={{ '@media print': { mb: 0 } }}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ '@media print': { fontSize: '8pt', mb: 0.2 } }}>Hardness</Typography>
                                            <SimpleTable
                                                headers={["Parameter", "Value", "Status", "Remarks"]}
                                                rows={hardRows.map((r: any) => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])} />
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            {/* Row 2: Impact & NDT */}
                            <Box sx={{ display: 'flex', gap: 4, '@media print': { display: 'flex', gap: '0.5cm', mb: '0.2cm' } }}>
                                {/* Impact Strength */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {impactRows.length > 0 && (
                                        <Box mb={2} sx={{ '@media print': { mb: 0 } }}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ '@media print': { fontSize: '8pt', mb: 0.2 } }}>Impact Strength</Typography>
                                            <SimpleTable
                                                headers={["Parameter", "Value", "Status", "Remarks"]}
                                                rows={impactRows.map((r: any) => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])} />
                                        </Box>
                                    )}
                                </Box>
                                {/* NDT */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {ndtRows.length > 0 && (
                                        <Box mb={2} sx={{ '@media print': { mb: 0 } }}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ '@media print': { fontSize: '8pt', mb: 0.2 } }}>NDT Inspection Analysis</Typography>
                                            <SimpleTable
                                                headers={["Parameter", "Value", "Status", "Remarks"]}
                                                rows={ndtRows.map((r: any) => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])} />
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            {/* Microstructure */}
                            {microRows.length > 0 && (
                                <Box mb={2} sx={{ '@media print': { mb: 0 } }}>
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ '@media print': { fontSize: '8pt', mb: 0.2 } }}>Microstructure Examination</Typography>
                                    <Table size="small" sx={{ border: '1px solid #ddd', '@media print': { fontSize: '6pt' } }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                <TableCell sx={{ border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>Parameter</TableCell>
                                                <TableCell sx={{ border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>Values</TableCell>
                                                <TableCell sx={{ border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>Status</TableCell>
                                                <TableCell sx={{ border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {microRows.map((row: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>{row.label}</TableCell>
                                                    <TableCell sx={{ border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>{row.values?.join(", ")}</TableCell>
                                                    <TableCell sx={{ border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>{row.ok ? "OK" : "NOT OK"}</TableCell>
                                                    <TableCell sx={{ border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>{row.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            )}

                        </ReportSection>
                    )}



                    {/* Row 3: Visual & Dimensional */}
                    <Box sx={{ display: 'flex', gap: 4, '@media print': { display: 'flex', gap: '0.5cm', mb: 0 } }}>
                        {/* 5. VISUAL INSPECTION */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {Object.keys(visual).length > 0 && (
                                <ReportSection title="6. VISUAL INSPECTION">
                                    <VerticalTable data={[
                                        { label: "Result", value: visual.visual_ok ? "OK" : "NOT OK" },
                                    ]} />
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ '@media print': { fontSize: '8pt', mb: 0.2 } }}>Remarks</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2, '@media print': { mb: 0.5, fontSize: '6pt' } }}>{visual.remarks}</Typography>
                                    {/* Visual Inspections Table */}
                                    {(() => {
                                        const visInspections = safeParse(visual.inspections, []);
                                        if (Array.isArray(visInspections) && visInspections.length > 0) {
                                            const displayHeaders = [
                                                'Cav No',
                                                'Insp Qty',
                                                'Rej Qty',
                                                'Reason'
                                            ];
                                            const dataKeys = [
                                                'Cavity number',
                                                'Inspected Quantity',
                                                'Rejected Quantity',
                                                'Reason for rejection'
                                            ];
                                            const rows = visInspections.map((row: any) => dataKeys.map(k => row[k]));
                                            return <SimpleTable headers={displayHeaders} rows={rows} />;
                                        }
                                        return null;
                                    })()}
                                </ReportSection>
                            )}
                        </Box>

                        {/* 6. DIMENSIONAL INSPECTION */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {Object.keys(dimensional).length > 0 && (
                                <ReportSection title="7. DIMENSIONAL INSPECTION">
                                    <VerticalTable data={[
                                        { label: "Inspection Date", value: dimensional.inspection_date },
                                        { label: "Casting Weight (kg)", value: dimensional.casting_weight },
                                        { label: "Bunch Weight (kg)", value: dimensional.bunch_weight },
                                        { label: "No. of Cavities", value: dimensional.no_of_cavities },
                                        { label: "Yields (%)", value: dimensional.yields },
                                    ]} />
                                    <Typography variant="subtitle2" fontWeight="bold" sx={{ '@media print': { fontSize: '8pt', mb: 0.2 } }}>Remarks</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2, '@media print': { mb: 0.5, fontSize: '6pt' } }}>{dimensional.remarks}</Typography>

                                    {/* Dimensional Inspections Table */}
                                    {(() => {
                                        const dimInspections = safeParse(dimensional.inspections, []);
                                        if (Array.isArray(dimInspections) && dimInspections.length > 0) {
                                            // Explicitly define headers to ensure correct order
                                            const headers = ["Cavity Number", "Casting Weight"];
                                            const rows = dimInspections.map((row: any) => headers.map((h) => row[h]));
                                            return <SimpleTable headers={headers} rows={rows} />;
                                        }
                                        return null;
                                    })()}
                                </ReportSection>
                            )}
                        </Box>
                    </Box>

                    {/* 7. MACHINE SHOP */}
                    {Object.keys(mcShop).length > 0 && (
                        <ReportSection title="8. MACHINE SHOP INSPECTION">
                            <VerticalTable data={[
                                { label: "Inspection Date", value: mcShop.inspection_date },
                                { label: "Remarks", value: mcShop.remarks }
                            ]} />

                            {mcInspections.length > 0 && (
                                <Table size="small" sx={{ border: '1px solid #ddd', '@media print': { fontSize: '6.5pt' } }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                            {/* Dynamically get headers from the first object, excluding hidden ones if any */}
                                            {Object.keys(mcInspections[0] || {}).map((key, i) => (
                                                <TableCell key={i} sx={{ fontWeight: 'bold', border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>{key}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mcInspections.map((row: any, i: number) => (
                                            <TableRow key={i}>
                                                {Object.values(row).map((val: any, j: number) => (
                                                    <TableCell key={j} sx={{ border: '1px solid #ddd', padding: '4px 8px', '@media print': { padding: '0px 2px' } }}>{val}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </ReportSection>
                    )}


                </Container>
            </Box>
        </ThemeProvider>
    );
}
