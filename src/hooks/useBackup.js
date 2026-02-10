import { useState } from 'react';
import { db, restoreBackupData } from '@/services/db';

export const useBackup = ({ clases, units, schedules, userId }) => {
    const [isRestoring, setIsRestoring] = useState(false);

    const handleBackup = async () => {
        if (!userId) return;
        try {
            const backupData = {
                classes: clases,
                units: units,
                schedules: schedules
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10);
            link.setAttribute('download', `agenda_docente_backup_${date}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Error creating backup:", error);
            throw new Error("No se pudo crear la copia de seguridad.");
        }
    };

    const processRestoreFile = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("No file selected"));
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);

                    if (!backupData.classes || !backupData.units) {
                        throw new Error("El archivo no tiene el formato de copia de seguridad correcto.");
                    }
                    resolve(backupData);
                } catch (error) {
                    console.error("Error parsing backup file:", error);
                    reject(error);
                }
            };
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'UTF-8');
        });
    };

    const restoreData = async (backupData, options = { restoreSchedules: true }) => {
        setIsRestoring(true);
        try {
            await restoreBackupData(backupData, userId, options);
        } catch (error) {
            console.error("Error restoring data:", error);
            throw error;
        } finally {
            setIsRestoring(false);
        }
    };

    return {
        handleBackup,
        processRestoreFile,
        restoreData,
        isRestoring
    };
};
