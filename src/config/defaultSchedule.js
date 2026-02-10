
/**
 * HORARIO POR DEFECTO (FIXED SCHEDULE)
 * 
 * Este objeto define la estructura del horario que se cargará automáticamente
 * cuando la aplicación se inicie por primera vez en un dispositivo "limpio".
 * 
 * ESTRUCTURA:
 * - Clave principal: Nombre del Curso (ej. "5to Básico")
 * - Sub-clave: Nombre de Asignatura (ej. "Lenguaje y Comunicación")
 * - Valor: Array de bloques de horario { dia: 1-5, hora: "HH:MM", duration: min }
 */

export const DEFAULT_SCHEDULE = {
    name: "Horario Profesor 2026",
    activeFrom: "ALWAYS", // Fecha de vigencia eliminada (Siempre activo)
    scheduleData: {}
};
