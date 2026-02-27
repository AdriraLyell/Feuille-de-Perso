
import React, { useState, useMemo } from 'react';
import { Trophy, X, ChevronDown } from 'lucide-react';
import { CharacterSheetData } from '../../../types';
import { RulesData } from '../../../types/rules';

interface MasterSkillWizardProps {
    isOpen: boolean;
    traitName: string;
    onClose: () => void;
    onConfirm: (skillCategoryId: string, skillName: string) => void;
    sheet: CharacterSheetData;
    rules: RulesData | null;
}

/**
 * Wizard affiché quand un trait avec l'effet "Maître" est ajouté.
 * Permet au joueur de choisir une compétence primaire à rang 0 pour la mettre au rang 5.
 */
const MasterSkillWizard: React.FC<MasterSkillWizardProps> = ({
    isOpen,
    traitName,
    onClose,
    onConfirm,
    sheet,
    rules
}) => {
    const [selectedKey, setSelectedKey] = useState<string>('');

    // Construire la liste des compétences éligibles :
    // - rang 0 (value === 0)
    // - catégories primaires uniquement (pas 'secondary', pas comportement 'Arrière-plan')
    const eligibleSkills = useMemo(() => {
        const skills: { categoryId: string; skillName: string; key: string }[] = [];

        // 1. Collect currently possessed skills
        // 2. Collect ALL library skills to allow choosing a new one
        const categories = rules?.definitions?.skillCategories || [];
        const libSkills = rules?.libraries?.skills || [];

        // Helper to check if skill is primary
        const isPrimary = (catId: string) => {
            const cat = categories.find(c => c.id === catId);
            if (cat) return cat.behavior === 'Compétence';

            // Legacy fallback
            return [
                'talents', 'competences', 'connaissances', 'autres_competences', 'autres',
                'Col_Comp_1', 'Col_Comp_2', 'Col_Comp_3', 'Col_Comp_4', 'Col_Comp_5', 'Col_Comp_7'
            ].includes(catId);
        };

        // Add library skills first
        libSkills
            .filter(ls => isPrimary(ls.defaultCategory || ''))
            .forEach(ls => {
                const catId = ls.defaultCategory || 'competences';
                const key = `${catId}::${ls.name}`;
                skills.push({ categoryId: catId, skillName: ls.name, key });
            });

        // Add skills already on sheet if not already in list
        Object.entries(sheet.skills).forEach(([catId, list]) => {
            if (!isPrimary(catId) || !Array.isArray(list)) return;
            list.forEach(s => {
                if (!s.name.trim()) return;
                const key = `${catId}::${s.name}`;
                if (!skills.some(existing => existing.key === key)) {
                    skills.push({ categoryId: catId, skillName: s.name, key });
                }
            });
        });

        return skills.sort((a, b) => a.skillName.localeCompare(b.skillName));
    }, [sheet.skills, rules]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!selectedKey) return;
        const found = eligibleSkills.find(s => s.key === selectedKey);
        if (found) {
            onConfirm(found.categoryId, found.skillName);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-purple-700 text-white">
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Trophy size={18} />
                        Maîtrise — {traitName}
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-4">
                    <p className="text-sm text-stone-600 leading-relaxed">
                        Ce trait confère la <strong>Maîtrise</strong> d'une compétence.
                        Choisissez la compétence à porter au <strong>rang 5</strong> (seules les compétences à rang 0 sont éligibles).
                    </p>

                    {eligibleSkills.length === 0 ? (
                        <div className="text-center text-stone-400 italic text-sm py-4 border border-dashed border-stone-200 rounded-lg">
                            Aucune compétence éligible (toutes sont déjà au rang 1 ou plus).
                        </div>
                    ) : (
                        <div className="relative">
                            <select
                                className="w-full appearance-none border border-purple-300 rounded-lg px-3 py-2.5 pr-8 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white shadow-sm cursor-pointer"
                                value={selectedKey}
                                onChange={e => setSelectedKey(e.target.value)}
                            >
                                <option value="">— Choisir une compétence —</option>
                                {eligibleSkills.map(s => (
                                    <option key={s.key} value={s.key}>
                                        {s.skillName}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-end gap-2 bg-stone-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedKey}
                        className="px-4 py-2 text-sm font-bold bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Trophy size={14} />
                        Confirmer la Maîtrise
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MasterSkillWizard;
