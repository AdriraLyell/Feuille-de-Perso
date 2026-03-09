
import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { calculateDiff, mergeRules, ImportOptions } from '../../utils/importDiffUtils';
import { Check, X, AlertTriangle, Settings, BookOpen, Database, Layers, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, PlusCircle, RefreshCw } from 'lucide-react';

interface ImportWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mergedRules: RulesData, excludedIds: string[]) => void;
    currentRules: RulesData;
    candidateRules: RulesData;
}

const ImportWizardModal: React.FC<ImportWizardModalProps> = ({ isOpen, onClose, onConfirm, currentRules, candidateRules }) => {
    // 1. Hooks (must be at the top)
    const [options, setOptions] = useState<ImportOptions>({
        sections: {
            general: true,
            attributes: true,
            skills: true,
            backgrounds: true,
            counters: true,
            libraries: true
        },
        libraryStrategy: 'ignore', // Safer default
        excludedIds: []
    });

    const [showDetails, setShowDetails] = useState(false);
    const [expandedDiffId, setExpandedDiffId] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const diff = useMemo(() => calculateDiff(currentRules, candidateRules), [currentRules, candidateRules]);

    if (!isOpen) return null;

    // 2. Actions
    const handleToggleSection = (key: keyof ImportOptions['sections']) => {
        setOptions(prev => ({
            ...prev,
            sections: { ...prev.sections, [key]: !prev.sections[key] }
        }));
    };

    const handleConfirm = async () => {
        if (isConfirming) return;
        setIsConfirming(true);
        try {
            const merged = mergeRules(currentRules, candidateRules, options);
            await onConfirm(merged, options.excludedIds || []);
        } catch (err) {
            console.error("[ImportWizard] Fusion Error:", err);
            alert("Une erreur est survenue lors de la fusion.");
        } finally {
            setIsConfirming(false);
        }
    };

    const toggleExclusion = (id: string) => {
        setOptions(prev => {
            const excluded = prev.excludedIds || [];
            if (excluded.includes(id)) {
                return { ...prev, excludedIds: excluded.filter(x => x !== id) };
            } else {
                return { ...prev, excludedIds: [...excluded, id] };
            }
        });
    };

    const truncateStr = (val: unknown, len = 20) => {
        if (val === null || val === undefined) return "";
        const s = typeof val === 'string' ? val : JSON.stringify(val);
        if (!s) return "";
        return s.length > len ? s.substring(0, len) + '...' : s;
    };

    const SectionCard = ({ id, label, icon: Icon, details }: { id: keyof ImportOptions['sections'], label: string, icon: React.ElementType, details: string[] }) => {
        const hasChanges = details.length > 0;

        return (
            <div className={`border rounded-lg p-4 transition-all ${options.sections[id] ? 'bg-white border-blue-300 ring-1 ring-blue-100' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={options.sections[id]}
                        onChange={() => handleToggleSection(id)}
                        className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon size={18} className={options.sections[id] ? 'text-blue-600' : 'text-gray-400'} />
                            <h4 className="font-bold text-gray-900">{label}</h4>
                            {hasChanges && <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Modifié</span>}
                            {!hasChanges && <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full">Identique</span>}
                        </div>
                        {hasChanges && (
                            <ul className="text-xs text-gray-600 list-disc list-inside mt-2 space-y-0.5">
                                {details.slice(0, 3).map((d, i) => <li key={i}>{d}</li>)}
                                {details.length > 3 && <li className="italic">... et {details.length - 3} autres</li>}
                            </ul>
                        )}
                        {!hasChanges && <p className="text-xs text-gray-400 italic mt-1">Aucune différence détectée.</p>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Database className="text-blue-400" /> Assistant d'Importation
                        </h2>
                        <p className="text-slate-400 text-xs mt-1">Analysez et fusionnez les données importées avec précautions.</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-6 bg-slate-50">

                    {/* Step Alerts */}
                    {!diff.hasChanges && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex gap-3 text-green-800">
                            <CheckCircle2 className="shrink-0" />
                            <div>
                                <h4 className="font-bold">Aucune différence majeure détectée</h4>
                                <p className="text-sm">Le fichier importé semble identique à la configuration actuelle sur les points clés analysés.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <SectionCard
                            id="general"
                            label="Configuration Générale"
                            icon={Settings}
                            details={diff.details.general}
                        />
                        <SectionCard
                            id="attributes"
                            label="Attributs"
                            icon={Layers}
                            details={diff.details.attributes}
                        />
                        <SectionCard
                            id="skills"
                            label="Compétences"
                            icon={BookOpen}
                            details={diff.details.skills}
                        />
                        <SectionCard
                            id="counters"
                            label="Compteurs & Jauges"
                            icon={Settings}
                            details={diff.details.counters}
                        />
                    </div>

                    {/* Libraries Special Section */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={options.sections.libraries}
                                    onChange={() => handleToggleSection('libraries')}
                                    className="w-5 h-5 rounded text-blue-600"
                                />
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        <BookOpen size={20} className="text-amber-600" /> Bibliothèques de Contenu
                                    </h4>
                                    <p className="text-xs text-slate-500">Traits, Compétences (Réserve), Spécialités</p>
                                </div>
                            </div>
                        </div>

                        {options.sections.libraries && (
                            <div className="pl-8 space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-slate-50 p-3 rounded border">
                                        <div className="text-xs uppercase font-bold text-slate-500">Traits</div>
                                        <div className="font-mono text-lg font-bold text-blue-600">+{diff.details.libraries.traits.new}</div>
                                        <div className="text-[10px] text-amber-600">{diff.details.libraries.traits.conflict} conflits</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded border">
                                        <div className="text-xs uppercase font-bold text-slate-500">Compétences</div>
                                        <div className="font-mono text-lg font-bold text-blue-600">+{diff.details.libraries.skills.new}</div>
                                        <div className="text-[10px] text-amber-600">{diff.details.libraries.skills.conflict} conflits</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded border">
                                        <div className="text-xs uppercase font-bold text-slate-500">Spécialités</div>
                                        <div className="font-mono text-lg font-bold text-blue-600">+{diff.details.libraries.specializations.new}</div>
                                        <div className="text-[10px] text-amber-600">{diff.details.libraries.specializations.conflict} conflits</div>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                    <h5 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Stratégie en cas de conflit (Item existant)
                                    </h5>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="strategy"
                                                value="ignore"
                                                checked={options.libraryStrategy === 'ignore'}
                                                onChange={() => setOptions(o => ({ ...o, libraryStrategy: 'ignore' }))}
                                                className="text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className="text-sm font-medium">Ignorer (Garder actuel)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="strategy"
                                                value="overwrite"
                                                checked={options.libraryStrategy === 'overwrite'}
                                                onChange={() => setOptions(o => ({ ...o, libraryStrategy: 'overwrite' }))}
                                                className="text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className="text-sm font-medium">Écraser (Mettre à jour)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="strategy"
                                                value="copy"
                                                checked={options.libraryStrategy === 'copy'}
                                                onChange={() => setOptions(o => ({ ...o, libraryStrategy: 'copy' }))}
                                                className="text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className="text-sm font-medium">Copier (Doublon)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details View */}
                    <div className="mt-4">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200"
                        >
                            {showDetails ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            Voir le détail des changements dans les bibliothèques
                        </button>

                        {showDetails && (
                            <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                {Object.entries(diff.details.libraries).map(([key, stats]) => {
                                    if (stats.newItems.length === 0 && stats.conflicts.length === 0) return null;

                                    return (
                                        <div key={key} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700 uppercase">
                                                <span>{key} ({stats.newItems.length + stats.conflicts.length})</span>
                                            </div>
                                            <div className="p-3 space-y-4">
                                                {/* New Items */}
                                                {stats.newItems.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1">
                                                            <PlusCircle size={12} /> Nouveaux éléments ({stats.newItems.length})
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {stats.newItems.map((item, i) => {
                                                                const isExcluded = options.excludedIds?.includes(item.id);
                                                                return (
                                                                    <label key={i} className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer ${isExcluded ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-green-50/30 border-green-100 hover:bg-green-50'}`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!isExcluded}
                                                                            onChange={() => toggleExclusion(item.id)}
                                                                            className="w-3.5 h-3.5 rounded text-green-600 focus:ring-green-500"
                                                                        />
                                                                        <span className="text-xs font-medium text-slate-700 truncate">{item.name}</span>
                                                                        {!isExcluded && <span className="ml-auto text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase font-mono">Ajouté</span>}
                                                                        {isExcluded && <span className="ml-auto text-[9px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase text-nowrap font-mono">Exclu</span>}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Conflicts */}
                                                {stats.conflicts.length > 0 && (
                                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                                        <div className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-1">
                                                            <AlertTriangle size={12} /> Conflits détectés ({stats.conflicts.length})
                                                        </div>
                                                        <div className="space-y-2">
                                                            {stats.conflicts.map((conflict, i) => {
                                                                const candidate = conflict.candidate as { id: string };
                                                                const isExcluded = options.excludedIds?.includes(candidate.id);

                                                                const toggleFieldExclusion = (itemId: string, field: string) => {
                                                                    setOptions(prev => {
                                                                        const fieldExclusions = prev.fieldExclusions || {};
                                                                        const itemExclusions = fieldExclusions[itemId] || [];

                                                                        const newExclusions = itemExclusions.includes(field)
                                                                            ? itemExclusions.filter(f => f !== field)
                                                                            : [...itemExclusions, field];

                                                                        return {
                                                                            ...prev,
                                                                            fieldExclusions: {
                                                                                ...fieldExclusions,
                                                                                [itemId]: newExclusions
                                                                            }
                                                                        };
                                                                    });
                                                                };

                                                                const itemFieldExclusions = options.fieldExclusions?.[conflict.id] || [];
                                                                const isPartiallyExcluded = !isExcluded && itemFieldExclusions.length > 0 && itemFieldExclusions.length < conflict.differences.length;
                                                                const isFullyFieldExcluded = !isExcluded && itemFieldExclusions.length === conflict.differences.length;

                                                                // Dynamic Badge Text
                                                                let actionLabel = "Ignoré";
                                                                let actionClass = "bg-gray-100 text-gray-500 border-gray-200";

                                                                if (!isExcluded) {
                                                                    if (options.libraryStrategy === 'overwrite') {
                                                                        if (isPartiallyExcluded) {
                                                                            actionLabel = "Partiel";
                                                                            actionClass = "bg-blue-50 text-blue-600 border-blue-200";
                                                                        } else if (isFullyFieldExcluded) {
                                                                            actionLabel = "Ignoré";
                                                                            actionClass = "bg-gray-100 text-gray-500 border-gray-200";
                                                                        } else {
                                                                            actionLabel = "Remplacé";
                                                                            actionClass = "bg-amber-100 text-amber-700 border-amber-200";
                                                                        }
                                                                    } else if (options.libraryStrategy === 'copy') {
                                                                        actionLabel = "Doublon";
                                                                        actionClass = "bg-blue-100 text-blue-700 border-blue-200";
                                                                    }
                                                                } else {
                                                                    actionLabel = "Exclu";
                                                                    actionClass = "bg-red-50 text-red-500 border-red-100";
                                                                }

                                                                return (
                                                                    <div key={i} className={`border rounded-lg p-3 transition-colors ${isExcluded ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'}`}>
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={!isExcluded}
                                                                                onChange={() => toggleExclusion(candidate.id)}
                                                                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                                                                            />
                                                                            <div className="font-bold text-sm text-slate-800">{conflict.name}</div>
                                                                            <span className={`ml-auto text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase font-mono ${actionClass}`}>
                                                                                {actionLabel}
                                                                            </span>
                                                                        </div>
                                                                        {!isExcluded && options.libraryStrategy === 'overwrite' && (
                                                                            <div className="pl-7 space-y-1.5 mt-2 pt-2 border-t border-slate-50">
                                                                                {conflict.differences.map((d, di) => {
                                                                                    const isFieldExcluded = itemFieldExclusions.includes(d.field);
                                                                                    const diffId = `${conflict.id}-${d.field}`;
                                                                                    const isExpanded = expandedDiffId === diffId;
                                                                                    
                                                                                    return (
                                                                                        <div key={di} className={`flex items-start gap-2 text-xs group ${isFieldExcluded ? 'opacity-50' : ''}`}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={!isFieldExcluded}
                                                                                                onChange={() => toggleFieldExclusion(conflict.id, d.field)}
                                                                                                className="mt-0.5 w-3 h-3 rounded text-blue-500 focus:ring-blue-400 cursor-pointer"
                                                                                            />
                                                                                            <div className="flex-grow">
                                                                                                <div 
                                                                                                    className="font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                                                                                                    onClick={() => setExpandedDiffId(isExpanded ? null : diffId)}
                                                                                                >
                                                                                                    {d.label} {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} :
                                                                                                </div>
                                                                                                {!isExpanded ? (
                                                                                                    <div className="inline ml-1" onClick={() => setExpandedDiffId(isExpanded ? null : diffId)}>
                                                                                                        <span className="text-slate-400 line-through mr-1 cursor-pointer italic">{truncateStr(d.prev, 40)}</span>
                                                                                                        <span className="text-blue-600 font-medium cursor-pointer">→ {truncateStr(d.next, 40)}</span>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="mt-2 pl-3 border-l-2 border-blue-400 bg-slate-50/50 p-2 rounded-r">
                                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                                            {/* Valeur Actuelle */}
                                                                                                            <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm flex flex-col h-full">
                                                                                                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 border-b border-slate-100 pb-1 flex items-center justify-between">
                                                                                                                    <span className="flex items-center gap-1"><X size={12} /> Valeur Actuelle</span>
                                                                                                                </div>
                                                                                                                <div className="text-slate-500 line-through text-xs whitespace-pre-wrap break-words font-mono flex-grow">
                                                                                                                    {d.prev ? (typeof d.prev === 'string' ? d.prev : JSON.stringify(d.prev, null, 2)) : <span className="italic opacity-40 text-[10px]">(Vide)</span>}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            {/* Nouvelle Valeur */}
                                                                                                            <div className="bg-blue-50 p-2.5 rounded border border-blue-200 shadow-sm flex flex-col h-full ring-1 ring-blue-50">
                                                                                                                <div className="text-[10px] uppercase font-bold text-blue-600 mb-2 border-b border-blue-100 pb-1 flex items-center justify-between">
                                                                                                                    <span className="flex items-center gap-1"><Check size={12} /> Importé (Nouveau)</span>
                                                                                                                </div>
                                                                                                                <div className="text-blue-800 font-semibold text-xs whitespace-pre-wrap break-words font-mono flex-grow">
                                                                                                                    {d.next ? (typeof d.next === 'string' ? d.next : JSON.stringify(d.next, null, 2)) : <span className="italic text-blue-300 text-[10px]">(Vide)</span>}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                        {!isExcluded && options.libraryStrategy !== 'overwrite' && (
                                                                            <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 pl-7 italic">
                                                                                {conflict.differences.map((d, di) => (
                                                                                    <li key={di}>{d.label} sera {options.libraryStrategy === 'copy' ? 'copié' : 'ignoré'}</li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className={`px-6 py-2 ${isConfirming ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold rounded-lg shadow-lg transition-colors flex items-center gap-2`}
                    >
                        {isConfirming ? (
                            <>
                                <RefreshCw size={20} className="animate-spin" /> Fusion en cours...
                            </>
                        ) : (
                            <>
                                <Check size={20} /> Confirmer la Fusion
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportWizardModal;
