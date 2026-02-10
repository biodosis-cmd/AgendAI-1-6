import React, { useEffect, useState } from 'react';
import { X, Clock, Target, Play, BookOpen, CheckCircle, ChevronLeft, ChevronRight, Presentation, Flag } from 'lucide-react';
import { CURSO_HEX_COLORES } from '@/constants';

const ZenModeModal = ({ clase, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    if (!clase) return null;

    const hexColor = CURSO_HEX_COLORES[clase.curso] || '#94a3b8';
    const totalSlides = 3;

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) setCurrentSlide(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide, onClose]);

    // Format Date
    const formattedDate = new Date(clase.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    const formattedTime = new Date(clase.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-300">

            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center p-6 bg-transparent absolute top-0 left-0 right-0 z-50">
                <div className="flex gap-2">
                    {[0, 1, 2].map((s) => (
                        <div
                            key={s}
                            onClick={() => setCurrentSlide(s)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === s ? 'w-12 bg-white' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                        />
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <X size={32} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex items-center justify-center relative overflow-hidden">

                {/* SLIDE 0: COVER (PORTADA) */}
                {currentSlide === 0 && (
                    <div className="text-center space-y-8 max-w-5xl animate-in zoom-in-95 fade-in duration-500">
                        <div className="inline-block p-4 rounded-full bg-white/5 mb-6 border border-white/10">
                            <Presentation size={64} style={{ color: hexColor }} />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-light text-slate-300 uppercase tracking-widest">
                            {clase.asignatura}
                        </h2>
                        <h1
                            className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none"
                            style={{ color: hexColor, textShadow: `0 0 100px ${hexColor}40` }}
                        >
                            {clase.curso}
                        </h1>
                        <div className="text-2xl text-slate-400 font-mono mt-12 bg-white/5 inline-block px-8 py-4 rounded-2xl">
                            {formattedDate} • {formattedTime}
                        </div>
                    </div>
                )}

                {/* SLIDE 1: OBJECTIVE (OBJETIVO) */}
                {currentSlide === 1 && (
                    <div className="max-w-6xl w-full px-8 animate-in slide-in-from-right-10 fade-in duration-500">
                        <div className="flex items-center gap-4 mb-12 opacity-80">
                            <Target size={48} className="text-indigo-400" />
                            <h3 className="text-3xl font-bold text-indigo-200 uppercase tracking-widest">Objetivo de la Clase</h3>
                        </div>
                        <p className="text-4xl md:text-6xl font-medium text-white leading-tight">
                            "{clase.objetivo || "Sin objetivo definido."}"
                        </p>
                    </div>
                )}

                {/* SLIDE 2: JOURNEY (RECORRIDO) */}
                {currentSlide === 2 && (
                    <div className="w-full max-w-7xl px-8 h-full flex flex-col justify-center animate-in slide-in-from-bottom-10 fade-in duration-500">
                        <h3 className="text-3xl font-bold text-slate-500 uppercase tracking-widest mb-16 text-center">Momentos de la Clase</h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                            {/* Connecting Line */}
                            <div className="hidden md:block absolute top-[28px] left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 opacity-30 -z-10"></div>

                            {/* Inicio */}
                            <div className="group">
                                <div className="w-14 h-14 bg-slate-900 border-4 border-emerald-500 rounded-full flex items-center justify-center mb-6 z-10 relative shadow-[0_0_30px_rgba(16,185,129,0.4)] md:mx-auto">
                                    <Play size={24} className="text-white ml-1" />
                                </div>
                                <div className="bg-slate-900/60 p-6 rounded-2xl border border-emerald-500/30 hover:bg-slate-800/80 transition-all h-[400px] overflow-y-auto custom-scrollbar">
                                    <h4 className="text-xl font-bold text-emerald-400 mb-4 uppercase">Inicio</h4>
                                    <p className="text-lg text-slate-300 whitespace-pre-line leading-relaxed">
                                        {clase.inicio || "Sin descripción."}
                                    </p>
                                </div>
                            </div>

                            {/* Desarrollo */}
                            <div className="group md:-mt-8"> {/* Staggered effect */}
                                <div className="w-14 h-14 bg-slate-900 border-4 border-indigo-500 rounded-full flex items-center justify-center mb-6 z-10 relative shadow-[0_0_30px_rgba(99,102,241,0.4)] md:mx-auto">
                                    <BookOpen size={24} className="text-white" />
                                </div>
                                <div className="bg-indigo-950/40 p-6 rounded-2xl border border-indigo-500/40 hover:bg-slate-800/80 transition-all h-[440px] overflow-y-auto custom-scrollbar shadow-2xl">
                                    <h4 className="text-xl font-bold text-indigo-400 mb-4 uppercase">Desarrollo</h4>
                                    <p className="text-lg text-white whitespace-pre-line leading-relaxed">
                                        {clase.desarrollo || "Sin descripción."}
                                    </p>
                                </div>
                            </div>

                            {/* Aplicación */}
                            <div className="group">
                                <div className="w-14 h-14 bg-slate-900 border-4 border-amber-500 rounded-full flex items-center justify-center mb-6 z-10 relative shadow-[0_0_30px_rgba(245,158,11,0.4)] md:mx-auto">
                                    <Target size={24} className="text-white" />
                                </div>
                                <div className="bg-slate-900/60 p-6 rounded-2xl border border-amber-500/30 hover:bg-slate-800/80 transition-all h-[400px] overflow-y-auto custom-scrollbar">
                                    <h4 className="text-xl font-bold text-amber-400 mb-4 uppercase">Aplicación</h4>
                                    <p className="text-lg text-slate-300 whitespace-pre-line leading-relaxed">
                                        {clase.aplicacion || "Sin descripción."}
                                    </p>
                                </div>
                            </div>

                            {/* Cierre */}
                            <div className="group md:-mt-8">
                                <div className="w-14 h-14 bg-slate-900 border-4 border-rose-500 rounded-full flex items-center justify-center mb-6 z-10 relative shadow-[0_0_30px_rgba(244,63,94,0.4)] md:mx-auto">
                                    <Flag size={24} className="text-white" />
                                </div>
                                <div className="bg-slate-900/60 p-6 rounded-2xl border border-rose-500/30 hover:bg-slate-800/80 transition-all h-[440px] overflow-y-auto custom-scrollbar">
                                    <h4 className="text-xl font-bold text-rose-400 mb-4 uppercase">Cierre</h4>
                                    <p className="text-lg text-slate-300 whitespace-pre-line leading-relaxed">
                                        {clase.cierre || "Sin descripción."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Navigation Controls (Side & Bottom) */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                <div className="text-sm font-mono opacity-50 bg-slate-900/50 px-4 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                    {currentSlide + 1} / {totalSlides}
                </div>
            </div>

            <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800/80 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 text-slate-400 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none z-40 backdrop-blur-sm shadow-xl"
            >
                <ChevronLeft size={24} />
            </button>

            <button
                onClick={handleNext}
                disabled={currentSlide === totalSlides - 1}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800/80 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 text-slate-400 hover:text-white transition-all disabled:opacity-0 disabled:pointer-events-none z-40 backdrop-blur-sm shadow-xl"
            >
                <ChevronRight size={24} />
            </button>
        </div>
    );
};

export default ZenModeModal;
