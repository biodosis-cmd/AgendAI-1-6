import React from 'react';
import { X } from 'lucide-react';
import { DIAS_SEMANA, CURSO_COLORES } from '@/constants';

const ScheduleGrid = ({
    startHour = 8,
    endHour = 18,
    pixelsPerMinute = 0.9,
    flatBlocks = [],
    canEdit = false,
    onRemoveBlock
}) => {

    // Calculate total height
    const totalHeight = (endHour - startHour) * 60 * pixelsPerMinute + 80;

    // Helper: Fuzzy Color Lookup for Course Letters (e.g., "7mo Básico A")
    const getColorForCourse = (courseName) => {
        if (!courseName) return 'bg-slate-600';

        // 1. Try exact match
        if (CURSO_COLORES[courseName]) return CURSO_COLORES[courseName];

        // 2. Try stripping suffix (e.g. "7mo Básico A" -> "7mo Básico", "NT1 A" -> "NT1")
        // Assumes suffix is " X" (space + letter)
        const parts = courseName.split(' ');
        if (parts.length >= 2 && parts[parts.length - 1].length === 1) {
            // Reconstruct without last part
            const baseName = parts.slice(0, -1).join(' ');
            if (CURSO_COLORES[baseName]) return CURSO_COLORES[baseName];
        }

        return 'bg-slate-600';
    };

    return (
        <div className="min-w-[800px] relative pb-10" style={{ height: `${totalHeight}px` }}>

            {/* Top Headers for Days */}
            <div className="sticky top-0 left-0 right-0 flex z-30 shadow-sm pl-16">
                {DIAS_SEMANA.map(dia => (
                    <div key={dia} className="flex-1 text-center py-3 text-lg font-bold text-slate-200 bg-[#0f1221] border-b border-indigo-500/30 border-r border-slate-700/30 last:border-r-0 flex flex-col justify-center h-[60px]">
                        {dia}
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="relative">

                {/* Time Column */}
                <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-slate-700/30 bg-slate-900/30 z-10 pointer-events-none">
                    {Array.from({ length: (endHour - startHour) * 2 + 1 }).map((_, i) => {
                        const totalMinutes = i * 30;
                        const hour = Math.floor(startHour + i * 0.5);
                        const min = i % 2 === 0 ? '00' : '30';

                        return (
                            <div key={i} className="absolute w-full flex items-center justify-end pr-3" style={{ top: totalMinutes * pixelsPerMinute, height: '20px', transform: 'translateY(-50%)' }}>
                                <span className="text-xs font-mono text-slate-500">{String(hour).padStart(2, '0')}:{min}</span>
                                <div className="absolute right-0 w-1.5 h-px bg-slate-700"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Columns Container */}
                <div className="absolute left-16 right-0 top-0 bottom-0 flex">
                    {DIAS_SEMANA.map((dia, index) => (
                        <div key={dia} className="flex-1 border-r border-slate-700/30 relative group last:border-r-0">

                            {/* Guide Lines (30 mins) */}
                            {Array.from({ length: (endHour - startHour) * 2 + 1 }).map((_, i) => (
                                <div key={i} className={`absolute left-0 right-0 border-t pointer-events-none ${i % 2 === 0 ? 'border-slate-700/20' : 'border-slate-800/10'}`} style={{ top: i * 30 * pixelsPerMinute }}></div>
                            ))}

                            {/* Blocks for this Day */}
                            {flatBlocks.filter(b => b.dia === index + 1).map(block => {
                                const blockColor = getColorForCourse(block.curso);
                                return (
                                    <div
                                        key={block.id}
                                        className={`absolute inset-x-[1px] rounded-lg shadow-sm border-0 overflow-hidden transition-all group/block hover:z-10 hover:shadow-xl hover:scale-[1.02] cursor-pointer ${blockColor} bg-opacity-85 saturate-[.85] backdrop-blur-sm bg-gradient-to-b from-white/10 to-transparent`}
                                        style={{
                                            top: block.top,
                                            height: block.height
                                        }}
                                    >
                                        {/* New Sidebar Design Structure */}
                                        <div className="flex h-full w-full">

                                            {/* LEFT SIDEBAR: Course Indicator */}
                                            <div className={`
                                            h-full flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0
                                            ${blockColor}
                                            w-10
                                        `}>
                                                {/* Subtle sheen */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/10 pointer-events-none"></div>

                                                {/* Typography Logic */}
                                                {(() => {
                                                    const courseName = block.curso || '';
                                                    let number = courseName.split(' ')[0] || '';
                                                    let label = '';
                                                    let suffix = '';

                                                    // Render Logic: Parse Name
                                                    const parts = courseName.split(' ');
                                                    if (parts.length >= 2 && parts[parts.length - 1].length === 1) suffix = parts[parts.length - 1];

                                                    if (courseName.includes('Básico')) {
                                                        number = number.replace(/\D/g, '');
                                                        label = 'Básico';
                                                    } else if (courseName.includes('Medio')) {
                                                        number = number.replace(/\D/g, '');
                                                        label = 'Medio';
                                                    }
                                                    // Removed: if (suffix) label = `${label} ${suffix}`;

                                                    // RENDER LOGIC: Split based on Course Type
                                                    const isNT = number.startsWith('NT');
                                                    if (isNT) {
                                                        // NT1/NT2: Vertical Stack (Number on top, Letter below)
                                                        return (
                                                            <div className="flex flex-col items-center justify-center leading-none">
                                                                <span className="font-black text-white text-xs drop-shadow-md z-10 flex items-center justify-center">
                                                                    {number}
                                                                </span>
                                                                {suffix && (
                                                                    <span className="font-bold text-white/90 uppercase tracking-tighter drop-shadow-md z-10 text-[10px] mt-0.5">
                                                                        {suffix}
                                                                    </span>
                                                                )}
                                                                {label && (
                                                                    <span className="text-[6px] text-white/90 font-bold uppercase tracking-tighter mt-0.5 text-center leading-tight px-0.5 z-10">
                                                                        {label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    } else {
                                                        // Standard Courses (1ro Básico, etc): Horizontal (Number + Letter side-by-side)
                                                        return (
                                                            <div className="flex flex-col items-center justify-center leading-none">
                                                                <span className="font-black text-white text-xl drop-shadow-md z-10 flex items-center justify-center leading-none">
                                                                    {number}
                                                                    {suffix && <span className="ml-0.5 text-lg opacity-90">{suffix}</span>}
                                                                </span>
                                                                {label && (
                                                                    <span className="text-[6px] text-white/90 font-bold uppercase tracking-tighter mt-0.5 text-center leading-tight px-0.5 z-10">
                                                                        {label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>

                                            {/* RIGHT CONTENT: Subject & Details */}
                                            <div className="flex-grow p-1.5 relative flex flex-col justify-center min-w-0 bg-slate-800/90 backdrop-blur-sm">

                                                {/* Time Badge */}
                                                <div className="flex items-center gap-1 mb-0.5 opacity-90">
                                                    <span className="text-[9px] font-mono font-bold text-slate-400">
                                                        {block.hora} <span className="text-slate-600 font-normal">/ {block.duration}m</span>
                                                    </span>
                                                </div>

                                                {/* Subject */}
                                                <div className="flex items-center">
                                                    <h3
                                                        className="font-bold text-[10px] leading-tight truncate text-slate-200 w-full"
                                                        title={block.asignatura}
                                                    >
                                                        {block.asignatura}
                                                    </h3>
                                                </div>

                                                {/* Delete Button (Admin Only) */}
                                                {canEdit && (
                                                    <div className="absolute top-0.5 right-0.5 flex z-20">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onRemoveBlock(block); }}
                                                            className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                                            title="Eliminar bloque"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default ScheduleGrid;
