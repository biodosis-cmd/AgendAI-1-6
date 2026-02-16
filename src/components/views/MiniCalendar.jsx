import React, { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getStartDateOfWeek } from '@/utils/dateUtils';

const MiniCalendar = ({ selectedWeek, selectedYear, onGoToDate }) => {
    // Estado para el mes que se está visualizando (navegación independiente de la fecha seleccionada)
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Actualizar el mes visible si la selección externa cambia mucho (opcional, pero buena UX)
    useEffect(() => {
        const weekStart = getStartDateOfWeek(selectedYear, selectedWeek);
        // Solo actualizamos si el mes es diferente al actual visualizado
        if (!isSameMonth(weekStart, currentMonth)) {
            setCurrentMonth(weekStart);
        }
    }, [selectedWeek, selectedYear]);

    // Calcular el rango de la semana seleccionada para el resaltado
    const selectedWeekStart = getStartDateOfWeek(selectedYear, selectedWeek);
    const selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 4); // Asumimos semana Lunes-Viernes o Lunes-Domingo? Agenda escolar suele ser L-V, pero calendario muestra L-D
    // Ajustemos el resaltado para toda la semana (Lunes a Domingo) para visualización en calendario
    const highlightStart = startOfWeek(selectedWeekStart, { weekStartsOn: 1 });
    const highlightEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 });


    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Semana empieza Lunes
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    const days = [];
    let day = startDate;
    let formattedDate = "";

    // Generar días para el calendario
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="bg-[#0f1221] border border-slate-800/50 rounded-2xl p-4 shadow-lg w-full max-w-[320px]">
            {/* Header: Mes y Navegación */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-200 font-bold capitalize text-sm">
                    {format(currentMonth, "MMMM yyyy", { locale: es })}
                </h2>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Días de la semana header */}
            <div className="grid grid-cols-7 mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                    <div key={i} className="text-center text-xs font-medium text-slate-500 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-y-2">
                {calendarDays.map((dayItem, idx) => {
                    // Check if selected week
                    const isSelectedWeek = isWithinInterval(dayItem, { start: highlightStart, end: highlightEnd });
                    const isSelectedDay = isSameDay(dayItem, new Date()); // Highlight current day distinctively? Or just rely on week?

                    // Styles
                    let baseClasses = "h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-sm cursor-pointer transition-all relative z-10";
                    let textClass = "text-slate-400";
                    let bgClass = "hover:bg-slate-800";

                    if (!isSameMonth(dayItem, monthStart)) {
                        textClass = "text-slate-700";
                    }

                    if (isSelectedWeek) {
                        bgClass = "bg-indigo-600/20 text-indigo-300"; // Semana seleccionada
                        if (isSameDay(dayItem, new Date())) {
                            bgClass = "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"; // Hoy dentro de semana
                        }
                    } else if (isSameDay(dayItem, new Date())) {
                        bgClass = "bg-slate-700 text-white"; // Hoy fuera de selección
                    }

                    return (
                        <div key={dayItem.toString()} className="relative p-0.5">
                            {/* Conector visual para la semana seleccionada (opcional, estilo rango) */}
                            {isSelectedWeek && (
                                <div className={`absolute inset-y-1 bg-indigo-600/10 -z-0
                                    ${idx % 7 === 0 ? 'left-1 rounded-l-md' : 'left-0'} 
                                    ${idx % 7 === 6 ? 'right-1 rounded-r-md' : 'right-0'}
                                `}></div>
                            )}

                            <div
                                className={`${baseClasses} ${bgClass} ${textClass}`}
                                onClick={() => onGoToDate(dayItem)}
                            >
                                <span>{format(dayItem, dateFormat)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MiniCalendar;
