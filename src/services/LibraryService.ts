import { supabase } from './supabase';
import { RulesData } from '../types/rules';
import { LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../types/system';

const ensureUUID = (id: string | undefined): string => {
    if (!id) return crypto.randomUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) return id;
    console.warn(`[LibraryService] Legacy ID detected (${id}), replacing with UUID`);
    return crypto.randomUUID();
};

export const LibraryService = {
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
            await supabase.from('libraries_traits').insert(traitsPayload);
        }

        // B. Skills (Enhanced: Link Global vs Create Local)
        if (initialRules.libraries.skills && initialRules.libraries.skills.length > 0) {
            const { data: globalSkills } = await supabase
                .from('libraries_skills')
                .select('id, name')
                .is('setting_id', null);

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

            if (skillsPayload.length > 0) await supabase.from('libraries_skills').insert(skillsPayload);
            if (linksPayload.length > 0) await supabase.from('rel_setting_skills').insert(linksPayload);
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
            await supabase.from('libraries_specializations').insert(specsPayload);
        }

        // D. Backgrounds
        const bgCatDef = initialRules.definitions?.skillCategories?.find((c: any) => c.behavior === 'Arrière-plan');
        const bgCatId = bgCatDef?.id || 'Col_Comp_8';
        const layoutBgNames = initialRules.definitions?.skills?.[bgCatId] || [];
        const libBgNames = initialRules.libraries?.backgrounds?.map(b => b.name) || [];
        const targetBgNames = new Set([...layoutBgNames, ...libBgNames].map(n => n.trim().toLowerCase()).filter(n => n !== ""));

        if (targetBgNames.size > 0) {
            const { data: globalBgs } = await supabase.from('libraries_backgrounds').select('id, name').is('setting_id', null);
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

            if (bgPayload.length > 0) await supabase.from('libraries_backgrounds').insert(bgPayload);
            if (bgLinksPayload.length > 0) await supabase.from('rel_setting_backgrounds').insert(bgLinksPayload);
        }

        // E. Counters
        const counterCatDef = initialRules.definitions?.skillCategories?.find((c: any) => c.behavior === 'Compteur');
        const counterCatId = counterCatDef?.id || 'Col_Comp_9';
        const layoutCounterNamesFromSkills = initialRules.definitions?.skills?.[counterCatId] || [];
        const layoutCounterNamesFromDefs = Object.values(initialRules.definitions?.counters || {}).map((c: any) => c.name);
        const libCounterNames = initialRules.libraries?.counters?.map(c => c.name) || [];
        const targetCounterNames = new Set([...layoutCounterNamesFromSkills, ...layoutCounterNamesFromDefs, ...libCounterNames].map(n => n.trim().toLowerCase()));

        if (targetCounterNames.size > 0) {
            const { data: globalCounters } = await supabase.from('libraries_counters').select('id, name').is('setting_id', null);
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

            if (counterPayload.length > 0) await supabase.from('libraries_counters').insert(counterPayload);
            if (counterLinksPayload.length > 0) await supabase.from('rel_setting_counters').insert(counterLinksPayload);
        }
    },

    /**
     * Load libraries for a specific setting and map them to RulesData format
     */
    async loadLibraries(settingId: string): Promise<RulesData['libraries']> {
        const [
            traitsRes, skillsRes, specsRes,
            relTraitsRes, relSkillsRes, relSpecsRes,
            bgsRes, relBgsRes, countersRes, relCountersRes,
            traitVariantsRes, skillVariantsRes, bgVariantsRes
        ] = await Promise.all([
            supabase.from('libraries_traits').select('*').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('libraries_skills').select('*').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('libraries_specializations').select('*').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('rel_setting_traits').select('trait_id').eq('setting_id', settingId),
            supabase.from('rel_setting_skills').select('skill_id').eq('setting_id', settingId),
            supabase.from('rel_setting_specializations').select('specialization_id').eq('setting_id', settingId),
            supabase.from('libraries_backgrounds').select('*').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('rel_setting_backgrounds').select('background_id').eq('setting_id', settingId),
            supabase.from('libraries_counters').select('*').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('rel_setting_counters').select('counter_id').eq('setting_id', settingId),
            // Fetch Variants
            supabase.from('libraries_traits_variants').select('trait_id, name').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('libraries_skills_variants').select('skill_id, name').or(`setting_id.eq.${settingId},setting_id.is.null`),
            supabase.from('libraries_backgrounds_variants').select('background_id, name').or(`setting_id.eq.${settingId},setting_id.is.null`)
        ]);

        const traitVariantsRaw = traitVariantsRes.data || [];
        const skillVariantsRaw = skillVariantsRes.data || [];
        const bgVariantsRaw = bgVariantsRes.data || [];

        const traitVarMap = new Map<string, string[]>();
        traitVariantsRaw.forEach((v: any) => {
            const list = traitVarMap.get(v.trait_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                traitVarMap.set(v.trait_id, list);
            }
        });

        const skillVarMap = new Map<string, string[]>();
        skillVariantsRaw.forEach((v: any) => {
            const list = skillVarMap.get(v.skill_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                skillVarMap.set(v.skill_id, list);
            }
        });

        const bgVarMap = new Map<string, string[]>();
        bgVariantsRaw.forEach((v: any) => {
            const list = bgVarMap.get(v.background_id) || [];
            if (!list.includes(v.name)) {
                list.push(v.name);
                bgVarMap.set(v.background_id, list);
            }
        });

        const activeTraitIds = new Set((relTraitsRes.data || []).map((r: any) => r.trait_id));
        const activeSkillIds = new Set((relSkillsRes.data || []).map((r: any) => r.skill_id));
        const activeSpecIds = new Set((relSpecsRes.data || []).map((r: any) => r.specialization_id));
        const activeBgIds = new Set((relBgsRes.data || []).map((r: any) => r.background_id));
        const activeCounterIds = new Set((relCountersRes.data || []).map((r: any) => r.counter_id));

        const mapTrait = (t: any, activeIds: Set<string>, sid: string) => ({
            id: t.id,
            type: t.type,
            name: t.name,
            cost: t.cost,
            description: t.description,
            tags: t.tags || [],
            isVariable: t.is_variable,
            variants: traitVarMap.get(t.id) || [],
            effects: t.effects || [],
            isGlobal: t.setting_id === null,
            isActive: activeIds.has(t.id) || t.setting_id === sid
        });

        const legacySkillMap: Record<string, string> = {
            'talents': 'Col_Comp_1',
            'competences': 'Col_Comp_2',
            'competences_col_2': 'Col_Comp_3',
            'connaissances': 'Col_Comp_4',
            'autres_competences': 'Col_Comp_5',
            'competences2': 'Col_Comp_6',
            'autres': 'Col_Comp_7',
            'arrieres_plans': 'Col_Comp_8',
            'counters': 'Col_Comp_9'
        };

        const mapSkill = (s: any, activeIds: Set<string>, sid: string) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            defaultCategory: legacySkillMap[s.default_category] || s.default_category,
            isVariable: s.is_variable,
            variants: skillVarMap.get(s.id) || [],
            isGlobal: s.setting_id === null,
            isActive: activeIds.has(s.id) || s.setting_id === sid
        });

        const mapSpec = (s: any, activeIds: Set<string>, sid: string) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            skillIds: s.skill_ids || [],
            defaultMinLevel: s.default_min_level,
            isGlobal: s.setting_id === null,
            isActive: activeIds.has(s.id) || s.setting_id === sid
        });

        const mapBg = (b: any, activeIds: Set<string>, sid: string) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            isVariable: b.is_variable,
            variants: bgVarMap.get(b.id) || [],
            isGlobal: b.setting_id === null,
            isActive: activeIds.has(b.id) || b.setting_id === sid
        });

        const mapCounter = (c: any, activeIds: Set<string>, sid: string) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            maxValue: c.max_value,
            defaultValue: c.default_value,
            xpCost: c.xp_cost,
            isGlobal: c.setting_id === null,
            isActive: activeIds.has(c.id) || c.setting_id === sid
        });

        return {
            traits: (() => {
                const mappedGlobals = (traitsRes.data || []).filter(t => t.setting_id === null).map(t => mapTrait(t, activeTraitIds, settingId));
                const mappedLocals = (traitsRes.data || []).filter(t => t.setting_id === settingId).map(t => mapTrait(t, activeTraitIds, settingId));
                const traitMap = new Map();
                mappedGlobals.forEach(t => traitMap.set(t.name.trim().toLowerCase(), t));
                mappedLocals.forEach(t => traitMap.set(t.name.trim().toLowerCase(), t));
                return Array.from(traitMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            skills: (() => {
                const mappedGlobals = (skillsRes.data || []).filter(s => s.setting_id === null).map(s => mapSkill(s, activeSkillIds, settingId));
                const mappedLocals = (skillsRes.data || []).filter(s => s.setting_id === settingId).map(s => mapSkill(s, activeSkillIds, settingId));
                const skillMap = new Map();
                mappedGlobals.forEach(s => skillMap.set(s.name.trim().toLowerCase(), s));
                mappedLocals.forEach(s => skillMap.set(s.name.trim().toLowerCase(), s));
                return Array.from(skillMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            specializations: (() => {
                const mappedGlobals = (specsRes.data || []).filter(s => s.setting_id === null).map(s => mapSpec(s, activeSpecIds, settingId));
                const mappedLocals = (specsRes.data || []).filter(s => s.setting_id === settingId).map(s => mapSpec(s, activeSpecIds, settingId));
                const specMap = new Map();
                mappedGlobals.forEach(s => specMap.set(s.name.trim().toLowerCase(), s));
                mappedLocals.forEach(s => specMap.set(s.name.trim().toLowerCase(), s));
                return Array.from(specMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            backgrounds: (() => {
                const mappedGlobals = (bgsRes.data || []).filter(b => b.setting_id === null).map(b => mapBg(b, activeBgIds, settingId));
                const mappedLocals = (bgsRes.data || []).filter(b => b.setting_id === settingId).map(b => mapBg(b, activeBgIds, settingId));
                const bgMap = new Map();
                mappedGlobals.forEach(b => bgMap.set(b.name.trim().toLowerCase(), b));
                mappedLocals.forEach(b => bgMap.set(b.name.trim().toLowerCase(), b));
                return Array.from(bgMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })(),
            counters: (() => {
                const mappedGlobals = (countersRes.data || []).filter(c => c.setting_id === null).map(c => mapCounter(c, activeCounterIds, settingId));
                const mappedLocals = (countersRes.data || []).filter(c => c.setting_id === settingId).map(c => mapCounter(c, activeCounterIds, settingId));
                const cMap = new Map();
                mappedGlobals.forEach(c => cMap.set(c.name.trim().toLowerCase(), c));
                mappedLocals.forEach(c => cMap.set(c.name.trim().toLowerCase(), c));
                return Array.from(cMap.values()).sort((a, b) => (a as any).name.localeCompare((b as any).name));
            })()
        };
    },

    /**
     * Delete and Re-insert libraries (Standard Sync Strategy)
     */
    async syncLibraries(settingId: string, rules: RulesData) {
        // A. Traits
        const localTraitsToSave = rules.libraries.traits.filter(t => !t.isGlobal);
        const globalTraitsToUpdate = rules.libraries.traits.filter(t => t.isGlobal);
        const activeGlobalTraitIds = rules.libraries.traits.filter(t => t.isGlobal && t.isActive !== false).map(t => t.id);

        await supabase.from('libraries_traits').delete().eq('setting_id', settingId);
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
            await supabase.from('libraries_traits').insert(traitsPayload);
        }

        // UPDATE Global Traits
        for (const gt of globalTraitsToUpdate) {
            await supabase.from('libraries_traits')
                .update({
                    type: gt.type,
                    name: gt.name,
                    cost: gt.cost,
                    description: gt.description,
                    tags: gt.tags,
                    is_variable: (gt as any).isVariable,
                    effects: (gt as any).effects
                })
                .eq('id', gt.id)
                .is('setting_id', null);
        }

        await supabase.from('rel_setting_traits').delete().eq('setting_id', settingId);
        if (activeGlobalTraitIds.length > 0) {
            const relPayload = activeGlobalTraitIds.map(traitId => ({ setting_id: settingId, trait_id: traitId, is_active: true }));
            await supabase.from('rel_setting_traits').insert(relPayload);
        }

        // VARIANTS - Traits
        await supabase.from('libraries_traits_variants').delete().eq('setting_id', settingId);
        const traitVarPayload: any[] = [];
        rules.libraries.traits.forEach(t => {
            if (t.variants && t.variants.length > 0) {
                t.variants.forEach(v => {
                    traitVarPayload.push({ trait_id: t.id, setting_id: settingId, name: v });
                });
            }
        });
        if (traitVarPayload.length > 0) await supabase.from('libraries_traits_variants').insert(traitVarPayload);

        // B. Skills
        const localSkillsToSave = rules.libraries.skills.filter(s => !s.isGlobal);
        const globalSkillsToUpdate = rules.libraries.skills.filter(s => s.isGlobal);
        const activeGlobalSkillIds = rules.libraries.skills.filter(s => s.isGlobal && s.isActive !== false).map(s => s.id);

        await supabase.from('libraries_skills').delete().eq('setting_id', settingId);
        if (localSkillsToSave.length > 0) {
            const skillsPayload = localSkillsToSave.map(s => ({
                setting_id: settingId,
                id: s.id,
                name: s.name,
                description: s.description,
                default_category: s.defaultCategory,
                is_variable: s.isVariable
            }));
            await supabase.from('libraries_skills').insert(skillsPayload);
        }

        // UPDATE Global Skills (propagates to all campaigns using them)
        for (const gs of globalSkillsToUpdate) {
            await supabase.from('libraries_skills')
                .update({
                    name: gs.name,
                    description: gs.description,
                    default_category: gs.defaultCategory,
                    is_variable: gs.isVariable
                })
                .eq('id', gs.id)
                .is('setting_id', null);
        }

        await supabase.from('rel_setting_skills').delete().eq('setting_id', settingId);
        if (activeGlobalSkillIds.length > 0) {
            const relPayload = activeGlobalSkillIds.map(skillId => ({ setting_id: settingId, skill_id: skillId, is_active: true }));
            await supabase.from('rel_setting_skills').insert(relPayload);
        }

        // VARIANTS - Skills
        await supabase.from('libraries_skills_variants').delete().eq('setting_id', settingId);
        const skillVarPayload: any[] = [];
        rules.libraries.skills.forEach(s => {
            if (s.variants && s.variants.length > 0) {
                s.variants.forEach(v => {
                    skillVarPayload.push({ skill_id: s.id, setting_id: settingId, name: v });
                });
            }
        });
        if (skillVarPayload.length > 0) await supabase.from('libraries_skills_variants').insert(skillVarPayload);

        // C. Specializations
        const localSpecsToSave = rules.libraries.specializations.filter(s => !s.isGlobal);
        const globalSpecsToUpdate = rules.libraries.specializations.filter(s => s.isGlobal);
        const activeGlobalSpecIds = rules.libraries.specializations.filter(s => s.isGlobal && s.isActive !== false).map(s => s.id);

        await supabase.from('libraries_specializations').delete().eq('setting_id', settingId);
        if (localSpecsToSave.length > 0) {
            const specsPayload = localSpecsToSave.map(s => ({
                setting_id: settingId,
                id: s.id,
                name: s.name,
                description: s.description,
                skill_ids: (s as any).skillIds,
                default_min_level: (s as any).defaultMinLevel
            }));
            await supabase.from('libraries_specializations').insert(specsPayload);
        }

        // UPDATE Global Specs
        for (const gs of globalSpecsToUpdate) {
            await supabase.from('libraries_specializations')
                .update({
                    name: gs.name,
                    description: gs.description,
                    skill_ids: (gs as any).skillIds,
                    default_min_level: (gs as any).defaultMinLevel
                })
                .eq('id', gs.id)
                .is('setting_id', null);
        }

        await supabase.from('rel_setting_specializations').delete().eq('setting_id', settingId);
        if (activeGlobalSpecIds.length > 0) {
            const relPayload = activeGlobalSpecIds.map(specId => ({ setting_id: settingId, specialization_id: specId, is_active: true }));
            await supabase.from('rel_setting_specializations').insert(relPayload);
        }

        // D. Backgrounds
        const localBgsToSave = rules.libraries.backgrounds.filter(b => !b.isGlobal);
        const globalBgsToUpdate = rules.libraries.backgrounds.filter(b => b.isGlobal);
        const activeGlobalBgIds = rules.libraries.backgrounds.filter(b => b.isGlobal && b.isActive !== false).map(b => b.id);

        await supabase.from('libraries_backgrounds').delete().eq('setting_id', settingId);
        if (localBgsToSave.length > 0) {
            const bgPayload = localBgsToSave.map(b => ({ setting_id: settingId, id: b.id, name: b.name, description: b.description, is_variable: b.isVariable }));
            await supabase.from('libraries_backgrounds').insert(bgPayload);
        }

        // UPDATE Global Backgrounds (propagates to all campaigns using them)
        for (const gb of globalBgsToUpdate) {
            await supabase.from('libraries_backgrounds')
                .update({
                    name: gb.name,
                    description: gb.description,
                    is_variable: gb.isVariable
                })
                .eq('id', gb.id)
                .is('setting_id', null);
        }

        await supabase.from('rel_setting_backgrounds').delete().eq('setting_id', settingId);
        if (activeGlobalBgIds.length > 0) {
            const relPayload = activeGlobalBgIds.map(bid => ({ setting_id: settingId, background_id: bid, is_active: true }));
            await supabase.from('rel_setting_backgrounds').insert(relPayload);
        }

        // VARIANTS - Backgrounds
        await supabase.from('libraries_backgrounds_variants').delete().eq('setting_id', settingId);
        const bgVarPayload: any[] = [];
        rules.libraries.backgrounds.forEach(b => {
            if (b.variants && b.variants.length > 0) {
                b.variants.forEach(v => {
                    bgVarPayload.push({ background_id: b.id, setting_id: settingId, name: v });
                });
            }
        });
        if (bgVarPayload.length > 0) await supabase.from('libraries_backgrounds_variants').insert(bgVarPayload);

        // E. Counters
        const localCountersToSave = rules.libraries.counters.filter(c => !c.isGlobal);
        const globalCountersToUpdate = rules.libraries.counters.filter(c => c.isGlobal);
        const activeGlobalCounterIds = rules.libraries.counters.filter(c => c.isGlobal && c.isActive !== false).map(c => c.id);

        await supabase.from('libraries_counters').delete().eq('setting_id', settingId);
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
            await supabase.from('libraries_counters').insert(ctrPayload);
        }

        // UPDATE Global Counters (propagates to all campaigns using them)
        for (const gc of globalCountersToUpdate) {
            await supabase.from('libraries_counters')
                .update({
                    name: gc.name,
                    description: gc.description,
                    max_value: (gc as any).maxValue,
                    default_value: (gc as any).defaultValue,
                    xp_cost: (gc as any).xpCost
                })
                .eq('id', gc.id)
                .is('setting_id', null);
        }

        await supabase.from('rel_setting_counters').delete().eq('setting_id', settingId);
        if (activeGlobalCounterIds.length > 0) {
            const relPayload = activeGlobalCounterIds.map(cid => ({ setting_id: settingId, counter_id: cid, is_active: true }));
            await supabase.from('rel_setting_counters').insert(relPayload);
        }
    },

    /**
     * Partial Imports: Add items to libraries without overwriting existing ones.
     */
    async importTraits(targetId: string | null, traits: LibraryEntry[], linkToSettingId?: string): Promise<boolean> {
        if (traits.length === 0) return true;
        const payload = traits.map(t => ({
            setting_id: targetId,
            id: ensureUUID(t.id),
            type: t.type,
            name: t.name,
            cost: t.cost,
            description: t.description || '',
            tags: t.tags || [],
            is_variable: t.isVariable || false,
            effects: t.effects || []
        }));

        const { error } = await supabase.from('libraries_traits').insert(payload);
        if (error) {
            console.error("Error importing traits:", error);
            return false;
        }

        // Auto-link if global import but triggered from a campaign
        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, trait_id: p.id, is_active: true }));
            await supabase.from('rel_setting_traits').insert(relPayload);
        }

        return true;
    },

    async importSkills(targetId: string | null, skills: LibrarySkillEntry[], linkToSettingId?: string): Promise<boolean> {
        if (skills.length === 0) return true;

        const payload = skills.map(s => ({
            setting_id: targetId,
            id: ensureUUID(s.id),
            name: s.name,
            description: s.description,
            default_category: s.defaultCategory,
            is_variable: s.isVariable
        }));

        const { error } = await supabase.from('libraries_skills').insert(payload);
        if (error) {
            console.error("Error importing skills:", error);
            return false;
        }

        // Auto-link if global
        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, skill_id: p.id, is_active: true }));
            await supabase.from('rel_setting_skills').insert(relPayload);
        }

        return true;
    },

    async importSpecializations(targetId: string | null, specs: LibrarySpecializationEntry[], linkToSettingId?: string): Promise<boolean> {
        if (specs.length === 0) return true;
        const payload = specs.map(s => ({
            setting_id: targetId,
            id: ensureUUID(s.id),
            name: s.name,
            description: s.description,
            skill_ids: s.skillIds || [],
            default_min_level: s.defaultMinLevel || 1
        }));

        const { error } = await supabase.from('libraries_specializations').insert(payload);
        if (error) {
            console.error("Error importing specializations:", error);
            return false;
        }

        // Auto-link if global
        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, specialization_id: p.id, is_active: true }));
            await supabase.from('rel_setting_specializations').insert(relPayload);
        }

        return true;
    },

    async importBackgrounds(targetId: string | null, backgrounds: LibraryBackgroundEntry[], linkToSettingId?: string): Promise<boolean> {
        if (backgrounds.length === 0) return true;
        const payload = backgrounds.map(b => ({
            setting_id: targetId,
            id: ensureUUID(b.id),
            name: b.name,
            description: b.description,
            is_variable: b.isVariable || false
        }));

        const { error } = await supabase.from('libraries_backgrounds').insert(payload);
        if (error) {
            console.error("Error importing backgrounds:", error);
            return false;
        }

        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, background_id: p.id, is_active: true }));
            await supabase.from('rel_setting_backgrounds').insert(relPayload);
        }

        return true;
    },

    async importCounters(targetId: string | null, counters: LibraryCounterEntry[], linkToSettingId?: string): Promise<boolean> {
        if (counters.length === 0) return true;
        const payload = counters.map(c => ({
            setting_id: targetId,
            id: ensureUUID(c.id),
            name: c.name,
            description: c.description,
            max_value: c.maxValue || 10,
            default_value: c.defaultValue || 0,
            xp_cost: c.xpCost || 0
        }));

        const { error } = await supabase.from('libraries_counters').insert(payload);
        if (error) {
            console.error("Error importing counters:", error);
            return false;
        }

        if (targetId === null && linkToSettingId) {
            const relPayload = payload.map(p => ({ setting_id: linkToSettingId, counter_id: p.id, is_active: true }));
            await supabase.from('rel_setting_counters').insert(relPayload);
        }

        return true;
    }
};
