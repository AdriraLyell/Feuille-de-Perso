import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import { generateId } from '../../../utils/factories';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { Trash2, Plus, Calculator, Info, Check, Filter, Sigma, Code2, AlertCircle, User, Loader2, Sparkles } from 'lucide-react';
import { Parser } from 'expr-eval';
import { CharacterSyncService, SyncedCharacterSummary } from '../../../services/CharacterSyncService';
import { MotionCard } from '../../../components/ui/motion/MotionCard';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import { normalizeString } from '../../../utils/stringUtils';

const isFormulaSyntaxValid = (formula?: string): boolean => {
    if (!formula || formula.trim() === '') return true; // Une équation vide est valide syntaxiquement (on ne l'évalue pas)
    try {
        const parser = new Parser();
        parser.parse(formula);
        return true;
    } catch (e) {
        return false;
    }
};

const isTargetValid = (target: string, rules: RulesData): boolean => {
    if (!target) return true;
    const cleanTarget = target.trim().toLowerCase();
    if (cleanTarget === 'xp' || cleanTarget === 'total') return true;

    // Check Attributes
    const allAttributes = Object.values(rules.definitions.attributes || {}).flat();
    if (allAttributes.some(a => a.toLowerCase() === cleanTarget)) return true;

    // Check Secondary
    const secondaryAttributes = Object.values(rules.definitions.secondaryAttributes || {}).flat();
    if (secondaryAttributes.some(a => a.toLowerCase() === cleanTarget)) return true;

    // Check Counters
    const allCounters = Object.values(rules.definitions.counters || {}).map(c => c.name);
    if (allCounters.some(c => c.toLowerCase() === cleanTarget)) return true;

    // Check Skills
    const allSkills = Object.values(rules.definitions.skills || {}).flat();
    if (allSkills.some(s => s.toLowerCase() === cleanTarget)) return true;

    const allLibSkills = rules.libraries.skills?.map(s => s.name) || [];
    if (allLibSkills.some(s => s.toLowerCase() === cleanTarget)) return true;

    return false;
};

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

/**
 * Specialized input to avoid cursor jumping when performing transformations like toUpperCase()
 */
const CodeInput: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}> = ({ value, onChange, placeholder, className }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');

        setLocalValue(val);
        onChange(val);

        // Restore cursor after state update/re-render
        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(start, end);
            }
        });
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
        />
    );
};

const AdminFormulasEditor: React.FC<AdminFormulasEditorProps> = ({ rules, onUpdate, settingId }) => {
    const lib = rules.libraries?.formulas || [];
    const formulaCounters = lib; // Now it contains all formulas

    const [editingId, setEditingId] = useState<string | null>(null);
    const [previewValue, setPreviewValue] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [characters, setCharacters] = useState<SyncedCharacterSummary[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<string>('');
    const [realCharData, setRealCharData] = useState<any | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
    const targetDropdownRef = useRef<HTMLDivElement>(null);

    // États pour la modale de suppression
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formulaToDelete, setFormulaToDelete] = useState<LibraryFormulaEntry | null>(null);

    // Clicks outside pour fermer le dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
                setIsTargetDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleUpdate = (newLib: LibraryFormulaEntry[]) => {
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
        handleUpdate([...lib, newCounter]);
        setEditingId(newCounter.id);
        setPreviewValue(evaluateFormula("10", currentPreviewData));
    };

    const updateCounter = (id: string, field: keyof LibraryFormulaEntry, value: any) => {
        const oldEntry = lib.find(c => c.id === id);
        const oldCode = oldEntry?.code;
        const isCodeChange = field === 'code' && oldCode && oldCode !== value;

        const generateCodeFromName = (name: string) => {
            return name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // retire les accents
                .toUpperCase()
                .replace(/[\s\-']/g, '_') // remplace espaces, tirets, apostrophes par underscores
                .replace(/[^A-Z0-9_]/g, ''); // garde uniquement alphanumérique et underscores
        };

        const newLib = lib.map(c => {
            if (c.id === id) {
                const updated = { ...c, [field]: value };

                // Auto-génération du code à partir du nom
                if (field === 'name') {
                    const oldExpectedCode = generateCodeFromName(c.name || '');
                    if (!c.code || c.code === oldExpectedCode || c.code.startsWith('VAR_')) {
                        updated.code = generateCodeFromName(value);
                    }
                }

                // Re-evaluate preview if formula, target, operator, effectType or aggregate config changed
                const triggeringFields: (keyof LibraryFormulaEntry)[] = ['formula', 'aggregateConfig', 'type', 'target', 'operator', 'effectType'];
                if (triggeringFields.includes(field)) {
                    setPreviewValue(evaluateFormula(updated.formula || '', currentPreviewData, { entry: updated }));
                }
                return updated as any;
            }

            // CASCADE: If code changed, update occurrences in other formulas
            if (isCodeChange && c.formula && c.formula.includes(oldCode)) {
                // Regex for exact word replacement to avoid partial matches (ex: VAR vs VAR_2)
                const regex = new RegExp(`\\b${oldCode}\\b`, 'g');
                return { ...c, formula: c.formula.replace(regex, value) };
            }

            return c;
        });
        handleUpdate(newLib);
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
            handleUpdate(lib.filter(c => c.id !== formulaToDelete.id));
            setIsDeleteModalOpen(false);
            setFormulaToDelete(null);
        }
    };

    /* 
    // Migration Logic - Kept for reference or future button
    const _orphanCount = (rules.libraries.traits || []).reduce((acc, trait) => {
        return acc + (trait.effects?.filter(e =>
            (e.type === 'formula' && !e.formulaId) ||
            ['attribute_bonus', 'counter_max_bonus', 'xp_bonus'].includes(e.type as string)
        ).length || 0);
    }, 0);

    const _autoMigrateFormulas = () => {
        const currentFormulas = [...lib];
        let traitsUpdated = 0;
        let formulasCreated = 0;

        const newTraits = (rules.libraries.traits || []).map(trait => {
            let traitChanged = false;
            const newEffects = (trait.effects || []).map(effect => {
                const isLegacy = ['attribute_bonus', 'counter_max_bonus', 'xp_bonus'].includes(effect.type as string);
                const isOrphanFormula = effect.type === 'formula' && !effect.formulaId && effect.formula;

                if (isLegacy || isOrphanFormula) {
                    let formulaString = effect.formula || '';
                    let target = effect.target;

                    if (isLegacy) {
                        const legacyEffect = effect as any;
                        if (legacyEffect.type === 'attribute_bonus') {
                            formulaString = legacyEffect.value?.toString() || '0';
                        } else if (legacyEffect.type === 'counter_max_bonus') {
                            formulaString = `${legacyEffect.value || 0} * TRAIT_LEVEL`;
                        } else if (legacyEffect.type === 'xp_bonus') {
                            target = 'XP';
                            if (legacyEffect.method === 'per_scenario') {
                                formulaString = `${legacyEffect.value || 0} * SCENARIOS_COUNT`;
                            } else {
                                formulaString = legacyEffect.value?.toString() || '0';
                            }
                        }
                    }

                    if (!formulaString) return effect;

                    // Try to find a global formula with EXACTLY the same formula string
                    let existing = currentFormulas.find(f => f.formula === formulaString);

                    if (!existing) {
                        // Create one
                        existing = {
                            id: generateId(),
                            name: `Mécanique: ${trait.name}`,
                            type: 'modifier',
                            formula: formulaString,
                            isActive: true,
                            isGlobal: true,
                            description: `Importé depuis le trait ${trait.name}`
                        };
                        currentFormulas.push(existing as any);
                        formulasCreated++;
                    }

                    traitChanged = true;
                    // Return as the new 'formula' type
                    return {
                        ...effect,
                        type: 'formula',
                        formula: formulaString,
                        formulaId: existing.id,
                        target: target,
                        value: undefined, // Clear legacy fields
                        method: undefined // Clear legacy fields
                    } as any;
                }
                return effect;
            });

            if (traitChanged) {
                traitsUpdated++;
                return { ...trait, effects: newEffects };
            }
            return trait;
        });

        if (traitsUpdated > 0) {
            onUpdate({
                ...rules,
                libraries: {
                    ...rules.libraries,
                    traits: newTraits,
                    formulas: currentFormulas
                }
            });
            alert(`${traitsUpdated} traits mis à jour. ${formulasCreated} nouvelles formules créées dans le dictionnaire.`);
        } else {
            alert("Aucune formule orpheline trouvée.");
        }
    };
    */

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
                {formulaCounters.map(counter => {
                    const isEditing = editingId === counter.id;
                    const preview = isEditing && previewValue !== null ? previewValue : evaluateFormula(counter.formula || '', currentPreviewData, { entry: counter });

                    // Calcul du statut de validation
                    let validationStatus: 'valid' | 'warning' | 'error' = 'valid';
                    let tooltipMessage = "Formule complète et valide";

                    // L'équation mathématique doit être analysable (sauf si c'est un agrégat auto)
                    const isMathValid = counter.aggregateConfig ? true : isFormulaSyntaxValid(counter.formula);

                    if (!isMathValid) {
                        validationStatus = 'error';
                        tooltipMessage = "Syntaxe mathématique invalide";
                    } else if (counter.type === 'modifier' || (counter as any).type === 'effect') {
                        const hasTarget = !!(counter.target && counter.target.trim() !== '');
                        const hasOperator = !!(counter.operator && (counter.operator as string) !== '');
                        const hasEquation = !!(counter.formula && counter.formula.trim() !== '');
                        const actualEffectType = counter.effectType || 'modifier';
                        const hasEffectType = !!(actualEffectType && actualEffectType !== '');

                        // Si ForceVariant est actif, la cible n'a pas besoin d'être "valide" au sens strict (car c'est une catégorie de suggestion)
                        const isSuggestionCategory = counter.forceVariant && (
                            normalizeString(counter.target || "") === 'competence' ||
                            normalizeString(counter.target || "") === 'attribut' ||
                            normalizeString(counter.target || "") === 'trait'
                        );

                        if (!hasEffectType) {
                            validationStatus = 'error';
                            tooltipMessage = "Type d'effet manquant";
                        } else if (hasTarget && !counter.forceVariant && !isTargetValid(counter.target!, rules)) {
                            validationStatus = 'error';
                            tooltipMessage = `La cible '${counter.target}' n'existe pas dans les règles`;
                        } else if ((!hasTarget && !counter.forceVariant) || !hasOperator || !hasEquation) {
                            validationStatus = 'warning';
                            tooltipMessage = "Modèle incomplet (sera complété dans le trait)";
                        } else if (counter.forceVariant && !hasTarget) {
                            validationStatus = 'warning';
                            tooltipMessage = "Cible vide : Le joueur devra saisir le nom manuellement.";
                        }
                    } else {
                        // Pour une variable simple
                        if (!counter.formula || counter.formula.trim() === '') {
                            validationStatus = 'warning';
                            tooltipMessage = "Équation vide (sera complétée dans le trait)";
                        }
                    }

                    const isValid = validationStatus !== 'error';

                    return (
                        <div key={counter.id} className={`border rounded-sm overflow-hidden transition-all ${isEditing ? 'border-amber-500 ring-1 ring-amber-500/50 bg-stone-900/80' : 'border-stone-700/50 bg-stone-900/40 hover:border-amber-500/30'}`}>
                            {/* Header */}
                            <div
                                className="p-3 flex justify-between items-center cursor-pointer"
                                onClick={() => {
                                    if (!isEditing) {
                                        setEditingId(counter.id);
                                        setPreviewValue(evaluateFormula(
                                            counter.formula || '',
                                            currentPreviewData,
                                            { entry: counter }
                                        ));
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${counter.type === 'variable' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-amber-500/10 text-amber-500'
                                        }`}>
                                        {counter.aggregateConfig ? <Sigma size={18} /> : <Calculator size={18} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-stone-200">{counter.name}</h3>
                                            {counter.code && <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded font-mono uppercase border border-stone-700">{counter.code}</span>}
                                        </div>
                                        {!isEditing && <p className="text-xs text-stone-500 font-mono mt-0.5">{counter.formula}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold flex items-center gap-1" title={tooltipMessage}>
                                            Aperçu {realCharData ? 'Réel' : '(Fictif)'}
                                            {validationStatus === 'valid' && <Check size={10} className="text-emerald-500" />}
                                            {validationStatus === 'warning' && <AlertCircle size={10} className="text-amber-500" />}
                                            {validationStatus === 'error' && <AlertCircle size={10} className="text-rose-500" />}
                                        </span>
                                        <span className={`font-black text-xl leading-none ${isValid ? 'text-amber-500' : 'text-stone-600'}`}>
                                            {preview !== null && !isNaN(preview) ? preview : 'ERROR'}
                                        </span>
                                    </div>
                                    {isEditing && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                            className="p-2 bg-amber-600 text-stone-950 rounded hover:bg-amber-500"
                                            title="Fermer l'édition"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Editor */}
                            {isEditing && (
                                <div className="p-4 border-t border-stone-700/50 bg-stone-900 flex flex-col gap-4">
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-4">
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Nom (ex: Calcul du Mana)</label>
                                            <input
                                                type="text"
                                                value={counter.name}
                                                onChange={e => updateCounter(counter.id, 'name', e.target.value)}
                                                className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                Code <span className="text-stone-600 italic">(UPPERCASE)</span>
                                            </label>
                                            <CodeInput
                                                value={counter.code || ''}
                                                onChange={val => updateCounter(counter.id, 'code', val)}
                                                placeholder="EX: MA_VARIABLE"
                                                className="w-full p-2 bg-stone-950 border border-stone-700 text-amber-500 font-mono text-xs rounded focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-5">
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Description (Optionnel)</label>
                                            <input
                                                type="text"
                                                value={counter.description || ''}
                                                onChange={e => updateCounter(counter.id, 'description', e.target.value)}
                                                className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Rôle de la Formule</label>
                                        <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                                            <button
                                                onClick={() => updateCounter(counter.id, 'type', 'variable')}
                                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${counter.type === 'variable' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-stone-400 hover:text-stone-300'}`}
                                            >
                                                Variable MJ (Calcul)
                                            </button>
                                            <button
                                                onClick={() => updateCounter(counter.id, 'type', 'modifier')}
                                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${counter.type === 'modifier' || (counter as any).type === 'effect' ? 'bg-amber-600 text-stone-900 border-amber-400/50' : 'text-stone-400 hover:text-stone-300'}`}
                                            >
                                                Effet (Modificateur)
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-stone-500 mt-2 italic px-1">
                                            {counter.type === 'variable' && "Sert de brique de calcul interne (ex: SUM_MYSTIC ou MENACE)."}
                                            {(counter.type === 'modifier' || (counter as any).type === 'effect') && "Modifie une caractéristique existante. Utilisable comme effet de trait."}
                                        </p>
                                    </div>

                                    {counter.type === 'variable' && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Source de la Variable</label>
                                            <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                                                <button
                                                    onClick={() => updateCounter(counter.id, 'aggregateConfig', undefined)}
                                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${!counter.aggregateConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-stone-500 hover:text-stone-400'}`}
                                                >
                                                    Équation Libre
                                                </button>
                                                <button
                                                    onClick={() => updateCounter(counter.id, 'aggregateConfig', { operation: 'sum', targetType: 'skills', filterTarget: 'tag', filterValue: 'Mystique' })}
                                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${counter.aggregateConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-stone-500 hover:text-stone-400'}`}
                                                >
                                                    Somme Automatique (Agrégat)
                                                </button>
                                            </div>

                                            {counter.aggregateConfig && (
                                                <div className="mt-4 p-3 bg-stone-950 border border-blue-500/20 rounded grid grid-cols-2 gap-4 animate-in zoom-in-95">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Opération</label>
                                                        <select
                                                            value={counter.aggregateConfig.operation}
                                                            onChange={e => updateCounter(counter.id, 'aggregateConfig', { ...counter.aggregateConfig, operation: e.target.value })}
                                                            className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                                                        >
                                                            <option value="sum">Somme (Total des points)</option>
                                                            <option value="count">Nombre (Total d'éléments)</option>
                                                            <option value="max">Maximum (Plus haut score)</option>
                                                            <option value="avg">Moyenne</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Groupe Cible</label>
                                                        <select
                                                            value={counter.aggregateConfig.targetType}
                                                            onChange={e => updateCounter(counter.id, 'aggregateConfig', { ...counter.aggregateConfig, targetType: e.target.value })}
                                                            className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                                                        >
                                                            <option value="skills">Compétences</option>
                                                            <option value="attributes">Attributs</option>
                                                            <option value="traits">Traits (Avantages/Désav.)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Filtrer par</label>
                                                        <select
                                                            value={counter.aggregateConfig.filterTarget}
                                                            onChange={e => updateCounter(counter.id, 'aggregateConfig', { ...counter.aggregateConfig, filterTarget: e.target.value })}
                                                            className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                                                        >
                                                            <option value="tag">Tag (ex: Mystique)</option>
                                                            <option value="category">Catégorie / Colonne</option>
                                                            <option value="name">Nom Contient</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Mot-clé du filtre</label>
                                                        <input
                                                            type="text"
                                                            value={counter.aggregateConfig.filterValue}
                                                            onChange={e => updateCounter(counter.id, 'aggregateConfig', { ...counter.aggregateConfig, filterValue: e.target.value })}
                                                            className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                                                            placeholder="ex: Mystique"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(counter.type === 'modifier' || (counter as any).type === 'effect') && (
                                        <React.Fragment>
                                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Cible de l'Effet (ex: Force, XP, PV)</label>
                                                    <div className="relative" ref={targetDropdownRef}>
                                                        <input
                                                            type="text"
                                                            value={counter.target || ''}
                                                            autoComplete="off"
                                                            onFocus={() => setIsTargetDropdownOpen(true)}
                                                            onChange={e => {
                                                                updateCounter(counter.id, 'target', e.target.value);
                                                                setIsTargetDropdownOpen(true);
                                                            }}
                                                            className={`w-full p-2 bg-stone-950 border text-stone-300 rounded focus:border-amber-500 outline-none ${!counter.target ? 'border-dashed border-stone-700' : 'border-stone-700'}`}
                                                            placeholder="Cible libre (ex: Force)"
                                                        />

                                                        {isTargetDropdownOpen && (
                                                            <div className="absolute z-50 w-full mt-1 bg-stone-900 border border-amber-500/30 rounded shadow-2xl max-h-96 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                                                                {targetSuggestions
                                                                    .filter((s: any) => !counter.target || s.value.toLowerCase().includes(counter.target.toLowerCase()) || s.type.toLowerCase().includes(counter.target.toLowerCase()))
                                                                    .map((s: any, idx: number) => (
                                                                        <button
                                                                            key={`${s.value}-${idx}`}
                                                                            onClick={() => {
                                                                                updateCounter(counter.id, 'target', s.value);
                                                                                setIsTargetDropdownOpen(false);
                                                                            }}
                                                                            className="w-full text-left px-3 py-2 hover:bg-amber-500/10 border-b border-stone-800/50 last:border-0 group flex justify-between items-center transition-colors"
                                                                        >
                                                                            <span className="font-bold text-stone-300 group-hover:text-amber-500">{s.value}</span>
                                                                            <span className="text-[9px] uppercase font-bold text-stone-600 px-1.5 py-0.5 bg-stone-950 rounded border border-stone-800">{s.type}</span>
                                                                        </button>
                                                                    ))}
                                                                {targetSuggestions.filter((s: any) => !counter.target || s.value.toLowerCase().includes(counter.target.toLowerCase())).length === 0 && (
                                                                    <div className="p-3 text-xs text-stone-600 italic text-center">
                                                                        Aucune suggestion correspondante
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {!counter.target && <div className="absolute right-2 top-2 text-[8px] text-amber-500/50 font-bold uppercase pointer-events-none">Optionnel</div>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Type d'Effet</label>
                                                        <select
                                                            value={counter.effectType || 'modifier'}
                                                            onChange={e => updateCounter(counter.id, 'effectType', e.target.value)}
                                                            className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                                        >
                                                            <option value="modifier">Calcul Standard (Attribut, XP, Réserve)</option>
                                                            <option value="block_skill_increase">Blocage de Progression</option>
                                                            <option value="master_skill">Maîtrise (Forcer à 5)</option>
                                                            <option value="free_skill_rank">Rang Gratuit (Cumulable)</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex gap-4 items-end">
                                                        {counter.effectType !== 'block_skill_increase' && counter.effectType !== 'master_skill' && (
                                                            <div className="flex-grow">
                                                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Opération</label>
                                                                <select
                                                                    value={counter.operator || ''}
                                                                    onChange={e => updateCounter(counter.id, 'operator', e.target.value as any)}
                                                                    className={`w-full p-2 bg-stone-950 border text-stone-300 rounded focus:border-amber-500 outline-none ${!counter.operator ? 'border-dashed border-stone-700 text-stone-500' : 'border-stone-700'}`}
                                                                >
                                                                    <option value="">-- Aucune (à définir dans le trait) --</option>
                                                                    <option value="ADD">Ajoûter (ADD)</option>
                                                                    <option value="SET">Remplacer (SET)</option>
                                                                    <option value="SUB">Soustraire (SUB)</option>
                                                                </select>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col items-center pb-1 min-w-[90px]">
                                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 whitespace-nowrap text-center">Forcer Variante</label>
                                                            <button
                                                                onClick={() => updateCounter(counter.id, 'forceVariant', !counter.forceVariant)}
                                                                className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${counter.forceVariant ? 'bg-indigo-600 shadow-glow-indigo' : 'bg-stone-800 border border-stone-700'}`}
                                                                title={counter.forceVariant ? 'Variante activée' : 'Activer la variante'}
                                                            >
                                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center ${counter.forceVariant ? 'translate-x-6' : 'translate-x-0'}`}>
                                                                    {counter.forceVariant && <Sparkles size={10} className="text-indigo-600" />}
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {counter.forceVariant && (
                                                <div className="mt-3 p-2 bg-indigo-950/20 border border-indigo-500/30 rounded flex gap-3 items-start animate-in slide-in-from-top-1 duration-300">
                                                    <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                                                    <div>
                                                        <p className="text-[10px] text-indigo-300/80 leading-relaxed font-medium">
                                                            <strong className="text-indigo-300">Logique de Variante Dynamique :</strong> Le trait utilisant cette mécanique exigera une précision (Variante) de la part du joueur.
                                                            Cette précision deviendra la cible de l'effet.
                                                        </p>
                                                        <p className="text-[10px] text-indigo-400/60 mt-1 italic">
                                                            Note : Indiquez "Compétence" ou "Attribut" dans le champ Cible pour suggérer une liste au joueur.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    )}

                                    {!counter.aggregateConfig && counter.effectType !== 'block_skill_increase' && counter.effectType !== 'master_skill' && (
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Équation Mathématique</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={counter.formula || ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        updateCounter(counter.id, 'formula', val);

                                                        // Get the word under cursor or last word
                                                        const words = val.split(/[\s+\-*/()]/);
                                                        const lastWord = words[words.length - 1];
                                                        setSearchQuery(lastWord.length > 1 ? lastWord : '');
                                                    }}
                                                    className={`w-full p-3 bg-stone-950 border text-stone-300 rounded font-mono text-sm focus:border-amber-500 outline-none shadow-inner ${!counter.formula ? 'border-dashed border-stone-700' : 'border-stone-700'}`}
                                                    placeholder="Laisse vide pour saisir une Valeur Fixe dans le trait"
                                                />
                                                {!counter.formula && <div className="absolute right-3 top-3 text-[8px] text-amber-500/50 font-bold uppercase">Modèle de valeur</div>}

                                                {searchQuery && (
                                                    <div className="absolute z-10 top-full left-0 w-full mt-1 bg-stone-900 border border-amber-500/30 rounded shadow-2xl max-h-40 overflow-y-auto">
                                                        {allVariables
                                                            .filter(v => v.toLowerCase().includes(searchQuery.toLowerCase()) && v !== searchQuery)
                                                            .slice(0, 10)
                                                            .map(v => (
                                                                <button
                                                                    key={v}
                                                                    onClick={() => {
                                                                        const parts = counter.formula.split(/([\s+\-*/()])/);
                                                                        parts[parts.length - 1] = v;
                                                                        updateCounter(counter.id, 'formula', parts.join(''));
                                                                        setSearchQuery('');
                                                                    }}
                                                                    className="w-full text-left p-2 hover:bg-amber-600 hover:text-stone-950 text-stone-300 text-xs border-b border-stone-800 last:border-0 transition-colors"
                                                                >
                                                                    {v}
                                                                </button>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3">
                                                <span className="text-[10px] text-stone-500 flex items-center gap-1 uppercase tracking-widest font-bold mb-2">
                                                    <Info size={12} /> Suggestions rapides (cliquez pour ajouter) :
                                                </span>
                                                <div className="flex wrap gap-1.5">
                                                    {allVariables
                                                        .filter(v => ['TRAIT_LEVEL', 'SCENARIOS_COUNT', 'Physique', 'Volonté', 'Constitution', 'Empathie', 'Intelligence'].includes(v))
                                                        .map(v => (
                                                            <button
                                                                key={v}
                                                                onClick={() => updateCounter(counter.id, 'formula', (counter.formula.trim() ? counter.formula + ' + ' : '') + v)}
                                                                className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded font-mono text-stone-400 transition-all hover:text-amber-400"
                                                            >
                                                                {v}
                                                            </button>
                                                        ))
                                                    }
                                                    <span className="text-stone-700 text-[10px] self-center ml-2 italic">Tapez pour chercher d'autres variables...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-start items-center mt-2 pt-4 border-t border-stone-700/50">
                                        <button
                                            onClick={() => removeCounter(counter.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded text-xs font-bold transition-colors"
                                        >
                                            <Trash2 size={14} /> Supprimer
                                        </button>
                                    </div>
                                </div>
                            )
                            }
                        </div>
                    );
                })}

                {formulaCounters.length === 0 && (
                    <div className="text-center p-12 bg-stone-900/40 rounded-sm border-2 border-dashed border-stone-800/50 text-stone-500">
                        <Calculator size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold font-serif mb-1 text-stone-400">Aucune Formule créée</h3>
                        <p className="text-sm">Cliquez sur "Nouvelle Formule" pour créer un calcul partagé.</p>
                    </div>
                )}
            </div>

            {/* Maintenance & Unification Tool */}
            {/* Removed: Auto-migration is now handled transparently on campaign load */}

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
