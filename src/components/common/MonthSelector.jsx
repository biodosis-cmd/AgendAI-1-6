import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useUI } from '@/context/UIContext';

const MonthSelector = ({ selectedYear, selectedMonth, onSelectDate }) => {
    const { validYear } = useUI();
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState('months'); // 'months' or 'days'
    const [viewDate, setViewDate] = useState(new Date(selectedYear, selectedMonth, 1));
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Sync internal state when external props change
    useEffect(() => {
        if (!isOpen) {
            setViewDate(new Date(selectedYear, selectedMonth, 1));
            setViewMode('months');
        }
    }, [selectedYear, selectedMonth, isOpen]);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const currentMonthName = months[selectedMonth];

    const handleMonthClick = (monthIndex) => {
        const newDate = new Date(viewDate.getFullYear(), monthIndex, 1);
        setViewDate(newDate);
        setViewMode('days');
    };

    const handleYearChange = (delta) => {
        const newDate = new Date(viewDate.getFullYear() + delta, viewDate.getMonth(), 1);
        setViewDate(newDate);
    };

    const handleDateClick = (day) => {
        const targetDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onSelectDate(targetDate);
        setIsOpen(false);
    };

    // Calendar Generation Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

        // Adjust for Monday start (0 = Monday, 6 = Sunday)
        let startingDay = firstDayOfMonth - 1;
        if (startingDay < 0) startingDay = 6;

        return { daysInMonth, startingDay };
    };

    const { daysInMonth, startingDay } = getDaysInMonth(viewDate);

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 group
                    ${isOpen
                        ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-300'
                        : 'bg-transparent border-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                    }`}
            >
                <span className="text-xs font-bold tracking-widest uppercase">
                    {currentMonthName}
                </span>
                <CalendarIcon size={14} className={`opacity-50 group-hover:opacity-100 transition-opacity ${isOpen ? 'text-indigo-400' : ''}`} />
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-[280px] bg-[#0f1221]/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transform origin-top-left animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
                        <button
                            onClick={() => viewMode === 'days' ? setViewMode('months') : handleYearChange(-1)}
                            className="p-1 rounded-md transition-colors hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex flex-col items-center leading-none cursor-pointer" onClick={() => setViewMode(viewMode === 'days' ? 'months' : 'days')}>
                            <span className="text-sm font-bold text-slate-200">
                                {viewMode === 'months' ? viewDate.getFullYear() : months[viewDate.getMonth()]}
                            </span>
                            {viewMode === 'days' && (
                                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                                    {viewDate.getFullYear()}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => viewMode === 'days' ? setViewMode('months') : handleYearChange(1)}
                            className="p-1 rounded-md transition-colors hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="p-3">
                        {viewMode === 'months' ? (
                            <div className="grid grid-cols-3 gap-2">
                                {months.map((m, idx) => (
                                    <button
                                        key={m}
                                        onClick={() => handleMonthClick(idx)}
                                        className={`p-2 rounded-lg text-xs font-medium transition-all
                                            ${idx === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear() ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : ''}
                                            ${idx === selectedMonth && viewDate.getFullYear() === selectedYear ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                                        `}
                                    >
                                        {m.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Week Days Header */}
                                <div className="grid grid-cols-7 text-center mb-1">
                                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                                        <span key={d} className="text-[10px] font-bold text-slate-600">{d}</span>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: startingDay }).map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}
                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        // Simple selected check
                                        const isToday = day === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => handleDateClick(day)}
                                                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all relative
                                                    ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                                                `}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthSelector;
