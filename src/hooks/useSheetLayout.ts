import { useCallback, useMemo } from 'react';
import { CharacterSheetData, DotEntry } from '../types';
import { RulesData } from '../types/rules';

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

    const getDynamicColumns = useCallback(() => {
        const skillCats = rules?.definitions?.skillCategories || [];
        if (skillCats.length === 0) return []; // Fallback empty

        // 1. Separate by behavior
        const skills = skillCats.filter(c => c.behavior === 'Compétence' || c.behavior === 'Secondaire');
        const backgrounds = skillCats.filter(c => c.behavior === 'Arrière-plan');
        const counters = skillCats.filter(c => c.behavior === 'Compteur');

        // 2. Base columns (First 4 are usually the main ones)
        // We use an adaptive approach: Divide 'skills' into 4-5 columns balancing height
        const columnCount = 5;
        const columns = Array.from({ length: columnCount }, (_, id) => ({
            id,
            blocks: [] as { title: string, items: DotEntry[], cat: string, description?: string, icon?: string }[],
            height: 0
        }));

        // Distribute skills & secondaries
        skills.forEach(cat => {
            const items = data.skills[cat.id] || [];
            // Find shortest column
            const targetCol = columns.reduce((prev, curr) => (prev.height < curr.height) ? prev : curr);

            targetCol.blocks.push({
                title: cat.label,
                items,
                cat: cat.id,
                description: cat.description,
                icon: cat.icon
            });
            targetCol.height += items.length + 2;
        });

        return {
            columns,
            backgrounds: backgrounds.map(cat => ({ title: cat.label, items: data.skills[cat.id] || [], cat: cat.id })),
            counters: counters.map(cat => ({ title: cat.label, id: cat.id }))
        };
    }, [data.skills, rules?.definitions?.skillCategories]);

    return {
        attributeCategories,
        getAttributesGridClass,
        getDynamicColumns
    };
};
