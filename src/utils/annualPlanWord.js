import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    HeadingLevel,
    PageOrientation,
    AlignmentType,
    VerticalAlign,
    TextRun,
    Header,
    PageBorderDisplay,
    PageBorderZOrder,
    PageBorderOffsetFrom
} from "docx";
import { saveAs } from "file-saver";

// --- HELPER FUNCTIONS ---

const createTextParagraph = (text, options = {}) => {
    return new Paragraph({
        children: text.split('\n').map((line, index, array) => {
            const textRun = new TextRun({
                text: line,
                size: options.size || 22, // 11pt = 22 half-points
                font: "Calibri",
                bold: options.bold || false,
                color: options.color || "000000",
                ...options.textOptions
            });
            // Add break unless it's the last line
            if (index < array.length - 1) {
                return [textRun, new TextRun({ break: 1 })];
            }
            return textRun;
        }).flat(),
        alignment: options.alignment || AlignmentType.LEFT,
        spacing: options.spacing || { after: 0 }, // Tight spacing by default
        ...options.paragraphOptions
    });
};

// Standard Green Color from Screenshot
const HEADER_APP_COLOR = "E2EFDA"; // Light Green similar to screenshot
const GREEN_BORDER_COLOR = "548235"; // Darker Green for borders based on screenshot style
const BLACK_BORDER_COLOR = "000000";

// Helper for Metadata Cells (Green Dotted Borders)
const createMetadataCell = (content, widthPercent = null, isHeader = false) => {
    const width = widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined;
    const children = typeof content === 'string'
        ? [createTextParagraph(content, { size: 20, bold: isHeader || false, textStyle: { bold: isHeader } })]
        : Array.isArray(content) ? content : [content]; // Ensure content is always an array of Paragraphs/TextRuns

    return new TableCell({
        children: children,
        width: width,
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: HEADER_APP_COLOR }, // All cells in metadata table have green background in screenshot
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        borders: {
            top: { style: BorderStyle.DASHED, size: 4, color: GREEN_BORDER_COLOR },
            bottom: { style: BorderStyle.DASHED, size: 4, color: GREEN_BORDER_COLOR },
            left: { style: BorderStyle.DASHED, size: 4, color: GREEN_BORDER_COLOR },
            right: { style: BorderStyle.DASHED, size: 4, color: GREEN_BORDER_COLOR },
        }
    });
};

// Helper for Standard Table Cells (Black Solid Borders)
const createStandardCell = (content, widthPercent = null, options = {}) => {
    const width = widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined;

    // If content is a string, wrap it in a paragraph. If it's already a Paragraph or Table, use it directly.
    const children = typeof content === 'string'
        ? [createTextParagraph(content, { size: 20, ...options.textStyle })]
        : Array.isArray(content) ? content : [content];

    return new TableCell({
        children: children,
        width: width,
        verticalAlign: VerticalAlign.CENTER,
        shading: options.shading,
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: BLACK_BORDER_COLOR },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: BLACK_BORDER_COLOR },
            left: { style: BorderStyle.SINGLE, size: 1, color: BLACK_BORDER_COLOR },
            right: { style: BorderStyle.SINGLE, size: 1, color: BLACK_BORDER_COLOR },
        },
        ...options.cellOptions
    });
};

const createStandardHeaderCell = (text, widthPercent = null) => {
    return createStandardCell(text, widthPercent, {
        textStyle: { bold: true, size: 22 },
        shading: { fill: HEADER_APP_COLOR },
        textOptions: { alignment: AlignmentType.LEFT } // Left aligned based on screenshot
    });
};

const createBulletedList = (items) => {
    if (!items || items.length === 0) return [createTextParagraph("No registrado", { size: 20 })];

    return items.map(item => new Paragraph({
        children: [new TextRun({ text: item, size: 20, font: "Calibri" })],
        bullet: { level: 0 },
        spacing: { after: 50 },
    }));
};

// --- MAIN GENERATOR ---

export const generateAnnualPlanWord = async (courseName, subjectName, teacherName = '', year, units) => {

    // 1. PAGE HEADER (School Info)
    const pageHeader = new Header({
        children: [
            new Paragraph({
                children: [
                    new TextRun({ text: "Escuela Roberto Ojeda Torres", size: 20, color: "666666", font: "Calibri" }),
                    new TextRun({ break: 1 }),
                    new TextRun({ text: "Unidad Técnico Pedagógica", size: 18, color: "666666", font: "Calibri" })
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 }
            })
        ]
    });

    // 2. DOCUMENT TITLE (Calibri 13pt Bold -> 26 half-points)
    const title = new Paragraph({
        children: [new TextRun({ text: "PLANIFICACIÓN ANUAL", bold: true, size: 26, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
    });

    // 3. METADATA TABLE (Green Dashed Borders + Full Green Background based on screenshot)
    const metadataTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    createMetadataCell("Asignatura", 15, true),
                    createMetadataCell(subjectName, 35),
                    createMetadataCell("Docente", 15, true),
                    createMetadataCell(teacherName, 35),
                ]
            }),
            new TableRow({
                children: [
                    createMetadataCell("Curso", 15, true),
                    createMetadataCell(courseName, 35),
                    createMetadataCell("Año", 15, true),
                    createMetadataCell(year.toString(), 35),
                ]
            })
        ]
    });

    // 4. UNITS PROCESSING
    const sortedUnits = [...units].sort((a, b) => (a.numero || 999) - (b.numero || 999));
    const unitSections = [];

    sortedUnits.forEach((unit) => {
        // --- Unit Duration Calculation ---
        let durationText = 'Fechas no definidas';
        if (unit.fechaInicio && unit.fechaTermino) {
            const start = new Date(unit.fechaInicio + 'T00:00:00');
            const end = new Date(unit.fechaTermino + 'T00:00:00');
            if (!isNaN(start) && !isNaN(end)) {
                const weeks = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7));
                const format = (d) => d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long' });
                durationText = `${weeks} semanas (${format(start)} al ${format(end)})`;
            }
        }

        // The requirement is to have a robust table structure similar to the screenshot.
        // The screenshot shows one large table block per unit.

        // ROW 1: Unit Name
        const rowUnitName = new TableRow({
            children: [
                createStandardHeaderCell(`Unidad ${unit.numero || '0'}`, 20),
                createStandardCell(unit.nombre, 80, { cellOptions: { columnSpan: 3 }, textStyle: { bold: true } }) // Span remaining cols
            ]
        });

        // ROW 2: Time
        const rowTime = new TableRow({
            children: [
                createStandardHeaderCell("Tiempo", 20),
                createStandardCell(durationText, 80, { cellOptions: { columnSpan: 3 } })
            ]
        });

        // ROW 3: OAT
        const rowOat = new TableRow({
            children: [
                createStandardHeaderCell("Aprendizajes transversales", 20),
                createStandardCell(createBulletedList(unit.oat), 80, { cellOptions: { columnSpan: 3 } })
            ]
        });

        // ROW 4: Habilidades
        const rowSkills = new TableRow({
            children: [
                createStandardHeaderCell("Habilidad S.XXI", 20),
                createStandardCell(createBulletedList(unit.habilidades), 80, { cellOptions: { columnSpan: 3 } })
            ]
        });

        // ROW 5: Evaluacion
        const rowEval = new TableRow({
            children: [
                createStandardHeaderCell("Evaluación", 20),
                createStandardCell(unit.tipoEvaluacion || "Sumativa", 80, { cellOptions: { columnSpan: 3 } })
            ]
        });

        // ROW 6: Details Header
        const rowDetailsHeader = new TableRow({
            tableHeader: true,
            children: [
                createStandardHeaderCell("Objetivos de Aprendizaje \n(Aprendizajes basales/Complementarios)", 35),
                createStandardHeaderCell("Subtemas", 15),
                createStandardHeaderCell("Tiempo \n(Semana)", 10),
                createStandardHeaderCell("Indicador de evaluación", 25),
                createStandardHeaderCell("Procedimiento/ \nInstrumento de evaluación", 15),
            ]
        });

        // ROW 7+: Details Data
        let detailsRows = [];
        if (unit.detalles && unit.detalles.length > 0) {
            detailsRows = unit.detalles.map(row => new TableRow({
                children: [
                    createStandardCell(row.oa || "-", 35),
                    createStandardCell((unit.ejes || []).join(', '), 15), // Mapped 'Ejes' to 'Subtemas' as requested
                    createStandardCell(row.tiempo || "-", 10),
                    createStandardCell(createBulletedList(row.indicadores), 25),
                    createStandardCell(row.instrumento || "-", 15),
                ]
            }));
        } else {
            detailsRows = [new TableRow({
                children: [
                    createStandardCell("No hay detalles planificados.", 100, { cellOptions: { columnSpan: 5 }, textStyle: { italic: true, alignment: AlignmentType.CENTER } })
                ]
            })];
        }

        // COMBINE INTO ONE BIG TABLE
        // Note: The details header has 5 columns, but the unit info rows have "1 + 3(colspan)" = 4 logical slots or "1 + 1(really wide)".
        // To make borders align perfectly like a grid, we usually need a consistent column count.
        // However, Word handles colspan well.
        // Let's ensure the Main Table structure is consistent.

        // Wait, the screenshot shows the Details section IS the same table, just strictly divided columns.
        // But the top part has different column widths (Title/Value).
        // It's safest to create TWO tables that touch each other to simulate one, OR use complex colSpans.
        // Given the complexity of "Subtemas/Tiempo" columns lining up, it's better to make the Details section its own table
        // immediately following the Info table, so column widths don't fight.

        const unitInfoTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [rowUnitName, rowTime, rowOat, rowSkills, rowEval],
        });

        const detailsTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [rowDetailsHeader, ...detailsRows],
        });

        unitSections.push(unitInfoTable);
        // Visual hack: Remove bottom margin of info table and top margin of details table?
        // For now, just placing them next to each other.
        unitSections.push(detailsTable);
        unitSections.push(new Paragraph({ text: "", spacing: { after: 300 } })); // Spacer between units
    });


    // 5. DOCUMENT CREATION
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                    },
                    margin: {
                        top: 720, // 0.5 inch
                        bottom: 720,
                        left: 720,
                        right: 720,
                    },
                    borders: {
                        pageBorderTop: { style: BorderStyle.DASHED, size: 12, color: GREEN_BORDER_COLOR, space: 24 },
                        pageBorderBottom: { style: BorderStyle.DASHED, size: 12, color: GREEN_BORDER_COLOR, space: 24 },
                        pageBorderLeft: { style: BorderStyle.DASHED, size: 12, color: GREEN_BORDER_COLOR, space: 24 },
                        pageBorderRight: { style: BorderStyle.DASHED, size: 12, color: GREEN_BORDER_COLOR, space: 24 },
                    }
                }
            },
            headers: {
                default: pageHeader
            },
            children: [
                title,
                metadataTable,
                new Paragraph({ text: "", spacing: { after: 200 } }), // Spacer
                ...unitSections,
            ]
        }]
    });

    // 6. GENERATE & DOWNLOAD
    try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Planificacion_Anual_${courseName}_${subjectName}.docx`);
    } catch (error) {
        console.error("Error generating DOCX:", error);
        alert("Error al generar el documento Word. Revisa la consola para más detalles.");
    }
};
