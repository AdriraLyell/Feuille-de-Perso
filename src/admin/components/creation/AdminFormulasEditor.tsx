import React, { useState, useRef, useEffect } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import { generateId } from '../../../utils/factories';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { Trash2, Plus, Calculator, Info, Check, Filter, Sigma, Code2, AlertCircle, User, Loader2 } from 'lucide-react';
import { CharacterSyncService, SyncedCharacterSummary } from '../../../services/CharacterSyncService';
import { MotionCard } from '../../../components/ui/motion/MotionCard';

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
        'XP_TOTAL',
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
            name: "Nouvelle Variable",
            code: "VAR_" + generateId().substring(0, 4).toUpperCase(),
            type: 'variable',
            formula: "10",
            isActive: true,
            isGlobal: true,
            description: ""
        };
        handleUpdate([...lib, newCounter]);
        setEditingId(newCounter.id);
        setPreviewValue(evaluateFormula("10", currentPreviewData));
    };

    const updateCounter = (id: string, field: keyof LibraryFormulaEntry, value: any) => {
        const oldEntry = lib.find(c => c.id === id);
        const oldCode = oldEntry?.code;
        const isCodeChange = field === 'code' && oldCode && oldCode !== value;

        const newLib = lib.map(c => {
            if (c.id === id) {
                const updated = { ...c, [field]: value };
                // Re-evaluate preview if formula or aggregate config changed
                if (field === 'formula' || field === 'aggregateConfig' || field === 'type') {
                    setPreviewValue(evaluateFormula(updated.formula || '', currentPreviewData, updated));
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
        if (!confirm("Voulez-vous vraiment supprimer cette formule ?")) return;
        handleUpdate(lib.filter(c => c.id !== id));
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
                    const preview = isEditing && previewValue !== null ? previewValue : evaluateFormula(counter.formula || '', currentPreviewData, counter);

                    return (
                        <div key={counter.id} className={`border rounded-sm overflow-hidden transition-all ${isEditing ? 'border-amber-500 ring-1 ring-amber-500/50 bg-stone-900/80' : 'border-stone-700/50 bg-stone-900/40 hover:border-amber-500/30'}`}>
                            {/* Header */}
                            <div
                                className="p-3 flex justify-between items-center cursor-pointer"
                                onClick={() => {
                                    if (!isEditing) {
                                        setEditingId(counter.id);
                                        setPreviewValue(evaluateFormula(counter.formula || '', currentPreviewData, counter));
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
                                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold flex items-center gap-1">
                                            Aperçu {realCharData ? 'Réel' : '(Fictif)'}
                                            {preview !== null && !isNaN(preview) ?
                                                <Check size={10} className="text-emerald-500" /> :
                                                <AlertCircle size={10} className="text-rose-500" />
                                            }
                                        </span>
                                        <span className={`font-black text-xl leading-none ${preview !== null && !isNaN(preview) ? 'text-amber-500' : 'text-stone-600'}`}>
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
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Cible de l'Effet (ex: Force, XP, PV)</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={counter.target || ''}
                                                        onChange={e => updateCounter(counter.id, 'target', e.target.value)}
                                                        className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                                        placeholder="Chercher une cible..."
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Type d'Action (Sémantique)</label>
                                                <select
                                                    value={counter.effectType || ''}
                                                    onChange={e => updateCounter(counter.id, 'effectType', e.target.value)}
                                                    className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                                >
                                                    <option value="">Standard (Bonus numérique)</option>
                                                    <option value="attribute_bonus">Bonus d'Attribut (val2)</option>
                                                    <option value="xp_bonus">Gain d'Expérience</option>
                                                    <option value="block_skill_increase">Blocage de Compétence</option>
                                                    <option value="free_skill_rank">Rang de Compétence Gratuit</option>
                                                    <option value="master_skill">Maîtrise (Fixe à 5)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {!counter.aggregateConfig && (
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Équation Mathématique</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={counter.formula}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        updateCounter(counter.id, 'formula', val);

                                                        // Get the word under cursor or last word
                                                        const words = val.split(/[\s+\-*/()]/);
                                                        const lastWord = words[words.length - 1];
                                                        setSearchQuery(lastWord.length > 1 ? lastWord : '');
                                                    }}
                                                    className="w-full p-3 bg-stone-950 border border-stone-700 text-stone-300 rounded font-mono text-sm focus:border-amber-500 outline-none shadow-inner"
                                                    placeholder="ex: 10 + Constitution + Volonté"
                                                />

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
                                                        .filter(v => ['XP_TOTAL', 'TRAIT_LEVEL', 'SCENARIOS_COUNT', 'Physique', 'Volonté', 'Constitution', 'Empathie', 'Intelligence'].includes(v))
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
                            )}
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
        </MotionCard>
    );
};

export default AdminFormulasEditor;
