import PDFDocument from 'pdfkit';

// Helper to fetch data (extracted from the controller logic)
export const fetchTrialData = async (trial_id, trx) => {
    if (!trial_id) return null;
    trial_id = trial_id.replace(/['"]+/g, '');

    const [trial_cards] = await trx.query(
        `SELECT tc.*, mc.chemical_composition AS spec_chem, mc.micro_structure AS spec_micro 
         FROM trial_cards tc 
         LEFT JOIN master_card mc ON tc.pattern_code = mc.pattern_code 
         WHERE tc.trial_id = @trial_id`, { trial_id }
    );
    const [pouring_details] = await trx.query(
        `SELECT * FROM pouring_details WHERE trial_id = @trial_id`, { trial_id }
    );
    const [sand_properties] = await trx.query(
        `SELECT * FROM sand_properties WHERE trial_id = @trial_id`, { trial_id }
    );
    const [mould_correction] = await trx.query(
        `SELECT * FROM mould_correction WHERE trial_id = @trial_id`, { trial_id }
    );
    const [metallurgical_inspection] = await trx.query(
        `SELECT * FROM metallurgical_inspection WHERE trial_id = @trial_id`, { trial_id }
    );
    const [visual_inspection] = await trx.query(
        `SELECT * FROM visual_inspection WHERE trial_id = @trial_id`, { trial_id }
    );
    const [dimensional_inspection] = await trx.query(
        `SELECT * FROM dimensional_inspection WHERE trial_id = @trial_id`, { trial_id }
    );
    const [machine_shop] = await trx.query(
        `SELECT * FROM machine_shop WHERE trial_id = @trial_id`, { trial_id }
    );
    const [material_correction] = await trx.query(
        `SELECT * FROM material_correction WHERE trial_id = @trial_id`, { trial_id }
    );

    return {
        trial_cards,
        pouring_details,
        sand_properties,
        mould_correction,
        metallurgical_inspection,
        visual_inspection,
        dimensional_inspection,
        machine_shop,
        material_correction
    };
};

export const getAllData = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    try {
        const data = await fetchTrialData(trial_id, trx);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Error fetching trial data:", error);
        res.status(500).json({ success: false, message: "Error fetching data" });
    }
};

const safeParse = (data, fallback = []) => {
    if (!data) return fallback;
    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
        return parsed || fallback;
    } catch (e) {
        return fallback;
    }
};

// Helper to draw a table - HIGHLY OPTIMIZED
const drawTable = (doc, tableData, startX, startY, colWidths = []) => {
    let currentY = startY;
    const padding = 3;
    const rowHeight = 16;
    const fontSize = 7;
    const headerColor = '#f5f5f5';

    // Headers
    doc.font('Helvetica-Bold').fontSize(fontSize);
    let currentX = startX;

    // Draw Header Background
    doc.save();
    doc.fillColor(headerColor)
        .rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
        .fill();
    doc.restore();

    // Draw Header Text and Borders
    tableData.headers.forEach((header, i) => {
        doc.fillColor('black')
            .text(header, currentX + padding, currentY + padding + 1, { width: colWidths[i] - 2 * padding, align: 'left' });
        doc.rect(currentX, currentY, colWidths[i], rowHeight).strokeColor('#ddd').stroke();
        currentX += colWidths[i];
    });

    currentY += rowHeight;

    // Rows
    doc.font('Helvetica').fontSize(fontSize);
    tableData.rows.forEach(row => {
        currentX = startX;

        row.forEach((cell, i) => {
            const text = cell !== null && cell !== undefined ? String(cell) : '-';
            doc.text(text, currentX + padding, currentY + padding + 1, { width: colWidths[i] - 2 * padding, align: 'left' });
            doc.rect(currentX, currentY, colWidths[i], rowHeight).strokeColor('#ddd').stroke();
            currentX += colWidths[i];
        });
        currentY += rowHeight;
    });

    return currentY;
};

// Draw a Vertical key-value table - HIGHLY OPTIMIZED
const drawVerticalTable = (doc, data, startX, startY, width) => {
    let currentY = startY;
    const rowHeight = 14;
    const fontSize = 7;
    const labelWidth = width * 0.45;
    const valueWidth = width * 0.55;
    const padding = 3;

    doc.fontSize(fontSize);

    data.forEach(item => {
        // Label Bg
        doc.save();
        doc.fillColor('#fafafa').rect(startX, currentY, labelWidth, rowHeight).fill();
        doc.restore();

        // Borders
        doc.rect(startX, currentY, labelWidth, rowHeight).strokeColor('#e0e0e0').stroke();
        doc.rect(startX + labelWidth, currentY, valueWidth, rowHeight).strokeColor('#e0e0e0').stroke();

        // Text
        doc.font('Helvetica-Bold').text(item.label, startX + padding, currentY + padding + 1, { width: labelWidth - 2 * padding });
        doc.font('Helvetica').text(item.value !== null && item.value !== undefined ? String(item.value) : '-', startX + labelWidth + padding, currentY + padding + 1, { width: valueWidth - 2 * padding });

        currentY += rowHeight;
    });

    return currentY;
};

const drawSectionTitle = (doc, title, x, y) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#2c3e50').text(title, x, y);
    const width = doc.widthOfString(title);
    doc.moveTo(x, y + 11).lineTo(x + width, y + 11).strokeColor('#2c3e50').stroke(); // Underline
    return y + 18;
};

// Helper to fetch all trials for a part name
export const fetchAllTrialsDataForPatternCode = async (pattern_code, trx) => {
    if (!pattern_code) return [];

    const [trials] = await trx.query(
        `SELECT trial_id FROM trial_cards WHERE pattern_code = @pattern_code AND status = 'CLOSED' ORDER BY date_of_sampling ASC`,
        { pattern_code }
    );

    if (!trials || trials.length === 0) return [];

    const allTrialsData = [];
    for (const trial of trials) {
        const data = await fetchTrialData(trial.trial_id, trx);
        allTrialsData.push(data);
    }

    return allTrialsData;
};

export const generateAndStoreConsolidatedReport = async (trial_id, trx) => {
    const [pattern_code_result] = await trx.query(
        `SELECT pattern_code FROM trial_cards WHERE trial_id = @trial_id`,
        { trial_id }
    );
    if (!pattern_code_result || pattern_code_result.length === 0) return;
    const pattern_code = pattern_code_result[0].pattern_code;
    const allTrialsData = await fetchAllTrialsDataForPatternCode(pattern_code, trx);
    if (allTrialsData.length === 0) return;

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    for (let i = 0; i < allTrialsData.length; i++) {
        const data = allTrialsData[i];
        const trialCard = data.trial_cards?.[0] || {};
        const pouring = data.pouring_details?.[0] || {};
        const sand = data.sand_properties?.[0] || {};
        const moulding = data.mould_correction?.[0] || {};
        const meta = data.metallurgical_inspection?.[0] || {};
        const visual = data.visual_inspection?.[0] || {};
        const dimensional = data.dimensional_inspection?.[0] || {};
        const mcShop = data.machine_shop?.[0] || {};
        const matCorr = data.material_correction?.[0] || {};

        if (i > 0) doc.addPage();

        // --- PAGE 1: PROCESS DATA ---

        // Header
        doc.rect(0, 0, 595, 60).fillColor('#2c3e50').fill();
        doc.font('Helvetica-Bold').fontSize(16).fillColor('white')
            .text('CONSOLIDATED INSPECTION REPORT', 30, 20, { align: 'left' });
        doc.fontSize(10)
            .text(`Pattern: ${pattern_code}   |   Page: ${i * 2 + 1}`, 30, 42, { align: 'left' });
        doc.fillColor('black');

        let y = 80;
        const col1X = 30;
        const col2X = 305;
        const colWidth = 260;

        // 1. Trial Card Details (Top Left)
        let yLeft = drawSectionTitle(doc, "1. TRIAL CARD DETAILS", col1X, y);
        const trialRows = [
            { label: "Part Name", value: trialCard.part_name },
            { label: "Date of Sampling", value: trialCard.date_of_sampling ? new Date(trialCard.date_of_sampling).toISOString().slice(0, 10) : '-' },
            { label: "Mould Count (P/A)", value: `${trialCard.plan_moulds || trialCard.no_of_moulds || '-'} / ${trialCard.actual_moulds || '-'}` },
            { label: "Machine", value: trialCard.disa },
            { label: "Reason", value: trialCard.reason_for_sampling },
        ];
        yLeft = drawVerticalTable(doc, trialRows, col1X, yLeft, colWidth) + 12;

        // 1.1 Met Spec
        let yMetSpec = drawSectionTitle(doc, "1.1 METALLURGICAL SPECIFICATION", col1X, yLeft);
        const specChem = safeParse(trialCard.spec_chem, {});
        const specMicro = safeParse(trialCard.spec_micro, {});

        const chemRows = [["C", specChem.c], ["Si", specChem.si], ["Mn", specChem.mn], ["P", specChem.p], ["S", specChem.s], ["Mg", specChem.mg]];
        doc.font('Helvetica-Bold').fontSize(7).text("Chemical Elements (%)", col1X, yMetSpec);
        yMetSpec += 10;
        yMetSpec = drawTable(doc, { headers: ["Ele", "Spec"], rows: chemRows }, col1X, yMetSpec, [130, 130]) + 8;

        const microSpecRows = [
            { label: "Nodularity", value: specMicro.nodularity },
            { label: "Pearlite", value: specMicro.pearlite },
            { label: "Carbide", value: specMicro.carbide }
        ];
        yMetSpec = drawVerticalTable(doc, microSpecRows, col1X, yMetSpec, colWidth) + 12;
        yLeft = yMetSpec;

        // 2. Material Correction (Top Right)
        let yRight = drawSectionTitle(doc, "1.2 MATERIAL CORRECTION", col2X, y);
        const corrChem = safeParse(matCorr.chemical_composition, {});
        const corrProc = safeParse(matCorr.process_parameters, {});

        const matChemData = [[corrChem.c, corrChem.si, corrChem.mn, corrChem.p, corrChem.s, corrChem.mg, corrChem.cu, corrChem.cr]];
        doc.font('Helvetica-Bold').fontSize(7).text("Actual Composition", col2X, yRight);
        yRight += 10;
        yRight = drawTable(doc, { headers: ["C", "Si", "Mn", "P", "S", "Mg", "Cu", "Cr"], rows: matChemData }, col2X, yRight, [32, 32, 32, 32, 32, 32, 32, 36]) + 8;

        const procRows = [
            { label: "Pouring Temp °C", value: corrProc.pouringTemp },
            { label: "Inoculant / Sec", value: corrProc.inoculantPerSec },
            { label: "Inoculant Type", value: corrProc.inoculantType },
            { label: "Remarks", value: matCorr.remarks }
        ];
        yRight = drawVerticalTable(doc, procRows, col2X, yRight, colWidth) + 12;

        // 3. Pouring Details
        yRight = drawSectionTitle(doc, "2. POURING DETAILS", col2X, yRight);
        const pInoc = safeParse(pouring.inoculation, {});
        const pouringRows = [
            { label: "Pour Date", value: pouring.pour_date ? new Date(pouring.pour_date).toISOString().slice(0, 10) : '-' },
            { label: "Heat Code", value: pouring.heat_code },
            { label: "Pouring Temp (°C)", value: pouring.pouring_temp_c },
            { label: "Pouring Time (sec)", value: pouring.pouring_time_sec },
            { label: "No. Mould Poured", value: pouring.no_of_mould_poured },
            { label: "Inoculation Type", value: pInoc.text },
            { label: "Stream/Inmould", value: `${pInoc.stream || '-'} / ${pInoc.inmould || '-'}` },
        ];
        yRight = drawVerticalTable(doc, pouringRows, col2X, yRight, colWidth) + 12;

        let yNext = Math.max(yLeft, yRight);

        // 4. Sand Properties
        yLeft = drawSectionTitle(doc, "3. SAND PROPERTIES", col1X, yNext);
        const sandRows = [
            { label: "Date", value: sand.date ? new Date(sand.date).toISOString().slice(0, 10) : '-' },
            { label: "T. Clay / A. Clay %", value: `${sand.t_clay || '-'} / ${sand.a_clay || '-'}` },
            { label: "V.C.M. / L.O.I. %", value: `${sand.vcm || '-'} / ${sand.loi || '-'}` },
            { label: "A.F.S. / G.C.S.", value: `${sand.afs || '-'} / ${sand.gcs || '-'}` },
            { label: "M.O.I. / Comp.", value: `${sand.moi || '-'} / ${sand.compactability || '-'}` },
            { label: "Permeability", value: sand.permeability },
        ];
        yLeft = drawVerticalTable(doc, sandRows, col1X, yLeft, colWidth);

        // 5. Mould Correction
        yRight = drawSectionTitle(doc, "4. MOULD CORRECTION", col2X, yNext);
        const mouldRows = [
            { label: "Date", value: moulding.date ? new Date(moulding.date).toISOString().slice(0, 10) : '-' },
            { label: "Thickness", value: moulding.mould_thickness },
            { label: "Compressibility", value: moulding.compressability },
            { label: "Squeeze Pressure", value: moulding.squeeze_pressure },
            { label: "Mould Hardness", value: moulding.mould_hardness },
        ];
        yRight = drawVerticalTable(doc, mouldRows, col2X, yRight, colWidth);

        // --- PAGE 2: INSPECTION DATA ---
        doc.addPage();
        let p2y = 40;

        // Header P2
        doc.font('Helvetica-Bold').fontSize(12).text(`Trial: ${currentTrialId} - Inspection Results   |   Page: ${i * 2 + 2}`, 30, 20);
        doc.moveTo(30, 35).lineTo(565, 35).stroke();

        // 5. Metallurgical Inspection
        p2y = drawSectionTitle(doc, "5. METALLURGICAL INSPECTION", col1X, p2y);
        const mechRows = safeParse(meta.mech_properties, []);
        const impactRows = safeParse(meta.impact_strength, []);
        const microRows = safeParse(meta.micro_structure, []);

        let metLeftY = p2y;
        let metRightY = p2y;

        if (mechRows.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7).text("Mechanical Properties", col1X, metLeftY);
            metLeftY += 10;
            metLeftY = drawTable(doc, { headers: ["Param", "Value", "Res", "Rem"], rows: Array.isArray(mechRows) ? mechRows.map(r => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks]) : [] }, col1X, metLeftY, [80, 50, 30, 90]) + 10;
        }

        p2y = metLeftY;

        if (impactRows.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7).text("Impact Strength", col1X, p2y);
            p2y += 10;
            p2y = drawTable(doc, { headers: ["Param", "Value", "Res", "Rem"], rows: Array.isArray(impactRows) ? impactRows.map(r => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks]) : [] }, col1X, p2y, [80, 50, 30, 90]) + 10;
        }

        if (microRows.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7).text("Microstructure", col1X, p2y);
            p2y += 10;
            p2y = drawTable(doc, { headers: ["Parameter", "Values", "Result", "Remarks"], rows: Array.isArray(microRows) ? microRows.map(r => [r.label, r.values?.join(", "), r.ok ? "OK" : "NOT OK", r.remarks]) : [] }, col1X, p2y, [140, 180, 40, 175]) + 10;
        }

        p2y += 5;

        // 6. Visual & 7. Dimensional
        let visitY = p2y;
        let dimY = p2y;

        // Visual (Left)
        visitY = drawSectionTitle(doc, "6. VISUAL INSPECTION", col1X, visitY);
        visitY = drawVerticalTable(doc, [{ label: "Inspection Result", value: visual.visual_ok ? "OK" : "NOT OK" }, { label: "Remarks", value: visual.remarks }], col1X, visitY, colWidth) + 8;

        const visInspections = safeParse(visual.inspections, []);
        if (visInspections.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7).text("General Inspection", col1X, visitY);
            visitY += 10;
            visitY = drawTable(doc, { headers: ['Cav', 'Insp', 'Rej', 'Reason'], rows: visInspections.map(r => [r['Cavity Number'], r['Inspected Quantity'], r['Rejected Quantity'], r['Reason for rejection']]) }, col1X, visitY, [30, 30, 30, 170]) + 8;
        }

        // NDT
        const ndtRows = safeParse(visual.ndt_inspection, []);
        if (ndtRows.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7).text(`NDT Inspection (Result: ${visual.ndt_inspection_ok ? 'OK' : 'NOT OK'})`, col1X, visitY);
            visitY += 10;
            if (visual.ndt_inspection_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual.ndt_inspection_remarks}`, col1X, visitY);
                visitY += 10;
            }
            visitY = drawTable(doc, {
                headers: ["Parameter", "Value", "Res", "Rem"],
                rows: ndtRows.map(r => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])
            }, col1X, visitY, [80, 50, 30, 90]) + 10;
        }

        // Hardness
        const hardRows = safeParse(visual.hardness, []);
        if (hardRows.length > 0) {
            doc.font('Helvetica-Bold').fontSize(7).text(`Hardness (Result: ${visual.hardness_ok ? 'OK' : 'NOT OK'})`, col1X, visitY);
            visitY += 10;
            if (visual.hardness_remarks) {
                doc.font('Helvetica-Oblique').fontSize(7).text(`Remarks: ${visual.hardness_remarks}`, col1X, visitY);
                visitY += 10;
            }
            visitY = drawTable(doc, {
                headers: ["Param", "Value", "Res", "Rem"],
                rows: hardRows.map(r => [r.label, r.value, r.ok ? "OK" : "NOT OK", r.remarks])
            }, col1X, visitY, [80, 50, 30, 90]) + 10;
        }

        // Dimensional (Right)
        dimY = drawSectionTitle(doc, "7. DIMENSIONAL INSPECTION", col2X, dimY);
        const dimRows = [
            { label: "Date", value: dimensional.inspection_date ? new Date(dimensional.inspection_date).toISOString().slice(0, 10) : '-' },
            { label: "Weight", value: `${dimensional.casting_weight || '-'} kg` },
            { label: "Yield", value: `${dimensional.yields || '-'} %` }
        ];
        dimY = drawVerticalTable(doc, dimRows, col2X, dimY, colWidth) + 8;
        const dimInspections = safeParse(dimensional.inspections, []);
        if (dimInspections.length > 0) {
            dimY = drawTable(doc, { headers: ['Cavity', 'Weight (kg)'], rows: Array.isArray(dimInspections) ? dimInspections.map(r => [r['Cavity Number'], r['Casting Weight']]) : [] }, col2X, dimY + 20, [130, 130]) + 8;
        }

        p2y = Math.max(visitY, dimY) + 10;

        // 8. Machine Shop
        if (Object.keys(mcShop).length > 0) {
            p2y = drawSectionTitle(doc, "8. MACHINE SHOP INSPECTION", col1X, p2y);
            p2y = drawVerticalTable(doc, [
                { label: "Date", value: mcShop.inspection_date ? new Date(mcShop.inspection_date).toISOString().slice(0, 10) : '-' },
                { label: "Remarks", value: mcShop.remarks }
            ], col1X, p2y, colWidth * 2 + 15) + 8;

            const mcInspections = safeParse(mcShop.inspections, []);
            if (mcInspections.length > 0) {
                const headers = Object.keys(mcInspections[0]);
                const rows = mcInspections.map(r => Object.values(r));
                const colW = 535 / headers.length;
                p2y = drawTable(doc, { headers, rows }, col1X, p2y, headers.map(() => colW));
            }
        }
    }

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);
            const base64PDF = pdfBuffer.toString('base64');
            const fileName = `Consolidated_Trial_Report_${pattern_code.replace(/\s+/g, '_')}.pdf`;

            try {
                const [existing] = await trx.query(
                    `SELECT document_id FROM consolidated_reports WHERE pattern_code = @pattern_code`,
                    { pattern_code }
                );

                if (existing && existing.length > 0) {
                    await trx.query(
                        `UPDATE consolidated_reports SET file_base64 = @file_base64, file_name = @file_name, uploaded_at = GETDATE() 
                         WHERE pattern_code = @pattern_code`,
                        { pattern_code, file_base64: base64PDF, file_name: fileName }
                    );
                } else {
                    await trx.query(
                        `INSERT INTO consolidated_reports (pattern_code, document_type, file_name, file_base64) 
                         VALUES (@pattern_code, 'CONSOLIDATED_REPORT', @file_name, @file_base64)`,
                        { pattern_code, file_name: fileName, file_base64: base64PDF }
                    );
                }
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
        doc.on('error', reject);
    });
};

