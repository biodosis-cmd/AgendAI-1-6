import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Menu } from 'lucide-react';


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
    onGoToDate, // Passed from App.jsx
    currentUser,
    onLogout,
    onOpenAiModal,
    onBackup,
    onRestoreClick,
    restoreFileInputRef,
    onRestoreUpload,
    onOpenConfig, // New prop needed
    onOpenSchedule, // New prop needed
    onOpenUnitPlanner // New prop needed for Unit Wizard
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile State



    return (
        <div className="flex h-screen bg-[#05060b] text-slate-100 overflow-hidden font-sans">

            {/* 1. SIDEBAR NAVIGATION */}
            {/* Mobile Overlay Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                view={view}
                setView={setView}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileMenuOpen} // Pass mobile state
                setIsMobileOpen={setIsMobileMenuOpen} // Pass mobile setter
                onOpenAiModal={onOpenAiModal}
                onOpenConfig={onOpenConfig}
                onOpenUnitPlanner={onOpenUnitPlanner}
                onBackup={onBackup}
                onRestoreClick={onRestoreClick}
                restoreFileInputRef={restoreFileInputRef}
                onRestoreUpload={onRestoreUpload}
                onLogout={onLogout}
            />

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300">

                {/* Mobile Header for Hamburger */}
                <div className="md:hidden flex items-center p-4 border-b border-slate-800 bg-[#0f1221]">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="ml-4 font-bold text-lg text-white">AgendAI</span>
                </div>

                {/* 2.2. VIEW CONTENT */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#05060b] to-[#0a0c16] relative">
                    <div className="max-w-[1920px] mx-auto w-full">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
};

export default MainLayout;
