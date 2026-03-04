import { useCallback, useMemo } from 'react';
import { CharacterSheetData, DotEntry } from '../types';
import { RulesData } from '../types/rules';

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
    autres?: SkillBlock[];
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

        // 1. Separate by behavior - Include everything that has a specific place in mapping
        // Skills, Secondaries, Backgrounds (Arrière-plan) and even the "AUTRES" (Col_Comp_7)
        // are all part of the column system. Only Compteur and the actual "counters" are separate.
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

        // OPTIMIZATION: Create Maps for fast O(1) lookups instead of O(N) Array.find runs inside loops
        const skillsLibRaw = rules?.libraries?.skills || [];
        const mysticAbilitiesLibRaw = rules?.libraries?.mysticAbilities || [];
        const backgroundsLibRaw = rules?.libraries?.backgrounds || [];

        const skillsMapById = new Map<string, any>();
        const skillsMapByName = new Map<string, any>();
        const mysticMapById = new Map<string, any>();
        const backgroundsMapById = new Map<string, any>();
        const backgroundsMapByName = new Map<string, any>();

        skillsLibRaw.forEach(s => {
            skillsMapById.set(s.id, s);
            if (s.name) skillsMapByName.set(s.name.trim().toLowerCase(), s);
        });

        mysticAbilitiesLibRaw.forEach(m => {
            mysticMapById.set(m.id, m);
            // Mystic abilities might be referenced by name in some old sheets, just in case
            if (m.name) skillsMapByName.set(m.name.trim().toLowerCase(), m);
        });

        backgroundsLibRaw.forEach(b => {
            backgroundsMapById.set(b.id, b);
            if (b.name) backgroundsMapByName.set(b.name.trim().toLowerCase(), b);
        });

        skillsSet.forEach(cat => {
            const items = data.skills[cat.id] || [];

            // Enrich items with metadata from rules (search in all relevant libraries)
            const enrichedItems = items.map(item => {
                const targetId = item.definitionId || item.id;
                // 1. Lookup by ID (definitionId ou item.id)
                let def = skillsMapById.get(targetId) || mysticMapById.get(targetId);

                // 2. Fallback par nom pour compatibilité fiches existantes (pas de definitionId)
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

            let map: Mapping | undefined = mapping[cat.id];

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
            backgrounds: [], // Now in columns[].bottomBlocks
            autres: [], // Now in columns[].bottomBlocks
            counters: countersSet.map(cat => ({
                title: cat.label,
                id: cat.id,
                description: cat.description
            }))
        };
    }, [data.skills, rules?.definitions?.skillCategories, rules?.libraries?.skills, rules?.libraries?.mysticAbilities, rules?.libraries?.backgrounds]);

    const portraitLayout = useMemo(() => getDynamicColumns(false), [getDynamicColumns]);
    const landscapeLayout = useMemo(() => getDynamicColumns(true), [getDynamicColumns]);

    return {
        attributeCategories,
        getAttributesGridClass,
        getDynamicColumns,
        portraitLayout,
        landscapeLayout
    };
};
