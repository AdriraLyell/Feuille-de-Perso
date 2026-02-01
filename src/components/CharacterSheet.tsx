
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

interface Props {
    isLandscape?: boolean;
}

const CharacterSheet: React.FC<Props> = ({ isLandscape = false }) => {
    const data = useCharacterData();
    const { updateData: onChange, addLog: onAddLog } = useCharacterActions();

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
                            <SkillBlock title="Talents" items={data.skills.talents || []} cat="talents" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences" items={data.skills.competences || []} cat="competences" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences" items={data.skills.competences_col_2 || []} cat="competences_col_2" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div>
                            <SkillBlock title="Connaissances" items={data.skills.connaissances || []} cat="connaissances" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 border-b-2 border-stone-800 flex-grow min-h-[200px]">
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Autres Compétences" items={data.skills.autres_competences || []} cat="autres_competences" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Compétences Secondaires" items={data.skills.competences2 || []} cat="competences2" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div className="border-r border-stone-400">
                            <SkillBlock title="Autres" items={data.skills.autres || []} cat="autres" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
                        </div>
                        <div>
                            <SkillBlock title="Arrières Plans" items={data.skills.arrieres_plans || []} cat="arrieres_plans" onUpdate={updateDot} userSpecs={data.specializations} imposedSpecs={data.imposedSpecializations} theme={data.theme} />
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
        </div>
    );
};

export default CharacterSheet;
