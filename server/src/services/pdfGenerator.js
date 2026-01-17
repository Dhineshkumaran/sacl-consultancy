import PDFDocument from 'pdfkit';

// Helper to fetch data (extracted from the controller logic)
export const fetchTrialData = async (trial_id, trx) => {
    if (!trial_id) return null;
    trial_id = trial_id.replace(/['"]+/g, '');

    const [trial_cards] = await trx.query(
        `SELECT * FROM trial_cards WHERE trial_id = @trial_id`, { trial_id }
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

    return {
        trial_cards,
        pouring_details,
        sand_properties,
        mould_correction,
        metallurgical_inspection,
        visual_inspection,
        dimensional_inspection,
        machine_shop
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

const safeParse = (data, fallback = {}) => {
    if (!data) return fallback;
    if (typeof data === 'object') return data;
    try {
        return JSON.parse(data);
    } catch (e) {
        return fallback;
    }
};

// Helper to draw a table
// options: { x, y, width, columns: [{ header, width, key (or access fn) }] }
const drawTable = (doc, tableData, startX, startY, colWidths = []) => {
    let currentY = startY;
    const padding = 5;
    const rowHeight = 20;
    const fontSize = 8;
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
            .text(header, currentX + padding, currentY + padding, { width: colWidths[i] - 2 * padding, align: 'left' });
        doc.rect(currentX, currentY, colWidths[i], rowHeight).strokeColor('#ddd').stroke();
        currentX += colWidths[i];
    });

    currentY += rowHeight;

    // Rows
    doc.font('Helvetica').fontSize(fontSize);
    tableData.rows.forEach(row => {
        currentX = startX;
        // Calculate max height for row (simple version: fixed height)
        // Ideally we check text wrapping, but for now fixed height 

        row.forEach((cell, i) => {
            const text = cell !== null && cell !== undefined ? String(cell) : '-';
            doc.text(text, currentX + padding, currentY + padding, { width: colWidths[i] - 2 * padding, align: 'left' });
            doc.rect(currentX, currentY, colWidths[i], rowHeight).strokeColor('#ddd').stroke();
            currentX += colWidths[i];
        });
        currentY += rowHeight;
    });

    return currentY;
};

// Draw a Vertical key-value table
const drawVerticalTable = (doc, data, startX, startY, width) => {
    let currentY = startY;
    const rowHeight = 15;
    const fontSize = 8;
    const labelWidth = width * 0.4;
    const valueWidth = width * 0.6;
    const padding = 3;

    doc.fontSize(fontSize);

    data.forEach(item => {
        // Label Bg
        doc.save();
        doc.fillColor('#f5f5f5').rect(startX, currentY, labelWidth, rowHeight).fill();
        doc.restore();

        // Borders
        doc.rect(startX, currentY, labelWidth, rowHeight).strokeColor('#ddd').stroke();
        doc.rect(startX + labelWidth, currentY, valueWidth, rowHeight).strokeColor('#ddd').stroke();

        // Text
        doc.font('Helvetica-Bold').text(item.label, startX + padding, currentY + padding, { width: labelWidth - 2 * padding });
        doc.font('Helvetica').text(item.value !== null && item.value !== undefined ? String(item.value) : '-', startX + labelWidth + padding, currentY + padding, { width: valueWidth - 2 * padding });

        currentY += rowHeight;
    });

    return currentY;
};

const drawSectionTitle = (doc, title, x, y) => {
    doc.font('Helvetica-Bold').fontSize(10).text(title, x, y);
    const width = doc.widthOfString(title);
    doc.moveTo(x, y + 12).lineTo(x + width, y + 12).strokeColor('black').stroke(); // Underline
    return y + 20;
};

export const generateAndStoreReport = async (trial_id, trx) => {
    const data = await fetchTrialData(trial_id, trx);
    if (!data) throw new Error("No data found for trial id " + trial_id);

    const trialCard = data.trial_cards?.[0] || {};
    const pouring = data.pouring_details?.[0] || {};
    const sand = data.sand_properties?.[0] || {};
    const moulding = data.mould_correction?.[0] || {};
    const meta = data.metallurgical_inspection?.[0] || {};
    const visual = data.visual_inspection?.[0] || {};
    const dimensional = data.dimensional_inspection?.[0] || {};
    const mcShop = data.machine_shop?.[0] || {};

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.font('Helvetica-Bold').fontSize(16).text('FULL INSPECTION REPORT', { align: 'center' });
    doc.fontSize(10).text(`Trial ID: ${trial_id}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(30, doc.y).lineTo(565, doc.y).stroke();
    doc.moveDown();

    let y = doc.y;
    const col1X = 30;
    const col2X = 300;
    const colWidth = 250;

    // --- ROW 1 ---
    let yRow1Start = y;

    // 1. Trial Card
    let y1 = drawSectionTitle(doc, "1. TRIAL CARD DETAILS", col1X, yRow1Start);
    if (Object.keys(trialCard).length > 0) {
        y1 = drawVerticalTable(doc, [
            { label: "Part Name", value: trialCard.part_name },
            { label: "Pattern Code", value: trialCard.pattern_code },
            { label: "Trial No", value: trialCard.trial_id },
            { label: "Date of Sampling", value: trialCard.date_of_sampling ? new Date(trialCard.date_of_sampling).toISOString().slice(0, 10) : '-' },
            { label: "Mould Count (Plan)", value: trialCard.plan_moulds || trialCard.no_of_moulds },
            { label: "Mould Count (Actual)", value: trialCard.actual_moulds },
            { label: "Machine", value: trialCard.disa },
            { label: "Reason", value: trialCard.reason_for_sampling },
        ], col1X, y1, colWidth) + 10;
    }

    // 2. Pouring Details
    let y2 = drawSectionTitle(doc, "2. POURING DETAILS", col2X, yRow1Start);
    if (Object.keys(pouring).length > 0) {
        const pInoc = safeParse(pouring.inoculation);
        const pRem = safeParse(pouring.other_remarks);
        const pComp = safeParse(pouring.composition);

        y2 = drawVerticalTable(doc, [
            { label: "Pour Date", value: pouring.pour_date ? new Date(pouring.pour_date).toISOString().slice(0, 10) : '-' },
            { label: "Heat Code", value: pouring.heat_code },
            { label: "Pouring Temp (°C)", value: pouring.pouring_temp_c },
            { label: "Pouring Time (sec)", value: pouring.pouring_time_sec },
            { label: "F/C Heat No.", value: pRem["F/C & Heat No."] },
            { label: "No. of Mould Poured", value: pouring.no_of_mould_poured },
            { label: "Inoculation Type", value: pInoc.Text },
            { label: "Stream Inoc.", value: pInoc.Stream },
            { label: "Inmould Inoc.", value: pInoc.Inmould }
        ], col2X, y2, colWidth) + 5;

        // Chemical Comp
        doc.font('Helvetica-Bold').fontSize(8).text("Chemical Composition", col2X, y2);
        y2 += 12;
        const compKeys = Object.keys(pComp);
        if (compKeys.length > 0) {
            y2 = drawTable(doc, { headers: compKeys, rows: [Object.values(pComp)] }, col2X, y2, compKeys.map(() => colWidth / compKeys.length)) + 10;
        }
    }

    let nextY = Math.max(y1, y2) + 10;

    // --- ROW 2 ---
    const yRow2Start = nextY;

    // 3. Sand Properties
    y1 = drawSectionTitle(doc, "3. SAND PROPERTIES", col1X, yRow2Start);
    if (Object.keys(sand).length > 0) {
        y1 = drawVerticalTable(doc, [
            { label: "Date", value: sand.date ? new Date(sand.date).toISOString().slice(0, 10) : '-' },
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
        ], col1X, y1, colWidth) + 10;
    }

    // 4. Mould Correction
    y2 = drawSectionTitle(doc, "4. MOULD CORRECTION", col2X, yRow2Start);
    if (Object.keys(moulding).length > 0) {
        y2 = drawVerticalTable(doc, [
            { label: "Date", value: moulding.date ? new Date(moulding.date).toISOString().slice(0, 10) : '-' },
            { label: "Mould Thickness", value: moulding.mould_thickness },
            { label: "Compressibility", value: moulding.compressability },
            { label: "Squeeze Pressure", value: moulding.squeeze_pressure },
            { label: "Mould Hardness", value: moulding.mould_hardness },
            { label: "Remarks", value: moulding.remarks }
        ], col2X, y2, colWidth) + 10;
    }

    nextY = Math.max(y1, y2) + 10;

    // --- 5. Metallurgical ---
    if (meta && Object.keys(meta).length > 0) {
        const mechRows = safeParse(meta.mech_properties, []);
        const impactRows = safeParse(meta.impact_strength, []);
        const hardRows = safeParse(meta.hardness, []);
        const ndtRows = safeParse(meta.ndt_inspection, []);
        const microRows = safeParse(meta.micro_structure, []);

        const hasMetaData = mechRows.length > 0 || impactRows.length > 0 || hardRows.length > 0 || ndtRows.length > 0 || microRows.length > 0;

        if (hasMetaData) {
            // Check space
            if (doc.page.height - nextY < 100) { doc.addPage(); nextY = 30; }

            nextY = drawSectionTitle(doc, "5. METALLURGICAL INSPECTION", col1X, nextY);

            const subTableWidth = 250;
            let metaY1 = nextY;
            let metaY2 = nextY;

            // Mechanical
            if (mechRows.length > 0) {
                doc.font('Helvetica-Bold').fontSize(8).text("Mechanical Properties", col1X, metaY1);
                metaY1 += 12;
                metaY1 = drawTable(doc, { headers: ["Parameter", "Value", "Status", "Remarks"], rows: mechRows.map(r => [r.label, r.value, r.ok ? "OK" : "NOK", r.remarks]) }, col1X, metaY1, [80, 50, 40, 80]) + 10;
            }

            // Hardness
            if (hardRows.length > 0) {
                doc.font('Helvetica-Bold').fontSize(8).text("Hardness", col2X, metaY2);
                metaY2 += 12;
                metaY2 = drawTable(doc, { headers: ["Parameter", "Value", "Status", "Remarks"], rows: hardRows.map(r => [r.label, r.value, r.ok ? "OK" : "NOK", r.remarks]) }, col2X, metaY2, [80, 50, 40, 80]) + 10;
            }

            // Next sub-row
            let nextSubY = Math.max(metaY1, metaY2);
            metaY1 = nextSubY;
            metaY2 = nextSubY;

            // Impact
            if (impactRows.length > 0) {
                doc.font('Helvetica-Bold').fontSize(8).text("Impact Strength", col1X, metaY1);
                metaY1 += 12;
                metaY1 = drawTable(doc, { headers: ["Parameter", "Value", "Status", "Remarks"], rows: impactRows.map(r => [r.label, r.value, r.ok ? "OK" : "NOK", r.remarks]) }, col1X, metaY1, [80, 50, 40, 80]) + 10;
            }

            // NDT
            if (ndtRows.length > 0) {
                doc.font('Helvetica-Bold').fontSize(8).text("NDT Inspection", col2X, metaY2);
                metaY2 += 12;
                metaY2 = drawTable(doc, { headers: ["Parameter", "Value", "Status", "Remarks"], rows: ndtRows.map(r => [r.label, r.value, r.ok ? "OK" : "NOK", r.remarks]) }, col2X, metaY2, [80, 50, 40, 80]) + 10;
            }

            nextY = Math.max(metaY1, metaY2);

            // Microstructure (Full width)
            if (microRows.length > 0) {
                if (doc.page.height - nextY < 80) { doc.addPage(); nextY = 30; }
                doc.font('Helvetica-Bold').fontSize(8).text("Microstructure Examination", col1X, nextY);
                nextY += 12;
                nextY = drawTable(doc, { headers: ["Parameter", "Values", "Status", "Remarks"], rows: microRows.map(r => [r.label, r.values?.join(", "), r.ok ? "OK" : "NOK", r.remarks]) }, col1X, nextY, [150, 150, 50, 180]) + 10;
            }
        }
    }

    if (doc.page.height - nextY < 80) { doc.addPage(); nextY = 30; }

    // --- ROW 3 ---
    yRow1Start = nextY;

    // 6. Visual
    y1 = drawSectionTitle(doc, "6. VISUAL INSPECTION", col1X, yRow1Start);
    if (Object.keys(visual).length > 0) {
        y1 = drawVerticalTable(doc, [{ label: "Result", value: visual.visual_ok ? "OK" : "NOT OK" }], col1X, y1, colWidth) + 5;
        doc.font('Helvetica-Bold').text("Remarks:", col1X, y1);
        doc.font('Helvetica').text(visual.remarks || '-', col1X, y1 + 12, { width: colWidth });
        y1 += 30;

        const visInspections = safeParse(visual.inspections, []);
        if (Array.isArray(visInspections) && visInspections.length > 0) {
            const rows = visInspections.map(r => [r['Cavity Number'], r['Inspected Quantity'], r['Rejected Quantity'], r['Reason for rejection']]);
            y1 = drawTable(doc, { headers: ['Cav No', 'Insp Qty', 'Rej Qty', 'Reason'], rows }, col1X, y1, [50, 50, 50, 100]) + 10;
        }
    }

    // 7. Dimensional
    y2 = drawSectionTitle(doc, "7. DIMENSIONAL INSPECTION", col2X, yRow1Start);
    if (Object.keys(dimensional).length > 0) {
        y2 = drawVerticalTable(doc, [
            { label: "Inspection Date", value: dimensional.inspection_date ? new Date(dimensional.inspection_date).toISOString().slice(0, 10) : '-' },
            { label: "Casting Weight (kg)", value: dimensional.casting_weight },
            { label: "Bunch Weight (kg)", value: dimensional.bunch_weight },
            { label: "No. of Cavities", value: dimensional.no_of_cavities },
            { label: "Yields (%)", value: dimensional.yields },
        ], col2X, y2, colWidth) + 5;

        const dimInspections = safeParse(dimensional.inspections, []);
        if (Array.isArray(dimInspections) && dimInspections.length > 0) {
            const rows = dimInspections.map(r => [r['Cavity Number'], r['Casting Weight']]);
            y2 = drawTable(doc, { headers: ['Cavity Number', 'Casting Weight'], rows }, col2X, y2 + 20, [120, 120]) + 10;
        }
    }

    nextY = Math.max(y1, y2) + 20;
    if (doc.page.height - nextY < 80) { doc.addPage(); nextY = 30; }

    // 8. Machine Shop
    if (Object.keys(mcShop).length > 0) {
        nextY = drawSectionTitle(doc, "8. MACHINE SHOP INSPECTION", col1X, nextY);
        nextY = drawVerticalTable(doc, [
            { label: "Inspection Date", value: mcShop.inspection_date ? new Date(mcShop.inspection_date).toISOString().slice(0, 10) : '-' },
            { label: "Remarks", value: mcShop.remarks }
        ], col1X, nextY, colWidth) + 10;

        const mcInspections = safeParse(mcShop.inspections, []);
        if (mcInspections.length > 0) {
            const headers = Object.keys(mcInspections[0]);
            const rows = mcInspections.map(r => Object.values(r));
            const colW = 500 / headers.length;
            nextY = drawTable(doc, { headers, rows }, col1X, nextY, headers.map(() => colW));
        }
    }

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);
            const base64PDF = pdfBuffer.toString('base64');
            const fileName = `Trial_Report_${trial_id}.pdf`;

            try {
                await trx.query(
                    `INSERT INTO trial_reports (trial_id, document_type, file_name, file_base64) 
                     VALUES (@trial_id, 'FULL_REPORT', @file_name, @file_base64)`,
                    { trial_id, file_name: fileName, file_base64: base64PDF }
                );
                resolve(true);
            } catch (err) {
                reject(err);
            }
        });
        doc.on('error', reject);
    });
};
