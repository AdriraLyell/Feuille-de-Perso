
import React, { useCallback } from 'react';
import { DotEntry, SkillCategoryKey, SuggestionEntry } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { calculateCardValue } from '../utils/mechanics';

// Imports des sous-composants refactorisés
import { AttributeBlock } from './sheet/AttributeBlock';
import { SkillBlock } from './sheet/SkillBlock';
import { CombatSection } from './sheet/CombatSection';
import { CountersSection } from './sheet/CountersSection';
import SheetHeader from './sheet/SheetHeader';
import ExperienceSummary from './sheet/ExperienceSummary';
import CreationModeModal from './sheet/CreationModeModal';
import EditionSidebar from './sheet/EditionSidebar';

// Hooks
import { useCharacterData, useCharacterActions } from '../context/CharacterContext';
import { useCharacterBonuses } from '../hooks/useCharacterBonuses';
import { useCreationMode } from '../hooks/useCreationMode';
import { useSheetLayout } from '../hooks/useSheetLayout';
import { useRules } from '../context/RulesContext';

import ThematicModal from './ui/ThematicModal';
import VariantSelectionModal from './ui/VariantSelectionModal'; // NEW
import { Layers, Save, PencilLine, Check } from 'lucide-react';
import { generateId } from '../utils/factories'; // NEW

interface Props {
    isLandscape?: boolean;
}

const CharacterSheet: React.FC<Props> = ({ isLandscape = false }) => {
    const data = useCharacterData();
    const { updateData: onChange, addLog: onAddLog } = useCharacterActions();

    // --- State for Variable Skill Definition ---
    const [variantModalState, setVariantModalState] = React.useState<{
        isOpen: boolean;
        category: string;
        id: string;
        skillName: string;
        definitionId?: string;
        variants: string[];
    }>({ isOpen: false, category: '', id: '', skillName: '', variants: [] });

    const [isEditMode, setIsEditMode] = React.useState(false);
    const [showEditWarning, setShowEditWarning] = React.useState(false);

    // --- Hooks logic ---
    const attributeBonuses = useCharacterBonuses(
        data.page2.avantages,
        data.page2.desavantages,
        data.library
    );

    const {
        showCreationWarning,
        handleToggleCreationMode,
        executeCreationActivation,
        setShowCreationWarning
    } = useCreationMode(data, onChange, onAddLog);

    const { rules } = useRules();

    const handleToggleEditMode = useCallback(() => {
        if (!isEditMode) {
            setShowEditWarning(true);
        } else {
            setIsEditMode(false);
        }
    }, [isEditMode]);

    const executeEditModeActivation = () => {
        setIsEditMode(true);
        setShowEditWarning(false);
    };

    const {
        attributeCategories,
        getAttributesGridClass,
        getDynamicColumns
    } = useSheetLayout(data, rules);

    // --- Handlers ---
    const updateHeader = useCallback((field: keyof typeof data.header, value: string) => {
        onChange(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
        onAddLog(`En-tête modifiée : ${String(field)} = "${value}"`, 'info', 'sheet', `header_${String(field)}`);
    }, [onChange, onAddLog]);

    const updateDot = useCallback((section: 'skills', category: string, id: string, value: number) => {
        onChange(prev => {
            const list = prev[section][category];
            if (!list) return prev;

            const isCreationMode = prev.creationConfig && prev.creationConfig.active;
            const catDef = rules?.definitions?.skillCategories?.find(c => c.id === category);
            const behavior = catDef?.behavior;
            const isBaseSkill = !behavior || behavior === 'Compétence' || behavior === 'Secondaire';

            const newList = list.map(item => {
                if (item.id !== id) return item;
                // Only update creationValue for base skills (to mark them as creation-acquired)
                // Counters and backgrounds should maintain their baseline creationValue to allow cost calculation in HUD
                if (isCreationMode && isBaseSkill) {
                    return { ...item, value, creationValue: value };
                }
                return { ...item, value };
            });

            const itemName = list.find(item => item.id === id)?.name || 'Compétence';
            onAddLog(`Modification ${String(itemName)} : ${value}`, 'info', 'sheet', `dot_${String(id)}`);

            const updatedState = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [String(category)]: newList
                }
            };

            // SYNC: Also update counter if ID matches
            if (section === 'skills' && prev.counters) {
                const counterKey = Object.keys(prev.counters).find(k => k === id);
                if (counterKey) {
                    const currentCounter = prev.counters[counterKey];
                    if (!Array.isArray(currentCounter)) {
                        const newCounter = { ...currentCounter, value, creationValue: isCreationMode ? value : currentCounter.creationValue };
                        updatedState.counters = { ...prev.counters, [counterKey]: newCounter };
                    }
                }
            }

            return updatedState;
        });
    }, [onChange, onAddLog]);

    // --- Variable Skill Logic ---
    const handleDefineVariant = useCallback((category: string, id: string, name: string) => {
        // Find existing entry to see if it already has a definitionId
        const existingEntry = data.skills[category]?.find(s => s.id === id);
        let definitionId = existingEntry?.definitionId;
        let variants: string[] = [];

        // Look up in library to find definitionId and suggested variants
        const libSkill = rules?.libraries?.skills?.find(s =>
            (definitionId && s.id === definitionId) ||
            normalizeString(s.name) === normalizeString(name)
        );

        if (libSkill) {
            definitionId = libSkill.id;
            variants = libSkill.variants || [];
        }

        setVariantModalState({
            isOpen: true,
            category,
            id,
            skillName: name,
            definitionId,
            variants
        });
    }, [data.skills, rules?.libraries?.skills]);

    const finalizeVariantDefinition = (variantName: string) => {
        const { category, id, definitionId } = variantModalState;
        if (!variantName.trim()) return;

        onChange(prev => {
            const list = prev.skills[category];
            if (!list) return prev;

            const index = list.findIndex(s => s.id === id);
            if (index === -1) return prev;

            const newList = [...list];

            // 1. Update existing item (Define the variant)
            newList[index] = {
                ...newList[index],
                variant: variantName.trim(),
                definitionId: definitionId || newList[index].definitionId // Ensure definitionId is linked
            };

            // 2. Clone and Insert new empty variable skill below
            const newItem: DotEntry = {
                id: generateId(),
                name: newList[index].name,
                value: 0,
                creationValue: 0,
                max: 5,
                variant: "", // Ready for next input
                definitionId: definitionId // Propagate definitionId to the new empty slot
            };

            // Insert at index + 1
            newList.splice(index + 1, 0, newItem);

            onAddLog(`Définition variante : ${newList[index].name} : ${newList[index].variant}`, 'success', 'sheet');

            const newState = {
                ...prev,
                skills: {
                    ...prev.skills,
                    [category]: newList
                }
            };

            // 3. Suggestion Logic for Variants
            if (definitionId && variantName.trim()) {
                const libSkill = rules?.libraries?.skills?.find(s => s.id === definitionId);
                const normalizedVariant = normalizeString(variantName);

                // Only suggest if not in library variants (normalized check)
                const isKnown = libSkill?.variants?.some(v => normalizeString(v) === normalizedVariant);

                if (libSkill && !isKnown) {
                    const alreadySuggested = prev.suggestions?.some(s =>
                        s.type === 'variant' &&
                        s.parentId === definitionId &&
                        normalizeString(s.name) === normalizedVariant
                    );

                    if (!alreadySuggested) {
                        const suggestion: SuggestionEntry = {
                            id: generateId(),
                            type: 'variant',
                            name: variantName.trim(),
                            category: category,
                            parentId: definitionId,
                            timestamp: Date.now()
                        };
                        newState.suggestions = [...(prev.suggestions || []), suggestion];
                        onAddLog(`Suggestion de variante envoyée : ${variantName}`, 'info', 'sheet');
                    }
                }
            }

            return newState;
        });

        setVariantModalState(prev => ({ ...prev, isOpen: false }));
    };

    // --- Direct Edit Logic ---
    const handleDropItem = useCallback((category: string, payload: any, targetIndex?: number) => {
        const { type, data: itemData, categoryType, originCategory } = payload;

        // 1. Validation de catégorie
        const catDef = rules?.definitions?.skillCategories?.find(c => c.id === category);
        const behavior = catDef?.behavior || 'Compétence';

        if (categoryType === 'skill' && (behavior !== 'Compétence' && behavior !== 'Secondaire')) {
            onAddLog("Action bloquée : Cette catégorie n'accepte pas les compétences.", 'danger', 'sheet');
            return;
        }
        if (categoryType === 'background' && behavior !== 'Arrière-plan') {
            onAddLog("Action bloquée : Cette catégorie n'accepte pas les historiques.", 'danger', 'sheet');
            return;
        }

        // 2. Préparation de l'entrée
        const newEntry: DotEntry = type === 'sheet_item'
            ? itemData
            : {
                id: generateId(),
                name: itemData.name,
                value: 0,
                creationValue: 0,
                max: 5,
                description: itemData.description,
                isVariable: itemData.isVariable,
                definitionId: itemData.id // Link to library ID if possible
            };

        // 3. Mise à jour des données
        onChange(prev => {
            let updatedSkills = { ...prev.skills };

            // Si c'est un déplacement (interne ou externe), on l'enlève d'abord partout
            if (type === 'sheet_item') {
                Object.keys(updatedSkills).forEach(cat => {
                    updatedSkills[cat] = (updatedSkills[cat] || []).filter(s => s.id !== newEntry.id);
                });
            }

            const currentList = [...(updatedSkills[category] || [])];

            // Éviter les doublons exacts (sauf variables ou espaceurs)
            if (newEntry.name && !itemData.isVariable && currentList.some(s => s.name?.toLowerCase() === itemData.name.toLowerCase() && s.id !== newEntry.id)) {
                return prev;
            }

            // Insertion à l'index cible ou à la fin
            if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= currentList.length) {
                currentList.splice(targetIndex, 0, newEntry);
            } else {
                currentList.push(newEntry);
            }

            updatedSkills[category] = currentList;
            const newState = { ...prev, skills: updatedSkills };

            // 4. Gestion des suggestions si c'est un nouvel item (lib ou custom)
            if (type === 'custom_lib_item' || type === 'lib_skill') {
                const suggestionType = categoryType || (category.toLowerCase().includes('background') || category.toLowerCase().includes('arrière-plan') ? 'background' : 'skill');

                const suggestion: SuggestionEntry = {
                    id: generateId(),
                    type: suggestionType as 'skill' | 'background',
                    name: itemData.name,
                    category: category,
                    timestamp: Date.now()
                };
                newState.suggestions = [...(prev.suggestions || []), suggestion];
                onAddLog(`Suggestion créée pour le MJ : ${itemData.name}`, 'info', 'sheet');
            }

            return newState;
        });

        onAddLog(type === 'sheet_item' ? `Déplacement : ${itemData.name || 'Espaceur'}` : `Ajout réussi : ${itemData.name || 'Espaceur'}`, 'success', 'sheet');
    }, [onChange, onAddLog, rules]);

    const handleRemoveItem = useCallback((category: string, id: string) => {
        onChange(prev => {
            const currentList = prev.skills[category] || [];
            const itemToRemove = currentList.find(s => s.id === id);

            if (itemToRemove && itemToRemove.name && (itemToRemove.value || 0) > 0) {
                onAddLog(`Action bloquée : Impossible de supprimer une compétence avec des points investis.`, 'danger', 'sheet');
                return prev;
            }

            const updatedList = currentList.filter(s => s.id !== id);

            return {
                ...prev,
                skills: {
                    ...prev.skills,
                    [category]: updatedList
                }
            };
        });
        onAddLog("Élément supprimé de la fiche", 'info', 'sheet');
    }, [onChange, onAddLog]);

    const updateAttribute = useCallback((category: string, id: string, field: 'val1' | 'val2' | 'val3', value: string) => {
        onChange(prev => {
            const mainList = prev.attributes?.[String(category)];
            const mainIndex = mainList ? mainList.findIndex(item => item.id === id) : -1;
            const numValue = parseInt(value) || 0;

            if (mainIndex !== -1 && mainList) {
                const isCreationMode = prev.creationConfig && prev.creationConfig.active;
                const newList = [...mainList];
                const item = newList[mainIndex];

                if (isCreationMode) {
                    const creationKey = `creation${field.charAt(0).toUpperCase() + field.slice(1)}` as any;
                    newList[mainIndex] = { ...item, [field]: value, [creationKey]: numValue };
                } else {
                    newList[mainIndex] = { ...item, [field]: value };
                }

                onAddLog(`Attribut ${item.name} modifié`, 'info', 'sheet', `attr_${String(id)}_${field}`);
                return {
                    ...prev,
                    attributes: { ...prev.attributes, [String(category)]: newList }
                };
            }

            const secondaryList = prev.secondaryAttributes?.[String(category)];
            const secIndex = secondaryList ? secondaryList.findIndex(item => item.id === id) : -1;

            if (secIndex !== -1 && secondaryList) {
                const isCreationMode = prev.creationConfig && prev.creationConfig.active;
                const newList = [...secondaryList];
                const item = newList[secIndex];

                if (isCreationMode) {
                    const creationKey = `creation${field.charAt(0).toUpperCase() + field.slice(1)}` as any;
                    newList[secIndex] = { ...item, [field]: value, [creationKey]: numValue };
                } else {
                    newList[secIndex] = { ...item, [field]: value };
                }

                onAddLog(`Attribut ${item.name} modifié`, 'info', 'sheet', `attr_sec_${String(id)}_${field}`);
                return {
                    ...prev,
                    secondaryAttributes: { ...prev.secondaryAttributes, [String(category)]: newList }
                };
            }
            return prev;
        });
    }, [onChange, onAddLog]);

    const updateCombatWeapon = useCallback((id: string, field: any, value: string) => {
        onChange(prev => {
            const newWeapons = (prev.combat.weapons || []).map(w => w.id === id ? { ...w, [field]: value } : w);
            return { ...prev, combat: { ...prev.combat, weapons: newWeapons } };
        });
        onAddLog(`Arme modifiée (${String(field)})`, 'info', 'sheet', `weapon_${String(id)}_${String(field)}`);
    }, [onChange, onAddLog]);

    const updateArmor = useCallback((index: number, field: any, value: string) => {
        onChange(prev => {
            const newArmor = [...(prev.combat.armor || [])];
            if (newArmor[index]) {
                newArmor[index] = { ...newArmor[index], [field]: value };
                return { ...prev, combat: { ...prev.combat, armor: newArmor } };
            }
            return prev;
        });
        onAddLog(`Armure modifiée (${String(field)})`, 'info', 'sheet', `armor_${index}_${String(field)}`);
    }, [onChange, onAddLog]);

    const updateCounter = useCallback((id: string, value: number, isCustom = false, field: 'value' | 'current' = 'value') => {
        onChange(prev => {
            const isCreationMode = prev.creationConfig && prev.creationConfig.active;
            if (isCustom) {
                const newCustom = (prev.counters.custom || []).map(c => {
                    if (c.id !== id) return c;
                    const newItem = { ...c };
                    if (field === 'value') {
                        newItem.value = value;
                        if (isCreationMode) newItem.creationValue = value;
                        if ((newItem.current || 0) > value) newItem.current = value;
                    } else {
                        newItem.current = Math.min(value, newItem.value);
                    }
                    return newItem;
                });
                const counterName = (prev.counters.custom || []).find(c => c.id === id)?.name || 'Compteur';
                onAddLog(`Modification ${String(counterName)} (${field === 'value' ? 'Maxi' : 'Utilisé'}) : ${value}`, 'info', 'sheet', `counter_${String(id)}_${String(field)}`);
                return { ...prev, counters: { ...prev.counters, custom: newCustom } };
            } else {
                // Find the key by searching for the counter with matching id
                const counterKey = Object.keys(prev.counters).find(k => {
                    const c = prev.counters[k];
                    return !Array.isArray(c) && c?.id === id;
                }) || id; // Fallback to using id as key for legacy compatibility

                const current = (prev.counters as any)[counterKey];
                // Guard against Array (should not happen for non-custom ID but types say DotEntry | DotEntry[])
                if (Array.isArray(current) || !current) return prev;

                // CHECK: Block modification if strictly blocked by admin (xpCost <= 0)
                // Appliable in BOTH Creation Mode and Game Mode
                const sysDef = rules?.definitions?.counters?.[id] || rules?.definitions?.counters?.[counterKey];
                const displayName = current.name || sysDef?.name || id;

                const libDef = rules?.libraries?.counters?.find(c => c.id === id)
                    || rules?.libraries?.counters?.find(c => normalizeString(c.name) === normalizeString(displayName));

                const xpCost = libDef?.xpCost !== undefined ? libDef.xpCost : (sysDef?.xpCost ?? 0);
                const defaultValue = libDef?.defaultValue !== undefined ? libDef.defaultValue : (sysDef?.defaultValue ?? 0);

                // If defined, and has xpCost <= 0, prevent increasing value
                if (field === 'value' && (libDef || sysDef)) {
                    if (xpCost <= 0) {
                        if (value > current.value) return prev;
                    }
                    // Enforce Floor: cannot go below defaultValue logic
                    if (value < defaultValue) return prev;
                }

                const newItem = { ...current };

                if (field === 'value') {
                    newItem.value = value;
                    // Note: for counters, we DON'T update creationValue during creation mode
                    // because they must cost XP from the budget.
                    if ((newItem.current || 0) > value) newItem.current = value;
                } else {
                    newItem.current = Math.min(value, newItem.value);
                }

                onAddLog(`Modification ${String(newItem.name)} (${field === 'value' ? 'Maxi' : 'Utilisé'}) : ${value}`, 'info', 'sheet', `counter_${String(id)}_${String(field)}`);

                const updatedState = { ...prev, counters: { ...prev.counters, [counterKey]: newItem } };

                // SYNC: Also update skill if ID matches
                if (field === 'value' && prev.skills) {
                    const newSkills = { ...prev.skills };
                    let skillFound = false;
                    Object.keys(newSkills).forEach(catId => {
                        const list = newSkills[catId];
                        if (Array.isArray(list)) {
                            // Identify if valid Category for Counters
                            const catDef = rules?.definitions?.skillCategories?.find(c => c.id === catId);
                            const isCounterCat = catDef?.behavior === 'Compteur';

                            const idx = list.findIndex(s => s.id === id);
                            if (idx !== -1) {
                                const newList = [...list];
                                // FIX: If it is a Counter Category, we MUST PRESERVE creationValue to ensure cost calculation works
                                // Otherwise it thinks we started at this new level.
                                const shouldUpdateCreation = isCreationMode && !isCounterCat;

                                newList[idx] = {
                                    ...newList[idx],
                                    value,
                                    creationValue: shouldUpdateCreation ? value : newList[idx].creationValue
                                };
                                newSkills[catId] = newList;
                                skillFound = true;
                            }
                        }
                    });
                    if (skillFound) {
                        updatedState.skills = newSkills;
                    }
                }

                return updatedState;
            }
        });
    }, [onChange, onAddLog, rules?.definitions?.counters, rules?.libraries?.counters]);

    const cardValue = calculateCardValue(data, rules);
    const creationActive = data.creationConfig?.active;
    const allowExtendedSkills = data.creationConfig?.extendedSkills || false;

    const { columns, backgrounds } = getDynamicColumns(isLandscape) as any;

    return (
        <div className={`sheet-container ${isLandscape ? 'landscape' : ''}`}>

            <SheetHeader
                headerData={data.header}
                creationActive={!!creationActive}
                onUpdateHeader={updateHeader}
                onToggleCreationMode={handleToggleCreationMode}
                editModeActive={isEditMode}
                onToggleEditMode={handleToggleEditMode}
            />

            {isEditMode && (
                <div className="bg-amber-600 text-white py-2 px-4 flex justify-between items-center shadow-md animate-in slide-in-from-top duration-300 no-print">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <PencilLine size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Mode Édition Actif</p>
                            <p className="text-[10px] opacity-90">Glissez-déposez pour réorganiser ou supprimer. Vos changements sont enregistrés localement.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditMode(false)}
                        className="bg-white text-amber-700 px-4 py-1.5 rounded-sm font-black text-xs uppercase hover:bg-amber-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Check size={14} /> Valider mes changements
                    </button>
                </div>
            )}

            {isEditMode && <EditionSidebar onClose={() => setIsEditMode(false)} />}

            {/* Attributes Section */}
            <div className="grid grid-cols-12 border-b-2 border-stone-800">
                <div className={`col-span-10 grid ${getAttributesGridClass()}`}>
                    {attributeCategories.map(cat => (
                        <AttributeBlock
                            key={cat.id}
                            title={cat.label}
                            items={data.attributes[cat.id] || []}
                            secondaryItems={data.secondaryAttributesActive ? data.secondaryAttributes[cat.id] : undefined}
                            cat={cat.id}
                            onUpdate={updateAttribute}
                            bonuses={attributeBonuses}
                        />
                    ))}
                </div>
                <ExperienceSummary experience={data.experience} cardValue={cardValue} />
            </div>

            {isLandscape ? (
                /* --- Landscape Layout (6 Columns Dynamic) --- */
                <div className="flex-grow grid grid-cols-6 border-b-2 border-stone-800">
                    {columns.map((col: any, idx: number) => (
                        <div key={idx} className="border-r border-stone-400 flex flex-col">
                            {col.blocks.map((block: any) => (
                                <div key={block.cat} className="flex-grow border-b border-stone-300 last:border-b-0">
                                    <SkillBlock
                                        title={block.title}
                                        items={block.items}
                                        cat={block.cat}
                                        onUpdate={updateDot}
                                        userSpecs={data.specializations}
                                        imposedSpecs={data.imposedSpecializations}
                                        theme={data.theme}
                                        onDefineVariant={handleDefineVariant}
                                        allowExtendedSkills={allowExtendedSkills}
                                        description={block.description}
                                        isEditing={isEditMode}
                                        categoryBehavior={rules?.definitions?.skillCategories?.find(c => c.id === block.cat)?.behavior}
                                        onDrop={handleDropItem}
                                        onRemove={handleRemoveItem}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Col 6: Dynamic Backgrounds & Combat & Counters */}
                    <div className="flex flex-col h-full">
                        {backgrounds.map((bg: any, bIdx: number) => (
                            <div key={bg.cat} className="flex-none border-b border-stone-400">
                                <SkillBlock
                                    title={bg.title}
                                    items={bg.items || []}
                                    cat={bg.cat}
                                    onUpdate={updateDot}
                                    userSpecs={data.specializations}
                                    imposedSpecs={data.imposedSpecializations}
                                    theme={data.theme}
                                    onDefineVariant={handleDefineVariant}
                                    allowExtendedSkills={allowExtendedSkills}
                                    description={bg.description}
                                    isEditing={isEditMode}
                                    categoryBehavior={rules?.definitions?.skillCategories?.find(c => c.id === bg.cat)?.behavior}
                                    onDrop={handleDropItem}
                                    onRemove={handleRemoveItem}
                                />
                            </div>
                        ))}
                        <div className="flex-none border-b border-stone-400 overflow-hidden">
                            <CombatSection data={data} updateCombatWeapon={updateCombatWeapon} updateArmor={updateArmor} />
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <CountersSection data={data} updateCounter={updateCounter} isLandscape={isLandscape} />
                        </div>
                    </div>
                </div>
            ) : (
                /* --- Portrait Layout (Standard Deterministic) --- */
                <>
                    <div className="grid grid-cols-4 border-b-2 border-stone-800 h-auto">
                        {columns.map((col: any, idx: number) => (
                            <div key={idx} className={idx < 3 ? "border-r border-stone-400" : ""}>
                                {col.topBlocks.map((block: any) => (
                                    <SkillBlock
                                        key={block.cat}
                                        title={block.title}
                                        items={block.items}
                                        cat={block.cat}
                                        onUpdate={updateDot}
                                        userSpecs={data.specializations}
                                        imposedSpecs={data.imposedSpecializations}
                                        theme={data.theme}
                                        onDefineVariant={handleDefineVariant}
                                        allowExtendedSkills={allowExtendedSkills}
                                        description={block.description}
                                        isEditing={isEditMode}
                                        categoryBehavior={rules?.definitions?.skillCategories?.find(c => c.id === block.cat)?.behavior}
                                        onDrop={handleDropItem}
                                        onRemove={handleRemoveItem}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-4 border-b-2 border-stone-800 flex-grow min-h-[200px]">
                        {columns.map((col: any, idx: number) => (
                            <div key={idx} className={idx < 3 ? "border-r border-stone-400" : ""}>
                                {col.bottomBlocks.map((block: any) => (
                                    <SkillBlock
                                        key={block.cat}
                                        title={block.title}
                                        items={block.items}
                                        cat={block.cat}
                                        onUpdate={updateDot}
                                        userSpecs={data.specializations}
                                        imposedSpecs={data.imposedSpecializations}
                                        theme={data.theme}
                                        onDefineVariant={handleDefineVariant}
                                        allowExtendedSkills={allowExtendedSkills}
                                        description={block.description}
                                        isEditing={isEditMode}
                                        categoryBehavior={rules?.definitions?.skillCategories?.find(c => c.id === block.cat)?.behavior}
                                        onDrop={handleDropItem}
                                        onRemove={handleRemoveItem}
                                    />
                                ))}
                                {idx === 3 && (
                                    /* backgrounds render in the last column of second row */
                                    backgrounds.map((bg: any) => (
                                        <SkillBlock
                                            key={bg.cat}
                                            title={bg.title}
                                            items={bg.items || []}
                                            cat={bg.cat}
                                            onUpdate={updateDot}
                                            userSpecs={data.specializations}
                                            imposedSpecs={data.imposedSpecializations}
                                            theme={data.theme}
                                            onDefineVariant={handleDefineVariant}
                                            allowExtendedSkills={allowExtendedSkills}
                                            description={bg.description}
                                            isEditing={isEditMode}
                                            categoryBehavior={rules?.definitions?.skillCategories?.find(c => c.id === bg.cat)?.behavior}
                                            onDrop={handleDropItem}
                                            onRemove={handleRemoveItem}
                                        />
                                    ))
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2">
                        <div className="border-r-2 border-stone-800 flex flex-col">
                            <CombatSection data={data} updateCombatWeapon={updateCombatWeapon} updateArmor={updateArmor} />
                        </div>
                        <div className="flex flex-col">
                            <CountersSection data={data} updateCounter={updateCounter} isLandscape={isLandscape} />
                        </div>
                    </div>
                </>
            )}

            {showEditWarning && (
                <ThematicModal
                    isOpen={showEditWarning}
                    onClose={() => setShowEditWarning(false)}
                    title="Activer le Mode Édition ?"
                    icon={<PencilLine size={24} />}
                    size="md"
                    footer={
                        <>
                            <button
                                onClick={() => setShowEditWarning(false)}
                                className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={executeEditModeActivation}
                                className="px-6 py-2 bg-amber-600 text-white rounded-sm font-bold shadow-md hover:bg-amber-700 flex items-center gap-2"
                            >
                                <Check size={16} /> Compris, j'active
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4 py-2">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm text-sm text-[#5c4d41] leading-relaxed">
                            <p className="font-bold mb-2">Qu'est-ce que le Mode Édition ?</p>
                            <ul className="list-disc list-inside space-y-2 text-xs">
                                <li><strong>Ajout direct</strong> : Glissez des compétences depuis la barre latérale.</li>
                                <li><strong>Réorganisation</strong> : Déplacez vos compétences d'un bloc à l'autre.</li>
                                <li><strong>Nettoyage</strong> : Supprimez des éléments inutiles via l'icône poubelle.</li>
                                <li><strong>Suggestions</strong> : Les nouveaux éléments sont suggérés au MJ.</li>
                            </ul>
                            <p className="mt-4 text-[10px] italic opacity-70">Note : Ce mode est réservé aux ajustements de structure. Pour remplir vos points, utilisez le mode standard ou le mode création.</p>
                        </div>
                    </div>
                </ThematicModal>
            )}

            {/* Creation Mode Activation Warning Modal */}
            {showCreationWarning && (
                <CreationModeModal
                    data={data}
                    onClose={() => setShowCreationWarning(false)}
                    onConfirm={executeCreationActivation}
                />
            )}

            {/* Variable Skill Definition Modal */}
            {/* Variable Skill Definition Modal */}
            <VariantSelectionModal
                isOpen={variantModalState.isOpen}
                onClose={() => setVariantModalState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={finalizeVariantDefinition}
                skillName={variantModalState.skillName}
                variants={variantModalState.variants}
            />
        </div>
    );
};


export default CharacterSheet;
