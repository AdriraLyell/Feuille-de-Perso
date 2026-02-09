import { supabase } from '../../services/supabase'; // Keep for selects until fully abstracted or use execute
import { DatabaseService } from '../../services/DatabaseService';
import { RulesData } from '../../types/rules';
import { LibraryEntry as LibraryTraitEntry } from '../../types/system';

export const LibraryPersistence = {
    /**
     * Persist initial libraries for a new setting
     */
    async persistInitialLibraries(settingId: string, initialRules: Partial<RulesData>) {
        if (!initialRules.libraries) return;

        // A. Traits
        if (initialRules.libraries.traits && initialRules.libraries.traits.length > 0) {
            const traitsPayload = initialRules.libraries.traits.map(t => ({
                setting_id: settingId,
                id: t.id,
                type: t.type,
                name: t.name,
                cost: t.cost,
                description: t.description,
                tags: t.tags || [],
                is_variable: (t as any).isVariable,
                effects: (t as any).effects || []
            }));
            await DatabaseService.insert('libraries_traits', traitsPayload, 'LibraryPersistence.persistInitialLibraries.traits');
        }

        // B. Skills (Enhanced: Link Global vs Create Local)
        if (initialRules.libraries.skills && initialRules.libraries.skills.length > 0) {
            // Fetch clean globals locally or via DatabaseService (generic fetchAll is enough here)
            const globalSkills = await DatabaseService.fetchAll<{ id: string, name: string }>('libraries_skills', {
                select: 'id, name',
                eq: { setting_id: null }
            }, 'LibraryPersistence.persistInitialLibraries.linkSkills');

            const globalSkillMap = new Map((globalSkills || []).map(s => [s.name.trim().toLowerCase(), s.id]));
            const skillsPayload: any[] = [];
            const linksPayload: any[] = [];

            initialRules.libraries.skills.forEach(s => {
                const normalizedName = s.name.trim().toLowerCase();
                if (globalSkillMap.has(normalizedName)) {
                    linksPayload.push({
                        setting_id: settingId,
                        skill_id: globalSkillMap.get(normalizedName),
                        is_active: true
                    });
                } else {
                    skillsPayload.push({
                        setting_id: settingId,
                        id: s.id,
                        name: s.name,
                        description: s.description,
                        default_category: (s as any).defaultCategory,
                        is_variable: (s as any).isVariable
                    });
                }
            });

            if (skillsPayload.length > 0) await DatabaseService.insert('libraries_skills', skillsPayload, 'LibraryPersistence.persistInitialLibraries.skills');
            if (linksPayload.length > 0) await DatabaseService.insert('rel_setting_skills', linksPayload, 'LibraryPersistence.persistInitialLibraries.skillsLinks');
        }

        // C. Specializations
        if (initialRules.libraries.specializations && initialRules.libraries.specializations.length > 0) {
            const specsPayload = initialRules.libraries.specializations.map(s => ({
                setting_id: settingId,
                id: s.id,
                name: s.name,
                description: s.description,
                skill_ids: (s as any).skillIds || [],
                default_min_level: (s as any).defaultMinLevel
            }));
            await DatabaseService.insert('libraries_specializations', specsPayload, 'LibraryPersistence.persistInitialLibraries.specs');
        }

        // D. Backgrounds
        const bgCatDef = initialRules.definitions?.skillCategories?.find((c: any) => c.behavior === 'Arrière-plan');
        const bgCatId = bgCatDef?.id || 'Col_Comp_8';
        const layoutBgNames = initialRules.definitions?.skills?.[bgCatId] || [];
        const libBgNames = initialRules.libraries?.backgrounds?.map(b => b.name) || [];
        const targetBgNames = new Set([...layoutBgNames, ...libBgNames].map(n => n.trim().toLowerCase()).filter(n => n !== ""));

        if (targetBgNames.size > 0) {
            const globalBgs = await DatabaseService.fetchAll<{ id: string, name: string }>('libraries_backgrounds', {
                select: 'id, name',
                eq: { setting_id: null }
            }, 'LibraryPersistence.persistInitialLibraries.linkBgs');

            const globalBgMap = new Map((globalBgs || []).map(b => [b.name.trim().toLowerCase(), b.id]));
            const bgPayload: any[] = [];
            const bgLinksPayload: any[] = [];
            const processedNames = new Set<string>();

            if (initialRules.libraries?.backgrounds) {
                initialRules.libraries.backgrounds.forEach(b => {
                    const normalized = b.name.trim().toLowerCase();
                    if (processedNames.has(normalized)) return;
                    processedNames.add(normalized);
                    if (globalBgMap.has(normalized)) {
                        bgLinksPayload.push({ setting_id: settingId, background_id: globalBgMap.get(normalized), is_active: true });
                    } else {
                        bgPayload.push({ setting_id: settingId, id: b.id, name: b.name, description: b.description, is_variable: (b as any).isVariable });
                    }
                });
            }

            // Also check layout names to activate global bgs not explicitly in rules.libraries (for new settings)
            layoutBgNames.forEach(name => {
                const normalized = name.trim().toLowerCase();
                if (processedNames.has(normalized)) return;
                if (globalBgMap.has(normalized)) {
                    processedNames.add(normalized);
                    bgLinksPayload.push({ setting_id: settingId, background_id: globalBgMap.get(normalized), is_active: true });
                }
            });

            if (bgPayload.length > 0) await DatabaseService.insert('libraries_backgrounds', bgPayload, 'LibraryPersistence.persistInitialLibraries.bgs');
            if (bgLinksPayload.length > 0) await DatabaseService.insert('rel_setting_backgrounds', bgLinksPayload, 'LibraryPersistence.persistInitialLibraries.bgsLinks');
        }

        // E. Counters
        const counterCatDef = initialRules.definitions?.skillCategories?.find((c: any) => c.behavior === 'Compteur');
        const counterCatId = counterCatDef?.id || 'Col_Comp_9';
        const layoutCounterNamesFromSkills = initialRules.definitions?.skills?.[counterCatId] || [];
        const layoutCounterNamesFromDefs = Object.values(initialRules.definitions?.counters || {}).map((c: any) => c.name);
        const libCounterNames = initialRules.libraries?.counters?.map(c => c.name) || [];
        const targetCounterNames = new Set([...layoutCounterNamesFromSkills, ...layoutCounterNamesFromDefs, ...libCounterNames].map(n => n.trim().toLowerCase()));

        if (targetCounterNames.size > 0) {
            const globalCounters = await DatabaseService.fetchAll<{ id: string, name: string }>('libraries_counters', {
                select: 'id, name',
                eq: { setting_id: null }
            }, 'LibraryPersistence.persistInitialLibraries.linkCounters');

            const globalCounterMap = new Map((globalCounters || []).map(c => [c.name.trim().toLowerCase(), c.id]));
            const counterPayload: any[] = [];
            const counterLinksPayload: any[] = [];
            const processedNames = new Set<string>();

            if (initialRules.libraries?.counters) {
                initialRules.libraries.counters.forEach(c => {
                    const normalized = c.name.trim().toLowerCase();
                    if (processedNames.has(normalized)) return;
                    processedNames.add(normalized);
                    if (globalCounterMap.has(normalized)) {
                        counterLinksPayload.push({ setting_id: settingId, counter_id: globalCounterMap.get(normalized), is_active: true });
                    } else {
                        counterPayload.push({ setting_id: settingId, id: c.id, name: c.name, description: c.description, max_value: (c as any).maxValue, default_value: (c as any).defaultValue, xp_cost: (c as any).xpCost });
                    }
                });
            }

            // Also check layout names (Skills Col_Comp_9 or definitions.counters) to activate global counters
            targetCounterNames.forEach(name => {
                const normalized = name.trim().toLowerCase();
                if (processedNames.has(normalized)) return;
                if (globalCounterMap.has(normalized)) {
                    processedNames.add(normalized);
                    counterLinksPayload.push({ setting_id: settingId, counter_id: globalCounterMap.get(normalized), is_active: true });
                }
            });

            if (counterPayload.length > 0) await DatabaseService.insert('libraries_counters', counterPayload, 'LibraryPersistence.persistInitialLibraries.counters');
            if (counterLinksPayload.length > 0) await DatabaseService.insert('rel_setting_counters', counterLinksPayload, 'LibraryPersistence.persistInitialLibraries.countersLinks');
        }
    },

    /**
     * Delete and Re-insert libraries (Standard Sync Strategy)
     */
    async syncLibraries(settingId: string, rules: RulesData) {
        // A. Traits
        const localTraitsToSave = rules.libraries.traits.filter(t => !t.isGlobal);
        const globalTraitsToUpdate = rules.libraries.traits.filter(t => t.isGlobal);
        const activeGlobalTraitIds = rules.libraries.traits.filter(t => t.isGlobal && t.isActive !== false).map(t => t.id);

        await DatabaseService.deleteBy('libraries_traits', 'setting_id', settingId, 'LibraryPersistence.sync.deleteLocalTraits');

        if (localTraitsToSave.length > 0) {
            const traitsPayload = localTraitsToSave.map(t => ({
                setting_id: settingId,
                id: t.id,
                type: t.type,
                name: t.name,
                cost: t.cost,
                description: t.description,
                tags: t.tags,
                is_variable: (t as any).isVariable,
                effects: (t as any).effects
            }));
            await DatabaseService.insert('libraries_traits', traitsPayload, 'LibraryPersistence.sync.traits');
        }

        // UPDATE Global Traits
        for (const gt of globalTraitsToUpdate) {
            await DatabaseService.update('libraries_traits', gt.id, {
                type: gt.type,
                name: gt.name,
                cost: gt.cost,
                description: gt.description,
                tags: gt.tags,
                is_variable: (gt as any).isVariable,
                effects: (gt as any).effects
            }, 'LibraryPersistence.sync.updateGlobalTrait');
        }

        await DatabaseService.deleteBy('rel_setting_traits', 'setting_id', settingId, 'LibraryPersistence.sync.deleteTraitLinks');
        if (activeGlobalTraitIds.length > 0) {
            const relPayload = activeGlobalTraitIds.map(traitId => ({ setting_id: settingId, trait_id: traitId, is_active: true }));
            await DatabaseService.insert('rel_setting_traits', relPayload, 'LibraryPersistence.sync.traitLinks');
        }

        // VARIANTS - Traits
        await DatabaseService.deleteBy('libraries_traits_variants', 'setting_id', settingId, 'LibraryPersistence.sync.deleteTraitVariants');
        const traitVarPayload: any[] = [];
        rules.libraries.traits.forEach(t => {
            if (t.variants && t.variants.length > 0) {
                t.variants.forEach(v => {
                    traitVarPayload.push({ trait_id: t.id, setting_id: settingId, name: v });
                });
            }
        });
        if (traitVarPayload.length > 0) await DatabaseService.insert('libraries_traits_variants', traitVarPayload, 'LibraryPersistence.sync.traitVariants');

        // B. Skills
        const localSkillsToSave = rules.libraries.skills.filter(s => !s.isGlobal);
        const globalSkillsToUpdate = rules.libraries.skills.filter(s => s.isGlobal);
        const activeGlobalSkillIds = rules.libraries.skills.filter(s => s.isGlobal && s.isActive !== false).map(s => s.id);

        await DatabaseService.deleteBy('libraries_skills', 'setting_id', settingId, 'LibraryPersistence.sync.deleteLocalSkills');
        if (localSkillsToSave.length > 0) {
            const skillsPayload = localSkillsToSave.map(s => ({
                setting_id: settingId,
                id: s.id,
                name: s.name,
                description: s.description,
                default_category: s.defaultCategory,
                is_variable: s.isVariable
            }));
            await DatabaseService.insert('libraries_skills', skillsPayload, 'LibraryPersistence.sync.skills');
        }

        // UPDATE Global Skills (propagates to all campaigns using them)
        for (const gs of globalSkillsToUpdate) {
            await DatabaseService.update('libraries_skills', gs.id, {
                name: gs.name,
                description: gs.description,
                default_category: gs.defaultCategory,
                is_variable: gs.isVariable
            }, 'LibraryPersistence.sync.updateGlobalSkill');
        }

        await DatabaseService.deleteBy('rel_setting_skills', 'setting_id', settingId, 'LibraryPersistence.sync.deleteSkillLinks');
        if (activeGlobalSkillIds.length > 0) {
            const relPayload = activeGlobalSkillIds.map(skillId => ({ setting_id: settingId, skill_id: skillId, is_active: true }));
            await DatabaseService.insert('rel_setting_skills', relPayload, 'LibraryPersistence.sync.skillLinks');
        }

        // VARIANTS - Skills
        await DatabaseService.deleteBy('libraries_skills_variants', 'setting_id', settingId, 'LibraryPersistence.sync.deleteSkillVariants');
        const skillVarPayload: any[] = [];
        rules.libraries.skills.forEach(s => {
            if (s.variants && s.variants.length > 0) {
                s.variants.forEach(v => {
                    skillVarPayload.push({ skill_id: s.id, setting_id: settingId, name: v });
                });
            }
        });
        if (skillVarPayload.length > 0) await DatabaseService.insert('libraries_skills_variants', skillVarPayload, 'LibraryPersistence.sync.skillVariants');

        // C. Specializations
        const localSpecsToSave = rules.libraries.specializations.filter(s => !s.isGlobal);
        const globalSpecsToUpdate = rules.libraries.specializations.filter(s => s.isGlobal);
        const activeGlobalSpecIds = rules.libraries.specializations.filter(s => s.isGlobal && s.isActive !== false).map(s => s.id);

        await DatabaseService.deleteBy('libraries_specializations', 'setting_id', settingId, 'LibraryPersistence.sync.deleteLocalSpecs');
        if (localSpecsToSave.length > 0) {
            const specsPayload = localSpecsToSave.map(s => ({
                setting_id: settingId,
                id: s.id,
                name: s.name,
                description: s.description,
                skill_ids: (s as any).skillIds,
                default_min_level: (s as any).defaultMinLevel
            }));
            await DatabaseService.insert('libraries_specializations', specsPayload, 'LibraryPersistence.sync.specs');
        }

        // UPDATE Global Specs
        for (const gs of globalSpecsToUpdate) {
            await DatabaseService.update('libraries_specializations', gs.id, {
                name: gs.name,
                description: gs.description,
                skill_ids: (gs as any).skillIds,
                default_min_level: (gs as any).defaultMinLevel
            }, 'LibraryPersistence.sync.updateGlobalSpec');
        }

        await DatabaseService.deleteBy('rel_setting_specializations', 'setting_id', settingId, 'LibraryPersistence.sync.deleteSpecLinks');
        if (activeGlobalSpecIds.length > 0) {
            const relPayload = activeGlobalSpecIds.map(specId => ({ setting_id: settingId, specialization_id: specId, is_active: true }));
            await DatabaseService.insert('rel_setting_specializations', relPayload, 'LibraryPersistence.sync.specLinks');
        }

        // D. Backgrounds
        const localBgsToSave = rules.libraries.backgrounds.filter(b => !b.isGlobal);
        const globalBgsToUpdate = rules.libraries.backgrounds.filter(b => b.isGlobal);
        const activeGlobalBgIds = rules.libraries.backgrounds.filter(b => b.isGlobal && b.isActive !== false).map(b => b.id);

        await DatabaseService.deleteBy('libraries_backgrounds', 'setting_id', settingId, 'LibraryPersistence.sync.deleteLocalBgs');
        if (localBgsToSave.length > 0) {
            const bgPayload = localBgsToSave.map(b => ({ setting_id: settingId, id: b.id, name: b.name, description: b.description, is_variable: b.isVariable }));
            await DatabaseService.insert('libraries_backgrounds', bgPayload, 'LibraryPersistence.sync.bgs');
        }

        // UPDATE Global Backgrounds (propagates to all campaigns using them)
        for (const gb of globalBgsToUpdate) {
            await DatabaseService.update('libraries_backgrounds', gb.id, {
                name: gb.name,
                description: gb.description,
                is_variable: gb.isVariable
            }, 'LibraryPersistence.sync.updateGlobalBg');
        }

        await DatabaseService.deleteBy('rel_setting_backgrounds', 'setting_id', settingId, 'LibraryPersistence.sync.deleteBgLinks');
        if (activeGlobalBgIds.length > 0) {
            const relPayload = activeGlobalBgIds.map(bid => ({ setting_id: settingId, background_id: bid, is_active: true }));
            await DatabaseService.insert('rel_setting_backgrounds', relPayload, 'LibraryPersistence.sync.bgLinks');
        }

        // VARIANTS - Backgrounds
        await DatabaseService.deleteBy('libraries_backgrounds_variants', 'setting_id', settingId, 'LibraryPersistence.sync.deleteBgVariants');
        const bgVarPayload: any[] = [];
        rules.libraries.backgrounds.forEach(b => {
            if (b.variants && b.variants.length > 0) {
                b.variants.forEach(v => {
                    bgVarPayload.push({ background_id: b.id, setting_id: settingId, name: v });
                });
            }
        });
        if (bgVarPayload.length > 0) await DatabaseService.insert('libraries_backgrounds_variants', bgVarPayload, 'LibraryPersistence.sync.bgVariants');

        // E. Counters
        const localCountersToSave = rules.libraries.counters.filter(c => !c.isGlobal);
        const globalCountersToUpdate = rules.libraries.counters.filter(c => c.isGlobal);
        const activeGlobalCounterIds = rules.libraries.counters.filter(c => c.isGlobal && c.isActive !== false).map(c => c.id);

        await DatabaseService.deleteBy('libraries_counters', 'setting_id', settingId, 'LibraryPersistence.sync.deleteLocalCounters');
        if (localCountersToSave.length > 0) {
            const ctrPayload = localCountersToSave.map(c => ({
                setting_id: settingId,
                id: c.id,
                name: c.name,
                description: c.description || '',
                max_value: (c as any).maxValue ?? 10,
                default_value: (c as any).defaultValue ?? 0,
                xp_cost: (c as any).xpCost ?? 0
            }));
            await DatabaseService.insert('libraries_counters', ctrPayload, 'LibraryPersistence.sync.counters');
        }

        // UPDATE Global Counters (propagates to all campaigns using them)
        for (const gc of globalCountersToUpdate) {
            await DatabaseService.update('libraries_counters', gc.id, {
                name: gc.name,
                description: gc.description,
                max_value: (gc as any).maxValue,
                default_value: (gc as any).defaultValue,
                xp_cost: (gc as any).xpCost
            }, 'LibraryPersistence.sync.updateGlobalCounter');
        }

        await DatabaseService.deleteBy('rel_setting_counters', 'setting_id', settingId, 'LibraryPersistence.sync.deleteCounterLinks');
        if (activeGlobalCounterIds.length > 0) {
            const relPayload = activeGlobalCounterIds.map(cid => ({ setting_id: settingId, counter_id: cid, is_active: true }));
            await DatabaseService.insert('rel_setting_counters', relPayload, 'LibraryPersistence.sync.counterLinks');
        }
    }
};
