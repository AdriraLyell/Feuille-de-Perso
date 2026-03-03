import React, { useCallback, useState } from 'react';
import { calculateCardValue } from '../utils/mechanics';
import { canIncreaseMysticSkill, canLearnNewMysticSkill } from '../utils/mysticUtils';

// Imports des sous-composants refactorisés
import { AttributeBlock } from './sheet/AttributeBlock';
import { CountersSection } from './sheet/CountersSection';
import SheetHeader from './sheet/SheetHeader';
import ExperienceSummary from './sheet/ExperienceSummary';
import CharacterSheetGrid from './sheet/CharacterSheetGrid';

// Hooks
import { useCharacterData, useCharacterActions, useCharacterState } from '../context/CharacterContext';
import { useCharacterSheetActions } from '../hooks/useCharacterSheetActions';
import { useCharacterBonuses } from '../hooks/useCharacterBonuses';
import { useCreationMode } from '../hooks/useCreationMode';
import { useSheetLayout } from '../hooks/useSheetLayout';
import { useRules } from '../context/RulesContext';
import { useEditMode } from '../hooks/sheet/useEditMode';
import { useVariableSkills } from '../hooks/sheet/useVariableSkills';

import ThematicModal from './ui/ThematicModal';
import VariantSelectionModal from './ui/VariantSelectionModal';
import { PencilLine, Check, UserPlus } from 'lucide-react';

interface Props {
    isLandscape?: boolean;
    onToggleEditMode?: () => void;
}

const CharacterSheet: React.FC<Props> = ({ isLandscape = false, onToggleEditMode }) => {
    const data = useCharacterData();
    const dataRef = React.useRef(data);
    React.useEffect(() => { dataRef.current = data; }, [data]);

    const { updateData: onChange, addLog: onAddLog, recordXPTransaction, setEditMode: setIsEditMode } = useCharacterActions();
    const { isEditMode } = useCharacterState();

    // Variable Skill State
    const [variantModalState, setVariantModalState] = useState<{
        isOpen: boolean;
        category: string;
        id: string;
        skillName: string;
        definitionId?: string;
        variants: string[];
    }>({
        isOpen: false,
        category: '',
        id: '',
        skillName: '',
        variants: []
    });

    const { rules } = useRules();

    // --- Hooks logic ---
    const { attributeBonuses, blockedSkills, counterCreationBonuses, counterXPBonuses, calculatedMaxes, activeReserves } = useCharacterBonuses(
        data.page2.avantages,
        data.page2.desavantages,
        data.library,
        rules?.libraries?.traits || []
    );

    // Logic removed because it's now in MainLayout

    const {
        updateHeader,
        updateDot,
        handleDropItem,
        handleRemoveItem,
        updateAttribute,
        updateCounter
    } = useCharacterSheetActions(data, onChange, onAddLog, recordXPTransaction, rules);

    const {
        handleDefineVariant,
        finalizeVariantDefinition
    } = useVariableSkills(data, onChange, onAddLog, rules, setVariantModalState, variantModalState);

    const {
        attributeCategories,
        getAttributesGridClass,
        portraitLayout,
        landscapeLayout
    } = useSheetLayout(data, rules);

    // --- CharacterSheet Logic handlers (now managed by useCharacterSheetActions) ---

    const cardValue = calculateCardValue(data, rules);
    const creationActive = data.creationConfig?.active;
    const allowExtendedSkills = data.creationConfig?.extendedSkills || false;

    const { columns, backgrounds, autres } = isLandscape ? landscapeLayout : portraitLayout;

    const validateSkillIncrease = useCallback((id: string, newValue: number) => {
        const currentData = dataRef.current;
        // Find the skill by ID
        const allSkills = Object.values(currentData.skills).flat();
        const skill = allSkills.find(s => s.id === id);
        if (!skill) return { allowed: true };

        // 0. Check for trait-based blocking
        const normalizedName = skill.name.trim().toLowerCase();
        const blockInfo = blockedSkills[normalizedName];
        if (blockInfo && newValue > skill.value) {
            return {
                allowed: false,
                reason: `L'augmentation de cette compétence est bloquée par le trait : ${blockInfo.sourceName}`
            };
        }

        // 1. Check Learning (0 -> 1)
        if (skill.value === 0 && newValue > 0) {
            return canLearnNewMysticSkill(currentData, skill.name, rules, !!creationActive, id);
        }

        // 2. Check Increase (>0)
        if (skill.value > 0 && newValue > skill.value) {
            return canIncreaseMysticSkill(currentData, skill.name, rules, id);
        }

        return { allowed: true };
    }, [rules, creationActive, blockedSkills]);

    const { handleToggleEditMode } = useEditMode(isEditMode, setIsEditMode);
    const { handleToggleCreationMode } = useCreationMode(data, onChange as any, onAddLog);

    return (
        <div className={`flex justify-center transition-all duration-300 ${isEditMode ? 'pr-80' : ''}`}>
            <div className={`sheet-container ${isLandscape ? 'landscape' : ''}`}>

                <SheetHeader
                    headerData={data.header}
                    creationActive={!!creationActive}
                    onUpdateHeader={updateHeader}
                    isDateLocked={!!rules?.configurations?.calendar}
                    isEditMode={isEditMode}
                    onToggleEditMode={onToggleEditMode || handleToggleEditMode}
                    onToggleCreationMode={handleToggleCreationMode}
                />

                {/* Edition mode logic and sidebar moved to MainLayout */}

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
                                isCreationMode={!!creationActive}
                            />
                        ))}
                    </div>
                    <ExperienceSummary experience={data.experience} cardValue={cardValue} />
                </div>

                <CharacterSheetGrid
                    columns={columns}
                    backgrounds={backgrounds}
                    autres={autres}
                    isLandscape={isLandscape}
                    isEditMode={isEditMode}
                    allowExtendedSkills={allowExtendedSkills}
                    theme={data.theme}
                    rules={rules}
                    specializations={data.specializations}
                    imposedSpecializations={data.imposedSpecializations}
                    onUpdateDot={updateDot}
                    onDefineVariant={handleDefineVariant}
                    onDropItem={handleDropItem}
                    onRemoveItem={handleRemoveItem}
                    validateSkillIncrease={validateSkillIncrease}
                    blockedSkills={blockedSkills}
                    renderExtraColumn={() => null}
                    renderBottomSection={() => (
                        <div className="w-full h-[200px] overflow-hidden">
                            <CountersSection
                                data={data}
                                updateCounter={updateCounter}
                                isLandscape={isLandscape}
                                creationBonuses={counterCreationBonuses}
                                xpBonuses={counterXPBonuses}
                                calculatedMaxes={calculatedMaxes}
                                activeReserves={activeReserves}
                            />
                        </div>
                    )}
                />

                {/* Warnings moved to MainLayout */}

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
        </div>
    );
};


export default CharacterSheet;
