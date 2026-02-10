import React from 'react';
import { Activity, BookOpen, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }) => {
    // Defines subtle gradients based on color prop
    const bgStyles = {
        indigo: "from-indigo-500/10 to-blue-500/5 border-indigo-500/20 text-indigo-400",
        purple: "from-purple-500/10 to-pink-500/5 border-purple-500/20 text-purple-400",
        emerald: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-400",
        amber: "from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-400",
        rose: "from-rose-500/10 to-red-500/5 border-rose-500/20 text-rose-400",
    };

    const style = bgStyles[color] || bgStyles.indigo;

    return (
        <div className={`
            relative overflow-hidden rounded-2xl border p-5 
            bg-gradient-to-br ${style}
            transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20
        `}>
            {/* Background Icon Watermark */}
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <Icon size={100} strokeWidth={1} />
            </div>

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
                    {subtext && <p className="text-xs text-slate-500 mt-1 font-medium">{subtext}</p>}
                </div>
                <div className={`p-2.5 rounded-xl bg-slate-950/30 border border-white/5 shadow-inner ${style.split(' ')[3]}`}> {/* text-color */}
                    <Icon size={20} />
                </div>
            </div>

            {/* Micro Trend Indicator (Mockup for design) */}
            {trend && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
                    <span className={trend === 'up' ? "text-emerald-400" : "text-rose-400"}>
                        {trend === 'up' ? "↑" : "↓"} 2.5%
                    </span>
                    <span className="text-slate-600">vs semana pasada</span>
                </div>
            )}
        </div>
    );
};

const DashboardStats = ({ stats }) => {
    // stats: { planned, total, pending, units }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Clases Listas"
                value={stats.planned}
                subtext="Planificadas para hoy"
                icon={CheckCircle}
                color="emerald"
            />
            <StatCard
                title="Pendientes"
                value={stats.pending}
                subtext="Sin planificar hoy"
                icon={AlertCircle}
                color="amber"
            />
            <StatCard
                title="Total Semanal"
                value={stats.totalWeekly}
                subtext="Clases esta semana"
                icon={Calendar}
                color="indigo"
            />
            <StatCard
                title="Unidades"
                value={stats.units}
                subtext="Unidades activas"
                icon={BookOpen}
                color="purple"
            />
        </div>
    );
};

export default DashboardStats;
