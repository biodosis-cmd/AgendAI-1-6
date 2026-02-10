

export const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

export const getStartDateOfWeek = (year, week) => {
    const d = new Date(year, 0, 1 + (week - 1) * 7);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

export const getHorarioForWeek = (year, week, schedules = []) => {
    // Calcular fecha de inicio de la semana solicitada
    const weekStart = getStartDateOfWeek(year, week);

    // Si no hay horarios dinámicos, intentar usar el constante (legacy) o retornar vacío
    if (!schedules || schedules.length === 0) {
        // Fallback a lógica antigua si se importara, pero idealmente ya no dependemos de constantes estáticas
        // Para evitar romper, retornamos un objeto vacío o el primer elemento si existe en constants (que ya no importamos aquí para limpiar)
        // Mejor: Retornar null o vacío, y dejar que la UI maneje "Sin horario".
        return {};
    }

    // Buscar el horario vigente más reciente
    // Ordenar horarios por fecha activeFrom descendente
    const sortedSchedules = [...schedules].sort((a, b) => new Date(b.activeFrom) - new Date(a.activeFrom));

    const applicableSchedule = sortedSchedules.find(schedule => {
        // Robust calculation: Convert both to Integer YYYYMMDD for failure-proof comparison
        // 1. Schedule Date (Use parseInt to handle potential time strings e.g. "12T00:00")
        // 1. Schedule Date (Use parseInt to handle potential time strings e.g. "12T00:00")
        const parts = schedule.activeFrom.split('-');
        if (parts.length < 3) return false; // Invalid format check

        const [sy, sm, sd] = parts.map(p => parseInt(p, 10));
        const scheduleInt = sy * 10000 + sm * 100 + sd;

        // 2. Week Start Date
        const wy = weekStart.getFullYear();
        const wm = weekStart.getMonth() + 1;
        const wd = weekStart.getDate();
        const weekInt = wy * 10000 + wm * 100 + wd;

        // Compare Integers (e.g. 20260112 <= 20260126)
        // Check for NaN just in case
        if (isNaN(scheduleInt)) return false;
        return scheduleInt <= weekInt;
    });

    // Si encontramos uno vigente, retornamos su data. Si no, retornamos el más antiguo disponible o vacío.
    return applicableSchedule ? applicableSchedule.scheduleData : (sortedSchedules[sortedSchedules.length - 1].scheduleData || {});
};

export const getHorarioForDate = (date, schedules) => {
    if (!schedules || schedules.length === 0) return {};

    // SINGLE ACTIVE SCHEDULE POLICY:
    // We assume the first schedule in the list is the ONLY valid one (Single Source of Truth).
    // The import logic ensures we wipe old ones.
    const uniqueSchedule = schedules[0];

    return uniqueSchedule.scheduleData || {};
};
