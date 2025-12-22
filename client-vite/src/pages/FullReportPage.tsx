import React, { useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    CircularProgress,
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
import { useLocation, useNavigate } from "react-router-dom";
import PrintIcon from '@mui/icons-material/Print';
import { inspectionService } from "../services/inspectionService";
import SaclHeader from "../components/common/SaclHeader";
import { COLORS, appTheme } from '../theme/appTheme';

const ReportSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Box sx={{
        mb: 4,
        breakInside: 'avoid',
        '@media print': {
            mb: 1.5
        }
    }}>
        <Typography variant="h6" sx={{
            fontWeight: 'bold',
            mb: 1,
            borderBottom: '2px solid #000',
            '@media print': {
                fontSize: '11pt',
                mb: 0.5,
                borderBottom: '1px solid #000'
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
        mb: 2,
        '@media print': {
            mb: 0.5,
            fontSize: '8pt'
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
                        '@media print': {
                            padding: '2px 4px',
                            fontSize: '8pt'
                        }
                    }}>
                        {item.label}
                    </TableCell>
                    <TableCell sx={{
                        border: '1px solid #ddd',
                        '@media print': {
                            padding: '2px 4px',
                            fontSize: '8pt'
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
        mb: 2,
        '@media print': {
            mb: 0.5,
            fontSize: '7pt'
        }
    }}>
        <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                {headers.map((h, i) => (
                    <TableCell key={i} sx={{
                        fontWeight: 'bold',
                        border: '1px solid #ddd',
                        '@media print': {
                            padding: '2px 3px',
                            fontSize: '7pt'
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
                            '@media print': {
                                padding: '2px 3px',
                                fontSize: '7pt'
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

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, "@media print": { display: 'none' } }}>
                        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
                            Print Report
                        </Button>
                    </Box>

                    {/* Report Header */}
                    <SaclHeader />
                    <Box sx={{ textAlign: 'center', mb: 4, mt: 2, borderBottom: '2px solid #000', pb: 2 }}>
                        <Typography variant="h4" fontWeight="bold">FULL INSPECTION REPORT</Typography>
                        <Typography variant="h6">Trial ID: {trialId}</Typography>
                    </Box>

                    {/* 0. TRIAL CARD DETAILS */}
                    {Object.keys(trialCard).length > 0 && (
                        <ReportSection title="0. TRIAL CARD DETAILS">
                            <VerticalTable data={[
                                { label: "Part Name", value: trialCard.part_name },
                                { label: "Pattern Code", value: trialCard.pattern_code },
                                { label: "Trial No", value: trialCard.trial_id },
                                { label: "Date of Sampling", value: trialCard.date_of_sampling },
                                { label: "Mould Count", value: trialCard.no_of_moulds },
                                { label: "Machine", value: trialCard.disa },
                                { label: "Reason", value: trialCard.reason_for_sampling },
                            ]} />
                        </ReportSection>
                    )}

                    {/* 1. POURING DETAILS */}
                    {Object.keys(pouring).length > 0 && (
                        <ReportSection title="1. POURING DETAILS">
                            <VerticalTable data={[
                                { label: "Pour Date", value: pouring.pour_date },
                                { label: "Heat Code", value: pouring.heat_code },
                                { label: "Pouring Temp (°C)", value: pouring.pouring_temp_c },
                                { label: "Pouring Time (sec)", value: pouring.pouring_time_sec },
                                { label: "F/C Heat No.", value: pRem["F/C & Heat No."] },
                                { label: "Stream Inoc.", value: pInoc.Stream },
                                { label: "Inmould Inoc.", value: pInoc.Inmould }
                            ]} />
                            <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold' }}>Chemical Composition</Typography>
                            <SimpleTable
                                headers={Object.keys(pComp)}
                                rows={[Object.values(pComp)]}
                            />
                        </ReportSection>
                    )}


                    {/* 2. SAND PROPERTIES */}
                    {Object.keys(sand).length > 0 && (
                        <ReportSection title="2. SAND PROPERTIES">
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

                    {/* Page Break - Split into Page 2 */}
                    <Box sx={{
                        "@media print": {
                            pageBreakAfter: 'always',
                            breakAfter: 'page'
                        }
                    }} />


                    {/* 3. MOULDING DETAILS */}
                    {Object.keys(moulding).length > 0 && (
                        <ReportSection title="3. MOULD CORRECTION">
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


                    {/* 4. METALLURGICAL */}
                    {Object.keys(meta).length > 0 && (
                        <ReportSection title="4. METALLURGICAL INSPECTION">

                            {/* Mechanical Properties */}
                            {mechRows.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="subtitle2" fontWeight="bold">Mechanical Properties</Typography>
                                    <SimpleTable
                                        headers={["Parameter", "Value", "Status", "Remarks"]}
                                        rows={mechRows.map((r: any) => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])} />
                                </Box>
                            )}

                            {/* Impact Strength */}
                            {impactRows.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="subtitle2" fontWeight="bold">Impact Strength</Typography>
                                    <SimpleTable
                                        headers={["Parameter", "Value", "Status", "Remarks"]}
                                        rows={impactRows.map((r: any) => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])} />
                                </Box>
                            )}

                            {/* Hardness */}
                            {hardRows.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="subtitle2" fontWeight="bold">Hardness</Typography>
                                    <SimpleTable
                                        headers={["Parameter", "Value", "Status", "Remarks"]}
                                        rows={hardRows.map((r: any) => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])} />
                                </Box>
                            )}

                            {/* NDT */}
                            {ndtRows.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="subtitle2" fontWeight="bold">NDT Inspection Analysis</Typography>
                                    <SimpleTable
                                        headers={["Parameter", "Value", "Status", "Remarks"]}
                                        rows={ndtRows.map((r: any) => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])} />
                                </Box>
                            )}

                            {/* Microstructure */}
                            {microRows.length > 0 && (
                                <Box mb={2}>
                                    <Typography variant="subtitle2" fontWeight="bold">Microstructure Examination</Typography>
                                    <Table size="small" sx={{ border: '1px solid #ddd' }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                <TableCell sx={{ border: '1px solid #ddd' }}>Parameter</TableCell>
                                                <TableCell sx={{ border: '1px solid #ddd' }}>Values</TableCell>
                                                <TableCell sx={{ border: '1px solid #ddd' }}>Status</TableCell>
                                                <TableCell sx={{ border: '1px solid #ddd' }}>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {microRows.map((row: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell sx={{ border: '1px solid #ddd', fontWeight: 'bold' }}>{row.label}</TableCell>
                                                    <TableCell sx={{ border: '1px solid #ddd' }}>{row.values?.join(", ")}</TableCell>
                                                    <TableCell sx={{ border: '1px solid #ddd' }}>{row.ok ? "OK" : "NOT OK"}</TableCell>
                                                    <TableCell sx={{ border: '1px solid #ddd' }}>{row.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            )}

                        </ReportSection>
                    )}


                    {/* 5. VISUAL INSPECTION */}
                    {Object.keys(visual).length > 0 && (
                        <ReportSection title="5. VISUAL INSPECTION">
                            <VerticalTable data={[
                                { label: "Inspector", value: visual.user_name || '-' },
                                { label: "Result", value: visual.visual_ok ? "OK" : "NOT OK" },
                            ]} />
                            <Typography variant="subtitle2" fontWeight="bold">Remarks</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{visual.remarks}</Typography>
                            {/* Visual Inspections Table */}
                            {(() => {
                                const visInspections = safeParse(visual.inspections, []);
                                if (Array.isArray(visInspections) && visInspections.length > 0) {
                                    const headers = [
                                        'Cavity number',
                                        'Inspected Quantity',
                                        'Accepted Quantity',
                                        'Rejected Quantity',
                                        'Rejection Percentage',
                                        'Reason for rejection'
                                    ];
                                    const rows = visInspections.map((row: any) => headers.map(h => row[h]));
                                    return <SimpleTable headers={headers} rows={rows} />;
                                }
                                return null;
                            })()}
                        </ReportSection>
                    )}

                    {/* 6. DIMENSIONAL INSPECTION */}
                    {Object.keys(dimensional).length > 0 && (
                        <ReportSection title="6. DIMENSIONAL INSPECTION">
                            <VerticalTable data={[
                                { label: "Inspection Date", value: dimensional.inspection_date },
                                { label: "Casting Weight (kg)", value: dimensional.casting_weight },
                                { label: "Bunch Weight (kg)", value: dimensional.bunch_weight },
                                { label: "No. of Cavities", value: dimensional.no_of_cavities },
                                { label: "Yields (%)", value: dimensional.yields },
                            ]} />
                            <Typography variant="subtitle2" fontWeight="bold">Remarks</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{dimensional.remarks}</Typography>

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

                    {/* 7. MACHINE SHOP */}
                    {mcInspections.length > 0 && (
                        <ReportSection title="7. MACHINE SHOP INSPECTION">
                            <Table size="small" sx={{ border: '1px solid #ddd' }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        {/* Dynamically get headers from the first object, excluding hidden ones if any */}
                                        {Object.keys(mcInspections[0] || {}).map((key, i) => (
                                            <TableCell key={i} sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{key}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mcInspections.map((row: any, i: number) => (
                                        <TableRow key={i}>
                                            {Object.values(row).map((val: any, j: number) => (
                                                <TableCell key={j} sx={{ border: '1px solid #ddd' }}>{val}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>
                    )}


                </Container>
            </Box>
        </ThemeProvider>
    );
}
