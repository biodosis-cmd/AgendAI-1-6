import React from 'react';
import { Trash2, X } from 'lucide-react';
import { CURSO_COLORES, CURSO_HEX_COLORES } from '@/constants';

const ClaseCard = ({ clase, onEdit, onDelete, style, isStatic = false, compact = false, isShort = false, isMicro = false }) => {
    // Premium Gradient Mapping for Sidebar
    const getColorForCourse = (courseName) => {
        if (!courseName) return 'bg-slate-600';

        // 1. Try exact match
        if (CURSO_COLORES[courseName]) return CURSO_COLORES[courseName];

        // 2. Try stripping suffix (e.g. "7mo Básico A" -> "7mo Básico")
        // Assumes suffix is " X" (space + letter)
        const parts = courseName.split(' ');
        if (parts.length >= 2 && parts[parts.length - 1].length === 1) {
            // Reconstruct without last part
            const baseName = parts.slice(0, -1).join(' ');
            if (CURSO_COLORES[baseName]) return CURSO_COLORES[baseName];
        }

        return 'bg-slate-600';
    };

    const sidebarColor = getColorForCourse(clase.curso);
    const isExecuted = clase.ejecutada !== false;
    const positionClass = isStatic ? 'relative w-full mb-1' : 'absolute w-[98%] left-[1%]';

    // Helper to parse course name for display (Number + Label)
    const parseCourse = (courseName) => {
        if (!courseName) return { number: '', suffix: '', label: '' };

        let number = courseName.split(' ')[0];
        let label = '';
        let suffix = ''; // For A, B, C

        // Extract suffix if exists (last part if single letter?)
        const parts = courseName.split(' ');
        if (parts.length >= 2 && parts[parts.length - 1].length === 1) {
            suffix = parts[parts.length - 1];
        }

        if (courseName.includes('Básico')) {
            number = number.replace(/\D/g, ''); // Extract just digits
            label = 'Básico';
        } else if (courseName.includes('Medio')) {
            number = number.replace(/\D/g, '');
            label = 'Medio';
        } else {
            // NT1, NT2 casing
        }

        // if (suffix) label = `${label} ${suffix}`; // Removed: suffix now goes with number

        return { number, suffix, label };
    };

    return (
        <div
            style={style}
            onClick={() => onEdit(clase)}
            className={`
                ${positionClass} 
                rounded-lg shadow-sm hover:shadow-lg hover:shadow-black/30
                cursor-pointer 
                hover:-translate-y-1 hover:scale-[1.01] 
                overflow-hidden group 
                ${!isExecuted ? 'opacity-60 grayscale' : ''} 
                border-0
                ${sidebarColor} bg-opacity-85 saturate-[.85] backdrop-blur-sm bg-gradient-to-b from-white/10 to-transparent
                z-10 hover:z-20
                ${isMicro ? 'h-auto min-h-[26px]' : 'h-full'}
            `}
        >
            <div className="flex h-full w-full">
                {/* LEFT SIDEBAR: Course Indicator */}
                <div className={`
                    h-full flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0
                    ${sidebarColor}
                    ${isMicro ? 'w-8' : (isShort ? 'w-10' : 'w-10')}
                `}>
                    {/* Subtle sheen on sidebar */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/10 pointer-events-none"></div>

                    {/* Course Name Logic */}
                    {(() => {
                        const { number, suffix, label } = parseCourse(clase.curso);
                        const isNT = number.startsWith('NT');

                        if (isNT) {
                            // NT1/NT2: Vertical Stack
                            return (
                                <div className="flex flex-col items-center justify-center leading-none">
                                    <span className={`
                                        font-black text-white drop-shadow-md z-10 flex items-center justify-center
                                        ${isMicro ? 'text-[9px]' : 'text-xs'}
                                    `}>
                                        {number}
                                    </span>
                                    {suffix && (
                                        <span className={`
                                            font-bold text-white/90 uppercase tracking-tighter drop-shadow-md z-10 
                                            ${isMicro ? 'text-[8px] mt-px' : 'text-[10px] mt-0.5'}
                                        `}>
                                            {suffix}
                                        </span>
                                    )}
                                    {!isMicro && label && (
                                        <span className="text-[6px] text-white/90 font-bold uppercase tracking-tighter mt-0.5 text-center leading-tight px-0.5 z-10">
                                            {label}
                                        </span>
                                    )}
                                </div>
                            );
                        } else {
                            // Standard: Horizontal
                            return (
                                <div className="flex flex-col items-center justify-center leading-none">
                                    <span className={`
                                        font-black text-white drop-shadow-md z-10 leading-none flex items-center justify-center
                                        ${isMicro ? 'text-[9px]' : 'text-xl'}
                                    `}>
                                        {number}<span className={isNT ? "ml-0.5" : "ml-px"}>{suffix}</span>
                                    </span>
                                    {!isMicro && label && (
                                        <span className="text-[9px] text-white/90 font-bold uppercase tracking-tighter mt-0.5 text-center leading-tight px-0.5 z-10">
                                            {label}
                                        </span>
                                    )}
                                </div>
                            );
                        }
                    })()}
                </div>

                {/* RIGHT CONTENT: Subject & Details */}
                <div className={`flex-grow relative flex flex-col justify-center min-w-0 bg-slate-800/90 backdrop-blur-sm ${isMicro ? 'p-1' : 'p-1.5'}`}>

                    {/* Upper Details: Time */}
                    {!isMicro && (
                        <div className="flex items-center gap-1 mb-0.5 opacity-90">
                            <span className="text-[11px] font-mono font-bold text-slate-400">
                                {new Date(clase.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                <span className="text-slate-600 font-normal ml-1">/ {clase.duracion || 90}m</span>
                            </span>
                        </div>
                    )}

                    {/* Main Subject */}
                    <div className="flex flex-col justify-center flex-grow min-w-0">
                        <h3 className={`
                            font-bold text-slate-200 leading-tight truncate
                            ${isMicro ? 'text-[10px]' : 'text-[10px]'}
                        `} title={clase.asignatura}>
                            {clase.asignatura}
                        </h3>
                        {!isMicro && (
                            <p className="text-[9px] text-slate-500 truncate mt-px">
                                {isShort ? '' : 'Planificada'}
                            </p>
                        )}
                    </div>

                    {/* Footer: Actions */}
                    <div className="absolute top-0.5 right-0.5 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(clase); }}
                            className="p-0.5 rounded hover:bg-black/20 text-slate-500 hover:text-red-400 transition-colors"
                            title="Eliminar clase"
                        >
                            <Trash2 size={12} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ClaseCard;
