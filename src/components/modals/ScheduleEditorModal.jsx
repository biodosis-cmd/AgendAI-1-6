import React, { useState, useEffect } from 'react';
import { X, Calendar, FileJson, AlertCircle } from 'lucide-react';
import { useData } from '@/context/DataContext';
import ScheduleGrid from '@/components/schedule/ScheduleGrid';
import LicenseManager from '@/components/common/LicenseManager';
import { getSchedule } from '@/services/db';

const ScheduleEditorModal = ({
    isOpen,
    onClose,
    userId,
    scheduleToEdit = null,
    onSave
}) => {
    const { schedules, loading } = useData();
    const [scheduleData, setScheduleData] = useState({});
    const [activeTab, setActiveTab] = useState('view'); // 'view' | 'license'

    // Initialize with existing schedule or empty
    useEffect(() => {
        if (isOpen) {
            if (scheduleToEdit) {
                // If passed directly
                console.log("Loading passed schedule:", scheduleToEdit);
                setScheduleData(scheduleToEdit.scheduleData || {});
                setActiveTab('view');
            } else if (schedules && schedules.length > 0) {
                // Fallback to first schedule in context if available (Auto-load for user)
                console.log("Auto-loading first schedule:", schedules[0]);
                setScheduleData(schedules[0].scheduleData || {});
                setActiveTab('view');
            } else if (!loading) {
                // Only reset if finished loading and nothing found
                setScheduleData({});
                // improved UX: If no schedule, jump to license tab to prompt import
                setActiveTab('license');
            }
        }
    }, [isOpen, scheduleToEdit, schedules, loading]);


    // Transformation: Flatten scheduleData (User's specific schedule) into flatBlocks for the Grid
    // scheduleData format: { "CourseName": { "SubjectName": [ { dia: 1, hora: "08:30", duration: 90 }, ... ] } }
    const flatBlocks = React.useMemo(() => {
        if (!scheduleData || Object.keys(scheduleData).length === 0) return [];

        const blocks = [];
        const PIXELS_PER_MINUTE = 0.9;
        const START_HOUR = 8; // Could be dynamic if needed

        Object.entries(scheduleData).forEach(([courseName, subjects]) => {
            Object.entries(subjects).forEach(([subjectName, classBlocks]) => {
                if (Array.isArray(classBlocks)) {
                    classBlocks.forEach((block, idx) => {
                        // Calculate Position
                        const [h, m] = block.hora.split(':').map(Number);
                        const startMinutes = (h - START_HOUR) * 60 + m;
                        const top = startMinutes * PIXELS_PER_MINUTE;
                        const height = (block.duration || 90) * PIXELS_PER_MINUTE;

                        blocks.push({
                            id: `${courseName}-${subjectName}-${block.dia}-${idx}-${Date.now()}`, // Unique ID
                            dia: block.dia, // 1-5
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

        console.log("Blocks flat transformed:", blocks);
        return blocks;
    }, [scheduleData]);

    if (!isOpen) return null;

    const handleLicenseImported = async () => {
        // Try to reload the schedule data from the freshly updated context
        const updatedSchedules = await getSchedule(userId);
        if (updatedSchedules && updatedSchedules.length > 0) {
            setScheduleData(updatedSchedules[0].scheduleData || {});
        }
        setActiveTab('view');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-[#0f1221] rounded-2xl w-full max-w-7xl text-slate-100 flex flex-col h-[95vh] border border-slate-700/50 shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex-none z-20 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Calendar className="text-indigo-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Mi Horario</h2>
                                <p className="text-slate-400 text-sm">Visualiza tu carga horaria y bloques asignados</p>
                            </div>
                        </div>

                        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('view')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'view' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Ver Horario
                            </button>
                            <button
                                onClick={() => setActiveTab('license')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'license' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <FileJson size={16} />
                                Cargar Licencia
                            </button>
                        </div>

                        <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4 relative">
                    {activeTab === 'view' ? (
                        Object.keys(scheduleData).length > 0 ? (
                            <div className="h-full flex flex-col">
                                <ScheduleGrid
                                    flatBlocks={flatBlocks}
                                    onCellClick={() => { }} // No-op
                                    onDeleteBlock={() => { }} // No-op
                                    readOnly={true} // ALWAYS READ ONLY
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                                <AlertCircle size={48} className="text-slate-600" />
                                <p className="text-lg font-medium">No hay horario cargado</p>
                                <p className="text-sm max-w-md text-center">Importa una licencia válida que contenga tu estructura horaria para comenzar.</p>
                                <button
                                    onClick={() => setActiveTab('license')}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Cargar Licencia
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="max-w-xl mx-auto mt-10">
                            <LicenseManager
                                userId={userId}
                                onImportSuccess={handleLicenseImported}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleEditorModal;
