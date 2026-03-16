import { Trash2 } from 'lucide-react';
import { formatCourseForCard, getColorForCourse } from '@/utils/courseUtils';

const ClaseCard = ({ clase, onEdit, onDelete, style, isStatic = false, compact = false, isShort = false, isMicro = false }) => {
    const isMultiCourse = clase.isMultiCourse === true;
    const sidebarColor = getColorForCourse(clase.curso, isMultiCourse);
    const isExecuted = clase.ejecutada !== false;
    const positionClass = isStatic ? 'relative w-full mb-1' : 'absolute w-[98%] left-[1%]';

    // Logic for short blocks (<= 45 min)
    const duration = clase.duracion || 90;
    const isReallyShort = duration <= 45;

    const { main: mainText, sub: subText } = formatCourseForCard(clase.curso);
    const showMainTextSize = mainText.length <= 3 && !isMultiCourse ? 'text-xl' : 'text-sm';

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
                ${isMultiCourse ? 'bg-[#1c1c2b]/95' : 'bg-slate-800/90'} transition-colors
                z-10 hover:z-20
                ${isMicro ? 'h-auto min-h-[26px]' : 'h-full'}
            `}
        >
            <div className="flex h-full w-full">
                {/* LEFT SIDEBAR: Course Indicator */}
                <div className={`
                    h-full w-14 min-w-[3.5rem] flex flex-col items-center justify-center flex-shrink-0
                    ${sidebarColor} text-white
                `}>
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

                {/* RIGHT CONTENT: Subject & Details */}
                <div className={`
                    flex-grow relative flex flex-col justify-center min-w-0 overflow-hidden
                    ${isReallyShort ? 'p-1' : 'p-2'}
                `}>
                    {/* Time */}
                    <span className={`
                        font-mono text-slate-400 
                        ${isReallyShort ? 'text-[9px] mb-0' : 'text-[10px] mb-0.5'}
                    `}>
                        {new Date(clase.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })} / {duration}m
                    </span>

                    {/* Subject */}
                    <h3 className={`
                        font-bold text-slate-200 leading-none truncate break-words whitespace-normal w-full overflow-hidden
                        ${isReallyShort ? 'text-[10px] max-h-[2.4em]' : 'text-xs line-clamp-2'}
                    `} title={clase.asignatura}>
                        {clase.asignatura}
                    </h3>

                    {/* Multi-course courses list */}
                    {isMultiCourse && clase.cursos && (
                        <p className="text-[8px] text-indigo-300 font-medium mt-1 truncate leading-tight">
                            {Array.isArray(clase.cursos) 
                                ? clase.cursos.map(c => c.split(' ')[0]).join(', ')
                                : String(clase.cursos).split(',').map(c => c.trim().split(' ')[0]).join(', ')
                            }
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="absolute top-1 right-1 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
    );
};

export default ClaseCard;
