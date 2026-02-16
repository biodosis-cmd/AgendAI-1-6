import React, { useRef } from 'react';
import {
    ChevronLeft, ChevronRight,
    User, LogOut
} from 'lucide-react';
import MonthSelector from '@/components/common/MonthSelector';
import { getStartDateOfWeek } from '@/utils/dateUtils';

const TopBar = ({
    view,
    selectedWeek,
    selectedYear,
    selectedMonth,
    onWeekChange,
    onMonthChange,
    onGoToToday,
    onGoToDate,
    currentUser,
    onLogout
}) => {
    // Calculate Week Range for Display
    const weekStart = getStartDateOfWeek(selectedYear, selectedWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of the week (Sunday)

    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const startMonthShort = weekStart.toLocaleString('es-ES', { month: 'short' });
    const endMonthShort = weekEnd.toLocaleString('es-ES', { month: 'short' });

    // Only show second month if different
    const dateRangeString = weekStart.getMonth() === weekEnd.getMonth()
        ? `${startDay} - ${endDay} ${startMonthShort}`
        : `${startDay} ${startMonthShort} - ${endDay} ${endMonthShort}`;

    return (
        <header className="h-16 border-b border-slate-800/50 bg-[#0f1221]/80 backdrop-blur-md flex items-center justify-between px-6 z-40 sticky top-0">

            {/* LEFT: Contextual Navigation (Calendar Controls) */}
            <div className="flex items-center gap-4 flex-1">
                {(view === 'calendar' || view === 'units') && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Month Selector */}
                        <div className="hidden md:block">
                            <MonthSelector
                                selectedYear={selectedYear}
                                selectedMonth={selectedMonth}
                                onSelectDate={onGoToDate}
                            />
                        </div>

                        {/* Week Logic */}
                        <div className="flex items-center gap-2 bg-slate-800/40 rounded-full p-1 border border-slate-700/30">
                            <button
                                onClick={() => onWeekChange(-1)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div
                                onClick={onGoToToday}
                                className="flex flex-col items-center px-4 cursor-pointer group"
                                title="Ir a hoy"
                            >
                                <span className="text-[10px] sm:text-xs font-bold text-slate-300 group-hover:text-indigo-400 transition-colors uppercase tracking-wider select-none">
                                    SEMANA {selectedWeek}
                                </span>
                                <span className="text-[9px] font-medium text-slate-500 group-hover:text-indigo-300/80 tracking-tight leading-none">
                                    {dateRangeString}
                                </span>
                            </div>

                            <button
                                onClick={() => onWeekChange(1)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: User & System Actions */}
            <div className="flex items-center gap-3">



                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-700/50">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-slate-200 leading-none">
                            {currentUser?.displayName || 'Usuario'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-1">
                            Profesor
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <User size={16} className="text-white" />
                    </div>
                </div>

            </div>
        </header>
    );
};

export default TopBar;
