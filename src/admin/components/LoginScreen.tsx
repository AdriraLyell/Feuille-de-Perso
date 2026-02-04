import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { ShieldCheck, Lock, Loader2, AlertCircle } from 'lucide-react';

const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            // Auth state change will be picked up by AdminApp
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-[#bfae85]/30 overflow-hidden animate-in zoom-in duration-300">

                {/* Header */}
                <div className="bg-[#2d241e] p-8 text-center">
                    <div className="w-16 h-16 bg-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg border-4 border-[#3d322b]">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-amber-50">Administration</h1>
                    <p className="text-amber-200/60 text-sm mt-2">Veuillez vous identifier pour accéder au grimoire.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none transition-all font-sans"
                                placeholder="maitre.du.jeu@gmail.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mot de passe</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none transition-all font-sans"
                                    placeholder="••••••••"
                                />
                                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-8 bg-[#2d241e] hover:bg-[#1e1814] text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" /> Connexion...
                            </>
                        ) : (
                            "Accéder au Dashboard"
                        )}
                    </button>

                    <p className="mt-6 text-center text-xs text-gray-400">
                        Accès réservé. Toute tentative d'intrusion sera punie par un jet de désastre critique.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
