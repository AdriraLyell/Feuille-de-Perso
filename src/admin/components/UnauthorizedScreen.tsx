import React from 'react';
import { ShieldAlert, LogOut, Home, Info } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Session } from '@supabase/supabase-js';

interface UnauthorizedScreenProps {
    session?: Session | null;
}

const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({ session }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-300">
                <div className="bg-red-500 p-8 flex justify-center">
                    <ShieldAlert size={80} className="text-white animate-pulse" />
                </div>

                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Accès Non Autorisé</h1>
                    <p className="text-slate-600 mb-8">
                        Vous ne disposez pas des privilèges administrateur nécessaires pour accéder à cet espace.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl text-left text-xs font-mono text-slate-500 overflow-auto max-h-40 border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold uppercase tracking-wider">
                                <Info size={14} />
                                Diagnostic Session
                            </div>
                            <p>Email: {session?.user?.email}</p>
                            <p>User Meta: {JSON.stringify(session?.user?.user_metadata || {})}</p>
                            <p>App Meta: {JSON.stringify(session?.user?.app_metadata || {})}</p>
                        </div>

                        <a
                            href="/"
                            className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-slate-200"
                        >
                            <Home size={18} />
                            Retour à l'Accueil
                        </a>

                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="flex items-center justify-center gap-2 w-full bg-white border-2 border-slate-100 hover:border-red-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold py-3 px-4 rounded-xl transition-all"
                        >
                            <LogOut size={18} />
                            Se Déconnecter
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 text-center border-t border-slate-100 text-xs text-slate-400">
                    Seigneurs des Mystères RPG • Système de Sécurité
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedScreen;
