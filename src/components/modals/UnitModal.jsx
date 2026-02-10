import React, { useState, useEffect, useMemo } from 'react';
import { getHorarioForWeek } from '@/utils/dateUtils';
import { db } from '@/services/db';
import { X, Loader2, Plus, Brain, Save, Trash2, Copy, Check, Info, Sparkles, ArrowRight, ClipboardPaste, FileText, Layout, Calendar } from 'lucide-react';

const UnitModal = ({ isOpen, onClose, userId, unitToEdit, selectedYear, selectedWeek, schedules }) => {

    // Aggregate data from ONLY the ACTIVE schedule for the SELECTED week
    const { cursosDisponibles, subjectsMap } = useMemo(() => {
        const courses = new Set();
        const subjects = {};

        // Use shared utility for robust date comparison logic
        let targetScheduleData = getHorarioForWeek(selectedYear, selectedWeek, schedules);

        // Fallback: If no schedule found for specific week, use the latest schedule (schedules[0])
        // This ensures the course list isn't empty just because we're on a break week or off-date
        if (!targetScheduleData && schedules && schedules.length > 0) {
            targetScheduleData = schedules[0].scheduleData;
        }

        if (targetScheduleData) {
            Object.keys(targetScheduleData).forEach(curso => {
                courses.add(curso);
                if (!subjects[curso]) subjects[curso] = new Set();
                Object.keys(targetScheduleData[curso]).forEach(asig => subjects[curso].add(asig));
            });
        }

        // Custom Sort Order
        const COURSE_ORDER = [
            'NT1', 'NT2',
            '1ro Básico', '2do Básico', '3ro Básico', '4to Básico', '5to Básico', '6to Básico', '7mo Básico', '8vo Básico',
            '1ro Medio', '2do Medio', '3ro Medio', '4to Medio'
        ];

        const sortedCourses = Array.from(courses).sort((a, b) => {
            const indexA = COURSE_ORDER.indexOf(a);
            const indexB = COURSE_ORDER.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        return {
            cursosDisponibles: sortedCourses,
            subjectsMap: subjects
        };
    }, [schedules]);

    // Initial State Structure
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
        tipoEvaluacion: 'Sumativa',
        detalles: []
    };

    const [formData, setFormData] = useState(initialFormState);

    // NEW STATES FOR UX FLOW
    const [mode, setMode] = useState('ai'); // Default to 'ai' now
    const [activeTab, setActiveTab] = useState('general'); // general, curricular, planning
    const [aiStep, setAiStep] = useState(1); // 1: Config, 2: Prompt/Copy, 3: Paste

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // Derived state for available subjects
    const asignaturasDisponibles = formData.curso && subjectsMap[formData.curso]
        ? Array.from(subjectsMap[formData.curso]).sort()
        : [];

    useEffect(() => {
        if (unitToEdit) {
            setFormData({
                ...initialFormState,
                ...unitToEdit,
                numero: unitToEdit.numero || 1, // Load existing or default
                // Ensure arrays exist even if old data didn't have them
                oat: unitToEdit.oat || [],
                habilidades: unitToEdit.habilidades || [],
                ejes: unitToEdit.ejes || [],
                detalles: unitToEdit.detalles || []
            });
            setMode('manual'); // Edit mode is always manual/full view
            setActiveTab('general');
        } else {
            setFormData(initialFormState);
            setMode('ai'); // Default to AI for new units
            setActiveTab('general');
        }
        setAiStep(1);
        setJsonInput('');
        setError('');
    }, [unitToEdit, isOpen]);

    // Auto-select first subject if available
    useEffect(() => {
        if (formData.curso && !asignaturasDisponibles.includes(formData.asignatura)) {
            setFormData(prev => ({ ...prev, asignatura: asignaturasDisponibles[0] || '' }))
        }
    }, [formData.curso]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Dynamic List Helpers (OAT, Skills) ---
    const handleArrayChange = (field, index, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeArrayItem = (field, index) => {
        const newArray = formData[field].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    // --- Planning Table Helpers ---
    const addDetailRow = () => {
        setFormData(prev => ({
            ...prev,
            detalles: [...prev.detalles, { oa: '', tiempo: '', indicadores: [''], instrumento: '' }]
        }));
    };

    const updateDetailRow = (index, field, value) => {
        const newDetalles = [...formData.detalles];
        newDetalles[index] = { ...newDetalles[index], [field]: value };
        setFormData(prev => ({ ...prev, detalles: newDetalles }));
    };

    const removeDetailRow = (index) => {
        const newDetalles = formData.detalles.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, detalles: newDetalles }));
    };

    const updateIndicator = (detailIndex, indicatorIndex, value) => {
        const newDetalles = [...formData.detalles];
        const newIndicators = [...newDetalles[detailIndex].indicadores];
        newIndicators[indicatorIndex] = value;
        newDetalles[detailIndex].indicadores = newIndicators;
        setFormData(prev => ({ ...prev, detalles: newDetalles }));
    };

    const addIndicator = (detailIndex) => {
        const newDetalles = [...formData.detalles];
        newDetalles[detailIndex].indicadores.push('');
        setFormData(prev => ({ ...prev, detalles: newDetalles }));
    };

    const removeIndicator = (detailIndex, indicatorIndex) => {
        const newDetalles = [...formData.detalles];
        newDetalles[detailIndex].indicadores = newDetalles[detailIndex].indicadores.filter((_, i) => i !== indicatorIndex);
        setFormData(prev => ({ ...prev, detalles: newDetalles }));
    };


    // --- AI Logic ---
    const generatePrompt = () => {
        return `
Rol: Actúa como un Especialista en Currículum Nacional Chileno y Diseñador Instruccional de alto nivel. Tu trabajo es garantizar que cada planificación de unidad esté blindada legal y pedagógicamente según la normativa vigente del Ministerio de Educación de Chile.

Tarea: Diseñar una Planificación de Unidad Didáctica detallada, utilizando exclusivamente los marcos legales correspondientes al nivel solicitado.

Detalles de la Solicitud:
- Curso: "${formData.curso}"
- Asignatura: "${formData.asignatura}"
- Unidad N°: ${formData.numero}
- Título/Tema: "${formData.nombre}"
- Duración: Desde ${formData.fechaInicio} hasta ${formData.fechaTermino}
${formData.objetivos ? `- Contexto/Objetivo Específico: "${formData.objetivos}"` : ''}

Documentación Obligatoria de Referencia (Uso Estricto):
Para cualquier OA, indicador o contenido, debes verificar y utilizar:
- Educación Parvularia: Bases Curriculares Decreto 481 (2018).
- 1° a 6° Básico: Bases Curriculares Decretos 433 y 439 (2012).
- 7° Básico a 2° Medio: Bases Curriculares Decretos 614 (2013) y 369 (2015).
- 3° y 4° Medio: Bases Curriculares Decreto 193 (2019).

Reglas de Planificación y Verificación:
1. Filtro de Nivel: Antes de proponer un Objetivo de Aprendizaje (OA), verifica que corresponda estrictamente al nivel y asignatura solicitada. Prohibido mezclar OAs de ciclos distintos.
2. Integridad del OA: Todo OA seleccionado debe presentarse con su código oficial y su texto íntegro y exacto, sin parafrasear, tal como aparece en el documento ministerial.
3. Vinculación Triple: Cada unidad debe estar alineada obligatoriamente con Indicadores de Evaluación sugeridos por los Programas de Estudio oficiales, Objetivos de Aprendizaje Transversales (OAT) pertinentes y Actitudes propias de la asignatura.
4. Contexto Nacional: Considera el calendario escolar chileno actual y las orientaciones de la Reactivación Educativa.

INSTRUCCIONES DE FORMATO (OBLIGATORIO):
Tu respuesta debe ser UNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "objetivos": "Descripción técnica y propósito de la unidad (alineado a Bases Curriculares)",
  "oat": ["OAT seleccionado del programa de estudio"],
  "habilidades": ["Habilidad del siglo XXI o transversal seleccionada"],
  "ejes": ["Eje temático oficial"],
  "tipoEvaluacion": "Sumativa",
  "detalles": [
    {
      "oa": "Código y descripción exacta del OA (Ej: OA 1: ...)",
      "tiempo": "Ej: 2 semanas",
      "indicadores": ["Indicador de evaluación sugerido 1", "Indicador de evaluación sugerido 2"],
      "instrumento": "Instrumento de evaluación sugerido (Ej: Rúbrica, Lista de cotejo)"
    }
  ]
}
`;
    };

    const handleGenerateAndCopy = () => {
        if (!formData.curso || !formData.asignatura || !formData.nombre || !formData.fechaInicio || !formData.fechaTermino) {
            setError('Por favor completa todos los campos requeridos (Curso, Asignatura, Título, Fechas).');
            return;
        }

        const prompt = generatePrompt();
        navigator.clipboard.writeText(prompt.trim())
            .then(() => {
                setIsCopied(true);
                setAiStep(3); // Jump to paste step
                setTimeout(() => setIsCopied(false), 4000);
            })
            .catch(err => {
                console.error("Error coping:", err);
                setError('No se pudo copiar automáticamente.');
            });
    };

    const handleProcessJson = () => {
        try {
            const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            setFormData(prev => ({
                ...prev,
                objetivos: data.objetivos || prev.objetivos,
                oat: data.oat || [],
                habilidades: data.habilidades || [],
                ejes: data.ejes || [],
                tipoEvaluacion: data.tipoEvaluacion || prev.tipoEvaluacion,
                detalles: data.detalles || []
            }));

            // SUCCESS FLOW
            setMode('manual'); // Unlock tabs
            setActiveTab('curricular'); // Jump to curricular tab to review
            setError('');
        } catch (e) {
            setError('Error al leer el JSON. Asegúrate de copiar solo el objeto JSON generado por la IA.');
            console.error(e);
        }
    };


    // --- Submit ---
    const handleSubmit = async () => {
        if (!formData.curso || !formData.asignatura || !formData.nombre || !formData.fechaInicio || !formData.fechaTermino) {
            setError('Por favor, completa los campos básicos en la pestaña "General".');
            setActiveTab('general');
            return;
        }
        setIsSaving(true); setError('');
        try {
            const dataToSave = { ...formData, userId };
            if (unitToEdit) {
                await db.units.update(unitToEdit.id, dataToSave);
            } else {
                await db.units.add(dataToSave);
            }
            onClose();
        } catch (e) {
            console.error("Error guardando unidad:", e);
            setError("No se pudo guardar la unidad.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">

            {/* FLOATING TOAST MESSAGE */}
            {isCopied && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl z-[60] flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
                    <div className="bg-white/20 p-1 rounded-full"><Check size={18} strokeWidth={3} /></div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">¡Prompt copiado!</span>
                        <span className="text-xs opacity-90">Pega en tu IA y luego vuelve aquí.</span>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
                    <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            {unitToEdit ? 'Editar Unidad' : 'Crear Unidad con Asistente IA'}
                            {mode === 'ai' && <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">BETA</span>}
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">Planificación Curricular Anual</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                {/* AI WIZARD MODE */}
                {mode === 'ai' && (
                    <div className="flex-grow flex flex-col p-6 bg-slate-900 overflow-y-auto">

                        {/* Steps Indicator */}
                        <div className="flex items-center justify-center mb-8">
                            {[1, 2, 3].map(step => (
                                <div key={step} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all mx-4 
                                   ${aiStep >= step ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}>
                                    {step}
                                </div>
                            ))}
                        </div>

                        {/* STEP 1: CONFIGURATION */}
                        {aiStep === 1 && (
                            <div className="max-w-3xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-right-8">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Configuración de la Unidad</h3>
                                    <p className="text-slate-400">Define los datos clave para que la IA genere tu planificación.</p>
                                </div>

                                <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Curso</label>
                                            <select name="curso" value={formData.curso} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none">
                                                <option value="">Selección...</option>
                                                {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Asignatura</label>
                                            <select name="asignatura" value={formData.asignatura} onChange={handleChange} disabled={!formData.curso} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none disabled:opacity-50">
                                                <option value="">Selección...</option>
                                                {asignaturasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-sm font-medium text-slate-300">N° Unidad</label>
                                            <input type="number" min="1" name="numero" value={formData.numero} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none text-center font-bold" />
                                        </div>
                                        <div className="md:col-span-10 space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Título de la Unidad</label>
                                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Los Seres Vivos y su Entorno" className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Fecha de Inicio</label>
                                            <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Fecha de Término</label>
                                            <input type="date" name="fechaTermino" value={formData.fechaTermino} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Contexto / Objetivo (Opcional)</label>
                                        <textarea name="objetivos" value={formData.objetivos} onChange={handleChange} placeholder="Detalles extra para la IA (Ej: Enfocarse en experimentación...)" className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none h-20 resize-none" />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button onClick={handleGenerateAndCopy} className="btn-primary w-full md:w-auto px-8 py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all text-lg font-bold">
                                        <Sparkles size={20} /> Generar Prompt y Copiar <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: PASTE */}
                        {aiStep === 3 && (
                            <div className="max-w-3xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-right-8">

                                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-5 rounded-xl flex gap-4 items-start">
                                    <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 mt-1"><ClipboardPaste size={24} /></div>
                                    <div>
                                        <h4 className="font-bold text-emerald-200 text-lg">¡Prompt Copiado!</h4>
                                        <p className="text-sm text-emerald-100/70 mt-1">
                                            1. Ve a tu IA (ChatGPT, Gemini, etc) y presiona <b>Ctrl + V</b>.<br />
                                            2. Copia la respuesta JSON que te dé.<br />
                                            3. Pégala en el recuadro de abajo.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <textarea
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                        placeholder="Pega aquí el JSON de respuesta..."
                                        className="w-full h-64 p-4 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <button onClick={() => setAiStep(1)} className="text-slate-400 hover:text-white px-4">Atrás</button>

                                    <button
                                        onClick={handleProcessJson}
                                        disabled={!jsonInput}
                                        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                    >
                                        <Brain size={20} /> Procesar y Crear Unidad
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && <div className="max-w-2xl mx-auto mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm text-center animate-in fade-in">{error}</div>}

                    </div>
                )}


                {/* MANUAL MODE (FULL TABS) - ONLY FOR EDIT OR AFTER AI */}
                {mode === 'manual' && (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2 px-6 py-3 border-b border-slate-700 bg-slate-800/80">
                            {[
                                { id: 'general', label: '1. General', icon: Layout },
                                { id: 'curricular', label: '2. Curricular', icon: FileText },
                                { id: 'planning', label: '3. Planificación', icon: Calendar },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2
                                        ${activeTab === tab.id
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                >
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-6 bg-slate-900">
                            {/* --- TAB: GENERAL --- */}
                            {activeTab === 'general' && (
                                <div className="space-y-6 max-w-3xl mx-auto animation-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Curso</label>
                                            <select name="curso" value={formData.curso} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                                                <option value="">Seleccionar Curso</option>
                                                {cursosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Asignatura</label>
                                            <select name="asignatura" value={formData.asignatura} onChange={handleChange} disabled={!formData.curso} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none disabled:opacity-50 transition-all">
                                                <option value="">Seleccionar Asignatura</option>
                                                {asignaturasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="space-y-2 w-24">
                                            <label className="text-sm font-medium text-slate-300">N° Unidad</label>
                                            <input type="number" min="1" name="numero" value={formData.numero} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none transition-all text-center font-bold" />
                                        </div>
                                        <div className="space-y-2 flex-grow">
                                            <label className="text-sm font-medium text-slate-300">Título de la Unidad</label>
                                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Descubriendo el mundo..." className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none transition-all" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Fecha de Inicio</label>
                                            <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Fecha de Término</label>
                                            <input type="date" name="fechaTermino" value={formData.fechaTermino} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none transition-all" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Descripción / Objetivo General</label>
                                        <textarea name="objetivos" value={formData.objetivos} onChange={handleChange} placeholder="Propósito general de la unidad..." className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none min-h-[120px] transition-all"></textarea>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB: CURRICULAR --- */}
                            {activeTab === 'curricular' && (
                                <div className="space-y-8 max-w-4xl mx-auto animation-fade-in">
                                    {/* OAT Section */}
                                    <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                                        <h4 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">🎯 Objetivos de Aprendizaje Transversales (OAT)</h4>
                                        <div className="space-y-3">
                                            {formData.oat.map((item, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input type="text" value={item} onChange={(e) => handleArrayChange('oat', idx, e.target.value)} className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:border-indigo-500 outline-none" placeholder={`OAT ${idx + 1}`} />
                                                    <button onClick={() => removeArrayItem('oat', idx)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg"><Trash2 size={18} /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => addArrayItem('oat')} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium mt-2"><Plus size={16} /> Agregar OAT</button>
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                                        <h4 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center gap-2">🧠 Habilidades Siglo XXI</h4>
                                        <div className="space-y-3">
                                            {formData.habilidades.map((item, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input type="text" value={item} onChange={(e) => handleArrayChange('habilidades', idx, e.target.value)} className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:border-emerald-500 outline-none" placeholder={`Habilidad ${idx + 1}`} />
                                                    <button onClick={() => removeArrayItem('habilidades', idx)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg"><Trash2 size={18} /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => addArrayItem('habilidades')} className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium mt-2"><Plus size={16} /> Agregar Habilidad</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Ejes Temáticos</label>
                                            <input type="text" placeholder="Separar por comas..." value={formData.ejes.join(', ')} onChange={(e) => setFormData(p => ({ ...p, ejes: e.target.value.split(',').map(s => s.trim()) }))} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Tipo de Evaluación Global</label>
                                            <select name="tipoEvaluacion" value={formData.tipoEvaluacion} onChange={handleChange} className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:border-indigo-500 outline-none">
                                                <option value="Sumativa">Sumativa</option>
                                                <option value="Formativa">Formativa</option>
                                                <option value="Diagnóstica">Diagnóstica</option>
                                                <option value="Mixta">Mixta</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB: PLANNING (TABLE) --- */}
                            {activeTab === 'planning' && (
                                <div className="space-y-6 mx-auto animation-fade-in w-full">
                                    <div className="bg-slate-800/20 rounded-xl overflow-hidden border border-slate-700/50">
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="bg-slate-900/80 text-xs text-slate-400 uppercase tracking-wider">
                                                <tr>
                                                    <th className="p-4 w-1/4">OA</th>
                                                    <th className="p-4 w-1/6">Tiempo</th>
                                                    <th className="p-4 w-1/3">Indicadores</th>
                                                    <th className="p-4 w-1/6">Instrumento</th>
                                                    <th className="p-4 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/30">
                                                {formData.detalles.length > 0 ? formData.detalles.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-800/30 align-top">
                                                        <td className="p-3"><textarea value={row.oa} onChange={(e) => updateDetailRow(idx, 'oa', e.target.value)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 resize-y min-h-[80px]" placeholder="OA..." /></td>
                                                        <td className="p-3"><input type="text" value={row.tiempo} onChange={(e) => updateDetailRow(idx, 'tiempo', e.target.value)} className="w-full bg-transparent border-b border-slate-700 focus:border-indigo-500 outline-none p-1" placeholder="2 semanas" /></td>
                                                        <td className="p-3">
                                                            <div className="space-y-2">
                                                                {row.indicadores.map((ind, iIdx) => (
                                                                    <div key={iIdx} className="flex gap-1 items-start">
                                                                        <span className="text-slate-500 mt-1.5 text-[10px]">•</span>
                                                                        <textarea value={ind} onChange={(e) => updateIndicator(idx, iIdx, e.target.value)} className="flex-1 bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-1 text-xs resize-y rows-1" placeholder="Indicador..." rows={1} />
                                                                        <button onClick={() => removeIndicator(idx, iIdx)} className="text-slate-600 hover:text-red-400 p-1"><X size={12} /></button>
                                                                    </div>
                                                                ))}
                                                                <button onClick={() => addIndicator(idx)} className="text-xs text-indigo-400 hover:text-indigo-300 ml-3">+ Indicador</button>
                                                            </div>
                                                        </td>
                                                        <td className="p-3"><input type="text" value={row.instrumento} onChange={(e) => updateDetailRow(idx, 'instrumento', e.target.value)} className="w-full bg-transparent border-b border-slate-700 focus:border-indigo-500 outline-none p-1" placeholder="Rúbrica" /></td>
                                                        <td className="p-3"><button onClick={() => removeDetailRow(idx)} className="p-2 text-slate-500 hover:text-red-400 rounded hover:bg-slate-700/50"><Trash2 size={16} /></button></td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan="5" className="text-center p-8 text-slate-500 italic">No hay detalles planificados.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                        <div className="p-4 bg-slate-800/30 border-t border-slate-700/50">
                                            <button onClick={addDetailRow} className="btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Agregar Fila</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
                            {error && <p className="text-red-400 text-sm flex items-center gap-2"><Info size={16} /> {error}</p>}
                            {!error && <div></div>}
                            <div className="flex gap-4">
                                <button onClick={onClose} className="px-6 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">Cancelar</button>
                                <button onClick={handleSubmit} disabled={isSaving} className="btn-primary px-8 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-70">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} {isSaving ? 'Guardando...' : 'Guardar Unidad'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UnitModal;
