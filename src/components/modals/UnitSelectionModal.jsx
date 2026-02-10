import React, { useState, useMemo } from 'react';
import { X, BookOpen, ChevronRight, Calendar, Search, ChevronDown } from 'lucide-react';

const UnitSelectionModal = ({ isOpen, onClose, units = [], onSelectUnit, selectedYear }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Extract Unique Options
    const { allCourses, allSubjects } = useMemo(() => {
        const courses = new Set();
        const subjects = new Set();
        units.forEach(u => {
            // Pre-filter options by year to avoid showing options for hidden units
            if (new Date(u.fechaInicio).getFullYear() === selectedYear) {
                if (u.curso) courses.add(u.curso);
                if (u.asignatura) subjects.add(u.asignatura);
            }
        });

        // Sort courses logically (simple alpha for now, or use custom sort if imported)
        const sortedCourses = Array.from(courses).sort();
        const sortedSubjects = Array.from(subjects).sort();

        return { allCourses: sortedCourses, allSubjects: sortedSubjects };
    }, [units, selectedYear]);


    const filteredUnits = useMemo(() => {
        return units.filter(u => {
            // 0. Year Filter (Strictly enforce selectedYear)
            const unitYear = new Date(u.fechaInicio).getFullYear();
            const matchesYear = selectedYear ? unitYear === selectedYear : true;

            // 1. Text Search
            const matchesSearch = !searchTerm ||
                u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.numero.toString().includes(searchTerm);

            // 2. Course Filter
            const matchesCourse = !selectedCourse || u.curso === selectedCourse;

            // 3. Subject Filter
            const matchesSubject = !selectedSubject || u.asignatura === selectedSubject;

            return matchesSearch && matchesCourse && matchesSubject && matchesYear;
        });
    }, [units, searchTerm, selectedCourse, selectedSubject, selectedYear]);

    // Group by Course (or Month? Course is redundant if filtered, but good for "All")
    const unitsByCourse = useMemo(() => {
        const groups = {};
        filteredUnits.forEach(u => {
            if (!groups[u.curso]) groups[u.curso] = [];
            groups[u.curso].push(u);
        });
        return groups;
    }, [filteredUnits]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="card-glass rounded-2xl p-6 w-full max-w-3xl text-slate-100 flex flex-col max-h-[85vh] shadow-2xl border border-slate-700/50 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
                    <div>
                        <h3 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
                            <BookOpen className="text-indigo-400" /> Planificar desde Unidad
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">Busca tu unidad de <span className="text-indigo-300 font-bold">{selectedYear}</span> y te llevaremos a la semana correcta.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* FILTERS & SEARCH */}
                <div className="mb-6 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Course Filter */}
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none text-slate-300"
                        >
                            <option value="">Todos los Cursos</option>
                            {allCourses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* Subject Filter */}
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700 rounded-xl p-2.5 text-sm focus:border-indigo-500 outline-none text-slate-300"
                        >
                            <option value="">Todas las Asignaturas</option>
                            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre de unidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    {(!selectedCourse || !selectedSubject) ? (
                        <div className="text-center py-20 text-slate-500 animate-in fade-in duration-500">
                            <BookOpen size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-lg font-medium text-slate-400">Selecciona Curso y Asignatura</p>
                            <p className="text-sm mt-2 opacity-60">Para ver las unidades disponibles, primero debes filtrar.</p>
                        </div>
                    ) : Object.keys(unitsByCourse).length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No se encontraron unidades con estos filtros.</p>
                        </div>
                    ) : (
                        Object.entries(unitsByCourse).sort().map(([curso, courseUnits]) => (
                            <div key={curso} className="space-y-3">
                                {/* Only show course header if filter is NOT active (otherwise redundant) */}
                                {!selectedCourse && (
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 sticky top-0 bg-slate-800/90 backdrop-blur py-2 px-1 z-10 border-b border-slate-700/50 mb-2">
                                        {curso}
                                    </h4>
                                )}
                                <div className="grid gap-3">
                                    {courseUnits.sort((a, b) => a.numero - b.numero).map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => onSelectUnit(u)}
                                            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group text-left w-full hover:shadow-lg hover:shadow-indigo-500/10"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-indigo-500/10 text-indigo-300 text-xs font-bold px-2 py-0.5 rounded border border-indigo-500/20">
                                                        Unidad {u.numero}
                                                    </span>
                                                    <span className="text-slate-400 text-xs flex items-center gap-1">
                                                        <Calendar size={12} /> {u.fechaInicio ? new Date(u.fechaInicio).toLocaleDateString() : 'Sin fecha'}
                                                    </span>
                                                </div>
                                                <h5 className="font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                                                    {u.nombre}
                                                </h5>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                    {u.asignatura}
                                                </p>
                                            </div>
                                            <div className="bg-slate-900 p-2 rounded-full text-slate-600 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                                                <ChevronRight size={18} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnitSelectionModal;
