import { RulesData } from '../../types/rules';
import {
    LibrarySkillEntry,
    LibraryBackgroundEntry,
    LibraryCounterEntry
} from '../../types/system';
import { logger } from '../logger';
import { SKILL_COLUMNS } from '../../constants/app';

/**
 * Reconciles the base campaign rules with the data from the specialized libraries.
 * Primarily handles skill layout rebuilding, background syncing, and counter definition syncing.
 * 
 * @param rules - The current rules data from the database
 * @param libraries - The library collection loaded for this campaign
 * @returns The fully reconciled and metadata-enriched RulesData
 */
export const reconcileRulesWithLibraries = (rules: RulesData, libraries: RulesData['libraries']): RulesData => {
    // 1. Rebuild skill layout if empty
    const currentLayoutKeys = Object.keys(rules.definitions.skills || {});
    const hasExistingLayout = currentLayoutKeys.length > 0 && currentLayoutKeys.some(k =>
        rules.definitions.skills?.[k] && (rules.definitions.skills[k] as string[]).length > 0
    );

    if (!hasExistingLayout && libraries.skills.length > 0) {
        logger.log("[CampaignReconciler] Rebuilding skill layout from library (empty layout detected)");
        if (!rules.definitions.skills) rules.definitions.skills = {};

        libraries.skills.forEach((s: LibrarySkillEntry) => {
            if (s.isActive !== false) {
                const cat = s.defaultCategory || SKILL_COLUMNS.COL_2;
                if (!rules.definitions.skills[cat]) rules.definitions.skills[cat] = [];
                if (!rules.definitions.skills[cat].includes(s.name)) {
                    rules.definitions.skills[cat].push(s.name);
                }
            }
        });
    }

    // 2. Sync Backgrounds into skill layout
    const bgCatDef = rules.definitions.skillCategories?.find((c) => c.behavior === 'Arrière-plan');
    const bgCat = bgCatDef?.id || SKILL_COLUMNS.COL_8;

    if (!rules.definitions.skills[bgCat]) rules.definitions.skills[bgCat] = [];
    libraries.backgrounds.forEach((b: LibraryBackgroundEntry) => {
        if (b.isActive !== false && !rules.definitions.skills[bgCat].includes(b.name)) {
            rules.definitions.skills[bgCat].push(b.name);
        }
    });

    // 3. Sync Counters into skill layout
    const counterCatDef = rules.definitions.skillCategories?.find((c) => c.behavior === 'Compteur');
    const counterCat = counterCatDef?.id || SKILL_COLUMNS.COL_9;
    if (!rules.definitions.skills[counterCat]) rules.definitions.skills[counterCat] = [];
    libraries.counters.forEach((c: LibraryCounterEntry) => {
        if (c.isActive !== false && !rules.definitions.skills[counterCat].includes(c.name)) {
            rules.definitions.skills[counterCat].push(c.name);
        }
    });

    // 4. Sync specific counter definitions (max, xpCost, etc.)
    if (libraries.counters && libraries.counters.length > 0) {
        const activeCounters = libraries.counters.filter((c: LibraryCounterEntry) => c.isActive !== false);

        if (!rules.definitions.counters) {
            rules.definitions.counters = {};
        }

        activeCounters.forEach((libCounter: LibraryCounterEntry) => {
            // Determine stable key: ID preferred for global, slug for local
            const key = libCounter.id || libCounter.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');

            // Always synchronize definition with library data to prevent stale values (from legacy JSON)
            rules.definitions.counters[key] = {
                id: libCounter.id,
                name: libCounter.name,
                description: libCounter.description || rules.definitions.counters[key]?.description || '',
                max: libCounter.maxValue ?? rules.definitions.counters[key]?.max ?? 10,
                value: libCounter.defaultValue ?? rules.definitions.counters[key]?.value,
                defaultValue: libCounter.defaultValue ?? rules.definitions.counters[key]?.defaultValue,
                xpCost: libCounter.xpCost ?? rules.definitions.counters[key]?.xpCost ?? 0
            };
        });
    }

    return rules;
};
