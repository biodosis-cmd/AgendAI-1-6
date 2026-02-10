import React, { useMemo } from 'react';

const SCHOOL_MONTHS = [
    { index: 2, name: 'Marzo', days: 31 },
    { index: 3, name: 'Abril', days: 30 },
    { index: 4, name: 'Mayo', days: 31 },
    { index: 5, name: 'Junio', days: 30 },
    { index: 6, name: 'Julio', days: 31 },
    { index: 7, name: 'Agosto', days: 31 },
    { index: 8, name: 'Septiembre', days: 30 },
    { index: 9, name: 'Octubre', days: 31 },
    { index: 10, name: 'Noviembre', days: 30 },
    { index: 11, name: 'Diciembre', days: 31 }
];

const SCHOOL_START_MONTH = 2; // March (0-indexed is 2)
const TOTAL_DAYS = SCHOOL_MONTHS.reduce((acc, m) => acc + m.days, 0);

const TimelineView = ({ units, onEditUnit, selectedYear }) => {

    const rows = useMemo(() => {
        const grouped = units.reduce((acc, unit) => {
            const key = `${unit.curso} - ${unit.asignatura}`;
            if (!acc[key]) acc[key] = { id: key, items: [] };
            acc[key].items.push(unit);
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.id.localeCompare(b.id));
    }, [units]);

    const getPositionStyle = (startDateStr, endDateStr) => {
        const start = new Date(startDateStr + 'T00:00:00');
        const end = new Date(endDateStr + 'T00:00:00');
        const yearStart = new Date(selectedYear, SCHOOL_START_MONTH, 1);

        // Check if unit is within the displayed year
        if (start.getFullYear() !== selectedYear) return null;

        const diffTimeStart = Math.max(0, start - yearStart);
        const diffDaysStart = Math.ceil(diffTimeStart / (1000 * 60 * 60 * 24));

        const durationTime = end - start;
        const durationDays = Math.ceil(durationTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include end day

        const leftPct = (diffDaysStart / TOTAL_DAYS) * 100;
        const widthPct = (durationDays / TOTAL_DAYS) * 100;

        return {
            left: `${Math.max(0, leftPct)}%`,
            width: `${Math.min(100 - leftPct, widthPct)}%`
        };
    };

    return (
        <div className="card-glass rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl mt-4 max-w-full overflow-x-auto">
            <div className="min-w-[1000px] p-4"> {/* Container for horizontal scroll */}

                {/* Timeline Header (Months) */}
                <div className="flex border-b border-slate-700/50 mb-4 pb-2 sticky top-0 bg-slate-900/90 z-10">
                    <div className="w-48 flex-shrink-0 font-bold text-slate-400 pl-2 flex flex-col justify-center">
                        <span>Asignatura</span>
                        <span className="text-[10px] text-indigo-400 leading-none mt-0.5">Año {selectedYear}</span>
                    </div>
                    <div className="flex-1 flex relative">
                        {SCHOOL_MONTHS.map(month => (
                            <div key={month.name} style={{ width: `${(month.days / TOTAL_DAYS) * 100}%` }} className="text-center text-xs font-semibold text-slate-500 border-l border-slate-700/30 first:border-l-0">
                                {month.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div className="space-y-3">
                    {rows.length > 0 ? rows.map(row => (
                        <div key={row.id} className="flex group hover:bg-slate-800/30 rounded-lg transition-colors py-2 items-center">
                            {/* Row Label */}
                            <div className="w-48 flex-shrink-0 text-xs font-medium text-slate-300 px-2 truncate" title={row.id}>
                                {row.id}
                            </div>

                            {/* Timeline Track */}
                            <div className="flex-1 relative h-10 bg-slate-800/50 rounded-lg border border-slate-700/30 mx-2 overflow-hidden">

                                {/* Month Grid Lines (Background) */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {SCHOOL_MONTHS.map(month => (
                                        <div key={month.name} style={{ width: `${(month.days / TOTAL_DAYS) * 100}%` }} className="border-r border-slate-700/10 h-full"></div>
                                    ))}
                                </div>

                                {/* Units (Blocks) */}
                                {row.items.map(unit => {
                                    const style = getPositionStyle(unit.fechaInicio, unit.fechaTermino);
                                    if (!style) return null;

                                    // UNIT COLORS PALETTE (Vibrant & Distinct)
                                    const UNIT_COLORS = [
                                        '#10b981', // Unit 1: Emerald
                                        '#3b82f6', // Unit 2: Blue
                                        '#f97316', // Unit 3: Orange
                                        '#a855f7', // Unit 4: Purple
                                        '#ec4899', // Unit 5: Pink
                                        '#06b6d4', // Unit 6: Cyan
                                        '#eab308', // Unit 7: Yellow
                                        '#ef4444', // Unit 8: Red
                                        '#6366f1', // Unit 9: Indigo
                                        '#14b8a6', // Unit 10: Teal
                                    ];

                                    // Cycle through colors based on unit number
                                    const unitNumber = parseInt(unit.numero) || 1;
                                    const colorIndex = (unitNumber - 1) % UNIT_COLORS.length;
                                    const color = UNIT_COLORS[colorIndex];

                                    return (
                                        <div
                                            key={unit.id}
                                            onClick={() => onEditUnit(unit)}
                                            style={{ ...style, backgroundColor: color }}
                                            className="absolute top-1 bottom-1 rounded-md shadow-sm border border-white/10 cursor-pointer hover:brightness-110 hover:shadow-md transition-all group/item z-10 flex items-center justify-center"
                                            title={`${unit.nombre}: ${new Date(unit.fechaInicio).toLocaleDateString()} - ${new Date(unit.fechaTermino).toLocaleDateString()}`}
                                        >
                                            <span className="text-[10px] font-bold text-white truncate px-1 shadow-black/50 drop-shadow-md select-none w-full text-center">
                                                {unit.nombre}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-slate-500 italic">No hay unidades creadas para este año.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimelineView;
