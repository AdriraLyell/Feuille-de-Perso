
import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { ShieldCheck, Lock, Loader2, AlertCircle, Sparkles, Scroll, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';
import ThematicButton from '../../components/ui/ThematicButton';
import { APP_VERSION } from '../../constants';

const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Veuillez saisir votre email pour réinitialiser votre mot de passe.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/admin',
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccessMessage("Un email de réinitialisation a été envoyé.");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-1000">
            {/* Background Texture & Effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-30 pointer-events-none" />

            {/* Mystic Glows (Amber & Crimson) */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.1, 0.15, 0.1],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-crimson-blood/5 rounded-full blur-[100px] pointer-events-none"
            />

            <MotionFade delay={0.1} className="w-full max-w-lg z-10">
                <MotionCard
                    className="overflow-hidden border border-amber-900/30 bg-stone-900/40 backdrop-blur-md shadow-glass"
                    hoverEffect="glow"
                >
                    {/* Header */}
                    <div className="bg-stone-900/60 p-10 text-center border-b border-amber-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Scroll size={100} className="text-stone-500 rotate-12" />
                        </div>

                        <div className="w-20 h-20 bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-glow-gold border border-amber-500/30 relative">
                            <ShieldCheck size={40} />
                            <Sparkles className="absolute -top-1 -right-1 text-amber-400 animate-pulse" size={20} />
                        </div>

                        <h1 className="text-3xl font-serif font-black text-amber-500 tracking-tighter uppercase mb-2">
                            Bureau du Maître
                        </h1>
                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 italic">
                            Accès aux Chroniques • Registre des Élus
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="p-10">
                        {error && (
                            <MotionFade key="error">
                                <div className="mb-8 p-4 bg-crimson-blood/5 border border-crimson-blood/30 rounded-sm text-rose-400 text-sm flex items-start gap-4 shadow-sm animate-shake">
                                    <AlertCircle size={20} className="mt-0.5 shrink-0 text-crimson-blood" />
                                    <span className="font-serif italic font-medium">{error}</span>
                                </div>
                            </MotionFade>
                        )}

                        {successMessage && (
                            <MotionFade key="success">
                                <div className="mb-8 p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-sm text-emerald-400 text-sm flex items-start gap-4 shadow-sm">
                                    <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                                    <span className="font-serif italic font-medium">{successMessage}</span>
                                </div>
                            </MotionFade>
                        )}

                        <div className="space-y-8">
                            <div className="relative group">
                                <label className="absolute -top-2.5 left-3 bg-stone-950 px-2 text-[9px] font-bold text-amber-700 uppercase tracking-[0.2em] group-focus-within:text-amber-400 transition-colors z-20">
                                    Sceau de l'Identité
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-stone-950/50 border border-stone-800 rounded-sm focus:border-amber-500/50 focus:bg-stone-950 text-stone-200 outline-none transition-all font-sans placeholder:text-stone-800 hover:border-stone-700 shadow-inner"
                                    placeholder="maitre@chroniques.fr"
                                />
                            </div>

                            <div className="relative group">
                                <div className="flex justify-between items-center absolute -top-2.5 left-3 right-3 z-20 pointer-events-none">
                                    <label className="bg-stone-950 px-2 text-[9px] font-bold text-amber-700 uppercase tracking-[0.2em] group-focus-within:text-amber-400 transition-colors">
                                        Parole Sacrée
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="bg-stone-950 px-2 text-[9px] font-bold text-stone-600 hover:text-amber-500 uppercase tracking-widest transition-colors pointer-events-auto"
                                    >
                                        Secret égaré ?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required={!successMessage}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-4 pl-12 bg-stone-950/50 border border-stone-800 rounded-sm focus:border-amber-500/50 focus:bg-stone-950 text-stone-200 outline-none transition-all font-sans placeholder:text-stone-800 hover:border-stone-700 shadow-inner"
                                        placeholder="••••••••"
                                    />
                                    <Lock size={18} className="absolute left-4 top-4.5 text-stone-700 group-focus-within:text-amber-700 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <ThematicButton
                            type="submit"
                            variant="primary"
                            size="xl"
                            isLoading={isLoading}
                            className="w-full mt-12 !tracking-[0.25em]"
                            rightIcon={!isLoading ? <ArrowRight size={20} /> : undefined}
                        >
                            FRANCHIR LE SEUIL
                        </ThematicButton>

                        <div className="mt-10 pt-8 border-t border-stone-800/30 text-center">
                            <p className="text-[10px] text-stone-700 font-bold uppercase tracking-[0.15em] leading-relaxed max-w-[200px] mx-auto italic">
                                "Nul secret ne survit au regard de celui qui sait."
                            </p>
                        </div>
                    </form>
                </MotionCard>
            </MotionFade>

            <MotionFade delay={0.6} className="mt-12 flex flex-col items-center gap-2">
                <div className="h-px w-12 bg-stone-800 mb-2" />
                <span className="text-stone-800 text-[9px] font-mono tracking-[0.4em] uppercase">
                    System v{APP_VERSION} | Neural Encryption Active
                </span>
            </MotionFade>
        </div>
    );
};

export default LoginScreen;
