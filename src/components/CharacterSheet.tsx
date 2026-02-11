import React, { useCallback, useState } from 'react';
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
import { useCharacterSheetActions } from '../hooks/useCharacterSheetActions';
import { generateId } from '../utils/factories';
import { useCharacterBonuses } from '../hooks/useCharacterBonuses';
import { useCreationMode } from '../hooks/useCreationMode';
import { useSheetLayout } from '../hooks/useSheetLayout';
import { useRules } from '../context/RulesContext';

import ThematicModal from './ui/ThematicModal';
import VariantSelectionModal from './ui/VariantSelectionModal';
import { Layers, Save, PencilLine, Check } from 'lucide-react';

interface Props {
    isLandscape?: boolean;
}

const CharacterSheet: React.FC<Props> = ({ isLandscape = false }) => {
    const data = useCharacterData();
    const { updateData: onChange, addLog: onAddLog } = useCharacterActions();

    const [isEditMode, setIsEditMode] = useState(false);
    const [showEditWarning, setShowEditWarning] = useState(false);

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

    const {
        updateHeader,
        updateDot,
        handleDropItem,
        handleRemoveItem,
        updateAttribute,
        updateCombatWeapon,
        updateArmor,
        updateCounter
    } = useCharacterSheetActions(data, onChange, onAddLog, rules);

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

    // --- CharacterSheet Logic handlers (now managed by useCharacterSheetActions) ---

    const cardValue = calculateCardValue(data, rules);
    const creationActive = data.creationConfig?.active;
    const allowExtendedSkills = data.creationConfig?.extendedSkills || false;

    const { columns, backgrounds } = getDynamicColumns(isLandscape);

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
                    {columns.map((col, idx) => (
                        <div key={idx} className="border-r border-stone-400 flex flex-col">
                            {col.blocks.map((block) => (
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
                        {backgrounds.map((bg, bIdx) => (
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
                        {columns.map((col, idx) => (
                            <div key={idx} className={idx < 3 ? "border-r border-stone-400" : ""}>
                                {col.topBlocks.map((block) => (
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
                        {columns.map((col, idx) => (
                            <div key={idx} className={idx < 3 ? "border-r border-stone-400" : ""}>
                                {col.bottomBlocks.map((block) => (
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
                                    backgrounds.map((bg) => (
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
