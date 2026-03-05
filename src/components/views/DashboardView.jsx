import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Target, BookOpen, Clock, Activity, AlertCircle, Check } from 'lucide-react';

const COLORS = ['#6366f1', '#334155']; // Indigo for reached, Slate for remaining
const BAR_COLORS = ['#10b981', '#ef4444']; // Green for executed, Red for not executed

const extractOAsFromString = (text) => {
    if (!text) return [];
    // Catch "OA 1", "OA1", "oa 12", etc.
    const matches = text.match(/OA\s*\d+/gi);
    return matches ? matches.map(m => m.toUpperCase().replace(/\s+/, ' ')) : [];
};

const sortOAs = (a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
};

const DashboardView = ({ clases, units, selectedYear, userId }) => {
    const [filtroCurso, setFiltroCurso] = useState('');
    const [filtroAsignatura, setFiltroAsignatura] = useState('');

    const clasesDelAno = useMemo(() => {
        return clases.filter(c => new Date(c.fecha).getFullYear() === parseInt(selectedYear));
    }, [clases, selectedYear]);

    const unitsDelAno = useMemo(() => {
        return units.filter(u => !u.fechaInicio || new Date(u.fechaInicio).getFullYear() === parseInt(selectedYear));
    }, [units, selectedYear]);

    const cursosDisponibles = useMemo(() => [...new Set(clasesDelAno.map(c => c.curso))].sort(), [clasesDelAno]);

    const asignaturasDisponibles = useMemo(() => {
        if (!filtroCurso) return [...new Set(clasesDelAno.map(c => c.asignatura))].sort();
        return [...new Set(clasesDelAno.filter(c => c.curso === filtroCurso).map(c => c.asignatura))].sort();
    }, [clasesDelAno, filtroCurso]);

    const metrics = useMemo(() => {
        // Filter classes and units based on selection
        const filteredClasses = clasesDelAno.filter(c =>
            (!filtroCurso || c.curso === filtroCurso) &&
            (!filtroAsignatura || c.asignatura === filtroAsignatura)
        );

        const filteredUnits = unitsDelAno.filter(u =>
            (!filtroCurso || u.curso === filtroCurso) &&
            (!filtroAsignatura || u.asignatura === filtroAsignatura)
        );

        // 1. Calculate OAs from Units (The 100% Goal)
        let totalOas = new Set();
        filteredUnits.forEach(unit => {
            // Extract from unit details
            if (unit.detalles) {
                unit.detalles.forEach(d => {
                    extractOAsFromString(d.oa).forEach(oa => totalOas.add(oa));
                });
            }
            // Extract from unit general description if any
            extractOAsFromString(unit.objetivos).forEach(oa => totalOas.add(oa));
        });

        // 2. Calculate OAs Covered in EXECUTED classes
        let coveredOas = new Set();
        const executedClasses = filteredClasses.filter(c => c.ejecutada !== false);
        const suspendedClasses = filteredClasses.filter(c => c.ejecutada === false);

        executedClasses.forEach(c => {
            extractOAsFromString(c.objetivo).forEach(oa => {
                // Only count it if it's actually part of the expected total OAs for this context
                if (totalOas.has(oa) || true) { // We count all unique OAs declared in classes, just in case
                    coveredOas.add(oa);
                }
            });
        });

        // Unique counts
        const expectedCount = totalOas.size;
        const coveredCount = coveredOas.size;
        let percentage = expectedCount === 0 ? 0 : Math.round((coveredCount / expectedCount) * 100);
        if (percentage > 100) percentage = 100;

        const coveredOasList = Array.from(coveredOas).sort(sortOAs);
        const pendingOasList = Array.from(totalOas).filter(oa => !coveredOas.has(oa)).sort(sortOAs);

        // Chart Data for Donut
        const coverageData = [
            { name: 'OAs Cubiertos', value: coveredCount },
            { name: 'OAs Pendientes', value: Math.max(expectedCount - coveredCount, 0) }
        ];

        // Chart Data for Bar
        const classesData = [
            { name: 'Clases Planeadas', Ejecutadas: executedClasses.length, Suspendidas: suspendedClasses.length }
        ];

        return {
            expectedCount,
            coveredCount,
            percentage,
            coverageData,
            classesData,
            totalPlanificadas: filteredClasses.length,
            totalEjecutadas: executedClasses.length,
            totalUnidades: filteredUnits.length,
            uncoveredCount: Math.max(expectedCount - coveredCount, 0),
            coveredOasList,
            pendingOasList
        };
    }, [clasesDelAno, unitsDelAno, filtroCurso, filtroAsignatura]);


    return (
        <div className="p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-indigo-400" /> Dashboard Curricular
                    </h2>
                    <p className="text-slate-400 mt-1">Analítica de progreso anual y cobertura según lo planificado.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                <select
                    value={filtroCurso}
                    onChange={e => { setFiltroCurso(e.target.value); setFiltroAsignatura(''); }}
                    className="p-3 w-full md:w-auto rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:border-indigo-500 outline-none transition-colors"
                >
                    <option value="">Selecciona Curso (Recomendado)</option>
                    {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                    value={filtroAsignatura}
                    onChange={e => setFiltroAsignatura(e.target.value)}
                    disabled={!filtroCurso}
                    className="p-3 w-full md:w-auto rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
                >
                    <option value="">Selecciona Asignatura</option>
                    {asignaturasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>

            {/* Require Filters for full accuracy warning */}
            {(!filtroCurso || !filtroAsignatura) && (
                <div className="mb-6 bg-amber-900/20 border border-amber-500/30 text-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-lg">
                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                    <div className="text-sm">
                        <p className="font-bold mb-1">Aviso de Precisión Estadística</p>
                        <p>Para obtener un <strong>Porcentaje de Cobertura exacto</strong>, filtra por un Curso y una Asignatura a la vez. Actualmente estás visualizando una mezcla global de OAs que podría distorsionar la matemática y mostrar un total erróneo.</p>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800 border border-slate-700/50 p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:border-indigo-500/50 transition-colors group">
                    <div className="bg-indigo-500/10 p-3 rounded-full text-indigo-400 group-hover:scale-110 transition-transform">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">OAs Meta (Unidades)</p>
                        <h3 className="text-2xl font-bold text-white">{metrics.expectedCount}</h3>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700/50 p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:border-emerald-500/50 transition-colors group">
                    <div className="bg-emerald-500/10 p-3 rounded-full text-emerald-400 group-hover:scale-110 transition-transform">
                        <Check size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">OAs Abordados</p>
                        <h3 className="text-2xl font-bold text-white">{metrics.coveredCount}</h3>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700/50 p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:border-amber-500/50 transition-colors group">
                    <div className="bg-amber-500/10 p-3 rounded-full text-amber-400 group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Clases Realizadas</p>
                        <h3 className="text-2xl font-bold text-white">{metrics.totalEjecutadas} <span className="text-sm text-slate-500 font-normal">de {metrics.totalPlanificadas}</span></h3>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700/50 p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:border-sky-500/50 transition-colors group">
                    <div className="bg-sky-500/10 p-3 rounded-full text-sky-400 group-hover:scale-110 transition-transform">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Unidades Anuales</p>
                        <h3 className="text-2xl font-bold text-white">{metrics.totalUnidades}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Donut Chart: Cobertura */}
                <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col items-center">
                    <h3 className="text-lg font-bold text-white mb-6 self-start w-full border-b border-slate-700/50 pb-3">Avance Curricular Estimado ({selectedYear})</h3>

                    {metrics.expectedCount === 0 && metrics.coveredCount === 0 ? (
                        <div className="flex-1 flex items-center justify-center min-h-[300px] text-slate-500 italic pb-8 text-sm">
                            No logramos identificar OAs (ej. "OA 1") en tus unidades de este año.
                        </div>
                    ) : (
                        <div className="relative w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metrics.coverageData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="transparent"
                                    >
                                        {metrics.coverageData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                        formatter={(value, name) => [`${value} OAs`, name.toUpperCase()]}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Inner Percentage Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-8">
                                <span className={`text-4xl font-black ${metrics.percentage >= 80 ? 'text-emerald-400' : metrics.percentage >= 50 ? 'text-amber-400' : 'text-white'}`}>
                                    {metrics.percentage}%
                                </span>
                                <span className="text-xs text-slate-400 font-medium tracking-wide mt-1">COBERTURA</span>
                            </div>
                        </div>
                    )}

                    {/* Lists of OAs */}
                    {(metrics.expectedCount > 0 || metrics.coveredCount > 0) && (
                        <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-emerald-500/20 h-48 overflow-y-auto custom-scrollbar">
                                <h4 className="text-emerald-400 font-medium mb-3 flex items-center gap-2 text-sm sticky top-0 bg-slate-900/90 py-1 z-10 backdrop-blur-sm">
                                    <Check size={16} /> Abordados ({metrics.coveredOasList.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {metrics.coveredOasList.length > 0 ? metrics.coveredOasList.map(oa => (
                                        <span key={oa} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 text-xs rounded-md border border-emerald-500/20 font-medium">
                                            {oa}
                                        </span>
                                    )) : <span className="text-slate-500 text-xs italic">Ninguno registrado</span>}
                                </div>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-rose-500/20 h-48 overflow-y-auto custom-scrollbar">
                                <h4 className="text-rose-400 font-medium mb-3 flex items-center gap-2 text-sm sticky top-0 bg-slate-900/90 py-1 z-10 backdrop-blur-sm">
                                    <Target size={16} /> Pendientes ({metrics.pendingOasList.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {metrics.pendingOasList.length > 0 ? metrics.pendingOasList.map(oa => (
                                        <span key={oa} className="px-2 py-1 bg-rose-500/10 text-rose-300 text-xs rounded-md border border-rose-500/20 font-medium">
                                            {oa}
                                        </span>
                                    )) : <span className="text-slate-500 text-xs italic">Ninguno pendiente</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bar Chart: Clases */}
                <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col items-center">
                    <h3 className="text-lg font-bold text-white mb-6 self-start w-full border-b border-slate-700/50 pb-3">Estado de Clases Planificadas ({selectedYear})</h3>

                    {metrics.totalPlanificadas === 0 ? (
                        <div className="flex-1 flex items-center justify-center min-h-[300px] text-slate-500 italic pb-8 text-sm">
                            No hay clases registradas para este periodo y combinación.
                        </div>
                    ) : (
                        <div className="w-full h-[300px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={metrics.classesData}
                                    margin={{ top: 10, right: 30, left: -20, bottom: 25 }}
                                    barSize={80}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Ejecutadas" stackId="a" fill={BAR_COLORS[0]} radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="Suspendidas" stackId="a" fill={BAR_COLORS[1]} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DashboardView;
