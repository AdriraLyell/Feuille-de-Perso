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
    counters: { title: string; id: string; description?: string }[];
}

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
        if (skillCats.length === 0) return { columns: [], columnCount: isLandscape ? 5 : 4, backgrounds: [], counters: [] }; // Fallback empty structure

        // 1. Separate by behavior
        const skills = skillCats.filter(c => c.behavior === 'Compétence' || c.behavior === 'Secondaire');
        const backgrounds = skillCats.filter(c => c.behavior === 'Arrière-plan');
        const counters = skillCats.filter(c => c.behavior === 'Compteur');

        // 2. Base columns: 4 for portrait, 5 for landscape
        const columnCount = isLandscape ? 5 : 4;
        const columns: SheetColumn[] = Array.from({ length: columnCount }, (_, id) => ({
            id,
            topBlocks: [],
            bottomBlocks: [],
            get blocks() { return [...this.topBlocks, ...this.bottomBlocks]; }
        }));

        // 3. Dynamic Mapping based on column count
        const mapping: Record<string, { col: number, row: 'top' | 'bottom' }> = {};

        if (isLandscape) {
            // Mapping for 5 columns (1-5 Top / 6-10 Bottom)
            const landscapeMap: Record<string, { col: number, row: 'top' | 'bottom' }> = {
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
            Object.assign(mapping, landscapeMap);
        } else {
            // Mapping for 4 columns (1-4 Top / 5-8 Bottom)
            const portraitMap: Record<string, { col: number, row: 'top' | 'bottom' }> = {
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
            Object.assign(mapping, portraitMap);
        }

        skills.forEach(cat => {
            const items = data.skills[cat.id] || [];
            const map = mapping[cat.id] || { col: 0, row: 'top' };
            const block = {
                title: cat.label,
                items,
                cat: cat.id,
                description: cat.description
            };

            if (map.row === 'top') {
                columns[map.col].topBlocks.push(block);
            } else {
                columns[map.col].bottomBlocks.push(block);
            }
        });

        return {
            columns,
            columnCount,
            backgrounds: backgrounds.map(cat => ({
                title: cat.label,
                items: data.skills[cat.id] || [],
                cat: cat.id,
                description: cat.description
            })),
            counters: counters.map(cat => ({
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
