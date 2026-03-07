import React from 'react';
import { SheetColumn, SkillBlock as SkillBlockType } from '../../hooks/useSheetLayout';
import { CharacterSheetData, DropPayload } from '../../types';
import { RulesData } from '../../types/rules';
import { ThemeConfig } from '../../types/system';
import { SkillBlock } from './SkillBlock';
import { Responsive, useContainerWidth, Layout } from 'react-grid-layout';

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
    onLayoutChange: (layout: Layout[], allLayouts: Record<string, Layout[]>) => void;
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
        } as Record<string, Layout[] | undefined>;
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
        
        // If we have a saved layout, use it. 
        // IF NOT (New character / Reset), we generate a simple default flow
        if (layoutItems && layoutItems.length > 0) {
            for (const item of layoutItems) {
                positionMap.set(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
            }
        } else {
            // FALLBACK: Generate an exact default layout mimicking generateDefaultLayout logic
            const computeH = (itemCount: number) => {
                return Math.max(3, Math.ceil((28 + itemCount * 20) / 24) + 1);
            };

            let maxTopH = 0;
            let maxBottomH = 0;

            // Pass 1: compute max height for each visual "row" across all columns
            columns.forEach((col) => {
                col.topBlocks.forEach(b => { maxTopH = Math.max(maxTopH, computeH(b.items.length)); });
                col.bottomBlocks.forEach(b => { maxBottomH = Math.max(maxBottomH, computeH(b.items.length)); });
            });

            // Pass 2: assign layout positions using uniform row heights for perfect horizontal alignment
            const isLandscape = colCount === 5;
            columns.forEach((col, colIdx) => {
                const hasTop = col.topBlocks.length > 0;
                const hasBottom = col.bottomBlocks.length > 0;

                col.topBlocks.forEach((block) => {
                    const height = (isLandscape && hasTop && !hasBottom) ? (maxTopH + maxBottomH) : maxTopH;
                    positionMap.set(block.cat, { x: colIdx, y: 0, w: 1, h: height });
                });
                col.bottomBlocks.forEach((block) => {
                    positionMap.set(block.cat, { x: colIdx, y: maxTopH, w: 1, h: maxBottomH });
                });
            });
            
            // Just in case any backgrounds/autres slipped through
            const finalMaxY = maxTopH + maxBottomH;
            backgrounds.forEach((block, i) => {
                positionMap.set(block.cat, { x: i % colCount, y: finalMaxY, w: 1, h: 8 });
            });
            autres.forEach((block, i) => {
                positionMap.set(block.cat, { x: (i + 2) % colCount, y: finalMaxY, w: 1, h: 8 });
            });
        }

        // Calculate grid dimensions
        const rowHeight = 24; 
        let blocksMaxRow = 0;
        const positioned = allBlocks.map(block => {
            const pos = positionMap.get(block.cat);
            if (pos) {
                const endRow = pos.y + pos.h;
                if (endRow > blocksMaxRow) blocksMaxRow = endRow;
                return { block, pos };
            }
            // Should not happen with the fallback logic above
            return { block, pos: { x: 0, y: 0, w: 1, h: 10 } };
        });

        const countersPos = positionMap.get('counters_section');
        let totalMaxRow = Math.max(blocksMaxRow, 20); // Minimum height safety
        if (countersPos) {
            const endRow = countersPos.y + countersPos.h;
            if (endRow > totalMaxRow) totalMaxRow = endRow;
        } else {
            // If counters not in layout, they take the bottom row
            totalMaxRow += 8; 
        }

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
                {/* Vertical separators: Render colCount-1 lines to avoid double borders on edges */}
                {Array.from({ length: colCount - 1 }).map((_, i) => (
                    <div
                        key={`v-sep-${i}`}
                        style={{
                            gridColumn: i + 1,
                            gridRow: `1 / span ${vSepEndRow}`,
                            borderRight: '1px solid #1c1917',
                            pointerEvents: 'none',
                            zIndex: 10, 
                        }}
                    />
                ))}

                {positioned.map(({ block, pos }) => (
                    <div
                        key={block.cat}
                        className="bg-paper-cream" // Ensure background covers separators
                        style={{
                            gridColumn: `${pos.x + 1} / span ${pos.w}`,
                            gridRow: `${pos.y + 1} / span ${pos.h}`,
                            overflow: 'hidden',
                            borderTop: '1px solid #1c1917',
                            zIndex: 2,
                        }}
                    >
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
                    className="bg-paper-cream"
                    style={countersPos ? {
                        gridColumn: `${countersPos.x + 1} / span ${countersPos.w}`,
                        gridRow: `${countersPos.y + 1} / span ${countersPos.h}`,
                        overflow: 'hidden',
                        borderTop: '1px solid #1c1917',
                        zIndex: 2,
                    } : {
                        gridColumn: `1 / span ${colCount}`,
                        gridRow: `${blocksMaxRow + 1} / span 8`,
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
                    {...({
                        className: "layout",
                        width: width,
                        layouts: staticLayouts,
                        breakpoints: breakpoints,
                        cols: cols,
                        rowHeight: 24,
                        onLayoutChange: onLayoutChange,
                        draggableHandle: ".skill-block-header",
                        margin: [0, 0],
                        compactType: "vertical",
                        isDraggable: true,
                        isResizable: true
                    } as unknown as import('react-grid-layout').ResponsiveProps)}
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
