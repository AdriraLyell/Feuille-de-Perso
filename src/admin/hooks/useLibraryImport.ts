import { useState, useEffect, useCallback } from 'react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { CampaignService, GameSettingSummary } from '../../services/CampaignService';
import { RulesData } from '../../types/rules';
import { DotEntry, TraitEntry, CharacterSheetData } from '../../types';
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

    const [traitCandidates, setTraitCandidates] = useState<ImportCandidate<TraitEntry>[]>([]);
    const [skillCandidates, setSkillCandidates] = useState<ImportCandidate<DotEntry & { defaultCategory: string }>[]>([]);
    const [specCandidates, setSpecCandidates] = useState<ImportCandidate<unknown>[]>([]); 
    const [backgroundCandidates, setBackgroundCandidates] = useState<ImportCandidate<DotEntry>[]>([]);
    const [counterCandidates, setCounterCandidates] = useState<ImportCandidate<DotEntry>[]>([]);

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

            const charData = (typeof character.data === 'string'
                ? JSON.parse(character.data)
                : character.data) as CharacterSheetData;

            // Traits (Avantages & Désavantages)
            const allTraits = [...(charData.page2?.avantages || []), ...(charData.page2?.desavantages || [])];
            const traits = allTraits.map((t: TraitEntry) => ({
                name: t.name,
                data: t,
                isSelected: true,
                isDuplicate: (currentRules.libraries?.traits || []).some((l) =>
                    (t.definitionId && l.id === t.definitionId) || l.name?.trim().toLowerCase() === t.name?.trim().toLowerCase()
                ),
                isVariable: t.isXPUpgradeable
            }));
            setTraitCandidates(traits);

            // Skills & Backgrounds
            const skills: ImportCandidate<DotEntry & { defaultCategory: string }>[] = [];
            const bgs: ImportCandidate<DotEntry>[] = [];
            const skillsMap = charData.skills || {};

            Object.keys(skillsMap).forEach(catId => {
                const list = (skillsMap as Record<string, DotEntry[]>)[catId] || [];
                const catDef = currentRules.definitions.skillCategories?.find(c => c.id === catId);
                const isBg = catDef?.behavior === 'Arrière-plan' || catId === 'Col_Comp_8';

                list.forEach((s: DotEntry) => {
                    if (s.name && s.name !== "Nouvelle Compétence") {
                        const candidate = {
                            name: s.name,
                            data: { ...s, defaultCategory: catId },
                            isSelected: true,
                            isDuplicate: false,
                            isVariable: !!s.isVariable
                        };

                        if (isBg) {
                            candidate.isDuplicate = (currentRules.libraries?.backgrounds || []).some((l) =>
                                (s.definitionId && l.id === s.definitionId) || l.name?.trim().toLowerCase() === s.name?.trim().toLowerCase()
                            );
                            bgs.push(candidate);
                        } else {
                            candidate.isDuplicate = (currentRules.libraries?.skills || []).some((l) =>
                                (s.definitionId && l.id === s.definitionId) || l.name?.trim().toLowerCase() === s.name?.trim().toLowerCase()
                            );
                            skills.push(candidate);
                        }
                    }
                });
            });
            setSkillCandidates(skills);
            setBackgroundCandidates(bgs);

            // Specs
            const specs: ImportCandidate<unknown>[] = [];
            const specMap = charData.specializations || {};
            Object.keys(specMap).forEach(skillId => {
                const list = specMap[skillId] || [];
                list.forEach(specName => {
                    if (specName && specName.trim() !== "") {
                        specs.push({
                            name: specName,
                            data: { name: specName, skillId },
                            isSelected: true,
                            isDuplicate: (currentRules.libraries?.specializations || []).some((l) =>
                                l.name?.trim().toLowerCase() === specName.trim().toLowerCase()
                            ),
                            isVariable: false
                        });
                    }
                });
            });
            setSpecCandidates(specs);

            // Counters
            const countersFlat: ImportCandidate<DotEntry>[] = [];
            const countersData = charData.counters || {};

            Object.keys(countersData).forEach(key => {
                const item = (countersData as Record<string, unknown>)[key];
                if (Array.isArray(item)) {
                    item.forEach((c: unknown) => {
                        const counter = c as DotEntry;
                        if (counter && typeof counter === 'object' && counter.name) {
                            countersFlat.push({
                                name: counter.name,
                                data: counter,
                                isSelected: true,
                                isDuplicate: (currentRules.libraries?.counters || []).some((l) =>
                                    (counter.definitionId && l.id === counter.definitionId) || l.name?.trim().toLowerCase() === counter.name?.trim().toLowerCase()
                                ),
                                isVariable: false
                            });
                        }
                    });
                } else if (item && typeof item === 'object' && 'name' in item) {
                    const counter = item as unknown as DotEntry;
                    countersFlat.push({
                        name: counter.name,
                        data: counter,
                        isSelected: true,
                        isDuplicate: (currentRules.libraries?.counters || []).some((l) =>
                            (counter.definitionId && l.id === counter.definitionId) || l.name?.trim().toLowerCase() === counter.name?.trim().toLowerCase()
                        ),
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
        const updater = <T>(prev: ImportCandidate<T>[]) => {
            const next = [...prev];
            next[index] = { ...next[index], isSelected: !next[index].isSelected };
            return next;
        };

        if (type === 'traits') setTraitCandidates(prev => updater(prev));
        if (type === 'skills') setSkillCandidates(prev => updater(prev));
        if (type === 'specializations') setSpecCandidates(prev => updater(prev));
        if (type === 'backgrounds') setBackgroundCandidates(prev => updater(prev));
        if (type === 'counters') setCounterCandidates(prev => updater(prev));
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
                    cost: String(c.data.value || "0")
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
                    description: c.data.description || "",
                    defaultValue: c.data.creationValue || 0,
                    maxValue: c.data.max || 10,
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
