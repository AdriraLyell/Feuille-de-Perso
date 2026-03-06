import { CharacterSheetData } from '../types';
import { RulesData } from '../types/rules';
import { SheetLayout, SheetColumn, SkillBlock } from '../hooks/useSheetLayout';

/**
 * Static version of the layout generation logic to be used in non-hook contexts (reconcilers).
 * This MUST be kept in sync with the logic in useSheetLayout.ts.
 */

const LANDSCAPE_MAP: Record<string, { col: number, row: 'top' | 'bottom' }> = {
    'Col_Comp_1': { col: 0, row: 'top' },
    'Col_Comp_2': { col: 1, row: 'top' },
    'Col_Comp_3': { col: 2, row: 'top' },
    'Col_Comp_4': { col: 3, row: 'top' },
    'Col_Comp_5': { col: 4, row: 'top' },
    'Col_Comp_6': { col: 0, row: 'bottom' },
    'Col_Comp_7': { col: 1, row: 'bottom' },
    'Col_Comp_8': { col: 2, row: 'bottom' },
    'Col_Comp_9': { col: 3, row: 'bottom' },
    'Col_Comp_10': { col: 4, row: 'bottom' },
};

const PORTRAIT_MAP: Record<string, { col: number, row: 'top' | 'bottom' }> = {
    'Col_Comp_1': { col: 0, row: 'top' },
    'Col_Comp_2': { col: 1, row: 'top' },
    'Col_Comp_3': { col: 2, row: 'top' },
    'Col_Comp_4': { col: 3, row: 'top' },
    'Col_Comp_5': { col: 0, row: 'bottom' },
    'Col_Comp_6': { col: 1, row: 'bottom' },
    'Col_Comp_7': { col: 2, row: 'bottom' },
    'Col_Comp_8': { col: 3, row: 'bottom' },
};

export const getDynamicColumnsStatic = (data: CharacterSheetData, rules: RulesData | null, isLandscape: boolean = false): SheetLayout => {
    const skillCats = rules?.definitions?.skillCategories || [];
    const fallback: SheetLayout = { columns: [], columnCount: isLandscape ? 5 : 4, backgrounds: [], counters: [] };

    if (skillCats.length === 0) return fallback;

    // 1. Separate by behavior - Include everything that has a specific place in mapping
    const skillsSet = skillCats.filter(c =>
        c.behavior === 'Compétence' ||
        c.behavior === 'Secondaire' ||
        c.behavior === 'Arrière-plan'
    );
    const countersSet = skillCats.filter(c => c.behavior === 'Compteur');

    // 2. Base columns
    const columnCount = isLandscape ? 5 : 4;
    const columns: SheetColumn[] = Array.from({ length: columnCount }, (_, id) => ({
        id,
        topBlocks: [],
        bottomBlocks: [],
        get blocks() { return [...this.topBlocks, ...this.bottomBlocks]; }
    }));

    const mapping = isLandscape ? LANDSCAPE_MAP : PORTRAIT_MAP;

    // OPTIMIZATION: Create Maps for fast O(1) lookups
    const skillsLibRaw = rules?.libraries?.skills || [];
    const mysticAbilitiesLibRaw = rules?.libraries?.mysticAbilities || [];

    const skillsMapById = new Map<string, import('../types').LibrarySkillEntry>();
    const skillsMapByName = new Map<string, import('../types').LibrarySkillEntry>();
    const mysticMapById = new Map<string, import('../types').LibrarySkillEntry>();

    skillsLibRaw.forEach(s => {
        skillsMapById.set(s.id, s);
        if (s.name) skillsMapByName.set(s.name.trim().toLowerCase(), s);
    });

    mysticAbilitiesLibRaw.forEach(m => {
        mysticMapById.set(m.id, m);
        if (m.name) skillsMapByName.set(m.name.trim().toLowerCase(), m);
    });

    skillsSet.forEach(cat => {
        const items = data.skills[cat.id] || [];

        // Enrich items with metadata from rules
        const enrichedItems = items.map(item => {
            const targetId = item.definitionId || item.id;
            let def = skillsMapById.get(targetId) || mysticMapById.get(targetId);

            if (!def && item.name) {
                const nameLower = item.name.trim().toLowerCase();
                def = skillsMapByName.get(nameLower);
            }

            if (def) {
                return {
                    ...item,
                    mysticAbilityId: def.mysticAbilityId || (mysticMapById.has(targetId) ? targetId : undefined),
                    isVariable: def.isVariable
                };
            }
            return item;
        });

        let map = mapping[cat.id];

        // Distribute unknown categories evenly across columns
        if (!map) {
            let minCol = 0;
            let minCount = Infinity;
            for (let i = 0; i < columnCount; i++) {
                const count = columns[i].topBlocks.length + columns[i].bottomBlocks.length;
                if (count < minCount) {
                    minCount = count;
                    minCol = i;
                }
            }
            map = { col: minCol, row: 'top' };
        }

        const block: SkillBlock = {
            title: cat.label,
            items: enrichedItems,
            cat: cat.id,
            description: cat.description
        };

        if (map.col < columns.length) {
            if (map.row === 'top') {
                columns[map.col].topBlocks.push(block);
            } else {
                columns[map.col].bottomBlocks.push(block);
            }
        }
    });

    return {
        columns,
        columnCount,
        backgrounds: [], // Now in columns[].bottomBlocks
        autres: [], // Now in columns[].bottomBlocks
        counters: countersSet.map(cat => ({
            title: cat.label,
            id: cat.id,
            description: cat.description
        }))
    };
};
