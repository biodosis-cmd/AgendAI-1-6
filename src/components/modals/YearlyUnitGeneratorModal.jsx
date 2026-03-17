import React, { useState, useMemo } from 'react';
import { db } from '@/services/db';
import { X, Loader2, Sparkles, ArrowRight, ClipboardPaste, Brain, Check, Save, Layers } from 'lucide-react';

const YearlyUnitGeneratorModal = ({ isOpen, onClose, userId, selectedYear, schedules, units = [] }) => {
    const activeSchedule = schedules?.[0];

    // --- 1. DATA PREPARATION ---
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

    const [formData, setFormData] = useState({
        curso: '',
        asignatura: '',
        estructuraBase: '', // Resultado del primer prompt (NotebookLM)
        contexto: '',
        levels: ''
    });

    const [step, setStep] = useState(1); // 1: Config, 2: Setup Prompt 1, 3: Paste Estructura, 4: Prompt JSON Final, 5: Paste JSON, 6: Success
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [parsedUnits, setParsedUnits] = useState([]);

    // Reset when opened
    React.useEffect(() => {
        if (isOpen) {
            setFormData({ curso: '', asignatura: '', estructuraBase: '', contexto: '', levels: '' });
            setStep(1);
            setJsonInput('');
            setParsedUnits([]);
            setError('');
        }
    }, [isOpen]);

    // Fetch schoolYearConfig
    const [schoolYearConfig, setSchoolYearConfig] = useState(null);
    React.useEffect(() => {
        const fetchConfig = async () => {
            if (isOpen && userId && selectedYear) {
                try {
                    // Import inside the component or at top level. Let's assume it's imported at top level, wait we need to fix the import.
                    // Oh, actually in db.js, getSchoolYearConfig is an exported named function. 
                    // Let's import it at the top. I'll do this in a multi-replace, but I can do it here by destructing from a dynamic import or assuming it's added. Let's fix the imports too.
                    // Wait, since I'm only replacing this block, I should check if it's imported.
                    const { getSchoolYearConfig } = await import('@/services/db');
                    const data = await getSchoolYearConfig(userId, selectedYear);
                    if (data) setSchoolYearConfig(data);
                } catch (e) {
                    console.error("Error fetching schoolYearConfig", e);
                }
            }
        };
        fetchConfig();
    }, [isOpen, userId, selectedYear]);

    // Derived list of levels for the selected course/subject
    const nivelesDisponibles = useMemo(() => {
        if (!formData.curso || !formData.asignatura || !schedules || schedules.length === 0) return [];
        const activeSchedule = schedules[0].scheduleData;
        const blocks = activeSchedule?.[formData.curso]?.[formData.asignatura] || [];
        
        const levelsSet = new Set();
        blocks.forEach(b => {
            if (b.cursos && Array.isArray(b.cursos) && b.cursos.length > 0) {
                levelsSet.add(b.cursos.join(', '));
            } else if (b.cursos && typeof b.cursos === 'string') {
                levelsSet.add(b.cursos);
            }
        });
        
        return Array.from(levelsSet).sort();
    }, [formData.curso, formData.asignatura, schedules]);

    const calculateYearlyHours = () => {
        if (!formData.curso || !formData.asignatura) return 0;
        const activeSchedule = schedules?.[0]?.scheduleData;
        if (!activeSchedule?.[formData.curso]?.[formData.asignatura]) return 0;

        let blocks = activeSchedule[formData.curso][formData.asignatura];
        
        // Option 4: Filter by levels if provided
        if (formData.levels) {
            blocks = blocks.filter(b => {
                const bLevels = Array.isArray(b.cursos) ? b.cursos.join(', ') : b.cursos;
                return bLevels === formData.levels;
            });
        }
        
        const weeklyMinutes = blocks.reduce((sum, b) => sum + (parseInt(b.duration) || 0), 0);

        // Asumiendo aprox 38 semanas efectivas de clases en un año escolar chileno estándar
        const totalYearlyMinutes = weeklyMinutes * 38;
        const pedagogicalHours = parseFloat((totalYearlyMinutes / 45).toFixed(1));

        return pedagogicalHours;
    };

    // --- 2. AYUDANTES DE CONTEXTO ---
    const getContextStrings = () => {
        const estimatedHours = calculateYearlyHours();

        // Extraer horario específico para este curso y asignatura
        const activeSchedule = schedules?.[0]?.scheduleData;
        const subjectBlocks = activeSchedule?.[formData.curso]?.[formData.asignatura] || [];

        let scheduleDetails = "No se encontraron bloques asignados.";
        if (subjectBlocks.length > 0) {
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            // count blocks per day
            const blocksPerDay = {};
            subjectBlocks.forEach(b => {
                const dayName = diasSemana[b.dia];
                blocksPerDay[dayName] = (blocksPerDay[dayName] || 0) + (parseInt(b.duration) || 90);
            });
            scheduleDetails = Object.entries(blocksPerDay).map(([day, mins]) => `${day} (${mins} mins)`).join(', ');
        }

        const configStr = schoolYearConfig ? `
[INICIO DEL AÑO ESCOLAR]: ${schoolYearConfig.schoolYearStart || '01-03-' + selectedYear}
[FIN DEL AÑO ESCOLAR]: ${schoolYearConfig.schoolYearEnd || '15-12-' + selectedYear}

[LISTA DE FERIADOS Y DÍAS SIN CLASES]:
${schoolYearConfig.excludedDates?.length > 0 ? schoolYearConfig.excludedDates.map(d => `- Del ${d.start} al ${d.end} (${d.title || 'Feriado'})`).join('\n') : '- Ningún feriado registrado.'}` : '- Asume un año escolar estándar chileno de Marzo a Diciembre sin pausas.';

        return { estimatedHours, scheduleDetails, configStr };
    };

    // --- 3. AI GENERATION LOGIC ---

    const generateExtractionPrompt = () => {
        const { estimatedHours, scheduleDetails, configStr } = getContextStrings();

        // Workshop level context
        let workshopMsg = "";
        if (formData.curso.toLowerCase().includes('taller') || formData.curso.toLowerCase().includes('multi')) {
            let foundLevels = formData.levels;
            if (!foundLevels && activeSchedule?.scheduleData?.[formData.curso]) {
                for (const blocks of Object.values(activeSchedule.scheduleData[formData.curso])) {
                    if (Array.isArray(blocks)) {
                        const blockWithCursos = blocks.find(b => b && b.cursos);
                        if (blockWithCursos) {
                            foundLevels = Array.isArray(blockWithCursos.cursos) ? blockWithCursos.cursos.join(', ') : blockWithCursos.cursos;
                            break;
                        }
                    }
                }
            }

            const cursosStr = foundLevels || 'estudiantes de varios niveles';
            workshopMsg = `
[INSTRUCCIÓN MULTI-CURSO Y MULTIGRADO (CRÍTICO)]:
Este es un TALLER MULTIGRADO donde participan estudiantes de múltiples niveles: [${cursosStr}].
Tu misión es diseñar una propuesta de unidades que sea pedagógicamente factible para un aula multigrado:
1. Identifica y prioriza "OAs Transversales" que sean comunes a los niveles participantes para integrarlos en las mismas unidades.
2. Si un OA es específico de un nivel, indícalo claramente (ej: "OA 1 de 6to Básico" y "OA 4 de 5to Básico").
3. Diseña la progresión anual buscando la integración curricular, permitiendo que todos los niveles trabajen sobre un mismo eje temático con distinta profundidad.
`;
        }

        return `
Actúa como un Especialista en Currículum Nacional Chileno Mineduc.
Tu objetivo es analizar los "Planes y Programas" oficiales que te he adjuntado de la asignatura "${formData.asignatura}" para "${formData.curso}".

Misión: Entregarme la estructura oficial anual, unidad por unidad, en texto claro (NO EN JSON), abarcando el 100% del programa obligatorio anual. NO inventes unidades, cíñete a la propuesta del Mineduc.

CONTEXTO LOGÍSTICO Y TEMPORAL DEL PROFESOR (ESTRICTO):
Por favor, memoriza las siguientes fechas para la construcción temporal de las unidades:
- Días en que el profesor dicta esta clase específica: ${scheduleDetails}.
- Horas Pedagógicas Disponibles en el Año: ~${estimatedHours} hrs.

${workshopMsg}

=== CONFIGURACIÓN DE TU AÑO ESCOLAR ===
${configStr}
=======================================

Por favor, entrégame la radiografía exacta del curso detallando para cada unidad:
1. Número y Título de la Unidad: (INSTRUCCIÓN CRÍTICA PARA EL TÍTULO: NO uses simplemente "Unidad 1" o "Unidad 2". Analiza los aprendizajes de la unidad y crea un TÍTULO TEMÁTICO, COHERENTE y MOTIVADOR que refleje exactamente lo que desarrollarán los estudiantes en ese periodo).
2. Propósito u Objetivo principal de la Unidad.
3. DURACIÓN RECOMENDADA (CÁLCULO EXACTO): Basado en el peso que Mineduc le da a los OA de esta unidad, distribuye de forma matemática las semanas y horas pedagógicas que tomará. 
    **REGLA DE ORO TEMPORAL:** DEBES asegurar que NINGUNA UNIDAD quede cortada por la mitad entre el primer y segundo semestre. Es decir, una unidad debe terminar ANTES de empezar las Vacaciones de Invierno (o el receso de mitad de año) indicadas en la LISTA DE FERIADOS superior, y la unidad siguiente debe empezar DESPUÉS de las Vacaciones. Ajusta la duración de las unidades del primer semestre para que calcen matemáticamente con este límite temporal exacto y no crucen los feriados indicados.
4. Lista exacta de todos los OA (Objetivos de Aprendizaje) a trabajar. (ATENCIÓN: Prohibido agruparlos. Si una unidad tiene 5 OAs, debes listarme 5 OAs completamente separados, uno por línea, jamás fusionados como "OA 1, 3 y 4").
5. Para CADA OA listado individualmente, provee al menos 2 o 3 "Indicadores de Evaluación" sugeridos por el programa. (Ejemplo: - OA 1... [Indicadores: x, y, z]).
6. Lista de OAT (Objetivos Actitudinales y Transversales) seleccionados para la unidad.
7. Lista de Habilidades de la asignatura trabajadas.
8. Ejes temáticos correspondientes.
`;
    };

    // Prompt 2: JSON Generator (Convierte estructura en el JSON final calculando fechas)
    const generateJsonPrompt = () => {
        const { estimatedHours, scheduleDetails, configStr } = getContextStrings();

        // Workshop level context
        let workshopContext = "";
        if (formData.curso.toLowerCase().includes('taller') || formData.curso.toLowerCase().includes('multi')) {
            let foundLevels = formData.levels;
            if (!foundLevels && activeSchedule?.scheduleData?.[formData.curso]) {
                for (const blocks of Object.values(activeSchedule.scheduleData[formData.curso])) {
                    if (Array.isArray(blocks)) {
                        const blockWithCursos = blocks.find(b => b && b.cursos);
                        if (blockWithCursos) {
                            foundLevels = Array.isArray(blockWithCursos.cursos) ? blockWithCursos.cursos.join(', ') : blockWithCursos.cursos;
                            break;
                        }
                    }
                }
            }
            if (foundLevels) {
                workshopContext = `\n[INSTRUCCIÓN MULTIGRADO]: Este taller se imparte a estudiantes de: [${foundLevels}]. Diseña una planificación anual inclusiva y multinivel.`;
            }
        }

        return `
ROL DE FORMATO (OBLIGATORIO): Actúa como una API REST estricta. Tu única función es recibir datos y devolver un ARREGLO JSON puro. NO hables, NO expliques, NO uses markdown.

ROL PEDAGÓGICO (EL EXPERTO): Actúa como un Especialista en Currículum Nacional Chileno Mineduc y Experto en Aprendizaje Profundo (Deep Learning - Michael Fullan).

Tarea: Tomar la Estructura Base proporcionada y convertirla en el Programa Anual de Unidades Didácticas en formato JSON.
Curso: "${formData.curso}"
Asignatura: "${formData.asignatura}"
${estimatedHours > 0 ? `Contexto Temporal Anual: Aproximadamente ${estimatedHours} horas pedagógicas disponibles en todo el año.` : ''}
${workshopContext}
${formData.contexto ? `Contexto/Instrucciones Específicas del Docente: "${formData.contexto}"` : ''}

=== ESTRUCTURA BASE (EXTRAÍDA PREVIAMENTE POR NOTEBOOKLM) ===
${formData.estructuraBase}
=============================================================

CONTEXTO ESTRICTO DEL CALENDARIO Y HORARIO ESCOLAR (MUY IMPORTANTE):
El profesor tiene clases los siguientes días en la semana para esta asignatura: ${scheduleDetails}.
${configStr}

INSTRUCCIONES DE COBERTURA CURRICULAR Y PLANES DE ESTUDIO (CRÍTICO):
1. FIDELIDAD: Debes respetar absolutamente los títulos, OAs, propósitos y DURACIONES (semanas/horas) proporcionados en la ESTRUCTURA BASE.
2. CALENDARIO MATEMÁTICO: ES OBLIGATORIO calcular secuencialmente la fechaInicio y fechaTermino EXACTAS de cada unidad (en formato YYYY-MM-DD), asegurando que la primera unidad comience en el "Inicio del Año Escolar", y las siguientes mantengan la longitud temporal de semanas y horas calculadas en la base, saltando explícitamente los días feriados o sin clases señalados.
3. DETALLES DE CLASE: Por cada unidad, genera un desglose lógico en el arreglo "detalles", agrupando los OA proporcionados, respetando el "tiempo" definido por NotebookLM, e incluyendo indicadores e instrumentos de evaluación. ¡MUY IMPORTANTE!: NUNCA agrupes ni fusiones múltiples OA en un solo objeto (ej: "OA 1 y OA 2"). Cada OA extraído DEBE tener su propio bloque independiente dentro de la matriz "detalles".
4. El arreglo JSON devuelto debe contener un objeto por cada unidad presente en la Estructura Base.

MARCO DE HABILIDADES DEL SIGLO XXI:
Debes integrar explícitamente competencias del modelo de "Aprendizaje Profundo" (Las 6C).

INSTRUCCIONES DE FORMATO (OBLIGATORIO):
Respuesta UNICAMENTE un ARREGLO JSON válido con este formato exacto para CADA unidad:
[
  {
    "numero": 1,
    "nombre": "Título motivador y temático de la unidad",
    "objetivos": "Descripción técnica de los propósitos de articulación de los OA de esta unidad",
    "fechaInicio": "YYYY-MM-DD",
    "fechaTermino": "YYYY-MM-DD",
    "oat": ["OAT seleccionado 1", "OAT seleccionado 2"],
    "habilidades": ["Habilidad Profunda seleccionada"],
    "ejes": ["Eje temático principal de la unidad"],
    "tipoEvaluacion": "Sumativa / Formativa / Autoevaluación",
    "detalles": [
      {
        "oa": "Código y descripción COMPLETA de UN ÚNICO OA (Prohibido documentar más de un OA en este campo. Si hay varios, crea múltiples objetos en este arreglo)",
        "tiempo": "Ej: 3 semanas (9 horas pedagógicas)",
        "indicadores": ["Indicador de evaluación 1", "Indicador de evaluación 2", "Indicador 3"],
        "instrumento": "Rúbrica / Escala de Apreciación"
      }
    ]
  }
]

IMPORTANTE: 
- Revisa tu respuesta paso a paso. 
- Asegúrate de que las fechas (fechaInicio y fechaTermino) son válidas y progresivas a lo largo del año. No dejes espacios en blanco.
- Asegúrate de que no haya comas al final de las listas (trailing commas) antes de responder.`;
    };

    const handleCopyExtractionPrompt = () => {
        navigator.clipboard.writeText(generateExtractionPrompt().trim()).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
            setStep(3); // Pasar directamente al step 3 para pegar la estructura
        });
    };

    const handleCopyJsonPrompt = () => {
        navigator.clipboard.writeText(generateJsonPrompt().trim()).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000);
            setStep(5); // Pasar a step 5 para pegar el JSON
        });
    };

    const handleProcess = () => {
        try {
            let clean = jsonInput
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            clean = clean.replace(/,(\s*[}\]])/g, '$1');

            const data = JSON.parse(clean);

            if (!Array.isArray(data)) {
                throw new Error("El resultado no es un Arreglo (Array) JSON. Revisa el formato de la IA.");
            }

            // Sanitizar y preparar para BD
            const preparedUnits = data.map((unit, index) => ({
                ...unit,
                numero: unit.numero || (index + 1), // Asegurar correlativo si falta
                curso: formData.curso,
                asignatura: formData.asignatura,
                levels: formData.levels,
                userId: userId,
                fechaInicio: unit.fechaInicio || '', // Respeta la fecha de la IA
                fechaTermino: unit.fechaTermino || '',
                detalles: unit.detalles || [],
                oat: unit.oat || [],
                habilidades: unit.habilidades || [],
                ejes: unit.ejes || []
            }));

            setParsedUnits(preparedUnits);
            setStep(6);
            setError('');
        } catch (e) {
            console.error(e);
            setError('Error al procesar JSON: ' + e.message);
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            await db.units.bulkAdd(parsedUnits);
            onClose();
        } catch (e) {
            console.error(e);
            setError('Error al guardar las unidades en la base de datos.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex justify-center items-center z-50 p-4">
            <div className="bg-[#0f1221] border border-slate-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Sparkles className="text-indigo-400" /> Sincronización Anual (NotebookLM)
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Genera el super-prompt perfecto para crear tu año escolar en Mineduc + NotebookLM.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white flex-shrink-0 transition-colors"><X /></button>
                </div>

                {/* BODY */}
                <div className="flex-grow flex flex-col p-6 overflow-y-auto custom-scrollbar relative">

                    {step === 1 && (
                        <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-300 text-sm">
                                <Layers className="flex-shrink-0 mt-0.5" size={18} />
                                <p>Este generador creará <strong>múltiples unidades planificadas y sincronizadas con tu calendario real</strong>. La IA calculará inteligentemente la duración y asignará las fechas de inicio y término a lo largo de todo tu año escolar de forma automática.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Curso</label>
                                    <select
                                        value={formData.curso}
                                        onChange={(e) => setFormData({ ...formData, curso: e.target.value, asignatura: '' })}
                                        className="w-full p-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-slate-800 text-white"
                                    >
                                        <option value="">Curso...</option>
                                        {cursosDisponibles.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asignatura</label>
                                    <select value={formData.asignatura} onChange={e => setFormData(p => ({ ...p, asignatura: e.target.value }))} disabled={!formData.curso} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors disabled:opacity-50">
                                        <option value="">Selecciona Asignatura...</option>
                                        {formData.curso && subjectsMap[formData.curso] ? Array.from(subjectsMap[formData.curso]).map(a => <option key={a} value={a}>{a}</option>) : null}
                                    </select>
                                </div>

                                {nivelesDisponibles.length > 1 && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Niveles Participantes</label>
                                        <select
                                            value={formData.levels}
                                            onChange={(e) => setFormData({ ...formData, levels: e.target.value })}
                                            className="w-full p-3 rounded-xl border border-indigo-500/50 bg-slate-800 text-white focus:border-indigo-500 outline-none transition-all animate-pulse"
                                        >
                                            <option value="">Todos los niveles del taller...</option>
                                            {nivelesDisponibles.map(n => (
                                                <option key={n} value={n}>Solo niveles: {n}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3 text-indigo-300 text-sm">
                                <Brain className="flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="font-bold mb-1">Flujo asíncrono en 2 pasos:</p>
                                    <ol className="list-decimal ml-4 space-y-1">
                                        <li>Le pedimos a NotebookLM que extraiga la estructura base de tu PDF.</li>
                                        <li>Le enviamos esa estructura a la IA junto con tus horarios para que genere el año escolar perfecto en nuestra app.</li>
                                    </ol>
                                </div>
                            </div>

                            <button onClick={() => setStep(2)} disabled={!formData.curso || !formData.asignatura} className="w-full btn-primary py-4 rounded-xl flex justify-center items-center gap-2 font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 mt-4">
                                Iniciar Paso 1: Extraer Estructura <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center space-y-6 max-w-2xl mx-auto mt-8 animate-in slide-in-from-right-8 fade-in">
                            <div className="bg-blue-500/10 p-4 rounded-full inline-flex mb-2">
                                <Layers className="text-blue-400 w-12 h-12" />
                            </div>
                            <h3 className="text-3xl font-bold text-white">Prompt de Extracción (Paso 1)</h3>
                            <p className="text-slate-400 text-lg">Copia este texto y pégalo en NotebookLM sobre tu PDF del Mineduc para que extraiga la radiografía del curso completo.</p>

                            <button onClick={handleCopyExtractionPrompt} className="btn-primary px-8 py-4 text-lg rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:scale-105 transition-all mx-auto bg-blue-600 hover:bg-blue-500">
                                {isCopied ? <Check /> : <ClipboardPaste />}
                                {isCopied ? '¡Copiado!' : 'Copiar y Avanzar'}
                            </button>
                            <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 block w-full mt-4 text-sm">Volver</button>

                            <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-4 text-left max-h-40 overflow-y-auto text-xs font-mono text-slate-500 custom-scrollbar">
                                {generateExtractionPrompt()}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="w-full max-w-3xl mx-auto space-y-4 animate-in slide-in-from-right-8 fade-in h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                                <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400"><ClipboardPaste size={24} /></div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Pega el resultado de NotebookLM</h3>
                                    <p className="text-slate-400 text-xs">Pega aquí todo el texto que te respondió NotebookLM con las unidades y OAs extratídos.</p>
                                </div>
                            </div>
                            <textarea
                                value={formData.estructuraBase}
                                onChange={e => setFormData(p => ({ ...p, estructuraBase: e.target.value }))}
                                placeholder="Unidad 1: ...\nPropósito: ...\nOA: 1, 3, 5..."
                                className="w-full flex-grow bg-slate-900 border border-slate-700 rounded-2xl p-6 text-sm text-slate-300 focus:border-amber-500 outline-none custom-scrollbar resize-none"
                            />
                            <div className="flex gap-3 flex-shrink-0 pt-2">
                                <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors font-bold">Atrás</button>
                                <button onClick={() => setStep(4)} disabled={!formData.estructuraBase} className="flex-[2] btn-primary py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
                                    Generar Prompt Final (Paso 2) <ArrowRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-6 max-w-2xl mx-auto mt-8 animate-in slide-in-from-right-8 fade-in">
                            <div className="bg-indigo-500/10 p-4 rounded-full inline-flex mb-2">
                                <Sparkles className="text-indigo-400 w-12 h-12" />
                            </div>
                            <h3 className="text-3xl font-bold text-white">Prompt JSON Final Listo</h3>
                            <p className="text-slate-400 text-lg">Este Súper-Prompt ahora incluye la estructura de NotebookLM, tus fechas y feriados. Pégalo de nuevo en la IA para obtener el código mágico.</p>

                            <button onClick={handleCopyJsonPrompt} className="btn-primary px-8 py-4 text-lg rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all mx-auto">
                                {isCopied ? <Check /> : <ClipboardPaste />}
                                {isCopied ? '¡Copiado!' : 'Copiar Súper-Prompt JSON'}
                            </button>
                            <button onClick={() => setStep(3)} className="text-slate-500 hover:text-slate-300 block w-full mt-4 text-sm">Volver atrás</button>

                            <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-4 text-left max-h-40 overflow-y-auto text-xs font-mono text-slate-500 custom-scrollbar">
                                {generateJsonPrompt()}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="w-full max-w-3xl mx-auto space-y-4 animate-in slide-in-from-right-8 fade-in h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                                <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Brain size={24} /></div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Pega el resultado aquí</h3>
                                    <p className="text-slate-400 text-xs">Asegúrate de copiar todo el arreglo que te devolvió la IA, empezando con [ y terminando con ].</p>
                                </div>
                            </div>
                            <textarea
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                                placeholder="[ { ... }, { ... } ]"
                                className="w-full flex-grow bg-slate-900 border border-slate-700 rounded-2xl p-6 text-sm font-mono text-white focus:border-indigo-500 outline-none custom-scrollbar"
                            />
                            <div className="flex gap-3 flex-shrink-0 pt-2">
                                <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors font-bold">Atrás</button>
                                <button onClick={handleProcess} disabled={!jsonInput} className="flex-[2] btn-primary py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
                                    Extraer Unidades <ArrowRight />
                                </button>
                            </div>
                            {error && <p className="text-center text-red-400 text-sm mt-2 font-bold">{error}</p>}
                        </div>
                    )}

                    {step === 6 && (
                        <div className="max-w-2xl mx-auto text-center space-y-8 mt-12 animate-in fade-in zoom-in-95">
                            <div className="bg-emerald-500/10 p-6 rounded-full inline-flex border border-emerald-500/30">
                                <Check className="text-emerald-400 w-16 h-16" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">¡Todo Listo!</h3>
                                <p className="text-slate-400 text-lg">Se extrajeron correctamente <strong>{parsedUnits.length} unidades</strong> del texto.</p>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-left mx-auto max-w-md">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resumen: {formData.curso} - {formData.asignatura}</h4>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    {parsedUnits.map(pu => (
                                        <li key={pu.numero} className="truncate">
                                            <span className="font-mono text-indigo-400 mr-2">U{pu.numero}:</span>
                                            {pu.nombre}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button onClick={handleSubmit} disabled={isSaving} className="w-full max-w-md mx-auto btn-primary py-4 rounded-2xl flex justify-center items-center gap-3 font-bold shadow-xl shadow-indigo-500/20 text-lg">
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                                Guardar {parsedUnits.length} Unidades en la Base de Datos
                            </button>
                            <button onClick={() => setStep(5)} disabled={isSaving} className="text-slate-500 hover:text-slate-300 block w-full text-sm">Volver (Hubo un error)</button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default YearlyUnitGeneratorModal;
