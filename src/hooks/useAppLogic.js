import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useModal } from '@/context/ModalContext';
import { useUI } from '@/context/UIContext';
import { deleteEntity, db } from '@/services/db';
import { DEFAULT_SCHEDULE } from '@/config/defaultSchedule';
import { useClassGeneration } from '@/hooks/useClassGeneration';
import { useBackup } from '@/hooks/useBackup';
import { STATUS } from '@/constants';
import { getWeekNumber } from '@/utils/dateUtils';


export const useAppLogic = () => {
    const { currentUser, logout, loading: authLoading } = useAuth();
    const { clases, units, schedules, loading: dataLoading } = useData();
    const { openModal, closeModal, activeModal, modalProps } = useModal();
    const {
        view,
        isLoading,
        selectedYear,
        selectedMonth,
        selectedWeek,
        actions
    } = useUI();

    const LOCAL_USER_ID = 'local-user';
    // FIX: Standardize on 'id' for Supabase.
    const userId = currentUser?.id || LOCAL_USER_ID;

    const restoreFileInputRef = useRef(null);

    // --- Hooks ---
    const { generateClasses, isLoading: isGenerating } = useClassGeneration({ clases, schedules, userId });

    // Backup Hook
    const { handleBackup, processRestoreFile, restoreData, isRestoring } = useBackup({ clases, units, schedules, userId });

    // --- SEEDING LOGIC ---
    useEffect(() => {
        const checkAndSeedSchedule = async () => {
            if (!userId) return;
            try {
                const existingSchedules = await db.schedules.toArray();
                if (existingSchedules.length === 0) {
                    await db.schedules.add({ ...DEFAULT_SCHEDULE, userId });
                }
            } catch (error) {
                console.error("Seeding Error:", error);
            }
        };
        checkAndSeedSchedule();
    }, [userId]);

    // LICENSE ENFORCEMENT
    useEffect(() => {
        if (schedules && schedules.length > 0) {
            const activeSchedule = schedules[0];
            const currentRealYear = new Date().getFullYear();

            if (activeSchedule.validYear) {
                // FORCE SYNC: If the schedule belongs to a different year (e.g. 2026) than selected,
                // auto-switch the app to that year so the user sees the data immediately.
                if (selectedYear !== activeSchedule.validYear && activeSchedule.validYear) {
                    // console.log(`Auto-switching year from ${selectedYear} to ${activeSchedule.validYear}`);
                    actions.setSelectedYear(activeSchedule.validYear);
                }
            }
        }
    }, [schedules, actions]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    // --- Handlers ---

    const handleOpenSchedule = () => {
        if (!schedules || schedules.length === 0) {
            // No schedule? Open editor to create one immediately
            handleEditSchedule(null, null, false);
            return;
        }
        // SINGLE ACTIVE SCHEDULE POLICY
        const scheduleToOpen = schedules[0];
        handleEditSchedule(scheduleToOpen, null, true);
    };

    const handleEditClase = (clase) => {
        openModal('editClase', {
            clase,
            onOpenZenMode: (c) => openModal('zenMode', { clase: c })
        });
    };

    const handleEditSchedule = (schedule = null, cloneFrom = null, readOnly = false) => {
        openModal('scheduleEditor', {
            scheduleToEdit: schedule,
            cloneFrom,
            userId,
            readOnly
        });
    };

    const handleDelete = (clase) => {
        openModal('confirmation', {
            title: 'Eliminar Clase',
            message: `¿Estás seguro de que quieres eliminar la clase de ${clase.asignatura} para ${clase.curso}?`,
            onConfirm: async () => {
                try {
                    await deleteEntity('classes', clase.id);
                    closeModal();
                } catch (error) {
                    console.error("Delete Error:", error);
                    closeModal();
                    openModal('info', { title: "Error", message: "No se pudo eliminar la clase." });
                }
            }
        });
    };

    const handleDeleteUnit = (unit) => {
        openModal('confirmation', {
            title: 'Eliminar Unidad',
            message: `¿Estás seguro de que quieres eliminar la unidad "${unit.nombre}"?`,
            onConfirm: async () => {
                try {
                    await deleteEntity('units', unit.id);
                    closeModal();
                } catch (error) {
                    console.error("Delete Unit Error:", error);
                    closeModal();
                    openModal('info', { title: "Error", message: "No se pudo eliminar la unidad." });
                }
            }
        });
    };

    const handleDeleteMultiple = (classesToDelete) => {
        if (!classesToDelete || classesToDelete.length === 0) return;

        openModal('confirmation', {
            title: 'Eliminar Múltiples Clases',
            message: `⚠️ ¿Estás seguro de que deseas eliminar ${classesToDelete.length} clases de forma permanente?\n\nEsta acción no se puede deshacer.`,
            onConfirm: async () => {
                try {
                    // Dynamically import deleteEntities to avoid circular dependencies if any, 
                    // though for services it's usually fine. Keeping original pattern.
                    const { deleteEntities } = await import('@/services/db');
                    await deleteEntities('classes', classesToDelete.map(c => c.id));
                    closeModal();
                    openModal('info', { title: "Éxito", message: "Clases eliminadas correctamente." });
                } catch (error) {
                    console.error("Bulk Delete Error:", error);
                    closeModal();
                    openModal('info', { title: "Error", message: "Ocurrió un error al eliminar las clases." });
                }
            }
        });
    };

    const handleSaveGeneratedClasses = async (data, force = false) => {
        try {
            const targetYear = data.year || selectedYear;
            const targetWeek = data.week || selectedWeek;

            const result = await generateClasses(data, targetYear, targetWeek, force);
            if (result.success) {
                openModal('info', { title: "Éxito", message: `${result.count} clases generadas correctamente.` });
            }
        } catch (e) {
            console.error("Generation Error:", e);
            openModal('info', { title: "Error", message: e.message || 'Error inesperado.' });
        }
    };

    const handleRestoreClick = () => {
        restoreFileInputRef.current.click();
    };

    const handleRestoreUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const backupData = await processRestoreFile(file);

            openModal('confirmation', {
                title: 'Restaurar Copia de Seguridad',
                message: `⚠️ ADVERTENCIA: Esta acción REEMPLAZARÁ todos tus datos actuales (Clases y Unidades) por los del respaldo.\n\nSe encontraron en el respaldo:\n- ${backupData.classes.length} clases\n- ${backupData.units.length} unidades\n- ${backupData.schedules ? backupData.schedules.length : 0} horarios\n\n¿Estás seguro de que deseas continuar y SOBRESCRIBIR tus datos?`,
                onConfirm: async () => {
                    let restoreSchedules = true;
                    if (backupData.schedules && backupData.schedules.length > 0) {
                        restoreSchedules = confirm("¿Quieres SOBRESCRIBIR tu horario actual con el del respaldo?\n\n- Aceptar: Reemplaza tu horario.\n- Cancelar: Conserva tu horario actual.");
                    }

                    actions.setLoading(true);
                    try {
                        await restoreData(backupData, { restoreSchedules });
                        openModal('info', {
                            title: "Restauración Completada",
                            message: `Datos restaurados exitosamente.${!restoreSchedules ? ' (Horario actual conservado)' : ''}`
                        });
                    } catch (error) {
                        openModal('info', { title: "Error", message: "Ocurrió un error en la restauración." });
                    } finally {
                        actions.setLoading(false);
                    }
                }
            });

        } catch (error) {
            openModal('info', { title: "Error de Archivo", message: error.message || "Archivo inválido." });
        } finally {
            event.target.value = null;
        }
    };

    const handleOpenUnitPlanner = () => {
        openModal('unitSelection', {
            units,
            selectedYear,
            schedules,
            onSelectUnit: (unit) => {
                try {
                    let date = new Date(unit.fechaInicio);
                    if (/^\d{4}-\d{2}-\d{2}$/.test(unit.fechaInicio)) {
                        date = new Date(`${unit.fechaInicio}T12:00:00`);
                    }

                    if (!isNaN(date.getTime())) {
                        const newYear = date.getFullYear();
                        const newWeek = getWeekNumber(date);

                        actions.setSelectedYear(newYear);
                        actions.setSelectedWeek(newWeek);
                        // console.log("Jumping to", newYear, newWeek); // Removed log

                        openModal('aiGeneration', {
                            onClassesGenerated: handleSaveGeneratedClasses,
                            selectedYear: newYear,
                            selectedWeek: newWeek,
                            schedules,
                            units,
                            initialUnitId: unit.id
                        });
                    } else {
                        alert("Fecha de unidad inválida");
                    }
                } catch (e) {
                    console.error("Jump error", e);
                }
            }
        });
    };

    const filteredClasses = useMemo(() => {
        return clases.filter(c => c.status === STATUS.ACTIVE && new Date(c.fecha).getFullYear() === selectedYear);
    }, [clases, selectedYear]);

    return {
        // State
        currentUser,
        userId,
        authLoading,
        clases,
        units,
        schedules,
        dataLoading,

        // UI State
        view,
        isLoading,
        isRestoring,
        selectedYear,
        selectedMonth,
        selectedWeek,
        filteredClasses,

        // Actions/Handlers
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
        closeModal,
        activeModal,
        modalProps,

        // Refs
        restoreFileInputRef
    };
};
