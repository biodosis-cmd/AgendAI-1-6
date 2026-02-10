import React, { useRef, useState, useEffect } from 'react';
import {
    Calendar, CalendarDays, BookOpen, FileText, Home,
    Sparkles, UploadCloud, DownloadCloud, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock,
    LogOut, Notebook, Cpu, ChevronDown
} from 'lucide-react';
import { getStartDateOfWeek } from '@/utils/dateUtils';
import MonthSelector from '@/components/common/MonthSelector';

const MainLayout = ({
    children,
    view,
    setView,
    selectedWeek,
    selectedYear,
    selectedMonth,
    onWeekChange,
    onMonthChange,
    onGoToToday,
    currentUser,
    onLogout,
    onOpenAiModal,
    onBackup,
    onRestoreClick,
    restoreFileInputRef,
    onRestoreUpload,
    totalClasses, // Optional: for dashboard stats if needed later
    totalUnits,    // Optional
    onOpenSchedule, // New prop for direct modal opening
    onOpenUnitPlanner, // New prop for Unit Planner Logic
    onGoToDate // New prop for Month Selector
}) => {

    // Helper Functions
    const getMonthName = (year, month) => {
        return new Date(year, month).toLocaleString('es-ES', { month: 'long' });
    };

    // Calculate Week Range for Display
    const weekStart = getStartDateOfWeek(selectedYear, selectedWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of the week (Sunday)

    // Format Date Range: "12 - 18 Ene"
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const startMonthShort = weekStart.toLocaleString('es-ES', { month: 'short' });
    const endMonthShort = weekEnd.toLocaleString('es-ES', { month: 'short' });

    // Only show second month if different
    const dateRangeString = weekStart.getMonth() === weekEnd.getMonth()
        ? `${startDay} - ${endDay} ${startMonthShort}`
        : `${startDay} ${startMonthShort} - ${endDay} ${endMonthShort}`;


    return (
        <div className="min-h-screen font-sans text-slate-100 pb-10 relative">
            {/* Unified Header */}
            <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 mb-6 transition-all duration-300">
                <div className="max-w-[1800px] mx-auto px-4 h-16 flex items-center justify-between gap-4">

                    {/* LEFT GROUP: Brand + Month Selector */}
                    <div className="flex items-center gap-8 z-20">
                        {/* Brand Identity */}
                        <div onClick={() => setView('home')} className="flex items-center gap-3 group cursor-pointer z-50">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl border border-indigo-400/30 shadow-lg shadow-indigo-500/20 relative group-hover:scale-105 transition-transform flex items-center justify-center">
                                    <Notebook className="text-white w-5 h-5" />
                                    <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-indigo-500/50">
                                        <Cpu size={10} className="text-indigo-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col hidden sm:flex">
                                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                                    Agend<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
                                </h1>
                            </div>
                        </div>

                        {/* Month Selector (Next to Brand) */}
                        {(view === 'calendar' || view === 'monthly') && (
                            <div className="hidden md:block">
                                <MonthSelector
                                    selectedYear={selectedYear}
                                    selectedMonth={selectedMonth}
                                    onSelectDate={onGoToDate}
                                />
                            </div>
                        )}
                    </div>

                    {/* CENTER: Minimalist Typographic Selector (Option C) */}
                    {(view === 'calendar' || view === 'monthly') && (
                        <>
                            {/* Week Selector (Center) */}
                            <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex-1 md:flex-none flex justify-center">
                                <div className="flex items-center gap-2 md:gap-6 group/selector bg-slate-800/50 md:bg-transparent p-1 md:p-0 rounded-full border border-slate-700/50 md:border-none">

                                    {/* Prev Button */}
                                    <button
                                        onClick={() => onWeekChange(-1)}
                                        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-400 hover:bg-slate-800/50 transition-all duration-300 active:scale-90"
                                    >
                                        <ChevronLeft size={20} className="md:w-6 md:h-6" strokeWidth={1.5} />
                                    </button>

                                    {/* Typographic Display */}
                                    <div className="flex flex-col items-center cursor-pointer select-none px-2" onClick={onGoToToday} title="Ir a Hoy">
                                        <div className="flex items-baseline leading-none">
                                            <span className="text-xs md:text-sm font-extrabold tracking-widest text-slate-200 tabular-nums group-hover/selector:text-white transition-colors whitespace-nowrap">
                                                SEMANA {selectedWeek.toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-bold text-indigo-500/60 tracking-[0.3em] mt-0.5 md:mt-1.5 transition-colors group-hover/selector:text-indigo-400">
                                            {selectedYear}
                                        </span>
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={() => onWeekChange(1)}
                                        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-400 hover:bg-slate-800/50 transition-all duration-300 active:scale-90"
                                    >
                                        <ChevronRight size={20} className="md:w-6 md:h-6" strokeWidth={1.5} />
                                    </button>

                                </div>
                            </div>
                        </>
                    )}


                    {/* RIGHT: Actions & Profile */}
                    <div className="flex items-center gap-3 justify-end flex-1">

                        {/* AI PLANNING BUTTONS (INDEPENDENT ICONS) */}
                        {view === 'calendar' && (
                            <div className="flex items-center gap-2">
                                {/* Quick AI Action */}
                                <button
                                    onClick={onOpenAiModal}
                                    title="Planificación Rápida (IA)"
                                    className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-400/30 shadow-lg shadow-indigo-900/40 hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <Sparkles size={18} className="text-white relative z-10 animate-pulse group-hover:animate-none sm:w-5 sm:h-5" />
                                    <div className="absolute -inset-1 bg-indigo-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                                </button>

                                {/* Unit Based Planning */}
                                <button
                                    onClick={onOpenUnitPlanner}
                                    title="Planificación por Unidad"
                                    className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-400/30 shadow-lg shadow-purple-900/40 hover:scale-110 active:scale-95 transition-all group relative overflow-hidden hidden sm:flex"
                                >
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <BookOpen size={20} className="text-white relative z-10" />
                                    <div className="absolute -inset-1 bg-purple-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                                </button>
                            </div>
                        )}

                        <div className="h-6 w-px bg-slate-700/50 mx-1 hidden sm:block"></div>

                        {/* Secondary Tools (Grouped) */}
                        <div className="flex items-center gap-1 bg-slate-800/40 p-1 rounded-lg border border-slate-700/30">
                            <button onClick={() => setView('home')} title="Inicio" className={`p-2 rounded-md transition-colors ${view === 'home' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700'}`}>
                                <Home size={18} />
                            </button>
                            <button onClick={() => setView('calendar')} title="Vista Semanal" className={`p-2 rounded-md transition-colors ${view === 'calendar' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700'}`}>
                                <CalendarDays size={18} />
                            </button>
                            <button onClick={() => setView('units')} title="Unidades" className={`p-2 rounded-md transition-colors ${view === 'units' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>
                                <BookOpen size={18} />
                            </button>
                            <button onClick={onOpenSchedule} title="Ver Horario" className={`p-2 rounded-md transition-colors ${view === 'schedules' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700'}`}>
                                <Clock size={18} />
                            </button>
                            <button onClick={() => setView('report')} title="Reportes" className={`p-2 rounded-md transition-colors ${view === 'report' ? 'text-indigo-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>
                                <FileText size={18} />
                            </button>
                            <div className="w-px h-5 bg-slate-700/50 mx-1"></div>
                            <button onClick={onRestoreClick} title="Restaurar" className="p-2 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-colors">
                                <UploadCloud size={18} />
                            </button>
                            <input type="file" ref={restoreFileInputRef} onChange={onRestoreUpload} accept=".json" className="hidden" />
                            <button onClick={onBackup} title="Crear respaldo" className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-lg transition-all hidden md:flex">
                                <DownloadCloud size={18} />
                            </button>
                        </div>

                        <div className="h-6 w-px bg-slate-700/50 mx-1 hidden sm:block"></div>

                        <button
                            onClick={onLogout}
                            title="Cerrar Sesión"
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-colors flex items-center gap-2"
                        >
                            <LogOut size={18} />
                            <span className="hidden md:inline text-xs font-bold">Salir</span>
                        </button>

                        {/* Profile Block Removed as per user request */}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-[1700px] mx-auto px-4 md:px-6">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
