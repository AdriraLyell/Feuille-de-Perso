import React from 'react';
import { AlertOctagon, GraduationCap, BookOpen, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { DataConflict } from '../../utils/importExportUtils';

interface ConflictResolverProps {
    conflicts: DataConflict[];
    resolutionMap: Record<string, 'keep_current' | 'replace'>;
    onResolutionChoice: (key: string, choice: 'keep_current' | 'replace') => void;
    onResolveAll: (choice: 'keep_current' | 'replace') => void;
    onCancel: () => void;
    onConfirm: () => void;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({
    conflicts,
    resolutionMap,
    onResolutionChoice,
    onResolveAll,
    onCancel,
    onConfirm
}) => {
    return (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-amber-50 p-4 border-b border-amber-200">
                <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                    <AlertOctagon size={20} />
                    Conflits détectés ({conflicts.length})
                </h4>
                <p className="text-xs text-amber-800 mb-3">
                    Des éléments portent le même nom mais ont des propriétés différentes. Choisissez quelle version conserver.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onResolveAll('keep_current')}
                        className="text-xs bg-white border border-amber-300 text-amber-900 px-3 py-1 rounded hover:bg-amber-100 transition-colors"
                    >
                        Tout garder (Ma version)
                    </button>
                    <button
                        onClick={() => onResolveAll('replace')}
                        className="text-xs bg-white border border-amber-300 text-amber-900 px-3 py-1 rounded hover:bg-amber-100 transition-colors"
                    >
                        Tout remplacer (Import)
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
                {conflicts.map((conflict, idx) => {
                    const choice = resolutionMap[conflict.key] || 'keep_current';

                    return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2 font-bold text-sm text-gray-700 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    {conflict.type === 'skill'
                                        ? <GraduationCap size={16} className="text-purple-600" />
                                        : <BookOpen size={16} className="text-blue-600" />
                                    }
                                    <span>{conflict.name}</span>
                                </div>
                                {conflict.type === 'trait' && (
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                                        Trait : {conflict.current.type}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-gray-200">
                                {/* Current */}
                                <div
                                    className={`p-3 cursor-pointer transition-colors ${choice === 'keep_current' ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : 'hover:bg-gray-50'}`}
                                    onClick={() => onResolutionChoice(conflict.key, 'keep_current')}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Actuel</span>
                                        {choice === 'keep_current' && <CheckCircle2 size={16} className="text-blue-600" />}
                                    </div>
                                    <div className="text-xs text-gray-700 space-y-1">
                                        {conflict.current.description && <p className="italic">"{conflict.current.description}"</p>}
                                        {conflict.type === 'trait' && (
                                            <>
                                                <p className="font-mono bg-gray-100 inline-block px-1 rounded">Coût: {conflict.current.cost}</p>
                                                {conflict.current.effects?.length > 0 && (
                                                    <p className="text-amber-600 flex items-center gap-1"><Zap size={10} /> {conflict.current.effects.length} effet(s)</p>
                                                )}
                                            </>
                                        )}
                                        {conflict.type === 'skill' && !conflict.current.description && (
                                            <p className="text-gray-400">(Pas de description)</p>
                                        )}
                                    </div>
                                </div>

                                {/* Incoming */}
                                <div
                                    className={`p-3 cursor-pointer transition-colors ${choice === 'replace' ? 'bg-orange-50 ring-2 ring-inset ring-orange-300' : 'hover:bg-gray-50'}`}
                                    onClick={() => onResolutionChoice(conflict.key, 'replace')}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Import</span>
                                        {choice === 'replace' && <CheckCircle2 size={16} className="text-orange-600" />}
                                    </div>

                                    <div className="text-xs text-gray-700 space-y-1">
                                        {conflict.incoming.description && <p className="italic">"{conflict.incoming.description}"</p>}
                                        {conflict.type === 'trait' && (
                                            <>
                                                <p className="font-mono bg-gray-100 inline-block px-1 rounded">Coût: {conflict.incoming.cost}</p>
                                                {conflict.incoming.effects?.length > 0 && (
                                                    <p className="text-amber-600 flex items-center gap-1"><Zap size={10} /> {conflict.incoming.effects.length} effet(s)</p>
                                                )}
                                            </>
                                        )}
                                        {conflict.type === 'skill' && !conflict.incoming.description && (
                                            <p className="text-gray-400">(Pas de description)</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
                <button onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-50">Annuler</button>
                <button
                    onClick={onConfirm}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center gap-2"
                >
                    Confirmer la fusion <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default ConflictResolver;
