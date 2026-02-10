import React from 'react';
import { Clock, MapPin, ArrowRight, PlayCircle, BookOpen } from 'lucide-react';

const NextClassHero = ({ nextClass, onGenerate }) => {
    if (!nextClass) {
        return (
            <div className="h-full min-h-[220px] bg-slate-800/40 border border-slate-700/50 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-600 animate-pulse">
                    <Clock size={32} />
                </div>
                <h3 className="text-slate-300 font-medium text-lg">Todo listo por hoy</h3>
                <p className="text-slate-500 text-sm max-w-xs mt-2">No tienes más clases pendientes en tu horario para el día de hoy.</p>
            </div>
        );
    }

    const { curso, asignatura, horaInicio, duracion, status, generatedClass } = nextClass;

    // Status Logic
    const isPlanned = status === 'planned';

    return (
        <div className={`
            relative overflow-hidden rounded-2xl p-6 h-full flex flex-col justify-between
            group transition-all hover:shadow-xl hover:shadow-indigo-500/10
            ${isPlanned
                ? 'bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/30'
                : 'bg-slate-800/60 border border-slate-700/50'
            }
        `}>
            {/* Background Glow */}
            {isPlanned && <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none"></div>}

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className={`
                        px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5
                        ${isPlanned ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}
                    `}>
                        {isPlanned ? <><PlayCircle size={12} fill="currentColor" /> En Curso / Siguiente</> : 'Siguiente (Pendiente)'}
                    </span>
                    <span className="font-mono text-2xl font-bold text-white tracking-tight">{horaInicio}</span>
                </div>

                <h2 className="text-3xl font-black text-white mb-1 leading-tight line-clamp-2" title={asignatura}>
                    {asignatura}
                </h2>
                <div className="flex items-center gap-3 text-indigo-200/80 mb-6">
                    <span className="font-semibold text-lg">{curso}</span>
                    <span className="w-1 h-1 bg-current rounded-full"></span>
                    <span className="flex items-center gap-1.5 text-sm"><Clock size={14} /> {duracion} min</span>
                </div>

                {/* Content Preview if Planned */}
                {isPlanned && generatedClass?.clases?.[0] && (
                    <div className="bg-black/20 rounded-xl p-3 mb-4 backdrop-blur-sm border border-white/5">
                        <p className="text-xs text-indigo-300 font-bold uppercase mb-1 flex items-center gap-1">
                            <BookOpen size={10} /> Objetivo de la clase
                        </p>
                        <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                            {generatedClass.clases[0].objetivo}
                        </p>
                    </div>
                )}
            </div>

            {/* Action buttons removed for Informative Dashboard */}
        </div>
    );
};

export default NextClassHero;
