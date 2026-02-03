
import React, { useState, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { calculateDiff, mergeRules, ImportOptions } from '../../utils/importDiffUtils';
import { ArrowRight, Check, X, AlertTriangle, Settings, BookOpen, Database, Layers, CheckCircle2 } from 'lucide-react';

interface ImportWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mergedRules: RulesData) => void;
    currentRules: RulesData;
    candidateRules: RulesData;
}

const ImportWizardModal: React.FC<ImportWizardModalProps> = ({ isOpen, onClose, onConfirm, currentRules, candidateRules }) => {
    if (!isOpen) return null;

    const [activeStep, setActiveStep] = useState<1 | 2>(1);

    // Default Options
    const [options, setOptions] = useState<ImportOptions>({
        sections: {
            general: true,
            attributes: true,
            skills: true,
            backgrounds: true,
            counters: true,
            libraries: true
        },
        libraryStrategy: 'ignore' // Safer default
    });

    const diff = useMemo(() => calculateDiff(currentRules, candidateRules), [currentRules, candidateRules]);

    const handleToggleSection = (key: keyof ImportOptions['sections']) => {
        setOptions(prev => ({
            ...prev,
            sections: { ...prev.sections, [key]: !prev.sections[key] }
        }));
    };

    const handleConfirm = () => {
        const merged = mergeRules(currentRules, candidateRules, options);
        onConfirm(merged);
    };

    const SectionCard = ({ id, label, icon: Icon, details }: { id: keyof ImportOptions['sections'], label: string, icon: any, details: string[] }) => {
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
                                    <p className="text-xs text-slate-500">Traits, Compétences (Réserve), Spécialisations</p>
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
                                        <div className="text-xs uppercase font-bold text-slate-500">Spécialisations</div>
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

                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Check size={20} /> Confirmer la Fusion
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportWizardModal;
