import React from 'react';
import { BookOpen, Sparkles, ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react';

const HomeView = ({ userName, onOpenUnitPlanner, onOpenAiModal }) => {

    const steps = [
        {
            title: "1. Configura tu Año",
            desc: "Define las fechas de inicio, término y vacaciones en Configuración.",
            status: "completed"
        },
        {
            title: "2. Solicita tu horario",
            desc: "Contacta al proveedor para que te entregue la licencia que activará tu horario.",
            status: "pending"
        },
        {
            title: "3. Planifica tus Clases",
            desc: "Crea clases rápidas individualmente o planifica todas las sesiones de una unidad (requiere tener unidades creadas previamente).",
            status: "pending"
        },
        {
            title: "4. Genera Reportes",
            desc: "Obtén documentos profesionales de tu planificación listos para presentar.",
            status: "pending"
        }
    ];

    return (
        <div className="p-6 md:p-12 max-w-[1200px] mx-auto flex flex-col items-center text-slate-100 animate-in fade-in zoom-in-95 duration-500">

            {/* Hero Section */}
            <div className="text-center space-y-6 mb-16 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-4">
                    <Sparkles size={16} />
                    <span>Tu asistente de planificación inteligente</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white pb-2">
                    {userName ? `Hola, ${userName.split(' ')[0]}` : 'Bienvenido a AgendAI'}
                </h1>

                <p className="text-slate-400 text-xl leading-relaxed">
                    Todo listo para comenzar a planificar. Selecciona una opción para empezar a crear tus clases de manera rápida y eficiente.
                </p>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-20">

                {/* Opción 1: Crear desde Unidad */}
                <button
                    onClick={onOpenUnitPlanner}
                    className="group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all hover:scale-[1.02] border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 hover:border-emerald-500/50"
                >
                    <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                            <BookOpen size={32} />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                Planificar Unidad
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-400" />
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                Genera automáticamente todas las clases de una unidad que ya hayas creado. Ideal para estructurar tu planificación completa en un solo clic.
                            </p>
                        </div>
                    </div>
                </button>

                {/* Opción 2: Creación Rápida / Mágica */}
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
                                Generador Mágico
                                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-violet-400" />
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                ¿Necesitas clases rápidas? Crea sesiones individuales o semanales al instante con ayuda de la inteligencia artificial.
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Tutorial Steps */}
            <div className="w-full max-w-5xl border-t border-slate-800/50 pt-12">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-white mb-2">¿Cómo funciona AgendAI?</h2>
                    <p className="text-slate-500">Sigue estos tres simples pasos para tener tu año escolar bajo control</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-[2.5rem] left-[12%] right-[12%] h-px bg-slate-800 -z-10"></div>

                    {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center group">
                            <div className={`
                                w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold border-4 transition-all duration-300 bg-[#0f1221]
                                ${step.status === 'completed'
                                    ? 'border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/20'
                                    : 'border-slate-800 text-slate-500 group-hover:border-slate-700'}
                            `}>
                                {step.status === 'completed' ? <CheckCircle2 size={32} /> : idx + 1}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-[250px] mx-auto">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default HomeView;
