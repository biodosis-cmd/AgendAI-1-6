import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ModalRoot from '@/components/modals/ModalRoot';
import { getWeekNumber } from '@/utils/dateUtils';
import { useUI, UIProvider } from '@/context/UIContext';
import { useAppLogic } from '@/hooks/useAppLogic';

import WeeklyView from '@/components/views/WeeklyView';
import HomeView from '@/components/views/HomeView';
import ReportView from '@/components/views/ReportView';
import UnitsView from '@/components/views/UnitsView';
import SchedulesView from '@/components/views/SchedulesView';
import LoginView from '@/components/views/LoginView';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ScheduleEditorModal from '@/components/modals/ScheduleEditorModal';
import ConfigView from '@/components/views/ConfigView';

const AppContent = () => {
    const {
        currentUser,
        userId,
        authLoading,
        clases,
        units,
        schedules,
        view,
        isLoading,
        isRestoring,
        selectedYear,
        selectedMonth,
        selectedWeek,
        filteredClasses,
        actions,
        handleLogout,
        handleOpenSchedule,
        handleEditClase,
        handleEditSchedule,
        handleDelete,
        handleDeleteUnit,
        handleDeleteMultiple,
        handleSaveGeneratedClasses,
        handleBackup,
        handleRestoreClick,
        handleRestoreUpload,
        handleOpenUnitPlanner,
        openModal,
        closeModal, // Add closeModal
        activeModal, // Add activeModal
        modalProps, // Add modalProps
        restoreFileInputRef
    } = useAppLogic();

    // console.log("DEBUG activeModal:", activeModal); // Cleaned up

    if (authLoading) return <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    if (!currentUser) return <LoginView />;
    console.log("App actions:", actions);
    console.log("App actions.setView:", actions?.setView);

    return (
        <div className="min-h-screen font-sans text-slate-100 pb-10">
            {(isLoading || isRestoring) && <LoadingSpinner />}

            <MainLayout
                view={view}
                setView={actions.setView}
                selectedWeek={selectedWeek}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onWeekChange={actions.changeWeek}
                onMonthChange={actions.changeMonth}
                onGoToToday={actions.goToCurrentWeek}
                currentUser={currentUser}
                onLogout={handleLogout}
                onOpenAiModal={() => openModal('aiGeneration', { onClassesGenerated: handleSaveGeneratedClasses, selectedYear, selectedWeek, schedules, units })}
                onBackup={handleBackup}
                onRestoreClick={handleRestoreClick}
                restoreFileInputRef={restoreFileInputRef}
                onRestoreUpload={handleRestoreUpload}
                totalClasses={clases.length}
                totalUnits={units.length}
                onOpenSchedule={() => handleEditSchedule(schedules[0], null, true)} // Open active schedule
                onOpenUnitPlanner={handleOpenUnitPlanner}
                onGoToDate={actions.goToDate}
                onOpenConfig={() => actions.setView('config')}
            >

                {view === 'locked' && (
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20 mb-6 shadow-xl shadow-red-900/20 relative group">
                            <Lock size={64} className="text-red-400" />
                            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Licencia Expirada</h2>


                        <div className="flex gap-4">
                            <button
                                onClick={() => handleEditSchedule(schedules[0], null, true)} // Open Editor -> Can import new license
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 flex items-center gap-2"
                            >
                                <Unlock size={20} />
                                Actualizar Licencia
                            </button>
                        </div>
                        <p className="text-slate-600 text-xs mt-12">
                            Contacta al proveedor.
                        </p>
                    </div>
                )}
                {view === 'home' && <HomeView
                    userName={currentUser?.displayName}
                    userId={userId} // Pass standardized ID
                    setView={actions.setView} // Pass setView for navigation
                    clases={filteredClasses}
                    units={units.filter(u => new Date(u.fechaInicio).getFullYear() === selectedYear)}
                    schedules={schedules}
                    onNavigateToCalendar={() => actions.setView('calendar')}
                    onEditClass={handleEditClase}
                    onGenerateClasses={() => {
                        actions.goToCurrentWeek();
                        openModal('aiGeneration', {
                            onClassesGenerated: handleSaveGeneratedClasses,
                            selectedYear: new Date().getFullYear(),
                            selectedWeek: getWeekNumber(new Date()),
                            schedules,
                            units
                        });
                    }}
                    onBackup={handleBackup}
                    onOpenUnitPlanner={handleOpenUnitPlanner}
                    onOpenAiModal={() => openModal('aiGeneration', { onClassesGenerated: handleSaveGeneratedClasses, selectedYear, selectedWeek, schedules, units })}
                />}
                {view === 'calendar' && <WeeklyView
                    selectedWeek={selectedWeek}
                    selectedYear={selectedYear}
                    clases={filteredClasses} // Pass filtered classes
                    onWeekChange={actions.changeWeek}
                    onEdit={handleEditClase}
                    onDelete={handleDelete}
                    onExpand={handleOpenSchedule} // Assuming handleOpenSchedule is the equivalent of onExpand
                    userId={currentUser?.id}
                    currentUser={currentUser} // Pass currentUser for header integration
                    onGoToDate={actions.goToDate}
                    onOpenAiModal={() => openModal('aiGeneration', { onClassesGenerated: handleSaveGeneratedClasses, selectedYear, selectedWeek, schedules, units })}
                    onOpenUnitPlanner={handleOpenUnitPlanner}
                />}
                {view === 'report' && <ReportView userId={userId} clases={clases} units={units} onBack={() => actions.setView('calendar')} selectedYear={selectedYear} onEditClase={handleEditClase} onDelete={handleDelete} onDeleteMultiple={handleDeleteMultiple} />}
                {view === 'units' && <UnitsView units={units.filter(u => new Date(u.fechaInicio).getFullYear() === selectedYear)} clases={filteredClasses} userId={userId} onBack={() => actions.setView('calendar')} onEditClase={handleEditClase} onDelete={handleDeleteUnit} selectedYear={selectedYear} selectedWeek={selectedWeek} schedules={schedules} />}
                {view === 'schedules' && <SchedulesView userId={userId} schedules={schedules} onBack={() => actions.setView('calendar')} onEdit={handleEditSchedule} />}
                {view === 'config' && <ConfigView userId={userId} selectedYear={selectedYear} />}
            </MainLayout>

            {/* --- Modals --- */}
            {/* --- Modals --- */}
            <ScheduleEditorModal
                isOpen={activeModal?.type === 'scheduleEditor'}
                onClose={closeModal}
                scheduleToEdit={modalProps?.scheduleToEdit}
                onSave={async (data) => {
                    await import('@/services/db').then(m => m.saveSchedule(data));
                    closeModal();
                }}
                userId={userId}
            />
            <ModalRoot />
        </div>
    );
};

export default function App() {
    return (
        <UIProvider>
            <AppContent />
        </UIProvider>
    );
}

