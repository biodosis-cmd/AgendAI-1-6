import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { getSchoolYearConfig, saveSchoolYearConfig } from '@/services/db';
import { useUI } from '@/context/UIContext';

const ConfigView = ({ userId, selectedYear }) => {
    const { actions } = useUI();
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState({
        year: selectedYear,
        schoolYearStart: `${selectedYear}-03-01`,
        schoolYearEnd: `${selectedYear}-12-15`,
        excludedDates: []
    });

    // Load existing config on mount
    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true);
            try {
                const existing = await getSchoolYearConfig(userId, selectedYear);
                if (existing) {
                    setConfig(existing);
                } else {
                    // Default initialization
                    setConfig({
                        year: selectedYear,
                        schoolYearStart: `${selectedYear}-03-01`,
                        schoolYearEnd: `${selectedYear}-12-15`,
                        excludedDates: []
                    });
                }
            } catch (e) {
                console.error("Error loading config", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, [selectedYear, userId]);

    const handleSave = async () => {
        try {
            // Ensure userId is attached
            const configToSave = { ...config, userId };
            await saveSchoolYearConfig(configToSave);
            // Trigger refresh or notification if needed
            alert("Configuración guardada correctamente");
        } catch (e) {
            alert("Error al guardar la configuración");
        }
    };

    const addExclusion = () => {
        setConfig(prev => ({
            ...prev,
            excludedDates: [
                ...prev.excludedDates,
                { id: Date.now(), title: 'Nuevo Feriado', start: `${selectedYear}-01-01`, end: `${selectedYear}-01-01` }
            ]
        }));
    };

    const removeExclusion = (id) => {
        setConfig(prev => ({
            ...prev,
            excludedDates: prev.excludedDates.filter(ex => ex.id !== id)
        }));
    };

    const updateExclusion = (id, field, value) => {
        setConfig(prev => ({
            ...prev,
            excludedDates: prev.excludedDates.map(ex => ex.id === id ? { ...ex, [field]: value } : ex)
        }));
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <SettingsIcon /> Configuración Año Escolar {selectedYear}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Define las fechas claves y feriados para la generación automática de clases.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="btn-primary px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-slate-500 animate-pulse">Cargando configuración...</div>
                </div>
            ) : (
                <div className="flex flex-col gap-8">

                    {/* Section 1: School Year Limits */}
                    <div className="space-y-4">
                        <SectionHeader title="Límites del Año Escolar" color="bg-indigo-500" />

                        <div className="card-glass p-6 rounded-2xl border border-slate-700/50 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-300 font-medium">Inicio de Clases</label>
                                    <input
                                        type="date"
                                        value={config.schoolYearStart}
                                        onChange={(e) => setConfig({ ...config, schoolYearStart: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-300 font-medium">Término de Clases</label>
                                    <input
                                        type="date"
                                        value={config.schoolYearEnd}
                                        onChange={(e) => setConfig({ ...config, schoolYearEnd: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 flex gap-3 items-start">
                                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-200/80 leading-relaxed">
                                    El generador de clases utilizará estas fechas como límites estrictos. Cualquier clase planificada fuera de este rango será ignorada o marcada como inválida.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Excluded Dates */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <SectionHeader title="Días Sin Clases / Feriados" color="bg-rose-500" />
                            <button
                                onClick={addExclusion}
                                className="text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1 border border-indigo-500/20"
                            >
                                <Plus size={14} /> Añadir Feriado
                            </button>
                        </div>

                        <div className="card-glass p-1 rounded-2xl border border-slate-700/50 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
                            {config.excludedDates.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500 gap-3 opacity-60">
                                    <Calendar size={48} className="text-slate-700" />
                                    <span className="text-sm italic">No hay días libres configurados</span>
                                </div>
                            )}

                            <div className="space-y-2 p-3">
                                {config.excludedDates.map((ex) => (
                                    <div key={ex.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 hovered:border-slate-600 transition-all group flex flex-col md:flex-row gap-4 items-start md:items-center">
                                        <div className="flex-1 w-full space-y-1">
                                            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Descripción</label>
                                            <input
                                                type="text"
                                                value={ex.title}
                                                onChange={(e) => updateExclusion(ex.id, 'title', e.target.value)}
                                                className="w-full bg-transparent border-none p-0 text-sm text-slate-200 font-medium focus:text-white focus:ring-0 placeholder:text-slate-600"
                                                placeholder="Nombre del feriado..."
                                            />
                                        </div>

                                        <div className="flex gap-2 w-full md:w-auto">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Desde</label>
                                                <input
                                                    type="date"
                                                    value={ex.start}
                                                    onChange={(e) => updateExclusion(ex.id, 'start', e.target.value)}
                                                    className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-1.5 text-xs text-slate-300 focus:border-indigo-500 outline-none w-32"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Hasta</label>
                                                <input
                                                    type="date"
                                                    value={ex.end}
                                                    onChange={(e) => updateExclusion(ex.id, 'end', e.target.value)}
                                                    className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-1.5 text-xs text-slate-300 focus:border-indigo-500 outline-none w-32"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeExclusion(ex.id)}
                                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionHeader = ({ title, color }) => (
    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        {title}
    </h4>
);

// Simple Settings Icon wrapper since lucide-react might not have it exported as SettingsIcon directly in all versions, 
// ensuring we use the imported { Settings } properly or creating a visual fallback.
// But we have Settings imported in Sidebar, so let's import it here too or just use a placeholder
import { Settings as SettingsIcon } from 'lucide-react';

export default ConfigView;
