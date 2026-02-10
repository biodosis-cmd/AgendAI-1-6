import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    VerticalAlign,
    TextRun,
    Header,
    PageOrientation,
    ShadingType
} from "docx";
import { saveAs } from "file-saver";
import { CURSO_HEX_COLORES } from '@/constants';

// --- HELPER FUNCTIONS ---

const createTextParagraph = (text, options = {}) => {
    // Handle null/undefined text gracefully
    const safeText = text || '';

    return new Paragraph({
        children: safeText.split('\n').map((line, index, array) => {
            const textRun = new TextRun({
                text: line,
                size: options.size || 22, // 11pt default
                font: "Calibri",
                bold: options.bold || false,
                color: options.color || "000000",
                italics: options.italics || false,
                ...options.textOptions
            });
            if (index < array.length - 1) {
                return [textRun, new TextRun({ break: 1 })];
            }
            return textRun;
        }).flat(),
        alignment: options.alignment || AlignmentType.LEFT,
        spacing: options.spacing || { after: 0 },
        ...options.paragraphOptions
    });
};

const createCell = (content, widthPercent = null, options = {}) => {
    const width = widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined;

    // Support string content or array of docx elements
    const children = typeof content === 'string'
        ? [createTextParagraph(content, { size: 20, ...options.textStyle })]
        : Array.isArray(content) ? content : [content];

    return new TableCell({
        children: children,
        width: width,
        verticalAlign: options.verticalAlign || VerticalAlign.TOP,
        shading: options.shading,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        borders: options.borders || {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        },
        columnSpan: options.columnSpan || 1,
        ...options.cellOptions
    });
};

const extractOACodes = (details) => {
    if (!details) return [];
    const codes = details.map(d => {
        const match = d.oa?.match(/^(OA\s*\d+)/i);
        return match ? match[1].toUpperCase() : null;
    }).filter(Boolean);
    return [...new Set(codes)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};


// --- EXPORT: LIST FORMAT (FICHAS) ---

export const generateReportListWord = async (clases, teacherName, year, filters, units) => {
    const { filtroCurso, filtroAsignatura } = filters;

    // Header for the document
    // Header for the document (School Info)
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

    const docChildren = [
        createTextParagraph("LIBRO DE PLANIFICACIÓN DOCENTE", { alignment: AlignmentType.CENTER, bold: true, size: 24 }),
        createTextParagraph("REPORTE DE CLASES", { alignment: AlignmentType.CENTER, size: 20 }),
        createTextParagraph(``), // Spacer
        createTextParagraph(`Docente: ${teacherName} | Año: ${year}`, { bold: true, size: 22 }),
        createTextParagraph(`Filtros: ${filtroCurso || 'Todos los Cursos'} / ${filtroAsignatura || 'Todas las Asignaturas'}`, { size: 22 }),
        new Paragraph({ text: "", spacing: { after: 300 } }), // Spacer
    ];

    clases.forEach(c => {
        const executed = c.ejecutada !== false;

        // --- Card Header (Background Color) ---
        // Hex to RRGGBB for docx (remove #)

        // Robust color finding: Match if course name starts with a known key (e.g., "1ro Básico A" matches "1ro Básico")
        let hexColor = CURSO_HEX_COLORES.default;
        const knownCourses = Object.keys(CURSO_HEX_COLORES);

        // 1. Try exact match
        if (CURSO_HEX_COLORES[c.curso]) {
            hexColor = CURSO_HEX_COLORES[c.curso];
        }
        // 2. Try partial match (starts with)
        else {
            const match = knownCourses.find(key => c.curso.startsWith(key) && key !== 'default');
            if (match) {
                hexColor = CURSO_HEX_COLORES[match];
            }
        }

        hexColor = hexColor.replace('#', '');

        // Docx shading needs fill color
        const cardHeader = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                createTextParagraph(`${c.curso} - ${c.asignatura}`, { color: "FFFFFF", bold: true, size: 24 }),
                                createTextParagraph(`${new Date(c.fecha).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' })} / ${Math.round((c.duracion || 90) / 45)} hrs ped. (Semana ${c.semana})`, { color: "FFFFFF", size: 20 })
                            ],
                            shading: { fill: hexColor, type: ShadingType.CLEAR }, // Solid background
                            margins: { top: 100, bottom: 100, left: 200, right: 200 },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                                bottom: { style: BorderStyle.NIL },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                            }
                        })
                    ]
                })
            ]
        });

        // --- Card Body ---
        let bodyChildren = [];

        if (executed) {
            // Unit Info if exists
            // Find unit logic duplicated here, ideally passed in or refactored shared logic
            // We need to implement findUnitForClass logic or pass it processed. 
            // For simplicity, let's assume 'units' is passed and we search it here like in the View.
            const unit = units.find(u => {
                const claseDate = new Date(c.fecha);
                const startDate = new Date(u.fechaInicio + 'T00:00:00');
                const endDate = new Date(u.fechaTermino + 'T23:59:59');
                return c.curso === u.curso && c.asignatura === u.asignatura && claseDate >= startDate && claseDate <= endDate;
            });

            if (unit) {
                const oaCodes = extractOACodes(unit.detalles).join(' - ');
                const unitTitle = unit.numero ? `Unidad ${unit.numero}: ${unit.nombre}` : unit.nombre;

                // Unit Box
                const unitBox = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        createTextParagraph(unitTitle, { bold: true, size: 20 }),
                                        createTextParagraph(`Objetivos de la Unidad: ${oaCodes}`, { bold: true, size: 20 }),
                                        createTextParagraph(unit.objetivos, { size: 20 })
                                    ],
                                    shading: { fill: "F1F1F1" },
                                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                    borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } }
                                })
                            ]
                        })
                    ]
                });
                bodyChildren.push(unitBox);
                bodyChildren.push(new Paragraph({ text: "", spacing: { after: 100 } })); // Spacer
            }

            // Class Content
            bodyChildren.push(createTextParagraph("Objetivo de la Clase:", { bold: true, size: 20 }));
            bodyChildren.push(createTextParagraph(c.objetivo, { size: 20, spacing: { after: 200 } }));

            const sections = [
                { title: "Inicio", content: c.inicio },
                { title: "Desarrollo", content: c.desarrollo },
                { title: "Aplicación", content: c.aplicacion },
                { title: "Cierre", content: c.cierre }
            ];

            sections.forEach(sec => {
                if (sec.content) {
                    // cleaning regex from View: .replace(/^\s*(inicio)[\s:]*/i, '').trim()
                    const cleanContent = sec.content.replace(new RegExp(`^\\s*(${sec.title})[\\s:]*`, 'i'), '').trim();
                    bodyChildren.push(createTextParagraph(`${sec.title}:`, { bold: true, size: 20 }));
                    bodyChildren.push(createTextParagraph(cleanContent, { size: 20, spacing: { after: 200 } }));
                }
            });

        } else {
            // Suspended Class
            bodyChildren.push(
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        createTextParagraph("Clase No Realizada", { bold: true, size: 22, color: "991B1B", alignment: AlignmentType.CENTER }),
                                        createTextParagraph(`Motivo: ${c.motivoSuspension}`, { size: 20, color: "991B1B", alignment: AlignmentType.CENTER })
                                    ],
                                    shading: { fill: "FEF2F2" }, // Red bg
                                    margins: { top: 200, bottom: 200, left: 100, right: 100 },
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 1, color: "FECACA" },
                                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "FECACA" },
                                        left: { style: BorderStyle.SINGLE, size: 1, color: "FECACA" },
                                        right: { style: BorderStyle.SINGLE, size: 1, color: "FECACA" },
                                    }
                                })
                            ]
                        })
                    ]
                })
            );
        }

        // Wrapper Table for Body Border
        const bodyTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: bodyChildren,
                            margins: { top: 200, bottom: 200, left: 200, right: 200 },
                            borders: {
                                top: { style: BorderStyle.NIL }, // Connected to header
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                            }
                        })
                    ]
                })
            ]
        });

        docChildren.push(cardHeader);
        docChildren.push(bodyTable);
        docChildren.push(new Paragraph({ text: "", spacing: { after: 400 } })); // Spacer between cards
    });

    const doc = new Document({
        sections: [{
            headers: { default: pageHeader },
            children: docChildren
        }]
    });

    saveAs(await Packer.toBlob(doc), `reporte_fichas_${year}.docx`);
};


// --- EXPORT: TABLE FORMAT ---

export const generateReportTableWord = async (clases, teacherName, year, filters, units) => {
    const { filtroCurso, filtroAsignatura } = filters;

    // Header logic similar to List but Landscape
    // Header logic similar to List but Landscape
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

    // Main Table Construction
    const tableHeaderRow = new TableRow({
        tableHeader: true,
        children: [
            createCell("Fecha / Hora", 10, { shading: { fill: "F0F0F0" }, textStyle: { bold: true } }),
            createCell("Curso / Asignatura", 15, { shading: { fill: "F0F0F0" }, textStyle: { bold: true } }),
            createCell("Objetivos de Aprendizaje", 25, { shading: { fill: "F0F0F0" }, textStyle: { bold: true } }),
            createCell("Secuencia Didáctica", 50, { shading: { fill: "F0F0F0" }, textStyle: { bold: true } }),
        ]
    });

    const tableRows = clases.map(c => {
        const executed = c.ejecutada !== false;
        const fecha = new Date(c.fecha);
        const diaFecha = fecha.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });
        const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        const hrsPedagogicas = Math.round((c.duracion || 90) / 45);
        const labelHrs = hrsPedagogicas === 1 ? 'hr ped.' : 'hrs ped.';

        const cell1Text = `${diaFecha}\n${hora}\n(${hrsPedagogicas} ${labelHrs})\nSemana ${c.semana}`;

        // Find unit matches View logic
        const unit = units.find(u => {
            const claseDate = new Date(c.fecha);
            const startDate = new Date(u.fechaInicio + 'T00:00:00');
            const endDate = new Date(u.fechaTermino + 'T23:59:59');
            return c.curso === u.curso && c.asignatura === u.asignatura && claseDate >= startDate && claseDate <= endDate;
        });

        let cell2Content = [createTextParagraph(c.curso, { bold: true }), createTextParagraph(c.asignatura)];
        if (unit && executed) {
            cell2Content.push(createTextParagraph(""));
            cell2Content.push(createTextParagraph(unit.numero ? `Unidad ${unit.numero}: ${unit.nombre}` : unit.nombre, { italics: true, size: 18 }));
        }

        let cell3Content = [];
        let cell4Content = [];
        let rowShading = undefined;

        if (executed) {
            // Cell 3: OA
            cell3Content.push(createTextParagraph(c.objetivo));
            if (unit) {
                const oaCodes = extractOACodes(unit.detalles).join(' - ');
                cell3Content.push(createTextParagraph(""));
                cell3Content.push(createTextParagraph(`[OA Unidad: ${oaCodes}]`, { italics: true, size: 18 }));
                cell3Content.push(createTextParagraph(unit.objetivos, { italics: true, size: 18 }));
            }

            // Cell 4: Sequence
            const sections = [
                { title: "INICIO", content: c.inicio },
                { title: "DESARROLLO", content: c.desarrollo },
                { title: "APLICACIÓN", content: c.aplicacion },
                { title: "CIERRE", content: c.cierre }
            ];

            const validSections = sections.filter(sec => sec.content);
            validSections.forEach((sec, index) => {
                const clean = sec.content.replace(new RegExp(`^\\s*(${sec.title})[\\s:]*`, 'i'), '').trim();
                cell4Content.push(createTextParagraph(sec.title + ":", { bold: true }));
                cell4Content.push(createTextParagraph(clean));

                // Add spacer only if it's not the last item
                if (index < validSections.length - 1) {
                    cell4Content.push(createTextParagraph(""));
                }
            });

        } else {
            // Suspended
            rowShading = { fill: "FFE6E6" };
            cell3Content = [createTextParagraph("CLASE NO REALIZADA", { bold: true, color: "CC0000", alignment: AlignmentType.CENTER })];
            cell4Content = [createTextParagraph(`Motivo: ${c.motivoSuspension}`, { color: "CC0000" })];
        }

        return new TableRow({
            children: [
                createCell(cell1Text, 10, { shading: rowShading, textStyle: { bold: true } }),
                createCell(cell2Content, 15, { shading: rowShading }),
                // If suspended, maybe merge cells? View did colspan=2.
                // Docx supports columnSpan.
                executed
                    ? createCell(cell3Content, 25, { shading: rowShading })
                    : createCell(cell3Content, 75, { shading: rowShading, columnSpan: 2, textStyle: { alignment: AlignmentType.CENTER } }),

                executed
                    ? createCell(cell4Content, 50, { shading: rowShading })
                    : null // Skipped because of colspan above
            ].filter(Boolean)
        });
    });


    const documentTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [tableHeaderRow, ...tableRows]
    });

    // Signature Area
    // We can use a simple table without borders for signatures to align them
    const signatureTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL }, insideVertical: { style: BorderStyle.NIL }, insideHorizontal: { style: BorderStyle.NIL } },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: "Firma Docente" })],
                                alignment: AlignmentType.CENTER,
                                border: { top: { style: BorderStyle.SINGLE, size: 1, space: 1 } } // Top border acts as signature line
                            })
                        ],
                        borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } }, // Actually, let's just use paragraph borders or a specific cell border logic
                        // Simpler: Just text with a line above it? 
                        // TableCell allows individual borders.
                        // Let's enable TOP border for this cell.
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        margins: { top: 200 }
                    }),
                    new TableCell({ children: [], width: { size: 20, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } } }), // Spacer
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: "Timbre UTP / Dirección" })],
                                alignment: AlignmentType.CENTER,
                            })
                        ],
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } },
                        margins: { top: 200 }
                    }),
                ]
            })
        ]
    });


    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { orientation: PageOrientation.LANDSCAPE },
                    margin: { top: 720, bottom: 720, left: 720, right: 720 }
                }
            },
            headers: { default: pageHeader },
            children: [
                createTextParagraph("LIBRO DE PLANIFICACIÓN DOCENTE", { alignment: AlignmentType.CENTER, bold: true, size: 24 }),
                createTextParagraph("REPORTE SEMANAL DE CLASES", { alignment: AlignmentType.CENTER, size: 20 }),
                createTextParagraph(``),
                createTextParagraph(`Docente: ${teacherName} | Año: ${year}`, { bold: true, size: 22 }),
                createTextParagraph(`Filtros: ${filtroCurso || 'Todos los Cursos'} / ${filtroAsignatura || 'Todas las Asignaturas'}`, { size: 22 }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                documentTable,
                new Paragraph({ text: "", spacing: { after: 800 } }), // Lots of space before signatures
                signatureTable
            ]
        }]
    });

    saveAs(await Packer.toBlob(doc), `planificacion_tabla_${year}.docx`);
};
