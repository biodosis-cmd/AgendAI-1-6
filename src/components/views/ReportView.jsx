import React, { useState, useMemo, useCallback } from 'react';
import { Printer, File, FileType, Trash2, User } from 'lucide-react';
import { CURSO_HEX_COLORES } from '@/constants';
import { generateReportListWord, generateReportTableWord } from '@/utils/reportsWord';

const extractOACodes = (details) => {
    if (!details) return [];
    const codes = details.map(d => {
        const match = d.oa?.match(/^(OA\s*\d+)/i);
        return match ? match[1].toUpperCase() : null;
    }).filter(Boolean);
    return [...new Set(codes)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

const ReportView = ({ clases, units, onBack, selectedYear: initialYear, onEditClase, onDelete, onDeleteMultiple }) => {
    const [teacherName, setTeacherName] = useState('');
    const [filtroCurso, setFiltroCurso] = useState('');
    const [filtroAsignatura, setFiltroAsignatura] = useState('');
    const [reportYear, setReportYear] = useState(initialYear);

    // ... existing useMemo logic ...

    const validateName = () => {
        if (!teacherName.trim()) {
            alert("Por favor, ingresa el Nombre del Docente antes de generar el reporte.");
            return false;
        }
        return true;
    };

    const availableYears = useMemo(() => {
        return [...new Set(clases.map(c => new Date(c.fecha).getFullYear()))].sort((a, b) => b - a);
    }, [clases]);

    // Ensure we have at least the initial year if no classes exist yet
    const displayYears = useMemo(() => {
        const years = new Set(availableYears);
        years.add(initialYear);
        return [...years].sort((a, b) => b - a);
    }, [availableYears, initialYear]);

    const clasesDelAno = useMemo(() => {
        return clases.filter(c => new Date(c.fecha).getFullYear() === parseInt(reportYear));
    }, [clases, reportYear]);

    const cursosDisponibles = useMemo(() => [...new Set(clasesDelAno.map(c => c.curso))].sort(), [clasesDelAno]);
    const asignaturasDisponibles = useMemo(() => {
        if (!filtroCurso) return [...new Set(clasesDelAno.map(c => c.asignatura))].sort();
        return [...new Set(clasesDelAno.filter(c => c.curso === filtroCurso).map(c => c.asignatura))].sort();
    }, [clasesDelAno, filtroCurso]);

    const findUnitForClass = useCallback((clase) => {
        return units.find(unit => {
            const claseDate = new Date(clase.fecha);
            const startDate = new Date(unit.fechaInicio + 'T00:00:00');
            const endDate = new Date(unit.fechaTermino + 'T23:59:59');
            return clase.curso === unit.curso &&
                clase.asignatura === unit.asignatura &&
                claseDate >= startDate &&
                claseDate <= endDate;
        });
    }, [units]);

    const clasesFiltradas = useMemo(() => {
        return clasesDelAno
            .filter(c => !filtroCurso || c.curso === filtroCurso)
            .filter(c => !filtroAsignatura || c.asignatura === filtroAsignatura)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }, [clasesDelAno, filtroCurso, filtroAsignatura]);

    const exportarACSV = () => {
        if (!validateName()) return;

        const headers = ['Fecha', 'Hora', 'Semana', 'Curso', 'Asignatura', 'Estado', 'Motivo Suspensión', 'Objetivo Clase', 'Inicio', 'Desarrollo', 'Aplicacion', 'Cierre', 'N° Unidad', 'Unidad', 'Objetivos Unidad'];
        const rows = clasesFiltradas.map(c => {
            const fecha = new Date(c.fecha);
            const unit = findUnitForClass(c);
            const sanitize = (str) => `"${(str || '').replace(/"/g, '""')}"`;
            const ejecutada = c.ejecutada !== false;

            return [
                fecha.toLocaleDateString('es-CL'),
                fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }),
                c.semana, c.curso, c.asignatura,
                ejecutada ? 'Planificada' : 'No Realizada',
                sanitize(c.motivoSuspension),
                ejecutada ? sanitize(c.objetivo) : '',
                ejecutada ? sanitize(c.inicio) : '',
                ejecutada ? sanitize(c.desarrollo) : '',
                ejecutada ? sanitize(c.aplicacion) : '',
                ejecutada ? sanitize(c.cierre) : '',
                ejecutada ? (unit && unit.numero ? unit.numero : 'N/A') : '', // N° Unidad
                ejecutada ? sanitize(unit ? unit.nombre : 'N/A') : '',
                ejecutada ? sanitize(unit ? unit.objetivos : 'N/A') : ''
            ].join(';');
        });
        const contenidoCSV = [headers.join(';'), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${contenidoCSV}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `reporte_planificaciones_${reportYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportarAPDF = () => {
        if (!validateName()) return;

        import('jspdf').then(({ default: jsPDF }) => {
            import('jspdf-autotable').then(({ default: autoTable }) => {
                const doc = new jsPDF('l', 'mm', 'a4');
                const margin = 15;

                // Header
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text("LIBRO DE PLANIFICACIÓN DOCENTE", 148.5, 20, { align: 'center' });

                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.text("REPORTE SEMANAL DE CLASES", 148.5, 28, { align: 'center' });

                // Meta Info
                doc.setFontSize(10);
                doc.text(`Docente: ${teacherName}`, margin, 40);
                doc.text(`Año Escolar: ${reportYear}`, margin, 45);

                const filtroTexto = `Filtros: ${filtroCurso || 'Todos los Cursos'} / ${filtroAsignatura || 'Todas las Asignaturas'}`;
                doc.text(filtroTexto, 297 - margin - doc.getTextWidth(filtroTexto), 40);

                // Table Data
                // Table Data
                const rows = clasesFiltradas.map(c => {
                    const unit = findUnitForClass(c);
                    const ejecutada = c.ejecutada !== false;
                    const fecha = new Date(c.fecha);
                    const diaFecha = fecha.toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' });
                    const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

                    const hrsPedagogicas = Math.round((c.duracion || 90) / 45);
                    const labelHrs = hrsPedagogicas === 1 ? 'hr ped.' : 'hrs ped.';

                    if (!ejecutada) {
                        return [
                            `${diaFecha}\n${hora}\n(${hrsPedagogicas} ${labelHrs})\nSemana ${c.semana}`,
                            `${c.curso}\n${c.asignatura}`,
                            'CLASE NO REALIZADA\nMotivo: ' + (c.motivoSuspension || ''),
                            ''
                        ];
                    }

                    // Correct Order: Inicio -> Desarrollo -> Aplicación -> Cierre
                    let secuencia = '';
                    if (c.inicio) secuencia += `INICIO:\n${c.inicio.replace(/^\s*(inicio)[\s:]*/i, '').trim()}\n\n`;
                    if (c.desarrollo) secuencia += `DESARROLLO:\n${c.desarrollo.replace(/^\s*(desarrollo)[\s:]*/i, '').trim()}\n\n`;
                    if (c.aplicacion) secuencia += `APLICACIÓN:\n${c.aplicacion.replace(/^\s*(aplicaci[oó]n)[\s:]*/i, '').trim()}\n\n`;
                    if (c.cierre) secuencia += `CIERRE:\n${c.cierre.replace(/^\s*(cierre)[\s:]*/i, '').trim()}`;

                    let oa = c.objetivo || '';
                    if (unit) {
                        const oaCodes = extractOACodes(unit.detalles).join(' - ');
                        oa += `\n\n[OA Unidad: ${oaCodes}\n${unit.objetivos}]`;
                    }

                    return [
                        `${diaFecha}\n${hora}\n(${hrsPedagogicas} ${labelHrs})\nSemana ${c.semana}`,
                        `${c.curso}\n${c.asignatura}\n${unit ? `(U: ${unit.numero ? `${unit.numero}: ` : ''}${unit.nombre})` : ''}`,
                        oa,
                        secuencia
                    ];
                });

                autoTable(doc, {
                    startY: 50,
                    head: [['Fecha / Hora', 'Curso / Asignatura', 'Objetivos de Aprendizaje', 'Secuencia Didáctica']],
                    body: rows,
                    theme: 'grid',
                    styles: {
                        fontSize: 9,
                        cellPadding: 3,
                        overflow: 'linebreak',
                        halign: 'left',
                        valign: 'top',
                        lineColor: [0, 0, 0],
                        lineWidth: 0.1
                    },
                    headStyles: {
                        fillColor: [240, 240, 240],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold',
                        lineColor: [0, 0, 0],
                        lineWidth: 0.1
                    },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        1: { cellWidth: 35 },
                        2: { cellWidth: 70 }, // Increased from 60
                        3: { cellWidth: 135 }  // Increased from 110 + 35 (obs) roughly
                    },
                    didParseCell: (data) => {
                        // Apply red background to suspended classes
                        if (data.row.raw[2] && data.row.raw[2].toString().startsWith('CLASE NO REALIZADA')) {
                            if (data.section === 'body') {
                                data.cell.styles.fillColor = [255, 230, 230];
                                data.cell.styles.textColor = [150, 0, 0];
                            }
                        }
                    }
                });

                // Signatures
                const finalY = doc.lastAutoTable.finalY + 40;

                // Avoid drawing off page
                if (finalY < 190) {
                    doc.setLineWidth(0.5);
                    doc.line(60, finalY, 120, finalY); // Docente
                    doc.line(180, finalY, 240, finalY); // UTP
                    doc.text("Firma Docente", 90, finalY + 5, { align: 'center' });
                    doc.text("Timbre UTP / Dirección", 210, finalY + 5, { align: 'center' });
                } else {
                    doc.addPage();
                    doc.setLineWidth(0.5);
                    doc.line(60, 40, 120, 40);
                    doc.line(180, 40, 240, 40);

                    doc.setFontSize(10);
                    doc.text("Firma Docente", 90, 45, { align: 'center' });
                    doc.text("Timbre UTP / Dirección", 210, 45, { align: 'center' });
                }

                doc.save(`planificacion_${reportYear}_${new Date().toISOString().slice(0, 10)}.pdf`);
            });
        });
    };

    const exportarAWordLista = () => {
        if (!validateName()) return;
        generateReportListWord(clasesFiltradas, teacherName, reportYear, { filtroCurso, filtroAsignatura }, units);
    };

    const exportarAWordTabla = () => {
        if (!validateName()) return;
        generateReportTableWord(clasesFiltradas, teacherName, reportYear, { filtroCurso, filtroAsignatura }, units);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white">Generar Reporte</h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-5 card-glass rounded-xl border border-slate-700/50">
                <div className="relative group col-span-1 md:col-span-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="Nombre Docente"
                        className="w-full pl-10 p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:border-indigo-500 outline-none placeholder:text-slate-500"
                    />
                </div>
                <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)} className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:border-indigo-500 outline-none col-span-1 md:col-span-1"><option value="">Todos los Cursos</option>{cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select value={filtroAsignatura} onChange={e => setFiltroAsignatura(e.target.value)} className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:border-indigo-500 outline-none col-span-1 md:col-span-1"><option value="">Todas las Asignaturas</option>{asignaturasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}</select>
            </div>

            <div className="mb-6 p-5 card-glass rounded-xl border border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 text-slate-200">Opciones de Exportación</h3>
                <div className="flex flex-wrap gap-3 items-center">
                    <button onClick={exportarAPDF} className="btn-accent from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-red-500/20"><Printer size={18} /> Exportar a PDF</button>
                    <div className="flex gap-2">
                        <button onClick={exportarAWordLista} className="btn-accent from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20"><File size={18} /> Word (Fichas)</button>
                        <button onClick={exportarAWordTabla} className="btn-accent from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20"><File size={18} /> Word (Tabla)</button>
                    </div>
                    <button onClick={exportarACSV} className="btn-accent from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20"><FileType size={18} /> Exportar a CSV</button>

                    {/* BULK DELETE BUTTON - Only visible when filters are active */}
                    {filtroCurso && filtroAsignatura && clasesFiltradas.length > 0 && (
                        <div className="ml-auto pl-4 border-l border-slate-600/50">
                            <button
                                onClick={() => onDeleteMultiple && onDeleteMultiple(clasesFiltradas)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
                            >
                                <Trash2 size={18} /> Eliminar {clasesFiltradas.length} Clases
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card-glass rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <h3 className="text-lg font-semibold p-5 text-slate-200 border-b border-slate-700/50 bg-slate-800/30">Vista Previa del Reporte - Año {reportYear}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900/50 text-xs text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-semibold">Fecha</th>
                                <th className="p-4 font-semibold">Curso</th>
                                <th className="p-4 font-semibold">Asignatura</th>
                                <th className="p-4 font-semibold">Objetivo</th>
                                <th className="p-4 font-semibold">Estado</th>
                                <th className="p-4 font-semibold w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {clasesFiltradas.length > 0 ? clasesFiltradas.map(c => (
                                <tr key={c.id} onClick={() => onEditClase(c)} className={`hover:bg-indigo-500/10 cursor-pointer transition-colors ${c.ejecutada === false ? 'opacity-60 grayscale' : ''}`}>
                                    <td className="p-4 whitespace-nowrap">{new Date(c.fecha).toLocaleDateString('es-CL')}</td>
                                    <td className="p-4 font-medium text-indigo-300">{c.curso}</td>
                                    <td className="p-4">{c.asignatura}</td>
                                    <td className="p-4 truncate max-w-xs">{c.ejecutada === false ? `No realizada: ${c.motivoSuspension}` : c.objetivo}</td>
                                    <td className="p-4">{c.ejecutada !== false ? <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30'>Planificada</span> : <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30'>No Realizada</span>}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(c); }}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Eliminar clase"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="text-center p-12 text-slate-500 italic">No hay clases que coincidan con los filtros seleccionados para el año {reportYear}.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportView;
