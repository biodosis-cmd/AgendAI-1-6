import React, { useMemo } from 'react';
import { Calendar, PlusCircle, Clock } from 'lucide-react'; // Reduced imports
import { STATUS } from '@/constants';
import { getWeekNumber } from '@/utils/dateUtils';
import DashboardStats from '@/components/home/DashboardStats';
import WeeklyChart from '@/components/home/WeeklyChart';
import NextClassHero from '@/components/home/NextClassHero';

const HomeView = ({
    userName,
    clases,
    units,
    schedules,
    onNavigateToCalendar,
    onEditClass,
    onGenerateClasses
}) => {
    // --- Stats & Date ---
    const today = new Date();
    const todayString = today.toDateString();

    // --- Data Processing for Charts & Stats ---

    // 1. Get Single Source of Truth Schedule
    const activeSchedule = useMemo(() => schedules?.[0], [schedules]);

    // 2. Compute Weekly Stats (Planned vs Pending per Day)
    // Structure: [{ name: 'L', planned: 2, pending: 3 }, ...]
    const weeklyData = useMemo(() => {
        if (!activeSchedule?.scheduleData) return [];

        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const shortDays = ['Dom', 'Lun', 'Mar', 'Miér', 'Jue', 'Vie', 'Sáb'];

        // Initialize Map for 1-5 (Mon-Fri)
        const statsMap = {
            1: { name: 'Lun', planned: 0, total: 0 },
            2: { name: 'Mar', planned: 0, total: 0 },
            3: { name: 'Mié', planned: 0, total: 0 },
            4: { name: 'Jue', planned: 0, total: 0 },
            5: { name: 'Vie', planned: 0, total: 0 }
        };

        // A. Count TOTAL Slots from Schedule
        Object.values(activeSchedule.scheduleData).forEach(asignaturas => {
            Object.values(asignaturas).forEach(bloques => {
                bloques.forEach(bloque => {
                    const dayIdx = bloque.dia; // 1-5
                    if (statsMap[dayIdx]) {
                        statsMap[dayIdx].total += 1;
                    }
                });
            });
        });

        // B. Count PLANNED Classes from 'clases' (This Current Week Only)
        // We calculate the current week based on 'today', assuming Home is "Now".
        const currentWeekNumber = getWeekNumber(today);
        const currentYear = today.getFullYear();

        clases.forEach(c => {
            // Strict Filter: Must match Current Week and Current Year to be shown in chart
            // as "Planned This Week". Otherwise we inflate the count.
            if (c.status === STATUS.ACTIVE && c.semana === currentWeekNumber && new Date(c.fecha).getFullYear() === currentYear) {
                const d = new Date(c.fecha);
                const dayIdx = d.getDay();

                if (statsMap[dayIdx]) {
                    statsMap[dayIdx].planned += 1;
                }
            }
        });

        // Transform to Array
        return [1, 2, 3, 4, 5].map(d => ({
            name: statsMap[d].name,
            planned: statsMap[d].planned,
            // Pending is Total Slots minus Planned (cannot be negative)
            pending: Math.max(0, statsMap[d].total - statsMap[d].planned)
        }));

    }, [activeSchedule, clases, today]);


    // 3. Get Next/Current Class for Hero
    const nextClass = useMemo(() => {
        if (!activeSchedule?.scheduleData) return null;

        const currentDay = today.getDay(); // 1-5
        const currentHour = today.getHours();
        const currentMin = today.getMinutes();
        const currentTimeVal = currentHour * 60 + currentMin;

        // Flatten today's blocks
        let todaysBlocks = [];
        Object.entries(activeSchedule.scheduleData).forEach(([curso, asigs]) => {
            Object.entries(asigs).forEach(([asig, blocks]) => {
                blocks.filter(b => b.dia === currentDay).forEach(b => {
                    todaysBlocks.push({ ...b, curso, asignatura: asig });
                });
            });
        });

        // Sort by time
        todaysBlocks.sort((a, b) => {
            const [hA, mA] = a.hora.split(':').map(Number);
            const [hB, mB] = b.hora.split(':').map(Number);
            return (hA * 60 + mA) - (hB * 60 + mB);
        });

        // Find match
        // A. Current Class (Time is within range)
        // B. Next Class (Time is future)
        // C. Fallback: First class of day (if early morning)

        const match = todaysBlocks.find(b => {
            const [h, m] = b.hora.split(':').map(Number);
            const startVal = h * 60 + m;
            const endVal = startVal + (parseInt(b.duration) || 90);
            return endVal > currentTimeVal; // Ends in future
        });

        if (!match) return null; // Done for day

        // Check if Planned
        const isPlanned = clases.find(c =>
            c.curso === match.curso &&
            c.asignatura === match.asignatura &&
            new Date(c.fecha).toDateString() === today.toDateString()
        );

        return {
            ...match,
            horaInicio: match.hora,
            duracion: match.duration || 90,
            status: isPlanned ? 'planned' : 'pending',
            generatedClass: isPlanned
        };

    }, [activeSchedule, clases]);


    // 4. Calculate Dashboard Stats
    const dashboardStats = useMemo(() => {
        // A. Today's Stats
        const currentDay = today.getDay(); // 1-5
        const uniqueSlotsToday = new Set();
        let slotsToday = 0;

        if (activeSchedule?.scheduleData) {
            Object.values(activeSchedule.scheduleData).forEach(asignaturas => {
                Object.values(asignaturas).forEach(bloques => {
                    bloques.filter(b => b.dia === currentDay).forEach(b => {
                        const slotKey = `${b.dia}-${b.hora}`;
                        if (!uniqueSlotsToday.has(slotKey)) {
                            uniqueSlotsToday.add(slotKey);
                            slotsToday++;
                        }
                    });
                });
            });
        }

        const plannedToday = clases.filter(c =>
            c.status === STATUS.ACTIVE &&
            new Date(c.fecha).toDateString() === today.toDateString()
        ).length;

        const pendingToday = Math.max(0, slotsToday - plannedToday);

        // B. Weekly Total Slots
        let totalWeeklySlots = 0;
        const uniqueWeeklySlots = new Set();
        if (activeSchedule?.scheduleData) {
            Object.values(activeSchedule.scheduleData).forEach(asignaturas => {
                Object.values(asignaturas).forEach(bloques => {
                    if (bloques) {
                        bloques.forEach(bloque => {
                            const slotKey = `${bloque.dia}-${bloque.hora}`;
                            if (!uniqueWeeklySlots.has(slotKey)) {
                                uniqueWeeklySlots.add(slotKey);
                                totalWeeklySlots++;
                            }
                        });
                    }
                });
            });
        }

        return {
            planned: plannedToday,
            pending: pendingToday,
            totalWeekly: totalWeeklySlots,
            units: units.length
        };
    }, [activeSchedule, clases, todayString]);

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col gap-6 text-slate-100 animate-in fade-in duration-500">

            {/* 1. Header & Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        {userName ? `Hola, ${userName.split(' ')[0]}` : 'Bienvenido Profe'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        {today.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onNavigateToCalendar}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold border border-slate-700 transition-all flex items-center gap-2"
                    >
                        <Calendar size={16} /> Ver Calendario
                    </button>
                    {/* 'Generate Class' Button Removed for Informative Dashboard */}
                </div>
            </div>

            {/* 2. Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Row 1: Hero + Stats (Desktop: Hero takes 8 cols, Chart 4? Or Hero 4, Chart 8?) 
                    Let's do:
                    [ Stats Row (12) ]
                    [ Hero (5) ] [ Chart (7) ]
                */}

                {/* A. Stats Row */}
                <div className="md:col-span-12">
                    <DashboardStats stats={dashboardStats} />
                </div>

                {/* B. Hero Card (Next Class) */}
                <div className="md:col-span-12 lg:col-span-5 xl:col-span-4 h-[350px]">
                    <NextClassHero
                        nextClass={nextClass}
                        onGenerate={() => {
                            if (nextClass?.status === 'planned' && nextClass.generatedClass) {
                                onEditClass(nextClass.generatedClass);
                            } else {
                                onGenerateClasses();
                            }
                        }}
                    />
                </div>

                {/* C. Charts Section */}
                <div className="md:col-span-12 lg:col-span-7 xl:col-span-8 h-[350px]">
                    <WeeklyChart data={weeklyData} />
                </div>

            </div>
        </div>
    );
};

export default HomeView;

