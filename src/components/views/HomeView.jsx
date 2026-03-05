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
            desc: "Pide por correo o WhatsApp a tu administración que nos envíe tu horario para cargarlo en el sistema.",
            icon: <Clock size={28} className="text-amber-400" />,
            color: "amber",
            btnText: "Horarios",
            action: null // Informativo o enviar a vista horarios si existe
        },
        {
            title: "Extensión de Unidades",
            desc: "Crea la estructura del año. Sube un PDF del Mineduc y deja que la IA asigne el tiempo a cada unidad.",
            icon: <BookOpen size={28} className="text-emerald-400" />,
            color: "emerald",
            btnText: "Gestor de Unidades",
            action: onNavigateUnits
        },
        {
            title: "Planificación de Clases",
            desc: "Una vez tengamos unidades u horario, crea tus clases detalladas (Inicio, Desarrollo, Cierre) con 1 clic.",
            icon: <Sparkles size={28} className="text-violet-400" />,
            color: "violet",
            btnText: "Generador Mágico",
            action: onOpenAiModal
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
                    Sigue estos <strong className="text-white">4 sencillos pasos</strong> para configurar tu asistente y preparar tu año escolar en tiempo récord.
                </p>
            </div>

            {/* Workflow / Tutorial Section */}
            <div className="w-full max-w-5xl relative">

                {/* Línea conectora Desktop */}
                <div className="hidden lg:block absolute top-28 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-violet-500/20 z-0"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 z-10 relative">
                    {tutorialSteps.map((step, idx) => {
                        const bgColors = {
                            blue: 'bg-blue-500/10 hover:border-blue-500/50',
                            amber: 'bg-amber-500/10 hover:border-amber-500/50',
                            emerald: 'bg-emerald-500/10 hover:border-emerald-500/50',
                            violet: 'bg-violet-500/10 hover:border-violet-500/50',
                        };
                        const iconBgColors = {
                            blue: 'bg-blue-500/20 border-blue-500/30',
                            amber: 'bg-amber-500/20 border-amber-500/30',
                            emerald: 'bg-emerald-500/20 border-emerald-500/30',
                            violet: 'bg-violet-500/20 border-violet-500/30',
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
                                                step.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' :
                                                    'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/20'
                                            }`}
                                    >
                                        {step.btnText} <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <div className="w-full py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed">
                                        Pendiente de Asignación
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default HomeView;
