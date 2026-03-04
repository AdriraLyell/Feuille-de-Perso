import { LayoutConfig, LayoutItem } from '../types/ui';
import { SheetLayout } from '../hooks/useSheetLayout';
import { logger } from './logger';

/**
 * Utility to generate default react-grid-layout configurations from the current static layout logic.
 * This serves as a bridge between the legacy static positioning and the new dynamic grid systems.
 */

const DEFAULT_BLOCK_W = 1;

export const generateDefaultLayout = (sheetLayout: SheetLayout, isLandscape: boolean): LayoutItem[] => {
    const layout: LayoutItem[] = [];

    // Helper to compute required grid units for a block
    const computeH = (itemCount: number) => Math.max(3, Math.ceil((32 + itemCount * 20) / 24) + 1);

    // Pass 1: compute max height for each "row" (top and bottom)
    // This ensures all blocks in the same visual row start at the same Y position,
    // mirroring the original CSS flex-column layout.
    let maxTopH = 0;
    let maxBottomH = 0;
    sheetLayout.columns.forEach((col) => {
        col.topBlocks.forEach(b => { maxTopH = Math.max(maxTopH, computeH(b.items.length)); });
        col.bottomBlocks.forEach(b => { maxBottomH = Math.max(maxBottomH, computeH(b.items.length)); });
    });

    // Pass 2: assign layout items using uniform row heights
    sheetLayout.columns.forEach((col, colIdx) => {
        const hasTop = col.topBlocks.length > 0;
        const hasBottom = col.bottomBlocks.length > 0;

        col.topBlocks.forEach((block) => {
            // In landscape, if there's no bottom block, extend the top block to full height
            const height = (isLandscape && hasTop && !hasBottom) ? (maxTopH + maxBottomH) : maxTopH;
            layout.push({ i: block.cat, x: colIdx, y: 0, w: DEFAULT_BLOCK_W, h: height, minW: 1, minH: 2 });
        });
        col.bottomBlocks.forEach((block) => {
            layout.push({ i: block.cat, x: colIdx, y: maxTopH, w: DEFAULT_BLOCK_W, h: maxBottomH, minW: 1, minH: 2 });
        });
    });

    // Handle counters - always at the absolute bottom of the grid
    const finalMaxY = layout.reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
    layout.push({
        i: "counters_section",
        x: 0,
        y: finalMaxY,
        w: isLandscape ? 5 : 4,
        h: 8,
        minW: 1,
        minH: 4
    });

    return layout;
};

/**
 * Merges current character layout with a new one, or returns default if none exists.
 */
export const syncLayout = (
    currentDataLayout: LayoutConfig | undefined,
    portraitLayout: SheetLayout,
    landscapeLayout: SheetLayout
): LayoutConfig => {
    const newConfig: LayoutConfig = { ...currentDataLayout };

    if (!newConfig.lg || newConfig.lg.length === 0) {
        logger.log('[Layout] Generating default landscape layout');
        newConfig.lg = generateDefaultLayout(landscapeLayout, true);
    }

    if (!newConfig.sm || newConfig.sm.length === 0) {
        logger.log('[Layout] Generating default portrait layout');
        newConfig.sm = generateDefaultLayout(portraitLayout, false);
    }

    return newConfig;
};
