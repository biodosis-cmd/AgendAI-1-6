import { useState } from 'react';
import { saveGeneratedClassesBatch } from '@/services/db';
import { getStartDateOfWeek, getWeekNumber, getHorarioForDate } from '@/utils/dateUtils';
import { CURSO_COLORES, STATUS } from '@/constants';
import { calculateClassSchedule } from '@/utils/schedulerLogic';

export const useClassGeneration = ({ clases, schedules, userId }) => {
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Procesa y guarda las clases generadas si no hay conflictos.
     * Si hay conflicto grave, lanza error.
     * Si hay conflicto leve, devuelve objeto indicando el conflicto para pedir confirmación.
     */
    const generateClasses = async (data, selectedYear, selectedWeek) => {
        const { curso, asignatura, clases: sesiones } = data;

        if (!curso || !asignatura || !sesiones || sesiones.length === 0) {
            throw new Error("No se recibieron datos válidos para guardar.");
        }

        setIsLoading(true);

        try {
            // Delegate logic to pure function
            const result = calculateClassSchedule(data, clases, schedules, selectedYear, selectedWeek, userId);

            if (!result.success) {
                throw new Error(result.error);
            }

            const classesToSave = result.classes;

            await saveGeneratedClassesBatch(classesToSave);
            return { success: true, count: sesiones.length };

        } catch (error) {
            throw error; // Let the component handle display of error
        } finally {
            setIsLoading(false);
        }
    };

    return { generateClasses, isLoading };
};
