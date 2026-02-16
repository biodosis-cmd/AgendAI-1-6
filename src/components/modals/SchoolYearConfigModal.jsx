import React, { useState, useEffect } from 'react';
import { Save, Plus, X, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { getSchoolYearConfig, saveSchoolYearConfig } from '@/services/db';

const SchoolYearConfigModal = ({ isOpen, onClose, year = new Date().getFullYear(), userId }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState({
        year: year,
        schoolYearStart: `${year}-03-01`,
        schoolYearEnd: `${year}-12-15`,
        excludedDates: []
    });

    // Load existing config on mount
    useEffect(() => {
        const loadConfig = async () => {
            if (!isOpen) return;
            setIsLoading(true);
            try {
                const existing = await getSchoolYearConfig(userId, year);
                if (existing) {
                    setConfig(existing);
                } else {
                    // Default initialization
                    setConfig({
                        year: year,
                        schoolYearStart: `${year}-03-01`,
                        schoolYearEnd: `${year}-12-15`,
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
    }, [isOpen, year, userId]);

    const handleSave = async () => {
        try {
            // Ensure userId is attached
            const configToSave = { ...config, userId };
            await saveSchoolYearConfig(configToSave);
            onClose();
            // Optional: Trigger a toast or global refresh if needed
        } catch (e) {
            alert("Error al guardar la configuración");
        }
    };

    const addExclusion = () => {
        setConfig(prev => ({
            ...prev,
            excludedDates: [
                ...prev.excludedDates,
                { id: Date.now(), title: 'Nuevo Feriado', start: `${year}-01-01`, end: `${year}-01-01` }
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-indigo-400" />
                        Configuración Año Escolar {year}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">

                    {isLoading ? (
                        <div className="text-center py-10 text-slate-500">Cargando configuración...</div>
                    ) : (
                        <>
                            {/* Section 1: School Year Limits */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    Límites del Año Escolar
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-300 font-medium">Inicio de Clases</label>
                                        <input
                                            type="date"
                                            value={config.schoolYearStart}
                                            onChange={(e) => setConfig({ ...config, schoolYearStart: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-300 font-medium">Término de Clases</label>
                                        <input
                                            type="date"
                                            value={config.schoolYearEnd}
                                            onChange={(e) => setConfig({ ...config, schoolYearEnd: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <p className="col-span-1 md:col-span-2 text-xs text-slate-500 flex items-center gap-2">
                                        <AlertTriangle size={12} className="text-amber-500/50" />
                                        El generador de clases ignorará cualquier fecha fuera de este rango.
                                    </p>
                                </div>
                            </div>

                            {/* Section 2: Excluded Dates */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        Días Sin Clases / Feriados
                                    </h4>
                                    <button
                                        onClick={addExclusion}
                                        className="text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1 border border-indigo-500/20"
                                    >
                                        <Plus size={14} /> Añadir Feriado/Rango
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {config.excludedDates.length === 0 && (
                                        <div className="text-center py-6 text-slate-600 italic bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
                                            No hay días libres configurados.
                                        </div>
                                    )}

                                    {config.excludedDates.map((ex) => (
                                        <div key={ex.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-start md:items-end animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex-1 w-full space-y-1">
                                                <label className="text-xs text-slate-500">Descripción</label>
                                                <input
                                                    type="text"
                                                    value={ex.title}
                                                    onChange={(e) => updateExclusion(ex.id, 'title', e.target.value)}
                                                    placeholder="Ej: Fiestas Patrias"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-500">Desde</label>
                                                <input
                                                    type="date"
                                                    value={ex.start}
                                                    onChange={(e) => updateExclusion(ex.id, 'start', e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-500">Hasta</label>
                                                <input
                                                    type="date"
                                                    value={ex.end}
                                                    onChange={(e) => updateExclusion(ex.id, 'end', e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeExclusion(ex.id)}
                                                className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mb-0.5"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="btn-primary px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Save size={16} /> Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SchoolYearConfigModal;
