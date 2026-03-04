import { useCallback, useRef, useEffect } from 'react';
import { DotEntry, SuggestionEntry } from '../../types';
import { normalizeString } from '../../utils/stringUtils';
import { generateId } from '../../utils/factories';
import { CharacterSheetData } from '../../types/character';
import { RulesData } from '../../types/rules';

export interface VariantModalState {
    isOpen: boolean;
    category: string;
    id: string;
    skillName: string;
    definitionId?: string;
    variants: string[];
}

export const useVariableSkills = (
    data: CharacterSheetData,
    onChange: (update: (prev: CharacterSheetData) => CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void,
    rules: RulesData | null,
    setVariantModalState: React.Dispatch<React.SetStateAction<VariantModalState>>,
    variantModalState: VariantModalState
) => {
    const prevRef = useRef(data);
    useEffect(() => { prevRef.current = data; }, [data]);

    const handleDefineVariant = useCallback((category: string, id: string, name: string) => {
        const currentData = prevRef.current;
        const existingEntry = currentData.skills[category]?.find(s => s.id === id);
        let definitionId = existingEntry?.definitionId;
        let variants: string[] = [];

        const libSkill = rules?.libraries?.skills?.find(s =>
            (definitionId && s.id === definitionId) ||
            normalizeString(s.name) === normalizeString(name)
        );

        if (libSkill) {
            definitionId = libSkill.id;
            variants = libSkill.variants || [];
        }

        setVariantModalState({
            isOpen: true,
            category,
            id,
            skillName: name,
            definitionId,
            variants
        });
    }, [rules?.libraries?.skills, setVariantModalState]);

    const finalizeVariantDefinition = (variantName: string) => {
        const { category, id, definitionId } = variantModalState;
        if (!variantName.trim()) return;

        onChange(prev => {
            const list = prev.skills[category];
            if (!list) return prev;

            const index = list.findIndex(s => s.id === id);
            if (index === -1) return prev;

            const newList = [...list];

            newList[index] = {
                ...newList[index],
                variant: variantName.trim(),
                definitionId: definitionId || newList[index].definitionId
            };

            const newItem: DotEntry = {
                id: generateId(),
                name: newList[index].name,
                value: 0,
                creationValue: 0,
                max: 5,
                variant: "",
                definitionId: definitionId
            };

            newList.splice(index + 1, 0, newItem);

            onAddLog(`Définition variante : ${newList[index].name} : ${newList[index].variant}`, 'success', 'sheet');

            const newState = {
                ...prev,
                skills: {
                    ...prev.skills,
                    [category]: newList
                }
            };

            if (definitionId && variantName.trim()) {
                const libSkill = rules?.libraries?.skills?.find(s => s.id === definitionId);
                const normalizedVariant = normalizeString(variantName);

                const isKnown = libSkill?.variants?.some(v => normalizeString(v) === normalizedVariant);

                if (libSkill && !isKnown) {
                    const alreadySuggested = prev.suggestions?.some(s =>
                        s.type === 'variant' &&
                        s.parentId === definitionId &&
                        normalizeString(s.name) === normalizedVariant
                    );

                    if (!alreadySuggested) {
                        const suggestion: SuggestionEntry = {
                            id: generateId(),
                            type: 'variant',
                            name: variantName.trim(),
                            category: category,
                            parentId: definitionId,
                            timestamp: Date.now()
                        };
                        newState.suggestions = [...(prev.suggestions || []), suggestion];
                        onAddLog(`Suggestion de variante envoyée : ${variantName}`, 'info', 'sheet');
                    }
                }
            }

            return newState;
        });

        setVariantModalState(prev => ({ ...prev, isOpen: false }));
    };

    return {
        handleDefineVariant,
        finalizeVariantDefinition
    };
};
