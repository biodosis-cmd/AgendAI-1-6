import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/services/db';
import { X, Loader2, EyeOff, CheckCircle2, Maximize2 } from 'lucide-react';

const EditClaseModal = ({ isOpen, onClose, clase, onOpenZenMode }) => {
    const [fullText, setFullText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [claseData, setClaseData] = useState(null);
    const [motivoSuspension, setMotivoSuspension] = useState('');
    const [isMarkingSuspended, setIsMarkingSuspended] = useState(false);
    const [duracion, setDuracion] = useState(90);

    const updateTimeoutRef = useRef(null);

    useEffect(() => {
        if (clase) {
            setClaseData(clase);
            const text = `Objetivo: ${clase.objetivo || ''}\n\nInicio: ${clase.inicio || ''}\n\nDesarrollo: ${clase.desarrollo || ''}\n\nAplicación: ${clase.aplicacion || ''}\n\nCierre: ${clase.cierre || ''}`;
            setFullText(text);
            setMotivoSuspension(clase.motivoSuspension || '');
            setIsMarkingSuspended(false);
            setDuracion(clase.duracion || 90);
        }
    }, [clase]);

    const parseFullText = (text) => {
        // Regex lookaheads to identify sections
        const sections = {
            objetivo: /Objetivo:([\s\S]*?)(?=(Inicio\(?|Inicio:|Desarrollo\(?|Desarrollo:|Aplicaci[oó]n\(?|Aplicaci[oó]n:|Cierre\(?|Cierre:|$))/i,
            inicio: /(?:Inicio|Inicio\([\s\S]*?\)):([\s\S]*?)(?=(Desarrollo\(?|Desarrollo:|Aplicaci[oó]n\(?|Aplicaci[oó]n:|Cierre\(?|Cierre:|$))/i,
            desarrollo: /(?:Desarrollo|Desarrollo\([\s\S]*?\)):([\s\S]*?)(?=(Aplicaci[oó]n\(?|Aplicaci[oó]n:|Cierre\(?|Cierre:|$))/i,
            aplicacion: /(?:Aplicaci[oó]n|Aplicaci[oó]n\([\s\S]*?\)):([\s\S]*?)(?=(Cierre\(?|Cierre:|$))/i,
            cierre: /(?:Cierre|Cierre\([\s\S]*?\)):([\s\S]*?)$/i
        };

        const result = {};
        for (const [key, regex] of Object.entries(sections)) {
            const match = text.match(regex);
            result[key] = match ? match[1].trim() : '';
        }
        // Fallback: If regex fails to capture anything, maybe just dump text in 'objetivo' or keep old vals?
        // Current simple regex approach assumes structure. 
        return result;
    };

    const debouncedUpdate = useCallback((text) => {
        const parsed = parseFullText(text);

        setIsSaving(true);
        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

        updateTimeoutRef.current = setTimeout(async () => {
            try {
                if (claseData && claseData.id) {
                    await db.classes.update(claseData.id, parsed);
                }
            } catch (e) {
                console.error("Error auto-saving:", e);
            } finally {
                setIsSaving(false);
            }
        }, 1500);
    }, [claseData]);

    const handleDurationChange = async (e) => {
        const newDuration = parseInt(e.target.value);
        setDuracion(newDuration);
        if (!claseData) return;

        setIsSaving(true);
        try {
            await db.classes.update(claseData.id, { duracion: newDuration });
        } catch (error) {
            console.error("Error updating duration:", error);
        } finally {
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const handleChange = (e) => {
        const newText = e.target.value;
        setFullText(newText);
        debouncedUpdate(newText);
    };

    const handleStatusChange = async (status) => {
        if (!claseData) return;
        setIsSaving(true);
        try {
            const updates = {
                ejecutada: status,
                motivoSuspension: status ? '' : (motivoSuspension || 'Clase suspendida')
            };
            await db.classes.update(claseData.id, updates);
            setClaseData(prev => ({ ...prev, ...updates }));

            if (status) setMotivoSuspension(''); // Clear reason if reverting to executed

        } catch (error) {
            console.error("Error updating status:", error);
        } finally {
            setIsSaving(false);
            setIsMarkingSuspended(false);
        }
    };

    if (!isOpen || !claseData) return null;

    const claseEjecutada = claseData.ejecutada !== false;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-40 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl text-white flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-2xl font-bold">{claseData.curso} - {claseData.asignatura}</h3>
                        <p className="text-gray-400">{new Date(claseData.fecha).toLocaleString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Duration Selector Removed */}

                        <button
                            onClick={() => onOpenZenMode(claseData)}
                            className="p-2 rounded-full hover:bg-gray-700 text-indigo-400 hover:text-indigo-300 transition-colors"
                            title="Modo Zen (Presentación)"
                        >
                            <Maximize2 size={20} />
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><X size={24} /></button>
                    </div>
                </div>

                {claseEjecutada ? (
                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        <textarea
                            value={fullText}
                            onChange={handleChange}
                            className="w-full h-full p-3 rounded bg-gray-900 border border-gray-600 min-h-[400px] resize-y font-sans leading-relaxed text-sm focus:border-indigo-500 outline-none transition-colors"
                        />
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col justify-center items-center bg-gray-900 rounded-md p-8 border border-dashed border-gray-600">
                        <EyeOff className="w-16 h-16 text-red-500 mb-4" />
                        <h4 className="text-xl font-bold text-white">Clase No Realizada</h4>
                        <p className="text-gray-400 mt-2 text-center">Motivo: {claseData.motivoSuspension}</p>
                    </div>
                )}

                <div className="text-right mt-2 text-sm text-gray-400 h-5 flex justify-end items-center gap-2">
                    {isSaving && <><Loader2 size={12} className="animate-spin" /> Guardando...</>}
                    {!isSaving && claseEjecutada && <><CheckCircle2 size={12} className="text-green-500" /> Guardado</>}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                    {claseEjecutada ? (
                        <>
                            {isMarkingSuspended ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="font-semibold text-gray-300">Motivo de la suspensión:</label>
                                    <input
                                        type="text"
                                        value={motivoSuspension}
                                        onChange={(e) => setMotivoSuspension(e.target.value)}
                                        placeholder="Ej: Feriado, acto escolar, etc."
                                        className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-red-500 outline-none"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setIsMarkingSuspended(false)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancelar</button>
                                        <button onClick={() => handleStatusChange(false)} disabled={!motivoSuspension || isSaving} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg shadow-red-900/20">
                                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <EyeOff size={18} />}
                                            Confirmar Suspensión
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-end">
                                    <button onClick={() => setIsMarkingSuspended(true)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 font-semibold hover:bg-yellow-600 hover:text-white transition-all">
                                        <EyeOff size={18} /> Marcar como No Realizada
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex justify-end">
                            <button onClick={() => handleStatusChange(true)} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20">
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                Revertir y Marcar como Realizada
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditClaseModal;
