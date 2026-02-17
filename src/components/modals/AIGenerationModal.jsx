import React, { useState, useEffect } from 'react';
import { getStartDateOfWeek, getWeekNumber } from '@/utils/dateUtils';
import { getSchoolYearConfig } from '@/services/db';
import { Sparkles, Copy, Download, X, ClipboardPaste, ArrowRight, Check, ChevronLeft, ChevronRight, AlertTriangle, Calendar } from 'lucide-react';

const AIGenerationModal = ({ isOpen, onClose, onClassesGenerated, selectedYear, selectedWeek, schedules, units = [], initialUnitId = null, userId }) => {
    // SINGLE SOURCE OF TRUTH: Use the first (and only) schedule.
    const activeSchedule = schedules && schedules.length > 0 ? schedules[0] : null;

    // Derived lists for Dropdowns directly from the Single Schedule
    const cursosDisponibles = React.useMemo(() => {
        if (!activeSchedule || !activeSchedule.scheduleData) return [];

        const AVAILABLE_COURSES = Object.keys(activeSchedule.scheduleData);

        // Custom Sort Order
        const sortOrder = [
            "NT1", "NT2",
            "1ro Básico", "2do Básico", "3ro Básico", "4to Básico", "5to Básico", "6to Básico", "7mo Básico", "8vo Básico",
            "1ro Medio", "2do Medio", "3ro Medio", "4to Medio"
        ];

        return AVAILABLE_COURSES.sort((a, b) => {
            const indexA = sortOrder.indexOf(a);
            const indexB = sortOrder.indexOf(b);

            // Handle cases where a course might not be in the list
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;

            return indexA - indexB;
        });
    }, [activeSchedule]);

    const [formData, setFormData] = useState({ curso: '', asignatura: '', cantidad: '5', prompt: '', duracion: '90' });
    const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId || ''); // Initialize with prop
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [jsonResponse, setJsonResponse] = useState('');
    const [step, setStep] = useState(1); // 1: Configurar, 2: Copiar Prompt, 3: Pegar Respuesta
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [schoolYearConfig, setSchoolYearConfig] = useState(null);

    // Local Date State for Week Selection
    const [localYear, setLocalYear] = useState(selectedYear);
    const [localWeek, setLocalWeek] = useState(selectedWeek);

    // Helper: Parse Date Robustly
    const parseDateSafe = (dateStr) => {
        if (!dateStr) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return new Date(`${dateStr}T12:00:00`);
        }
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;

        const parts = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (parts) {
            const isoStr = `${parts[3]}-${parts[2]}-${parts[1]}T12:00:00`;
            d = new Date(isoStr);
            if (!isNaN(d.getTime())) return d;
        }
        return null;
    };

    // Helper: Jump to Date Logic
    const jumpToUnitStart = (unit) => {
        if (!unit) return;
        const start = parseDateSafe(unit.fechaInicio);

        if (start) {
            start.setHours(12, 0, 0, 0); // Force Noon
            const newYear = start.getFullYear();
            const newWeek = getWeekNumber(start);

            setLocalYear(newYear);
            setLocalWeek(newWeek);
        }
    };

    // Reset local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalYear(selectedYear);
            setLocalWeek(selectedWeek);

            if (initialUnitId) {
                setSelectedUnitId(initialUnitId);
                // Pre-fill inputs from Unit
                const u = units.find(un => un.id === initialUnitId);
                if (u) {
                    setFormData(prev => ({
                        ...prev,
                        curso: u.curso,
                        asignatura: u.asignatura,
                        // Optional: Calculate quantity based on weeks? 
                        // For now just pre-fill context.
                        cantidad: '4' // Default or calculated? Let's leave it editable but maybe hint?
                    }));
                }
            }
        }
    }, [isOpen, selectedYear, selectedWeek, initialUnitId, units]);

    // Fetch Config
    useEffect(() => {
        if (userId && localYear) {
            getSchoolYearConfig(userId, localYear).then(setConfig => setSchoolYearConfig(setConfig));
        }
    }, [userId, localYear]);

    // Helper: Is Holiday?
    const getExclusion = (date) => {
        if (!schoolYearConfig) return null;
        const toLocalISODate = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        };
        const dateStr = toLocalISODate(date);

        // Global bounds
        if (schoolYearConfig.schoolYearStart && dateStr < schoolYearConfig.schoolYearStart) return { title: 'Fuera de Año Escolar', type: 'out' };
        if (schoolYearConfig.schoolYearEnd && dateStr > schoolYearConfig.schoolYearEnd) return { title: 'Fuera de Año Escolar', type: 'out' };

        // Specific exclusions
        if (schoolYearConfig.excludedDates) {
            const found = schoolYearConfig.excludedDates.find(ed => {
                if (ed.date) return ed.date === dateStr;
                if (ed.start && ed.end) return dateStr >= ed.start && dateStr <= ed.end;
                return false;
            });
            if (found) return { title: found.title || 'Feriado', type: 'holiday' };
        }
        return null;
    };

    const isLockedMode = !!initialUnitId; // Helper boolean

    const handleWeekChange = (direction) => {
        let newDate = getStartDateOfWeek(localYear, localWeek);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setLocalYear(newDate.getFullYear());
        setLocalWeek(getWeekNumber(newDate));
    };

    const getWeekRangeString = () => {
        const start = getStartDateOfWeek(localYear, localWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const monthStart = start.toLocaleString('es-CL', { month: 'long' });
        const monthEnd = end.toLocaleString('es-CL', { month: 'long' });
        const dayStart = start.getDate();
        const dayEnd = end.getDate();

        if (monthStart === monthEnd) return `del ${dayStart} al ${dayEnd} de ${monthStart}`;
        return `del ${dayStart} de ${monthStart} al ${dayEnd} de ${monthEnd}`;
    };

    const getShortRange = () => {
        const start = getStartDateOfWeek(localYear, localWeek);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const fmt = (d) => d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '');
        return `${fmt(start)} - ${fmt(end)}`;
    };

    // 1. Get all compatible units for this Course/Subject
    const availableUnits = React.useMemo(() => {
        if (!formData.curso || !formData.asignatura || !units) return [];
        return units.filter(u => u.curso === formData.curso && u.asignatura === formData.asignatura);
    }, [formData.curso, formData.asignatura, units]);

    // 2. Identify the "Natural" unit for this date
    const naturalActiveUnit = React.useMemo(() => {
        if (availableUnits.length === 0) return null;
        const weekStart = getStartDateOfWeek(localYear, localWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return availableUnits.find(u => {
            const uStart = parseDateSafe(u.fechaInicio);
            const uEnd = parseDateSafe(u.fechaTermino);
            return uStart && uEnd && (uStart <= weekEnd && uEnd >= weekStart);
        });
    }, [availableUnits, localYear, localWeek]);


    // 4. Derivation & Splitting
    const selectedUnit = React.useMemo(() => {
        return units.find(u => u.id === selectedUnitId) || null;
    }, [selectedUnitId, units]);

    const isUnitAlignedWithWeek = React.useMemo(() => {
        if (!selectedUnit) return true;
        const start = parseDateSafe(selectedUnit.fechaInicio);
        const end = parseDateSafe(selectedUnit.fechaTermino);
        if (!start || !end) return false;

        const startWeek = getWeekNumber(start);
        const endWeek = getWeekNumber(end);

        if (start.getFullYear() !== localYear && end.getFullYear() !== localYear) return false;

        // Complex year span fallback
        if (start.getFullYear() !== end.getFullYear()) {
            const weekStart = getStartDateOfWeek(localYear, localWeek);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return (start <= weekEnd && end >= weekStart);
        }
        return (localWeek >= startWeek && localWeek <= endWeek);
    }, [selectedUnit, localYear, localWeek]);

    // SPLIT UNITS LOGIC
    const { currentUnits, otherUnits } = React.useMemo(() => {
        const current = [];
        const other = [];

        availableUnits.forEach(u => {
            const start = parseDateSafe(u.fechaInicio);
            const end = parseDateSafe(u.fechaTermino);
            if (!start || !end) {
                other.push(u); // Invalid dates go to bucket
                return;
            }

            const startWeek = getWeekNumber(start);
            const endWeek = getWeekNumber(end);

            // Check based on Year context + Week
            let isCurrent = false;

            // Simplified Intra-Year check
            if (u.fechaInicio.substring(0, 4) === u.fechaTermino.substring(0, 4)) {
                // Same year for unit
                // Check if localWeek matches
                isCurrent = (localWeek >= startWeek && localWeek <= endWeek);
                // Also ensure Years match (approx)
                if (Math.abs(start.getFullYear() - localYear) > 1) isCurrent = false;
            } else {
                // Cross Year - assume current if complex
                isCurrent = true;
            }

            if (isCurrent) current.push(u);
            else other.push(u);
        });

        current.sort((a, b) => a.numero - b.numero);
        other.sort((a, b) => a.numero - b.numero);

        return { currentUnits: current, otherUnits: other };
    }, [availableUnits, localWeek, localYear]);


    const asignaturasDisponibles = React.useMemo(() => {
        if (!formData.curso || !activeSchedule || !activeSchedule.scheduleData) return [];
        return Object.keys(activeSchedule.scheduleData[formData.curso] || {}).sort();
    }, [formData.curso, activeSchedule]);

    // Exact Quantity Logic (Counting real days in schedule - MIRRORED FROM UNITMODAL)
    useEffect(() => {
        if (selectedUnit && activeSchedule && formData.curso && formData.asignatura) {

            const startStr = selectedUnit.fechaInicio;
            const endStr = selectedUnit.fechaTermino;
            const start = parseDateSafe(startStr);
            const end = parseDateSafe(endStr);

            if (start && end) {
                let count = 0;
                let loopDate = new Date(startStr + 'T12:00:00');
                const endDate = new Date(endStr + 'T12:00:00');

                // Helper to check schedule for a specific date
                const hasClassOnDate = (date) => {
                    const dayOfWeek = date.getDay(); // 0=Sun
                    const blocks = activeSchedule.scheduleData?.[formData.curso]?.[formData.asignatura] || [];

                    // Check if any block matches this day
                    return blocks.some(b => {
                        let bDay = b.day || b.dia; // Handle format diffs
                        // Normalize bDay to 0-6
                        if (typeof bDay === 'string') {
                            const map = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Miercoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0 };
                            if (map[bDay] !== undefined) bDay = map[bDay];
                        }
                        return bDay === dayOfWeek;
                    });
                };

                while (loopDate <= endDate) {
                    // 1. Is it a class day?
                    if (hasClassOnDate(loopDate)) {
                        // 2. Is it excluded?
                        const excluded = getExclusion(loopDate);
                        if (!excluded) {
                            count++;
                        }
                    }
                    loopDate.setDate(loopDate.getDate() + 1);
                }

                // Update amount if changed
                setFormData(prev => {
                    if (prev.cantidad !== count.toString()) {
                        return { ...prev, cantidad: count.toString() };
                    }
                    return prev;
                });
            }
        }
    }, [selectedUnit, formData.curso, formData.asignatura, activeSchedule, schoolYearConfig]);

    useEffect(() => {
        if (formData.curso) {
            setFormData(prev => ({ ...prev, asignatura: asignaturasDisponibles[0] || '' }));
        }
    }, [formData.curso]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // MANUAL HANDLER with AUTO JUMP
    const handleUnitSelection = (e) => {
        const newUnitId = e.target.value;
        const targetUnit = units.find(u => u.id === newUnitId);

        if (targetUnit) {
            const start = parseDateSafe(targetUnit.fechaInicio);
            if (start) {
                start.setHours(12, 0, 0, 0);
                const newWeek = getWeekNumber(start);
                const newYear = start.getFullYear();

                // If not aligned, JUMP
                // Note: we check if unit is *aligned* or not. 
                // If it is in 'otherUnits' bucket, we DEFINITELY jump.
                // A simple integer check is sufficient.
                if (newWeek !== localWeek || newYear !== localYear) {
                    // AUTO JUMP
                    setLocalYear(newYear);
                    setLocalWeek(newWeek);
                }
            }
        }
        setSelectedUnitId(newUnitId);
    };

    const generatePrompt = () => {
        // Ultimate Safety Check
        if (selectedUnit && !isUnitAlignedWithWeek) {
            jumpToUnitStart(selectedUnit);
            setError('Detectamos un desfase de fechas. Hemos ajustado el calendario automáticamente a la fecha correcta. Por favor, haz clic en Siguiente de nuevo.');
            return;
        }

        if (!formData.curso || !formData.asignatura || (!selectedUnitId && !formData.prompt)) {
            setError('Por favor, completa los campos requeridos.');
            return;
        }
        setError('');

        let inferredDuration = 90;
        const relevantSchedule = schedules?.find(s => s.scheduleData?.[formData.curso]?.[formData.asignatura]);
        const bloquesAsignatura = relevantSchedule?.scheduleData?.[formData.curso]?.[formData.asignatura];
        if (bloquesAsignatura && Array.isArray(bloquesAsignatura) && bloquesAsignatura.length > 0) {
            inferredDuration = parseInt(bloquesAsignatura[0].duration) || 90;
        }

        const tiempos = inferredDuration === 90
            ? "Inicio: 15 min, Desarrollo: 30 min, Aplicación: 30 min, Cierre: 15 min"
            : inferredDuration === 45
                ? "Inicio: 10 min, Desarrollo: 15 min, Aplicación: 10 min, Cierre: 10 min"
                : `Inicio: ${Math.round(inferredDuration * 0.15)} min, Desarrollo: ${Math.round(inferredDuration * 0.45)} min, Aplicación: ${Math.round(inferredDuration * 0.25)} min, Cierre: ${Math.round(inferredDuration * 0.15)} min`;

        let contextString = "";
        let mainInstruction = formData.prompt;

        if (selectedUnit) {
            contextString = `
CONTEXTO CURRICULAR OBLIGATORIO (Usando Unidad Planificada: "${selectedUnit.nombre}"):
- Objetivo General de Unidad: ${selectedUnit.objetivos || 'No especificado'}
- OATs (Transversales): ${selectedUnit.oat?.join(', ') || 'Ninguno'}
- Habilidades: ${selectedUnit.habilidades?.join(', ') || 'Ninguna'}
- Ejes Temáticos: ${selectedUnit.ejes?.join(', ') || 'Ninguno'}
- Detalles Planificados (OAs Prioritarios):
${selectedUnit.detalles?.map(d => `  * ${d.oa} (Indicadores: ${d.indicadores?.join(', ')})`).join('\n') || '  * Sin detalles específicos.'}

INSTRUCCIÓN: Genera una planificación secuencial y coherente para cubrir estos objetivos.
`;
            if (formData.prompt && formData.prompt.trim()) {
                mainInstruction = `INSTRUCCIONES ADICIONALES DEL DOCENTE:\n${formData.prompt}`;
            } else {
                mainInstruction = "Diseña la secuencia óptima de clases para lograr los objetivos de esta unidad.";
            }
        }

        const finalPrompt = `
rol: Actúa como un experto en Diseño Universal para el Aprendizaje (DUA) y especialista en el Currículum Nacional de Chile del MINEDUC.

Tarea: Tu misión es planificar experiencias de aprendizaje, unidades o clases. Para ello, debes utilizar exclusivamente las Bases Curriculares vigentes según el nivel solicitado:
- Parvularia: Decreto 481 (2018).
- 1° a 6° Básico: Decretos 433 y 439 (2012).
- 7° Básico a 2° Medio: Decretos 614 (2013) y 369 (2015).
- 3° y 4° Medio: Decreto 193 (2019).

Reglas de Planificación:
1. Filtro de Nivel: Antes de proponer un Objetivo de Aprendizaje (OA), verifica que corresponda estrictamente al nivel y asignatura solicitada. No mezcles OAs de básica en educación media ni viceversa.
2. Estructura del OA: Cada OA seleccionado debe incluir su número y el texto íntegro según el documento oficial.
3. Vinculación: Relaciona el OA con los Indicadores de Evaluación sugeridos por el MINEDUC y los Objetivos de Aprendizaje Transversales (OAT).
4. Contexto Nacional: Considera siempre el calendario escolar chileno y las orientaciones pedagógicas actuales (como la Reactivación Educativa).
5. Contexto del Aula (IMPORTANTE): Si a continuación se describe un contexto específico (características de estudiantes, materiales, etc.), ESTO DEBE GUIAR toda la estrategia didáctica.

INFORMACIÓN DE LA SOLICITUD:
- Curso: "${formData.curso}"
- Asignatura: "${formData.asignatura}"
- Cantidad de Clases: ${formData.cantidad}
- Duración por clase: ${inferredDuration} minutos.

${contextString}

CONTEXTO Y REQUERIMIENTOS ESPECÍFICOS DEL DOCENTE (Características de estudiantes, materiales, enfoque, etc.):
"${formData.prompt || 'Ninguno especificado. Asume un contexto estándar y variado.'}"

INSTRUCCIONES DE FORMATO DE CLASE (OBLIGATORIO):
Cada clase debe estar detallada paso a paso, como un guion para el docente, dividida en:
1. INICIO: Activación de conocimientos previos y motivación.
2. DESARROLLO: Explicación de conceptos, modelamiento y práctica guiada.
3. APLICACIÓN: Práctica independiente o grupal (CRUCIAL).
4. CIERRE: Consolidación y evaluación formativa.

Distribución de tiempo sugerida: ${tiempos}.
IMPORTANTE: Inicia cada sección indicando el tiempo, ej: "(15 min): ...".

Requisitos de Calidad de la Respuesta:
1. Lenguaje: Español, tono profesional y motivador.
2. Formato de Salida: ÚNICAMENTE un array JSON válido (sin markdown).
3. Estructura del JSON: Array de objetos con claves: "objetivo" (string), "inicio" (string), "desarrollo" (string), "aplicacion" (string), "cierre" (string).`;

        setGeneratedPrompt(finalPrompt.trim());

        // AUTO-COPY AND ADVANCE
        navigator.clipboard.writeText(finalPrompt.trim())
            .then(() => {
                setIsCopied(true); // Reusing this for the toast
                setStep(3); // Jump directly to paste
                setTimeout(() => setIsCopied(false), 4000); // 4 seconds toast
            })
            .catch(err => {
                console.error("Error al copiar:", err);
                setError('No se pudo copiar automáticamente. Por favor copia el texto manualmente en el paso anterior.');
                setStep(2); // Fallback to manual copy step
            });
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedPrompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            setError('Error al copiar al portapapeles.');
        }
    };

    const handleProcessJson = () => {
        try {
            setError('');
            const jsonMatch = jsonResponse.match(/\[[\s\S]*\]/);
            let cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse.trim();
            if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '');
            if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '');
            cleanJson = cleanJson.replace(/,\s*([\]}])/g, '$1');

            const parsedClasses = JSON.parse(cleanJson);
            if (!Array.isArray(parsedClasses)) throw new Error("La respuesta no es un lista (array) de clases.");

            onClassesGenerated({
                curso: formData.curso,
                asignatura: formData.asignatura,
                clases: parsedClasses,
                year: localYear,
                week: localWeek,
                unitLimitDate: selectedUnit?.fechaTermino
            });
            onClose();
            setStep(1);
            setFormData({ ...formData, prompt: '' });
            setJsonResponse('');
        } catch (e) {
            console.error("Error parsing JSON:", e);
            setError('El texto pegado no es un JSON válido. Asegúrate de copiar solo la respuesta de la IA.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">

            {/* FLOATING TOAST MESSAGE */}
            {isCopied && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl z-[60] flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
                    <div className="bg-white/20 p-1 rounded-full"><Check size={18} strokeWidth={3} /></div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">¡Prompt copiado al portapapeles!</span>
                        <span className="text-xs opacity-90">Ve a tu IA favorita y pega (Ctrl+V)</span>
                    </div>
                </div>
            )}

            <div className="card-glass rounded-2xl p-4 md:p-6 w-full max-w-3xl text-slate-100 flex flex-col max-h-[90vh] shadow-2xl border border-slate-700/50 relative">
                {/* ... (Header omitted) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-700/50 pb-4 gap-4 pt-6 md:pt-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400">
                            {/* Title Content if any */}
                        </h3>
                        {/* Date Nav */}
                        <div className="flex items-center bg-slate-800 rounded-full p-1 pl-1 pr-1 border border-slate-700 shadow-sm w-full md:w-auto justify-between md:justify-start">
                            <button
                                onClick={() => handleWeekChange(-1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex flex-col md:flex-row items-center px-2 md:px-4 gap-0 md:gap-3 text-sm font-medium text-slate-300 select-none border-l border-r border-slate-700/50 mx-1 h-auto md:h-5 leading-tight md:leading-none py-1 md:py-0">
                                <span className="font-bold text-white whitespace-nowrap text-xs md:text-sm">Semana {localWeek}</span>
                                <span className="hidden md:inline text-slate-600">|</span>
                                <span className="uppercase text-[10px] md:text-xs tracking-wider whitespace-nowrap opacity-80">{getShortRange()}</span>
                            </div>

                            <button
                                onClick={() => handleWeekChange(1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute top-3 right-3 md:static p-2 rounded-full hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white z-10 bg-[#0f1221]/80 backdrop-blur-sm md:bg-transparent"><X size={24} /></button>
                </div>

                <div className="flex items-center justify-between mb-8 px-8 relative">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-700 -z-10"></div>
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-800 text-slate-500 border border-slate-600'}`}>
                            {s}
                        </div>
                    ))}
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {/* STEP 1: CONFIGURATION */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* ... (Fields omitted, keep existing) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select
                                    className={`w-full p-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all ${isLockedMode ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-900/50 text-slate-100'}`}
                                    value={formData.curso}
                                    onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                                    disabled={isLockedMode}
                                >
                                    <option value="">Curso</option>
                                    {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                <select
                                    className={`w-full p-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all ${isLockedMode ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-slate-900/50 text-slate-100'}`}
                                    value={formData.asignatura}
                                    onChange={(e) => setFormData({ ...formData, asignatura: e.target.value })}
                                    disabled={!formData.curso || isLockedMode}
                                >
                                    <option value="">Asignatura</option>
                                    {asignaturasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>

                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        className={`w-full p-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-center ${isLockedMode ? 'bg-slate-800/50 text-slate-500' : 'bg-slate-900/50 text-slate-100'}`}
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                        placeholder="Cant."
                                        readOnly={isLockedMode}
                                        title={isLockedMode ? "Cantidad determinada por la unidad" : "Cantidad de clases"}
                                    />
                                    <span className="absolute right-3 top-3 text-xs text-slate-500 font-bold tracking-wider">CLASES</span>
                                </div>
                            </div>

                            {/* SMART UNIT SELECTOR */}
                            {isLockedMode && (
                                <div className={`p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 relative ${selectedUnitId ? 'bg-indigo-900/30 border-indigo-500/30' : 'bg-slate-800 border-slate-700'}`}>
                                    <div className={`p-4 rounded-xl border transition-all ${selectedUnit ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/30 border-slate-700 border-dashed'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles size={16} className="text-indigo-400" />
                                            <label className="text-xs font-bold text-indigo-300 tracking-wider uppercase">
                                                UNIDAD SELECCIONADA (BLOQUEADA)
                                            </label>
                                        </div>
                                        {selectedUnit ? (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-white font-medium text-lg">Unidad {selectedUnit.numero}: {selectedUnit.nombre}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                        <Calendar size={12} /> Inicio: {selectedUnit.fechaInicio}
                                                        <span className="bg-indigo-500/20 text-indigo-300 px-2 rounded-full">Modo Planificación Guiada</span>
                                                    </div>
                                                </div>
                                                <div className="text-slate-500">
                                                    <Check size={24} className="text-green-500" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-slate-400 text-sm">Cargando unidad...</div>
                                        )}
                                        {selectedUnit && (
                                            <div className="mt-3 pt-3 border-t border-indigo-500/20 text-xs text-indigo-200/70 italic">
                                                Se generarán clases para cubrir: {selectedUnit.objetivos || selectedUnit.nombre}...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <textarea
                                name="prompt"
                                value={formData.prompt}
                                onChange={handleChange}
                                placeholder={selectedUnit ? "Opcional: Añade instrucciones extra..." : "Describe detalladamente qué quieres enseñar en estas clases. Ej: 'Características de los seres vivos y sus necesidades...' (También puedes incluir características de los estudiantes)."}
                                className={`w-full p-4 rounded-xl bg-slate-900/50 border min-h-[150px] resize-y focus:border-purple-500 outline-none transition-all text-sm leading-relaxed ${selectedUnit ? 'border-indigo-500/30 placeholder-indigo-300/50' : 'border-slate-700/50 mt-4'}`}
                            ></textarea>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={generatePrompt}
                                    className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all btn-primary shadow-indigo-500/20 hover:scale-105 active:scale-95 text-sm sm:text-base"
                                >
                                    Siguiente <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: COPY PROMPT (Fallback or Manual Review) */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-200 text-sm">
                                1. Copia este texto.<br />
                                2. Ve a Gemini, ChatGPT o tu IA favorita.<br />
                                3. Pega el texto y genera la respuesta.
                            </div>
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={generatedPrompt}
                                    className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 min-h-[200px] text-xs font-mono text-slate-300 focus:outline-none"
                                ></textarea>
                                {isCopied ? (
                                    <button
                                        className="absolute top-2 right-2 px-3 py-1.5 bg-green-500 text-white rounded-lg flex items-center gap-2 font-bold text-xs animate-in zoom-in duration-300 pointer-events-none"
                                    >
                                        <Check size={14} /> ¡Copiado!
                                    </button>
                                ) : (
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-indigo-600 hover:scale-110 active:scale-95 rounded-lg text-white transition-all shadow-lg hover:shadow-indigo-500/50"
                                    >
                                        <Copy size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm">Atrás</button>
                                <button onClick={() => setStep(3)} className="btn-primary px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all text-sm sm:text-base">
                                    Ya tengo la respuesta <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PASTE RESPONSE - ENHANCED INSTRUCTION */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">

                            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 p-5 rounded-xl text-emerald-100 shadow-lg">
                                <div className="flex items-start gap-4">
                                    <div className="bg-emerald-500/20 p-2 rounded-lg mt-1">
                                        <ClipboardPaste size={24} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-emerald-300 mb-1">¡Todo listo para pegar!</h4>
                                        <p className="text-sm opacity-90 leading-relaxed">
                                            El prompt ya está en tu portapapeles. Ve a tu IA, pega (Ctrl+V) y espera la respuesta.
                                            <br />
                                            <span className="font-semibold text-emerald-200">Cuando tengas la respuesta JSON, pégala en el recuadro de abajo.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <textarea
                                    value={jsonResponse}
                                    onChange={(e) => setJsonResponse(e.target.value)}
                                    placeholder='Clic aquí y presiona Ctrl + V para pegar la respuesta de la IA...'
                                    className="w-full p-6 rounded-xl bg-slate-900 border border-slate-700 min-h-[250px] font-mono text-sm resize-y focus:border-purple-500 outline-none transition-all shadow-inner placeholder:text-slate-600"
                                ></textarea>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-between pt-6 gap-3">
                                {/* Back to step 2 in case user needs to copy again manually */}
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center justify-center gap-2 text-slate-400 hover:text-white px-4 py-2 hover:bg-slate-800 rounded-lg transition-all text-sm"
                                >
                                    <ChevronLeft size={16} /> Volver a copiar prompt
                                </button>

                                <button
                                    onClick={handleProcessJson}
                                    disabled={!jsonResponse}
                                    className={`btn-accent px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all text-base ${!jsonResponse ? 'opacity-50 cursor-not-allowed grayscale' : 'shadow-purple-500/20 hover:scale-105 active:scale-95'}`}
                                >
                                    <Download size={20} />
                                    Procesar y Crear Clases
                                </button>
                            </div>
                        </div>
                    )}


                </div>
                {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm mt-4 text-center animate-in fade-in slide-in-from-bottom-2">{error}</div>}
            </div>
        </div>
    );
};

export default AIGenerationModal;
