import { useState, useEffect, useCallback } from 'react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { CampaignService, GameSettingSummary } from '../../services/CampaignService';
import { RulesData } from '../../types/rules';
import { DotEntry } from '../../types';
import { logger } from '../../utils/logger';

export type TabType = 'traits' | 'skills' | 'specializations' | 'backgrounds' | 'counters';

export interface ImportCandidate<T> {
    name: string;
    data: T;
    isSelected: boolean;
    isDuplicate: boolean;
    isVariable?: boolean;
}

export function useLibraryImport(
    character: SyncedCharacter,
    onSuccess?: () => void,
    onClose?: () => void
) {
    const [targetSettingId, setTargetSettingId] = useState<string | null>(character.setting_id || null);
    const [settings, setSettings] = useState<GameSettingSummary[]>([]);
    const [rules, setRules] = useState<RulesData | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('traits');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [importDestination, setImportDestination] = useState<'campaign' | 'global'>('campaign');

    const [traitCandidates, setTraitCandidates] = useState<ImportCandidate<any>[]>([]);
    const [skillCandidates, setSkillCandidates] = useState<ImportCandidate<any>[]>([]);
    const [specCandidates, setSpecCandidates] = useState<ImportCandidate<any>[]>([]);
    const [backgroundCandidates, setBackgroundCandidates] = useState<ImportCandidate<any>[]>([]);
    const [counterCandidates, setCounterCandidates] = useState<ImportCandidate<any>[]>([]);

    useEffect(() => {
        if (!targetSettingId) {
            CampaignService.listSettings().then(data => {
                if (data) setSettings(data);
            });
        }
    }, [targetSettingId]);

    const analyzeData = useCallback(async () => {
        if (!targetSettingId) return;
        setIsLoading(true);

        try {
            const currentRules = await CampaignService.loadSetting(targetSettingId);
            if (!currentRules) return;
            setRules(currentRules);

            const charData = typeof character.data === 'string'
                ? JSON.parse(character.data)
                : character.data;

            // Traits
            const traits = (charData.traits || []).map((t: any) => ({
                name: t.name,
                data: t,
                isSelected: true,
                isDuplicate: (currentRules.libraries?.traits || []).some((l: any) => l.name === t.name),
                isVariable: t.isVariable
            }));
            setTraitCandidates(traits);

            // Skills
            const skills: ImportCandidate<any>[] = [];
            const skillsMap = charData.skills || {};
            Object.keys(skillsMap).forEach(catId => {
                const list = skillsMap[catId] || [];
                list.forEach((s: DotEntry) => {
                    if (s.name && s.name !== "Nouvelle Compétence") {
                        skills.push({
                            name: s.name,
                            data: { ...s, defaultCategory: catId },
                            isSelected: true,
                            isDuplicate: (currentRules.libraries?.skills || []).some((l: any) => l.name === s.name),
                            isVariable: (s as any).isVariable
                        });
                    }
                });
            });
            setSkillCandidates(skills);

            // Specs
            const specs: ImportCandidate<any>[] = [];
            Object.keys(skillsMap).forEach(catId => {
                const list = skillsMap[catId] || [];
                list.forEach((s: DotEntry) => {
                    if ((s as any).specializations) {
                        (s as any).specializations.forEach((spec: any) => {
                            if (spec.name) {
                                specs.push({
                                    name: spec.name,
                                    data: spec,
                                    isSelected: true,
                                    isDuplicate: false,
                                    isVariable: false
                                });
                            }
                        });
                    }
                });
            });
            setSpecCandidates(specs);

            // Backgrounds
            const backgrounds = (charData.backgrounds || []).map((b: any) => ({
                name: b.name,
                data: b,
                isSelected: true,
                isDuplicate: (currentRules.libraries?.backgrounds || []).some((l: any) => l.name === b.name),
                isVariable: false
            }));
            setBackgroundCandidates(backgrounds);

            // Counters
            const countersFlat: ImportCandidate<any>[] = [];
            const countersData = charData.counters || {};

            // Handle record structure
            Object.keys(countersData).forEach(key => {
                const item = countersData[key];
                if (Array.isArray(item)) {
                    item.forEach(c => {
                        if (c.name) {
                            countersFlat.push({
                                name: c.name,
                                data: c,
                                isSelected: true,
                                isDuplicate: (currentRules.libraries?.counters || []).some((l: any) => l.name === c.name),
                                isVariable: false
                            });
                        }
                    });
                } else if (item && item.name) {
                    countersFlat.push({
                        name: item.name,
                        data: item,
                        isSelected: true,
                        isDuplicate: (currentRules.libraries?.counters || []).some((l: any) => l.name === item.name),
                        isVariable: false
                    });
                }
            });
            setCounterCandidates(countersFlat);

        } catch (err) {
            logger.error("Failed to analyze character data for import", err);
        } finally {
            setIsLoading(false);
        }
    }, [targetSettingId, character]);

    useEffect(() => {
        analyzeData();
    }, [analyzeData]);

    const handleTabChange = (tab: TabType) => setActiveTab(tab);

    const toggleCandidateSelection = (type: TabType, index: number) => {
        const updater = (prev: ImportCandidate<any>[]) => {
            const next = [...prev];
            next[index] = { ...next[index], isSelected: !next[index].isSelected };
            return next;
        };

        if (type === 'traits') setTraitCandidates(updater);
        if (type === 'skills') setSkillCandidates(updater);
        if (type === 'specializations') setSpecCandidates(updater);
        if (type === 'backgrounds') setBackgroundCandidates(updater);
        if (type === 'counters') setCounterCandidates(updater);
    };

    const handleImport = async () => {
        if (!targetSettingId || !rules) return;
        setIsSaving(true);

        try {
            const updatedRules = JSON.parse(JSON.stringify(rules));
            if (!updatedRules.libraries) updatedRules.libraries = {};

            // Traits
            const selectedTraits = traitCandidates.filter(c => c.isSelected && !c.isDuplicate);
            if (selectedTraits.length > 0) {
                const newTraits = selectedTraits.map(c => ({
                    id: crypto.randomUUID(),
                    name: c.name,
                    description: c.data.description || "",
                    type: c.data.type || "avantage",
                    cost: String(c.data.cost || "0")
                }));
                updatedRules.libraries.traits = [...(updatedRules.libraries.traits || []), ...newTraits];
            }

            // Skills
            const selectedSkills = skillCandidates.filter(c => c.isSelected && !c.isDuplicate);
            if (selectedSkills.length > 0) {
                const newSkills = selectedSkills.map(c => ({
                    id: crypto.randomUUID(),
                    name: c.name,
                    description: "",
                    defaultCategory: c.data.defaultCategory || "competences",
                    isVariable: !!c.isVariable
                }));
                updatedRules.libraries.skills = [...(updatedRules.libraries.skills || []), ...newSkills];
            }

            // Backgrounds
            const selectedBackgrounds = backgroundCandidates.filter(c => c.isSelected && !c.isDuplicate);
            if (selectedBackgrounds.length > 0) {
                const newBackgrounds = selectedBackgrounds.map(c => ({
                    id: crypto.randomUUID(),
                    name: c.name,
                    description: c.data.description || ""
                }));
                updatedRules.libraries.backgrounds = [...(updatedRules.libraries.backgrounds || []), ...newBackgrounds];
            }

            // Counters
            const selectedCounters = counterCandidates.filter(c => c.isSelected && !c.isDuplicate);
            if (selectedCounters.length > 0) {
                const newCounters = selectedCounters.map(c => ({
                    id: crypto.randomUUID(),
                    name: c.name,
                    description: "",
                    defaultValue: c.data.defaultValue || 0,
                    maxValue: c.data.maxValue || 10,
                    xpCost: 0
                }));
                updatedRules.libraries.counters = [...(updatedRules.libraries.counters || []), ...newCounters];
            }

            // Save
            await CampaignService.saveSetting(targetSettingId, updatedRules);

            if (onSuccess) onSuccess();
            if (onClose) onClose();

        } catch (err) {
            logger.error("Import failed", err);
        } finally {
            setIsSaving(false);
        }
    };

    const getSelectedCount = () => {
        return traitCandidates.filter(c => c.isSelected).length +
            skillCandidates.filter(c => c.isSelected).length +
            specCandidates.filter(c => c.isSelected).length +
            backgroundCandidates.filter(c => c.isSelected).length +
            counterCandidates.filter(c => c.isSelected).length;
    };

    return {
        targetSettingId,
        setTargetSettingId,
        settings,
        activeTab,
        handleTabChange,
        isLoading,
        isSaving,
        importDestination,
        updateImportDestination: (dest: 'campaign' | 'global') => setImportDestination(dest),
        traitCandidates,
        skillCandidates,
        specCandidates,
        backgroundCandidates,
        counterCandidates,
        toggleCandidateSelection,
        handleImport,
        getSelectedCount
    };
}
