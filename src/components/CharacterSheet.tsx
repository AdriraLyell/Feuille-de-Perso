import React, { useCallback, useState } from 'react';
import { calculateCardValue } from '../utils/mechanics';
import { canIncreaseMysticSkill, canLearnNewMysticSkill } from '../utils/mysticUtils';

// Imports des sous-composants refactorisés
import { AttributeBlock } from './sheet/AttributeBlock';
import { CombatSection } from './sheet/CombatSection';
import { CountersSection } from './sheet/CountersSection';
import SheetHeader from './sheet/SheetHeader';
import ExperienceSummary from './sheet/ExperienceSummary';
import CreationModeModal from './sheet/CreationModeModal';
import EditionSidebar from './sheet/EditionSidebar';
import CharacterSheetGrid from './sheet/CharacterSheetGrid';

// Hooks
import { useCharacterData, useCharacterActions } from '../context/CharacterContext';
import { useCharacterSheetActions } from '../hooks/useCharacterSheetActions';
import { useCharacterBonuses } from '../hooks/useCharacterBonuses';
import { useCreationMode } from '../hooks/useCreationMode';
import { useSheetLayout } from '../hooks/useSheetLayout';
import { useRules } from '../context/RulesContext';
import { useEditMode } from '../hooks/sheet/useEditMode';
import { useVariableSkills } from '../hooks/sheet/useVariableSkills';

import ThematicModal from './ui/ThematicModal';
import VariantSelectionModal from './ui/VariantSelectionModal';
import { PencilLine, Check } from 'lucide-react';

interface Props {
    isLandscape?: boolean;
}

const CharacterSheet: React.FC<Props> = ({ isLandscape = false }) => {
    const data = useCharacterData();
    const { updateData: onChange, addLog: onAddLog, recordXPTransaction } = useCharacterActions();

    const {
        isEditMode,
        setIsEditMode,
        showEditWarning,
        setShowEditWarning,
        handleToggleEditMode,
        executeEditModeActivation
    } = useEditMode();

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

    const {
        showCreationWarning,
        handleToggleCreationMode,
        executeCreationActivation,
        setShowCreationWarning
    } = useCreationMode(data, onChange, onAddLog);

    const {
        updateHeader,
        updateDot,
        handleDropItem,
        handleRemoveItem,
        updateAttribute,
        updateCombatWeapon,
        updateArmor,
        updateCounter
    } = useCharacterSheetActions(data, onChange, onAddLog, recordXPTransaction, rules);

    const {
        handleDefineVariant,
        finalizeVariantDefinition
    } = useVariableSkills(data, onChange, onAddLog, rules, setVariantModalState, variantModalState);

    const {
        attributeCategories,
        getAttributesGridClass,
        getDynamicColumns
    } = useSheetLayout(data, rules);

    // --- CharacterSheet Logic handlers (now managed by useCharacterSheetActions) ---

    const cardValue = calculateCardValue(data, rules);
    const creationActive = data.creationConfig?.active;
    const allowExtendedSkills = data.creationConfig?.extendedSkills || false;

    const { columns, backgrounds } = getDynamicColumns(isLandscape);

    const validateSkillIncrease = useCallback((id: string, newValue: number) => {
        // Find the skill by ID
        const allSkills = Object.values(data.skills).flat();
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
            return canLearnNewMysticSkill(data, skill.name, rules, !!creationActive, id);
        }

        // 2. Check Increase (>0)
        if (skill.value > 0 && newValue > skill.value) {
            return canIncreaseMysticSkill(data, skill.name, rules, id);
        }

        return { allowed: true };
    }, [data, rules, creationActive, blockedSkills]);

    return (
        <div className={`flex justify-center transition-all duration-300 ${isEditMode ? 'pr-80' : ''}`}>
            <div className={`sheet-container ${isLandscape ? 'landscape' : ''}`}>

                <SheetHeader
                    headerData={data.header}
                    creationActive={!!creationActive}
                    onUpdateHeader={updateHeader}
                    onToggleCreationMode={handleToggleCreationMode}
                    editModeActive={isEditMode}
                    onToggleEditMode={handleToggleEditMode}
                    isDateLocked={!!rules?.configurations?.calendar}
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
                                isCreationMode={!!creationActive}
                            />
                        ))}
                    </div>
                    <ExperienceSummary experience={data.experience} cardValue={cardValue} />
                </div>

                <CharacterSheetGrid
                    columns={columns}
                    backgrounds={backgrounds}
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
                    renderExtraColumn={() => (
                        <>
                            <div className="flex-none border-b border-stone-400 overflow-hidden">
                                <CombatSection data={data} updateCombatWeapon={updateCombatWeapon} updateArmor={updateArmor} />
                            </div>
                            <div className="flex-grow overflow-hidden">
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
                        </>
                    )}
                    renderBottomSection={() => (
                        <div className="grid grid-cols-2">
                            <div className="border-r-2 border-stone-800 flex flex-col">
                                <CombatSection data={data} updateCombatWeapon={updateCombatWeapon} updateArmor={updateArmor} />
                            </div>
                            <div className="flex-col overflow-hidden">
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
                        </div>
                    )}
                />

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
        </div>
    );
};


export default CharacterSheet;
