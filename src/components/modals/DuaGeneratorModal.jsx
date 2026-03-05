import React, { useState, useEffect } from 'react';
import { db } from '@/services/db';
import { X, ClipboardPaste, Sparkles, ArrowRight, Brain, Check, ShieldAlert, HeartHandshake, Save } from 'lucide-react';

const DuaGeneratorModal = ({ isOpen, onClose, claseData, onDuaSaved }) => {
    const [step, setStep] = useState(1);
    const [selectedNees, setSelectedNees] = useState(['TEA', 'TDAH']);
    const [jsonInput, setJsonInput] = useState('');
    const [duaData, setDuaData] = useState(null);
    const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setJsonInput('');
            setDuaData(null);
            setError('');
            setIsCopiedPrompt(false);
        }
    }, [isOpen, claseData]);

    const opcionesNee = [
        { id: 'TEA', nombre: 'Espectro Autista (TEA)', icon: '🧩', desc: 'Anticipación, reducción de estímulos, apoyo visual.' },
        { id: 'TDAH', nombre: 'Déficit Atencional (TDAH)', icon: '⚡', desc: 'Instrucciones cortas, pausas activas, canalización motriz.' },
        { id: 'SENSORIAL', nombre: 'Desafíos Sensoriales', icon: '👁️', desc: 'Adaptaciones visuales, auditivas o de material físico.' },
        { id: 'COGNITIVO', nombre: 'Desafío Cognitivo / Lenguaje', icon: '🧠', desc: 'Discapacidad intelectual leve, instrucciones simplificadas.' },
        { id: 'MOTRIZ', nombre: 'Discapacidad Motora', icon: '🦽', desc: 'Adaptación de espacios, tiempos y material manipulable.' }
    ];

    const generatePrompt = () => {
        const neesRequeridas = selectedNees.map(id => opcionesNee.find(n => n.id === id)?.nombre).join(', ');

        const formatoJSON = `[
  {
    "perfil_nee": "Nombre del Perfil (ej. TEA)",
    "desafio_detectado": "Corta descripción del obstáculo que presenta ESTA CLASE para el estudiante.",
    "sugerencia_practica": "Acción metodológica concreta para adaptar la actividad o el entorno."
  }
]`;

        return `
ROL (OBLIGATORIO): Actúa como una API REST estricta especializada en Educación Diferencial y Diseño Universal de Aprendizaje (DUA). Tu única función es devolver un JSON puro. NO uses markdown, NO hables, NO saludes.

Tarea: Construir sugerencias DUA prácticas y aplicables para adaptar las actividades de la siguiente clase.

Contexto de la Clase:
- Curso: ${claseData?.curso || 'No especificado'}
- Asignatura: ${claseData?.asignatura || 'No especificada'}
- Objetivo: "${claseData?.objetivo || 'S/N'}"
- Inicio: "${claseData?.inicio || 'S/N'}"
- Desarrollo (Foco principal): "${claseData?.desarrollo || 'S/N'}"
- Aplicación (Foco secundario): "${claseData?.aplicacion || 'S/N'}"
- Cierre: "${claseData?.cierre || 'S/N'}"

Perfiles de Necesidades Educativas a cubrir: ${neesRequeridas || 'Sugerir perfiles generales'}.

INSTRUCCIONES JSON:
Responde UNICAMENTE con este esquema (generando 1 o 2 acomodaciones por cada perfil solicitado, enfocadas estrictamente en las actividades de 'Desarrollo' y 'Aplicación' arriba mencionados):
${formatoJSON}
`;
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

            if (!Array.isArray(data) || !data[0]?.perfil_nee || !data[0]?.sugerencia_practica) {
                throw new Error("El JSON no tiene la estructura de arreglo de acomodaciones válida.");
            }

            setDuaData(data);
            setStep(4);
            setError('');
        } catch (e) {
            setError('Error procesando JSON: ' + e.message);
        }
    };

    const toggleNee = (id) => {
        if (selectedNees.includes(id)) {
            setSelectedNees(selectedNees.filter(n => n !== id));
        } else {
            setSelectedNees([...selectedNees, id]);
        }
    };

    const handleSaveDua = async () => {
        if (!claseData || !duaData) return;
        setIsSaving(true);
        try {
            await db.classes.update(claseData.id, { dua: duaData });
            if (onDuaSaved) onDuaSaved(duaData);
            onClose();
        } catch (e) {
            setError('Error al guardar en la Clase: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex justify-center items-center z-50 p-4">
            <div className="bg-[#0f1221] border border-slate-800 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* HEAD */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-2xl font-bold rounded-lg text-white flex items-center gap-3">
                        <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-2 rounded-lg text-white shadow-lg shadow-fuchsia-900/20">
                            <HeartHandshake size={24} />
                        </div>
                        Adaptador DUA Inclusivo
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X /></button>
                </div>

                {/* PROGRESS BAR */}
                <div className="bg-slate-900/30 border-b border-slate-800 p-4 flex justify-center gap-8">
                    {[
                        { num: 1, label: 'Perfiles' },
                        { num: 2, label: 'Prompt IA' },
                        { num: 3, label: 'Procesamiento' },
                        { num: 4, label: 'Estrategias DUA' }
                    ].map(s => (
                        <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-fuchsia-400' : 'text-slate-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s.num ? 'bg-fuchsia-500/20 border border-fuchsia-500/50' : 'bg-slate-800'}`}>
                                {s.num}
                            </div>
                            <span className="font-semibold text-sm hidden sm:block">{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {step === 1 && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <ShieldAlert className="text-fuchsia-400" /> Clase a Adaptar
                                </h3>
                                <div className="space-y-3">
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{claseData?.curso} - {claseData?.asignatura}</p>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                        <p className="text-sm font-semibold text-fuchsia-300">Objetivo:</p>
                                        <p className="text-sm text-slate-300 line-clamp-2">{claseData?.objetivo}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                        <p className="text-sm font-semibold text-fuchsia-300">Desarrollo (Foco):</p>
                                        <p className="text-sm text-slate-300 line-clamp-3">{claseData?.desarrollo}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                        <p className="text-sm font-semibold text-fuchsia-300">Aplicación (Foco):</p>
                                        <p className="text-sm text-slate-300 line-clamp-3">{claseData?.aplicacion}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Selecciona los Perfiles NEE presentes en el curso:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {opcionesNee.map(nee => (
                                        <div
                                            key={nee.id}
                                            onClick={() => toggleNee(nee.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedNees.includes(nee.id) ? 'bg-fuchsia-500/10 border-fuchsia-500 shadow-lg shadow-fuchsia-500/10' : 'bg-slate-800/30 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{nee.icon}</span>
                                                    <span className={`font-bold text-sm ${selectedNees.includes(nee.id) ? 'text-fuchsia-300' : 'text-slate-300'}`}>{nee.nombre}</span>
                                                </div>
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${selectedNees.includes(nee.id) ? 'bg-fuchsia-500 border-fuchsia-500 text-white' : 'border-slate-600'}`}>
                                                    {selectedNees.includes(nee.id) && <Check size={14} strokeWidth={3} />}
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 pl-8">{nee.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={selectedNees.length === 0}
                                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 py-4 rounded-xl flex justify-center items-center gap-2 text-white font-bold mt-10 shadow-lg shadow-fuchsia-900/20 transition-all hover:scale-[1.02]"
                            >
                                Diseñar Estrategias Inclusivas <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in">
                            <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-4 rounded-full inline-flex mb-2 shadow-lg shadow-fuchsia-900/40">
                                <Brain className="text-white w-12 h-12" />
                            </div>
                            <h3 className="text-3xl font-bold text-white">Prontitud de Inclusión</h3>
                            <p className="text-slate-400 text-lg">Llévalo a tu experto pedagógico IA (ej. NotebookLM o ChatGPT).</p>

                            <button onClick={handleCopyPrompt} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 px-8 py-4 text-white text-lg font-bold rounded-2xl flex items-center gap-3 shadow-xl hover:scale-105 transition-all mx-auto">
                                {isCopiedPrompt ? <Check /> : <ClipboardPaste />}
                                {isCopiedPrompt ? '¡Copiado!' : 'Copiar Prompt DUA'}
                            </button>
                            <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 mt-4 text-sm font-semibold">Volver a Configuración</button>

                            <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-4 text-left h-48 overflow-y-auto custom-scrollbar text-xs font-mono text-slate-400">
                                {generatePrompt()}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-fuchsia-500/20 p-2 rounded-lg text-fuchsia-400"><HeartHandshake size={24} /></div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Procesando Adaptaciones</h3>
                                    <p className="text-slate-400 text-xs">Pega el JSON que generó tu IA con las recomendaciones DUA.</p>
                                </div>
                            </div>
                            <textarea
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                                placeholder="[ { 'perfil_nee': 'TEA', ... } ]"
                                className="w-full h-80 bg-slate-900 border border-slate-700 rounded-2xl p-6 text-sm font-mono text-white focus:border-fuchsia-500 outline-none transition-colors"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-400 font-semibold hover:bg-slate-800 rounded-xl transition-colors">Atrás</button>
                                <button onClick={handleProcessJson} disabled={!jsonInput} className="flex-[2] bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold font-bold disabled:opacity-50 transition-all shadow-lg shadow-fuchsia-900/20">
                                    Mapear Estrategias DUA
                                </button>
                            </div>
                            {error && <p className="text-center text-red-400 text-sm bg-red-900/20 py-2 rounded-lg border border-red-500/30">{error}</p>}
                        </div>
                    )}

                    {step === 4 && duaData && (
                        <div className="max-w-5xl mx-auto animate-in fade-in flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-fuchsia-400 text-2xl flex items-center gap-2"><Sparkles /> Adaptaciones DUA Listas</h3>
                                    <p className="text-slate-400 text-sm mt-1">Sugerencias pedagógicas aplicables para tu clase actual.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setStep(3)} className="text-slate-400 hover:text-white font-semibold flex items-center gap-1 bg-slate-800 px-4 py-2 rounded-lg transition-colors">
                                        Modificar
                                    </button>
                                    <button onClick={handleSaveDua} disabled={isSaving} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-fuchsia-900/40 px-6 py-2 rounded-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
                                        {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar en la Clase</>}
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-center text-red-400 text-sm bg-red-900/20 py-2 rounded-lg border border-red-500/30 mb-4">{error}</p>}
                            <div className="flex-grow overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                                {duaData.map((estrategia, index) => (
                                    <div key={index} className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:border-fuchsia-500/30 transition-colors group">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 font-bold">
                                                {index + 1}
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-200 group-hover:text-fuchsia-300 transition-colors">{estrategia.perfil_nee}</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Desafío Detectado en Actividad</p>
                                                <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 leading-relaxed">
                                                    {estrategia.desafio_detectado}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-1">Estrategia Práctica Sugerida</p>
                                                <p className="text-sm text-slate-200 bg-fuchsia-900/10 p-4 rounded-lg border border-fuchsia-500/20 leading-relaxed">
                                                    {estrategia.sugerencia_practica}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DuaGeneratorModal;
