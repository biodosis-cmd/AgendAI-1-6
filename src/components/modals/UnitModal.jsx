import React, { useState, useEffect, useMemo } from 'react';
import { db, getSchoolYearConfig } from '@/services/db';
import { X, Loader2, Sparkles, ArrowRight, ClipboardPaste, Brain, Calendar, Check, AlertTriangle, Lock, Save, Plus } from 'lucide-react';

const UnitModal = ({ isOpen, onClose, userId, unitToEdit, selectedYear, selectedWeek, schedules, units = [] }) => {

    // --- 1. DATA PREPARATION ---

    // Aggregate courses/subjects from schedule
    const { cursosDisponibles, subjectsMap } = useMemo(() => {
        const courses = new Set();
        const subjectsMap = {};
        const activeSchedule = schedules?.[0]?.scheduleData || {};

        if (activeSchedule) {
            Object.keys(activeSchedule).forEach(curso => {
                courses.add(curso);
                if (!subjectsMap[curso]) subjectsMap[curso] = new Set();
                Object.keys(activeSchedule[curso]).forEach(asig => subjectsMap[curso].add(asig));
            });
        }

        const COURSE_ORDER = [
            'NT1', 'NT2', '1ro Básico', '2do Básico', '3ro Básico', '4to Básico',
            '5to Básico', '6to Básico', '7mo Básico', '8vo Básico',
            '1ro Medio', '2do Medio', '3ro Medio', '4to Medio'
        ];

        return {
            cursosDisponibles: Array.from(courses).sort((a, b) => {
                const ia = COURSE_ORDER.indexOf(a);
                const ib = COURSE_ORDER.indexOf(b);
                if (ia !== -1 && ib !== -1) return ia - ib;
                return a.localeCompare(b);
            }),
            subjectsMap
        };
    }, [schedules]);

    // Initial State
    const initialFormState = {
        curso: '',
        asignatura: '',
        numero: 1,
        nombre: '',
        fechaInicio: '',
        fechaTermino: '',
        objetivos: '',
        oat: [],
        habilidades: [],
        ejes: [],
        tipoEvaluacion: '',
        detalles: []
    };

    const [formData, setFormData] = useState(initialFormState);
    const [schoolYearConfig, setSchoolYearConfig] = useState(null);
    const [step, setStep] = useState(1); // 1: Config/Calendar, 2: AI Prompt, 3: Paste JSON
    const [reviewTab, setReviewTab] = useState('content'); // 'content' | 'calendar'
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // Fetch Config
    useEffect(() => {
        if (userId && selectedYear) {
            getSchoolYearConfig(userId, selectedYear).then(setConfig => setSchoolYearConfig(setConfig));
        }
    }, [userId, selectedYear]);

    // Initialize Form
    useEffect(() => {
        setJsonInput('');
        if (unitToEdit) {
            setFormData({ ...initialFormState, ...unitToEdit });
            setStep(4);
        } else {
            setFormData(initialFormState);
            setStep(1);
        }
    }, [unitToEdit, isOpen]);

    // --- 2. CALENDAR LOGIC ---

    // Generate Calendar Grid (Whole Year or relevant range)
    // We'll show 12 months for the selected year
    const months = useMemo(() => {
        if (!selectedYear) return [];
        return Array.from({ length: 12 }, (_, i) => new Date(selectedYear, i, 1));
    }, [selectedYear]);

    // Helper: Get Class Minutes for a Day
    const getClassMinutes = (date, curso, asignatura) => {
        if (!curso || !asignatura) return 0;
        const activeSchedule = schedules?.[0]?.scheduleData;
        if (!activeSchedule?.[curso]?.[asignatura]) return 0;

        const blocks = activeSchedule[curso][asignatura];
        const dayOfWeek = date.getDay(); // 0-6

        // Map schedule 'dia' (which might be "Lunes" or 1) to 0-6
        const dayMap = { 'Domingo': 0, 'Sunday': 0, 'Lunes': 1, 'Monday': 1, 'Martes': 2, 'Tuesday': 2, 'Miércoles': 3, 'Miercoles': 3, 'Wednesday': 3, 'Jueves': 4, 'Thursday': 4, 'Viernes': 5, 'Friday': 5, 'Sábado': 6, 'Saturday': 6 };

        // Filter blocks for this day
        const dayBlocks = blocks.filter(b => {
            const d = b.dia !== undefined ? b.dia : b.day;
            const mapped = typeof d === 'string' ? dayMap[d] : d;
            return mapped === dayOfWeek;
        });

        // Sum duration
        return dayBlocks.reduce((sum, b) => sum + (parseInt(b.duration) || 0), 0);
    };

    // Helper: Is Valid Class Day? (Wrapper for compatibility)
    const isClassDay = (date, curso, asignatura) => getClassMinutes(date, curso, asignatura) > 0;

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

    // Helper: Is Blocked by Other Unit?
    const getBlockedByUnit = (date) => {
        if (!formData.curso || !formData.asignatura) return null;
        const dateTime = date.getTime();

        const found = units.find(u => {
            if (u.id === unitToEdit?.id) return false; // Ignore self
            if (u.curso !== formData.curso || u.asignatura !== formData.asignatura) return false;

            // Parse local dates carefully
            const start = new Date(u.fechaInicio + 'T00:00:00');
            const end = new Date(u.fechaTermino + 'T23:59:59'); // End of day

            return dateTime >= start.getTime() && dateTime <= end.getTime();
        });

        return found ? { title: `Unidad ${found.numero}`, id: found.id } : null;
    };


    // CALENDAR INTERACTION
    const handleDateClick = (date) => {
        const dateStr = date.toISOString().split('T')[0];

        if (!formData.fechaInicio || (formData.fechaInicio && formData.fechaTermino)) {
            // Start new selection
            setFormData(prev => ({ ...prev, fechaInicio: dateStr, fechaTermino: '' }));
        } else {
            // Complete selection
            // Ensure start < end
            if (new Date(dateStr) < new Date(formData.fechaInicio)) {
                setFormData(prev => ({ ...prev, fechaInicio: dateStr, fechaTermino: formData.fechaInicio }));
            } else {
                setFormData(prev => ({ ...prev, fechaTermino: dateStr }));
            }
        }
    };

    // CALCULATE STATS
    const stats = useMemo(() => {
        if (!formData.fechaInicio || !formData.fechaTermino) return null;
        let valid = 0;
        let excluded = 0;
        let blocked = 0;
        let totalMinutes = 0;

        const start = new Date(formData.fechaInicio + 'T00:00:00');
        const end = new Date(formData.fechaTermino + 'T00:00:00');
        const cur = new Date(start);

        while (cur <= end) {
            const minutes = getClassMinutes(cur, formData.curso, formData.asignatura);
            const exc = getExclusion(cur);
            const blk = getBlockedByUnit(cur);

            if (minutes > 0) {
                if (exc) excluded++;
                else if (blk) blocked++;
                else {
                    valid++;
                    totalMinutes += minutes;
                }
            }
            cur.setDate(cur.getDate() + 1);
        }

        // Calculate Pedagogical Hours (45 min = 1 hour)
        // Round to 1 decimal if needed, or integer? Usually integers or 0.5. Let's start with 1 decimal.
        const pedagogicalHours = parseFloat((totalMinutes / 45).toFixed(1));

        return { valid, excluded, blocked, pedagogicalHours };
    }, [formData.fechaInicio, formData.fechaTermino, formData.curso, formData.asignatura, schoolYearConfig, units]);


    // --- 3. AI & SUBMIT LOGIC ---
    const generatePrompt = () => {
        return `
ROL DE FORMATO (OBLIGATORIO): Actúa como una API REST estricta. Tu única función es recibir datos y devolver un JSON puro. NO hables, NO expliques, NO uses markdown.

ROL PEDAGÓGICO (EL EXPERTO): Actúa como un Especialista en Currículum Nacional Chileno y Experto en Aprendizaje Profundo (Deep Learning - Michael Fullan).

Tarea: Diseñar Planificación de Unidad Didáctica.
Curso: "${formData.curso}"
Asignatura: "${formData.asignatura}"
Unidad N°: ${formData.numero}
Título: "${formData.nombre}"
Duración: ${formData.fechaInicio} al ${formData.fechaTermino}
Contexto Temporal: ${stats.valid} clases reales totales (${stats.pedagogicalHours} horas pedagógicas totales para esta unidad).
${formData.objetivos ? `Contexto Adicional: "${formData.objetivos}"` : ''}

MARCO DE HABILIDADES DEL SIGLO XXI (OBLIGATORIO):
Debes integrar explícitamente competencias del modelo de "Aprendizaje Profundo" (Las 6C).

INSTRUCCIONES DE TIEMPO (CRÍTICO):
Debes distribuir las ${stats.pedagogicalHours} horas pedagógicas disponibles entre los Objetivos de Aprendizaje (OAs) seleccionados, considerando su complejidad.
Formato obligatorio para el campo "tiempo": "X semanas (Y horas pedagógicas)". Asegúrate de que la suma total de horas pedagógicas sea aproximada a ${stats.pedagogicalHours}.

INSTRUCCIONES DE FORMATO (OBLIGATORIO):
Respuesta UNICAMENTE JSON válido:
{
  "objetivos": "Descripción técnica de los propósitos de la unidad",
  "oat": ["OAT seleccionado"],
  "habilidades": ["Habilidad del Siglo XXI seleccionada"],
  "ejes": ["Eje temático"],
  "tipoEvaluacion": "${formData.tipoEvaluacion || 'Sumativa'}",
  "detalles": [
    {
      "oa": "Código y descripción OA seleccionado",
      "tiempo": "Ej: 2 semanas (6 horas pedagógicas)",
      "indicadores": ["Indicador de evaluación 1", "Indicador de evaluación 2"],
      "instrumento": "Rúbrica o Lista de Cotejo"
    }
  ]
}

IMPORTANTE: Revisa tu respuesta paso a paso. Asegúrate de que no haya comas al final de las listas (trailing commas) antes de responder.`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatePrompt().trim()).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
            setStep(3);
        });
    };

    const handleProcess = () => {
        try {
            // 1. Sanitización Robusta (Neuro-Cleaner)
            let clean = jsonInput
                .replace(/```json/g, '')  // Quitar markdown
                .replace(/```/g, '')
                .trim();

            // Reparar Trailing Commas (comas antes de } o ])
            clean = clean.replace(/,(\s*[}\]])/g, '$1');

            const data = JSON.parse(clean);

            // 2. Smart Adapter (Detector de Flujo)
            if (Array.isArray(data)) {
                // MODO CLASES RÁPIDAS (Array de Clases)
                // Convertimos cada clase en un detalle de la unidad
                const newDetalles = data.map(clase => ({
                    oa: clase.objetivo || clase.OA || clase.description || "Objetivo de clase importada",
                    tiempo: clase.duracion || "1 clase", // Intentar extraer duración
                    instrumento: "Observación directa",
                    indicadores: [],
                    // Guardamos el resto de la data (inicio, desarrollo, cierre) en el OA para no perderla,
                    // o podríamos dejarlo solo en el objetivo si el usuario prefiere limpieza.
                    // Por ahora, priorizamos el objetivo.
                }));

                setFormData(prev => ({
                    ...prev,
                    detalles: [...(prev.detalles || []), ...newDetalles] // Adjuntamos a lo existente
                }));
                // Feedback visual sutil (opcional, por ahora solo avanzamos)
            } else {
                // MODO UNIDAD ESTÁNDAR (Objeto Completo)
                // Reemplazo total como funcionaba antes
                setFormData(prev => ({ ...prev, ...data }));
            }

            setStep(4); // Ir al Editor
            setError('');
        } catch (e) {
            console.error(e);
            setError('Error al procesar JSON: ' + e.message);
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            if (unitToEdit) await db.units.update(unitToEdit.id, { ...formData, userId });
            else await db.units.add({ ...formData, userId });
            onClose();
        } catch (e) {
            console.error(e);
            setError('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for List Management
    const ListManager = ({ title, items, onChange, colorClass }) => (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <label className={`block text-xs font-bold ${colorClass} uppercase mb-3 flex justify-between items-center`}>
                {title}
                <span className="text-slate-500 text-[10px] font-normal">{items.length} ítems</span>
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 group">
                        <textarea
                            rows={1}
                            value={item}
                            onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx] = e.target.value;
                                onChange(newItems);
                            }}
                            className="flex-1 bg-slate-950 border border-slate-700/50 rounded-lg py-2 px-3 text-xs text-slate-300 focus:text-white resize-y min-h-[40px] focus:min-h-[60px] transition-all"
                        />
                        <button
                            onClick={() => {
                                const newItems = items.filter((_, i) => i !== idx);
                                onChange(newItems);
                            }}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-2"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={() => onChange([...items, ""])}
                className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-lg border border-dashed border-slate-700 transition-colors"
            >
                <Plus size={12} /> Añadir {title}
            </button>
        </div>
    );


    const renderCalendarView = (readOnly = false) => (
        <div className="space-y-8 pb-20">
            {months.map(month => (
                <div key={month.toISOString()} className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-4">
                    <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-4 px-2 border-l-2 border-indigo-500 pl-2">
                        {month.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="grid grid-cols-7 gap-1">
                        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
                            <div key={d} className="text-center text-[10px] text-slate-600 font-bold uppercase py-1">{d}</div>
                        ))}

                        {/* Padding for first day (Monday start) */}
                        {Array.from({ length: (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`pad-${i}`} />
                        ))}

                        {/* Days */}
                        {Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
                            const dateStr = date.toISOString().split('T')[0];

                            const isExclusion = getExclusion(date);
                            const isBlocked = getBlockedByUnit(date);
                            const isCourseDay = isClassDay(date, formData.curso, formData.asignatura);

                            // Check Selection
                            let isSelected = false;
                            let isRange = false;
                            if (formData.fechaInicio) {
                                if (formData.fechaInicio === dateStr) isSelected = true;
                                else if (formData.fechaTermino) {
                                    if (formData.fechaTermino === dateStr) isSelected = true;
                                    if (dateStr > formData.fechaInicio && dateStr < formData.fechaTermino) isRange = true;
                                }
                            }

                            let bgClass = "bg-slate-950 hover:bg-slate-800";
                            let textClass = "text-slate-600";
                            let borderClass = "border border-slate-800";
                            let cursorClass = readOnly ? "cursor-default" : "cursor-pointer";

                            if (isExclusion) {
                                bgClass = "bg-slate-950 opacity-40";
                                textClass = "text-slate-600";
                                cursorClass = "cursor-not-allowed"; // Allow click? Maybe not.
                            } else if (isBlocked) {
                                bgClass = "bg-blue-900/20";
                                borderClass = "border border-blue-500/30";
                                textClass = "text-blue-400";
                            }

                            if (isSelected) {
                                bgClass = "bg-indigo-600 shadow-lg shadow-indigo-500/50 z-10 scale-105";
                                textClass = "text-white font-bold";
                                borderClass = "border-transparent";
                            } else if (isRange) {
                                bgClass = "bg-indigo-500/10";
                                borderClass = "border-y border-indigo-500/30";
                            }

                            return (
                                <div
                                    key={i}
                                    onClick={() => !readOnly && !isExclusion && !isBlocked && handleDateClick(date)}
                                    className={`relative h-20 rounded-xl p-2 transition-all flex flex-col justify-between group ${bgClass} ${borderClass} ${cursorClass}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`text-xs ${textClass}`}>{i + 1}</span>
                                    </div>

                                    {/* Status Indicators (Bottom) */}
                                    {isCourseDay && !isExclusion && !isBlocked && (
                                        <div className="flex justify-center pb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                        </div>
                                    )}

                                    {isExclusion && (
                                        <div className="text-[9px] leading-tight text-red-500/70 font-medium truncate">{isExclusion.title}</div>
                                    )}
                                    {isBlocked && (
                                        <div className="flex items-center gap-1 text-[9px] text-blue-300/70 truncate">
                                            <Lock size={8} /> {isBlocked.title}
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    // Mobile Tab State
    const [mobileTab, setMobileTab] = useState('form'); // 'form' | 'visual'

    // Auto-switch mobile tab on step change
    useEffect(() => {
        if (step === 2 || step === 3) {
            setMobileTab('visual');
        }
    }, [step]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex justify-center items-center z-50 p-4">
            <div className="bg-[#0f1221] border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Sparkles className="text-indigo-400" /> Nueva Unidad
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white flex-shrink-0"><X /></button>
                </div>

                {/* MOBILE TABS (Visible only on mobile) */}
                <div className="md:hidden flex border-b border-slate-800 bg-slate-900/30">
                    <button
                        onClick={() => setMobileTab('form')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mobileTab === 'form' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Datos
                    </button>
                    <button
                        onClick={() => setMobileTab('visual')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mobileTab === 'visual' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        {step === 1 ? 'Calendario' : step === 4 ? 'Editor' : 'IA Prompt'}
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-grow flex overflow-hidden relative">

                    {/* LEFT PANEL: CONFIG & PREVIEW */}
                    <div className={`
                        w-full md:w-1/3 md:min-w-[350px] bg-slate-900/30 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar
                        ${mobileTab === 'form' ? 'flex' : 'hidden md:flex'}
                    `}>

                        {/* Course Selector */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curso y Asignatura</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select value={formData.curso} onChange={e => setFormData(p => ({ ...p, curso: e.target.value, asignatura: '' }))} className="bg-slate-800 border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-indigo-500">
                                        <option value="">Curso...</option>
                                        {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select value={formData.asignatura} onChange={e => setFormData(p => ({ ...p, asignatura: e.target.value }))} disabled={!formData.curso} className="bg-slate-800 border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-indigo-500">
                                        <option value="">Asignatura...</option>
                                        {formData.curso && subjectsMap[formData.curso] ? Array.from(subjectsMap[formData.curso]).map(a => <option key={a} value={a}>{a}</option>) : null}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalles Unidad</label>
                                <div className="flex gap-2">
                                    <input type="number" min="1" value={formData.numero} onChange={e => setFormData(p => ({ ...p, numero: e.target.value }))} className="w-16 bg-slate-800 border-slate-700 rounded-lg p-2 text-sm text-center font-bold text-white" placeholder="#" />
                                    <input type="text" value={formData.nombre} onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))} className="flex-1 bg-slate-800 border-slate-700 rounded-lg p-2 text-sm text-white" placeholder="Título de la Unidad" />
                                </div>
                                <input type="text" value={formData.tipoEvaluacion} onChange={e => setFormData(p => ({ ...p, tipoEvaluacion: e.target.value }))} className="w-full bg-slate-800 border-slate-700 rounded-lg p-2 text-sm text-white" placeholder="Tipo de Evaluación (ej: Sumativa, Formativa, Mixta...)" />
                                <textarea value={formData.objetivos} onChange={e => setFormData(p => ({ ...p, objetivos: e.target.value }))} className="w-full h-24 bg-slate-800 border-slate-700 rounded-lg p-2 text-sm text-white resize-none" placeholder="Contexto u objetivos específicos para la IA..." />
                            </div>
                        </div>

                        {/* STATS CARD */}
                        {stats && (
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Calendar size={12} /> Resumen de Fechas</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Inicio:</span>
                                        <span className="text-white font-mono">{formData.fechaInicio || '--'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Término:</span>
                                        <span className="text-white font-mono">{formData.fechaTermino || '--'}</span>
                                    </div>
                                    <div className="h-px bg-slate-700 my-2" />
                                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                                        <span>Clases Reales:</span>
                                        <span className="text-lg">{stats.valid}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-indigo-400 font-bold border-t border-slate-700/50 pt-1 mt-1">
                                        <span>Horas Pedagógicas:</span>
                                        <span className="text-lg">{stats.pedagogicalHours} hrs</span>
                                    </div>
                                    {stats.excluded > 0 && (
                                        <div className="flex justify-between items-center text-amber-400 text-xs mt-2">
                                            <span>Feriados (Ignorados):</span>
                                            <span>{stats.excluded}</span>
                                        </div>
                                    )}
                                    {stats.blocked > 0 && (
                                        <div className="flex justify-between items-center text-red-400 text-xs font-bold">
                                            <span>Conflictos:</span>
                                            <span>{stats.blocked}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
                            {step === 1 && (
                                <>
                                    <button onClick={() => setStep(2)} disabled={!stats?.valid || !formData.nombre} className="w-full btn-primary py-3 rounded-xl flex justify-center items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                                        Siguiente: Configurar IA <ArrowRight size={18} />
                                    </button>
                                    {/* Direct jump to Editor only if editing */}
                                    {unitToEdit && (formData.detalles?.length > 0 || formData.objetivos) && (
                                        <button onClick={() => setStep(4)} className="w-full py-3 text-indigo-400 hover:bg-slate-800/50 rounded-xl transition-all text-sm font-bold flex justify-center items-center gap-2 border border-transparent hover:border-indigo-500/30">
                                            Ir al Editor de Planificación <ClipboardPaste size={16} />
                                        </button>
                                    )}
                                </>
                            )}
                            {step === 4 && (
                                <button onClick={handleSubmit} disabled={isSaving} className="w-full btn-primary py-3 rounded-xl flex justify-center items-center gap-2 font-bold shadow-lg shadow-indigo-500/20">
                                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                                    Guardar Unidad
                                </button>
                            )}
                        </div>

                    </div>

                    {/* RIGHT PANEL: VISUAL CALENDAR & EDITOR */}
                    <div className={`
                        flex-1 bg-[#05060b] relative overflow-y-auto custom-scrollbar p-8
                        ${mobileTab === 'visual' ? 'flex flex-col' : 'hidden md:flex flex-col'}
                    `}>

                        {step === 1 && renderCalendarView()}

                        {/* STEP 2 & 3: AI WORKFLOW OVERLAY */}
                        {(step === 2 || step === 3) && (
                            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto animate-in slide-in-from-right-8 fade-in">

                                {step === 2 && (
                                    <div className="text-center space-y-6">
                                        <div className="bg-indigo-500/10 p-4 rounded-full inline-flex mb-4">
                                            <Sparkles className="text-indigo-400 w-12 h-12" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-white">Todo listo para generar</h3>
                                        <p className="text-slate-400 text-lg">Hemos preparado un prompt optimizado con tu currículum y fechas.</p>

                                        <button onClick={handleCopy} className="btn-primary px-8 py-4 text-lg rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all mx-auto">
                                            {isCopied ? <Check /> : <ClipboardPaste />}
                                            {isCopied ? '¡Copiado!' : 'Copiar Prompt'}
                                        </button>
                                        <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 block w-full mt-4 text-sm">Volver al Calendario</button>

                                        {/* Prompt Preview */}
                                        <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-4 text-left max-h-40 overflow-y-auto text-xs font-mono text-slate-500">
                                            {generatePrompt()}
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="w-full space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Brain size={24} /></div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">Pega el resultado aquí</h3>
                                                <p className="text-slate-400 text-xs">Pega el JSON que te devolvió la IA.</p>
                                            </div>
                                        </div>
                                        <textarea
                                            value={jsonInput}
                                            onChange={e => setJsonInput(e.target.value)}
                                            placeholder="{ ... }"
                                            className="w-full h-80 bg-slate-900 border border-slate-700 rounded-2xl p-6 text-sm font-mono text-white focus:border-indigo-500 outline-none"
                                        />
                                        <div className="flex gap-3">
                                            <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors">Atrás</button>
                                            <button onClick={handleProcess} disabled={!jsonInput} className="flex-[2] btn-primary py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                                                Revisar y Editar
                                            </button>
                                        </div>
                                        {error && <p className="text-center text-red-400 text-sm mt-2">{error}</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="h-full space-y-6 pb-20 animate-in fade-in slide-in-from-right-4">
                                {unitToEdit ? (
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-800 rounded-lg p-1 flex">
                                                <button
                                                    onClick={() => setReviewTab('content')}
                                                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${reviewTab === 'content' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                                                >
                                                    Contenido
                                                </button>
                                                <button
                                                    onClick={() => setReviewTab('calendar')}
                                                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${reviewTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                                                >
                                                    Calendario Anual
                                                </button>
                                            </div>
                                        </div>
                                        {/* No back button here for editing */}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400"><ClipboardPaste size={24} /></div>
                                        <div>
                                            <h3 className="font-bold text-white text-xl">Revisión de Contenido</h3>
                                            <p className="text-slate-400 text-sm">Edita los detalles generados por la IA antes de guardar.</p>
                                        </div>
                                        <button onClick={() => setStep(3)} className="ml-auto text-sm text-slate-500 hover:text-white">Volver al JSON</button>
                                    </div>
                                )}

                                {(unitToEdit && reviewTab === 'calendar') ? renderCalendarView(true) : (


                                    <div className="space-y-6">
                                        {/* Objetivos Globales */}
                                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                            <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Objetivos de la Unidad</label>
                                            <textarea
                                                value={formData.objetivos}
                                                onChange={e => setFormData(prev => ({ ...prev, objetivos: e.target.value }))}
                                                className="w-full h-24 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* Lists: OAT, Skills */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <ListManager
                                                title="OAT (Transversales)"
                                                items={formData.oat}
                                                colorClass="text-emerald-400"
                                                onChange={newItems => setFormData(prev => ({ ...prev, oat: newItems }))}
                                            />
                                            <ListManager
                                                title="Habilidades (Siglo XXI)"
                                                items={formData.habilidades}
                                                colorClass="text-amber-400"
                                                onChange={newItems => setFormData(prev => ({ ...prev, habilidades: newItems }))}
                                            />
                                        </div>

                                        {/* Detalles (OAs) */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-slate-300 uppercase flex justify-between items-center">
                                                Detalle Curricular (OAs)
                                                <span className="text-xs font-normal text-slate-500">{formData.detalles.length} OAs</span>
                                            </h4>
                                            {formData.detalles.map((detalle, idx) => (
                                                <div key={idx} className="bg-slate-900 rounded-xl p-4 border border-slate-800 relative group transition-all hover:border-slate-700">
                                                    <button
                                                        onClick={() => {
                                                            const newDetalles = [...formData.detalles];
                                                            newDetalles.splice(idx, 1);
                                                            setFormData(prev => ({ ...prev, detalles: newDetalles }));
                                                        }}
                                                        className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={16} />
                                                    </button>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        {/* OA / Contenido */}
                                                        <div>
                                                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">OA / Contenido</label>
                                                            <textarea
                                                                rows={2}
                                                                value={detalle.oa}
                                                                onChange={e => {
                                                                    const newDetalles = [...formData.detalles];
                                                                    newDetalles[idx].oa = e.target.value;
                                                                    setFormData(prev => ({ ...prev, detalles: newDetalles }));
                                                                }}
                                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white font-medium resize-y focus:border-indigo-500 min-h-[60px]"
                                                            />
                                                        </div>

                                                        {/* Meta Data */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Tiempo</label>
                                                                <input
                                                                    type="text"
                                                                    value={detalle.tiempo}
                                                                    onChange={e => {
                                                                        const newDetalles = [...formData.detalles];
                                                                        newDetalles[idx].tiempo = e.target.value;
                                                                        setFormData(prev => ({ ...prev, detalles: newDetalles }));
                                                                    }}
                                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 focus:border-indigo-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Instrumento</label>
                                                                <input
                                                                    type="text"
                                                                    value={detalle.instrumento}
                                                                    onChange={e => {
                                                                        const newDetalles = [...formData.detalles];
                                                                        newDetalles[idx].instrumento = e.target.value;
                                                                        setFormData(prev => ({ ...prev, detalles: newDetalles }));
                                                                    }}
                                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 focus:border-indigo-500"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Indicadores List */}
                                                        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                                                            <label className="text-[10px] text-indigo-400 uppercase font-bold mb-2 block">Indicadores de Evaluación</label>
                                                            <div className="space-y-2">
                                                                {(detalle.indicadores || []).map((ind, iIdx) => (
                                                                    <div key={iIdx} className="flex gap-2 group/ind items-start">
                                                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                                                        <textarea
                                                                            rows={1}
                                                                            value={ind}
                                                                            onChange={(e) => {
                                                                                const newDetalles = [...formData.detalles];
                                                                                newDetalles[idx].indicadores[iIdx] = e.target.value;
                                                                                setFormData(prev => ({ ...prev, detalles: newDetalles }));
                                                                            }}
                                                                            className="flex-1 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 text-xs text-slate-300 focus:text-white resize-y outline-none py-1 min-h-[24px]"
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newDetalles = [...formData.detalles];
                                                                                newDetalles[idx].indicadores = newDetalles[idx].indicadores.filter((_, ii) => ii !== iIdx);
                                                                                setFormData(prev => ({ ...prev, detalles: newDetalles }));
                                                                            }}
                                                                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover/ind:opacity-100 px-1 mt-1"
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => {
                                                                        const newDetalles = [...formData.detalles];
                                                                        if (!newDetalles[idx].indicadores) newDetalles[idx].indicadores = [];
                                                                        newDetalles[idx].indicadores.push("Nuevo indicador...");
                                                                        setFormData(prev => ({ ...prev, detalles: newDetalles }));
                                                                    }}
                                                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 pl-3"
                                                                >
                                                                    <Plus size={10} /> Agregar Indicador
                                                                </button>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, detalles: [...prev.detalles, { oa: 'Nuevo Objetivo', tiempo: '', indicadores: [], instrumento: '' }] }))}
                                                className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-sm font-medium flex justify-center items-center gap-2"
                                            >
                                                <Plus size={16} /> Agregar Nuevo OA Manual
                                            </button>
                                        </div>

                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
};

export default UnitModal;
