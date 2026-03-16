import { X } from 'lucide-react';
import { DIAS_SEMANA } from '@/constants';
import { formatCourseForCard, getColorForCourse } from '@/utils/courseUtils';

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
                                const isMultiCourse = block.isMultiCourse === true; // Assuming block might have this or we infer from course name
                                const sidebarColor = getColorForCourse(block.curso, isMultiCourse);
                                const duration = block.duration || 90;
                                const isReallyShort = duration <= 45;

                                const { main: mainText, sub: subText } = formatCourseForCard(block.curso);
                                const showMainTextSize = mainText.length <= 3 && !isMultiCourse ? 'text-xl' : 'text-sm';

                                return (
                                    <div
                                        key={block.id}
                                        className={`absolute inset-x-[1px] rounded-lg shadow-sm overflow-hidden ${isMultiCourse ? 'bg-[#1c1c2b]/95' : 'bg-slate-800/90'} hover:bg-slate-700/90 transition-colors group z-20 cursor-pointer`}
                                        style={{
                                            top: block.top,
                                            height: block.height
                                        }}
                                    >
                                        <div className="flex h-full w-full">

                                            {/* SIDEBAR */}
                                            <div className={`h-full w-14 min-w-[3.5rem] flex flex-col items-center justify-center ${sidebarColor} text-white`}>
                                                {isMultiCourse ? (
                                                    <>
                                                        <span className="text-sm font-bold leading-none text-center px-0.5">MLT</span>
                                                        <span className="text-[8px] uppercase font-bold mt-0.5 opacity-90 leading-none">Taller</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`${showMainTextSize} font-bold leading-none text-center px-0.5`}>
                                                            {mainText}
                                                        </span>
                                                        <span className="text-[9px] uppercase font-medium mt-0.5 opacity-90">
                                                            {subText}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* CONTENT */}
                                            <div className={`
                                                flex-grow relative flex flex-col justify-center min-w-0 overflow-hidden
                                                ${isReallyShort ? 'p-1' : 'p-2'}
                                            `}>
                                                <span className={`
                                                    font-mono text-slate-400 
                                                    ${isReallyShort ? 'text-[9px] mb-0' : 'text-[10px] mb-0.5'}
                                                `}>
                                                    {block.hora} / {duration}m
                                                </span>
                                                <h3 className={`
                                                    font-bold text-slate-200 leading-none truncate break-words whitespace-normal w-full overflow-hidden
                                                    ${isReallyShort ? 'text-[10px] max-h-[2.4em]' : 'text-xs line-clamp-2'}
                                                `} title={block.asignatura}>
                                                    {block.asignatura}
                                                </h3>
                                                {isMultiCourse && block.cursos && (
                                                    <p className="text-[8px] text-indigo-300 font-medium mt-1 truncate leading-tight">
                                                        {Array.isArray(block.cursos) 
                                                            ? block.cursos.map(c => c.split(' ')[0]).join(', ')
                                                            : String(block.cursos).split(',').map(c => c.trim().split(' ')[0]).join(', ')
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {canEdit && (
                                                <div className="absolute top-1 right-1 flex z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onRemoveBlock(block); }}
                                                        className="p-0.5 rounded hover:bg-black/20 text-slate-500 hover:text-red-400 transition-colors"
                                                        title="Eliminar bloque"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
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
