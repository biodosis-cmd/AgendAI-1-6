/**
 * Genera y descarga un PDF con el instrumento de evaluación (Rúbrica o Lista de Cotejo).
 * Maneja automáticamente los saltos de página para tablas largas.
 */
export const generateEvaluationPDF = async (evaluationData, curso, asignatura, baseObjective) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    if (!evaluationData || !evaluationData.criterios) {
        console.error("No hay datos válides para exportar.");
        return;
    }

    // Detección Estructural: Las IAs a veces omiten la propiedad 'tipo'.
    // Es más seguro validar si los criterios contienen un arreglo de 'niveles' (Rúbrica) u 'opciones' (Cotejo)
    const isRubric = !!(evaluationData.criterios[0] && evaluationData.criterios[0].niveles);

    const doc = new jsPDF('landscape', 'pt', 'letter');

    // Configuración base de fuente y colores
    doc.setFont("helvetica");
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = margin;

    // --- ENCABEZADO SUPERIOR ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59); // text-slate-800
    doc.text(evaluationData.titulo || "Instrumento de Evaluación", margin, currentY);
    currentY += 25;

    // --- DATOS DEL CONTEXTO ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // text-slate-500

    doc.setFont("helvetica", "bold");
    doc.text("Curso:", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(curso || "N/A", margin + 40, currentY);

    doc.setFont("helvetica", "bold");
    doc.text("Asignatura:", margin + 200, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(asignatura || "N/A", margin + 270, currentY);
    currentY += 15;

    doc.setFont("helvetica", "bold");
    doc.text("Objetivo Evaluado:", margin, currentY);
    doc.setFont("helvetica", "normal");

    // Split text para objetivos muy largos
    const splitObjective = doc.splitTextToSize(baseObjective || "N/A", pageWidth - margin * 2 - 100);
    doc.text(splitObjective, margin + 105, currentY);

    // Actualizar currentY sumando las líneas que tomó el objetivo
    currentY += (splitObjective.length * 12) + 15;

    // --- CAMPOS PARA EL ALUMNO ---
    currentY += 5;
    doc.setDrawColor(203, 213, 225); // border-slate-300
    doc.setLineWidth(1);

    doc.setFont("helvetica", "bold");
    doc.text("Estudiante:", margin, currentY);
    doc.line(margin + 65, currentY + 2, margin + 350, currentY + 2); // Línea para el nombre

    doc.text("Fecha:", margin + 380, currentY);
    doc.line(margin + 420, currentY + 2, margin + 550, currentY + 2); // Línea para la fecha
    currentY += 25;

    // --- TABLA DE EVALUACIÓN (AUTOTABLE) ---
    requestAnimationFrame(() => {
        let headConfig = [];
        let bodyConfig = [];

        if (isRubric && evaluationData.criterios[0]?.niveles) {
            // Estructura Rúbrica
            headConfig = [
                "Criterios de Evaluación",
                ...evaluationData.criterios[0].niveles.map(n => n.nivel || "Nivel")
            ];

            bodyConfig = evaluationData.criterios.map(crit => [
                crit.nombre,
                ...(crit.niveles ? crit.niveles.map(n => n.descripcion || "") : [])
            ]);
        } else {
            // Estructura Lista de Cotejo / Escala
            const options = evaluationData.criterios[0]?.opciones || ["Sí", "No"];
            headConfig = [
                "Indicadores a Evaluar",
                ...options
            ];

            bodyConfig = evaluationData.criterios.map(crit => {
                const row = [crit.nombre];
                // Rellenar celdas vacías para los checkboxes de la escala
                options.forEach(() => row.push(""));
                return row;
            });
        }

        autoTable(doc, {
            startY: currentY,
            head: [headConfig],
            body: bodyConfig,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 6,
                lineColor: [203, 213, 225], // border-slate-300
                lineWidth: 0.5,
                textColor: [30, 41, 59], // text-slate-800
            },
            headStyles: {
                fillColor: [241, 245, 249], // bg-slate-100
                textColor: [15, 23, 42], // text-slate-900
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 150, fontStyle: 'bold' } // La primera columna (Criterios/Indicadores) es más ancha y negrita
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // bg-slate-50
            },
            margin: { top: margin, right: margin, bottom: margin, left: margin },
            didDrawPage: (data) => {
                // Pie de página con numeración
                const str = "Página " + doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184); // text-slate-400
                doc.text(
                    str,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 20
                );
            }
        });

        // --- GUARDADO DEL PDF ---
        const safeClassName = (curso || 'Curso').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeType = (evaluationData.tipo || 'Evaluacion').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`${safeType}_${safeClassName}.pdf`);
    });
};
