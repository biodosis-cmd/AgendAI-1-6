import React, { useMemo, useState, useEffect } from 'react';
import { getStartDateOfWeek } from '@/utils/dateUtils';
import { DIAS_SEMANA, START_HOUR, END_HOUR, PIXELS_PER_MINUTE } from '@/constants';
import ClaseCard from '@/components/common/ClaseCard';

const WeeklyView = ({ selectedWeek, selectedYear, clases, onWeekChange, onEdit, onDelete, onExpand }) => {
    const weekStartDate = getStartDateOfWeek(selectedYear, selectedWeek);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 4);

    const clasesPorDia = useMemo(() => {
        const porDia = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        clases.filter(c => c.semana === selectedWeek).forEach(clase => {
            const dia = new Date(clase.fecha).getDay();
            if (porDia[dia]) porDia[dia].push(clase);
        });
        return porDia;
    }, [clases, selectedWeek]);

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

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] bg-transparent overflow-hidden">



            {/* Unified Scrollable Container */}
            <div className="flex-grow overflow-y-auto custom-scrollbar relative">
                <div className="flex min-h-[650px]">
                    {/* Time Column */}
                    {/* Time Column */}
                    <div className="flex-none w-16 md:w-20 relative pt-[60px] sticky left-0 z-40 bg-[#020617] border-r border-slate-800/50 shadow-lg md:shadow-none">
                        {Array.from({ length: 21 }).map((_, i) => {
                            const minutesFromStart = i * 30;
                            const topPos = minutesFromStart * PIXELS_PER_MINUTE;
                            const hour = Math.floor(START_HOUR + i * 0.5);
                            const minute = (i % 2 === 0) ? '00' : '30';
                            const timeLabel = `${hour.toString().padStart(2, '0')}:${minute}`;

                            return (
                                <div key={i} className="absolute w-full flex items-center justify-end pr-3" style={{ top: `${topPos + 60}px`, height: '20px', transform: 'translateY(-50%)' }}>
                                    <span className="text-xs font-mono text-slate-500">{timeLabel}</span>
                                    <div className="absolute right-0 w-1.5 h-px bg-slate-700"></div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Days Grid - Independent Blocks Layout */}
                    <div className="flex-grow grid grid-cols-5 gap-3 md:gap-4 pr-4 pl-2 min-w-[850px] lg:min-w-0">
                        {DIAS_SEMANA.map((dia, index) => {
                            const currentDate = new Date(weekStartDate);
                            currentDate.setDate(weekStartDate.getDate() + index);
                            const isToday = new Date().toDateString() === currentDate.toDateString();

                            return (
                                <div key={dia} className={`relative flex flex-col rounded-2xl border overflow-hidden ${isToday ? 'bg-indigo-900/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-slate-900/40 border-slate-800/60'}`}>
                                    {/* Sticky Day Header */}
                                    <div className={`sticky top-0 z-30 text-center py-3 border-b ${isToday ? 'border-indigo-500/20 bg-indigo-900/40 backdrop-blur-md' : 'border-slate-700/30 bg-[#0f1221]/90 backdrop-blur-md'} h-[60px] flex flex-col justify-center`}>
                                        <h3 className={`font-bold text-lg leading-none ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>{dia}</h3>
                                        <p className={`text-[10px] ${isToday ? 'text-indigo-300' : 'text-slate-500'} uppercase font-medium tracking-wider mt-1`}>
                                            {currentDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>

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
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyView;
