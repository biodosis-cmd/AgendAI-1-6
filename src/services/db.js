
import Dexie from 'dexie';
import { liveQuery } from 'dexie';

// --- Configuración de la Base de Datos ---

export const db = new Dexie('AgendaDB');

// Update to Version 2 to match Spanish keys used in app and ensure ++id
db.version(2).stores({
    classes: '++id, userId, fecha, curso, asignatura, anio, semana', // Indexes: User, Date, Course, Subject, Year, Week
    units: '++id, userId, curso, asignatura',
    schedules: '++id, userId, activeFrom, [userId+activeFrom]',
    school_years: '++id, userId, year, [userId+year]'
}).upgrade(tx => {
    // Migration helper (optional): If we wanted to copy old 'date' to 'fecha' we could do it here
    // But since we suspect the old schema might have been blocking 'put', a clean schema is key.
    // Existing data *should* persist, but indexes will be rebuilt.
    // If 'date' existed, it will be lost as an index, but 'fecha' property in objects will now be indexed.
});

// Update to Version 3 to add school_years table
db.version(3).stores({
    school_years: '++id, userId, year, [userId+year]'
});

// Fallback for V1 (legacy support ensures we don't break if opened in mixed env, but priority is V2)
db.version(1).stores({
    classes: '++id, userId, date, course, subject',
    units: '++id, userId, course, subject',
    schedules: '++id, userId, activeFrom, [userId+activeFrom]'
}); // Compound index example if needed


export const LOCAL_USER_ID = 'local-user';

// --- Helpers de Suscripción ---

/**
 * Helper genérico para suscribirse a cambios en una colección (tabla) filtrada por userId.
 * Imita la API de onSnapshot de Firebase.
 * 
 * @param {Dexie.Table} table - Tabla de Dexie (ej. db.classes)
 * @param {string} userId - ID del usuario.
 * @param {function} onData - Callback con los datos.
 * @param {function} onError - Callback de error.
 * @returns {function} - Función para desuscribirse.
 */
const subscribeToUserCollection = (table, userId, onData, onError) => {
    if (!userId) return () => { };

    // Usamos liveQuery para observar la consulta
    const observable = liveQuery(() => table.where('userId').equals(userId).toArray());

    // Nos suscribimos al observable
    const subscription = observable.subscribe({
        next: (result) => {
            onData(result);
        },
        error: (error) => {
            console.error(`Error en suscripción Dexie para ${table.name}:`, error);
            if (onError) onError(error);
        }
    });

    // Retorna la función de "unsubscribe"
    return () => subscription.unsubscribe();
};

// --- Exportaciones de Suscripción (API Compatible) ---

export const subscribeToClasses = (userId, onData, onError) => {
    return subscribeToUserCollection(db.classes, userId, onData, onError);
};

export const subscribeToUnits = (userId, onData, onError) => {
    return subscribeToUserCollection(db.units, userId, onData, onError);
};

export const subscribeToSchedules = (userId, onData, onError) => {
    return subscribeToUserCollection(db.schedules, userId, onData, onError);
};

// --- Operaciones CRUD y Utilidades ---

/**
 * Elimina una entidad por ID.
 * Nota: En Dexie los IDs son numéricos si son auto-incrementales.
 * Si la app usaba strings, Dexie puede manejarlos si no son ++id, pero aquí definimos ++id.
 * Asegurarse de que al migrar/guardar se manejen correctamente.
 */
export const deleteEntity = async (collectionName, docId) => {
    try {
        // Mapeo simple de nombres de colección de string a tablas de Dexie
        // La app original usaba constantes tipo 'classes', 'units'.
        // Asumimos que collectionName coincide con el nombre de la tabla en el store.

        // Convertir ID a número si es necesario (Dexie usa números para ++id)
        // Si el ID viene de Firebase (string largo), esto podría ser un problema si no migramos los datos.
        // Pero como estamos empezando de 0 o importando, asumiremos IDs numéricos o manejados por Dexie.
        // SI la app espera IDs strings, Dexie también soporta strings como keys.

        const idToDelete = Number(docId) || docId; // Intenta convertir a número

        await db.table(collectionName).delete(idToDelete);
    } catch (error) {
        console.error(`Error eliminando documento de ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Elimina múltiples entidades por ID (Bulk Delete).
 */
export const deleteEntities = async (collectionName, docIds) => {
    try {
        const idsToDelete = docIds.map(id => Number(id) || id);
        await db.table(collectionName).bulkDelete(idsToDelete);
    } catch (error) {
        console.error(`Error eliminando multiples documentos de ${collectionName}:`, error);
        throw error;
    }
};

/**
 * Recupera todos los horarios del usuario.
 */
export const getSchedule = async (userId) => {
    try {
        const schedules = await db.schedules.where('userId').equals(userId).toArray();
        // Return sorted by ID desc to match subscription logic
        return schedules.sort((a, b) => b.id - a.id);
    } catch (error) {
        console.error("Error fetching schedule:", error,);
        return [];
    }
};



/**
 * Guarda o actualiza un horario.
 */
export const saveSchedule = async (scheduleData) => {
    try {
        // Ensure userId is present
        const scheduleWithUser = {
            ...scheduleData,
            userId: scheduleData.userId || LOCAL_USER_ID
        };
        // Use put to add or replace based on ID (if present) or auto-increment
        // If the schedule object already has an ID, it updates. If not, it adds.
        return await db.schedules.put(scheduleWithUser);
    } catch (error) {
        console.error("Error saving schedule:", error);
        throw error;
    }
};

/**
 * Guarda múltiples clases generadas (Batch).
 */
export const saveGeneratedClassesBatch = async (classesData) => {
    try {
        const timestamp = Date.now();

        // Asegurar que tengan userId y un ID válido si no existe.
        // El error "key path did not yield a value" indica que Dexie no está generando el ID automáticamente.
        // Solución: Generamos IDs manuales únicos basados en tiempo + índice.
        const classesWithUser = classesData.map((c, index) => ({
            ...c,
            userId: c.userId || LOCAL_USER_ID,
            // Si ya tiene ID lo usamos, si no, generamos uno numérico único.
            id: c.id || (timestamp + index)
        }));

        // Usamos bulkPut para insertar o reemplazar
        await db.classes.bulkPut(classesWithUser);
    } catch (error) {
        console.error("Error guardando batch de clases:", error);
        throw error;
    }
};

/**
 * Restaura una copia de seguridad.
 * Limpia los datos actuales del usuario y restaura los nuevos.
 */
export const restoreBackupData = async (backupData, userId, options = { restoreSchedules: true }) => {
    return db.transaction('rw', db.classes, db.units, db.schedules, async () => {
        // 1. Limpiar datos existentes para este usuario (opcional, o bulkPut sobrescribe)
        // Para una restauración limpia, mejor borrar lo del usuario primero.
        await db.classes.where('userId').equals(userId).delete();
        await db.units.where('userId').equals(userId).delete();

        if (options.restoreSchedules) {
            await db.schedules.where('userId').equals(userId).delete();
        }

        // 2. Insertar nuevos datos
        if (backupData.classes && backupData.classes.length > 0) {
            const classesToImport = backupData.classes.map(c => ({ ...c, userId }));
            await db.classes.bulkAdd(classesToImport);
        }

        if (backupData.units && backupData.units.length > 0) {
            const unitsToImport = backupData.units.map(u => ({ ...u, userId }));
            await db.units.bulkAdd(unitsToImport);
        }

        if (options.restoreSchedules && backupData.schedules && backupData.schedules.length > 0) {
            const schedulesToImport = backupData.schedules.map(s => ({ ...s, userId }));
            await db.schedules.bulkAdd(schedulesToImport);
        }
    });
};

// --- School Year Configuration ---

export const getSchoolYearConfig = async (userId, year) => {
    try {
        const config = await db.school_years
            .where('[userId+year]')
            .equals([userId, year])
            .first();
        return config || null;
    } catch (error) {
        console.error("Error fetching school year config:", error);
        return null;
    }
};

export const saveSchoolYearConfig = async (config) => {
    try {
        return await db.school_years.put(config);
    } catch (error) {
        console.error("Error saving school year config:", error);
        throw error;
    }
};
