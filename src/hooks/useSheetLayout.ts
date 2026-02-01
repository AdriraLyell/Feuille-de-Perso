
import { useCallback, useMemo } from 'react';
import { CharacterSheetData, DotEntry, SkillCategoryKey } from '../types';

export const useSheetLayout = (data: CharacterSheetData) => {

    const attributeCategories = useMemo(() => data.attributeSettings || [
        { id: 'physique', label: 'Physique' },
        { id: 'mental', label: 'Mental' },
        { id: 'social', label: 'Social' }
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
        // Helper to safely get items, defaulting to empty array if category missing
        const getItems = (cat: SkillCategoryKey) => data.skills[cat] || [];

        // Setup the 5 fixed-position columns with their anchor lists
        // We assume item height + header overhead (~2 items)
        const columns = [
            {
                id: 0,
                blocks: [{ title: 'Talents', items: getItems('talents'), cat: 'talents' }],
                height: getItems('talents').length + 2
            },
            {
                id: 1,
                blocks: [{ title: 'Compétences', items: getItems('competences'), cat: 'competences' }],
                height: getItems('competences').length + 2
            },
            {
                id: 2,
                blocks: [{ title: 'Compétences', items: getItems('competences_col_2'), cat: 'competences_col_2' }],
                height: getItems('competences_col_2').length + 2
            },
            {
                id: 3,
                blocks: [{ title: 'Connaissances', items: getItems('connaissances'), cat: 'connaissances' }],
                height: getItems('connaissances').length + 2
            },
            {
                id: 4,
                blocks: [] as { title: string, items: DotEntry[], cat: string }[],
                height: 0
            }
        ];

        // The floating widgets that need to be placed
        const floatingWidgets = [
            { title: 'Autres Compétences', items: getItems('autres_competences'), cat: 'autres_competences' },
            { title: 'Compétences Secondaires', items: getItems('competences2'), cat: 'competences2' },
            { title: 'Autres', items: getItems('autres'), cat: 'autres' },
        ];

        // Distribute them to the shortest column
        floatingWidgets.forEach(widget => {
            if (widget.items.length === 0) return; // Skip empty widgets if desired, or keep them to show headers

            // Find column with min height
            const targetCol = columns.reduce((prev, curr) => (prev.height < curr.height) ? prev : curr);

            targetCol.blocks.push(widget);
            targetCol.height += widget.items.length + 2;
        });

        return columns;
    }, [data.skills]);

    return {
        attributeCategories,
        getAttributesGridClass,
        getDynamicColumns
    };
};
