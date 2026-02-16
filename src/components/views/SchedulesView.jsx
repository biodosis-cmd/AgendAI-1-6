import React from 'react';
import { Calendar, Eye, CheckCircle2, FileJson, ArrowRight } from 'lucide-react';
import LicenseManager from '@/components/common/LicenseManager';

const SchedulesView = ({ schedules = [], onEdit, userId }) => {

    const sortedSchedules = schedules;
    const hasSchedules = sortedSchedules.length > 0;
    const activeSchedule = hasSchedules ? sortedSchedules[0] : null;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-compile">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800/50 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        {hasSchedules ? 'Gestión de Horario' : 'Configuración Inicial'}
                    </h1>
                    <p className="text-slate-400 max-w-2xl">
                        {hasSchedules
                            ? 'Tu horario está activo. Puedes actualizarlo cargando una nueva licencia o visualizar la grilla actual.'
                            : 'Para comenzar, importa tu licencia (archivo de configuración) para activar el sistema.'
                        }
                    </p>
                </div>

                {hasSchedules && (
                    <button
                        onClick={() => onEdit(activeSchedule, null, true)}
                        className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <Eye size={18} />
                        <span className="font-medium">Ver Grilla Horaria</span>
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-6 group-hover:ml-0" />
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-8">

                {/* Active Schedule Summary Card */}
                {hasSchedules && (
                    <div className="bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>

                        <div className="flex items-center gap-4 z-10">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Horario Activo
                                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">VIGENTE</span>
                                </h3>
                                <p className="text-slate-400 text-sm mt-1 font-mono">
                                    {activeSchedule?.name || 'Sin Nombre'}
                                </p>
                                {activeSchedule?.validYear && (
                                    <p className="text-slate-500 text-xs mt-1">Año Lectivo: {activeSchedule.validYear}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {/* Actions could go here */}
                        </div>
                    </div>
                )}

                {/* Import Area - Always Visible */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white font-semibold text-lg">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <FileJson size={20} />
                        </div>
                        <h2>{hasSchedules ? 'Actualizar / Reemplazar Licencia' : 'Cargar Licencia Nueva'}</h2>
                    </div>

                    <div className="bg-[#0f1221] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                        <LicenseManager
                            userId={userId}
                            // Hide local header of component to blend better? No, keep it for context.
                            onImportSuccess={() => {
                                // Optional: Feedback handled by LicenseManager alert
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulesView;
