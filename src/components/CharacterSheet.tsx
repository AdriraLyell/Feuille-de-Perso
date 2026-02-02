
import React, { useCallback } from 'react';
import { DotEntry, CombatEntry, SkillCategoryKey } from '../types';
import { resetCharacterValues } from '../utils/characterUtils';
import { calculateCardValue } from '../utils/mechanics';

// Imports des sous-composants refactorisés
import { AttributeBlock } from './sheet/AttributeBlock';
import { SkillBlock } from './sheet/SkillBlock';
import { CombatSection } from './sheet/CombatSection';
import { CountersSection } from './sheet/CountersSection';
import SheetHeader from './sheet/SheetHeader';
import ExperienceSummary from './sheet/ExperienceSummary';
import CreationModeModal from './sheet/CreationModeModal';

// Hooks
import { useCharacterData, useCharacterActions } from '../context/CharacterContext';
import { useCharacterBonuses } from '../hooks/useCharacterBonuses';
import { useCreationMode } from '../hooks/useCreationMode';
import { useSheetLayout } from '../hooks/useSheetLayout';

import ThematicModal from './ui/ThematicModal';
import { Layers, Save } from 'lucide-react';

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
        inputValue: string;
    }>({ isOpen: false, category: '', id: '', skillName: '', inputValue: '' });

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

    const {
        attributeCategories,
        getAttributesGridClass,
        getDynamicColumns
    } = useSheetLayout(data);

    // --- Handlers ---
    const updateHeader = useCallback((field: keyof typeof data.header, value: string) => {
        onChange(prev => ({ ...prev, header: { ...prev.header, [field]: value } }));
        onAddLog(`En-tête modifiée : ${String(field)} = "${value}"`, 'info', 'sheet', `header_${String(field)}`);
    }, [onChange, onAddLog]);

    const updateDot = useCallback((section: 'skills', category: string, id: string, value: number) => {
        onChange(prev => {
            // @ts-ignore - dynamic access
            const list = prev[section]?.[category] as DotEntry[];
            if (!list) return prev;

            const isCreationMode = prev.creationConfig && prev.creationConfig.active;
            const newList = list.map(item => {
                if (item.id !== id) return item;
                return isCreationMode ? { ...item, value, creationValue: value } : { ...item, value };
            });

            const itemName = list.find(item => item.id === id)?.name || 'Compétence';
            onAddLog(`Modification ${String(itemName)} : ${value}`, 'info', 'sheet', `dot_${String(id)}`);

            return {
                ...prev,
                [section]: {
                    // @ts-ignore
                    ...prev[section],
                    [String(category)]: newList
                }
            };
        });
    }, [onChange, onAddLog]);

    // --- Variable Skill Logic ---
    const handleDefineVariant = useCallback((category: string, id: string, name: string) => {
        setVariantModalState({
            isOpen: true,
            category,
            id,
            skillName: name,
            inputValue: ''
        });
    }, []);

    const finalizeVariantDefinition = () => {
        const { category, id, inputValue } = variantModalState;
        if (!inputValue.trim()) return;

        onChange(prev => {
            // @ts-ignore
            const list = prev.skills[category] as DotEntry[];
            if (!list) return prev;

            const index = list.findIndex(s => s.id === id);
            if (index === -1) return prev;

            const newList = [...list];

            // 1. Update existing item (Define the variant)
            newList[index] = {
                ...newList[index],
                variant: inputValue.trim()
            };

            // 2. Clone and Insert new empty variable skill below
            // We clone basic properties but generate new ID and reset variant to "" (empty)
            // Ideally we check if there is space? Infinite list? user didn't specify limit, so just insert.
            const newItem: DotEntry = {
                id: Math.random().toString(36).substr(2, 9),
                name: newList[index].name,
                value: 0,
                creationValue: 0,
                max: 5,
                variant: "" // Ready for next input
            };

            // Insert at index + 1
            newList.splice(index + 1, 0, newItem);

            onAddLog(`Définition variante : ${newList[index].name} : ${newList[index].variant}`, 'success', 'sheet');

            return {
                ...prev,
                skills: {
                    // @ts-ignore
                    ...prev.skills,
                    [category]: newList
                }
            };
        });

        setVariantModalState(prev => ({ ...prev, isOpen: false }));
    };

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
                // @ts-ignore
                const current = prev.counters[String(id)];
                const newItem = { ...current };

                if (field === 'value') {
                    newItem.value = value;
                    if (isCreationMode) newItem.creationValue = value;
                    if ((newItem.current || 0) > value) newItem.current = value;
                } else {
                    newItem.current = Math.min(value, newItem.value);
                }

                onAddLog(`Modification ${String(newItem.name)} (${field === 'value' ? 'Maxi' : 'Utilisé'}) : ${value}`, 'info', 'sheet', `counter_${String(id)}_${String(field)}`);
                return { ...prev, counters: { ...prev.counters, [String(id)]: newItem } };
            }
        });
    }, [onChange, onAddLog]);

    const cardValue = calculateCardValue(data);
    const creationActive = data.creationConfig?.active;

    return (
        <div className={`sheet-container ${isLandscape ? 'landscape' : ''}`}>

            <SheetHeader
                headerData={data.header}
                creationActive={!!creationActive}
                onUpdateHeader={updateHeader}
                onToggleCreationMode={handleToggleCreationMode}
            />

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
                    {getDynamicColumns().map((col, idx) => (
                        <div key={idx} className="border-r border-stone-400 flex flex-col">
                            {col.blocks.map((block, bIdx) => (
                                <div key={bIdx} className={bIdx < col.blocks.length - 1 ? 'flex-grow border-b border-stone-300' : 'flex-grow'}>
                                    <SkillBlock
                                        title={block.title}
                                        items={block.items}
                                        cat={block.cat}
                                        onUpdate={updateDot}
                                        userSpecs={data.specializations}
                                        imposedSpecs={data.imposedSpecializations}
                                        theme={data.theme}
                                        onDefineVariant={handleDefineVariant}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Col 6: Arrières Plans & Combat & Counters */}
                    <div className="flex flex-col h-full">
                        <div className="flex-none border-b border-stone-400">
                            <SkillBlock
                                title="Arrières Plans"
                                items={data.skills.arrieres_plans || []}
                                cat="arrieres_plans"
                                onUpdate={updateDot}
                                userSpecs={data.specializations}
                                imposedSpecs={data.imposedSpecializations}
                                theme={data.theme}
                                onDefineVariant={handleDefineVariant}
                            />
                        </div>
                        <div className="flex-none border-b border-stone-400 overflow-hidden">
                            <CombatSection data={data} updateCombatWeapon={updateCombatWeapon} updateArmor={updateArmor} />
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <CountersSection data={data} updateCounter={updateCounter} isLandscape={isLandscape} />
                        </div>
                    </div>
                </div>
            ) : (
                /* --- Portrait Layout (Standard) --- */
                <>
                    <div className="grid grid-cols-4 border-b-2 border-stone-800 h-auto">
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Talents" items={data.skills.talents || []} cat="talents" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} onDefineVariant={handleDefineVariant} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences" items={data.skills.competences || []} cat="competences" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} onDefineVariant={handleDefineVariant} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences" items={data.skills.competences_col_2 || []} cat="competences_col_2" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} onDefineVariant={handleDefineVariant} />
                        </div>
                        <div>
                            <SkillBlock title="Connaissances" items={data.skills.connaissances || []} cat="connaissances" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} onDefineVariant={handleDefineVariant} />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 border-b-2 border-stone-800 flex-grow min-h-[200px]">
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Autres Compétences" items={data.skills.autres_competences || []} cat="autres_competences" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} onDefineVariant={handleDefineVariant} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences Secondaires" items={data.skills.competences2 || []} cat="competences2" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} onDefineVariant={handleDefineVariant} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Autres" items={data.skills.autres || []} cat="autres" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} onDefineVariant={handleDefineVariant} />
                        </div>
                        <div>
                            <SkillBlock title="Arrières Plans" items={data.skills.arrieres_plans || []} cat="arrieres_plans" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} onDefineVariant={handleDefineVariant} />
                        </div>
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

            {/* Creation Mode Activation Warning Modal */}
            {showCreationWarning && (
                <CreationModeModal
                    data={data}
                    onClose={() => setShowCreationWarning(false)}
                    onConfirm={executeCreationActivation}
                />
            )}

            {/* Variable Skill Definition Modal */}
            <ThematicModal
                isOpen={variantModalState.isOpen}
                onClose={() => setVariantModalState(prev => ({ ...prev, isOpen: false }))}
                title="Préciser la compétence"
                icon={<Layers size={24} />}
                size="md"
                footer={
                    <>
                        <button
                            onClick={() => setVariantModalState(prev => ({ ...prev, isOpen: false }))}
                            className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={finalizeVariantDefinition}
                            className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2"
                        >
                            <Save size={16} /> Valider
                        </button>
                    </>
                }
            >
                <div className="flex flex-col gap-4 py-2">
                    <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-sm text-sm text-[#5c4d41]">
                        Vous définissez une variante pour la compétence <strong>{variantModalState.skillName}</strong>.
                        <br />
                        <span className="text-xs italic mt-1 block">Une nouvelle ligne vide sera créée automatiquement en dessous pour d'autres variantes.</span>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">
                            Spécialité / Variante (ex: Forge, Histoire, Épées...)
                        </label>
                        <input
                            className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-serif font-black text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm text-lg"
                            value={variantModalState.inputValue}
                            onChange={(e) => setVariantModalState(prev => ({ ...prev, inputValue: e.target.value }))}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && finalizeVariantDefinition()}
                        />
                    </div>
                </div>
            </ThematicModal>
        </div>
    );
};

export default CharacterSheet;
