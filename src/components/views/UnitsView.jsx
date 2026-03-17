import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, ChevronDown, List as ListIcon, Calendar as TimelineIcon, FileDown, FileText, Sparkles, ClipboardCheck, Check } from 'lucide-react';
import UnitModal from '@/components/modals/UnitModal';
import YearlyUnitGeneratorModal from '@/components/modals/YearlyUnitGeneratorModal';
import EvaluationGeneratorModal from '@/components/modals/EvaluationGeneratorModal';
import TimelineView from './TimelineView';
import { generateAnnualPlanPDF } from '@/utils/annualPlanPdf';
import { generateAnnualPlanWord } from '@/utils/annualPlanWord';
import { User } from 'lucide-react';
import { useUI } from '@/context/UIContext'; // Import Context
import { CURSO_COLORES } from '@/constants';

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
    const [yearlyModalOpen, setYearlyModalOpen] = useState(false);
    const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
    const [evalContext, setEvalContext] = useState({ curso: '', asignatura: '', oa: '', detalles: [], selectedClassesData: null });

    // --- NUEVO: ESTADOS DE SELECCIÓN DE CLASES (SECUENCIA) ---
    const [selectingClassesForUnit, setSelectingClassesForUnit] = useState(null); // Guarda el ID de la unidad en modo selección
    const [selectedClasses, setSelectedClasses] = useState([]); // Arreglo de IDs de clases seleccionadas

    const [unitToEdit, setUnitToEdit] = useState(null);
    const [expandedUnitId, setExpandedUnitId] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // Default to list for easy access
    const [teacherName, setTeacherName] = useState('');
    const [expandedCourses, setExpandedCourses] = useState({});
    const displayYear = validYear || schedules?.[0]?.validYear || new Date().getFullYear();

    // Helper: Fuzzy Color Lookup for Course Letters
    const getColorForCourse = (courseName) => {
        if (!courseName) return 'bg-slate-600';
        // 1. Try exact match (e.g. "8vo Básico" or "2do Básico A")
        if (CURSO_COLORES[courseName]) return CURSO_COLORES[courseName];

        // 2. Try stripping suffix (e.g. "7mo Básico A" -> "7mo Básico")
        const parts = courseName.split(' ');
        if (parts.length >= 2 && parts[parts.length - 1].length === 1) {
            const baseName = parts.slice(0, -1).join(' ');
            if (CURSO_COLORES[baseName]) return CURSO_COLORES[baseName];
        }

        // 3. Fallback to generic colors if it has a letter but base isn't found
        return 'bg-slate-600';
    };

    const toggleCourse = (courseKey) => {
        setExpandedCourses(prev => ({
            ...prev,
            [courseKey]: !prev[courseKey]
        }));
    };

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

    const handleExportPDF = (group) => {
        if (!validateName()) return;
        generateAnnualPlanPDF(group.curso, group.asignatura, teacherName, selectedYear, group.items, group.levels);
    };

    const handleExportWord = (group) => {
        if (!validateName()) return;
        generateAnnualPlanWord(group.curso, group.asignatura, teacherName, selectedYear, group.items, group.levels);
    };

    const unitsByCourse = useMemo(() => {
        return units.reduce((acc, unit) => {
            // Include levels in the key to separate groups (e.g. for Workshops)
            const levelsPart = unit.levels ? ` (${unit.levels})` : '';
            const key = `${unit.curso} - ${unit.asignatura}${levelsPart}`;
            
            if (!acc[key]) {
                acc[key] = { 
                    items: [], 
                    curso: unit.curso, 
                    asignatura: unit.asignatura, 
                    levels: unit.levels || '' 
                };
            }
            acc[key].items.push(unit);
            return acc;
        }, {});
    }, [units]);

    // ... inside render ...
    return (
        <main className="p-4 md:p-8">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gestión de Unidades</h2>

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
                <div className="bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 flex flex-shrink-0">
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

                <div className="flex gap-2">
                    <button onClick={() => setYearlyModalOpen(true)} className="btn-secondary px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 text-sm sm:text-base font-bold whitespace-nowrap bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors hidden md:flex">
                        <Sparkles size={18} /> <span>Sincronizar NotebookLM</span>
                    </button>
                    <button onClick={() => setYearlyModalOpen(true)} className="btn-secondary px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors md:hidden" title="Sincronizar NotebookLM">
                        <Sparkles size={18} />
                    </button>
                    <button onClick={() => handleOpenModal()} className="btn-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 text-sm sm:text-base font-bold whitespace-nowrap">
                        <Plus size={18} /> <span className="hidden sm:inline">Crear Unidad</span>
                        <span className="sm:hidden">Crear</span>
                    </button>
                </div>
            </div>

            {viewMode === 'timeline' ? (
                <TimelineView units={units} onEditUnit={handleOpenModal} selectedYear={selectedYear} />
            ) : (
                <div className="space-y-8">
                    {Object.keys(unitsByCourse).sort().map(courseKey => {
                        const group = unitsByCourse[courseKey];
                        const courseColorBg = getColorForCourse(group.curso);

                        return (
                            <div key={courseKey}>
                                <div
                                    className={`flex justify-between items-center mb-4 pb-2 pl-3 rounded-l-lg border-l-8 cursor-pointer hover:bg-slate-800/50 transition-colors relative overflow-hidden`}
                                    style={{ borderColor: 'transparent' }}
                                    onClick={() => toggleCourse(courseKey)}
                                >
                                    {/* Colored Left Bar using the same classes */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${courseColorBg}`}></div>
                                    <div className="flex items-center gap-3">
                                        <ChevronDown
                                            className={`transition-transform duration-300 ${expandedCourses[courseKey] ? 'rotate-180' : '-rotate-90'} text-slate-400`}
                                            size={20}
                                        />
                                        <h3 className="text-2xl font-semibold text-slate-200 flex items-center gap-3">
                                            {group.curso} - {group.asignatura}
                                            {group.levels && (
                                                <span className="text-sm font-normal text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                                                    {group.levels}
                                                </span>
                                            )}
                                        </h3>
                                    </div>
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleExportPDF(group)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-sm transition-colors border border-slate-700"
                                            title="Exportar a PDF"
                                        >
                                            <FileDown size={16} /> PDF
                                        </button>
                                        <button
                                            onClick={() => handleExportWord(group)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-sm transition-colors border border-slate-700"
                                            title="Exportar a Word"
                                        >
                                            <FileText size={16} /> Word
                                        </button>
                                    </div>
                                </div>
                                {expandedCourses[courseKey] && (
                                    <div className="space-y-4">
                                        {group.items.sort((a, b) => (a.numero || 999) - (b.numero || 999)).map(unit => {
                                            const isExpanded = expandedUnitId === unit.id;
                                            const oaCodes = extractOACodes(unit.detalles);
                                            const linkedClasses = clases.filter(clase => {
                                                if (!unit.fechaInicio || !unit.fechaTermino) return false;
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
                                                                <h4 className="font-bold text-xl text-slate-100 flex items-center gap-2">
                                                                    <span>{unit.numero ? `Unidad ${unit.numero}: ` : ''}{unit.nombre}</span>
                                                                    {unit.levels && (
                                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                                                                            {unit.levels}
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                <p className="text-sm text-slate-400 mt-1">
                                                                    {unit.fechaInicio && unit.fechaTermino ? (
                                                                        `${new Date(unit.fechaInicio + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} - ${new Date(unit.fechaTermino + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                                                    ) : (
                                                                        <span className="text-amber-400 font-medium">Sin fechas designadas</span>
                                                                    )}
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
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h5 className="font-semibold text-lg text-indigo-300">Objetivos de la Unidad</h5>
                                                                <button onClick={(e) => { e.stopPropagation(); setEvalContext({ curso: unit.curso, asignatura: unit.asignatura, oa: unit.objetivos, detalles: unit.detalles, selectedClassesData: null }); setEvaluationModalOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors">
                                                                    <ClipboardCheck size={14} /> Evaluar Unidad (Global)
                                                                </button>
                                                            </div>
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

                                                            <div className="flex justify-between items-center mb-3 mt-6">
                                                                <h5 className="font-semibold text-lg text-indigo-300">Clases Vinculadas</h5>

                                                                {linkedClasses.length > 0 && (
                                                                    selectingClassesForUnit === unit.id ? (
                                                                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectingClassesForUnit(null);
                                                                                    setSelectedClasses([]);
                                                                                }}
                                                                                className="px-3 py-1 text-xs font-bold rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                                                                                Cancelar
                                                                            </button>
                                                                            <button
                                                                                disabled={selectedClasses.length === 0}
                                                                                onClick={() => {
                                                                                    const fullClassesData = linkedClasses.filter(c => selectedClasses.includes(c.id));
                                                                                    setEvalContext({ curso: unit.curso, asignatura: unit.asignatura, oa: unit.objetivos, detalles: unit.detalles, selectedClassesData: fullClassesData });
                                                                                    setEvaluationModalOpen(true);
                                                                                    setSelectingClassesForUnit(null);
                                                                                    setSelectedClasses([]);
                                                                                }}
                                                                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                                                                <Sparkles size={14} />
                                                                                Secuencia: ({selectedClasses.length})
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setSelectingClassesForUnit(unit.id)}
                                                                            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold transition-colors border border-slate-700/50">
                                                                            <ListIcon size={14} /> Evaluar Secuencia
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>

                                                            {linkedClasses.length > 0 ? (
                                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {linkedClasses.map(clase => {
                                                                        const isSelectMode = selectingClassesForUnit === unit.id;
                                                                        const isSelected = selectedClasses.includes(clase.id);

                                                                        return (
                                                                            <li key={clase.id}
                                                                                onClick={() => {
                                                                                    if (isSelectMode) {
                                                                                        setSelectedClasses(prev =>
                                                                                            isSelected ? prev.filter(id => id !== clase.id) : [...prev, clase.id]
                                                                                        );
                                                                                    } else {
                                                                                        onEditClase(clase);
                                                                                    }
                                                                                }}
                                                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group
                                                                                    ${isSelectMode
                                                                                        ? isSelected ? 'bg-indigo-900/40 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-900/60 border-slate-700/60 opacity-60 hover:opacity-100 hover:border-slate-500'
                                                                                        : 'bg-slate-800/50 border-slate-700/30 hover:border-indigo-500/50 hover:bg-slate-800'
                                                                                    }`}
                                                                            >
                                                                                {isSelectMode && (
                                                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600'}`}>
                                                                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex-1 min-w-0 flex justify-between items-center">
                                                                                    <span className={`font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                                                                                        {new Date(clase.fecha).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                                    </span>
                                                                                    <span className={`text-xs truncate max-w-[150px] transition-colors ${isSelected ? 'text-indigo-300/80' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                                                                        {clase.objetivo}
                                                                                    </span>
                                                                                </div>
                                                                            </li>
                                                                        );
                                                                    })}
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
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
            <UnitModal isOpen={unitModalOpen} onClose={handleCloseModal} userId={userId} unitToEdit={unitToEdit} selectedYear={selectedYear} selectedWeek={selectedWeek} schedules={schedules} units={units} />
            <YearlyUnitGeneratorModal isOpen={yearlyModalOpen} onClose={() => setYearlyModalOpen(false)} userId={userId} selectedYear={selectedYear} schedules={schedules} units={units} />
            <EvaluationGeneratorModal isOpen={evaluationModalOpen} onClose={() => setEvaluationModalOpen(false)} curso={evalContext.curso} asignatura={evalContext.asignatura} oa={evalContext.oa} detalles={evalContext.detalles} selectedClassesData={evalContext.selectedClassesData} />
        </main>
    );
};

export default UnitsView;
