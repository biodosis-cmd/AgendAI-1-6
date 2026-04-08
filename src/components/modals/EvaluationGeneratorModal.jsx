import React, { useState, useEffect } from 'react';
import { X, ClipboardPaste, Sparkles, ArrowRight, Brain, Check, FileText } from 'lucide-react';
import { generateEvaluationWord } from '@/utils/evaluationWord';

const EvaluationGeneratorModal = ({ isOpen, onClose, curso, asignatura, oa, detalles, claseData, selectedClassesData }) => {
    const [step, setStep] = useState(1);
    const [tipoInstrumento, setTipoInstrumento] = useState('rubrica4');
    const [evalMode, setEvalMode] = useState(selectedClassesData ? 'secuencia' : (claseData ? 'clase' : 'global'));
    const [selectedOAs, setSelectedOAs] = useState([]);
    const [isPieSupport, setIsPieSupport] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [evaluationData, setEvaluationData] = useState(null);
    const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset completo al abrir: borra todo lo de la evaluación anterior
            setStep(1);
            setTipoInstrumento('rubrica4');
            setEvalMode(selectedClassesData ? 'secuencia' : (claseData ? 'clase' : 'global'));
            setIsPieSupport(false);
            setJsonInput('');
            setEvaluationData(null);
            setError('');
            setIsCopiedPrompt(false);
            if (detalles && Array.isArray(detalles) && detalles.length > 0) {
                setSelectedOAs(detalles.map((_, i) => i));
            } else {
                setSelectedOAs([]);
            }
        }
    }, [isOpen, detalles, selectedClassesData, claseData]);

    const tiposDisponibles = [
        { id: 'rubrica4', nombre: 'Rúbrica (4 Niveles)' },
        { id: 'rubrica5', nombre: 'Rúbrica (5 Niveles)' },
        { id: 'cotejo', nombre: 'Lista de Cotejo' },
        { id: 'escala', nombre: 'Escala de Apreciación' }
    ];

    const getContextDescription = () => {
        if (evalMode === 'secuencia' && selectedClassesData && selectedClassesData.length > 0) {
            const secuenciasStr = selectedClassesData.map((c, idx) => `
--- CLASE ${idx + 1} (${new Date(c.fecha).toLocaleDateString()}) ---
- Objetivo: "${c.objetivo || 'S/N'}"
- Inicio: "${c.inicio || 'S/N'}"
- Desarrollo: "${c.desarrollo || 'S/N'}"
- Aplicación: "${c.aplicacion || 'S/N'}"
- Cierre: "${c.cierre || 'S/N'}"`).join('\n');
            return `**Contexto Híbrido: Evaluación Sumativa de Secuencia Didáctica (${selectedClassesData.length} clases):**\n${secuenciasStr}\n\n*Nota vital para el evaluador IA:* Estás construyendo un instrumento de Síntesis/Avance. Los indicadores deben medir cómo el estudiante integró los aprendizajes progresivos de toda esta secuencia de clases, NO de una sola clase aislada. Genera indicadores que abarquen el proceso de principio a fin de este bloque.`;
        } else if (evalMode === 'clase' && claseData) {
            return `**Contexto de Clase Específica a Evaluar:**\n- Objetivo Principal de la Actividad: "${claseData.objetivo || oa || 'S/N'}"\n- Inicio de la Clase: "${claseData.inicio || 'S/N'}"\n- Desarrollo de la Clase (Actividades clave): "${claseData.desarrollo || 'S/N'}"\n- Aplicación de lo Aprendido: "${claseData.aplicacion || 'S/N'}"\n- Cierre: "${claseData.cierre || 'S/N'}"\n\n*Nota para el evaluador: Diseña los indicadores de la rúbrica/escala enfocándote en medir las habilidades y entregables que se llevaron a cabo estrictamente en estas actividades.*`;
        } else if (evalMode === 'global') {
            const todosLosIndicadores = detalles && Array.isArray(detalles) && detalles.length > 0
                ? detalles.map(d => `- ${d.oa}:\n  * ${d.indicadores && d.indicadores.length > 0 ? d.indicadores.join('\n  * ') : 'Sin indicadores'}`).join('\n')
                : 'No hay indicadores específicos registrados.';
            return `Objetivo Principal / Metas de la Unidad:\n"${oa || 'No especificado'}"\n\nTodos los OAs e Indicadores abordados en la Unidad (Úsalos como guía flexible transversal para generar la evaluación global):\n${todosLosIndicadores}`;
        } else {
            if (detalles && Array.isArray(detalles) && detalles.length > 0 && selectedOAs.length > 0) {
                const text = selectedOAs.map(idx => {
                    const d = detalles[idx];
                    const inds = d.indicadores && d.indicadores.length > 0 ? d.indicadores.map(i => `  * ${i}`).join('\n') : '  * No se especificaron indicadores';
                    return `- OA/Objetivo Específico: ${d.oa || 'S/N'}\n  Indicadores a evaluar:\n${inds}`;
                }).join('\n\n');
                return `Objetivos e Indicadores de Evaluación Específicos:\n${text}`;
            }
            return `Objetivos e Indicadores de Evaluación Específicos:\nNo se seleccionaron OAs.`;
        }
    };

    const generatePrompt = () => {
        let formatoJSON = '';

        if (tipoInstrumento.includes('rubrica')) {
            const niveles = tipoInstrumento === 'rubrica5'
                ? `[{"nivel": "Excelente", "descripcion": "..."}, {"nivel": "Muy Bueno", "descripcion": "..."}, {"nivel": "Bueno", "descripcion": "..."}, {"nivel": "Suficiente", "descripcion": "..."}, {"nivel": "Insuficiente", "descripcion": "..."}]`
                : `[{"nivel": "Logrado", "descripcion": "..."}, {"nivel": "Medianamente Logrado", "descripcion": "..."}, {"nivel": "Por Lograr", "descripcion": "..."}, {"nivel": "No Observado", "descripcion": "..."}]`;

            formatoJSON = `{
  "titulo": "Título sugerido para la evaluación",
  "criterios": [
    {
      "nombre": "Nombre del Criterio 1",
      "niveles": ${niveles}
    }
  ]
}`;
        } else if (tipoInstrumento === 'cotejo') {
            formatoJSON = `{
  "titulo": "Lista de Cotejo para...",
  "criterios": [
    {
      "nombre": "Indicador observable 1",
      "opciones": ["Sí", "No"]
    }
  ]
}`;
        } else if (tipoInstrumento === 'escala') {
            formatoJSON = `{
  "titulo": "Escala de Apreciación para...",
  "criterios": [
    {
      "nombre": "Indicador observable 1",
      "opciones": ["Siempre", "Generalmente", "A veces", "Nunca"]
    }
  ]
}`;
        }


        return `
ROL DE FORMATO (OBLIGATORIO): Actúa como una API REST estricta. Tu única función es devolver un JSON puro. NO uses markdown, NO hables.
ROL PEDAGÓGICO: Eres un Especialista en Evaluación Curricular.

Tarea: Construir un instrumento de evaluación para el siguiente contexto de aprendizaje.
Curso: ${curso || 'No especificado'}
Asignatura: ${asignatura || 'No especificada'}

${getContextDescription()}

Tipo de Instrumento Solicitado: ${tiposDisponibles.find(t => t.id === tipoInstrumento)?.nombre}
${isPieSupport ? '\n**¡ATENCIÓN! REQUISITO DE ADAPTACIÓN PIE (NECESIDADES EDUCATIVAS ESPECIALES):**\nGenera este instrumento con un enfoque de Adaptación Curricular. Utiliza un lenguaje más sencillo y directo, con niveles o descriptores flexibles, abarcando posibles apoyos visuales, orales o tiempos adicionales. Evalúa el progreso individual y la participación en lugar de exigir un nivel de logro inalcanzable. Flexibiliza la complejidad cognitiva.\n' : ''}
INSTRUCCIONES DE FORMATO JSON (OBLIGATORIO):
Responde UNICAMENTE con este esquema (crea al menos 4-5 criterios relevantes):
${formatoJSON}

Asegúrate de no dejar comas al final de listas.`;
    };

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(generatePrompt().trim());
        setIsCopiedPrompt(true);
        setTimeout(() => setIsCopiedPrompt(false), 3000);
        setStep(3);
    };

    const handleProcessJson = () => {
        try {
            let clean = jsonInput
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            clean = clean.replace(/,(\s*[}\]])/g, '$1');
            const data = JSON.parse(clean);

            if (!data.criterios || !Array.isArray(data.criterios)) {
                throw new Error("El JSON no tiene la propiedad 'criterios' o no es un arreglo válido.");
            }

            setEvaluationData(data);
            setStep(4);
            setError('');
        } catch (e) {
            setError('Error procesando JSON: ' + e.message);
        }
    };

    const renderEvaluationTable = () => {
        if (!evaluationData) return null;

        const isRubric = !!(evaluationData.criterios && evaluationData.criterios[0] && evaluationData.criterios[0].niveles);

        return (
            <div id="evaluation-render-area" className="bg-white text-black p-8 rounded-xl w-full mx-auto my-4 overflow-x-auto shadow-2xl printable-area">
                <style dangerouslySetInnerHTML={{
                    __html: `
                        .eval-table {width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px; }
                        .eval-table th, .eval-table td {border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
                        .eval-table th {background-color: #f1f5f9; font-weight: bold; }
                        .eval-header {margin-bottom: 20px; font-family: sans-serif; }
                        @media print {
                            body * { visibility: hidden; }
                            .printable-area, .printable-area * { visibility: visible; }
                            .printable-area {position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; }
                        }
                    ` }} />
                <div className="eval-header">
                    <h2 className="text-2xl font-bold mb-4">{evaluationData.titulo}</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6 border-b pb-4">
                        <div><strong>Curso:</strong> {curso}</div>
                        <div><strong>Asignatura:</strong> {asignatura}</div>
                        <div className="col-span-2"><strong>Objetivo:</strong> {oa}</div>
                        <div className="col-span-2 mt-4 flex gap-4">
                            <span className="border-b w-48 inline-block"><strong>Nombre:</strong></span>
                            <span className="border-b w-32 inline-block"><strong>Fecha:</strong></span>
                        </div>
                    </div>
                </div>

                <table className="eval-table">
                    <thead>
                        {isRubric && evaluationData.criterios[0]?.niveles ? (
                            <tr>
                                <th width="20%">Criterios</th>
                                {evaluationData.criterios[0].niveles.map((n, i) => (
                                    <th key={i}>{n.nivel}</th>
                                ))}
                            </tr>
                        ) : (
                            <tr>
                                <th width="60%">Indicadores</th>
                                {evaluationData.criterios[0]?.opciones?.map((op, i) => (
                                    <th key={i} className="text-center w-20">{op}</th>
                                ))}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {evaluationData.criterios.map((crit, idx) => (
                            <tr key={idx}>
                                <td className="font-semibold">{crit.nombre}</td>
                                {isRubric && crit.niveles ? (
                                    crit.niveles.map((n, i) => (
                                        <td key={i}>{n.descripcion}</td>
                                    ))
                                ) : (
                                    crit.opciones?.map((_, i) => (
                                        <td key={i}></td>
                                    ))
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const handleWordExport = async () => {
        if (!evaluationData) return;
        try {
            const tipoNombre = tiposDisponibles.find(t => t.id === tipoInstrumento)?.nombre || 'Evaluacion';
            await generateEvaluationWord(evaluationData, curso, asignatura, claseData?.objetivo || oa, tipoNombre);
        } catch (e) {
            console.error("Error al exportar DOCX:", e);
            alert("No se pudo generar el documento Word de forma exitosa. Verifica tu conexión a internet o la consola.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex justify-center items-center z-50 p-4">
            <div className="bg-[#0f1221] border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* HEAD */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="text-emerald-400" /> Generador de Evaluaciones
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X /></button>
                </div>

                {/* PROGRESS BAR */}
                <div className="bg-slate-900/30 border-b border-slate-800 p-4 flex justify-center gap-8">
                    {[
                        { num: 1, label: 'Configuración' },
                        { num: 2, label: 'Prompt IA' },
                        { num: 3, label: 'Procesamiento' },
                        { num: 4, label: 'Instrumento' }
                    ].map(s => (
                        <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-emerald-400' : 'text-slate-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s.num ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-slate-800'}`}>
                                {s.num}
                            </div>
                            <span className="font-semibold text-sm hidden sm:block">{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {step === 1 && (
                        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Brain className="text-emerald-400" /> Contexto a Evaluar
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                        <span className="text-slate-400 text-sm">Curso:</span>
                                        <span className="text-white font-semibold text-sm">{curso}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                        <span className="text-slate-400 text-sm">Asignatura:</span>
                                        <span className="text-white font-semibold text-sm">{asignatura}</span>
                                    </div>

                                    {evalMode === 'secuencia' && selectedClassesData && (
                                        <div className="mt-4 bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 shadow-inner">
                                            <p className="text-emerald-400 text-sm font-bold flex items-center gap-2 mb-2">
                                                <Sparkles size={16} /> Evaluación Sumativa de Secuencia
                                            </p>
                                            <p className="text-xs text-slate-300 mb-2">Se evaluarán de forma integral <strong>{selectedClassesData.length} clases</strong> seleccionadas.</p>
                                            <button onClick={() => setEvalMode('global')} className="text-xs text-slate-400 hover:text-white underline">Cambiar a evaluación global de Unidad</button>
                                        </div>
                                    )}

                                    {evalMode === 'clase' && claseData && (
                                        <div className="mt-4 bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30 shadow-inner">
                                            <p className="text-indigo-400 text-sm font-bold flex items-center gap-2 mb-2">
                                                <Sparkles size={16} /> Evaluación Formativa de Clase
                                            </p>
                                            <p className="text-xs text-slate-300">Se generará la evaluación enfocada exclusivamente en el <strong>objetivo y actividades de la clase seleccionada</strong>.</p>
                                            <button onClick={() => setEvalMode('global')} className="mt-2 text-xs text-slate-400 hover:text-white underline">Atrás a global</button>
                                        </div>
                                    )}

                                    <div className="mt-6 pt-4 border-t border-slate-700/50">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={isPieSupport}
                                                onChange={e => setIsPieSupport(e.target.checked)}
                                                className="w-5 h-5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-900"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Adaptación Curricular (PIE)</span>
                                                <span className="text-xs text-slate-400">Genera una evaluación enfocada en necesidades educativas especiales.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(evalMode === 'global' || evalMode === 'especifico') && !selectedClassesData && !claseData && (
                                    <>
                                        <p className="text-xs text-emerald-400 font-bold mb-2">Selecciona los Objetivos e Indicadores a Evaluar</p>
                                        {detalles && Array.isArray(detalles) && detalles.length > 0 ? (
                                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                                {detalles.map((d, i) => (
                                                    <label key={i} className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg transition-colors border ${selectedOAs.includes(i) ? 'bg-slate-800/80 border-emerald-500/30' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}>
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1 w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                                                            checked={selectedOAs.includes(i)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedOAs([...selectedOAs, i]);
                                                                else setSelectedOAs(selectedOAs.filter(idx => idx !== i));
                                                            }}
                                                        />
                                                        <div className="text-sm text-slate-300 flex-1">
                                                            <strong className="text-emerald-400">{d.oa}</strong>: {d.indicadores && d.indicadores.length > 0 ? d.indicadores.join(', ') : 'Sin indicadores específicos definidos'}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 flex flex-col items-center justify-center text-center bg-slate-800/50 rounded-lg">
                                                <span className="text-amber-400 text-3xl mb-2">⚠️</span>
                                                <p className="text-sm text-slate-300">Esta unidad no tiene Objetivos de Aprendizaje específicos desglosados.</p>
                                                <button onClick={() => setEvalMode('global')} className="mt-3 text-emerald-400 underline text-xs font-bold">Volver a Evaluación Global</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="space-y-4 mt-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Selecciona el tipo de instrumento</h3>
                                {tiposDisponibles.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTipoInstrumento(t.id)}
                                        className={`w-full p-4 rounded-xl flex items-center justify-between border transition-all ${tipoInstrumento === t.id ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-slate-800/30 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
                                    >
                                        <span className={`font-bold ${tipoInstrumento === t.id ? 'text-emerald-400' : 'text-slate-300'}`}>{t.nombre}</span>
                                        {tipoInstrumento === t.id && <Check className="text-emerald-400" />}
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => setStep(2)} className="w-full btn-primary bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl flex justify-center items-center gap-2 font-bold mt-10">
                                Generar Prompt de Evaluación <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in">
                            <div className="bg-emerald-500/10 p-4 rounded-full inline-flex mb-2">
                                <Sparkles className="text-emerald-400 w-12 h-12" />
                            </div>
                            <h3 className="text-3xl font-bold text-white">Copia tu Prompt Mágico</h3>
                            <p className="text-slate-400 text-lg">Llévalo a tu IA favorita (ej. NotebookLM, ChatGPT o Claude).</p>

                            <button onClick={handleCopyPrompt} className="btn-primary bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-lg rounded-2xl flex items-center gap-3 shadow-xl hover:scale-105 transition-all mx-auto">
                                {isCopiedPrompt ? <Check /> : <ClipboardPaste />}
                                {isCopiedPrompt ? '¡Copiado!' : 'Copiar Prompt'}
                            </button>
                            <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 mt-4 text-sm">Atrás</button>

                            <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-4 text-left h-48 overflow-y-auto text-xs font-mono text-slate-500">
                                {generatePrompt()}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Brain size={24} /></div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Construyamos la Evaluación</h3>
                                    <p className="text-slate-400 text-xs">Pega el JSON que te devolvió la IA aquí abajo.</p>
                                </div>
                            </div>
                            <textarea
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                                placeholder="Pega el código JSON aquí..."
                                className="w-full h-80 bg-slate-900 border border-slate-700 rounded-2xl p-6 text-sm font-mono text-white focus:border-emerald-500 outline-none"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors">Volver</button>
                                <button onClick={handleProcessJson} disabled={!jsonInput} className="flex-[2] btn-primary bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold disabled:opacity-50">
                                    Generar Instrumento Visual
                                </button>
                            </div>
                            {error && <p className="text-center text-red-400 text-sm">{error}</p>}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="max-w-5xl mx-auto animate-in fade-in flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-bold text-emerald-400 text-xl">¡Instrumento Listo!</h3>
                                    <p className="text-slate-400 text-sm">Descarga en Word o PDF.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep(3)} className="text-slate-400 hover:text-white px-4">Volver</button>
                                    <button onClick={handleWordExport} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95">
                                        <FileText size={16} /> Descargar Word
                                    </button>
                                </div>
                            </div>
                            <div className="flex-grow bg-slate-900 rounded-xl overflow-y-auto custom-scrollbar p-4">
                                {renderEvaluationTable()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvaluationGeneratorModal;
