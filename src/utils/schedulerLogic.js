import { getStartDateOfWeek, getWeekNumber, getHorarioForDate } from './dateUtils';
import { CURSO_COLORES, STATUS } from '@/constants';

/**
 * Core logic for calculating class schedules and detecting conflicts.
 * REBUILT: Now strictly uses the FIRST active schedule found (Single Source of Truth).
 * Does NOT check 'activeFrom' validity dates (deprecated).
 * If the schedule allows it, we agenda it.
 * 
 * @param {Object} data - Input data { curso, asignatura, clases: [sesiones...] }
 * @param {Array} existingClasses - All existing classes to check conflicts against
 * @param {Array} schedules - Available schedules (We use schedules[0])
 * @param {number} selectedYear 
 * @param {number} selectedWeek 
 * @param {string} userId
 */
export const calculateClassSchedule = (data, existingClasses, schedules, selectedYear, selectedWeek, userId) => {
    const { curso, asignatura, clases: sesiones, unitLimitDate } = data; // unitLimitDate is optional
    const conflicts = [];
    const classesToCreate = [];

    // SINGLE SOURCE OF TRUTH: Use the first schedule.
    const activeSchedule = schedules && schedules.length > 0 ? schedules[0] : null;

    if (!activeSchedule || !activeSchedule.scheduleData) {
        return {
            success: false,
            error: "No se encontró ningún horario activo. Por favor carga tu licencia/horario primero."
        };
    }

    // 1. Check if the course/subject actually exists in this schedule
    const blocksForSubject = activeSchedule.scheduleData[curso]?.[asignatura];
    if (!blocksForSubject || !Array.isArray(blocksForSubject) || blocksForSubject.length === 0) {
        return {
            success: false,
            error: `El horario actual no tiene bloques asignados para ${curso} / ${asignatura}. Revisa 'Mi Horario'.`
        };
    }

    // 2. Conflict Simulation Loop
    const MAX_SEARCH_DAYS = 730; // Extended to ~2 years to be safe
    let daysSearched = 0;

    // --- SCHOOL YEAR CONFIGURATION CHECK ---
    const isDateAllowed = (date) => {
        // If no config, allow everything (legacy behavior)
        if (!data.schoolYearConfig) return true;

        const { schoolYearStart, schoolYearEnd, excludedDates } = data.schoolYearConfig;

        // Helper to get YYYY-MM-DD in local time
        const toLocalISODate = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        };

        const dateStr = toLocalISODate(date); // The class candidate date

        // 1. Check Range (String comparison works for YYYY-MM-DD)
        if (schoolYearStart && dateStr < schoolYearStart) return false;
        if (schoolYearEnd && dateStr > schoolYearEnd) return false;

        // 2. Check Exclusions (Holidays, vacations)
        if (excludedDates && Array.isArray(excludedDates)) {
            for (const exclusion of excludedDates) {
                // exclusions are already YYYY-MM-DD strings from input
                if (dateStr >= exclusion.start && dateStr <= exclusion.end) {
                    return false;
                }
            }
        }

        return true;
    };


    // Check conflicts first
    let fechaCheck = getStartDateOfWeek(selectedYear, selectedWeek);

    let sesionesCheck = 0;

    while (sesionesCheck < sesiones.length) {
        if (daysSearched > MAX_SEARCH_DAYS) {
            return {
                success: false,
                error: `No se encontraron suficientes bloques disponibles en los próximos 700 días (aprox. 2 años). Revisa si tienes horario asignado para este curso.`
            };
        }

        // UNIT LIMIT CHECK (HARD STOP)
        if (unitLimitDate) {
            const currentISODate = fechaCheck.toISOString().split('T')[0];
            if (currentISODate > unitLimitDate) {
                // We reached the limit of the unit. Stop checking.
                // If we haven't found enough slots, we probably should return what we validly found 
                // OR warn the user. But for simulation, we just stop.
                break;
            }
        }

        // START SCHOOL YEAR CHECK
        if (!isDateAllowed(fechaCheck)) {
            // Skip this day entirely
            fechaCheck.setDate(fechaCheck.getDate() + 1);
            daysSearched++;
            continue;
        }
        // END SCHOOL YEAR CHECK

        const diaSemana = fechaCheck.getDay(); // 0=Sun, 1=Mon...

        // Find blocks in the schedule for this day of the week
        // Note: Schedule data often uses 1=Monday... 5=Friday. Our helper usually aligns this.
        // Let's assume standardized 1-5 format in scheduleData.
        // Javascript getDay(): 0 Sun, 1 Mon.

        const matchingBlocks = blocksForSubject.filter(b => b.dia === diaSemana);

        if (matchingBlocks.length > 0) {
            // Check each block against existing classes
            for (const block of matchingBlocks) {
                if (sesionesCheck >= sesiones.length) break;

                const [h, m] = block.hora.split(':');
                const fechaClasePropuesta = new Date(fechaCheck);
                fechaClasePropuesta.setHours(parseInt(h), parseInt(m), 0, 0);

                const claseExistente = existingClasses.find(c => new Date(c.fecha).getTime() === fechaClasePropuesta.getTime());

                if (claseExistente) {
                    if (claseExistente.curso === curso) {
                        // CONFLICT: Slot taken.
                        // We return an error to prevent double booking.
                        return {
                            success: false,
                            error: `CONFLICTO: Ya existe una clase agendada para ${curso} el ${fechaClasePropuesta.toLocaleString('es-CL')}.`
                        };
                    } else {
                        // Teacher conflict (another course same time)
                        return {
                            success: false,
                            error: `CONFLICTO DOCENTE: Ya tienes clase con ${claseExistente.curso} a esa hora.`
                        };
                    }
                }
                // No conflict, consume a session (virtually)
                sesionesCheck++;
            }
        }
        fechaCheck.setDate(fechaCheck.getDate() + 1);
        daysSearched++;
    }

    // 3. Generation Loop (Commit)
    let fechaActual = getStartDateOfWeek(selectedYear, selectedWeek);
    let sesionesAgendadas = 0;
    daysSearched = 0;

    while (sesionesAgendadas < sesiones.length) {
        if (daysSearched > MAX_SEARCH_DAYS) break;

        // UNIT LIMIT CHECK (HARD STOP)
        if (unitLimitDate) {
            const currentISODate = fechaActual.toISOString().split('T')[0];
            if (currentISODate > unitLimitDate) {
                // Stop generating immediately.
                break;
            }
        }

        // START SCHOOL YEAR CHECK
        if (!isDateAllowed(fechaActual)) {
            fechaActual.setDate(fechaActual.getDate() + 1);
            daysSearched++;
            continue;
        }
        // END SCHOOL YEAR CHECK

        const diaSemana = fechaActual.getDay();
        const matchingBlocks = blocksForSubject
            .filter(b => b.dia === diaSemana)
            .sort((a, b) => a.hora.localeCompare(b.hora));

        // Dedupe blocks by time just in case
        const seenTimes = new Set();
        const uniqueBlocks = [];
        for (const b of matchingBlocks) {
            if (!seenTimes.has(b.hora)) {
                seenTimes.add(b.hora);
                uniqueBlocks.push(b);
            }
        }

        for (const block of uniqueBlocks) {
            if (sesionesAgendadas >= sesiones.length) break;

            const [h, m] = block.hora.split(':');
            const fechaClase = new Date(fechaActual);
            fechaClase.setHours(parseInt(h), parseInt(m), 0, 0);

            // Double check conflict (should be clear)
            const occupied = existingClasses.some(c => new Date(c.fecha).getTime() === fechaClase.getTime());

            if (!occupied) {
                const sesionData = sesiones[sesionesAgendadas];

                // Color fallback
                const colorKey = Object.keys(CURSO_COLORES).find(k => k === curso) || 'DEFAULT';
                const assignedColor = CURSO_COLORES[colorKey] || 'bg-slate-600';

                classesToCreate.push({
                    ...sesionData,
                    userId,
                    anio: fechaClase.getFullYear(),
                    semana: getWeekNumber(fechaClase),
                    fecha: fechaClase.toISOString(),
                    curso,
                    asignatura,
                    duracion: parseInt(block.duration) || 90,
                    color: assignedColor,
                    status: STATUS.ACTIVE,
                    ejecutada: true, // User Request: All classes default to "Realizada" (Green/Check)
                    motivoSuspension: ''
                });
                sesionesAgendadas++;
            }
        }

        fechaActual.setDate(fechaActual.getDate() + 1);
        daysSearched++;
    }

    return { success: true, classes: classesToCreate };
};
