
import { CharacterSheetData, DotEntry, AttributeEntry, TraitEntry } from '../types';
import { RulesData } from '../types/rules';
import { generateId } from './factories';
import { normalizeString } from './stringUtils';
import { getSkillCategory, getCounter, setCounter } from './stateAccessors';
import { reconcileSkillsAndBackgrounds } from './reconcilers/skillsReconciler';
import { migrateTraitLibrary } from './migrations/migrateTraitProperties';
import { logger } from './logger';
import { LibraryEntry, LibrarySpecializationEntry } from '../types';
import { mergeLibraries } from './libraryMerger';

// --- Sub-functions ---

/**
 * Synchronizes metadata and global configurations from rules.
 * Updates character info, XP costs, and creation rules.
 * 
 * @param newState - The current draft state being updated
 * @param rules - The new rules to apply
 */
const reconcileConfigurations = (newState: CharacterSheetData, rules: RulesData) => {
    // 1. Sync Info
    const ruleSettingId = rules.settingId;
    if (ruleSettingId) {
        newState.syncInfo = {
            ...newState.syncInfo,
            settingId: ruleSettingId,
            settingName: rules.settingName || newState.syncInfo?.settingName || 'Inconnue',
            syncId: newState.syncInfo?.syncId || '',
            lastSynced: Date.now()
        };
    }

    // 2. XP Costs
    if (rules.configurations?.xpCosts) {
        newState.xpCosts = {
            attributeFactor: rules.configurations.xpCosts.attributeFactor || 6,
            skillFactor: rules.configurations.xpCosts.skillFactor || 1,
            specializationFactor: rules.configurations.xpCosts.specializationFactor || 0,
            traitCost: rules.configurations.xpCosts.traitCost || 5
        };
    }

    // 3. Creation Config
    if (rules.configurations?.creation) {
        newState.creationConfig = {
            ...newState.creationConfig,
            ...rules.configurations.creation,
            cardConfig: rules.configurations.cards ? {
                ...newState.creationConfig.cardConfig,
                ...rules.configurations.cards
            } : newState.creationConfig.cardConfig,
            rankSlots: rules.configurations.creation.rankSlots
        };
    }

    // 4. Secondary Attributes Toggle
    if (rules.configurations?.global?.secondaryAttributes !== undefined) {
        newState.secondaryAttributesActive = rules.configurations.global.secondaryAttributes;
    }
};

/**
 * Reconstructs main attributes based on rules definitions.
 * Preserves dots and values while attaching correct rules-based properties.
 * 
 * @param newState - The current draft state
 * @param rules - The rules containing attribute definitions
 */
const reconcileAttributes = (newState: CharacterSheetData, rules: RulesData) => {
    const ruleAttributes = rules.definitions.attributes;
    if (!ruleAttributes) return;

    // A. Main Attributes
    const newAttributes: Record<string, AttributeEntry[]> = {};
    Object.keys(ruleAttributes).forEach(category => {
        const definedNames = ruleAttributes[category];
        const existingEntries = newState.attributes[category] || [];
        const processedNames = new Set<string>();
        const consumedIds = new Set<string>();

        const syncedAttributes = definedNames.map(name => {
            processedNames.add(name);
            const existing = existingEntries.find(e => e.name === name && !consumedIds.has(e.id));

            if (existing) {
                consumedIds.add(existing.id);
                return { ...existing, name: name };
            } else {
                return {
                    id: generateId(), name, val1: "0", val2: "", val3: "",
                    creationVal1: 0, creationVal2: 0, creationVal3: 0
                };
            }
        });

        const remainingAttributes = existingEntries.filter(e => e && e.name && !consumedIds.has(e.id) && !processedNames.has(e.name));
        newAttributes[category] = [...syncedAttributes, ...remainingAttributes];
    });

    Object.keys(newState.attributes).forEach(cat => {
        if (!newAttributes[cat]) newAttributes[cat] = newState.attributes[cat];
    });
    newState.attributes = newAttributes;

    // B. Attribute Settings (Labels)
    const labels = rules.definitions.labels || {};
    newState.attributeSettings = Object.keys(ruleAttributes).map(key => ({
        id: key,
        label: labels[key] || key.charAt(0).toUpperCase() + key.slice(1)
    }));
};

/**
 * Reconstructs secondary attributes categorized by their type.
 * 
 * @param newState - The current draft state
 * @param rules - The rules containing secondary attribute definitions
 */
const reconcileSecondaryAttributes = (newState: CharacterSheetData, rules: RulesData) => {
    const ruleSecondary = rules.definitions.secondaryAttributes || {};
    const newSecondary: Record<string, AttributeEntry[]> = {};

    const allCategories = new Set([
        ...Object.keys(rules.definitions.attributes || {}),
        ...Object.keys(newState.secondaryAttributes || {})
    ]);

    allCategories.forEach(category => {
        const definedNames = ruleSecondary[category] || [];
        const existingEntries = newState.secondaryAttributes?.[category] || [];
        const processedNames = new Set<string>();
        const consumedIds = new Set<string>();

        const syncedSecondary = definedNames.map(name => {
            processedNames.add(name);
            const existing = existingEntries.find(e => e.name === name && !consumedIds.has(e.id));
            if (existing) {
                consumedIds.add(existing.id);
                return { ...existing, name };
            } else {
                return { id: generateId(), name, val1: "0", val2: "", val3: "", creationVal1: 0, creationVal2: 0, creationVal3: 0 };
            }
        });

        const remainingSecondary = existingEntries.filter(e => e && e.name && !consumedIds.has(e.id) && !processedNames.has(e.name));
        newSecondary[category] = [...syncedSecondary, ...remainingSecondary];
    });
    newState.secondaryAttributes = newSecondary;
};

// --- Sub-functions --- (Note: reconcileSkillsAndBackgrounds is now in reconcilers/skillsReconciler.ts)

/**
 * Synchronizes custom counters with their library definitions.
 * 
 * @param newState - The current draft state
 * @param currentState - The source state
 * @param rules - The campaign rules
 */
const reconcileCounters = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    if (!rules.definitions.counters) return;

    const newCounters: CharacterSheetData['counters'] = {
        custom: currentState.counters.custom || []
    };

    Object.keys(rules.definitions.counters).forEach(key => {
        const def = rules.definitions.counters[key];
        const existingRaw = currentState.counters[key];
        const existing = Array.isArray(existingRaw) ? existingRaw[0] : (existingRaw as DotEntry | undefined);

        const libCounter = rules.libraries?.counters?.find(c => normalizeString(c.name) === normalizeString(def.name) || c.id === key);
        const description = def.description || libCounter?.description || '';

        const defaultValue = def.defaultValue !== undefined ? def.defaultValue : (def.value || 3);
        const max = def.max || 10;

        const value = existing?.value !== undefined ? existing.value : defaultValue;
        const creationValue = existing?.creationValue !== undefined ? existing.creationValue : defaultValue;

        if (existing) {
            newCounters[key] = {
                ...existing,
                name: def.name,
                max,
                description: description || existing.description || '',
                value,
                creationValue
            };
        } else {
            newCounters[key] = {
                id: key,
                name: def.name,
                description,
                value,
                creationValue,
                max,
                current: 0
            };
        }
    });
    newState.counters = newCounters;
};

/**
 * Links traits (advantages/disadvantages) to their latest library definitions.
 * Also performs property migration (legacy effects -> direct fields) during load.
 * 
 * @param newState - The current draft state
 * @param currentState - The source state
 * @param rules - The campaign rules
 */
const reconcileTraits = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    const processTraitList = (list: TraitEntry[], type: 'avantage' | 'desavantage'): TraitEntry[] => {
        if (!list) return [];
        return list.map(existing => {
            const libMatch = existing.definitionId
                ? rules.libraries?.traits?.find(t => t.id === existing.definitionId)
                : rules.libraries?.traits?.find(t =>
                    t.type === type && normalizeString(t.name) === normalizeString(existing.name)
                );

            if (libMatch) {
                const isMystic = libMatch.mysticAbilityId || libMatch.tags?.some(tag => normalizeString(tag) === 'mystique');

                // --- Migration Logic ---
                // We ensure the character trait has the latest flags from the library
                // and we also check if it has legacy effects that need migration.
                const needsMigration = (libMatch.hasAutoCounter && !existing.hasAutoCounter) ||
                    (libMatch.isXPUpgradeable && !existing.isXPUpgradeable);

                return {
                    ...existing,
                    definitionId: libMatch.id,
                    mysticAbilityId: libMatch.mysticAbilityId || existing.mysticAbilityId,
                    tag: isMystic ? 'Mystique' : existing.tag,
                    // Copy native properties from library if missing
                    hasAutoCounter: libMatch.hasAutoCounter ?? existing.hasAutoCounter,
                    autoCounterName: libMatch.autoCounterName ?? existing.autoCounterName,
                    isXPUpgradeable: libMatch.isXPUpgradeable ?? existing.isXPUpgradeable
                };
            }

            return existing;
        });
    };

    if (newState.page2) {
        newState.page2.avantages = processTraitList(currentState.page2.avantages || [], 'avantage');
        newState.page2.desavantages = processTraitList(currentState.page2.desavantages || [], 'desavantage');
    }
}

/**
 * Cleanup redundant local library entries that are exact matches of official ones.
 * This fixes the issue where traits lose their "Official" status because they were 
 * copied into the local library by a previous bug.
 */
const reconcileCleanup = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    if (!rules.libraries) return;

    const isRedundant = (local: any, officialList: any[]) => {
        // Un élément explicitement marqué comme "customisé" ne doit jamais être supprimé
        if (local.isCustomized) return false;

        return officialList.some(off => {
            if (normalizeString(off.name) !== normalizeString(local.name)) return false;

            // Types mapping: vertu == avantage, tare == desavantage
            if (off.type && local.type) {
                const mapType = (t: string) => {
                    const low = t.toLowerCase();
                    if (low === 'vertu') return 'avantage';
                    if (low === 'tare' || low === 'défaut' || low === 'defaut') return 'desavantage';
                    return low;
                };
                if (mapType(off.type) !== mapType(local.type)) return false;
            }

            // Robust cost/value match (treat '2' and 2 as equal, fallback to string if NaN)
            const offCostVal = off.cost !== undefined ? off.cost : off.value;
            const locCostVal = local.cost !== undefined ? local.cost : local.value;
            const offCostNum = Number(offCostVal);
            const locCostNum = Number(locCostVal);

            if (!isNaN(offCostNum) && !isNaN(locCostNum)) {
                if (offCostNum !== locCostNum) return false;
            } else {
                // If either is NaN (e.g. "1-3 pts"), fallback to stripped string comparison
                const stripText = (s: any) => String(s || '').replace(/\s|pts?/gi, '').toLowerCase();
                if (stripText(offCostVal) !== stripText(locCostVal)) return false;
            }

            // Normalise traits tags into a sorted array for comparison
            const offTagsList = Array.isArray(off.tags) ? off.tags.map(normalizeString).sort() : [];
            const locTagsList = Array.isArray(local.tags)
                ? local.tags.map(normalizeString).sort()
                : (local.tag ? [normalizeString(local.tag)] : []);

            if (JSON.stringify(offTagsList) !== JSON.stringify(locTagsList)) return false;

            // Robust pointsLabel match (strip non-digits to handle "2 pts" vs "2")
            const normalizeLabel = (l?: string) => String(l || '').replace(/\D/g, '');
            if (normalizeLabel(off.pointsLabel) !== normalizeLabel(local.pointsLabel)) return false;

            // Robust Effects Comparison (ignore IDs, ignore property order, drop empty)
            const simplifyEffects = (effects: any[]) => (effects || []).map(eff => {
                const { id, definitionId, formulaId, ...rest } = eff; // skip IDs
                return JSON.stringify(Object.keys(rest).sort().reduce((obj: any, key) => {
                    // Only keep properties that have real value
                    if (rest[key] !== '' && rest[key] !== undefined && rest[key] !== null) {
                        obj[key] = String(rest[key]); // Force string to bypass 1 vs "1"
                    }
                    return obj;
                }, {}));
            }).sort();

            const offEff = simplifyEffects(off.effects);
            const locEff = simplifyEffects(local.effects);

            // Protect metadata: if local has mysticAbilityId or isVariable, and official doesn't match, keep it
            if (local.mysticAbilityId && off.mysticAbilityId !== local.mysticAbilityId) return false;
            if (Boolean(local.isVariable) !== Boolean(off.isVariable)) return false;

            return JSON.stringify(offEff) === JSON.stringify(locEff);
        });
    };

    // 1. Clean Traits Library
    if (currentState.library && rules.libraries.traits) {
        newState.library = currentState.library.filter(l => !isRedundant(l, rules.libraries.traits!));
    }

    // 2. Clean Skill Library (remove local copies of official skills)
    if (currentState.skillLibrary && rules.libraries.skills) {
        newState.skillLibrary = currentState.skillLibrary.filter(l => !isRedundant(l, rules.libraries.skills!));
    }

    // 3. Clean Specialization Library
    if (currentState.specializationLibrary && rules.libraries.specializations) {
        newState.specializationLibrary = currentState.specializationLibrary.filter(l => !isRedundant(l, rules.libraries.specializations!));
    }

    // 4. Clean Background Library
    if (currentState.backgroundLibrary && rules.libraries.backgrounds) {
        newState.backgroundLibrary = currentState.backgroundLibrary.filter(l => !isRedundant(l, rules.libraries.backgrounds!));
    }

    // 5. Re-inject official libraries (needed by getAggregateDetails for mysticAbilityId fallback)
    // This restores the behavior of the original reconcileLibraries function.
    if (rules.libraries.skills) {
        newState.skillLibrary = rules.libraries.skills;
    }
    if (rules.libraries.formulas) {
        newState.formulaLibrary = rules.libraries.formulas;
    }
};


/**
 * Synchronizes header dates with campaign calendar if available.
 */
const reconcileHeader = (newState: CharacterSheetData, rules: RulesData) => {
    const calendar = rules.configurations?.calendar;
    if (!calendar) return;

    // Helper to format real date (YYYY-MM-DD -> DD/MM/YYYY)
    const formatRealDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('fr-FR');
        } catch (e) {
            return dateStr;
        }
    };

    // Helper to format fictional date
    const formatFictionalDate = (year: number, monthIndex: number, day: number, months: any[]) => {
        const monthName = months[monthIndex]?.name || `Mois ${monthIndex + 1}`;
        return `${day} ${monthName} ${year}`;
    };

    if (calendar.type === 'real') {
        if (calendar.startDate) {
            newState.header.campaignStartDate = formatRealDate(calendar.startDate);
        }
        if (calendar.currentDate) {
            newState.header.fictionCurrentDate = formatRealDate(calendar.currentDate);
        }
    } else if (calendar.type === 'fictional') {
        const months = calendar.months || [];
        newState.header.campaignStartDate = formatFictionalDate(calendar.startYear, 0, 1, months);
        newState.header.fictionCurrentDate = formatFictionalDate(calendar.currentYear, calendar.currentMonthIndex, calendar.currentDay, months);
    }
};

/**
 * Automatically injects imposed specializations from the campaign library
 * if the character meets the skill requirements.
 */
const reconcileImposedSpecializations = (newState: CharacterSheetData, rules: RulesData) => {
    const hybridSpecs = mergeLibraries(newState.specializationLibrary || [], rules.libraries?.specializations || []);
    const imposedLibrarySpecs = hybridSpecs
        .filter(m => m.entry.isImposed && m.entry.isActive !== false)
        .map(m => m.entry);

    // Always clear and rebuild to avoid stale data
    newState.imposedSpecializations = {};
    if (imposedLibrarySpecs.length === 0) return;

    const flatSkills = Object.values(newState.skills).flat().filter(s => s && s.name);
    const librarySkills = rules.libraries?.skills || [];

    logger.log(`[Reconciler] Reconciling ${imposedLibrarySpecs.length} imposed specs against ${flatSkills.length} skills`);

    imposedLibrarySpecs.forEach(ls => {
        // Resolve target skill names from the library if they are provided as IDs
        const targetSkillNamesNormal = librarySkills
            .filter(s => ls.skillIds.includes(s.id))
            .map(s => normalizeString(s.name));

        // Also include any IDs that might be names directly (legacy/manual)
        const targetIdsAndNamesNormal = [
            ...ls.skillIds.map(id => normalizeString(id)),
            ...targetSkillNamesNormal
        ];

        const matchingCharacterSkills = flatSkills.filter(cs => {
            const normalizedCSName = normalizeString(cs.name);
            const normalizedCSVariant = cs.variant ? normalizeString(cs.variant) : '';

            return ls.skillIds.includes(cs.id) ||
                (cs.definitionId && ls.skillIds.includes(cs.definitionId)) ||
                targetIdsAndNamesNormal.includes(normalizedCSName) ||
                (normalizedCSVariant && targetIdsAndNamesNormal.includes(normalizedCSVariant));
        });

        matchingCharacterSkills.forEach(skill => {
            const level = skill.value || 0;
            if (level >= ls.defaultMinLevel) {
                if (!newState.imposedSpecializations![skill.id]) {
                    newState.imposedSpecializations![skill.id] = [];
                }

                // Double check for duplicates (shouldn't happen with fresh reset but to be safe with name aliases)
                const alreadyPresent = newState.imposedSpecializations![skill.id].some(
                    ci => normalizeString(ci.name) === normalizeString(ls.name)
                );

                if (!alreadyPresent) {
                    newState.imposedSpecializations![skill.id].push({
                        name: ls.name,
                        minLevel: ls.defaultMinLevel
                    });
                }
            }
        });
    });
};

// --- Main Function ---

/**
 * Main function to reconcile a character state with a set of rules.
 * Creates a deep clone of the current state and sequentially applies all sub-reconcilers.
 * 
 * @param currentState - Current character sheet data
 * @param rules - New ruleset to apply
 * @returns A new reconciled character sheet state
 */
export const reconcileRulesWithState = (currentState: CharacterSheetData, rules: RulesData): CharacterSheetData => {
    const newState: CharacterSheetData = JSON.parse(JSON.stringify(currentState));

    // --- Data Migration (In-Memory) ---
    // Ensure the library traits are migrated to the new property system BEFORE reconciliation.
    // This handles legacy data in the DB or JSON file gracefully on-the-fly.
    if (rules.libraries?.traits) {
        // Only run migration if there are traits in the library
        rules.libraries.traits = migrateTraitLibrary(rules.libraries.traits as LibraryEntry[]).traits;
    }
    // ----------------------------------

    if (rules.version) {
        newState._rulesVersion = rules.version;
    }

    reconcileConfigurations(newState, rules);
    reconcileAttributes(newState, rules);
    reconcileSecondaryAttributes(newState, rules);
    reconcileSkillsAndBackgrounds(newState, currentState, rules);
    reconcileCounters(newState, currentState, rules);
    reconcileTraits(newState, currentState, rules);
    reconcileImposedSpecializations(newState, rules);
    reconcileCleanup(newState, currentState, rules);
    reconcileHeader(newState, rules);

    return newState;
};
