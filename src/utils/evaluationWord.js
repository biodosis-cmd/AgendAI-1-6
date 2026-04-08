/**
 * Genera y descarga un documento DOCX con el instrumento de evaluación (Rúbrica o Lista de Cotejo).
 */
export const generateEvaluationWord = async (evaluationData, curso, asignatura, baseObjective, tipoInstrumento) => {
    if (!evaluationData || !evaluationData.criterios) {
        console.error("No hay datos válides para exportar.");
        return;
    }

    // Importación dinámica para mantener el bundle pequeño
    const {
        Document,
        Packer,
        Paragraph,
        Table,
        TableRow,
        TableCell,
        WidthType,
        BorderStyle,
        PageOrientation,
        AlignmentType,
        VerticalAlign,
        TextRun
    } = await import('docx');
    const { saveAs } = await import('file-saver');

    const isRubric = !!(evaluationData.criterios[0] && evaluationData.criterios[0].niveles);

    // --- Helpers de DOCX ---

    const createTextParagraph = (text, options = {}) => {
        return new Paragraph({
            children: text.split('\n').map((line, index, array) => {
                const textRun = new TextRun({
                    text: line,
                    size: options.size || 22, // 11pt
                    font: "Calibri",
                    bold: options.bold || false,
                    color: options.color || "000000",
                    ...options.textOptions
                });
                if (index < array.length - 1) return [textRun, new TextRun({ break: 1 })];
                return textRun;
            }).flat(),
            alignment: options.alignment || AlignmentType.LEFT,
            spacing: options.spacing || { after: 0 },
            ...options.paragraphOptions
        });
    };

    const createHeaderCell = (text, widthPercent) => {
        return new TableCell({
            children: [createTextParagraph(text, { size: 20, bold: true, alignment: AlignmentType.CENTER })],
            width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F1F5F9" }, // Gris claro
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
            }
        });
    };

    const createBodyCell = (text, widthPercent, isFirstCol = false) => {
        return new TableCell({
            children: [createTextParagraph(text, { size: 20, bold: isFirstCol })],
            width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
            }
        });
    };

    // --- Construcción del Encabezado del Documento ---

    const title = new Paragraph({
        children: [new TextRun({ text: evaluationData.titulo || "Instrumento de Evaluación", bold: true, size: 32, font: "Calibri", color: "1E293B" })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 300 }
    });

    const infoParagraph = new Paragraph({
        children: [
            new TextRun({ text: "Curso: ", bold: true, size: 20, font: "Calibri", color: "475569" }),
            new TextRun({ text: `${curso || "N/A"}\t\t`, size: 20, font: "Calibri", color: "475569" }),
            new TextRun({ text: "Asignatura: ", bold: true, size: 20, font: "Calibri", color: "475569" }),
            new TextRun({ text: `${asignatura || "N/A"}\n\n`, size: 20, font: "Calibri", color: "475569" }),

            new TextRun({ text: "Objetivo Evaluado: ", bold: true, size: 20, font: "Calibri", color: "475569" }),
            new TextRun({ text: `${baseObjective || "N/A"}\n\n`, size: 20, font: "Calibri", color: "475569" }),

            new TextRun({ text: "Estudiante: ", bold: true, size: 20, font: "Calibri", color: "475569" }),
            new TextRun({ text: "__________________________________________________\t\t", size: 20, font: "Calibri", color: "475569" }),
            new TextRun({ text: "Fecha: ", bold: true, size: 20, font: "Calibri", color: "475569" }),
            new TextRun({ text: "__________________", size: 20, font: "Calibri", color: "475569" }),
        ],
        spacing: { after: 400 }
    });

    // --- Construcción de la Tabla de Evaluación ---

    let tableRows = [];

    if (isRubric && evaluationData.criterios[0]?.niveles) {
        // Cabecera Rúbrica
        const columnsCount = evaluationData.criterios[0].niveles.length + 1;
        const mainColWidth = 100 / columnsCount; // Aproximado

        const headerRow = new TableRow({
            tableHeader: true,
            children: [
                createHeaderCell("Criterios de Evaluación", mainColWidth),
                ...evaluationData.criterios[0].niveles.map(n => createHeaderCell(n.nivel || "Nivel", mainColWidth))
            ]
        });
        tableRows.push(headerRow);

        // Cuerpo Rúbrica
        evaluationData.criterios.forEach(crit => {
            const row = new TableRow({
                children: [
                    createBodyCell(crit.nombre, mainColWidth, true),
                    ...(crit.niveles ? crit.niveles.map(n => createBodyCell(n.descripcion || "", mainColWidth)) : [])
                ]
            });
            tableRows.push(row);
        });
    } else {
        // Cabecera Lista Apreciación / Cotejo
        const options = evaluationData.criterios[0]?.opciones || ["Sí", "No"];

        const headerRow = new TableRow({
            tableHeader: true,
            children: [
                createHeaderCell("Indicadores a Evaluar", 60),
                ...options.map(opt => createHeaderCell(opt, 40 / options.length))
            ]
        });
        tableRows.push(headerRow);

        // Cuerpo Cotejo
        evaluationData.criterios.forEach(crit => {
            const cells = [createBodyCell(crit.nombre, 60, true)];
            options.forEach(() => cells.push(createBodyCell("", 40 / options.length))); // Celdas vacías para ticks

            const row = new TableRow({ children: cells });
            tableRows.push(row);
        });
    }

    const evaluationTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
    });

    // --- Creación del Documento y Exportación ---

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { orientation: PageOrientation.LANDSCAPE },
                    margin: { top: 700, bottom: 700, left: 700, right: 700 }
                }
            },
            children: [title, infoParagraph, evaluationTable]
        }]
    });

    try {
        const blob = await Packer.toBlob(doc);
        const safeTipo = (tipoInstrumento || 'Evaluacion').replace(/[^a-z0-9áéíóúñ]/gi, '_').replace(/_+/g, '_').toLowerCase();
        const safeCurso = (curso || 'Curso').replace(/[^a-z0-9áéíóúñ]/gi, '_').replace(/_+/g, '_').toLowerCase();
        const safeAsignatura = (asignatura || 'Asignatura').replace(/[^a-z0-9áéíóúñ]/gi, '_').replace(/_+/g, '_').toLowerCase();
        saveAs(blob, `${safeTipo}_${safeCurso}_${safeAsignatura}.docx`);
    } catch (error) {
        console.error("Error generating DOCX:", error);
        alert("Error al generar el documento Word. Revisa la consola para más detalles.");
    }
};
