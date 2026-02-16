import React, { useState } from 'react';
import {
    Home, BookOpen, CalendarDays, Clock, FileText,
    Settings, Sparkles, ChevronLeft, ChevronRight,
    LogOut, Database, UploadCloud, DownloadCloud
} from 'lucide-react';

const Sidebar = ({
    view,
    setView,
    isCollapsed,
    setIsCollapsed,
    onOpenAiModal,
    onOpenConfig,
    onOpenUnitPlanner,
    onBackup, // New prop
    onRestoreClick, // New prop
    restoreFileInputRef, // New prop
    onRestoreUpload, // New prop
    onLogout,
    isMobileOpen, // Mobile State
    setIsMobileOpen // Mobile Setter
}) => {

    const menuItems = [
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'calendar', icon: CalendarDays, label: 'Calendario' },
        { id: 'units', icon: BookOpen, label: 'Unidades' },
        { id: 'schedules', icon: Clock, label: 'Horarios' },
        { id: 'report', icon: FileText, label: 'Reportes' },
    ];

    const handleNavigation = (id) => {
        setView(id);
        if (setIsMobileOpen) setIsMobileOpen(false); // Close on mobile navigation
    };

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 bg-[#0f1221] border-r border-slate-800/50 flex flex-col transition-transform duration-300 z-50
                md:translate-x-0 md:static md:h-screen
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                ${isCollapsed ? 'md:w-20' : 'md:w-64'}
                w-64 shadow-2xl md:shadow-none
            `}
        >
            {/* Toggle Button (Desktop Only) */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex absolute -right-3 top-10 bg-indigo-600 text-white p-1 rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-colors z-50"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo Area */}
            <div className={`h-20 flex items-center ${isCollapsed ? 'md:justify-center px-6 md:px-0' : 'px-6'} border-b border-slate-800/50 justify-between md:justify-start`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                        <span className="text-white font-bold text-xl">A</span>
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                        <h1 className="text-xl font-bold text-white md:block">
                            AgendAI
                        </h1>
                    )}
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden text-slate-400 hover:text-white"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = view === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                                ${isActive
                                    ? 'bg-indigo-600/10 text-indigo-400'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }
                                ${isCollapsed ? 'md:justify-center' : ''}
                            `}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon size={20} className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />

                            {(!isCollapsed || isMobileOpen) && (
                                <span className="font-medium text-sm truncate">{item.label}</span>
                            )}

                            {isActive && (!isCollapsed || isMobileOpen) && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                            )}
                        </button>
                    );
                })}

                <div className="my-4 border-t border-slate-800/50 mx-2"></div>

                {/* AI & Actions */}
                <button
                    onClick={() => { onOpenAiModal(); if (setIsMobileOpen) setIsMobileOpen(false); }}
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                        text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-300
                        ${isCollapsed ? 'md:justify-center' : ''}
                    `}
                    title="PlanificAI rápida"
                >
                    <Sparkles size={20} className="shrink-0 text-amber-400 group-hover:animate-pulse" />
                    {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">PlanificAI rápida</span>}
                </button>

                <button
                    onClick={() => { onOpenUnitPlanner(); if (setIsMobileOpen) setIsMobileOpen(false); }}
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                        text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400
                        ${isCollapsed ? 'md:justify-center' : ''}
                    `}
                    title="PlanificAI unidad"
                >
                    <BookOpen size={20} className="shrink-0 text-emerald-500/80 group-hover:text-emerald-400" />
                    {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">PlanificAI unidad</span>}
                </button>

                <button
                    onClick={() => { onOpenConfig(); if (setIsMobileOpen) setIsMobileOpen(false); }}
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                        text-slate-400 hover:bg-slate-800/50 hover:text-slate-200
                        ${isCollapsed ? 'md:justify-center' : ''}
                    `}
                    title="Configuración"
                >
                    <Settings size={20} className="shrink-0 text-slate-500 group-hover:text-slate-300" />
                    {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">Configuración</span>}
                </button>

                <div className="my-4 border-t border-slate-800/50 mx-2"></div>

                {/* Backup & Restore Group */}
                <button
                    onClick={() => { onBackup(); if (setIsMobileOpen) setIsMobileOpen(false); }}
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                        text-slate-400 hover:bg-sky-500/10 hover:text-sky-400
                        ${isCollapsed ? 'md:justify-center' : ''}
                    `}
                    title="Respaldar Datos"
                >
                    <DownloadCloud size={20} className="shrink-0 text-slate-500 group-hover:text-sky-400" />
                    {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">Respaldar</span>}
                </button>

                <button
                    onClick={() => { onRestoreClick(); if (setIsMobileOpen) setIsMobileOpen(false); }}
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                        text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400
                        ${isCollapsed ? 'md:justify-center' : ''}
                    `}
                    title="Restaurar Datos"
                >
                    <UploadCloud size={20} className="shrink-0 text-slate-500 group-hover:text-emerald-400" />
                    {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">Restaurar</span>}
                </button>
                <input
                    type="file"
                    ref={restoreFileInputRef}
                    onChange={onRestoreUpload}
                    accept=".json"
                    className="hidden"
                />
            </nav>

            {/* Footer / Logout */}
            <div className={`p-4 border-t border-slate-800/50 ${isCollapsed ? 'md:justify-center' : ''}`}>
                <button
                    onClick={onLogout}
                    className={`
                        flex items-center gap-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl p-3 transition-all w-full
                        ${isCollapsed ? 'md:justify-center' : ''}
                    `}
                    title="Cerrar Sesión"
                >
                    <LogOut size={20} className="shrink-0" />
                    {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">Salir</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
