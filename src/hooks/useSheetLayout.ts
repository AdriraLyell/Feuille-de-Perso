import { useCallback, useMemo } from 'react';
import { CharacterSheetData, DotEntry } from '../types';
import { RulesData, SkillBehavior } from '../types/rules';

export interface SkillBlock {
    title: string;
    items: DotEntry[];
    cat: string;
    description?: string;
}

export interface SheetColumn {
    id: number;
    topBlocks: SkillBlock[];
    bottomBlocks: SkillBlock[];
    readonly blocks: SkillBlock[];
}

export interface SheetLayout {
    columns: SheetColumn[];
    columnCount: number;
    backgrounds: SkillBlock[];
    counters: { title: string; id: string; description?: string }[];
}

type ColumnRow = 'top' | 'bottom';
interface Mapping {
    col: number;
    row: ColumnRow;
}

const LANDSCAPE_MAP: Record<string, Mapping> = {
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

const PORTRAIT_MAP: Record<string, Mapping> = {
    'Col_Comp_1': { col: 0, row: 'top' },
    'Col_Comp_2': { col: 1, row: 'top' },
    'Col_Comp_3': { col: 2, row: 'top' },
    'Col_Comp_4': { col: 3, row: 'top' },
    'Col_Comp_5': { col: 0, row: 'bottom' },
    'Col_Comp_6': { col: 1, row: 'bottom' },
    'Col_Comp_7': { col: 2, row: 'bottom' },
    'Col_Comp_8': { col: 3, row: 'bottom' },
    'Col_Comp_9': { col: 0, row: 'bottom' }, // Overflow
};

export const useSheetLayout = (data: CharacterSheetData, rules: RulesData | null) => {

    const attributeCategories = useMemo(() => data.attributeSettings || [
        { id: 'pave_attributs_1', label: 'Physique' },
        { id: 'pave_attributs_2', label: 'Mental' },
        { id: 'pave_attributs_3', label: 'Social' }
    ], [data.attributeSettings]);

    const getAttributesGridClass = useCallback(() => {
        const count = attributeCategories.length;
        if (count === 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-2';
        if (count === 3) return 'grid-cols-3';
        if (count === 4) return 'grid-cols-4';
        return 'grid-cols-3'; // fallback
    }, [attributeCategories]);

    const getDynamicColumns = useCallback((isLandscape: boolean = false): SheetLayout => {
        const skillCats = rules?.definitions?.skillCategories || [];
        const fallback: SheetLayout = { columns: [], columnCount: isLandscape ? 5 : 4, backgrounds: [], counters: [] };

        if (skillCats.length === 0) return fallback;

        // 1. Separate by behavior
        const skillsSet = skillCats.filter(c => c.behavior === 'Compétence' || c.behavior === 'Secondaire');
        const backgroundsSet = skillCats.filter(c => c.behavior === 'Arrière-plan');
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

        skillsSet.forEach(cat => {
            const items = data.skills[cat.id] || [];

            // Enrich items with metadata from rules (search in all relevant libraries)
            const enrichedItems = items.map(item => {
                const targetId = item.definitionId || item.id;
                // Search in skills AND mysticAbilities libraries
                const def =
                    rules?.libraries?.skills.find(s => s.id === targetId) ||
                    rules?.libraries?.mysticAbilities.find(s => s.id === targetId);

                if (def) {
                    return {
                        ...item,
                        mysticAbilityId: def.mysticAbilityId || (rules?.libraries?.mysticAbilities.some(ma => ma.id === targetId) ? targetId : undefined),
                        isVariable: def.isVariable
                    };
                }
                return item;
            });

            const map = mapping[cat.id] || { col: 0, row: 'top' };
            const block: SkillBlock = {
                title: cat.label,
                items: enrichedItems,
                cat: cat.id,
                description: cat.description
            };

            // Safety check for col index
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
            backgrounds: backgroundsSet.map(cat => {
                const items = data.skills[cat.id] || [];
                const enrichedItems = items.map(item => {
                    const targetId = item.definitionId || item.id;
                    const def =
                        rules?.libraries?.skills.find(s => s.id === targetId) ||
                        rules?.libraries?.mysticAbilities.find(s => s.id === targetId) ||
                        rules?.libraries?.backgrounds.find(s => s.id === targetId);

                    if (def) {
                        return {
                            ...item,
                            mysticAbilityId: def.mysticAbilityId || (rules?.libraries?.mysticAbilities.some(ma => ma.id === targetId) ? targetId : undefined),
                            isVariable: def.isVariable
                        };
                    }
                    return item;
                });
                return {
                    title: cat.label,
                    items: enrichedItems,
                    cat: cat.id,
                    description: cat.description
                };
            }),
            counters: countersSet.map(cat => ({
                title: cat.label,
                id: cat.id,
                description: cat.description
            }))
        };
    }, [data.skills, rules?.definitions?.skillCategories]);

    return {
        attributeCategories,
        getAttributesGridClass,
        getDynamicColumns
    };
};
