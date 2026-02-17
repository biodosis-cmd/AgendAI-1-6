import React, { useMemo, useState, useEffect } from 'react';
import { getStartDateOfWeek } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DIAS_SEMANA, START_HOUR, END_HOUR, PIXELS_PER_MINUTE } from '@/constants';
import ClaseCard from '@/components/common/ClaseCard';
import { getSchoolYearConfig } from '@/services/db';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import MiniCalendar from './MiniCalendar';

const WeeklyView = ({ selectedWeek, selectedYear, clases, onWeekChange, onEdit, onDelete, onExpand, userId, onGoToDate }) => {
    const weekStartDate = getStartDateOfWeek(selectedYear, selectedWeek);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 4);

    const [schoolYearConfig, setSchoolYearConfig] = useState(null);

    const clasesPorDia = useMemo(() => {
        const porDia = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        clases.filter(c => c.semana === selectedWeek).forEach(clase => {
            const dia = new Date(clase.fecha).getDay();
            if (porDia[dia]) porDia[dia].push(clase);
        });
        return porDia;
    }, [clases, selectedWeek]);

    useEffect(() => {
        if (userId && selectedYear) {
            getSchoolYearConfig(userId, selectedYear).then(setConfig => setSchoolYearConfig(setConfig));
        }
    }, [userId, selectedYear]);

    // Current Time Indicator Logic
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // Calculate position for current time indicator (only if within 8:00 - 18:00)
    const getCurrentTimePosition = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        if (hours < START_HOUR || hours > END_HOUR) return null;

        const startMinutes = (hours - START_HOUR) * 60 + minutes;
        return startMinutes * PIXELS_PER_MINUTE; // Same scale as grid
    };

    const timeIndicatorTop = getCurrentTimePosition();

    // Mobile Day Navigation Logic
    const [mobileDayIndex, setMobileDayIndex] = useState(0);

    useEffect(() => {
        const todayDay = new Date().getDay(); // 0=Sun, 1=Mon...
        // If today is Mon-Fri (1-5), set it. Else default to 0 (Monday)
        if (todayDay >= 1 && todayDay <= 5) {
            setMobileDayIndex(todayDay - 1);
        } else {
            setMobileDayIndex(0);
        }
    }, [selectedWeek]);

    const handleMobileDayChange = (direction) => {
        const newIndex = mobileDayIndex + direction;
        if (newIndex >= 0 && newIndex < 5) {
            setMobileDayIndex(newIndex);
        } else if (newIndex < 0) {
            // Go to previous week, Friday
            onWeekChange(-1);
            setMobileDayIndex(4);
        } else if (newIndex >= 5) {
            // Go to next week, Monday
            onWeekChange(1);
            setMobileDayIndex(0);
        }
    };

    return (
        <div className="flex bg-transparent overflow-hidden h-full flex-col md:flex-row">

            {/* Main Content */}
            <div className="flex flex-col flex-grow h-full bg-[#020617]/30 backdrop-blur-sm overflow-hidden p-2 md:p-6 relative">

                {/* 1. Month & Year (Top Right) - Hidden on Mobile */}
                <div className="hidden md:block absolute top-2 right-4 md:top-6 md:right-8 z-10 text-right pointer-events-none select-none">
                    <h1 className="text-3xl md:text-5xl font-bold text-slate-100 tracking-tight leading-none drop-shadow-lg opacity-90">
                        {format(weekStartDate, 'MMMM', { locale: es }).charAt(0).toUpperCase() + format(weekStartDate, 'MMMM', { locale: es }).slice(1)}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-500 font-light tracking-widest mt-1 mr-1">{selectedYear}</p>
                </div>

                {/* 2. Navigation Row (Desktop) */}
                <div className="flex-none -mb-[93px] flex justify-start z-50 origin-top-left scale-[0.6] md:scale-[0.7] hidden md:flex">
                    <MiniCalendar
                        selectedWeek={selectedWeek}
                        selectedYear={selectedYear}
                        onGoToDate={onGoToDate}
                    />
                </div>

                {/* MOBILE ONLY: Independent MiniCalendar Panel (Top) */}
                <div className="md:hidden flex-none mb-4 z-40 flex justify-center">
                    <MiniCalendar
                        selectedWeek={selectedWeek}
                        selectedYear={selectedYear}
                        onGoToDate={onGoToDate}
                    />
                </div>

                {/* 2. Week Info (Desktop) */}
                <div className="hidden md:flex absolute top-[195px] left-[250px] z-20 items-baseline gap-3 pointer-events-none select-none">
                    <span className="text-3xl font-black text-slate-200 tracking-tight leading-none drop-shadow-md">SEMANA {selectedWeek.toString().padStart(2, '0')}</span>
                    <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">{format(weekStartDate, 'EEE d', { locale: es })} - {format(weekEndDate, 'EEE d', { locale: es })}</span>
                </div>

                {/* 3. Navigation Buttons (Desktop) */}
                <div className="hidden md:flex absolute top-[200px] right-8 z-20 gap-2">
                    <button
                        onClick={() => onWeekChange(-1)}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all active:scale-95 shadow-lg backdrop-blur-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => onWeekChange(1)}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all active:scale-95 shadow-lg backdrop-blur-sm"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Unified Scrollable Container wrapped in Panel Style */}
                <div className="flex-grow flex flex-col bg-[#0f1221] border border-slate-800/50 rounded-2xl shadow-lg run-flow-root relative overflow-hidden md:mt-0">

                    {/* Mobile Header (Date Navigation Only) */}
                    <div className="md:hidden flex justify-between items-center p-4 border-b border-slate-800/50 bg-[#0f1221] sticky top-0 z-50">
                        <button onClick={() => onWeekChange(-1)} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg"><ChevronLeft size={20} /></button>

                        <div className="flex flex-col items-center">
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Semana {selectedWeek}</span>
                            <span className="text-sm text-white font-bold">{format(weekStartDate, 'd MMM', { locale: es })} - {format(weekEndDate, 'd MMM', { locale: es })}</span>
                        </div>

                        <button onClick={() => onWeekChange(1)} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg"><ChevronRight size={20} /></button>
                    </div>


                    <div className="flex-grow overflow-auto custom-scrollbar relative">
                        {/* Container needs min-width to force scroll */}
                        <div className="flex min-h-[650px] relative min-w-[800px]">
                            {/* Time Column */}
                            <div className="flex-none w-10 md:w-12 relative pt-[60px] sticky left-0 z-40 bg-[#0f1221]/95 backdrop-blur-sm border-r border-slate-800/50 shadow-sm">
                                {Array.from({ length: 21 }).map((_, i) => {
                                    const minutesFromStart = i * 30;
                                    const topPos = minutesFromStart * PIXELS_PER_MINUTE;
                                    const hour = Math.floor(START_HOUR + i * 0.5);
                                    const minute = (i % 2 === 0) ? '00' : '30';
                                    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute}`;

                                    return (
                                        <div key={i} className="absolute w-full flex items-center justify-end pr-2 md:pr-3" style={{ top: `${topPos + 60}px`, height: '20px', transform: 'translateY(-50%)' }}>
                                            <span className="text-[10px] md:text-xs font-mono text-slate-500/70">{timeLabel}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Days Grid - Always 5 columns, min-width forces scroll */}
                            <div className="flex-grow grid grid-cols-5 min-w-0">
                                {DIAS_SEMANA.map((dia, index) => {
                                    const currentDate = new Date(weekStartDate);
                                    currentDate.setDate(weekStartDate.getDate() + index);
                                    const isToday = new Date().toDateString() === currentDate.toDateString();

                                    return (
                                        <div key={dia} className={`relative flex flex-col border-r border-slate-800/50 last:border-r-0 ${isToday ? 'bg-indigo-900/5' : ''}`}>
                                            {/* Sticky Day Header */}
                                            <div className={`sticky top-0 z-30 text-center py-3 border-b border-slate-800/50 ${isToday ? 'bg-indigo-900/20 backdrop-blur-md' : 'bg-[#0f1221]/95 backdrop-blur-md'} h-[60px] flex flex-col justify-center`}>
                                                <h3 className={`font-bold text-lg leading-none ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>{dia}</h3>
                                                <p className={`text-[10px] ${isToday ? 'text-indigo-300' : 'text-slate-500'} uppercase font-medium tracking-wider mt-1`}>
                                                    {currentDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>

                                            {/* EXCLUSION OVERLAY */}
                                            {(() => {
                                                if (!schoolYearConfig) return null;
                                                const toLocalISODate = (d) => {
                                                    const offset = d.getTimezoneOffset() * 60000;
                                                    return new Date(d.getTime() - offset).toISOString().split('T')[0];
                                                };
                                                const dateStr = toLocalISODate(currentDate);

                                                let exclusionReason = null;

                                                if (schoolYearConfig.schoolYearStart && dateStr < schoolYearConfig.schoolYearStart) exclusionReason = "Vacaciones";
                                                if (schoolYearConfig.schoolYearEnd && dateStr > schoolYearConfig.schoolYearEnd) exclusionReason = "Vacaciones";

                                                if (!exclusionReason && schoolYearConfig.excludedDates && Array.isArray(schoolYearConfig.excludedDates)) {
                                                    const found = schoolYearConfig.excludedDates.find(ed => {
                                                        if (ed.date) return ed.date === dateStr;
                                                        if (ed.start && ed.end) return dateStr >= ed.start && dateStr <= ed.end;
                                                        return false;
                                                    });
                                                    if (found) exclusionReason = found.title || "Feriado / Sin Clases";
                                                }

                                                if (exclusionReason) {
                                                    return (
                                                        <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-grayscale flex flex-col items-center justify-center p-4 text-center border-t border-slate-800">
                                                            <div className="bg-red-500/20 p-3 rounded-full mb-3 animate-in zoom-in spin-in-12 duration-500">
                                                                <Calendar className="text-red-400" size={24} />
                                                            </div>
                                                            <span className="text-red-200 font-bold text-sm uppercase tracking-wider mb-1">{exclusionReason}</span>
                                                            <span className="text-slate-500 text-xs">No hay clases programadas</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {/* Schedule Area */}
                                            <div className="relative flex-grow h-[600px] min-h-[600px]">
                                                {/* Guide Lines */}
                                                {Array.from({ length: 21 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`absolute left-0 right-0 border-t pointer-events-none ${i % 2 === 0 ? 'border-slate-700/30' : 'border-slate-700/10 border-dashed'}`}
                                                        style={{ top: i * 30 * 0.9 }}
                                                    ></div>
                                                ))}

                                                {/* Current Time Indicator */}
                                                {isToday && timeIndicatorTop !== null && (
                                                    <div
                                                        className="absolute left-0 right-0 z-40 flex items-center pointer-events-none"
                                                        style={{ top: timeIndicatorTop }}
                                                    >
                                                        <div className="w-full border-t border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                                        <div className="absolute -left-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                                    </div>
                                                )}

                                                {(() => {
                                                    const dayClasses = clasesPorDia[index + 1].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

                                                    return dayClasses.map((clase, idx) => {
                                                        const claseDate = new Date(clase.fecha);
                                                        const hours = claseDate.getHours();
                                                        const minutes = claseDate.getMinutes();

                                                        const startMinutes = (hours - START_HOUR) * 60 + minutes;
                                                        const topPos = startMinutes * PIXELS_PER_MINUTE;
                                                        const height = (clase.duracion || 90) * PIXELS_PER_MINUTE;

                                                        const isCompact = height < 40;
                                                        const isShort = !isCompact && height < 70;

                                                        return (
                                                            <div
                                                                key={clase.id}
                                                                className="absolute inset-x-[1px]"
                                                                style={{
                                                                    top: `${topPos}px`,
                                                                    height: `${height}px`,
                                                                    zIndex: 10 + idx
                                                                }}
                                                            >
                                                                <ClaseCard
                                                                    clase={clase}
                                                                    onEdit={onEdit}
                                                                    onDelete={onDelete}
                                                                    onExpand={onExpand}
                                                                    compact={isCompact}
                                                                    isShort={isShort}
                                                                    isStatic={true}
                                                                    style={{ height: '100%', position: 'relative' }}
                                                                />
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyView;
