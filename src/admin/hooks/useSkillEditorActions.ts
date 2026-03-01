import { useState } from 'react';
import { RulesData, SkillCategoryConfig, SkillBehavior } from '../../types/rules';
import { LibrarySkillEntry } from '../../types';

export function useSkillEditorActions(rules: RulesData, onUpdate: (newRules: RulesData) => void) {
    const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

    const ensureSkillInLibrary = (skillName: string, category: string, currentRules: RulesData): RulesData | null => {
        if (!skillName || skillName.trim() === "" || skillName === "Nouvelle Compétence") return null;

        const lib = currentRules.libraries?.skills || [];
        const exists = lib.some(s => s.name.trim().toLowerCase() === skillName.trim().toLowerCase());

        if (!exists) {
            const newEntry: LibrarySkillEntry = {
                id: crypto.randomUUID(),
                name: skillName.trim(),
                description: "",
                defaultCategory: category,
                isVariable: false
            };
            const newLib = [...lib, newEntry].sort((a, b) => a.name.localeCompare(b.name));

            return {
                ...currentRules,
                libraries: {
                    ...currentRules.libraries,
                    skills: newLib
                }
            };
        }
        return null;
    };

    const handleSyncAll = () => {
        let currentRules = { ...rules };
        let addedCount = 0;
        const skillsMap = rules.definitions.skills || {};
        const skillCategories = rules.definitions.skillCategories || [];

        skillCategories.forEach(cat => {
            const skills = skillsMap[cat.id] || [];
            skills.forEach(skillName => {
                const updated = ensureSkillInLibrary(skillName, cat.id, currentRules);
                if (updated) {
                    currentRules = updated;
                    addedCount++;
                }
            });
        });

        if (addedCount > 0) {
            onUpdate(currentRules);
            setSyncSuccess(`${addedCount} compétence(s) ajoutée(s) à la bibliothèque.`);
            setTimeout(() => setSyncSuccess(null), 3000);
        } else {
            setSyncSuccess("Bibliothèque déjà à jour.");
            setTimeout(() => setSyncSuccess(null), 3000);
        }
    };

    const updateSkillList = (category: string, newList: string[]) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                skills: {
                    ...rules.definitions.skills,
                    [category]: newList
                }
            }
        });
    };

    const updateLabel = (category: string, newLabel: string) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                skillCategories: rules.definitions.skillCategories.map(cat =>
                    cat.id === category ? { ...cat, label: newLabel } : cat
                )
            }
        });
    };

    const updateCategoryMetadata = (category: string, updates: Partial<SkillCategoryConfig>) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                skillCategories: rules.definitions.skillCategories.map(cat =>
                    cat.id === category ? { ...cat, ...updates } : cat
                )
            }
        });
    };

    const updateBehavior = (category: string, behavior: SkillBehavior) => {
        let factor = 1;
        let type: 'linear' | 'triangular' = 'triangular';

        if (behavior === 'Secondaire') {
            factor = 0.5;
            type = 'triangular';
        } else if (behavior === 'Arrière-plan' || behavior === 'Compteur') {
            factor = 1;
            type = 'linear';
        }

        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                skillCategories: rules.definitions.skillCategories.map(cat =>
                    cat.id === category
                        ? {
                            ...cat,
                            behavior,
                            costConfig: { factor, type }
                        }
                        : cat
                )
            }
        });
    };

    const addSkill = (category: string, isSpacer = false) => {
        const skillsMap = rules.definitions.skills || {};
        const currentList = skillsMap[category] || [];
        updateSkillList(category, [...currentList, isSpacer ? "" : "Nouvelle Compétence"]);
    };

    const removeSkill = (category: string, index: number) => {
        const skillsMap = rules.definitions.skills || {};
        const currentList = skillsMap[category] || [];
        const newList = [...currentList];
        newList.splice(index, 1);
        updateSkillList(category, newList);
    };

    const updateSkillName = (category: string, index: number, newName: string) => {
        const skillsMap = rules.definitions.skills || {};
        const currentList = skillsMap[category] || [];
        const newList = [...currentList];
        newList[index] = newName;
        updateSkillList(category, newList);
    };

    const handleSkillBlur = (category: string, skillName: string) => {
        const updatedRules = ensureSkillInLibrary(skillName, category, rules);
        if (updatedRules) {
            onUpdate(updatedRules);
        }
    };

    return {
        syncSuccess,
        handleSyncAll,
        updateLabel,
        updateBehavior,
        updateCategoryMetadata,
        updateSkillName,
        addSkill,
        removeSkill,
        handleSkillBlur,
        updateSkillList
    };
}
