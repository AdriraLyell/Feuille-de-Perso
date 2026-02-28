import React, { useState, useEffect, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import { generateId } from '../../../utils/factories';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { Plus, Calculator, User, Loader2 } from 'lucide-react';
import { CharacterSyncService, SyncedCharacterSummary } from '../../../services/CharacterSyncService';
import { MotionCard } from '../../../components/ui/motion/MotionCard';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { AdminFormulaEditorItem } from './AdminFormulaEditorItem';
import { AdminFormulaEditorModal } from './AdminFormulaEditorModal';

const DUMMY_PREVIEW_DATA: any = {
    experience: { total: 25, gain: "25" },
    attributes: {
        Physiologie: [
            { name: 'Physique', val2: '3' },
            { name: 'Vigueur', val2: '2' },
            { name: 'Agilité', val2: '3' }
        ],
        Mental: [
            { name: 'Volonté', val2: '4' },
            { name: 'Intelligence', val2: '3' },
            { name: 'Perception', val2: '2' }
        ],
        Social: [
            { name: 'Charisme', val2: '3' },
            { name: 'Empathie', val2: '2' },
            { name: 'Manipulation', val2: '1' }
        ]
    },
    skills: {
        Col_Comp_1: [{ name: 'Arts Martiaux', value: 3 }, { name: 'Athlétisme', value: 2 }],
        Col_Comp_5: [{ name: 'Savoir Mystique', value: 2 }, { name: 'Occultisme', value: 4 }]
    },
    traits: [
        { name: 'Avantage 1', level: 1, category: 'Avantages', tag: 'Social' },
        { name: 'Désavantage 1', level: 2, category: 'Désavantages', tag: 'Physique' }
    ],
    variables: {
        SCENARIOS_COUNT: 5,
        TRAIT_LEVEL: 3
    }
};

interface AdminFormulasEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    settingId?: string;
}

const AdminFormulasEditor: React.FC<AdminFormulasEditorProps> = ({ rules, onUpdate, settingId }) => {
    const lib = rules.libraries?.formulas || [];
    const formulaCounters = lib; // Now it contains all formulas

    const [previewValue, setPreviewValue] = useState<number | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formulaToEdit, setFormulaToEdit] = useState<LibraryFormulaEntry | null>(null);
    const [isNewFormula, setIsNewFormula] = useState(false);

    const [characters, setCharacters] = useState<SyncedCharacterSummary[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<string>('');
    const [realCharData, setRealCharData] = useState<any | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // États pour la modale de suppression
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formulaToDelete, setFormulaToDelete] = useState<LibraryFormulaEntry | null>(null);

    const targetSuggestions = useMemo(() => {
        let suggestions: { value: string, label: string, type: string }[] = [
            { value: 'XP', label: 'Expérience', type: 'Système' }
        ];

        // 1. Collecte des Attributs
        const attrs = Object.values(rules.definitions.attributes || {}).flat()
            .filter(a => a.trim() !== '')
            .sort((a, b) => a.localeCompare(b));
        attrs.forEach(a => suggestions.push({ value: a, label: a, type: 'Attribut' }));

        // 2. Collecte des Attributs Secondaires (si activés)
        if (rules.configurations.global.secondaryAttributes !== false) {
            const secAttrs = Object.values(rules.definitions.secondaryAttributes || {}).flat()
                .filter(a => a.trim() !== '')
                .sort((a, b) => a.localeCompare(b));
            secAttrs.forEach(a => suggestions.push({ value: a, label: a, type: 'Attribut Secondaire' }));
        }

        // 3. Collecte des Compteurs
        const counters = (rules.definitions.counters ? Object.values(rules.definitions.counters) : [])
            .map((c: any) => c.name)
            .filter(c => c && c.trim() !== '')
            .sort((a, b) => a.localeCompare(b));
        counters.forEach(c => suggestions.push({ value: c, label: c, type: 'Compteur' }));

        // 4. Collecte des Compétences de base
        const coreSkills = Object.values(rules.definitions.skills || {}).flat()
            .filter(s => s.trim() !== '');

        // 5. Collecte des Compétences de la bibliothèque (regroupées sous "Compétence")
        const libSkills = (rules.libraries.skills || [])
            .map(s => s.name)
            .filter(s => s.trim() !== '');

        // Fusionner et trier toutes les compétences
        const allSkills = [...new Set([...coreSkills, ...libSkills])].sort((a, b) => a.localeCompare(b));
        allSkills.forEach(s => suggestions.push({ value: s, label: s, type: 'Compétence' }));

        return suggestions;
    }, [rules]);

    const currentPreviewData = realCharData || DUMMY_PREVIEW_DATA;

    useEffect(() => {
        if (settingId) {
            loadCharactersList();
        }
    }, [settingId]);

    const loadCharactersList = async () => {
        if (!settingId) return;
        setIsLoadingList(true);
        try {
            const list = await CharacterSyncService.getCharactersBySettingId(settingId);
            setCharacters(list);
        } catch (error) {
            console.error("Error loading characters list for formulas:", error);
        } finally {
            setIsLoadingList(false);
        }
    };

    const handleCharacterSelect = async (id: string) => {
        setSelectedCharId(id);
        if (!id) {
            setRealCharData(null);
            setPreviewValue(null);
            return;
        }

        setIsLoadingDetails(true);
        try {
            const fullChar = await CharacterSyncService.getCharacterById(id);
            if (fullChar && fullChar.data) {
                setRealCharData(fullChar.data);
                // Clear any manual preview value to force re-evaluation with real data
                setPreviewValue(null);
            }
        } catch (error) {
            console.error("Error loading character details for formulas:", error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const allVariables = [
        'TRAIT_LEVEL',
        'SCENARIOS_COUNT',
        ...lib.map(f => f.code).filter(Boolean), // Codes des autres formules
        ...Object.values(rules.definitions.attributes).flat(),
        ...Object.values(rules.definitions.secondaryAttributes || {}).flat(),
        ...(rules.libraries.skills || []).map(s => s.name)
    ].filter((v, i, a) => a && v && a.indexOf(v) === i) as string[]; // Unique values

    const handleUpdateRules = (newLib: LibraryFormulaEntry[]) => {
        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                formulas: newLib
            }
        });
    };

    const addCounter = () => {
        const newCounter: LibraryFormulaEntry = {
            id: generateId(),
            name: "",
            code: "",
            type: 'variable',
            formula: "10",
            isActive: true,
            isGlobal: true,
            description: "",
            operator: 'ADD'
        };
        setFormulaToEdit(newCounter);
        setIsNewFormula(true);
        setIsModalOpen(true);
    };

    const handleSaveFormula = (formula: LibraryFormulaEntry) => {
        let newLib;
        if (isNewFormula) {
            newLib = [...lib, formula];
        } else {
            newLib = lib.map(c => c.id === formula.id ? formula : c);
        }

        // CASCADE: If code changed, update occurrences in other formulas
        if (!isNewFormula) {
            const oldEntry = lib.find(c => c.id === formula.id);
            const oldCode = oldEntry?.code;
            if (oldCode && oldCode !== formula.code) {
                const regex = new RegExp(`\\b${oldCode}\\b`, 'g');
                newLib = newLib.map(c => {
                    if (c.id !== formula.id && c.formula && c.formula.includes(oldCode)) {
                        return { ...c, formula: c.formula.replace(regex, formula.code || '') };
                    }
                    return c;
                });
            }
        }

        handleUpdateRules(newLib);
        setIsModalOpen(false);
        setFormulaToEdit(null);
    };

    const removeCounter = (id: string) => {
        const formula = lib.find(c => c.id === id);
        if (formula) {
            setFormulaToDelete(formula);
            setIsDeleteModalOpen(true);
        }
    };

    const confirmRemoveCounter = () => {
        if (formulaToDelete) {
            handleUpdateRules(lib.filter(c => c.id !== formulaToDelete.id));
            setIsDeleteModalOpen(false);
            setFormulaToDelete(null);
        }
    };

    return (
        <MotionCard className="p-6 h-full" hoverEffect="glow">
            <div className="flex justify-between items-center border-b border-stone-700/50 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-stone-300 flex items-center gap-2 font-serif tracking-wide">
                        <Calculator className="text-amber-500" /> Formules & Réserves
                    </h2>
                    <p className="text-stone-400 italic text-sm mt-1">
                        Ces formules seront intégrées à la Fiche de Personnage comme réserves numériques calculées.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                            {isLoadingDetails ? <Loader2 size={10} className="animate-spin" /> : <User size={10} />} Source de l'Aperçu
                        </label>
                        <select
                            value={selectedCharId}
                            onChange={(e) => handleCharacterSelect(e.target.value)}
                            disabled={isLoadingList}
                            className="bg-stone-900 border border-stone-800 text-stone-300 text-[10px] font-bold py-1 px-3 rounded-sm outline-none focus:border-amber-500 transition-colors cursor-pointer min-w-[180px]"
                        >
                            <option value="">🔹 Jeu de Données Fictif</option>
                            {characters.map(char => (
                                <option key={char.id} value={char.id}>
                                    🔸 {char.character_name} ({char.player_name || 'Inconnu'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={addCounter}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-stone-950 rounded-sm font-bold shadow-glow-gold hover:bg-amber-500 transition-colors h-fit mt-auto"
                    >
                        <Plus size={16} /> Nouvelle Formule
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {formulaCounters.map(counter => (
                    <AdminFormulaEditorItem
                        key={counter.id}
                        counter={counter}
                        rules={rules}
                        previewValue={previewValue}
                        currentPreviewData={currentPreviewData}
                        allVariables={allVariables}
                        targetSuggestions={targetSuggestions}
                        realCharData={realCharData}
                        onEdit={() => {
                            setFormulaToEdit(counter);
                            setIsNewFormula(false);
                            setIsModalOpen(true);
                        }}
                        onRemove={removeCounter}
                    />
                ))}

                {formulaCounters.length === 0 && (
                    <div className="text-center p-12 bg-stone-900/40 rounded-sm border-2 border-dashed border-stone-800/50 text-stone-500">
                        <Calculator size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold font-serif mb-1 text-stone-400">Aucune Formule créée</h3>
                        <p className="text-sm">Cliquez sur "Nouvelle Formule" pour créer un calcul partagé.</p>
                    </div>
                )}
            </div>

            <AdminFormulaEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveFormula}
                initialFormula={formulaToEdit}
                rules={rules}
                currentPreviewData={currentPreviewData}
                allVariables={allVariables}
                targetSuggestions={targetSuggestions}
                realCharData={realCharData}
                isNew={isNewFormula}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmRemoveCounter}
                title="Supprimer la Formule"
                message={
                    <div className="space-y-2">
                        <p>Voulez-vous vraiment supprimer la formule <strong>{formulaToDelete?.name}</strong> ?</p>
                        {formulaToDelete?.code && (
                            <p className="text-xs opacity-60">Identifiant technique : <code className="bg-black/20 px-1 rounded">{formulaToDelete.code}</code></p>
                        )}
                        <p className="text-xs text-red-400 mt-2">Attention : Si d'autres formules utilisent cet identifiant, leurs calculs risquent de casser.</p>
                    </div>
                }
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                type="danger"
                scheme="mystic"
            />
        </MotionCard >
    );
};

export default AdminFormulasEditor;
