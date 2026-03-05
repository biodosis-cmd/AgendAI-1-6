import React from 'react';
import { Calendar, Clock, BookOpen, Sparkles, ArrowRight, Settings, Plus } from 'lucide-react';

const HomeView = ({ userName, onNavigateConfig, onNavigateUnits, onOpenAiModal }) => {

    const tutorialSteps = [
        {
            title: "Configura tu Año",
            desc: "Define cuándo empieza, termina y cuáles son las vacaciones de tu año escolar.",
            icon: <Settings size={28} className="text-blue-400" />,
            color: "blue",
            btnText: "Ir a Configuración",
            action: onNavigateConfig
        },
        {
            title: "Carga tu Horario",
            desc: "Envíanos tu horario semanal de clases para cargarlo en el sistema.",
            icon: <Clock size={28} className="text-amber-400" />,
            color: "amber",
            btnText: "Horarios",
            action: null // Informativo o enviar a vista horarios si existe
        }
    ];

    return (
        <div className="p-6 md:p-12 max-w-[1200px] mx-auto flex flex-col items-center text-slate-100 animate-in fade-in zoom-in-95 duration-500">

            {/* Hero Section */}
            <div className="text-center space-y-6 mb-12 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-2">
                    <Sparkles size={16} />
                    <span>Tutorial de Inicio Rápido</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4">
                    {userName ? `Hola, ${userName.split(' ')[0]}` : 'Bienvenido a AgendAI'}
                </h1>

                <p className="text-slate-400 text-lg leading-relaxed">
                    Completa estos <strong className="text-white">2 pasos previos obligatorios</strong> antes de poder automatizar tu planificación.
                </p>
            </div>

            {/* Config & Setup Section (2 Steps Only) */}
            <div className="w-full max-w-3xl relative mb-16">

                {/* Línea conectora Desktop */}
                <div className="hidden md:block absolute top-28 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-500/20 to-amber-500/20 -z-10"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative">
                    {tutorialSteps.map((step, idx) => {
                        const bgColors = {
                            blue: 'hover:border-blue-500/50',
                            amber: 'hover:border-amber-500/50',
                        };
                        const iconBgColors = {
                            blue: 'bg-blue-500/20 border-blue-500/30',
                            amber: 'bg-amber-500/20 border-amber-500/30',
                        };

                        return (
                            <div key={idx} className={`relative bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-2 group ${bgColors[step.color]}`}>

                                {/* Número flotante */}
                                <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors z-20">
                                    {idx + 1}
                                </div>

                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110 mt-2 ${iconBgColors[step.color]}`}>
                                    {step.icon}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                                    {step.desc}
                                </p>

                                {step.action ? (
                                    <button
                                        onClick={step.action}
                                        className={`w-full py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all group-hover:shadow-lg ${step.color === 'blue' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' :
                                                'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
                                            }`}
                                    >
                                        {step.btnText} <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <div className="w-full py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed">
                                        Pendientes
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-full max-w-4xl border-t border-slate-800/50 pt-16">

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-white mb-3">Planificación Inteligente</h2>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        Una vez configurado tu año y horario, utiliza estas herramientas para dejar que la IA haga el trabajo pesado por ti.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">

                    {/* Opción 1: Unidades */}
                    <button
                        onClick={onNavigateUnits}
                        className="group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all hover:scale-[1.02] border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 hover:border-emerald-500/50"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all"></div>

                        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <Sparkles size={32} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                    PlanificAI Unidad
                                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-400" />
                                </h3>
                                <p className="text-slate-400 leading-relaxed text-sm">
                                    Crea tus unidades manualmente o programa tu año completo importando formatos del Mineduc o texto libre.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Opción 2: Rápida */}
                    <button
                        onClick={onOpenAiModal}
                        className="group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all hover:scale-[1.02] border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 hover:border-violet-500/50"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-violet-500/10 blur-[100px] rounded-full group-hover:bg-violet-500/20 transition-all"></div>

                        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                                <Sparkles size={32} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                    PlanificAI Rápida
                                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-violet-400" />
                                </h3>
                                <p className="text-slate-400 leading-relaxed text-sm">
                                    Crea y agenda automáticamente tus clases libremente o bien, crea todas las clases de tus unidades de golpe.
                                </p>
                            </div>
                        </div>
                    </button>

                </div>
            </div>

        </div>
    );
};

export default HomeView;
