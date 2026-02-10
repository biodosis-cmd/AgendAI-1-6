import React, { useState } from 'react';
import { db } from '@/services/db';

const LicenseManager = ({
    isOpen, // Managed by parent usually, but kept for compatibility
    onClose,
    userId,
    onImportSuccess
}) => {
    const [jsonContent, setJsonContent] = useState('');

    const handleJsonImport = async () => {
        try {
            // Decode Base64 License
            let jsonStr;
            try {
                // If user pastes raw JSON or Base64, try to handle Base64 first consistently
                // The prompt asks to paste "License Code" which is Base64
                jsonStr = decodeURIComponent(escape(atob(jsonContent.trim())));
            } catch (e) {
                // Determine if it was already JSON (fallback) or invalid
                try {
                    JSON.parse(jsonContent.trim());
                    jsonStr = jsonContent.trim(); // It was plain JSON
                } catch (jsonErr) {
                    throw new Error("El código de licencia no es válido o está corrupto.");
                }
            }

            const parsed = JSON.parse(jsonStr);
            if (!parsed.scheduleData) throw new Error("Formato inválido: falta 'scheduleData'");

            if (confirm("Al importar reemplazarás todo el horario actual. ¿Continuar?")) {
                const newData = parsed.scheduleData;
                const importedYear = parsed.validYear || new Date().getFullYear();
                // FIX: Use a valid ISO Date instead of "ALWAYS" to ensure dateUtils can parse it correctly.
                const newActiveFrom = `${importedYear}-01-01`;

                // Auto-Save to DB immediately with Transaction for Atomicity
                try {
                    await db.transaction('rw', db.schedules, async () => {
                        const scheduleToSave = {
                            name: `Horario Licencia ${importedYear}`,
                            activeFrom: newActiveFrom,
                            validYear: importedYear,
                            scheduleData: newData,
                            userId,
                            updatedAt: new Date().toISOString()
                        };

                        // 1. Wipe all previous schedules for this user (Single Source of Truth Policy)
                        await db.schedules.where('userId').equals(userId).delete();

                        // 2. Add the new fresh schedule
                        const id = await db.schedules.add(scheduleToSave);

                        // 3. Verification
                        const count = await db.schedules.where('id').equals(id).count();
                        if (count === 0) throw new Error("Verificación falló: El horario no se escribió en la base de datos.");
                    });

                    alert(`Licencia cargada exitosamente. Validez: Año ${importedYear}`);

                    if (onImportSuccess) {
                        onImportSuccess(); // Trigger parent refresh if needed
                    }
                    if (onClose) onClose();

                } catch (saveError) {
                    console.error("Error crítica guardando licencia:", saveError);
                    alert("Error CRÍTICO: No se pudo guardar en la base de datos. " + saveError.message);
                }
            }
        } catch (e) {
            alert("Error al importar Licencia: " + e.message);
        }
    };

    return (
        <div className="bg-[#0f1221] z-50 p-6 flex flex-col rounded-xl border border-indigo-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Importar Licencia
                </h2>
            </div>

            <div className="border border-indigo-500/20 bg-indigo-500/10 p-4 rounded-xl text-sm mb-4 text-indigo-200">
                <p className="font-bold flex items-center gap-2 mb-1">
                    <span className="text-lg">🔑</span> Activación de Horario
                </p>
                <p className="opacity-80">
                    Pega aquí el código de licencia que recibiste para activar tu horario y visualizar las clases.
                </p>
            </div>

            <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="w-full h-48 bg-slate-900 font-mono text-xs text-slate-300 p-4 rounded-xl border border-slate-700 outline-none resize-none shadow-inner custom-scrollbar focus:border-indigo-500"
                placeholder="Pega aquí el Código de Licencia..."
            />

            <div className="flex justify-end gap-3 pt-6">
                <button
                    onClick={handleJsonImport}
                    disabled={!jsonContent.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-indigo-500/20"
                >
                    Importar y Aplicar
                </button>
            </div>
        </div>
    );
};

export default LicenseManager;
