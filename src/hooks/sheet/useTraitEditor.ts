import { useState } from 'react';
import { CharacterSheetData, LibraryEntry, XPTransaction } from '../../types';
import { RulesData } from '../../types/rules';

export const useTraitEditor = (
    data: CharacterSheetData,
    _rules: RulesData | null,
    onChange: (newData: CharacterSheetData) => void,
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', detail?: string) => void,
    recordXPTransaction?: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void,
    onMasterSkillNeeded?: (traitName: string, pendingAdd: () => void) => void
) => {
    const [multiSelectTarget, setMultiSelectTarget] = useState<'avantages' | 'desavantages' | null>(null);

    const removeTrait = (type: 'avantages' | 'desavantages', index: number) => {
        const list = [...data.page2[type]];
        const removedItem = list[index];
        const removedName = removedItem.name;

        // Determine if this trait has a auto_counter effect and an associated counter
        const newCustomCounters = [...data.counters.custom];
        let hasCounterChanges = false;
        const counterIdToRemove = removedItem.associatedCounterId;

        // If not found directly, try via definition
        if (!counterIdToRemove && removedItem.definitionId && _rules?.libraries?.traits) {
            const traitDef = _rules.libraries.traits.find(t => t.id === removedItem.definitionId);
            if (traitDef) {
                const hasNewProperty = traitDef.hasAutoCounter;

                // If it should have a counter but associatedCounterId is missing, this is an edge case
                // usually we rely on associatedCounterId stored on the character's instance.
                if (hasNewProperty) {
                    onAddLog(`Suppression du compteur lié à ${removedName}`, 'info', 'sheet');
                }
            }
        }

        if (counterIdToRemove) {
            const counterIndex = newCustomCounters.findIndex(c => c.id === counterIdToRemove);
            if (counterIndex !== -1) {
                const oldCounter = newCustomCounters[counterIndex];
                newCustomCounters.splice(counterIndex, 1);
                hasCounterChanges = true;
                onAddLog(`Compteur Auto lié supprimé : ${oldCounter.name || 'Compteur Auto'}`, 'info', 'sheet');
            }
        }

        // Reset master_skill competence to 0 if applicable
        let newSkills = { ...data.skills };
        let hasSkillChanges = false;
        if (removedItem.masterSkillTarget) {
            const targetSkillName = removedItem.masterSkillTarget;
            for (const catId of Object.keys(newSkills)) {
                const list = newSkills[catId];
                if (!Array.isArray(list)) continue;
                const idx = list.findIndex(s => s.name === targetSkillName);
                if (idx !== -1) {
                    const updated = [...list];
                    updated[idx] = { ...updated[idx], value: 0, creationValue: 0 };
                    newSkills = { ...newSkills, [catId]: updated };
                    hasSkillChanges = true;
                    onAddLog(`Maîtrise retirée : ${targetSkillName} remis à 0`, 'info', 'sheet');
                    break;
                }
            }
        }

        // Record refund if it was a paid trait
        if (recordXPTransaction && removedItem.name.trim()) {
            const isPostCreation = removedItem.isPostCreation;
            const points = parseInt(removedItem.value) || 0;
            const traitCostFactor = _rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);

            if (isPostCreation && points > 0) {
                recordXPTransaction({
                    type: 'refund',
                    description: `Suppression Trait : ${removedName}`,
                    amount: points * traitCostFactor,
                    source: 'XP Libre'
                });
            }
        }

        list[index] = { name: '', value: '', variant: '', description: '', tag: '', definitionId: undefined };
        const newData = {
            ...data,
            page2: { ...data.page2, [type]: list },
            counters: hasCounterChanges ? { ...data.counters, custom: newCustomCounters } : data.counters,
            skills: hasSkillChanges ? newSkills : data.skills
        };
        onChange(newData);
        if (removedName.trim()) {
            onAddLog(`Suppression ${type === 'avantages' ? 'Avantage' : 'Désavantage'} : ${removedName}`, 'info', 'sheet');
        }
    };

    const handleMultiAdd = (instances: { entry: LibraryEntry; variant?: string; cost?: string }[]) => {
        if (!multiSelectTarget) return;
        const currentList = [...data.page2[multiSelectTarget]];
        let addedCount = 0;
        let totalXPCost = 0;
        let listIndex = 0;
        const isPostCreation = !data.creationConfig?.active;
        const traitCostFactor = _rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);

        const newCustomCounters = [...data.counters.custom];
        let hasCounterChanges = false;

        // Index of trait entries that need master_skill wizard
        let masterSkillTraitIndex: number | null = null;
        let masterSkillTraitName: string | null = null;

        instances.forEach(instance => {
            const entry = instance.entry;
            const costValue = instance.cost || entry.cost || "";

            while (listIndex < currentList.length && currentList[listIndex].name.trim() !== '') {
                listIndex++;
            }

            if (listIndex < currentList.length) {
                // Helper to resolve effective effect properties from global library
                const resolveEffect = (e: any) => {
                    const res = { ...e };
                    if (e.formulaId && _rules?.libraries?.formulas) {
                        const global = _rules.libraries.formulas.find(f => f.id === e.formulaId);
                        if (global) {
                            if (global.target) res.target = global.target;
                            if (global.effectType) res.effectType = global.effectType;
                        }
                    }
                    return res;
                };

                // Determine if this trait has a auto_counter effect
                let associatedCounterId: string | undefined = undefined;
                const hasNewAutoCounter = entry.hasAutoCounter;
                const counterEffect = entry.effects?.map(resolveEffect).find(e => e.effectType === 'auto_counter');

                if (hasNewAutoCounter || counterEffect) {
                    const baseCounterName = (entry.autoCounterName || counterEffect?.target)?.trim();
                    const variantName = instance.variant?.trim();

                    let finalCounterName = "";
                    if (baseCounterName) {
                        finalCounterName = variantName ? `${baseCounterName} (${variantName})` : baseCounterName;
                    } else {
                        // Fallback to variant or trait name
                        finalCounterName = variantName || entry.name;
                    }

                    associatedCounterId = Math.random().toString(36).substring(2, 9);
                    const newCounter: any = {
                        id: associatedCounterId,
                        name: finalCounterName,
                        value: 0,
                        max: 10,
                        current: 0,
                        creationValue: 0,
                        variant: 'squares_only'
                    };

                    // Find an empty custom counter slot, or append
                    const emptyCounterIndex = newCustomCounters.findIndex(c => c.name.trim() === '');
                    if (emptyCounterIndex !== -1) {
                        newCustomCounters[emptyCounterIndex] = newCounter;
                    } else {
                        newCustomCounters.push(newCounter);
                    }

                    hasCounterChanges = true;
                    onAddLog(`Compteur ajouté : ${finalCounterName}`, 'info', 'sheet');
                }

                // Detect master_skill effect — wizard will fill in masterSkillTarget later
                // Detect master_skill effect — wizard will fill in masterSkillTarget later
                const hasMasterSkill = entry.effects?.some(e => {
                    const resolved = resolveEffect(e);
                    return resolved.effectType === 'master_skill';
                });
                if (hasMasterSkill && masterSkillTraitIndex === null) {
                    masterSkillTraitIndex = listIndex;
                    masterSkillTraitName = entry.name;
                }

                currentList[listIndex] = {
                    name: entry.name,
                    value: costValue,
                    description: entry.description || "",
                    tag: entry.tags?.[0] || '',
                    variant: instance.variant || '',
                    definitionId: entry.id,
                    type: multiSelectTarget === 'avantages' ? 'avantage' : 'desavantage',
                    mysticAbilityId: entry.mysticAbilityId || undefined,
                    isPostCreation: isPostCreation ? true : undefined,
                    creationValue: isPostCreation ? "0" : undefined,
                    associatedCounterId: associatedCounterId,
                    hasAutoCounter: entry.hasAutoCounter,
                    autoCounterName: entry.autoCounterName,
                    isXPUpgradeable: entry.isXPUpgradeable
                };

                if (isPostCreation) {
                    const points = parseInt(costValue) || 0;
                    totalXPCost += points * traitCostFactor;
                }
                addedCount++;
            }
        });

        if (addedCount > 0) {
            const newData = {
                ...data,
                page2: { ...data.page2, [multiSelectTarget]: currentList },
                counters: hasCounterChanges ? { ...data.counters, custom: newCustomCounters } : data.counters
            };

            if (isPostCreation && totalXPCost > 0) {
                onAddLog(`Achat de ${addedCount} trait(s) pour ${totalXPCost} XP.`, 'success', 'sheet');

                if (recordXPTransaction) {
                    const descriptions = instances.map(i => i.entry.name).join(', ');
                    recordXPTransaction({
                        type: 'spend',
                        description: `Achat Traits : ${descriptions}`,
                        amount: totalXPCost,
                        source: 'XP Libre'
                    });
                }
            } else {
                onAddLog(`Ajout de ${addedCount} trait(s).`, 'success', 'sheet');
            }

            onChange(newData);

            // Trigger master_skill wizard after state is committed
            if (masterSkillTraitIndex !== null && masterSkillTraitName && onMasterSkillNeeded) {
                const traitIdx = masterSkillTraitIndex;
                const traitType = multiSelectTarget;
                onMasterSkillNeeded(masterSkillTraitName, () => {
                    // This callback is called with the chosen skill from the wizard
                    // It will be replaced by applyMasterSkill in CharacterSheetPage2
                    void traitIdx; void traitType;
                });
            }
        }
        setMultiSelectTarget(null);
    };

    /**
     * Applique la maîtrise d'une compétence sur la fiche.
     * Appelé depuis CharacterSheetPage2 après confirmation du wizard.
     */
    const applyMasterSkill = (
        currentData: CharacterSheetData,
        traitType: 'avantages' | 'desavantages',
        traitName: string,
        categoryId: string,
        skillName: string
    ): CharacterSheetData => {
        // 1. Mettre la compétence au rang 5 avec creationValue = 5 (gratuit en XP)
        const newSkills = { ...currentData.skills };
        const catList = newSkills[categoryId];
        if (Array.isArray(catList)) {
            const skillIdx = catList.findIndex(s => s.name === skillName);
            if (skillIdx !== -1) {
                const updated = [...catList];
                updated[skillIdx] = { ...updated[skillIdx], value: 5, creationValue: 5 };
                newSkills[categoryId] = updated;
            }
        }

        // 2. Stocker le nom dans le TraitEntry correspondant (masterSkillTarget)
        // Et mettre à jour le variant pour l'affichage ("Maitre : Bagarre")
        const traitList = [...currentData.page2[traitType]];
        const traitIdx = traitList.findIndex(t => t.name === traitName && !t.masterSkillTarget);
        if (traitIdx !== -1) {
            traitList[traitIdx] = {
                ...traitList[traitIdx],
                masterSkillTarget: skillName,
                variant: skillName
            };
        }

        return {
            ...currentData,
            skills: newSkills,
            page2: { ...currentData.page2, [traitType]: traitList }
        };
    };

    return {
        multiSelectTarget,
        setMultiSelectTarget,
        removeTrait,
        handleMultiAdd,
        applyMasterSkill
    };
};
