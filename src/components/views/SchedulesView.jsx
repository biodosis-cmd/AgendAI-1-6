import React, { useState } from 'react';
import { Calendar, Plus, Eye, Trash2, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

const SchedulesView = ({ schedules = [], onEdit, onDelete, onCreate, onBack }) => {

    // Sort schedules: Default order (should be only one)
    const sortedSchedules = schedules;
    const today = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const hasSchedules = sortedSchedules.length > 0;

    const ScheduleCard = ({ schedule }) => {
        return (
            <div className="group relative bg-[#1e293b]/50 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-5 hover:bg-slate-800/60 transition-all hover:-translate-y-1 shadow-lg shadow-black/20 overflow-hidden ring-1 ring-indigo-500/20">
                <div className="absolute top-4 right-4">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle2 size={10} /> Activo
                    </span>
                </div>

                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-indigo-500/20 text-indigo-400 mb-2`}>
                        <Calendar size={24} />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-1">
                    {schedule.name}
                </h3>

                {/* Date Display Removed for Single Schedule Mode */}
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 font-mono bg-slate-900/50 py-1.5 px-3 rounded-lg w-fit">
                    <Clock size={14} className="text-indigo-400" />
                    <span>Horario Principal</span>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                    <button
                        onClick={() => onEdit(schedule, null, true)}
                        className="flex-1 py-2 rounded-lg bg-slate-700/30 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-300 text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <Eye size={14} /> Ver Detalle
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto animate-compile">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Mi Horario
                    </h1>
                    <p className="text-slate-400">
                        Visualiza tu horario escolar vigente. Este horario es gestionado automáticamente por la configuración del sistema.
                    </p>
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!hasSchedules ? (
                    <div className="col-span-full py-20 text-center text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-700/50 border-dashed flex flex-col items-center justify-center gap-4">
                        <Calendar size={48} className="opacity-50" />
                        <p className="text-lg">Cargando horario...</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
                        >
                            <RefreshCw size={16} /> Reintentar Conexión
                        </button>
                    </div>
                ) : (
                    sortedSchedules.map(schedule => <ScheduleCard key={schedule.id} schedule={schedule} />)
                )}
            </div>
        </div>
    );
};

export default SchedulesView;
