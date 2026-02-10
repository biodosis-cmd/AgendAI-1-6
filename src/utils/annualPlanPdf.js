export const generateAnnualPlanPDF = async (courseName, subjectName, teacherName = '', year, units) => {
    // Dynamic imports to match ReportView.jsx pattern
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('l', 'mm', 'legal'); // Landscape, Legal size for more width

    // --- Constants ---
    const MARGIN = 15;
    const PAGE_WIDTH = doc.internal.pageSize.width;

    let yPos = MARGIN;

    // --- Helper: Add Page Header ---
    const addHeader = () => {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PLANIFICACIÓN ANUAL', PAGE_WIDTH / 2, yPos, { align: 'center' });
        yPos += 10;

        // Metadata Table
        autoTable(doc, {
            startY: yPos,
            head: [['Asignatura', subjectName, 'Docente', teacherName]],
            body: [['Curso', courseName, 'Año', year.toString()]],
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { fillColor: [235, 241, 222], textColor: [0, 0, 0], fontStyle: 'bold' }, // Light Greenish
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [235, 241, 222], width: 30 },
                1: { width: 100 },
                2: { fontStyle: 'bold', fillColor: [235, 241, 222], width: 30 },
            },
            margin: { left: MARGIN, right: MARGIN }
        });
        yPos = doc.lastAutoTable.finalY + 10;
    };

    // Initial Header
    addHeader();

    // --- Process Each Unit ---
    const sortedUnits = [...units].sort((a, b) => (a.numero || 999) - (b.numero || 999));

    sortedUnits.forEach((unit, index) => {

        // Check page break for Unit Header
        if (yPos > 170) {
            doc.addPage();
            yPos = MARGIN + 10; // Reset Y
        }

        // Calculate Duration
        let durationText = 'Fechas no definidas';
        if (unit.fechaInicio && unit.fechaTermino) {
            const start = new Date(unit.fechaInicio + 'T00:00:00');
            const end = new Date(unit.fechaTermino + 'T00:00:00');
            if (!isNaN(start) && !isNaN(end)) {
                const weeks = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7));
                const dateRange = `${start.toLocaleDateString('es-CL', { day: '2-digit', month: 'long' })} al ${end.toLocaleDateString('es-CL', { day: '2-digit', month: 'long' })}`;
                durationText = `${weeks} semanas (${dateRange})`;
            }
        }

        // Prepare OAT and Skills lists
        const oatText = (unit.oat || []).map(o => `• ${o}`).join('\n');
        const skillsText = (unit.habilidades || []).map(h => `• ${h}`).join('\n');

        const unitTitle = unit.numero ? `Unidad ${unit.numero}: ${unit.nombre}` : unit.nombre;

        autoTable(doc, {
            startY: yPos,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.1, overflow: 'linebreak' },
            headStyles: { fillColor: [220, 230, 241], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'left' },
            body: [
                [{ content: unitTitle, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 230, 241] } }],
                ['Tiempo', durationText],
                ['Aprendizajes Transversales', oatText || 'No registrados'],
                ['Habilidades S.XXI', skillsText || 'No registradas'],
                ['Evaluación', unit.tipoEvaluacion || 'Sumativa']
            ],
            columnStyles: {
                0: { width: 50, fontStyle: 'bold', fillColor: [235, 241, 222] }, // Label Column
                1: { width: 'auto' }
            },
            margin: { left: MARGIN, right: MARGIN }
        });

        yPos = doc.lastAutoTable.finalY; // Connect tables directly

        // 2. Unit Details Table (The Big Table)
        if (unit.detalles && unit.detalles.length > 0) {
            const tableBody = unit.detalles.map(row => [
                row.oa || '',
                (unit.ejes || []).join(', '), // Using Ejes as Subtemas proxy for now
                row.tiempo || '',
                (row.indicadores || []).map(i => `• ${i}`).join('\n'),
                row.instrumento || ''
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Objetivos de Aprendizaje', 'Ejes / Subtemas', 'Tiempo', 'Indicador de Evaluación', 'Instrumento']],
                body: tableBody,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.1, valign: 'top' },
                headStyles: { fillColor: [235, 241, 222], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { width: 80 },
                    1: { width: 30 },
                    2: { width: 25, halign: 'center' },
                    3: { width: 100 },
                    4: { width: 40 }
                },
                margin: { left: MARGIN, right: MARGIN },
                // Page break handling is automatic in autotable, but explicit page breaks might reset header
                // We rely on autoTable's automatic header repetition for long tables
            });

            yPos = doc.lastAutoTable.finalY + 10; // Space after unit
        } else {
            yPos += 10;
        }
    });

    doc.save(`Planificacion_Anual_${courseName}_${subjectName}.pdf`);
};
