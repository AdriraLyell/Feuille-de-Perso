import { useState, useEffect, useMemo } from 'react';
import { CharacterSyncService, SyncedCharacter } from '../../services/CharacterSyncService';
import { CampaignService, RulesData } from '../../services/CampaignService';
import { CharacterSheetData } from '../../types';

export interface SkillRow {
    name: string;
    scores: number[];
    maxScore: number;
}

export const useRosterData = (settingId: string) => {
    const [characters, setCharacters] = useState<SyncedCharacter[]>([]);
    const [rules, setRules] = useState<RulesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [settingId]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [chars, setting] = await Promise.all([
                CharacterSyncService.getFullCharactersBySettingId(settingId),
                CampaignService.loadSetting(settingId)
            ]);

            setCharacters(chars);
            setRules(setting);

            if (!setting) {
                setError("La chronique demandée n'existe pas ou n'est plus accessible.");
            }
        } catch {
            setError("Impossible de charger les données du registre.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrentDate = () => {
        if (!rules?.configurations?.calendar) return "Non configuré";
        const cal = rules.configurations.calendar;
        if (cal.type === 'fictional') {
            const m = cal.months?.[cal.currentMonthIndex]?.name ?? `Mois ${cal.currentMonthIndex + 1}`;
            return `Jour ${cal.currentDay}, ${m}, An ${cal.currentYear}`;
        } else {
            if (!cal.currentDate) return "Date indéfinie";
            const d = new Date(cal.currentDate);
            if (isNaN(d.getTime())) return cal.currentDate;
            return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    };

    const handleAdvanceTime = async (amount: 'day' | 'week' | 'month') => {
        if (!rules || !rules.configurations.calendar) return;
        const calendar = rules.configurations.calendar;
        let newCalendar = { ...calendar };

        if (calendar.type === 'fictional') {
            let { currentDay, currentMonthIndex, currentYear } = calendar;

            const incrementDay = () => {
                const currentMonthDays = calendar.months[currentMonthIndex]?.days ?? 30;
                currentDay++;
                if (currentDay > currentMonthDays) {
                    currentDay = 1;
                    currentMonthIndex++;
                    if (currentMonthIndex >= calendar.months.length) {
                        currentMonthIndex = 0;
                        currentYear++;
                    }
                }
            };

            if (amount === 'day') {
                incrementDay();
            } else if (amount === 'week') {
                for (let i = 0; i < 7; i++) incrementDay();
            } else if (amount === 'month') {
                currentMonthIndex++;
                if (currentMonthIndex >= calendar.months.length) {
                    currentMonthIndex = 0;
                    currentYear++;
                }
                const monthDays = calendar.months[currentMonthIndex]?.days ?? 30;
                currentDay = Math.min(currentDay, monthDays);
            }

            newCalendar = { ...calendar, currentDay, currentMonthIndex, currentYear };

        } else if (calendar.type === 'real') {
            if (!calendar.currentDate) return;
            const date = new Date(calendar.currentDate);
            if (isNaN(date.getTime())) return;

            if (amount === 'day') {
                date.setDate(date.getDate() + 1);
            } else if (amount === 'week') {
                date.setDate(date.getDate() + 7);
            } else if (amount === 'month') {
                date.setMonth(date.getMonth() + 1);
            }
            newCalendar = { ...calendar, currentDate: date.toISOString().split('T')[0] };
        }

        const newRules = {
            ...rules,
            configurations: {
                ...rules.configurations,
                calendar: newCalendar
            },
            lastUpdated: Date.now()
        };

        setRules(newRules);
        await CampaignService.saveSetting(settingId, newRules);
    };

    const handleRollbackTime = async () => {
        if (!rules || !rules.configurations.calendar) return;
        const calendar = rules.configurations.calendar;
        let newCalendar = { ...calendar };

        if (calendar.type === 'fictional') {
            let { currentDay, currentMonthIndex, currentYear } = calendar;

            currentDay--;
            if (currentDay < 1) {
                currentMonthIndex--;
                if (currentMonthIndex < 0) {
                    currentMonthIndex = calendar.months.length - 1;
                    currentYear--;
                }
                currentDay = calendar.months[currentMonthIndex]?.days ?? 30;
            }

            newCalendar = { ...calendar, currentDay, currentMonthIndex, currentYear };

        } else if (calendar.type === 'real') {
            if (!calendar.currentDate) return;
            const date = new Date(calendar.currentDate);
            if (isNaN(date.getTime())) return;

            date.setDate(date.getDate() - 1);
            newCalendar = { ...calendar, currentDate: date.toISOString().split('T')[0] };
        }

        const newRules = {
            ...rules,
            configurations: {
                ...rules.configurations,
                calendar: newCalendar
            },
            lastUpdated: Date.now()
        };

        setRules(newRules);
        await CampaignService.saveSetting(settingId, newRules);
    };

    const allAttributes = useMemo(() => {
        const attrs: { name: string, category: string }[] = [];
        if (characters.length > 0) {
            Object.entries(characters[0].data.attributes || {}).forEach(([catName, attrList]) => {
                attrList.forEach(attr => {
                    if (!attrs.find(a => a.name === attr.name)) {
                        attrs.push({ name: attr.name, category: catName });
                    }
                });
            });
        }
        return attrs;
    }, [characters]);

    const skillMatrix = useMemo(() => {
        const matrix: Record<string, SkillRow[]> = {};
        if (characters.length > 0 && rules) {
            const officialSkillMap = new Map<string, string>();

            const addToMap = (lib: import('../../types').LibrarySkillEntry[] | undefined) => {
                lib?.forEach(s => {
                    const lowerName = s.name.trim().toLowerCase();
                    if (s.mysticAbilityId) {
                        officialSkillMap.set(lowerName, `MYSTIC_${s.mysticAbilityId}`);
                    } else if (s.defaultCategory) {
                        officialSkillMap.set(lowerName, s.defaultCategory);
                    }
                });
            };

            addToMap(rules?.libraries?.skills);
            addToMap(rules?.libraries?.backgrounds);

            rules?.libraries?.mysticAbilities?.forEach(s => {
                officialSkillMap.set(s.name.trim().toLowerCase(), `MYSTIC_${s.id}`);
            });

            const masterCategoriesMap = new Map<string, Set<string>>();

            characters.forEach(c => {
                const charData = c.data as CharacterSheetData;
                Object.entries(charData.skills || {}).forEach(([_, skillList]) => {
                    skillList.forEach(s => {
                        const baseName = s.name.trim();
                        const variantName = s.variant?.trim();
                        const cleanName = variantName ? `${baseName} : ${variantName}` : baseName;
                        const lowerName = cleanName.toLowerCase();

                        let rootName = baseName.toLowerCase();
                        if (rootName.includes('(')) {
                            rootName = rootName.split('(')[0].trim();
                        } else if (rootName.includes(':')) {
                            rootName = rootName.split(':')[0].trim();
                        }

                        let masterCatId = officialSkillMap.get(lowerName) || officialSkillMap.get(rootName);

                        if (!masterCatId) {
                            const mId = s.mysticAbilityId;
                            if (mId) {
                                masterCatId = `MYSTIC_${mId}`;
                            } else {
                                masterCatId = "Col_Comp_Custom";
                            }
                        }

                        if (!masterCategoriesMap.has(masterCatId)) {
                            masterCategoriesMap.set(masterCatId, new Set());
                        }
                        masterCategoriesMap.get(masterCatId)!.add(cleanName);
                    });
                });
            });

            masterCategoriesMap.forEach((uniqueSkills, catId) => {
                let catLabel = "Autres (Hors Référentiel)";
                if (catId.startsWith("MYSTIC_")) {
                    const mId = catId.replace("MYSTIC_", "");
                    const mysticDef = rules.libraries.mysticAbilities?.find(m => m.id === mId);
                    catLabel = mysticDef?.name ? mysticDef.name.toUpperCase() : "HABILETÉS MYSTIQUES";
                } else if (catId !== "Col_Comp_Custom") {
                    const catConfig = rules.definitions.skillCategories?.find(c => c.id === catId);
                    catLabel = catConfig?.label || catId;
                }

                const rows: SkillRow[] = [];
                uniqueSkills.forEach(skillName => {
                    const scores = characters.map(c => {
                        const charData = c.data as CharacterSheetData;
                        let foundValue = 0;

                        for (const [, catSkills] of Object.entries(charData.skills || {})) {
                            const found = catSkills.find(s => {
                                const b = s.name.trim();
                                const v = s.variant?.trim();
                                const cn = v ? `${b} : ${v}` : b;
                                return cn === skillName;
                            });
                            if (found) {
                                foundValue = found.value || 0;
                                break;
                            }
                        }
                        return foundValue;
                    });

                    const maxScore = Math.max(...scores);
                    if (maxScore > 0) {
                        rows.push({ name: skillName, scores, maxScore });
                    }
                });

                if (rows.length > 0) {
                    rows.sort((a, b) => a.name.localeCompare(b.name));
                    matrix[catLabel] = rows;
                }
            });
        }
        return matrix;
    }, [characters, rules]);

    return {
        characters,
        rules,
        isLoading,
        error,
        allAttributes,
        skillMatrix,
        formatCurrentDate,
        handleAdvanceTime,
        handleRollbackTime,
        loadData
    };
};
