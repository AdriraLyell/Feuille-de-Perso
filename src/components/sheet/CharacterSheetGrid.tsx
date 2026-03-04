import React from 'react';
import { SheetColumn, SkillBlock as SkillBlockType } from '../../hooks/useSheetLayout';
import { CharacterSheetData, DropPayload } from '../../types';
import { RulesData } from '../../types/rules';
import { ThemeConfig } from '../../types/system';
import { SkillBlock } from './SkillBlock';
import { Responsive, useContainerWidth } from 'react-grid-layout';

interface CharacterSheetGridProps {
    columns: SheetColumn[];
    backgrounds: SkillBlockType[];
    autres?: SkillBlockType[];
    isEditMode: boolean;
    editLayoutMode: boolean;
    allowExtendedSkills: boolean;
    theme?: ThemeConfig;
    rules: RulesData | null;
    specializations: CharacterSheetData['specializations'];
    imposedSpecializations: CharacterSheetData['imposedSpecializations'];
    onUpdateDot: (section: 'skills', category: string, id: string, value: number) => void;
    onDefineVariant: (category: string, id: string, skillName: string, definitionId?: string) => void;
    onDropItem: (category: string, payload: DropPayload, targetIndex?: number) => void;
    onRemoveItem: (category: string, id: string) => void;
    onLayoutChange: (layout: any, allLayouts: any) => void;
    // For Portrait extra sections
    renderBottomSection?: () => React.ReactNode;
    validateSkillIncrease?: (id: string, newValue: number) => { allowed: boolean; reason?: string };
    blockedSkills?: Record<string, { isBlocked: boolean, sourceName: string }>;
    layoutConfig?: CharacterSheetData['activeLayout'];
}

const CharacterSheetGrid: React.FC<CharacterSheetGridProps> = ({
    columns,
    backgrounds,
    autres = [],
    isEditMode,
    editLayoutMode,
    allowExtendedSkills,
    theme,
    rules,
    specializations,
    imposedSpecializations,
    onUpdateDot,
    onDefineVariant,
    onDropItem,
    onRemoveItem,
    onLayoutChange,
    renderBottomSection,
    validateSkillIncrease,
    blockedSkills = {},
    layoutConfig
}) => {

    const renderSkillBlock = (block: SkillBlockType) => (
        <div key={block.cat} className="h-full border-r border-stone-800">
            <SkillBlock
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
                isDraggable={editLayoutMode}
            />
        </div>
    );

    // Collect all blocks (skills, backgrounds, others)
    const allBlocks: SkillBlockType[] = [];
    columns.forEach(col => allBlocks.push(...col.blocks));
    allBlocks.push(...backgrounds);
    allBlocks.push(...autres);

    const { width, containerRef, mounted } = useContainerWidth();

    // Use column count matching the real container width
    const breakpoints = { lg: 1200, sm: 0 };
    const cols = { lg: 5, sm: 4 };

    // Determine column count based on width
    const colCount = width >= 1200 ? 5 : 4;

    // ALL hooks must be called unconditionally (React rules of hooks).
    // This useMemo is only used in edit layout mode but must always be called.
    const staticLayouts = React.useMemo(() => {
        if (!layoutConfig) return {};
        return {
            lg: layoutConfig.lg || undefined,
            sm: layoutConfig.sm || undefined,
        };
    }, [layoutConfig]);

    // ------------------------------------------------------------------
    // NORMAL MODE: Pure CSS grid using saved layout positions.
    // RGL is NOT mounted to avoid its internal setState loop.
    // ------------------------------------------------------------------
    if (!editLayoutMode) {
        // Determine which layout set to use based on current breakpoint
        const layoutItems = colCount === 5 ? layoutConfig?.lg : layoutConfig?.sm;

        // Build a map of cat -> layout position from the saved layout config
        const positionMap = new Map<string, { x: number; y: number; w: number; h: number }>();
        if (layoutItems) {
            for (const item of layoutItems) {
                positionMap.set(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
            }
        }

        // Calculate grid dimensions
        const rowHeight = 24; // matches RGL rowHeight
        let blocksMaxRow = 0;
        const positioned = allBlocks.map(block => {
            const pos = positionMap.get(block.cat);
            if (pos) {
                const endRow = pos.y + pos.h;
                if (endRow > blocksMaxRow) blocksMaxRow = endRow;
                return { block, pos };
            }
            return { block, pos: null };
        });

        // Also position the counters section to find the total height
        const countersPos = positionMap.get('counters_section');
        let totalMaxRow = blocksMaxRow;
        if (countersPos) {
            const endRow = countersPos.y + countersPos.h;
            if (endRow > totalMaxRow) totalMaxRow = endRow;
        }

        // The vertical separators should stop BEFORE the counters section starts
        // We use the top of the counters section as the limit
        const vSepEndRow = countersPos ? countersPos.y : blocksMaxRow;

        return (
            <div
                ref={containerRef}
                className="flex-grow relative"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                    gridTemplateRows: `repeat(${totalMaxRow}, ${rowHeight}px)`,
                }}
            >
                {/* Vertical separators that span the height UNTIL the counters section */}
                {Array.from({ length: colCount }).map((_, i) => (
                    <div
                        key={`v-sep-${i}`}
                        style={{
                            gridColumn: i + 1,
                            gridRow: `1 / span ${vSepEndRow}`,
                            borderLeft: i === 0 ? '1px solid #1c1917' : undefined,
                            borderRight: '1px solid #1c1917',
                            pointerEvents: 'none',
                            zIndex: 5, // Draw ABOVE everything else to ensure continuous lines
                        }}
                    />
                ))}

                {positioned.map(({ block, pos }) => (
                    <div
                        key={block.cat}
                        style={pos ? {
                            gridColumn: `${pos.x + 1} / span ${pos.w}`,
                            gridRow: `${pos.y + 1} / span ${pos.h}`,
                            overflow: 'hidden',
                            borderTop: '1px solid #1c1917', // Horizontal line above block names
                            zIndex: 2,
                        } : undefined}
                    >
                        {/* Remove border-r from renderSkillBlock content here */}
                        <SkillBlock
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
                            isDraggable={editLayoutMode}
                        />
                    </div>
                ))}

                {/* Counter Section */}
                <div
                    key="counters_section"
                    style={countersPos ? {
                        gridColumn: `${countersPos.x + 1} / span ${countersPos.w}`,
                        gridRow: `${countersPos.y + 1} / span ${countersPos.h}`,
                        overflow: 'hidden',
                        borderTop: '1px solid #1c1917',
                        zIndex: 2,
                    } : {
                        gridColumn: `1 / span ${colCount}`,
                        overflow: 'hidden',
                        borderTop: '1px solid #1c1917',
                        zIndex: 2,
                    }}
                >
                    {renderBottomSection && renderBottomSection()}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex-grow relative edit-layout-mode"
        >
            {mounted && (
                <Responsive
                    className="layout"
                    width={width}
                    layouts={staticLayouts as Record<string, any>}
                    breakpoints={breakpoints}
                    cols={cols}
                    rowHeight={24}
                    onLayoutChange={onLayoutChange}
                    draggableHandle=".skill-block-header"
                    margin={[0, 0]}
                    compactType="vertical"
                    {...{ isDraggable: true, isResizable: true } as any}
                >
                    {allBlocks.map(renderSkillBlock)}

                    {/* Counter Section as a grid item */}
                    <div key="counters_section">
                        {renderBottomSection && renderBottomSection()}
                    </div>
                </Responsive>
            )}
        </div>
    );
};

export default CharacterSheetGrid;
