import React from 'react';
import { AlertCircle, GraduationCap, BookOpen, CheckCircle2, Zap, ArrowRight, XCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataConflict } from '../../utils/importExportUtils';
import ThematicButton from '../ui/ThematicButton';
import { LibraryEntry } from '../../types';

interface CloudConflictResolverProps {
    conflicts: DataConflict[];
    resolutionMap: Record<string, 'keep_current' | 'replace'>;
    onResolutionChoice: (key: string, choice: 'keep_current' | 'replace') => void;
    onResolveAll: (choice: 'keep_current' | 'replace') => void;
    onCancel: () => void;
    onConfirm: () => void;
}

const CloudConflictResolver: React.FC<CloudConflictResolverProps> = ({
    conflicts,
    resolutionMap,
    onResolutionChoice,
    onResolveAll,
    onCancel,
    onConfirm
}) => {
    return (
        <div className="flex flex-col h-full overflow-hidden bg-stone-950 text-stone-200">
            {/* Header Section */}
            <div className="bg-stone-900/80 backdrop-blur-md p-5 border-b border-amber-900/30 flex justify-between items-center">
                <div>
                    <h4 className="font-serif text-xl text-amber-500 flex items-center gap-3">
                        <AlertCircle size={24} className="text-amber-500 animate-pulse" />
                        Conflits de Synchronisation
                    </h4>
                    <p className="text-sm text-stone-400 mt-1">
                        Des éléments divergent entre votre version et la version entrante.
                    </p>
                </div>
                <div className="flex gap-3">
                    <ThematicButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onResolveAll('keep_current')}
                    >
                        Tout garder (Actuel)
                    </ThematicButton>
                    <ThematicButton
                        variant="primary"
                        size="sm"
                        onClick={() => onResolveAll('replace')}
                    >
                        Tout remplacer (Cloud)
                    </ThematicButton>
                </div>
            </div>

            {/* Scrollable Conflict List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/img/paper-texture.png')] bg-fixed">
                <AnimatePresence mode="popLayout">
                    {conflicts.map((conflict, idx) => {
                        const choice = resolutionMap[conflict.key] || 'keep_current';

                        // Helper to cast types for safe access
                        const currentAsTrait = conflict.current as LibraryEntry;
                        const incomingAsTrait = conflict.incoming as LibraryEntry;


                        return (
                            <motion.div
                                key={conflict.key}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-stone-900/60 backdrop-blur-sm border border-stone-800 rounded-xl overflow-hidden shadow-2xl"
                            >
                                {/* Conflict Title Bar */}
                                <div className="bg-stone-900/90 px-5 py-3 border-b border-stone-800 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${conflict.type === 'skill' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                            {conflict.type === 'skill' ? <GraduationCap size={20} /> : <BookOpen size={20} />}
                                        </div>
                                        <div>
                                            <span className="font-serif text-lg font-bold text-stone-100">{conflict.name}</span>
                                            <span className="ml-3 text-[10px] uppercase tracking-widest text-stone-500 bg-stone-800 px-2 py-0.5 rounded">
                                                {conflict.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                        <ShieldCheck size={14} className={choice === 'keep_current' ? 'text-blue-500' : 'text-amber-500'} />
                                        {choice === 'keep_current' ? 'Conservation locale' : 'Remplacement Cloud'}
                                    </div>
                                </div>

                                {/* Comparison Grid */}
                                <div className="grid grid-cols-2 gap-px bg-stone-800">
                                    {/* Option: Current */}
                                    <button
                                        type="button"
                                        className={`p-5 cursor-pointer transition duration-300 relative group text-left outline-none focus:ring-2 focus:ring-blue-500/50 z-10 ${choice === 'keep_current'
                                            ? 'bg-blue-900/10'
                                            : 'bg-stone-900/40 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                            }`}
                                        onClick={() => onResolutionChoice(conflict.key, 'keep_current')}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`text-[10px] uppercase font-bold tracking-widest ${choice === 'keep_current' ? 'text-blue-400' : 'text-stone-500'}`}>
                                                Version Actuelle
                                            </span>
                                            {choice === 'keep_current' && (
                                                <motion.div layoutId={`check-${conflict.key}`} className="text-blue-500">
                                                    <CheckCircle2 size={20} />
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {conflict.current.description ? (
                                                <p className="text-sm text-stone-300 italic leading-relaxed">
                                                    "{conflict.current.description}"
                                                </p>
                                            ) : (
                                                <p className="text-sm text-stone-500 italic">Sans description</p>
                                            )}

                                            {conflict.type === 'trait' && (
                                                <div className="flex gap-4">
                                                    <div className="bg-stone-950/50 px-3 py-1 rounded border border-stone-800">
                                                        <span className="text-[10px] text-stone-500 block uppercase">Coût</span>
                                                        <span className="text-amber-500 font-bold">{currentAsTrait.cost}</span>
                                                    </div>
                                                    {currentAsTrait.effects && currentAsTrait.effects.length > 0 && (
                                                        <div className="bg-stone-950/50 px-3 py-1 rounded border border-stone-800">
                                                            <span className="text-[10px] text-stone-500 block uppercase">Effets</span>
                                                            <span className="text-blue-400 font-bold flex items-center gap-1">
                                                                <Zap size={10} /> {currentAsTrait.effects.length}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {choice === 'keep_current' && (
                                            <div className="absolute inset-0 border-2 border-blue-500/30 rounded-none pointer-events-none" />
                                        )}
                                    </button>

                                    {/* Option: Incoming */}
                                    <button
                                        type="button"
                                        className={`p-5 cursor-pointer transition duration-300 relative group text-left outline-none focus:ring-2 focus:ring-amber-500/50 z-10 ${choice === 'replace'
                                            ? 'bg-amber-900/10'
                                            : 'bg-stone-900/40 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                            }`}
                                        onClick={() => onResolutionChoice(conflict.key, 'replace')}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`text-[10px] uppercase font-bold tracking-widest ${choice === 'replace' ? 'text-amber-400' : 'text-stone-500'}`}>
                                                Version Cloud
                                            </span>
                                            {choice === 'replace' && (
                                                <motion.div layoutId={`check-${conflict.key}`} className="text-amber-500">
                                                    <CheckCircle2 size={20} />
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {conflict.incoming.description ? (
                                                <p className="text-sm text-stone-300 italic leading-relaxed">
                                                    "{conflict.incoming.description}"
                                                </p>
                                            ) : (
                                                <p className="text-sm text-stone-500 italic">Sans description</p>
                                            )}

                                            {conflict.type === 'trait' && (
                                                <div className="flex gap-4">
                                                    <div className="bg-stone-950/50 px-3 py-1 rounded border border-stone-800">
                                                        <span className="text-[10px] text-stone-500 block uppercase">Coût</span>
                                                        <span className="text-amber-500 font-bold">{incomingAsTrait.cost}</span>
                                                    </div>
                                                    {incomingAsTrait.effects && incomingAsTrait.effects.length > 0 && (
                                                        <div className="bg-stone-950/50 px-3 py-1 rounded border border-stone-800">
                                                            <span className="text-[10px] text-stone-500 block uppercase">Effets</span>
                                                            <span className="text-blue-400 font-bold flex items-center gap-1">
                                                                <Zap size={10} /> {incomingAsTrait.effects.length}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {choice === 'replace' && (
                                            <div className="absolute inset-0 border-2 border-amber-500/30 rounded-none pointer-events-none" />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-amber-900/30 bg-stone-900/90 flex justify-end gap-4">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2"
                >
                    <XCircle size={18} />
                    Annuler l'opération
                </button>
                <ThematicButton
                    variant="primary"
                    onClick={onConfirm}
                >
                    Valider la Synchronisation <ArrowRight size={18} className="ml-2" />
                </ThematicButton>
            </div>
        </div>
    );
};

export default CloudConflictResolver;
