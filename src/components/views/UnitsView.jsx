import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, ChevronDown, List as ListIcon, Calendar as TimelineIcon, FileDown, FileText } from 'lucide-react';
import UnitModal from '@/components/modals/UnitModal';
import TimelineView from './TimelineView';
import { generateAnnualPlanPDF } from '@/utils/annualPlanPdf';
import { generateAnnualPlanWord } from '@/utils/annualPlanWord';
import { User } from 'lucide-react';
import { useUI } from '@/context/UIContext'; // Import Context

const extractOACodes = (details) => {
    if (!details) return [];
    const codes = details.map(d => {
        const match = d.oa?.match(/^(OA\s*\d+)/i);
        return match ? match[1].toUpperCase() : null;
    }).filter(Boolean);
    return [...new Set(codes)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

const UnitsView = ({ units, clases, userId, onBack, onEditClase, onDelete, selectedYear, selectedWeek, schedules }) => {
    const { validYear, actions } = useUI(); // Get context
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [unitToEdit, setUnitToEdit] = useState(null);
    const [expandedUnitId, setExpandedUnitId] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // Default to list for easy access
    const [teacherName, setTeacherName] = useState('');
    const displayYear = validYear || schedules?.[0]?.validYear || new Date().getFullYear();

    const handleOpenModal = (unit = null) => {
        setUnitToEdit(unit);
        setUnitModalOpen(true);
    };

    const handleCloseModal = () => {
        setUnitToEdit(null);
        setUnitModalOpen(false);
    };

    const validateName = () => {
        if (!teacherName.trim()) {
            alert("Por favor, ingresa el Nombre del Docente antes de descargar la planificación.");
            return false;
        }
        return true;
    };

    const handleExportPDF = (courseKey, courseUnits) => {
        if (!validateName()) return;
        const [curso, asignatura] = courseKey.split(' - ');
        generateAnnualPlanPDF(curso, asignatura, teacherName, selectedYear, courseUnits);
    };

    const handleExportWord = (courseKey, courseUnits) => {
        if (!validateName()) return;
        const [curso, asignatura] = courseKey.split(' - ');
        generateAnnualPlanWord(curso, asignatura, teacherName, selectedYear, courseUnits);
    };

    const unitsByCourse = useMemo(() => {
        return units.reduce((acc, unit) => {
            const key = `${unit.curso} - ${unit.asignatura}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(unit);
            return acc;
        }, {});
    }, [units]);

    // ... inside render ...
    return (
        <main className="p-4 md:p-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Gestión de Unidades</h2>

                    {/* Year Toggle (Dropdown) */}
                    {displayYear && (
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => actions.setSelectedYear(parseInt(e.target.value))}
                                className="appearance-none bg-slate-800/80 border border-slate-700 text-slate-200 text-sm font-bold py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:border-indigo-500 hover:border-indigo-400 transition-colors cursor-pointer"
                            >
                                {[0, 1, 2, 3].map(offset => (
                                    <option key={displayYear + offset} value={displayYear + offset}>
                                        {displayYear + offset}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    )}
                </div>

                <div className="relative group w-64">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="Docente (Para Reportes)"
                        className="w-full pl-9 p-1.5 sm:p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:border-indigo-500 outline-none placeholder:text-slate-500 text-xs sm:text-sm"
                    />
                </div>
                {/* View Toggle */}
                <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 flex">
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                        title="Vista Cronograma"
                    >
                        <TimelineIcon size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                        title="Vista Lista"
                    >
                        <ListIcon size={18} />
                    </button>
                </div>

                <button onClick={() => handleOpenModal()} className="btn-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 text-sm sm:text-base font-bold whitespace-nowrap">
                    <Plus size={18} /> <span className="hidden sm:inline">Crear Unidad</span>
                    <span className="sm:hidden">Crear</span>
                </button>
                <button onClick={onBack} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm sm:text-base">Volver</button>
            </div>

            {viewMode === 'timeline' ? (
                <TimelineView units={units} onEditUnit={handleOpenModal} selectedYear={selectedYear} />
            ) : (
                <div className="space-y-8">
                    {Object.keys(unitsByCourse).sort().map(courseKey => (
                        <div key={courseKey}>
                            <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2 pl-2 border-l-4 border-l-indigo-500">
                                <h3 className="text-2xl font-semibold text-slate-200">{courseKey}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExportPDF(courseKey, unitsByCourse[courseKey])}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-sm transition-colors border border-slate-700"
                                        title="Exportar a PDF"
                                    >
                                        <FileDown size={16} /> PDF
                                    </button>
                                    <button
                                        onClick={() => handleExportWord(courseKey, unitsByCourse[courseKey])}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-sm transition-colors border border-slate-700"
                                        title="Exportar a Word"
                                    >
                                        <FileText size={16} /> Word
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {unitsByCourse[courseKey].sort((a, b) => (a.numero || 999) - (b.numero || 999)).map(unit => {
                                    const isExpanded = expandedUnitId === unit.id;
                                    const oaCodes = extractOACodes(unit.detalles);
                                    const linkedClasses = clases.filter(clase => {
                                        const claseDate = new Date(clase.fecha);
                                        const startDate = new Date(unit.fechaInicio + 'T00:00:00');
                                        const endDate = new Date(unit.fechaTermino + 'T23:59:59');
                                        return clase.curso === unit.curso &&
                                            clase.asignatura === unit.asignatura &&
                                            claseDate >= startDate &&
                                            claseDate <= endDate;
                                    }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

                                    return (
                                        <div key={unit.id} className="card-glass rounded-xl transition-all duration-300 border border-slate-700/30 hover:border-indigo-500/30">
                                            <div className="p-5 cursor-pointer" onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-bold text-xl text-slate-100">
                                                            {unit.numero ? `Unidad ${unit.numero}: ` : ''}{unit.nombre}
                                                        </h4>
                                                        <p className="text-sm text-slate-400 mt-1">
                                                            {new Date(unit.fechaInicio + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} - {new Date(unit.fechaTermino + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            <span className="ml-4 inline-block bg-slate-800/80 border border-slate-700 text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">{linkedClasses.length} clases</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(unit); }} className="p-2 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-colors"><Edit size={18} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); onDelete(unit); }} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                                        <ChevronDown className={`transition-transform duration-300 text-slate-500 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="border-t border-slate-700/50 p-5 bg-slate-800/20">
                                                    <h5 className="font-semibold text-lg mb-2 text-indigo-300">Objetivos de la Unidad</h5>
                                                    <p className="text-slate-300 whitespace-pre-wrap text-sm mb-6 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-slate-700/30">{unit.objetivos || 'No hay objetivos definidos.'}</p>

                                                    {oaCodes.length > 0 && (
                                                        <div className="mb-6">
                                                            <h5 className="font-semibold text-sm uppercase tracking-wider mb-3 text-indigo-400">OA Específicos</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {oaCodes.map(oa => (
                                                                    <span key={oa} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-md text-xs font-bold border border-indigo-500/20 shadow-sm cursor-default hover:bg-indigo-500/20 transition-colors">
                                                                        {oa}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <h5 className="font-semibold text-lg mb-3 text-indigo-300">Clases Vinculadas</h5>
                                                    {linkedClasses.length > 0 ? (
                                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {linkedClasses.map(clase => (
                                                                <li key={clase.id} onClick={() => onEditClase(clase)} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-indigo-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                                                                    <span className="text-slate-200 font-medium">{new Date(clase.fecha).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                                                    <span className="text-xs text-slate-500 group-hover:text-slate-300 truncate max-w-[150px] transition-colors">{clase.objetivo}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-slate-500 text-sm italic">No hay clases planificadas para esta unidad.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <UnitModal isOpen={unitModalOpen} onClose={handleCloseModal} userId={userId} unitToEdit={unitToEdit} selectedYear={selectedYear} selectedWeek={selectedWeek} schedules={schedules} />
        </main>
    );
};

export default UnitsView;
