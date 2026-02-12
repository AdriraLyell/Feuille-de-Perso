import { useState, useEffect, useCallback } from 'react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { LibraryService } from '../../services/LibraryService';
import { CampaignService, GameSettingSummary } from '../../services/CampaignService';
import { LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../../types/system';
import { RulesData } from '../../types/rules';
import { ErrorService } from '../../services/ErrorService';
import { normalizeString } from '../../utils/stringUtils';

export type TabType = 'traits' | 'skills' | 'specializations' | 'backgrounds' | 'counters';

export interface ImportCandidate<T> {
    data: T;
    isDuplicate: boolean;
    isSelected: boolean;
    isVariable: boolean;
    existingId?: string;
}

export const useLibraryImport = (character: SyncedCharacter, onSuccess?: () => void, onClose?: () => void) => {
    const data = character.data;
    const [targetSettingId, setTargetSettingId] = useState<string | null>(character.setting_id || null);
    const [settings, setSettings] = useState<GameSettingSummary[]>([]);

    const [activeTab, setActiveTab] = useState<TabType>('traits');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [importDestination, setImportDestination] = useState<'campaign' | 'global'>('campaign');
    const [currentLibrary, setCurrentLibrary] = useState<RulesData['libraries'] | null>(null);

    // Candidates
    const [traitCandidates, setTraitCandidates] = useState<ImportCandidate<LibraryEntry>[]>([]);
    const [skillCandidates, setSkillCandidates] = useState<ImportCandidate<LibrarySkillEntry>[]>([]);
    const [specCandidates, setSpecCandidates] = useState<ImportCandidate<LibrarySpecializationEntry>[]>([]);
    const [backgroundCandidates, setBackgroundCandidates] = useState<ImportCandidate<LibraryBackgroundEntry>[]>([]);
    const [counterCandidates, setCounterCandidates] = useState<ImportCandidate<LibraryCounterEntry>[]>([]);

    // 0. Load settings if orphan
    useEffect(() => {
        if (!targetSettingId) {
            const loadSettings = async () => {
                const list = await CampaignService.listSettings();
                setSettings(list || []);
            };
            loadSettings();
        }
    }, [targetSettingId]);

    // 1. Prepare Data when targetSettingId is set
    useEffect(() => {
        const prepareData = async () => {
            if (!targetSettingId) return;
            setIsLoading(true);

            try {
                // 1. Fetch current campaign library
                const libraries = await LibraryService.loadLibraries(targetSettingId);
                setCurrentLibrary(libraries);

                // 2. Scan Traits
                const rawAdvantages = (data.page2?.avantages || []);
                const advantages: LibraryEntry[] = rawAdvantages
                    .filter(t => t.name && t.name.trim() !== '')
                    .map(t => ({
                        id: crypto.randomUUID(),
                        type: 'avantage' as const,
                        name: t.name,
                        cost: t.value || '0',
                        description: t.variant || '',
                        tags: [],
                        isVariable: !!t.variant,
                        effects: []
                    }));

                const rawDisadvantages = (data.page2?.desavantages || []);
                const disadvantages: LibraryEntry[] = rawDisadvantages
                    .filter(t => t.name && t.name.trim() !== '')
                    .map(t => ({
                        id: crypto.randomUUID(),
                        type: 'desavantage' as const,
                        name: t.name,
                        cost: t.value || '0',
                        description: t.variant || '',
                        tags: [],
                        isVariable: !!t.variant,
                        effects: []
                    }));

                const allTraits = [...advantages, ...disadvantages];
                setTraitCandidates(allTraits.map(t => {
                    const existing = libraries.traits.find(et => normalizeString(et.name) === normalizeString(t.name));
                    const v = !!t.isVariable;
                    return { data: t, isDuplicate: !!existing, isSelected: !existing && !v, isVariable: v, existingId: existing?.id };
                }));

                // 3. Scan Skills
                const rawSkills: LibrarySkillEntry[] = [];
                Object.entries(data.skills || {}).forEach(([cat, list]) => {
                    const catLower = cat.toLowerCase();
                    if (
                        cat === 'Col_Comp_8' ||
                        cat === 'arrieres_plans' ||
                        catLower.includes('background') ||
                        catLower.includes('arrière-plan')
                    ) {
                        return;
                    }

                    (list as { name: string, value: number, variant?: string }[]).filter(s => s.name && s.value > 0).forEach(s => {
                        rawSkills.push({
                            id: crypto.randomUUID(),
                            name: s.name,
                            description: '',
                            defaultCategory: cat,
                            isVariable: !!s.variant
                        });
                    });
                });

                setSkillCandidates(rawSkills.map(s => {
                    const existing = libraries.skills.find(es => normalizeString(es.name) === normalizeString(s.name));
                    const v = !!s.isVariable;
                    return { data: s, isDuplicate: !!existing, isSelected: !existing && !v, isVariable: v, existingId: existing?.id };
                }));

                // 4. Scan Specializations
                const allSpecs: LibrarySpecializationEntry[] = [];
                Object.entries(data.specializations || {}).forEach(([skillId, specs]) => {
                    const skillName = Object.values(data.skills || {}).flat().find((s) => (s as { id: string, name: string }).id === skillId)?.name || skillId;

                    specs.forEach(specName => {
                        allSpecs.push({
                            id: crypto.randomUUID(),
                            name: specName,
                            skillIds: [],
                            defaultMinLevel: 1,
                            description: `Importé de ${skillName}`
                        });
                    });
                });

                setSpecCandidates(allSpecs.map(s => {
                    const existing = libraries.specializations.find(es => normalizeString(es.name) === normalizeString(s.name));
                    return { data: s, isDuplicate: !!existing, isSelected: !existing, isVariable: false, existingId: existing?.id };
                }));

                // 5. Scan Backgrounds
                const rawBackgrounds = data.skills['Col_Comp_8'] || [];
                const backgrounds: LibraryBackgroundEntry[] = rawBackgrounds
                    .filter((b) => (b as { name: string }).name && (b as { name: string }).name.trim() !== '')
                    .map((b) => {
                        const bg = b as { name: string, description?: string, variant?: string };
                        return {
                            id: crypto.randomUUID(),
                            name: bg.name,
                            description: bg.description || '',
                            isVariable: !!bg.variant,
                            defaultCategory: 'arrieres_plans'
                        };
                    });

                setBackgroundCandidates(backgrounds.map(b => {
                    const existing = libraries.backgrounds.find(eb => normalizeString(eb.name) === normalizeString(b.name));
                    return { data: b, isDuplicate: !!existing, isSelected: !existing, isVariable: b.isVariable ?? false };
                }));

                // 6. Scan Counters
                const allCounters: LibraryCounterEntry[] = [];
                const processedCounterNames = new Set<string>();

                const processCounter = (c: { name: string, description?: string, max?: number, current?: number }) => {
                    if (c.name && c.name.trim() !== '') {
                        const norm = normalizeString(c.name);
                        if (!processedCounterNames.has(norm)) {
                            allCounters.push({
                                id: crypto.randomUUID(),
                                name: c.name,
                                description: c.description || '',
                                maxValue: c.max || 10,
                                defaultValue: c.current ?? 0,
                                xpCost: 0
                            });
                            processedCounterNames.add(norm);
                        }
                    }
                };

                Object.entries(data.counters).forEach(([key, value]) => {
                    const items = Array.isArray(value) ? value : [value];
                    items.forEach(processCounter);
                });

                setCounterCandidates(allCounters.map(c => {
                    const existing = libraries.counters.find(ec => ec.name.toLowerCase() === c.name.toLowerCase());
                    return { data: c, isDuplicate: !!existing, isSelected: !existing, isVariable: false };
                }));

                setIsLoading(false);
            } catch (error) {
                ErrorService.handleError(error, { context: 'LibraryImportWizard.prepare', userMessage: "Erreur lors de la préparation de l'import." });
                setIsLoading(false);
            }
        };

        prepareData();
    }, [targetSettingId, data]);

    const handleImport = async () => {
        if (!targetSettingId || !currentLibrary) return;
        setIsSaving(true);

        try {
            const sid = importDestination === 'campaign' ? targetSettingId : null;

            // 1. Import Traits
            const traitsToImport = traitCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (traitsToImport.length > 0) await LibraryService.importTraits(sid, traitsToImport, targetSettingId || undefined);

            // 2. Import Skills
            const skillsToImport = skillCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (skillsToImport.length > 0) await LibraryService.importSkills(sid, skillsToImport, targetSettingId || undefined);

            // 3. Import Specializations
            const specsToImport = specCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (specsToImport.length > 0) await LibraryService.importSpecializations(sid, specsToImport, targetSettingId || undefined);

            // 4. Import Backgrounds
            const bgsToImport = backgroundCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (bgsToImport.length > 0) await LibraryService.importBackgrounds(sid, bgsToImport, targetSettingId || undefined);

            // 5. Import Counters
            const ctrsToImport = counterCandidates.filter(c => c.isSelected && !c.isDuplicate).map(c => c.data);
            if (ctrsToImport.length > 0) await LibraryService.importCounters(sid, ctrsToImport, targetSettingId || undefined);

            setIsSaving(false);
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (error) {
            ErrorService.handleError(error, { context: 'LibraryImportWizard.import', userMessage: "L'import a échoué." });
            setIsSaving(false);
        }
    };

    const getSelectedCount = useCallback(() => {
        return traitCandidates.filter(c => c.isSelected && !c.isDuplicate).length +
            skillCandidates.filter(c => c.isSelected && !c.isDuplicate).length +
            specCandidates.filter(c => c.isSelected && !c.isDuplicate).length +
            backgroundCandidates.filter(c => c.isSelected && !c.isDuplicate).length +
            counterCandidates.filter(c => c.isSelected && !c.isDuplicate).length;
    }, [traitCandidates, skillCandidates, specCandidates, backgroundCandidates, counterCandidates]);

    const handleTabChange = (tab: TabType) => setActiveTab(tab);

    const toggleCandidateSelection = (tab: TabType, index: number) => {
        switch (tab) {
            case 'traits':
                setTraitCandidates(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], isSelected: !next[index].isSelected };
                    return next;
                });
                break;
            case 'skills':
                setSkillCandidates(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], isSelected: !next[index].isSelected };
                    return next;
                });
                break;
            case 'specializations':
                setSpecCandidates(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], isSelected: !next[index].isSelected };
                    return next;
                });
                break;
            case 'backgrounds':
                setBackgroundCandidates(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], isSelected: !next[index].isSelected };
                    return next;
                });
                break;
            case 'counters':
                setCounterCandidates(prev => {
                    const next = [...prev];
                    next[index] = { ...next[index], isSelected: !next[index].isSelected };
                    return next;
                });
                break;
        }
    };

    const updateImportDestination = (dest: 'campaign' | 'global') => {
        setImportDestination(dest);
        if (dest === 'global') {
            setTraitCandidates(prev => prev.map(c => c.isVariable ? { ...c, isSelected: false } : c));
            setSkillCandidates(prev => prev.map(c => (c.isVariable && c.isDuplicate) ? { ...c, isSelected: false } : c));
            setBackgroundCandidates(prev => prev.map(c => c.isVariable ? { ...c, isSelected: false } : c));
        }
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
        updateImportDestination,
        traitCandidates,
        skillCandidates,
        specCandidates,
        backgroundCandidates,
        counterCandidates,
        toggleCandidateSelection,
        handleImport,
        getSelectedCount
    };
};
