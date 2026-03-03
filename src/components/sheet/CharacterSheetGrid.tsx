import React from 'react';
import { SheetColumn, SkillBlock as SkillBlockType } from '../../hooks/useSheetLayout';
import { CharacterSheetData, DropPayload } from '../../types';
import { RulesData } from '../../types/rules';
import { ThemeConfig } from '../../types/system';
import { SkillBlock } from './SkillBlock';

interface CharacterSheetGridProps {
    columns: SheetColumn[];
    backgrounds: SkillBlockType[];
    isLandscape: boolean;
    isEditMode: boolean;
    allowExtendedSkills: boolean;
    theme?: ThemeConfig;
    rules: RulesData | null;
    specializations: CharacterSheetData['specializations'];
    imposedSpecializations: CharacterSheetData['imposedSpecializations'];
    onUpdateDot: (section: 'skills', category: string, id: string, value: number) => void;
    onDefineVariant: (category: string, id: string, skillName: string, definitionId?: string) => void;
    onDropItem: (category: string, payload: DropPayload, targetIndex?: number) => void;
    onRemoveItem: (category: string, id: string) => void;
    // For Landscape extra column
    renderExtraColumn?: () => React.ReactNode;
    // For Portrait extra sections
    renderBottomSection?: () => React.ReactNode;
    validateSkillIncrease?: (id: string, newValue: number) => { allowed: boolean; reason?: string };
    blockedSkills?: Record<string, { isBlocked: boolean, sourceName: string }>;
}

const CharacterSheetGrid: React.FC<CharacterSheetGridProps> = ({
    columns,
    backgrounds,
    isLandscape,
    isEditMode,
    allowExtendedSkills,
    theme,
    rules,
    specializations,
    imposedSpecializations,
    onUpdateDot,
    onDefineVariant,
    onDropItem,
    onRemoveItem,
    renderExtraColumn,
    renderBottomSection,
    validateSkillIncrease,
    blockedSkills = {}
}) => {

    const renderSkillBlock = (block: SkillBlockType) => (
        <SkillBlock
            key={block.cat}
            title={block.title}
            items={block.items}
            cat={block.cat}
            onUpdate={onUpdateDot}
            userSpecs={specializations}
            imposedSpecs={imposedSpecializations}
            theme={theme}
            onDefineVariant={onDefineVariant}
            allowExtendedSkills={allowExtendedSkills}
            description={block.description}
            isEditing={isEditMode}
            categoryBehavior={rules?.definitions?.skillCategories?.find(c => c.id === block.cat)?.behavior}
            onDrop={onDropItem}
            onRemove={onRemoveItem}
            validateIncrease={validateSkillIncrease}
            blockedSkills={blockedSkills}
        />
    );

    if (isLandscape) {
        return (
            <div className="flex-grow grid grid-cols-6 border-b-2 border-stone-800">
                {columns.map((col, idx) => (
                    <div key={idx} className="border-r border-stone-400 flex flex-col">
                        {col.blocks.map((block) => (
                            <div key={block.cat} className="flex-grow border-b border-stone-300 last:border-b-0">
                                {renderSkillBlock(block)}
                            </div>
                        ))}
                    </div>
                ))}

                {/* 6th Column */}
                <div className="flex flex-col h-full">
                    {backgrounds.map(renderSkillBlock)}
                    {renderExtraColumn && renderExtraColumn()}
                </div>

                {/* Full Width Bottom Section for Landscape */}
                {renderBottomSection && (
                    <div className="col-span-6 border-t-2 border-stone-800">
                        {renderBottomSection()}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-4 border-b-2 border-stone-800 h-auto">
                {columns.map((col, idx) => (
                    <div key={idx} className={idx < 3 ? "border-r border-stone-400" : ""}>
                        {col.topBlocks.map(renderSkillBlock)}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-4 border-b-2 border-stone-800 flex-grow min-h-[200px]">
                {columns.map((col, idx) => (
                    <div key={idx} className={idx < 3 ? "border-r border-stone-400" : ""}>
                        {col.bottomBlocks.map(renderSkillBlock)}
                        {idx === 3 && backgrounds.map(renderSkillBlock)}
                    </div>
                ))}
            </div>

            {renderBottomSection && renderBottomSection()}
        </>
    );
};

export default CharacterSheetGrid;
