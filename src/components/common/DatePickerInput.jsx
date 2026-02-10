import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

const DatePickerInput = ({ value, onChange, minDate, maxDate, placeholder = "Seleccionar fecha" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState('days'); // 'days' | 'months'

    // Parse helper
    const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    // Initial View Date logic
    const getInitialViewDate = () => {
        if (value) return parseDate(value);
        if (minDate) return parseDate(minDate);
        return new Date();
    };

    const [viewDate, setViewDate] = useState(getInitialViewDate());
    const containerRef = useRef(null);

    // Sync viewDate when opening
    useEffect(() => {
        if (isOpen) {
            setViewDate(value ? parseDate(value) : (minDate ? parseDate(minDate) : new Date()));
            setViewMode('days');
        }
    }, [isOpen, value, minDate]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Limits
    const minD = minDate ? parseDate(minDate) : null;
    const maxD = maxDate ? parseDate(maxDate) : null;

    const isYearDisabled = (year, direction) => {
        const targetYear = year + direction;
        if (minD && targetYear < minD.getFullYear()) return true;
        if (maxD && targetYear > maxD.getFullYear()) return true;
        return false;
    };

    const isDateDisabled = (date) => {
        if (minD && date < minD) return true;
        if (maxD && date > maxD) return true;
        return false;
    };

    const handleYearChange = (delta) => {
        if (isYearDisabled(viewDate.getFullYear(), delta)) return;
        const newDate = new Date(viewDate.getFullYear() + delta, viewDate.getMonth(), 1);
        setViewDate(newDate);
    };

    const handleMonthClick = (monthIndex) => {
        const newDate = new Date(viewDate.getFullYear(), monthIndex, 1);
        setViewDate(newDate);
        setViewMode('days');
    };

    const handleDateClick = (day) => {
        const targetDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        if (isDateDisabled(targetDate)) return;

        // Format YYYY-MM-DD
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');

        onChange({ target: { value: `${y}-${m}-${d}`, name: 'custom-date' } }); // Simulate event
        setIsOpen(false);
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let startingDay = new Date(year, month, 1).getDay() - 1; // 0=Mon
        if (startingDay < 0) startingDay = 6;
        return { daysInMonth, startingDay };
    };

    const { daysInMonth, startingDay } = getDaysInMonth(viewDate);

    // Formatted Display Text
    const displayText = value
        ? new Date(parseDate(value)).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
        : placeholder;

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Input Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 rounded-xl bg-slate-800 border cursor-pointer flex items-center justify-between transition-all group
                    ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-600 hover:border-slate-500'}
                `}
            >
                <div className="flex items-center gap-3 text-slate-200 truncate">
                    <CalendarIcon size={18} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    <span className={value ? 'text-white' : 'text-slate-500'}>{displayText}</span>
                </div>
                {value && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onChange({ target: { value: '' } }); }}
                        className="p-1 rounded-full hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                    >
                        <X size={14} />
                    </div>
                )}
            </div>

            {/* Popover */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-[300px] bg-[#0f1221] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 border-b border-slate-700">
                        <button
                            onClick={() => viewMode === 'days' ? setViewMode('months') : handleYearChange(-1)}
                            disabled={viewMode === 'days' ? false : isYearDisabled(viewDate.getFullYear(), -1)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div
                            className="flex flex-col items-center cursor-pointer group"
                            onClick={() => setViewMode(viewMode === 'days' ? 'months' : 'days')}
                        >
                            <span className="font-bold text-slate-200 group-hover:text-white transition-colors">
                                {viewMode === 'months' ? viewDate.getFullYear() : months[viewDate.getMonth()]}
                            </span>
                            {viewMode === 'days' && (
                                <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 transition-colors tracking-widest font-mono">
                                    {viewDate.getFullYear()}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => viewMode === 'days' ? setViewMode('months') : handleYearChange(1)}
                            disabled={viewMode === 'days' ? false : isYearDisabled(viewDate.getFullYear(), 1)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                        {viewMode === 'months' ? (
                            <div className="grid grid-cols-3 gap-2">
                                {months.map((m, idx) => {
                                    // Check if this month is selectable in the current view year (simplified year check)
                                    // ideally strictly check minDate/maxDate for months too, but usually year clamp is enough for this UX
                                    const isSelected = value && parseDate(value).getMonth() === idx && parseDate(value).getFullYear() === viewDate.getFullYear();

                                    return (
                                        <button
                                            key={m}
                                            onClick={() => handleMonthClick(idx)}
                                            className={`p-2 rounded-lg text-xs font-medium transition-all
                                                ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                                            `}
                                        >
                                            {m.slice(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="grid grid-cols-7 text-center mb-1">
                                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                                        <span key={d} className="text-[10px] font-bold text-slate-600">{d}</span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: startingDay }).map((_, i) => <div key={`e-${i}`} />)}
                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const currentD = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                                        const isDisabled = isDateDisabled(currentD);
                                        const isSelected = value && parseDate(value).getTime() === currentD.getTime();
                                        const isToday = new Date().setHours(0, 0, 0, 0) === currentD.getTime();

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => handleDateClick(day)}
                                                disabled={isDisabled}
                                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs transition-all relative
                                                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 font-bold' : ''}
                                                    ${isToday && !isSelected ? 'border border-indigo-500 text-indigo-400' : ''}
                                                    ${isDisabled ? 'opacity-20 cursor-not-allowed text-slate-600' : (!isSelected && 'text-slate-300 hover:bg-slate-800 hover:text-white')}
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

export default DatePickerInput;
