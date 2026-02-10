import React, { useState } from 'react';
import { loginWithEmail } from '@/services/auth';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginView() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await loginWithEmail(email, password);
            // AuthContext will handle redirect via onAuthStateChange
        } catch (err) {
            console.error(err);
            setError('Credenciales incorrectas o error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 font-sans text-slate-100">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-800/50 p-8 shadow-2xl backdrop-blur-sm border border-slate-700/50">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Agenda Docente</h2>
                    <p className="text-slate-400">Inicia sesión para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-200 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Mail className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-lg border border-slate-600 bg-slate-900/50 p-3 pl-10 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Correo electrónico"
                            />
                        </div>

                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Lock className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-lg border border-slate-600 bg-slate-900/50 p-3 pl-10 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Contraseña"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            'Ingresar'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
