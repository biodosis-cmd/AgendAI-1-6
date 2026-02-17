import React, { useState, useMemo } from 'react';
import { Calendar, FileJson, AlertCircle, Plus, Eye } from 'lucide-react';
import ScheduleGrid from '@/components/schedule/ScheduleGrid';
import ImportLicenseModal from '@/components/modals/ImportLicenseModal';

const SchedulesView = ({ schedules = [], onEdit, userId, onRefresh }) => {

    const sortedSchedules = schedules;
    const hasSchedules = sortedSchedules.length > 0;
    const activeSchedule = hasSchedules ? sortedSchedules[0] : null;

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Transformation: Flatten scheduleData into flatBlocks for the Grid
    const flatBlocks = useMemo(() => {
        if (!activeSchedule || !activeSchedule.scheduleData || Object.keys(activeSchedule.scheduleData).length === 0) return [];

        const blocks = [];
        const PIXELS_PER_MINUTE = 0.9;
        const START_HOUR = 8;

        Object.entries(activeSchedule.scheduleData).forEach(([courseName, subjects]) => {
            Object.entries(subjects).forEach(([subjectName, classBlocks]) => {
                if (Array.isArray(classBlocks)) {
                    classBlocks.forEach((block, idx) => {
                        const [h, m] = block.hora.split(':').map(Number);
                        const startMinutes = (h - START_HOUR) * 60 + m;
                        const top = startMinutes * PIXELS_PER_MINUTE;
                        const height = (block.duration || 90) * PIXELS_PER_MINUTE;

                        blocks.push({
                            id: `${courseName}-${subjectName}-${block.dia}-${idx}-${Date.now()}`,
                            dia: block.dia,
                            hora: block.hora,
                            duration: block.duration,
                            curso: courseName,
                            asignatura: subjectName,
                            top,
                            height
                        });
                    });
                }
            });
        });
        return blocks;
    }, [activeSchedule]);

    const handleSuccess = () => {
        // Refresh handled by context/modal logic mostly, but we can trigger a reload if needed
        // Assuming schedules prop will update automatically via parent re-render
        if (onRefresh) onRefresh();
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-compile h-full flex flex-col">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800/50 pb-6 flex-none">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        Mi Horario
                    </h1>
                    <p className="text-slate-400 max-w-2xl">
                        {hasSchedules
                            ? `Visualizando horario activo: ${activeSchedule.name}`
                            : 'No hay horario cargado. Importa una licencia para visualizar la grilla.'
                        }
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <FileJson size={18} />
                        <span className="font-medium">{hasSchedules ? 'Actualizar Licencia' : 'Importar Licencia'}</span>
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 bg-[#0f1221] rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative min-h-[600px]">
                {hasSchedules ? (
                    <div className="h-full overflow-y-auto custom-scrollbar p-1">
                        <ScheduleGrid
                            flatBlocks={flatBlocks}
                            readOnly={true}
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-6">
                        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center">
                            <Calendar size={48} className="text-slate-600 opacity-50" />
                        </div>
                        <div className="text-center max-w-md px-4">
                            <h3 className="text-xl font-bold text-slate-300 mb-2">Espacio Vacío</h3>
                            <p className="text-slate-500">
                                Aún no has cargado un horario. Utiliza el botón "Importar Licencia" para configurar tu estructura de clases.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl transition-colors border border-slate-700/50 hover:border-indigo-500/30"
                        >
                            <Plus size={18} />
                            <span>Cargar Ahora</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ImportLicenseModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                userId={userId}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default SchedulesView;
